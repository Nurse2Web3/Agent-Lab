import { ReplitConnectors } from "@replit/connectors-sdk";
import Stripe from "stripe";
import { StripeSync } from "stripe-replit-sync";

let stripeSyncInstance: StripeSync | null = null;

async function getSecretKey(): Promise<string> {
  if (process.env.STRIPE_API_KEY) {
    return process.env.STRIPE_API_KEY;
  }
  if (process.env.STRIPE_SECRET_KEY) {
    return process.env.STRIPE_SECRET_KEY;
  }
  try {
    const connectors = new ReplitConnectors();
    const response = await connectors.proxy("stripe", "/v1/account", {
      method: "GET",
    }) as any;

    const authHeader =
      response?.headers?.get?.("authorization") ??
      response?._headers?.get?.("authorization") ??
      "";

    const key = authHeader.replace("Bearer ", "").trim();
    if (key && key.startsWith("sk_")) return key;
  } catch (e) {
    console.warn("Could not get Stripe key via connector proxy:", e);
  }

  throw new Error(
    "Stripe secret key not available. Set STRIPE_SECRET_KEY environment variable or connect Stripe via the integrations panel."
  );
}

export async function getUncachableStripeClient(): Promise<Stripe> {
  const secretKey = await getSecretKey();
  return new Stripe(secretKey, { apiVersion: "2026-02-25.clover" });
}

export async function getStripeSync(): Promise<StripeSync> {
  if (stripeSyncInstance) return stripeSyncInstance;

  const secretKey = await getSecretKey();
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL required");

  stripeSyncInstance = new StripeSync({ stripeSecretKey: secretKey, poolConfig: { connectionString: databaseUrl } });
  return stripeSyncInstance;
}
