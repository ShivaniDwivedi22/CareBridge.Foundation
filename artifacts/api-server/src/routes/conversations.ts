import { Router, type IRouter } from "express";
import { db, conversationsTable, messagesTable } from "@workspace/db";
import { eq, or, and } from "drizzle-orm";
import {
  ListConversationsQueryParams,
  ListConversationsResponse,
  CreateConversationBody,
  ListMessagesParams,
  ListMessagesResponse,
  SendMessageParams,
  SendMessageBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/conversations", async (req, res): Promise<void> => {
  const parsed = ListConversationsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { clerkUserId } = parsed.data;

  const convos = await db
    .select()
    .from(conversationsTable)
    .where(
      or(
        eq(conversationsTable.participantAClerkId, clerkUserId),
        eq(conversationsTable.participantBClerkId, clerkUserId)
      )
    );

  res.json(ListConversationsResponse.parse(convos));
});

router.post("/conversations", async (req, res): Promise<void> => {
  const parsed = CreateConversationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { participantAClerkId, participantBClerkId, participantAName, participantBName } = parsed.data;

  const existing = await db
    .select()
    .from(conversationsTable)
    .where(
      or(
        and(
          eq(conversationsTable.participantAClerkId, participantAClerkId),
          eq(conversationsTable.participantBClerkId, participantBClerkId)
        ),
        and(
          eq(conversationsTable.participantAClerkId, participantBClerkId),
          eq(conversationsTable.participantBClerkId, participantAClerkId)
        )
      )
    );

  if (existing.length > 0) {
    res.status(201).json(existing[0]);
    return;
  }

  const [convo] = await db
    .insert(conversationsTable)
    .values({ participantAClerkId, participantBClerkId, participantAName, participantBName })
    .returning();

  res.status(201).json(convo);
});

router.get("/conversations/:id/messages", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = ListMessagesParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const msgs = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, params.data.id));

  res.json(ListMessagesResponse.parse(msgs));
});

router.post("/conversations/:id/messages", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = SendMessageParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = SendMessageBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [msg] = await db
    .insert(messagesTable)
    .values({ conversationId: params.data.id, ...body.data })
    .returning();

  await db
    .update(conversationsTable)
    .set({
      lastMessage: body.data.content,
      lastMessageAt: new Date().toISOString(),
    })
    .where(eq(conversationsTable.id, params.data.id));

  res.status(201).json(msg);
});

export default router;
