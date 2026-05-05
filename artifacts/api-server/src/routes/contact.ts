import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { sql, desc } from "drizzle-orm";

const router: IRouter = Router();

router.post("/contact", async (req, res): Promise<void> => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    res.status(400).json({ error: "All fields are required: name, email, subject, message" });
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({ error: "Please provide a valid email address" });
    return;
  }

  if (message.length > 5000) {
    res.status(400).json({ error: "Message must be under 5000 characters" });
    return;
  }

  try {
    const result = await db.execute(
      sql`INSERT INTO contact_submissions (name, email, subject, message) VALUES (${name}, ${email}, ${subject}, ${message}) RETURNING *`
    );
    res.status(201).json({ success: true, id: (result.rows?.[0] as any)?.id });
  } catch (err) {
    res.status(500).json({ error: "Failed to submit. Please try again." });
  }
});

router.get("/admin/contact-submissions", async (req, res): Promise<void> => {
  try {
    const result = await db.execute(
      sql`SELECT * FROM contact_submissions ORDER BY created_at DESC LIMIT 200`
    );
    res.json(result.rows ?? []);
  } catch {
    res.json([]);
  }
});

router.patch("/admin/contact-submissions/:id/status", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const { status, adminNote } = req.body;
  if (!["new", "read", "replied", "archived"].includes(status)) {
    res.status(400).json({ error: "Status must be: new, read, replied, or archived" });
    return;
  }

  try {
    const result = await db.execute(
      sql`UPDATE contact_submissions SET status = ${status}, admin_note = ${adminNote ?? null} WHERE id = ${id} RETURNING *`
    );
    if (!result.rows?.length) { res.status(404).json({ error: "Not found" }); return; }
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: "Update failed" });
  }
});

export default router;
