import { Request, Response, NextFunction } from "express";
import { db } from "@workspace/db";
import { rateLimitsTable, rateLimitConfigsTable } from "@workspace/db/schema";
import { eq, and, gte, sql } from "drizzle-orm";

export interface TieredRateLimitConfig {
  tier: "trial" | "pro" | "studio";
  windowMinutes: number;
  maxRequests: number;
}

const DEFAULT_CONFIGS: TieredRateLimitConfig[] = [
  { tier: "trial", windowMinutes: 60, maxRequests: 5 },    // 5 requests per hour
  { tier: "pro", windowMinutes: 60, maxRequests: 30 },     // 30 requests per hour
  { tier: "studio", windowMinutes: 60, maxRequests: 100 }, // 100 requests per hour
];

async function initializeConfigs(): Promise<void> {
  for (const config of DEFAULT_CONFIGS) {
    await db
      .insert(rateLimitConfigsTable)
      .values({
        tier: config.tier,
        windowMinutes: config.windowMinutes,
        maxRequests: config.maxRequests,
        description: `${config.maxRequests} requests per ${config.windowMinutes} minutes`,
      })
      .onConflictDoUpdate({
        target: rateLimitConfigsTable.tier,
        set: {
          windowMinutes: config.windowMinutes,
          maxRequests: config.maxRequests,
          updatedAt: new Date(),
        },
      })
      .catch(() => {}); // Silently fail if table doesn't exist yet
  }
}

// Initialize configs on module load
initializeConfigs();

export async function getConfigForTier(tier: string): Promise<TieredRateLimitConfig | null> {
  try {
    const rows = await db
      .select()
      .from(rateLimitConfigsTable)
      .where(eq(rateLimitConfigsTable.tier, tier))
      .limit(1);

    if (rows[0]) {
      return {
        tier: rows[0].tier as TieredRateLimitConfig["tier"],
        windowMinutes: rows[0].windowMinutes,
        maxRequests: rows[0].maxRequests,
      };
    }
  } catch (error) {
    console.error("Error fetching rate limit config:", error);
  }

  // Fallback to defaults
  return DEFAULT_CONFIGS.find((c) => c.tier === tier) || null;
}

export async function checkRateLimit(
  userId: string,
  tier: "trial" | "pro" | "studio"
): Promise<{ allowed: boolean; remaining: number; resetAt: Date; retryAfter?: number }> {
  const config = await getConfigForTier(tier);
  if (!config) {
    return { allowed: true, remaining: Infinity, resetAt: new Date() };
  }

  const now = new Date();
  const windowStart = new Date(now.getTime() - config.windowMinutes * 60 * 1000);

  try {
    // Try to get existing window record
    const existing = await db
      .select()
      .from(rateLimitsTable)
      .where(
        and(
          eq(rateLimitsTable.userId, userId),
          eq(rateLimitsTable.tier, tier),
          gte(rateLimitsTable.windowStart, windowStart)
        )
      )
      .limit(1);

    if (existing[0]) {
      const record = existing[0];
      const resetAt = new Date(record.windowStart.getTime() + config.windowMinutes * 60 * 1000);

      if (record.requestCount >= config.maxRequests) {
        const retryAfter = Math.ceil((resetAt.getTime() - now.getTime()) / 1000);
        return {
          allowed: false,
          remaining: 0,
          resetAt,
          retryAfter: Math.max(0, retryAfter),
        };
      }

      // Increment counter
      await db
        .update(rateLimitsTable)
        .set({
          requestCount: record.requestCount + 1,
          updatedAt: now,
        })
        .where(eq(rateLimitsTable.id, record.id));

      return {
        allowed: true,
        remaining: config.maxRequests - record.requestCount - 1,
        resetAt,
      };
    } else {
      // Create new window record
      await db.insert(rateLimitsTable).values({
        userId,
        tier,
        windowStart: now,
        windowEnd: new Date(now.getTime() + config.windowMinutes * 60 * 1000),
        requestCount: 1,
        limit: config.maxRequests,
      });

      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetAt: new Date(now.getTime() + config.windowMinutes * 60 * 1000),
      };
    }
  } catch (error) {
    console.error("Error checking rate limit:", error);
    // Fail open - allow the request but log the error
    return { allowed: true, remaining: Infinity, resetAt: new Date() };
  }
}

export function getClientIp(req: Request): string {
  const xff = req.headers["x-forwarded-for"];
  if (xff) {
    const ips = Array.isArray(xff) ? xff[0] : xff;
    return ips.split(",")[0].trim();
  }
  return req.socket?.remoteAddress ?? "unknown";
}

export function createTieredRateLimiter() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.body?.trialUserId || getClientIp(req);
    const tier = req.body?.tier || "trial";

    const result = await checkRateLimit(userId, tier as "trial" | "pro" | "studio");

    // Set rate limit headers
    res.set("X-RateLimit-Limit", String(result.remaining + (result.allowed ? 0 : 1)));
    res.set("X-RateLimit-Remaining", String(Math.max(0, result.remaining)));
    res.set("X-RateLimit-Reset", String(Math.floor(result.resetAt.getTime() / 1000)));

    if (!result.allowed) {
      res.set("Retry-After", String(result.retryAfter || 60));
      res.status(429).json({
        error: "Rate limit exceeded. Please try again later.",
        retryAfter: result.retryAfter,
        resetAt: result.resetAt.toISOString(),
      });
      return;
    }

    next();
  };
}

export async function getRateLimitStatus(userId: string, tier: "trial" | "pro" | "studio") {
  const config = await getConfigForTier(tier);
  if (!config) {
    return null;
  }

  const now = new Date();
  const windowStart = new Date(now.getTime() - config.windowMinutes * 60 * 1000);

  const existing = await db
    .select()
    .from(rateLimitsTable)
    .where(
      and(
        eq(rateLimitsTable.userId, userId),
        eq(rateLimitsTable.tier, tier),
        gte(rateLimitsTable.windowStart, windowStart)
      )
    )
    .limit(1);

  if (existing[0]) {
    const record = existing[0];
    const resetAt = new Date(record.windowStart.getTime() + config.windowMinutes * 60 * 1000);
    return {
      tier,
      limit: config.maxRequests,
      used: record.requestCount,
      remaining: Math.max(0, config.maxRequests - record.requestCount),
      resetAt: resetAt.toISOString(),
      windowMinutes: config.windowMinutes,
    };
  }

  return {
    tier,
    limit: config.maxRequests,
    used: 0,
    remaining: config.maxRequests,
    resetAt: new Date(now.getTime() + config.windowMinutes * 60 * 1000).toISOString(),
    windowMinutes: config.windowMinutes,
  };
}
