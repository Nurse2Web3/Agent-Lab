import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import router from "./routes";
import { WebhookHandlers } from "./webhookHandlers";

const app: Express = express();

app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const signature = req.headers["stripe-signature"];
    if (!signature) {
      res.status(400).json({ error: "Missing stripe-signature" });
      return;
    }
    try {
      const sig = Array.isArray(signature) ? signature[0] : signature;
      if (!Buffer.isBuffer(req.body)) {
        console.error("STRIPE WEBHOOK ERROR: req.body is not a Buffer. webhook route must be BEFORE express.json()");
        res.status(500).json({ error: "Webhook processing error" });
        return;
      }
      const result = await WebhookHandlers.processWebhook(req.body as Buffer, sig);

      if (result.alreadyProcessed) {
        // Return 200 OK but indicate it was already processed (idempotent response)
        res.status(200).json({ received: true, alreadyProcessed: true, eventId: result.eventId });
      } else {
        res.status(200).json({ received: true, eventId: result.eventId });
      }
    } catch (error: any) {
      console.error("Webhook error:", error.message);
      res.status(400).json({ error: "Webhook processing error" });
    }
  }
);

app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
