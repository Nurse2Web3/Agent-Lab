import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { tokenUsageTable, dailyUsageSummaryTable } from "@workspace/db/schema";
import { eq, sql, and, desc } from "drizzle-orm";

const router: IRouter = Router();
const BASE_USER_ID = "default-user";

router.get("/usage/summary", async (_req, res) => {
  const today = new Date().toISOString().split("T")[0];
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const [dailyRows, weeklyRows, monthlyRows, allTimeRows] = await Promise.all([
    db.execute(sql`SELECT * FROM daily_usage_summary WHERE user_id = ${BASE_USER_ID} AND date = ${today}`),
    db.execute(sql`SELECT COALESCE(SUM(total_cost_credits),0) as cost, COALESCE(SUM(total_tokens),0) as tokens, COALESCE(SUM(comparison_count),0) as comparisons FROM daily_usage_summary WHERE user_id = ${BASE_USER_ID} AND date >= ${weekAgo}`),
    db.execute(sql`SELECT COALESCE(SUM(total_cost_credits),0) as cost, COALESCE(SUM(total_tokens),0) as tokens, COALESCE(SUM(comparison_count),0) as comparisons FROM daily_usage_summary WHERE user_id = ${BASE_USER_ID} AND date >= ${monthAgo}`),
    db.execute(sql`SELECT COALESCE(SUM(total_cost_credits),0) as cost, COALESCE(SUM(total_tokens),0) as tokens, COALESCE(SUM(comparison_count),0) as comparisons FROM daily_usage_summary WHERE user_id = ${BASE_USER_ID}`),
  ]);

  const todayRow = dailyRows.rows[0];
  res.json({
    today: {
      costCredits: todayRow?.total_cost_credits ?? 0,
      totalTokens: todayRow?.total_tokens ?? 0,
      comparisons: todayRow?.comparison_count ?? 0,
    },
    thisWeek: weeklyRows.rows[0] ?? { cost: 0, tokens: 0, comparisons: 0 },
    thisMonth: monthlyRows.rows[0] ?? { cost: 0, tokens: 0, comparisons: 0 },
    allTime: allTimeRows.rows[0] ?? { cost: 0, tokens: 0, comparisons: 0 },
  });
});

router.get("/usage/daily", async (req, res) => {
  const { from, to } = req.query as { from?: string; to?: string };
  const rows = await db
    .select()
    .from(dailyUsageSummaryTable)
    .where(eq(dailyUsageSummaryTable.userId, BASE_USER_ID))
    .orderBy(desc(dailyUsageSummaryTable.date))
    .limit(90);
  const filtered = rows.filter(r => {
    if (from && r.date < from) return false;
    if (to && r.date > to) return false;
    return true;
  });
  res.json({ items: filtered });
});

router.get("/usage/export", async (req, res) => {
  const { from, to } = req.query as { from?: string; to?: string };
  const rows = await db
    .select()
    .from(dailyUsageSummaryTable)
    .where(eq(dailyUsageSummaryTable.userId, BASE_USER_ID))
    .orderBy(dailyUsageSummaryTable.date);

  const filtered = rows.filter(r => {
    if (from && r.date < from) return false;
    if (to && r.date > to) return false;
    return true;
  });

  const csv = [
    "Date,Input Tokens,Output Tokens,Total Tokens,Cost (credits),Comparisons",
    ...filtered.map(r =>
      `${r.date},${r.totalInputTokens},${r.totalOutputTokens},${r.totalTokens},${r.totalCostCredits},${r.comparisonCount}`
    ),
  ].join("\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="agentlab-usage-${from ?? "start"}-${to ?? "end"}.csv"`);
  res.send(csv);
});

router.get("/usage/by-provider", async (req, res) => {
  const rows = await db.execute(sql`
    SELECT
      provider,
      SUM(input_tokens) as total_input,
      SUM(output_tokens) as total_output,
      SUM(total_tokens) as total_tokens,
      SUM(cost_credits) as total_cost,
      COUNT(*) as comparison_count
    FROM token_usage
    WHERE user_id = ${BASE_USER_ID}
    GROUP BY provider
    ORDER BY total_cost DESC
  `);
  res.json({ items: rows.rows });
});

/**
 * GET /usage/cumulative-cost - Cumulative cost dashboard data
 * Returns cumulative costs over time for charting
 */
router.get("/usage/cumulative-cost", async (req, res) => {
  const { days } = req.query as { days?: string };
  const daysToFetch = Math.min(parseInt(days || "30"), 90); // Max 90 days

  const rows = await db.execute(sql`
    SELECT
      date,
      total_cost_credits,
      SUM(total_cost_credits) OVER (ORDER BY date) as cumulative_cost,
      total_tokens,
      SUM(total_tokens) OVER (ORDER BY date) as cumulative_tokens,
      comparison_count,
      SUM(comparison_count) OVER (ORDER BY date) as cumulative_comparisons
    FROM daily_usage_summary
    WHERE user_id = ${BASE_USER_ID}
      AND date >= ${new Date(Date.now() - daysToFetch * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}
    ORDER BY date ASC
  `);

  res.json({
    items: rows.rows.map((r: any) => ({
      date: r.date,
      dailyCost: r.total_cost_credits,
      cumulativeCost: r.cumulative_cost,
      dailyTokens: r.total_tokens,
      cumulativeTokens: r.cumulative_tokens,
      dailyComparisons: r.comparison_count,
      cumulativeComparisons: r.cumulative_comparisons,
    })),
  });
});

/**
 * GET /usage/cost-breakdown - Cost breakdown by provider and model
 */
router.get("/usage/cost-breakdown", async (req, res) => {
  const { days } = req.query as { days?: string };
  const daysToFetch = Math.min(parseInt(days || "30"), 90);
  const sinceDate = new Date(Date.now() - daysToFetch * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const rows = await db.execute(sql`
    SELECT
      provider,
      model,
      SUM(input_tokens) as total_input,
      SUM(output_tokens) as total_output,
      SUM(total_tokens) as total_tokens,
      SUM(cost_credits) as total_cost,
      COUNT(*) as comparison_count,
      AVG(cost_credits) as avg_cost_per_comparison
    FROM token_usage
    WHERE user_id = ${BASE_USER_ID}
      AND created_at >= ${sinceDate}
    GROUP BY provider, model
    ORDER BY total_cost DESC
  `);

  res.json({ items: rows.rows });
});

/**
 * GET /usage/cost-trend - Cost trend analysis (day over day)
 */
router.get("/usage/cost-trend", async (req, res) => {
  const { days } = req.query as { days?: string };
  const daysToFetch = Math.min(parseInt(days || "14"), 30);

  const rows = await db.execute(sql`
    SELECT
      date,
      total_cost_credits,
      LAG(total_cost_credits) OVER (ORDER BY date) as prev_day_cost,
      CASE
        WHEN LAG(total_cost_credits) OVER (ORDER BY date) > 0
        THEN ROUND(((total_cost_credits - LAG(total_cost_credits) OVER (ORDER BY date)) * 100.0 / LAG(total_cost_credits) OVER (ORDER BY date)), 2)
        ELSE 0
      END as percent_change
    FROM daily_usage_summary
    WHERE user_id = ${BASE_USER_ID}
      AND date >= ${new Date(Date.now() - daysToFetch * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}
    ORDER BY date ASC
  `);

  res.json({
    items: rows.rows.map((r: any) => ({
      date: r.date,
      cost: r.total_cost_credits,
      prevDayCost: r.prev_day_cost,
      percentChange: r.percent_change,
    })),
  });
});

export default router;
