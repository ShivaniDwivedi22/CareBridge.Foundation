import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import { CLERK_PROXY_PATH, clerkProxyMiddleware } from "./middlewares/clerkProxyMiddleware";
import router from "./routes";
import { stripeWebhookHandler } from "./routes/payments";
import { logger } from "./lib/logger";

const app: Express = express();

// Stripe webhooks need raw body — must be registered BEFORE express.json()
app.post("/api/webhooks/stripe", express.raw({ type: "application/json" }), stripeWebhookHandler);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());

app.use(cors({
  credentials: true,
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server, curl, etc.)
    if (!origin) return callback(null, true);
    // Allow all vercel.app preview URLs + your custom domain
    const allowed = [
      "[carebridge.foundation](https://www.carebridge.foundation)",
      "[carebridge.foundation](https://carebridge.foundation)",
    ];
    if (allowed.includes(origin) || origin.endsWith(".vercel.app")) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked: ${origin}`));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(clerkMiddleware());

app.use("/api", router);

export default app;
