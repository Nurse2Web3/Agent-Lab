import { runMigrations } from "stripe-replit-sync";
import { getStripeSync } from "./stripeClient";
import { pool } from "@workspace/db";
import app from "./app";

async function ensureAllTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS billing_users (
      id TEXT PRIMARY KEY,
      email TEXT,
      stripe_customer_id TEXT,
      stripe_subscription_id TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS api_keys (
      id SERIAL PRIMARY KEY,
      provider TEXT NOT NULL UNIQUE,
      encrypted_key TEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS history (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      prompt TEXT NOT NULL,
      system_prompt TEXT,
      providers TEXT NOT NULL,
      winner TEXT NOT NULL,
      temperature REAL NOT NULL DEFAULT 0.7,
      results TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS trial_users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      email_verified BOOLEAN NOT NULL DEFAULT false,
      card_verified BOOLEAN NOT NULL DEFAULT false,
      setup_intent_id TEXT,
      payment_method_id TEXT,
      trial_used BOOLEAN NOT NULL DEFAULT false,
      trial_comparisons_used INTEGER NOT NULL DEFAULT 0,
      device_fingerprint TEXT,
      ip_address TEXT,
      verification_token TEXT,
      verification_expires_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS trial_signup_log (
      id SERIAL PRIMARY KEY,
      email TEXT,
      ip_address TEXT,
      device_fingerprint TEXT,
      action TEXT NOT NULL,
      reason TEXT,
      metadata TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  console.log("All tables ready");
}

async function initStripe() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.warn("DATABASE_URL not set, skipping Stripe initialization");
    return;
  }

  try {
    console.log("Initializing Stripe schema...");
    await runMigrations({ databaseUrl });
    console.log("Stripe schema ready");
  } catch (error) {
    console.warn("Stripe schema migration skipped:", (error as Error).message);
    return;
  }

  try {
    const stripeSync = await getStripeSync();
    const webhookBaseUrl = `https://${process.env.REPLIT_DOMAINS?.split(",")[0]}`;
    await stripeSync.findOrCreateManagedWebhook(`${webhookBaseUrl}/api/stripe/webhook`);
    console.log("Stripe webhook configured");
    stripeSync.syncBackfill()
      .then(() => console.log("Stripe data synced"))
      .catch((err: Error) => console.warn("Stripe sync skipped:", err.message));
  } catch (error) {
    console.warn("Stripe webhook setup skipped (update STRIPE_SECRET_KEY to enable):", (error as Error).message);
  }
}

const rawPort = process.env["PORT"];
if (!rawPort) throw new Error("PORT environment variable is required but was not provided.");

const port = Number(rawPort);
if (Number.isNaN(port) || port <= 0) throw new Error(`Invalid PORT value: "${rawPort}"`);

(async () => {
  await ensureAllTables();
  await initStripe();

  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
})();
