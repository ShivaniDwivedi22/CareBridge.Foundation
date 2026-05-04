import { Router, type IRouter } from "express";
import { db, caregiversTable, categoriesTable, careRequestsTable, bookingsTable, paymentsTable } from "@workspace/db";
import { eq, inArray, desc, sql } from "drizzle-orm";
import {
  AdminListCaregiversResponse,
  AdminApproveCaregiverParams,
  AdminApproveCaregiverResponse,
  AdminRejectCaregiverParams,
  AdminRejectCaregiverResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function attachCategories(caregivers: typeof caregiversTable.$inferSelect[]) {
  const allCategoryIds = [...new Set(caregivers.flatMap((c) => c.categoryIds))];
  if (allCategoryIds.length === 0) return caregivers.map((c) => ({ ...c, categories: [] }));
  const cats = await db.select().from(categoriesTable).where(inArray(categoriesTable.id, allCategoryIds));
  const catMap = new Map(cats.map((c) => [c.id, c]));
  return caregivers.map((c) => ({
    ...c,
    categories: c.categoryIds.map((id) => catMap.get(id)).filter(Boolean),
  }));
}

async function logAudit(action: string, targetType: string, targetId: number | null, adminClerkId: string | null, details: string | null) {
  try {
    await db.execute(
      sql`INSERT INTO audit_log (action, target_type, target_id, admin_clerk_id, details) VALUES (${action}, ${targetType}, ${targetId}, ${adminClerkId}, ${details})`
    );
  } catch {
    // audit log table might not exist yet — silently skip
  }
}

router.get("/admin/caregivers", async (req, res): Promise<void> => {
  const caregivers = await db.select().from(caregiversTable).orderBy(desc(caregiversTable.createdAt));
  const withCats = await attachCategories(caregivers);
  res.json(AdminListCaregiversResponse.parse(withCats));
});

router.get("/admin/caregivers/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const [caregiver] = await db.select().from(caregiversTable).where(eq(caregiversTable.id, id));
  if (!caregiver) { res.status(404).json({ error: "Caregiver not found" }); return; }

  const withCats = await attachCategories([caregiver]);
  res.json(withCats[0]);
});

router.patch("/admin/caregivers/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const allowedFields = [
    "name", "bio", "location", "hourlyRate", "yearsExperience", "certifications",
    "languages", "services", "phone", "serviceRadius", "onSiteRemote",
    "availabilitySchedule", "pricingUnit", "avatarUrl",
  ];

  const updates: Record<string, any> = {};
  for (const key of allowedFields) {
    if (req.body[key] !== undefined) {
      updates[key] = req.body[key];
    }
  }
  if (req.body.categoryIds !== undefined) {
    updates.categoryIds = req.body.categoryIds;
  }

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "No valid fields to update" });
    return;
  }

  const [updated] = await db.update(caregiversTable).set(updates).where(eq(caregiversTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Caregiver not found" }); return; }

  const adminClerkId = (req as any).auth?.userId ?? null;
  await logAudit("edit_caregiver", "caregiver", id, adminClerkId, `Updated fields: ${Object.keys(updates).join(", ")}`);

  const withCats = await attachCategories([updated]);
  res.json(withCats[0]);
});

router.patch("/admin/caregivers/:id/approve", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = AdminApproveCaregiverParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [updated] = await db.update(caregiversTable).set({ isVerified: true }).where(eq(caregiversTable.id, params.data.id)).returning();
  if (!updated) { res.status(404).json({ error: "Caregiver not found" }); return; }

  const adminClerkId = (req as any).auth?.userId ?? null;
  await logAudit("approve_caregiver", "caregiver", params.data.id, adminClerkId, `Approved: ${updated.name}`);

  const withCats = await attachCategories([updated]);
  res.json(AdminApproveCaregiverResponse.parse(withCats[0]));
});

