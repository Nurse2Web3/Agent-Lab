import { db } from "@workspace/db";
import { webhookEventsTable, idempotencyKeysTable } from "@workspace/db/schema";
import { eq, and, gt, sql } from "drizzle-orm";

export interface IdempotencyResult {
  shouldProcess: boolean;
  cachedResponse?: any;
  resourceId?: string;
}

/**
 * Check if a webhook event has already been processed (idempotency check)
 * Returns the cached response if already processed, preventing duplicate processing
 */
export async function checkIdempotency(
  eventId: string,
  eventType: string,
  eventCreatedAt: Date
): Promise<IdempotencyResult> {
  const now = new Date();

  try {
    // Check if this webhook event was already processed
    const existingEvent = await db
      .select()
      .from(webhookEventsTable)
      .where(eq(webhookEventsTable.id, eventId))
      .limit(1);

    if (existingEvent[0]) {
      const event = existingEvent[0];

      // Already processed successfully - return cached result
      if (event.status === "processed") {
        return {
          shouldProcess: false,
          cachedResponse: event.metadata ? JSON.parse(event.metadata) : undefined,
          resourceId: undefined,
        };
      }

      // Previously failed - allow retry after 5 minutes
      if (event.status === "failed") {
        const failedAt = new Date(event.processedAt);
        const retryAfter = new Date(failedAt.getTime() + 5 * 60 * 1000);
        if (now >= retryAfter) {
          return { shouldProcess: true };
        }
        return {
          shouldProcess: false,
          cachedResponse: { error: event.errorMessage },
        };
      }

      // Pending - another request is processing this event
      if (event.status === "pending") {
        const pendingSince = new Date(event.processedAt);
        const staleAfter = new Date(pendingSince.getTime() + 10 * 60 * 1000);

        // If pending for > 10 minutes, consider it stale and allow retry
        if (now >= staleAfter) {
          return { shouldProcess: true };
        }

        return { shouldProcess: false };
      }
    }

    // Mark event as pending processing
    await db.insert(webhookEventsTable).values({
      id: eventId,
      type: eventType,
      createdAt: eventCreatedAt,
      processedAt: now,
      status: "pending",
    }).onConflictDoNothing();

    return { shouldProcess: true };
  } catch (error) {
    console.error("Idempotency check error:", error);
    // Fail open - allow processing but log the error
    return { shouldProcess: true };
  }
}

/**
 * Mark a webhook event as successfully processed
 */
export async function markWebhookProcessed(
  eventId: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    await db
      .update(webhookEventsTable)
      .set({
        status: "processed",
        metadata: metadata ? JSON.stringify(metadata) : null,
        processedAt: new Date(),
      })
      .where(eq(webhookEventsTable.id, eventId));
  } catch (error) {
    console.error("Error marking webhook as processed:", error);
  }
}

/**
 * Mark a webhook event as failed
 */
export async function markWebhookFailed(
  eventId: string,
  errorMessage: string
): Promise<void> {
  try {
    await db
      .update(webhookEventsTable)
      .set({
        status: "failed",
        errorMessage,
        processedAt: new Date(),
      })
      .where(eq(webhookEventsTable.id, eventId));
  } catch (error) {
    console.error("Error marking webhook as failed:", error);
  }
}

/**
 * Check idempotency for general API requests (not just webhooks)
 * Uses client-provided idempotency key
 */
export async function checkIdempotencyKey(
  idempotencyKey: string,
  ttlSeconds: number = 24 * 60 * 60 // 24 hours default
): Promise<IdempotencyResult> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);

  try {
    // Clean up expired keys
    await db
      .delete(idempotencyKeysTable)
      .where(eq(idempotencyKeysTable.expiresAt, new Date(now.toISOString())));

    const existing = await db
      .select()
      .from(idempotencyKeysTable)
      .where(eq(idempotencyKeysTable.key, idempotencyKey))
      .limit(1);

    if (existing[0]) {
      const key = existing[0];

      // Already completed - return cached response
      if (key.status === "completed" && key.responseBody) {
        return {
          shouldProcess: false,
          cachedResponse: JSON.parse(key.responseBody),
          resourceId: key.resourceId || undefined,
        };
      }

      // Failed - allow retry
      if (key.status === "failed") {
        return { shouldProcess: true };
      }

      // Pending - another request is processing
      return { shouldProcess: false };
    }

    // Create new idempotency key record
    await db.insert(idempotencyKeysTable).values({
      key: idempotencyKey,
      status: "pending",
      expiresAt,
    });

    return { shouldProcess: true };
  } catch (error) {
    console.error("Idempotency key check error:", error);
    return { shouldProcess: true };
  }
}

/**
 * Mark an idempotency key as completed with response
 */
export async function markIdempotencyKeyCompleted(
  idempotencyKey: string,
  responseCode: number,
  responseBody: any,
  resourceId?: string
): Promise<void> {
  try {
    await db
      .update(idempotencyKeysTable)
      .set({
        status: "completed",
        responseCode,
        responseBody: JSON.stringify(responseBody),
        resourceId: resourceId || null,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      })
      .where(eq(idempotencyKeysTable.key, idempotencyKey));
  } catch (error) {
    console.error("Error marking idempotency key as completed:", error);
  }
}

/**
 * Mark an idempotency key as failed
 */
export async function markIdempotencyKeyFailed(
  idempotencyKey: string,
  errorMessage: string
): Promise<void> {
  try {
    await db
      .update(idempotencyKeysTable)
      .set({
        status: "failed",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      })
      .where(eq(idempotencyKeysTable.key, idempotencyKey));
  } catch (error) {
    console.error("Error marking idempotency key as failed:", error);
  }
}

/**
 * Express middleware for idempotency key validation
 * Expects Idempotency-Key header
 */
export function idempotencyMiddleware() {
  return async (req: any, res: any, next: any) => {
    const idempotencyKey = req.headers["idempotency-key"];

    if (!idempotencyKey) {
      return next(); // No key provided, proceed normally
    }

    const result = await checkIdempotencyKey(idempotencyKey);

    if (!result.shouldProcess) {
      if (result.cachedResponse) {
        // Return cached response
        res.status(res.statusCode || 200).json(result.cachedResponse);
        return;
      }
      // Another request is processing - return 409 Conflict
      res.status(409).json({
        error: "Request is being processed by another client",
        retryAfter: 5,
      });
      return;
    }

    // Store original json method
    const originalJson = res.json.bind(res);

    // Intercept response to cache it
    res.json = (body: any) => {
      markIdempotencyKeyCompleted(idempotencyKey, res.statusCode, body);
      return originalJson(body);
    };

    next();
  };
}
