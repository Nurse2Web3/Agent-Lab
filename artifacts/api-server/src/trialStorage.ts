import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { randomUUID } from "crypto";

export interface TrialUser {
  id: string;
  email: string;
  emailVerified: boolean;
  cardVerified: boolean;
  setupIntentId: string | null;
  paymentMethodId: string | null;
  trialUsed: boolean;
  trialComparisonsUsed: number;
  deviceFingerprint: string | null;
  ipAddress: string | null;
  verificationToken: string | null;
  verificationExpiresAt: Date | null;
  createdAt: Date;
}

export type SignupLogAction =
  | "signup"
  | "verify"
  | "compare"
  | "blocked_disposable"
  | "blocked_device"
  | "blocked_trial_exhausted"
  | "blocked_not_verified"
  | "blocked_ip_reuse"
  | "suspicious";

export class TrialStorage {
  async createTrialUser(opts: {
    email: string;
    deviceFingerprint?: string;
    ipAddress?: string;
  }): Promise<TrialUser> {
    const verificationToken = randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    const result = await db.execute(sql`
      INSERT INTO trial_users (id, email, device_fingerprint, ip_address, verification_token, verification_expires_at)
      VALUES (${randomUUID()}, ${opts.email.toLowerCase().trim()}, ${opts.deviceFingerprint ?? null}, ${opts.ipAddress ?? null}, ${verificationToken}, ${expiresAt.toISOString()})
      ON CONFLICT (email) DO UPDATE
        SET device_fingerprint = COALESCE(trial_users.device_fingerprint, EXCLUDED.device_fingerprint),
            ip_address = COALESCE(trial_users.ip_address, EXCLUDED.ip_address),
            verification_token = CASE WHEN trial_users.email_verified THEN trial_users.verification_token ELSE EXCLUDED.verification_token END,
            verification_expires_at = CASE WHEN trial_users.email_verified THEN trial_users.verification_expires_at ELSE EXCLUDED.verification_expires_at END
      RETURNING *
    `);
    return this.rowToUser(result.rows[0]);
  }

  async getByEmail(email: string): Promise<TrialUser | null> {
    const result = await db.execute(sql`
      SELECT * FROM trial_users WHERE email = ${email.toLowerCase().trim()}
    `);
    if (!result.rows[0]) return null;
    return this.rowToUser(result.rows[0]);
  }

  async getById(id: string): Promise<TrialUser | null> {
    const result = await db.execute(sql`
      SELECT * FROM trial_users WHERE id = ${id}
    `);
    if (!result.rows[0]) return null;
    return this.rowToUser(result.rows[0]);
  }

  async getByToken(token: string): Promise<TrialUser | null> {
    const result = await db.execute(sql`
      SELECT * FROM trial_users WHERE verification_token = ${token}
    `);
    if (!result.rows[0]) return null;
    return this.rowToUser(result.rows[0]);
  }

  async getByDeviceFingerprint(fingerprint: string): Promise<TrialUser | null> {
    const result = await db.execute(sql`
      SELECT * FROM trial_users WHERE device_fingerprint = ${fingerprint} LIMIT 1
    `);
    if (!result.rows[0]) return null;
    return this.rowToUser(result.rows[0]);
  }

  async getVerifiedByDeviceFingerprint(fingerprint: string): Promise<TrialUser | null> {
    const browserFp = fingerprint.includes(":") ? fingerprint.split(":")[1] : fingerprint;
    const exactResult = await db.execute(sql`
      SELECT * FROM trial_users
      WHERE device_fingerprint = ${fingerprint} AND email_verified = true
      LIMIT 1
    `);
    if (exactResult.rows[0]) return this.rowToUser(exactResult.rows[0]);
    if (browserFp && browserFp !== fingerprint) {
      const partialResult = await db.execute(sql`
        SELECT * FROM trial_users
        WHERE device_fingerprint LIKE ${"%" + browserFp} AND email_verified = true
        LIMIT 1
      `);
      if (partialResult.rows[0]) return this.rowToUser(partialResult.rows[0]);
    }
    return null;
  }

  async saveSetupIntent(userId: string, setupIntentId: string): Promise<void> {
    await db.execute(sql`
      UPDATE trial_users SET setup_intent_id = ${setupIntentId} WHERE id = ${userId}
    `);
  }

