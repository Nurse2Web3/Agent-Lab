import { pgTable, text, serial, integer, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";

export const rateLimitsTable = pgTable("rate_limits", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  tier: text("tier").notNull(), // "trial", "pro", "studio"
  windowStart: timestamp("window_start").notNull(),
  windowEnd: timestamp("window_end").notNull(),
  requestCount: integer("request_count").notNull().default(0),
  limit: integer("limit").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  idx_user_tier: index("idx_rate_limits_user_tier").on(table.userId, table.tier),
  idx_window_start: index("idx_rate_limits_window_start").on(table.windowStart),
  idx_user_tier_window: uniqueIndex("idx_rate_limits_user_tier_window").on(table.userId, table.tier, table.windowStart),
}));

export const rateLimitConfigsTable = pgTable("rate_limit_configs", {
  id: serial("id").primaryKey(),
  tier: text("tier").notNull().unique(),
  windowMinutes: integer("window_minutes").notNull(),
  maxRequests: integer("max_requests").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
