import { pgTable, text, serial, integer, real, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const caregiversTable = pgTable("caregivers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  bio: text("bio").notNull(),
  avatarUrl: text("avatar_url"),
  location: text("location").notNull(),
  categoryIds: integer("category_ids").array().notNull().default([]),
  hourlyRate: real("hourly_rate").notNull(),
  rating: real("rating").notNull().default(0),
  reviewCount: integer("review_count").notNull().default(0),
  yearsExperience: integer("years_experience").notNull().default(0),
  isVerified: boolean("is_verified").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCaregiverSchema = createInsertSchema(caregiversTable).omit({ id: true, createdAt: true });
export type InsertCaregiver = z.infer<typeof insertCaregiverSchema>;
export type Caregiver = typeof caregiversTable.$inferSelect;
