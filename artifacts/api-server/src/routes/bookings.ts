import { Router, type IRouter } from "express";
import { db, bookingsTable, caregiversTable, careRequestsTable, categoriesTable } from "@workspace/db";
import { eq, inArray } from "drizzle-orm";
import {
  ListBookingsQueryParams,
  ListBookingsResponse,
  CreateBookingBody,
  UpdateBookingStatusParams,
  UpdateBookingStatusBody,
  UpdateBookingStatusResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function enrichBookings(bookings: typeof bookingsTable.$inferSelect[]) {
  if (bookings.length === 0) return bookings.map((b) => ({ ...b, caregiver: undefined, careRequest: undefined }));

  const caregiverIds = [...new Set(bookings.map((b) => b.caregiverId))];
  const requestIds = [...new Set(bookings.map((b) => b.careRequestId))];

  const caregivers = await db.select().from(caregiversTable).where(inArray(caregiversTable.id, caregiverIds));
  const requests = await db.select().from(careRequestsTable).where(inArray(careRequestsTable.id, requestIds));
  const categories = await db.select().from(categoriesTable);

  const catMap = new Map(categories.map((c) => [c.id, c]));
  const caregiverMap = new Map(caregivers.map((c) => [c.id, { ...c, categories: c.categoryIds.map((id) => catMap.get(id)).filter(Boolean) }]));
  const requestMap = new Map(requests.map((r) => [r.id, { ...r, category: catMap.get(r.categoryId) }]));

  return bookings.map((b) => ({
    ...b,
    caregiver: caregiverMap.get(b.caregiverId),
    careRequest: requestMap.get(b.careRequestId),
  }));
}

router.get("/bookings", async (req, res): Promise<void> => {
  const parsed = ListBookingsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  let bookings = await db.select().from(bookingsTable).orderBy(bookingsTable.createdAt);

  if (parsed.data.caregiverId !== undefined) {
    bookings = bookings.filter((b) => b.caregiverId === parsed.data.caregiverId);
  }
  if (parsed.data.status) {
    bookings = bookings.filter((b) => b.status === parsed.data.status);
  }

  const enriched = await enrichBookings(bookings);
  res.json(ListBookingsResponse.parse(enriched));
});

router.post("/bookings", async (req, res): Promise<void> => {
  const parsed = CreateBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [booking] = await db
    .insert(bookingsTable)
    .values(parsed.data)
    .returning();

  const enriched = await enrichBookings([booking]);
  res.status(201).json(enriched[0]);
});

router.patch("/bookings/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateBookingStatusParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdateBookingStatusBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [booking] = await db
    .update(bookingsTable)
    .set({ status: body.data.status })
    .where(eq(bookingsTable.id, params.data.id))
    .returning();

  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  const enriched = await enrichBookings([booking]);
  res.json(UpdateBookingStatusResponse.parse(enriched[0]));
});

export default router;
