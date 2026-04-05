import { Router, type IRouter } from "express";
import { db, reviewsTable, caregiversTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import {
  ListReviewsQueryParams,
  ListReviewsResponse,
  CreateReviewBody,
  UpdateReviewStatusParams,
  UpdateReviewStatusBody,
  UpdateReviewStatusResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/reviews", async (req, res): Promise<void> => {
  const parsed = ListReviewsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { caregiverId, status } = parsed.data;

  let reviews = await db.select().from(reviewsTable);

  if (caregiverId !== undefined) {
    reviews = reviews.filter((r) => r.caregiverId === caregiverId);
  }
  if (status) {
    reviews = reviews.filter((r) => r.status === status);
  }

  res.json(ListReviewsResponse.parse(reviews));
});

router.post("/reviews", async (req, res): Promise<void> => {
  const parsed = CreateReviewBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [review] = await db.insert(reviewsTable).values(parsed.data).returning();

  const allReviews = await db
    .select()
    .from(reviewsTable)
    .where(eq(reviewsTable.caregiverId, parsed.data.caregiverId));

  const approvedReviews = allReviews.filter((r) => r.status === "approved" || r.id === review.id);
  const avgRating =
    approvedReviews.length > 0
      ? approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedReviews.length
      : parsed.data.rating;

  await db
    .update(caregiversTable)
    .set({
      rating: Math.round(avgRating * 10) / 10,
      reviewCount: sql`${caregiversTable.reviewCount} + 1`,
    })
    .where(eq(caregiversTable.id, parsed.data.caregiverId));

  res.status(201).json(review);
});

router.patch("/reviews/:id/status", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateReviewStatusParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = UpdateReviewStatusBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [updated] = await db
    .update(reviewsTable)
    .set({ status: body.data.status })
    .where(eq(reviewsTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Review not found" });
    return;
  }

  res.json(UpdateReviewStatusResponse.parse(updated));
});

export default router;
