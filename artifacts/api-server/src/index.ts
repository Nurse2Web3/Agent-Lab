import { runMigrations } from "stripe-replit-sync";
import { getStripeSync } from "./stripeClient";
import { pool } from "@workspace/db";
import app from "./app";

async function ensureBillingTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS billing_users (
      id TEXT PRIMARY KEY,
      email TEXT,
      stripe_customer_id TEXT,
      stripe_subscription_id TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  console.log("billing_users table ready");
}

async function initStripe() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.warn("DATABASE_URL not set, skipping Stripe initialization");
    return;
  }

  try {
    console.log("Initializing Stripe schema...");
    await runMigrations({ databaseUrl, schema: "stripe" });
    console.log("Stripe schema ready");

    const stripeSync = await getStripeSync();

    const webhookBaseUrl = `https://${process.env.REPLIT_DOMAINS?.split(",")[0]}`;
    await stripeSync.findOrCreateManagedWebhook(`${webhookBaseUrl}/api/stripe/webhook`);
    console.log("Stripe webhook configured");

    stripeSync.syncBackfill()
      .then(() => console.log("Stripe data synced"))
      .catch((err) => console.error("Stripe sync error:", err));
  } catch (error) {
    console.error("Stripe init error (non-fatal):", error);
  }
}

const rawPort = process.env["PORT"];
if (!rawPort) throw new Error("PORT environment variable is required but was not provided.");

const port = Number(rawPort);
if (Number.isNaN(port) || port <= 0) throw new Error(`Invalid PORT value: "${rawPort}"`);

await ensureBillingTable();
await initStripe();

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
