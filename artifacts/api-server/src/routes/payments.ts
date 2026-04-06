import { Router, type IRouter } from "express";
import Stripe from "stripe";
import { db, bookingsTable, paymentsTable, cancellationsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(key, { apiVersion: "2025-03-31.basil" });
}

// ── Cancellation policy ──────────────────────────────────────────────────────
// >48 hours before service → 100% refund
// 24–48 hours before service → 50% refund
// <24 hours before service → 0% refund (can be overridden by admin)

function calcRefundPct(hoursBeforeService: number | null): number {
  if (hoursBeforeService === null) return 100; // no service time set
  if (hoursBeforeService > 48) return 100;
  if (hoursBeforeService > 24) return 50;
  return 0;
}

const PLATFORM_FEE_PCT = 15; // 15% platform commission

// ── POST /api/payments/create-intent ────────────────────────────────────────
// Create a PaymentIntent for a booking
router.post("/payments/create-intent", async (req, res): Promise<void> => {
  const { bookingId, amountCents, currency = "usd" } = req.body;

  if (!bookingId || !amountCents) {
    res.status(400).json({ error: "bookingId and amountCents are required" });
    return;
  }

  const [booking] = await db
    .select()
    .from(bookingsTable)
    .where(eq(bookingsTable.id, bookingId));

  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  // Check for existing payment
  const [existing] = await db
    .select()
    .from(paymentsTable)
    .where(and(eq(paymentsTable.bookingId, bookingId), eq(paymentsTable.status, "succeeded")));

  if (existing) {
    res.status(409).json({ error: "Booking already paid" });
    return;
  }

  const stripe = getStripe();
  const platformFeeCents = Math.round(amountCents * (PLATFORM_FEE_PCT / 100));
  const providerPayoutCents = amountCents - platformFeeCents;

  const intent = await stripe.paymentIntents.create({
    amount: amountCents,
    currency,
    metadata: {
      bookingId: String(bookingId),
      platformFeeCents: String(platformFeeCents),
      providerPayoutCents: String(providerPayoutCents),
    },
    description: `Care Bridge booking #${bookingId}`,
  });

  // Upsert payment record
  const [payment] = await db
    .insert(paymentsTable)
    .values({
      bookingId,
      seekerClerkId: booking.seekerClerkId ?? null,
      amountCents,
      platformFeeCents,
      providerPayoutCents,
      currency,
      status: "pending",
      stripePaymentIntentId: intent.id,
    })
    .onConflictDoUpdate({
      target: [paymentsTable.bookingId],
      set: {
        stripePaymentIntentId: intent.id,
        amountCents,
        status: "pending",
      },
    })
    .returning();

  res.json({
    clientSecret: intent.client_secret,
    paymentId: payment.id,
    amountCents,
    platformFeeCents,
    providerPayoutCents,
    currency,
    breakdown: {
      subtotal: amountCents,
      platformFee: platformFeeCents,
      providerPayout: providerPayoutCents,
    },
  });
});

// ── POST /api/payments/:id/confirm ──────────────────────────────────────────
// Called from frontend after Stripe confirms the payment
router.post("/payments/:id/confirm", async (req, res): Promise<void> => {
  const paymentId = parseInt(req.params.id, 10);
  const { stripePaymentIntentId } = req.body;

  if (!stripePaymentIntentId) {
    res.status(400).json({ error: "stripePaymentIntentId is required" });
    return;
  }

  const stripe = getStripe();
  const intent = await stripe.paymentIntents.retrieve(stripePaymentIntentId);

  if (intent.status !== "succeeded") {
    res.status(400).json({ error: `Payment not succeeded (status: ${intent.status})` });
    return;
  }

  const [payment] = await db
    .update(paymentsTable)
    .set({ status: "succeeded", paidAt: new Date() })
    .where(eq(paymentsTable.id, paymentId))
    .returning();

  if (payment) {
    await db
      .update(bookingsTable)
      .set({ status: "confirmed" })
      .where(eq(bookingsTable.id, payment.bookingId));
  }

  res.json({ success: true, payment });
});

// ── GET /api/payments/booking/:bookingId ────────────────────────────────────
router.get("/payments/booking/:bookingId", async (req, res): Promise<void> => {
  const bookingId = parseInt(req.params.bookingId, 10);

  const [payment] = await db
    .select()
    .from(paymentsTable)
    .where(eq(paymentsTable.bookingId, bookingId))
    .orderBy(desc(paymentsTable.createdAt))
    .limit(1);

  if (!payment) {
    res.status(404).json({ error: "No payment found for this booking" });
    return;
  }

  res.json(payment);
});

// ── GET /api/payments/history ────────────────────────────────────────────────
router.get("/payments/history", async (req, res): Promise<void> => {
  const { clerkId } = req.query;
  let payments = await db
    .select()
    .from(paymentsTable)
    .orderBy(desc(paymentsTable.createdAt));

  if (clerkId) {
    payments = payments.filter((p) => p.seekerClerkId === clerkId);
  }

  res.json(payments);
});

