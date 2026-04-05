import { Router, type IRouter } from "express";
import { db, caregiversTable, categoriesTable } from "@workspace/db";
import { eq, inArray } from "drizzle-orm";
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

router.get("/admin/caregivers", async (req, res): Promise<void> => {
  const caregivers = await db.select().from(caregiversTable);
  const withCats = await attachCategories(caregivers);
  res.json(AdminListCaregiversResponse.parse(withCats));
});

router.patch("/admin/caregivers/:id/approve", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = AdminApproveCaregiverParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [updated] = await db
    .update(caregiversTable)
    .set({ isVerified: true })
    .where(eq(caregiversTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Caregiver not found" });
    return;
  }

  const withCats = await attachCategories([updated]);
  res.json(AdminApproveCaregiverResponse.parse(withCats[0]));
});

router.patch("/admin/caregivers/:id/reject", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = AdminRejectCaregiverParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [updated] = await db
    .update(caregiversTable)
    .set({ isVerified: false })
    .where(eq(caregiversTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Caregiver not found" });
    return;
  }

  const withCats = await attachCategories([updated]);
  res.json(AdminRejectCaregiverResponse.parse(withCats[0]));
});

export default router;
