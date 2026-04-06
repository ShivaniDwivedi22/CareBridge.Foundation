import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const cancellationsTable = pgTable("cancellations", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").notNull(),
  initiatedBy: text("initiated_by").notNull(),
  initiatorId: text("initiator_id"),
  reason: text("reason").notNull(),
  hoursBeforeService: integer("hours_before_service"),
  refundAmountCents: integer("refund_amount_cents").notNull().default(0),
  refundPercentage: integer("refund_percentage").notNull().default(0),
  refundStatus: text("refund_status").notNull().default("none"),
  stripeRefundId: text("stripe_refund_id"),
  adminNote: text("admin_note"),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCancellationSchema = createInsertSchema(cancellationsTable).omit({
  id: true, cancelledAt: true,
});
export type InsertCancellation = z.infer<typeof insertCancellationSchema>;
export type Cancellation = typeof cancellationsTable.$inferSelect;
