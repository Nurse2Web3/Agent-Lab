import { getStripeSync } from "./stripeClient";
import { pool } from "@workspace/db";

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
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        "STRIPE WEBHOOK ERROR: Payload must be a Buffer. " +
        "Received type: " + typeof payload + ". " +
        "This usually means express.json() parsed the body before reaching this handler. " +
        "FIX: Ensure webhook route is registered BEFORE app.use(express.json())."
      );
    }
    const sync = await getStripeSync();
    await sync.processWebhook(payload, signature);
    reconcileBilling().catch(() => {});
  }
}
