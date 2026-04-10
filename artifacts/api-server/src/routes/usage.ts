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

export default router;
