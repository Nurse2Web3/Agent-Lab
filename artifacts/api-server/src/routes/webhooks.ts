import { Router } from "express";
import { db } from "@workspace/db";
import { webhookEventsTable, idempotencyKeysTable } from "@workspace/db/schema";
import { eq, sql, desc, and, gt } from "drizzle-orm";

const router = Router();

/**
 * GET /webhooks/events - List recent webhook events
 * Query params: limit (default 20), status (optional), type (optional)
 */
router.get("/events", async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const status = req.query.status as string | undefined;
    const type = req.query.type as string | undefined;

    let query = db.select().from(webhookEventsTable);

    const conditions = [];
    if (status) {
      conditions.push(eq(webhookEventsTable.status, status));
    }
    if (type) {
      conditions.push(eq(webhookEventsTable.type, type));
    }

    if (conditions.length > 0) {
      // @ts-ignore - drizzle types are complex
      query = query.where(and(...conditions));
    }

    const events = await query
      .orderBy(desc(webhookEventsTable.createdAt))
      .limit(limit);

    res.json({
      success: true,
      count: events.length,
      events: events.map((e) => ({
        id: e.id,
        type: e.type,
        status: e.status,
        createdAt: e.createdAt.toISOString(),
        processedAt: e.processedAt.toISOString(),
        errorMessage: e.errorMessage,
      })),
    });
  } catch (error: any) {
    console.error("Error fetching webhook events:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /webhooks/events/:id - Get a specific webhook event
 */
router.get("/events/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const events = await db
      .select()
      .from(webhookEventsTable)
      .where(eq(webhookEventsTable.id, id))
      .limit(1);

    if (!events[0]) {
      res.status(404).json({ error: "Webhook event not found" });
      return;
    }

    const event = events[0];
    res.json({
      success: true,
      event: {
        id: event.id,
        type: event.type,
        status: event.status,
        createdAt: event.createdAt.toISOString(),
        processedAt: event.processedAt.toISOString(),
        errorMessage: event.errorMessage,
        metadata: event.metadata ? JSON.parse(event.metadata) : null,
      },
    });
  } catch (error: any) {
    console.error("Error fetching webhook event:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /webhooks/idempotency-keys - List recent idempotency keys
 * Query params: limit (default 20), status (optional)
 */
router.get("/idempotency-keys", async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const status = req.query.status as string | undefined;

    let query = db.select().from(idempotencyKeysTable);

    if (status) {
      // @ts-ignore - drizzle types are complex
      query = query.where(eq(idempotencyKeysTable.status, status));
    }

    const keys = await query
      .orderBy(desc(idempotencyKeysTable.createdAt))
      .limit(limit);

    res.json({
      success: true,
      count: keys.length,
      keys: keys.map((k) => ({
        key: k.key,
        status: k.status,
        resourceId: k.resourceId,
        responseCode: k.responseCode,
        createdAt: k.createdAt.toISOString(),
        expiresAt: k.expiresAt.toISOString(),
      })),
    });
  } catch (error: any) {
    console.error("Error fetching idempotency keys:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /webhooks/events/:id - Delete a webhook event (cleanup)
 */
router.delete("/events/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await db
      .delete(webhookEventsTable)
      .where(eq(webhookEventsTable.id, id));

    res.json({ success: true, message: "Webhook event deleted" });
  } catch (error: any) {
    console.error("Error deleting webhook event:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /webhooks/events/:id/retry - Retry a failed webhook event
 */
router.post("/events/:id/retry", async (req, res) => {
  try {
    const { id } = req.params;

    const events = await db
      .select()
      .from(webhookEventsTable)
      .where(eq(webhookEventsTable.id, id))
      .limit(1);

    if (!events[0]) {
      res.status(404).json({ error: "Webhook event not found" });
      return;
    }

    const event = events[0];

    if (event.status !== "failed") {
      res.status(400).json({
        error: "Only failed events can be retried",
        currentStatus: event.status,
      });
      return;
    }

    // Reset to pending for retry
    await db
      .update(webhookEventsTable)
      .set({
        status: "pending",
        errorMessage: null,
        processedAt: new Date(),
      })
      .where(eq(webhookEventsTable.id, id));

    // Re-process the webhook
    const { WebhookHandlers } = await import("../webhookHandlers.js");
    // Note: This is a simplified retry - in production you'd need the original payload

    res.json({
      success: true,
      message: "Webhook event queued for retry",
    });
  } catch (error: any) {
    console.error("Error retrying webhook event:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /webhooks/stats - Get webhook statistics
 */
router.get("/stats", async (_req, res) => {
  try {
    const stats = await db.execute(sql`
      SELECT
        status,
        COUNT(*) as count,
        COUNT(DISTINCT type) as unique_types
      FROM webhook_events
      GROUP BY status
    `);

    const total = await db.execute(sql`SELECT COUNT(*) as count FROM webhook_events`);

    const last24Hours = await db.execute(sql`
      SELECT
        status,
        COUNT(*) as count
      FROM webhook_events
      WHERE created_at >= NOW() - INTERVAL '24 hours'
      GROUP BY status
    `);

    res.json({
      success: true,
      total: total.rows[0]?.count || 0,
      byStatus: stats.rows.map((r: any) => ({
        status: r.status,
        count: parseInt(r.count),
        uniqueTypes: parseInt(r.unique_types),
      })),
      last24Hours: last24Hours.rows.map((r: any) => ({
        status: r.status,
        count: parseInt(r.count),
      })),
    });
  } catch (error: any) {
    console.error("Error fetching webhook stats:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