// ── POST /api/cancellations ──────────────────────────────────────────────────
router.post("/cancellations", async (req, res): Promise<void> => {
  const { bookingId, initiatedBy, initiatorId, reason, hoursBeforeService } = req.body;

  if (!bookingId || !initiatedBy || !reason) {
    res.status(400).json({ error: "bookingId, initiatedBy, and reason are required" });
    return;
  }

  const [booking] = await db
    .select()
    .from(bookingsTable)
    .where(eq(bookingsTable.id, bookingId));

  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  if (booking.status === "cancelled") {
    res.status(409).json({ error: "Booking already cancelled" });
    return;
  }

  // Check for existing cancellation
  const [existingCan] = await db
    .select()
    .from(cancellationsTable)
    .where(eq(cancellationsTable.bookingId, bookingId));

  if (existingCan) {
    res.status(409).json({ error: "Cancellation already exists for this booking" });
    return;
  }

  const refundPct = calcRefundPct(hoursBeforeService ?? null);

  // Find payment if exists
  const [payment] = await db
    .select()
    .from(paymentsTable)
    .where(and(eq(paymentsTable.bookingId, bookingId), eq(paymentsTable.status, "succeeded")));

  let refundAmountCents = 0;
  let refundStatus = "none";
  let stripeRefundId: string | null = null;

  if (payment && refundPct > 0) {
    refundAmountCents = Math.round(payment.amountCents * (refundPct / 100));

    try {
      const stripe = getStripe();
      const refund = await stripe.refunds.create({
        payment_intent: payment.stripePaymentIntentId!,
        amount: refundAmountCents,
        metadata: { bookingId: String(bookingId), refundPct: String(refundPct) },
      });

      stripeRefundId = refund.id;
      refundStatus = refund.status === "succeeded" ? "completed" : "pending";

      await db
        .update(paymentsTable)
        .set({
          refundAmountCents,
          refundStatus,
          stripeRefundId: refund.id,
        })
        .where(eq(paymentsTable.id, payment.id));
    } catch (err: any) {
      logger.error({ err }, "Stripe refund failed");
      refundStatus = "failed";
    }
  }

  const [cancellation] = await db
    .insert(cancellationsTable)
    .values({
      bookingId,
      initiatedBy,
      initiatorId: initiatorId ?? null,
      reason,
      hoursBeforeService: hoursBeforeService ?? null,
      refundAmountCents,
      refundPercentage: refundPct,
      refundStatus,
      stripeRefundId,
    })
    .returning();

  await db
    .update(bookingsTable)
    .set({ status: "cancelled" })
    .where(eq(bookingsTable.id, bookingId));

  res.status(201).json({
    cancellation,
    refundAmountCents,
    refundPercentage: refundPct,
    refundStatus,
    message:
      refundPct === 100
        ? "Full refund issued"
        : refundPct > 0
        ? `Partial refund (${refundPct}%) issued`
        : "No refund – cancellation within 24 hours of service",
  });
});

// ── POST /api/cancellations/:id/admin-override ──────────────────────────────
router.post("/cancellations/:id/admin-override", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const { adminNote, overrideRefundPct } = req.body;

  if (overrideRefundPct === undefined || !adminNote) {
    res.status(400).json({ error: "overrideRefundPct and adminNote are required" });
    return;
  }

  const [cancellation] = await db
    .select()
    .from(cancellationsTable)
    .where(eq(cancellationsTable.id, id));

  if (!cancellation) {
    res.status(404).json({ error: "Cancellation not found" });
    return;
  }

  const [payment] = await db
    .select()
    .from(paymentsTable)
    .where(and(
      eq(paymentsTable.bookingId, cancellation.bookingId),
      eq(paymentsTable.status, "succeeded")
    ));

  let newRefundAmountCents = cancellation.refundAmountCents;
  let stripeRefundId = cancellation.stripeRefundId;
  let refundStatus = cancellation.refundStatus;

  if (payment && overrideRefundPct > 0) {
    const targetTotal = Math.round(payment.amountCents * (overrideRefundPct / 100));
    const alreadyRefunded = cancellation.refundAmountCents;
    const additional = targetTotal - alreadyRefunded;

    if (additional > 0) {
      try {
        const stripe = getStripe();
        const refund = await stripe.refunds.create({
          payment_intent: payment.stripePaymentIntentId!,
          amount: additional,
          metadata: { adminOverride: "true", adminNote, bookingId: String(cancellation.bookingId) },
        });
        stripeRefundId = refund.id;
        refundStatus = "completed";
        newRefundAmountCents = targetTotal;

        await db
          .update(paymentsTable)
          .set({ refundAmountCents: newRefundAmountCents, refundStatus, stripeRefundId: refund.id })
          .where(eq(paymentsTable.id, payment.id));
      } catch (err: any) {
        logger.error({ err }, "Admin override refund failed");
        res.status(500).json({ error: "Stripe refund failed: " + err.message });
        return;
      }
    }
  }

  const [updated] = await db
    .update(cancellationsTable)
    .set({
      refundAmountCents: newRefundAmountCents,
      refundPercentage: overrideRefundPct,
      refundStatus,
      stripeRefundId,
      adminNote,
    })
    .where(eq(cancellationsTable.id, id))
    .returning();

  res.json(updated);
});

// ── GET /api/cancellations/booking/:bookingId ───────────────────────────────
router.get("/cancellations/booking/:bookingId", async (req, res): Promise<void> => {
  const bookingId = parseInt(req.params.bookingId, 10);

  const [cancellation] = await db
    .select()
    .from(cancellationsTable)
    .where(eq(cancellationsTable.bookingId, bookingId));

  if (!cancellation) {
    res.status(404).json({ error: "No cancellation found" });
    return;
  }

  res.json(cancellation);
});

// ── GET /api/cancellations/history ──────────────────────────────────────────
router.get("/cancellations/history", async (req, res): Promise<void> => {
  const { initiatorId } = req.query;
  let records = await db
    .select()
    .from(cancellationsTable)
    .orderBy(desc(cancellationsTable.cancelledAt));

  if (initiatorId) {
    records = records.filter((c) => c.initiatorId === initiatorId);
  }

  res.json(records);
});

export default router;
