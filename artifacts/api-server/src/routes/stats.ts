import { Router, type IRouter } from "express";
import { db, caregiversTable, careRequestsTable, bookingsTable, categoriesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { sql } from "drizzle-orm";
import {
  GetStatsOverviewResponse,
  GetFeaturedCaregiversResponse,
  GetRecentCareRequestsResponse,
} from "@workspace/api-zod";
import { inArray } from "drizzle-orm";

const router: IRouter = Router();

router.get("/stats/overview", async (req, res): Promise<void> => {
  const [caregivers, requests, bookings, categories] = await Promise.all([
    db.select().from(caregiversTable),
    db.select().from(careRequestsTable),
    db.select().from(bookingsTable),
    db.select().from(categoriesTable),
  ]);

  const openRequests = requests.filter((r) => r.status === "open").length;

  const categoryCounts = categories.map((cat) => ({
    categoryName: cat.name,
    count: caregivers.filter((c) => c.categoryIds.includes(cat.id)).length,
  }));

  res.json(GetStatsOverviewResponse.parse({
    totalCaregivers: caregivers.length,
    totalCareRequests: requests.length,
    totalBookings: bookings.length,
    openRequests,
    categoryCounts,
  }));
});

router.get("/stats/featured-caregivers", async (req, res): Promise<void> => {
  const caregivers = await db
    .select()
    .from(caregiversTable)
    .orderBy(desc(caregiversTable.rating))
    .limit(6);

  const allCategoryIds = [...new Set(caregivers.flatMap((c) => c.categoryIds))];
  const cats = allCategoryIds.length > 0
    ? await db.select().from(categoriesTable).where(inArray(categoriesTable.id, allCategoryIds))
    : [];
  const catMap = new Map(cats.map((c) => [c.id, c]));

  const withCats = caregivers.map((c) => ({
    ...c,
    categories: c.categoryIds.map((id) => catMap.get(id)).filter(Boolean),
  }));

  res.json(GetFeaturedCaregiversResponse.parse(withCats));
});

router.get("/stats/recent-requests", async (req, res): Promise<void> => {
  const requests = await db
    .select()
    .from(careRequestsTable)
    .orderBy(desc(careRequestsTable.createdAt))
    .limit(5);

  const categories = await db.select().from(categoriesTable);
  const catMap = new Map(categories.map((c) => [c.id, c]));

  const withCats = requests.map((r) => ({
    ...r,
    category: catMap.get(r.categoryId),
  }));

  res.json(GetRecentCareRequestsResponse.parse(withCats));
});

export default router;
