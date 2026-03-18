import { ReplitConnectors } from "@replit/connectors-sdk";
import Stripe from "stripe";

async function getStripe() {
  const connectors = new ReplitConnectors();
  const res = await connectors.proxy("stripe", "/v1/account", { method: "GET" }) as any;
  const authHeader = res._headers?.get?.("authorization") ?? "";
  const secretKey = authHeader.replace("Bearer ", "").trim();
  if (!secretKey) throw new Error("Could not get Stripe secret key from connector");
  return new Stripe(secretKey, { apiVersion: "2026-02-25.clover" });
}

async function createProducts() {
  const stripe = await getStripe();
  console.log("Connected to Stripe. Creating products...");

  const PLANS = [
    {
      name: "Pro",
      description: "The full working tier for founders making real shipping decisions. Multiple providers, unlimited saved runs, Winner Engine, and production export.",
      amount: 1900,
      metadata: { plan: "pro" },
    },
    {
      name: "Studio",
      description: "Everything in Pro plus shared workspaces, review links, and team collaboration features.",
      amount: 4900,
      metadata: { plan: "studio" },
    },
  ];

  for (const plan of PLANS) {
    const existing = await stripe.products.search({ query: `name:'${plan.name}' AND active:'true'` });
    if (existing.data.length > 0) {
      console.log(`${plan.name} already exists (${existing.data[0].id}) — skipping`);
      const prices = await stripe.prices.list({ product: existing.data[0].id, active: true });
      prices.data.forEach(p => console.log(`  Price: ${p.id} — $${(p.unit_amount ?? 0) / 100}/${(p.recurring as any)?.interval}`));
      continue;
    }

    const product = await stripe.products.create({
      name: plan.name,
      description: plan.description,
      metadata: plan.metadata,
    });
    console.log(`Created product: ${product.name} (${product.id})`);

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: plan.amount,
      currency: "usd",
      recurring: { interval: "month" },
      metadata: plan.metadata,
    });
    console.log(`  Created price: $${plan.amount / 100}/month (${price.id})`);
  }

  console.log("\nDone! Products and prices are ready in Stripe.");
}

createProducts().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
