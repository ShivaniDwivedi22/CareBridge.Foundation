import { db, categoriesTable } from "@workspace/db";
import { count } from "drizzle-orm";
import { logger } from "./lib/logger";

const CATEGORIES = [
  { name: "Pet Care",              slug: "pet-care",             icon: "PawPrint",  description: "Professional care for your beloved pets including dog walking, pet sitting, and grooming." },
  { name: "Newborn Care",          slug: "newborn-care",         icon: "Baby",      description: "Expert care for newborns and infants to give parents peace of mind." },
  { name: "Postpartum Care",       slug: "postpartum-care",      icon: "Heart",     description: "Compassionate support for mothers during the postpartum recovery period." },
  { name: "Elderly Care",          slug: "elderly-care",         icon: "UserCheck", description: "Respectful and attentive care for senior family members in their own home." },
  { name: "Special Needs Care",    slug: "special-needs-care",   icon: "HandHeart", description: "Specialized care and support for individuals with disabilities and special needs." },
  { name: "Child Care",            slug: "child-care",           icon: "Users",     description: "Safe, nurturing childcare for toddlers and school-age children." },
  { name: "House Help",            slug: "house-help",           icon: "🏠",        description: "Domestic and household assistance services." },
  { name: "Kitchen & Food Help",   slug: "kitchen-food-help",    icon: "🍽️",       description: "Cooking, meal prep, and food safety services." },
  { name: "Event Support",         slug: "event-support",        icon: "🎉",        description: "Professional support for events and gatherings." },
  { name: "Travel & Medical Care", slug: "travel-medical-care",  icon: "✈️",        description: "Care during travel and medical assistance services." },
];

export async function seedIfEmpty(): Promise<void> {
  const [{ value: existing }] = await db.select({ value: count() }).from(categoriesTable);
  if (existing > 0) return;

  logger.info("Seeding categories table...");
  await db.insert(categoriesTable).values(
    CATEGORIES.map((c) => ({ ...c, caregiverCount: 0 }))
  );
  logger.info({ count: CATEGORIES.length }, "Categories seeded");
}