router.patch("/admin/caregivers/:id/reject", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = AdminRejectCaregiverParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [updated] = await db.update(caregiversTable).set({ isVerified: false }).where(eq(caregiversTable.id, params.data.id)).returning();
  if (!updated) { res.status(404).json({ error: "Caregiver not found" }); return; }

  const reason = req.body?.reason ?? "";
  const adminClerkId = (req as any).auth?.userId ?? null;
  await logAudit("reject_caregiver", "caregiver", params.data.id, adminClerkId, `Rejected: ${updated.name}. Reason: ${reason}`);

  const withCats = await attachCategories([updated]);
  res.json(AdminRejectCaregiverResponse.parse(withCats[0]));
});

router.get("/admin/care-requests", async (req, res): Promise<void> => {
  const requests = await db.select().from(careRequestsTable).orderBy(desc(careRequestsTable.createdAt));
  const catIds = [...new Set(requests.map((r) => r.categoryId))];
  const cats = catIds.length > 0 ? await db.select().from(categoriesTable).where(inArray(categoriesTable.id, catIds)) : [];
  const catMap = new Map(cats.map((c) => [c.id, c]));
  const withCats = requests.map((r) => ({ ...r, category: catMap.get(r.categoryId) }));
  res.json(withCats);
});

router.patch("/admin/care-requests/:id/status", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const { status } = req.body;
  if (!["open", "closed", "flagged", "fulfilled"].includes(status)) {
    res.status(400).json({ error: "Invalid status. Must be: open, closed, flagged, or fulfilled" });
    return;
  }

  const [updated] = await db.update(careRequestsTable).set({ status }).where(eq(careRequestsTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Care request not found" }); return; }

  const adminClerkId = (req as any).auth?.userId ?? null;
  await logAudit("update_care_request_status", "care_request", id, adminClerkId, `Status changed to: ${status}`);

  res.json(updated);
});

router.get("/admin/stats", async (req, res): Promise<void> => {
  const [caregivers, requests, bookings, payments, categories] = await Promise.all([
    db.select().from(caregiversTable),
    db.select().from(careRequestsTable),
    db.select().from(bookingsTable),
    db.select().from(paymentsTable),
    db.select().from(categoriesTable),
  ]);

  const pendingCaregivers = caregivers.filter((c) => !c.isVerified).length;
  const verifiedCaregivers = caregivers.filter((c) => c.isVerified).length;
  const openRequests = requests.filter((r) => r.status === "open").length;
  const completedBookings = bookings.filter((b) => b.status === "completed").length;
  const activeBookings = bookings.filter((b) => ["pending", "confirmed"].includes(b.status)).length;

  const totalRevenueCents = payments
    .filter((p) => p.status === "succeeded" || p.status === "completed")
    .reduce((sum, p) => sum + (p.amountCents ?? 0), 0);
  const platformFeeCents = payments
    .filter((p) => p.status === "succeeded" || p.status === "completed")
    .reduce((sum, p) => sum + (p.platformFeeCents ?? 0), 0);

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const recentSignups = caregivers.filter((c) => c.createdAt && new Date(c.createdAt) >= thirtyDaysAgo).length;

  const categoryCounts = categories.map((cat) => ({
    categoryName: cat.name,
    count: caregivers.filter((c) => c.categoryIds.includes(cat.id)).length,
    requestCount: requests.filter((r) => r.categoryId === cat.id).length,
  }));

  res.json({
    totalCaregivers: caregivers.length,
    pendingCaregivers,
    verifiedCaregivers,
    totalCareRequests: requests.length,
    openRequests,
    totalBookings: bookings.length,
    completedBookings,
    activeBookings,
    totalRevenueCents,
    platformFeeCents,
    recentSignups,
    categoryCounts,
  });
});

router.get("/admin/audit-log", async (req, res): Promise<void> => {
  try {
    const result = await db.execute(
      sql`SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 100`
    );
    res.json(result.rows ?? []);
  } catch {
    res.json([]);
  }
});

export default router;
