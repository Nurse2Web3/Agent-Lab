import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { apiKeysTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { callGroq, callOpenAI, callClaude } from "../lib/providers/index.js";
import { computeSummary } from "../lib/scoring.js";
import { trialStorage } from "../trialStorage.js";
import { billingStorage } from "../billingStorage.js";
import type { ProviderResult } from "../lib/providers/types.js";

const router: IRouter = Router();

const BASE_USER_ID = "default-user";
const TRIAL_PROVIDER_ALLOWLIST = new Set(["openai", "claude"]);
const PRO_PROVIDER_ALLOWLIST   = new Set(["openai", "claude", "grok"]);
const TRIAL_LIMIT = 3;
const MONTHLY_LIMITS: Record<string, number> = { pro: 100, studio: 500 };

async function getApiKey(provider: string): Promise<string | undefined> {
  try {
    const rows = await db.select().from(apiKeysTable).where(eq(apiKeysTable.provider, provider));
    return rows[0]?.encryptedKey;
  } catch {
    return undefined;
  }
}

router.post("/compare", async (req, res) => {
  const { prompt, systemPrompt, providers, temperature = 0.7, trialUserId } = req.body as {
    prompt: string;
    systemPrompt?: string;
    providers: string[];
    temperature?: number;
    trialUserId?: string;
  };

  if (!prompt || !providers || providers.length === 0) {
    res.status(400).json({ error: "prompt and providers are required" });
    return;
  }

  const plan = await billingStorage.getPlan(BASE_USER_ID);

  if (plan === "sandbox") {
    if (!trialUserId) {
      res.status(403).json({
        error: "A verified trial account is required to run comparisons.",
        requiresTrialSignup: true,
      });
      return;
    }

    const trialUser = await trialStorage.getById(trialUserId);
    if (!trialUser) {
      res.status(403).json({
        error: "Trial account not found. Please sign up for a trial.",
        requiresTrialSignup: true,
      });
      return;
    }
    if (!trialUser.emailVerified) {
      res.status(403).json({
        error: "Please verify your email before running comparisons.",
        requiresEmailVerification: true,
      });
      return;
    }
    if (trialUser.trialComparisonsUsed >= TRIAL_LIMIT) {
      res.status(403).json({
        error: "Your trial comparisons are exhausted. Please upgrade to continue.",
        trialExhausted: true,
      });
      return;
    }

    const normalizedProviders = providers.map((p) => p.toLowerCase());
    const disallowed = normalizedProviders.filter((p) => !TRIAL_PROVIDER_ALLOWLIST.has(p));
    if (disallowed.length > 0) {
      res.status(403).json({
        error: `Trial accounts can only use GPT and Claude. Upgrade to Pro to unlock GROK THE ELON MODEL 🥇: ${disallowed.join(", ")}.`,
        requiresUpgrade: true,
      });
      return;
    }
  } else if (plan === "pro" || plan === "studio") {
    const normalizedProviders = providers.map((p) => p.toLowerCase());
    if (plan === "pro") {
      const disallowed = normalizedProviders.filter((p) => !PRO_PROVIDER_ALLOWLIST.has(p));
      if (disallowed.length > 0) {
        res.status(403).json({
          error: `Upgrade to Premium to access: ${disallowed.join(", ")}.`,
          requiresUpgrade: true,
        });
        return;
      }
    }
    const monthlyLimit = MONTHLY_LIMITS[plan];
    if (monthlyLimit !== undefined) {
      await billingStorage.ensureUser(BASE_USER_ID);
      const { used } = await billingStorage.getMonthlyUsage(BASE_USER_ID);
      if (used >= monthlyLimit) {
        res.status(429).json({
          error: `Monthly comparison limit reached (${monthlyLimit}). Resets at the start of next month.`,
          limitReached: true,
        });
        return;
      }
    }
  }

  const calls: Promise<ProviderResult>[] = [];

  for (const provider of providers) {
    const normalized = provider.toLowerCase();
    const apiKey = await getApiKey(normalized);
    const opts = { prompt, systemPrompt, temperature, apiKey };

    if (normalized === "grok") {
      calls.push(callGroq(opts));
    } else if (normalized === "openai") {
      calls.push(callOpenAI(opts));
    } else if (normalized === "claude") {
      calls.push(callClaude(opts));
    }
  }

  const results = await Promise.allSettled(calls);
  const resolvedResults: ProviderResult[] = results.map((r, i) => {
    if (r.status === "fulfilled") return r.value;
    const providerName = providers[i]?.toLowerCase() ?? "unknown";
    return {
      provider: providerName,
      model: "",
      text: "",
      latencyMs: 0,
      estimatedCost: 0,
      tokenCount: 0,
      qualityScore: 0,
      clarityScore: 0,
      toneScore: 0,
      overallScore: 0,
      isDemo: true,
      error: `Provider failed: ${r.reason}`,
    } as ProviderResult;
  });

  if (plan === "sandbox" && trialUserId) {
    await trialStorage.incrementComparisons(trialUserId);
    await trialStorage.log({
      action: "compare",
      email: (await trialStorage.getById(trialUserId))?.email,
      deviceFingerprint: (await trialStorage.getById(trialUserId))?.deviceFingerprint ?? undefined,
    });
  } else if (plan === "pro" || plan === "studio") {
    await billingStorage.incrementMonthlyUsage(BASE_USER_ID);
  }

  const summary = computeSummary(resolvedResults);
  res.json({ results: resolvedResults, ...summary });
});

export default router;
