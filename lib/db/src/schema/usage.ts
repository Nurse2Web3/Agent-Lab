import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";

export const tokenUsageTable = pgTable("token_usage", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().default("default-user"),
  provider: text("provider").notNull(),
  model: text("model").notNull(),
  inputTokens: integer("input_tokens").notNull().default(0),
  outputTokens: integer("output_tokens").notNull().default(0),
  totalTokens: integer("total_tokens").notNull().default(0),
  // costCredits = cost in dollars * 10000 (tenths of cents, integer to avoid FP issues)
  costCredits: integer("cost_credits").notNull().default(0),
  comparisonId: integer("comparison_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const dailyUsageSummaryTable = pgTable("daily_usage_summary", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  date: text("date").notNull(), // "2026-04-09" format
  totalInputTokens: integer("total_input_tokens").notNull().default(0),
  totalOutputTokens: integer("total_output_tokens").notNull().default(0),
  totalTokens: integer("total_tokens").notNull().default(0),
  totalCostCredits: integer("total_cost_credits").notNull().default(0),
  comparisonCount: integer("comparison_count").notNull().default(0),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
