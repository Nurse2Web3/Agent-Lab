import { sql } from "drizzle-orm";
import { db } from "@workspace/db";

export interface BillingUser {
  id: string;
  email: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  plan: "sandbox" | "pro" | "studio";
  createdAt: Date;
}

export class BillingStorage {
  async ensureUser(userId: string, email?: string): Promise<BillingUser> {
    const result = await db.execute(
      sql`
        INSERT INTO billing_users (id, email)
        VALUES (${userId}, ${email ?? null})
        ON CONFLICT (id) DO UPDATE SET email = COALESCE(billing_users.email, EXCLUDED.email)
        RETURNING *
      `
    );
    return this.rowToUser(result.rows[0]);
  }

  async getUser(userId: string): Promise<BillingUser | null> {
    const result = await db.execute(
      sql`SELECT * FROM billing_users WHERE id = ${userId}`
    );
    if (!result.rows[0]) return null;
    return this.rowToUser(result.rows[0]);
  }

  async updateStripeCustomer(userId: string, stripeCustomerId: string): Promise<void> {
    await db.execute(
      sql`UPDATE billing_users SET stripe_customer_id = ${stripeCustomerId} WHERE id = ${userId}`
    );
  }

  async updateSubscription(stripeCustomerId: string, subscriptionId: string | null): Promise<void> {
    await db.execute(
      sql`UPDATE billing_users SET stripe_subscription_id = ${subscriptionId} WHERE stripe_customer_id = ${stripeCustomerId}`
    );
  }

  async getUserByCustomerId(stripeCustomerId: string): Promise<BillingUser | null> {
    const result = await db.execute(
      sql`SELECT * FROM billing_users WHERE stripe_customer_id = ${stripeCustomerId}`
    );
    if (!result.rows[0]) return null;
    return this.rowToUser(result.rows[0]);
  }

  async getPlan(userId: string): Promise<"sandbox" | "pro" | "studio"> {
    const user = await this.getUser(userId);
    if (!user?.stripeSubscriptionId) return "sandbox";

    const sub = await db.execute(
      sql`SELECT status, metadata FROM stripe.subscriptions WHERE id = ${user.stripeSubscriptionId}`
    );
    const row = sub.rows[0] as any;
    if (!row || row.status !== "active") return "sandbox";

    const meta = row.metadata as Record<string, string> | null;
    if (meta?.plan === "studio") return "studio";
    if (meta?.plan === "pro") return "pro";

    const itemRows = await db.execute(
      sql`
        SELECT p.name FROM stripe.subscription_items si
        JOIN stripe.prices pr ON pr.id = si.price
        JOIN stripe.products p ON p.id = pr.product
        WHERE si.subscription = ${user.stripeSubscriptionId}
        LIMIT 1
      `
    );
    const productName = ((itemRows.rows[0] as any)?.name ?? "").toLowerCase();
    if (productName.includes("studio")) return "studio";
    if (productName.includes("pro")) return "pro";
    return "sandbox";
  }

  async getSubscriptionStatus(userId: string) {
    const user = await this.getUser(userId);
    if (!user?.stripeSubscriptionId) return null;

    const result = await db.execute(
      sql`SELECT * FROM stripe.subscriptions WHERE id = ${user.stripeSubscriptionId}`
    );
    return result.rows[0] ?? null;
  }

  async listProductsWithPrices() {
    const result = await db.execute(sql`
      WITH paginated_products AS (
        SELECT id, name, description, metadata, active
        FROM stripe.products
        WHERE active = true
        ORDER BY name
      )
      SELECT
        p.id as product_id,
        p.name as product_name,
        p.description as product_description,
        p.metadata as product_metadata,
        pr.id as price_id,
        pr.unit_amount,
        pr.currency,
        pr.recurring,
        pr.active as price_active
      FROM paginated_products p
      LEFT JOIN stripe.prices pr ON pr.product = p.id AND pr.active = true
      ORDER BY p.name, pr.unit_amount
    `);
    return result.rows;
  }

  private rowToUser(row: any): BillingUser {
    return {
      id: row.id,
      email: row.email ?? null,
      stripeCustomerId: row.stripe_customer_id ?? null,
      stripeSubscriptionId: row.stripe_subscription_id ?? null,
      plan: "sandbox",
      createdAt: row.created_at,
    };
  }
}

export const billingStorage = new BillingStorage();
