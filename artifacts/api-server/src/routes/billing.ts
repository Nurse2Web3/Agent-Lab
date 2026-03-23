import { Router } from "express";
import { createHmac } from "crypto";
import { billingStorage } from "../billingStorage";
import { getUncachableStripeClient } from "../stripeClient";

const router = Router();

const BASE_USER_ID = "default-user";
const COOKIE_NAME = "bs";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function getBaseUrl(req: any): string {
  const domain = process.env.REPLIT_DOMAINS?.split(",")[0];
  if (domain) return `https://${domain}`;
  return `${req.protocol}://${req.get("host")}`;
}

function makeToken(customerId: string, subscriptionId: string): string {
  const secret = process.env.STRIPE_SECRET_KEY ?? process.env.STRIPE_API_KEY ?? "fallback";
  return createHmac("sha256", secret).update(`${customerId}:${subscriptionId}`).digest("hex");
}

function verifyToken(cookie: string | undefined): boolean {
  if (!cookie) return false;
  return cookie.length === 64;
}

function setCookie(res: any, token: string) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: COOKIE_MAX_AGE * 1000,
    path: "/",
  });
}

router.get("/billing/status", async (req, res) => {
  try {
    const cookie = (req as any).cookies?.[COOKIE_NAME];
    if (!verifyToken(cookie)) {
      res.json({ plan: "free" });
      return;
    }
    const user = await billingStorage.ensureUser(BASE_USER_ID);
    const expectedToken = user.stripeCustomerId && user.stripeSubscriptionId
      ? makeToken(user.stripeCustomerId, user.stripeSubscriptionId)
      : null;
    if (!expectedToken || cookie !== expectedToken) {
      res.clearCookie(COOKIE_NAME, { path: "/" });
      res.json({ plan: "free" });
      return;
    }
    const plan = await billingStorage.getPlan(BASE_USER_ID);
    const subscription = await billingStorage.getSubscriptionStatus(BASE_USER_ID);
    res.json({
      plan,
      stripeCustomerId: user.stripeCustomerId,
      stripeSubscriptionId: user.stripeSubscriptionId,
      subscription: subscription
        ? { status: (subscription as any).status, currentPeriodEnd: (subscription as any).current_period_end }
        : null,
    });
  } catch (err: any) {
    console.error("billing/status error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/billing/activate-session", async (req, res) => {
  try {
    const { email } = req.body ?? {};
    if (!email) {
      res.status(400).json({ error: "Email required." });
      return;
    }
    const user = await billingStorage.ensureUser(BASE_USER_ID);
    if (!user.stripeCustomerId || !user.stripeSubscriptionId) {
      res.status(400).json({ error: "No active subscription found. Please subscribe first." });
      return;
    }
    const stripe = await getUncachableStripeClient();
    const customer = await stripe.customers.retrieve(user.stripeCustomerId) as any;
    const storedEmail: string = customer.email ?? "";
    if (!storedEmail || storedEmail.toLowerCase() !== email.trim().toLowerCase()) {
      res.status(403).json({ error: "Email does not match the subscription on file." });
      return;
    }
    const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId) as any;
    if (subscription.status !== "active") {
      res.status(403).json({ error: "Subscription is not active." });
      return;
    }
    const token = makeToken(user.stripeCustomerId, user.stripeSubscriptionId);
    setCookie(res, token);
    res.json({ ok: true, plan: await billingStorage.getPlan(BASE_USER_ID) });
  } catch (err: any) {
    console.error("billing/activate-session error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/billing/deactivate-session", (_req, res) => {
  res.clearCookie(COOKIE_NAME, { path: "/" });
  res.json({ ok: true });
});

router.get("/billing/products", async (_req, res) => {
  try {
    const rows = await billingStorage.listProductsWithPrices();
    const map = new Map<string, any>();
    for (const row of rows as any[]) {
      if (!map.has(row.product_id)) {
        map.set(row.product_id, {
          id: row.product_id,
          name: row.product_name,
          description: row.product_description,
          metadata: row.product_metadata,
          prices: [],
        });
      }
      if (row.price_id) {
        map.get(row.product_id).prices.push({
          id: row.price_id,
          unitAmount: row.unit_amount,
          currency: row.currency,
          recurring: row.recurring,
        });
      }
    }
    res.json({ products: Array.from(map.values()) });
  } catch (err: any) {
    console.error("billing/products error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/billing/checkout", async (req, res) => {
  try {
    const { priceId } = req.body;
    if (!priceId) { res.status(400).json({ error: "priceId required" }); return; }

    const stripe = await getUncachableStripeClient();
    const user = await billingStorage.ensureUser(BASE_USER_ID);

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({ metadata: { userId: BASE_USER_ID } });
      await billingStorage.updateStripeCustomer(BASE_USER_ID, customer.id);
      customerId = customer.id;
    }

    const baseUrl = getBaseUrl(req);
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${baseUrl}/settings?billing=success`,
      cancel_url: `${baseUrl}/pricing?billing=cancelled`,
    });

    res.json({ url: session.url });
  } catch (err: any) {
    console.error("billing/checkout error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/billing/portal", async (req, res) => {
  try {
    const stripe = await getUncachableStripeClient();
    const user = await billingStorage.ensureUser(BASE_USER_ID);

    if (!user.stripeCustomerId) {
      res.status(400).json({ error: "No billing account found. Subscribe to a plan first." });
      return;
    }

    const baseUrl = getBaseUrl(req);
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${baseUrl}/settings`,
    });

    res.json({ url: session.url });
  } catch (err: any) {
    console.error("billing/portal error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
