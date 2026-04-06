import { pgTable, text, serial, integer, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const paymentsTable = pgTable("payments", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").notNull().unique(),
  seekerClerkId: text("seeker_clerk_id"),
  amountCents: integer("amount_cents").notNull(),
  platformFeeCents: integer("platform_fee_cents").notNull().default(0),
  providerPayoutCents: integer("provider_payout_cents").notNull().default(0),
  currency: text("currency").notNull().default("usd"),
  status: text("status").notNull().default("pending"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeRefundId: text("stripe_refund_id"),
  refundAmountCents: integer("refund_amount_cents").default(0),
  refundStatus: text("refund_status"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPaymentSchema = createInsertSchema(paymentsTable).omit({
  id: true, createdAt: true,
});
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof paymentsTable.$inferSelect;
