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
  certifications: text("certifications"),
  languages: text("languages"),
  services: text("services"),
  // Provider Registration Fields
  phone: text("phone"),
  pastWorkReferences: text("past_work_references"),
  backgroundCheckConsent: boolean("background_check_consent").notNull().default(false),
  policeVerification: boolean("police_verification").notNull().default(false),
  medicalFitnessDeclaration: boolean("medical_fitness_declaration").notNull().default(false),
  medicalNursingLicense: text("medical_nursing_license"),
  foodSafetyCertificate: boolean("food_safety_certificate").notNull().default(false),
  insuranceLicense: text("insurance_license"),
  serviceRadius: text("service_radius"),
  onSiteRemote: text("on_site_remote"),
  availabilitySchedule: text("availability_schedule"),
  pricingUnit: text("pricing_unit").notNull().default("hourly"),
  termsAccepted: boolean("terms_accepted").notNull().default(false),
  codeOfConductAccepted: boolean("code_of_conduct_accepted").notNull().default(false),
  liabilityWaiverAccepted: boolean("liability_waiver_accepted").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCaregiverSchema = createInsertSchema(caregiversTable).omit({ id: true, createdAt: true });
export type InsertCaregiver = z.infer<typeof insertCaregiverSchema>;
export type Caregiver = typeof caregiversTable.$inferSelect;
