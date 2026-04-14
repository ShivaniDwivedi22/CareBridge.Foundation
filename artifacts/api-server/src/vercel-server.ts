import type { IncomingMessage, ServerResponse } from "node:http";
import app from "./app";
import { seedIfEmpty } from "./seed";
import { logger } from "./lib/logger";

let seedPromise: Promise<void> | null = null;

function ensureSeeded(): Promise<void> {
  if (!seedPromise) {
    seedPromise = seedIfEmpty().catch((err) => {
      logger.error({ err }, "Failed to seed database on Vercel cold start");
      seedPromise = null;
    });
  }
  return seedPromise;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  await ensureSeeded();
  app(req as any, res as any);
}
