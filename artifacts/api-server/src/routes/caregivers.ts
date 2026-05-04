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

  let caregivers = (await query).filter((c) => c.isVerified);

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
  try {
    const parsed = CreateCaregiverBody.safeParse(req.body);
    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => ({
        field: i.path.join(".") || "(root)",
        message: i.message,
      }));
      res.status(400).json({
        error: `Please fix: ${issues.map((i) => `${i.field} — ${i.message}`).join("; ")}`,
        code: "VALIDATION_ERROR",
        issues,
      });
      return;
    }

    if (parsed.data.clerkId) {
      const [existingClerk] = await db
        .select({ id: caregiversTable.id })
        .from(caregiversTable)
        .where(eq(caregiversTable.clerkId, parsed.data.clerkId));
      if (existingClerk) {
        res.status(409).json({
          error: "You are already registered as a caregiver. Visit your dashboard to update your profile.",
          code: "DUPLICATE_CLERK_ID",
          existingId: existingClerk.id,
        });
        return;
      }
    }

    if (parsed.data.phone) {
      const [existingPhone] = await db
        .select({ id: caregiversTable.id })
        .from(caregiversTable)
        .where(eq(caregiversTable.phone, parsed.data.phone));
      if (existingPhone) {
        res.status(409).json({
          error: "A caregiver account with this phone number already exists. Please sign in or use a different number.",
          code: "DUPLICATE_PHONE",
        });
        return;
      }
    }

    const [caregiver] = await db
      .insert(caregiversTable)
      .values(parsed.data)
      .returning();

    if (parsed.data.categoryIds.length > 0) {
      await db
        .update(categoriesTable)
        .set({ caregiverCount: sql`${categoriesTable.caregiverCount} + 1` })
        .where(inArray(categoriesTable.id, parsed.data.categoryIds));
    }

    const withCats = await attachCategories([caregiver]);
    res.status(201).json(GetCaregiverResponse.parse(withCats[0]));
  } catch (err: any) {
    req.log.error({ err }, "POST /caregivers failed");
    // Surface DB / Postgres errors with structured codes so the UI can react
    const pgCode = err?.code;
    if (pgCode === "23505") {
      res.status(409).json({ error: "A duplicate record exists for one of your fields.", code: "DB_UNIQUE_VIOLATION", detail: err?.detail });
      return;
    }
    if (pgCode === "23502") {
      res.status(400).json({ error: `Required field missing: ${err?.column ?? "unknown"}`, code: "DB_NOT_NULL_VIOLATION" });
      return;
    }
    if (pgCode === "42703") {
      // Column does not exist — schema drift between code and DB
      res.status(500).json({ error: "Server schema mismatch. The database is missing a column. Please contact support.", code: "DB_SCHEMA_MISMATCH", detail: err?.message });
      return;
    }
    res.status(500).json({
      error: err?.message || "Unexpected server error while creating caregiver profile.",
      code: "INTERNAL_ERROR",
    });
  }
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
  if (!caregiver.isVerified) {
    res.status(403).json({ error: "This profile is pending admin approval.", code: "PENDING_APPROVAL" });
    return;
  }

  const withCats = await attachCategories([caregiver]);
  res.json(GetCaregiverResponse.parse(withCats[0]));
});

export default router;
