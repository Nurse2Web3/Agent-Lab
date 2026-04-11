import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { getCircuitBreakerStatus } from "../lib/circuitBreaker.js";
import { getRateLimitStatus } from "../middleware/tieredRateLimiter.js";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

router.get("/circuit-breaker/status", (_req, res) => {
  const status = getCircuitBreakerStatus();
  res.json({ success: true, data: status });
});

router.get("/rate-limit/status", async (req, res) => {
  const userId = req.query.userId as string || "default-user";
  const tier = (req.query.tier as string) || "trial";

  if (!["trial", "pro", "studio"].includes(tier)) {
    res.status(400).json({ error: "Invalid tier. Must be trial, pro, or studio." });
    return;
  }

  const status = await getRateLimitStatus(userId, tier as "trial" | "pro" | "studio");
  res.json({ success: true, data: status });
});

router.get("/webhooks/stats", async (_req, res) => {
  try {
    const { db } = await import("@workspace/db");
    const { sql } = await import("drizzle-orm");

    const stats = await db.execute(sql`
      SELECT
        status,
        COUNT(*) as count
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
      })),
      last24Hours: last24Hours.rows.map((r: any) => ({
        status: r.status,
        count: parseInt(r.count),
      })),
    });
  } catch (error: any) {
    // webhook_events table may not exist yet
    res.json({
      success: true,
      total: 0,
      byStatus: [],
      last24Hours: [],
      note: "Webhook events table not yet created",
    });
  }
});

export default router;