  async activateCard(userId: string, paymentMethodId: string): Promise<TrialUser | null> {
    const result = await db.execute(sql`
      UPDATE trial_users
      SET card_verified = true, payment_method_id = ${paymentMethodId}
      WHERE id = ${userId}
      RETURNING *
    `);
    if (!result.rows[0]) return null;
    return this.rowToUser(result.rows[0]);
  }

  async getVerifiedByIp(ipAddress: string): Promise<TrialUser | null> {
    const result = await db.execute(sql`
      SELECT * FROM trial_users
      WHERE ip_address = ${ipAddress} AND email_verified = true
      LIMIT 1
    `);
    if (!result.rows[0]) return null;
    return this.rowToUser(result.rows[0]);
  }

  async verifyEmail(token: string): Promise<TrialUser | null> {
    const result = await db.execute(sql`
      UPDATE trial_users
      SET email_verified = true, verification_token = NULL, verification_expires_at = NULL
      WHERE verification_token = ${token}
        AND verification_expires_at > NOW()
        AND email_verified = false
      RETURNING *
    `);
    if (!result.rows[0]) return null;
    return this.rowToUser(result.rows[0]);
  }

  async incrementComparisons(userId: string): Promise<TrialUser | null> {
    const result = await db.execute(sql`
      UPDATE trial_users
      SET trial_comparisons_used = trial_comparisons_used + 1,
          trial_used = CASE WHEN trial_comparisons_used + 1 >= 3 THEN true ELSE trial_used END
      WHERE id = ${userId}
      RETURNING *
    `);
    if (!result.rows[0]) return null;
    return this.rowToUser(result.rows[0]);
  }

  async countRecentSignupsByIp(ipAddress: string, windowMs = 60 * 60 * 1000): Promise<number> {
    const since = new Date(Date.now() - windowMs).toISOString();
    const result = await db.execute(sql`
      SELECT COUNT(*) as cnt FROM trial_signup_log
      WHERE ip_address = ${ipAddress}
        AND action = 'signup'
        AND created_at > ${since}::timestamptz
    `);
    return parseInt((result.rows[0] as any)?.cnt ?? "0", 10);
  }

  async countRecentSignupsByDevice(deviceFingerprint: string, windowMs = 24 * 60 * 60 * 1000): Promise<number> {
    const since = new Date(Date.now() - windowMs).toISOString();
    const result = await db.execute(sql`
      SELECT COUNT(*) as cnt FROM trial_signup_log
      WHERE device_fingerprint = ${deviceFingerprint}
        AND action = 'signup'
        AND created_at > ${since}::timestamptz
    `);
    return parseInt((result.rows[0] as any)?.cnt ?? "0", 10);
  }

  async log(opts: {
    action: SignupLogAction;
    email?: string;
    ipAddress?: string;
    deviceFingerprint?: string;
    reason?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await db.execute(sql`
      INSERT INTO trial_signup_log (email, ip_address, device_fingerprint, action, reason, metadata)
      VALUES (
        ${opts.email ?? null},
        ${opts.ipAddress ?? null},
        ${opts.deviceFingerprint ?? null},
        ${opts.action},
        ${opts.reason ?? null},
        ${opts.metadata ? JSON.stringify(opts.metadata) : null}
      )
    `);
  }

  async getRecentLogs(limit = 100): Promise<any[]> {
    const result = await db.execute(sql`
      SELECT * FROM trial_signup_log ORDER BY created_at DESC LIMIT ${limit}
    `);
    return result.rows;
  }

  private rowToUser(row: any): TrialUser {
    return {
      id: row.id,
      email: row.email,
      emailVerified: row.email_verified,
      cardVerified: row.card_verified ?? false,
      setupIntentId: row.setup_intent_id ?? null,
      paymentMethodId: row.payment_method_id ?? null,
      trialUsed: row.trial_used,
      trialComparisonsUsed: row.trial_comparisons_used,
      deviceFingerprint: row.device_fingerprint ?? null,
      ipAddress: row.ip_address ?? null,
      verificationToken: row.verification_token ?? null,
      verificationExpiresAt: row.verification_expires_at ? new Date(row.verification_expires_at) : null,
      createdAt: new Date(row.created_at),
    };
  }
}

export const trialStorage = new TrialStorage();
