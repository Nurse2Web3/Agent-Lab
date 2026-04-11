import { pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const webhookEventsTable = pgTable("webhook_events", {
  id: text("id").primaryKey(), // Stripe event ID (e.g., "evt_1234567890")
  type: text("type").notNull(), // Event type (e.g., "customer.subscription.created")
  createdAt: timestamp("created_at").notNull(), // Stripe's event timestamp
  processedAt: timestamp("processed_at").notNull().defaultNow(), // When we processed it
  status: text("status").notNull().default("processed"), // "processed", "failed", "pending"
  errorMessage: text("error_message"),
  metadata: text("metadata"), // JSON stringified metadata
}, (table) => ({
  idx_created_at: uniqueIndex("idx_webhook_events_created_at").on(table.createdAt),
  idx_status: uniqueIndex("idx_webhook_events_status").on(table.status, table.createdAt),
}));

export const idempotencyKeysTable = pgTable("idempotency_keys", {
  key: text("key").primaryKey(), // Idempotency key (e.g., webhook event ID or client-provided key)
  resourceId: text("resource_id"), // ID of the created/updated resource
  status: text("status").notNull().default("pending"), // "pending", "completed", "failed"
  responseCode: integer("response_code"),
  responseBody: text("response_body"), // JSON stringified response
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at").notNull(), // Keys expire after 24 hours
}, (table) => ({
  idx_expires_at: uniqueIndex("idx_idempotency_keys_expires_at").on(table.expiresAt),
}));
