import { Router, type IRouter } from "express";
import { db, caregiversTable, categoriesTable } from "@workspace/db";
import { eq, gte, inArray, sql } from "drizzle-orm";
import {
  ListCaregiversQueryParams,
  ListCaregiversResponse,
  CreateCaregiverBody,
  GetCaregiverParams,
  GetCaregiverResponse,
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

router.get("/caregivers", async (req, res): Promise<void> => {
  const parsed = ListCaregiversQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { category, location, minRating } = parsed.data;

  let query = db.select().from(caregiversTable);

  const conditions = [];
  if (location) {
    conditions.push(sql`lower(${caregiversTable.location}) like ${'%' + location.toLowerCase() + '%'}`);
  }
  if (minRating !== undefined) {
    conditions.push(gte(caregiversTable.rating, minRating));
  }

  let caregivers = await query;

  if (category) {
    const cat = await db.select().from(categoriesTable).where(eq(categoriesTable.slug, category));
    if (cat.length > 0) {
      const catId = cat[0].id;
      caregivers = caregivers.filter((c) => c.categoryIds.includes(catId));
    }
  }
  if (location) {
    caregivers = caregivers.filter((c) =>
      c.location.toLowerCase().includes(location.toLowerCase())
    );
  }
  if (minRating !== undefined) {
    caregivers = caregivers.filter((c) => c.rating >= minRating);
  }

  const withCats = await attachCategories(caregivers);
  res.json(ListCaregiversResponse.parse(withCats));
});

router.post("/caregivers", async (req, res): Promise<void> => {
  const parsed = CreateCaregiverBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [caregiver] = await db
    .insert(caregiversTable)
    .values(parsed.data)
    .returning();

  await db
    .update(categoriesTable)
    .set({ caregiverCount: sql`${categoriesTable.caregiverCount} + 1` })
    .where(inArray(categoriesTable.id, parsed.data.categoryIds));

  const withCats = await attachCategories([caregiver]);
  res.status(201).json(GetCaregiverResponse.parse(withCats[0]));
});

router.get("/caregivers/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetCaregiverParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [caregiver] = await db
    .select()
    .from(caregiversTable)
    .where(eq(caregiversTable.id, params.data.id));

  if (!caregiver) {
    res.status(404).json({ error: "Caregiver not found" });
    return;
  }

  const withCats = await attachCategories([caregiver]);
  res.json(GetCaregiverResponse.parse(withCats[0]));
});

export default router;
