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
        SELECT pr.unit_amount, pr.currency, p.name as product_name
        FROM stripe.subscription_items si
        JOIN stripe.prices pr ON pr.id = si.price
        LEFT JOIN stripe.products p ON p.id = pr.product
        WHERE si.subscription = ${user.stripeSubscriptionId}
        LIMIT 1
      `
    );
    const row0 = itemRows.rows[0] as any;
    const productName = (row0?.product_name ?? "").toLowerCase();
    if (productName.includes("studio") || productName.includes("premium")) return "studio";
    if (productName.includes("pro")) return "pro";

    const unitAmount = Number(row0?.unit_amount ?? 0);
    if (unitAmount >= 4900) return "studio";
    if (unitAmount >= 2900) return "pro";

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

  async getMonthlyUsage(userId: string): Promise<{ used: number; resetAt: Date }> {
    const result = await db.execute(
      sql`SELECT monthly_comparisons_used, monthly_reset_at FROM billing_users WHERE id = ${userId}`
    );
    const row = result.rows[0] as any;
    if (!row) return { used: 0, resetAt: new Date() };
    const resetAt = new Date(row.monthly_reset_at ?? Date.now());
    const now = new Date();
    const nextMonth = new Date(resetAt);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    if (now >= nextMonth) {
      await db.execute(
        sql`UPDATE billing_users SET monthly_comparisons_used = 0, monthly_reset_at = NOW() WHERE id = ${userId}`
      );
      return { used: 0, resetAt: now };
    }
    return { used: Number(row.monthly_comparisons_used ?? 0), resetAt };
  }

  async incrementMonthlyUsage(userId: string): Promise<void> {
    await db.execute(
      sql`UPDATE billing_users SET monthly_comparisons_used = COALESCE(monthly_comparisons_used, 0) + 1 WHERE id = ${userId}`
    );
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
