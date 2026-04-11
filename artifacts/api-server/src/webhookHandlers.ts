import Stripe from "stripe";
import { getStripeSync, getUncachableStripeClient } from "./stripeClient";
import { pool } from "@workspace/db";
import { checkIdempotency, markWebhookProcessed, markWebhookFailed } from "./middleware/idempotency.js";

async function reconcileBilling(): Promise<void> {
  try {
    const result = await pool.query(`
      SELECT s.id as sub_id, s.customer
      FROM stripe.subscriptions s
      WHERE s.status = 'active'
      ORDER BY s.created DESC
      LIMIT 1
    `);
    if (!result.rows[0]) return;
    const { sub_id, customer } = result.rows[0];
    await pool.query(`
      UPDATE billing_users
      SET stripe_customer_id = $1, stripe_subscription_id = $2
      WHERE id = 'default-user'
        AND (stripe_customer_id IS NULL OR stripe_subscription_id IS NULL OR stripe_subscription_id != $2)
    `, [customer, sub_id]);
  } catch {
    // stripe schema may not exist yet
  }
}

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<{ eventId?: string; alreadyProcessed?: boolean }> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        "STRIPE WEBHOOK ERROR: Payload must be a Buffer. " +
        "Received type: " + typeof payload + ". " +
        "This usually means express.json() parsed the body before reaching this handler. " +
        "FIX: Ensure webhook route is registered BEFORE app.use(express.json())."
      );
    }

    const stripe = await getUncachableStripeClient();
    const sync = await getStripeSync();

    // Parse and verify the webhook event
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || process.env.STRIPE_SIGNING_SECRET || ""
    );

    // Check idempotency - prevent duplicate event processing
    const eventId = event.id;
    const eventType = event.type;
    const eventCreatedAt = new Date(event.created * 1000);

    const idempotencyResult = await checkIdempotency(eventId, eventType, eventCreatedAt);

    if (!idempotencyResult.shouldProcess) {
      console.log(`[Webhook] Skipping duplicate event: ${eventId} (type: ${eventType})`);
      return { eventId, alreadyProcessed: true };
    }

    try {
      await sync.processWebhook(payload, signature);
      await markWebhookProcessed(eventId, { type: eventType, processed: true });
      reconcileBilling().catch(() => {});
      return { eventId, alreadyProcessed: false };
    } catch (error: any) {
      await markWebhookFailed(eventId, error.message);
      throw error;
    }
  }
}
