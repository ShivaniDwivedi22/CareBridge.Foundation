import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { Resend } from "resend";

const router: IRouter = Router();

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const NOTIFICATION_TO = "info@carebridge.foundation";
const NOTIFICATION_FROM = "CareBridge Contact <noreply@carebridge.foundation>";

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

async function sendNotificationEmail(submission: { id: number; name: string; email: string; subject: string; message: string }) {
  if (!resend) {
    console.warn("[contact] RESEND_API_KEY not set — skipping email notification");
    return;
  }
  try {
    await resend.emails.send({
      from: NOTIFICATION_FROM,
      to: NOTIFICATION_TO,
      replyTo: submission.email,
      subject: `[CareBridge Contact] ${submission.subject}`,
      html: `
        <div style="font-family: -apple-system, system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c5f5d;">New contact form submission</h2>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>From:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(submission.name)}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Email:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;"><a href="mailto:${escapeHtml(submission.email)}">${escapeHtml(submission.email)}</a></td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Subject:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(submission.subject)}</td></tr>
          </table>
          <h3 style="color: #2c5f5d;">Message:</h3>
          <div style="background: #f7f7f7; border-left: 4px solid #2c5f5d; padding: 16px; border-radius: 4px; white-space: pre-wrap;">${escapeHtml(submission.message)}</div>
          <p style="color: #888; font-size: 12px; margin-top: 24px;">
            Submission #${submission.id} · Reply directly to this email to respond to ${escapeHtml(submission.name)}.
          </p>
        </div>
      `,
    });
  } catch (err) {
    console.error("[contact] Failed to send notification email:", err);
  }
}

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
    const submission = result.rows?.[0] as any;

    // Fire-and-forget: don't block the response on email
    sendNotificationEmail({
      id: submission.id,
      name, email, subject, message,
    });

    res.status(201).json({ success: true, id: submission?.id });
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
