import { Router, type IRouter } from "express";
import { db, careRequestsTable, categoriesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  ListCareRequestsQueryParams,
  ListCareRequestsResponse,
  CreateCareRequestBody,
  GetCareRequestParams,
  GetCareRequestResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function attachCategory(requests: typeof careRequestsTable.$inferSelect[]) {
  const catIds = [...new Set(requests.map((r) => r.categoryId))];
  if (catIds.length === 0) return requests.map((r) => ({ ...r, category: undefined }));

  const cats = await db.select().from(categoriesTable);
  const catMap = new Map(cats.map((c) => [c.id, c]));

  return requests.map((r) => ({
    ...r,
    category: catMap.get(r.categoryId),
  }));
}

router.get("/care-requests", async (req, res): Promise<void> => {
  const parsed = ListCareRequestsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  let requests = await db.select().from(careRequestsTable).orderBy(careRequestsTable.createdAt);

  if (parsed.data.status) {
    requests = requests.filter((r) => r.status === parsed.data.status);
  }

  if (parsed.data.category) {
    const [cat] = await db
      .select()
      .from(categoriesTable)
      .where(eq(categoriesTable.slug, parsed.data.category));
    if (cat) {
      requests = requests.filter((r) => r.categoryId === cat.id);
    }
  }

  const withCats = await attachCategory(requests);
  res.json(ListCareRequestsResponse.parse(withCats));
});

router.post("/care-requests", async (req, res): Promise<void> => {
  const parsed = CreateCareRequestBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [request] = await db
    .insert(careRequestsTable)
    .values(parsed.data)
    .returning();

  const withCat = await attachCategory([request]);
  res.status(201).json(GetCareRequestResponse.parse(withCat[0]));
});

router.get("/care-requests/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetCareRequestParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [request] = await db
    .select()
    .from(careRequestsTable)
    .where(eq(careRequestsTable.id, params.data.id));

  if (!request) {
    res.status(404).json({ error: "Care request not found" });
    return;
  }

  const withCat = await attachCategory([request]);
  res.json(GetCareRequestResponse.parse(withCat[0]));
});

export default router;
