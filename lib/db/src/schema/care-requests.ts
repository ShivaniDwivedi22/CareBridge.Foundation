import { pgTable, text, serial, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const careRequestsTable = pgTable("care_requests", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  categoryId: integer("category_id").notNull(),
  location: text("location").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date"),
  budget: real("budget").notNull(),
  status: text("status").notNull().default("open"),
  seekerName: text("seeker_name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCareRequestSchema = createInsertSchema(careRequestsTable).omit({ id: true, createdAt: true });
export type InsertCareRequest = z.infer<typeof insertCareRequestSchema>;
export type CareRequest = typeof careRequestsTable.$inferSelect;
