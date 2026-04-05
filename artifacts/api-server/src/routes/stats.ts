import { Router, type IRouter } from "express";
import { db, caregiversTable, careRequestsTable, bookingsTable, categoriesTable, reviewsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { sql } from "drizzle-orm";
import {
  GetStatsOverviewResponse,
  GetFeaturedCaregiversResponse,
  GetRecentCareRequestsResponse,
  GetProviderEarningsQueryParams,
  GetProviderEarningsResponse,
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

router.get("/stats/provider-earnings", async (req, res): Promise<void> => {
  const parsed = GetProviderEarningsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { caregiverId } = parsed.data;

  const [caregiver] = await db
    .select()
    .from(caregiversTable)
    .where(eq(caregiversTable.id, caregiverId));

  if (!caregiver) {
    res.status(404).json({ error: "Caregiver not found" });
    return;
  }

  const bookings = await db
    .select()
    .from(bookingsTable)
    .where(eq(bookingsTable.caregiverId, caregiverId));

  const completedBookings = bookings.filter((b) => b.status === "completed").length;
  const pendingBookings = bookings.filter((b) => b.status === "pending").length;
  const confirmedBookings = bookings.filter((b) => b.status === "confirmed").length;
  const totalEarnings = completedBookings * caregiver.hourlyRate * 8;

  const reviews = await db
    .select()
    .from(reviewsTable)
    .where(eq(reviewsTable.caregiverId, caregiverId));
  const approvedReviews = reviews.filter((r) => r.status === "approved");
  const averageRating =
    approvedReviews.length > 0
      ? approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedReviews.length
      : caregiver.rating;

  res.json(
    GetProviderEarningsResponse.parse({
      totalEarnings,
      completedBookings,
      pendingBookings,
      confirmedBookings,
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: reviews.length,
    })
  );
});

export default router;
