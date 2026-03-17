import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { apiKeysTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { callGemini, callGroq, callKimi, callOpenAI, callClaude } from "../lib/providers/index.js";
import { computeSummary } from "../lib/scoring.js";
import type { ProviderResult } from "../lib/providers/types.js";

const router: IRouter = Router();

async function getApiKey(provider: string): Promise<string | undefined> {
  try {
    const rows = await db.select().from(apiKeysTable).where(eq(apiKeysTable.provider, provider));
    return rows[0]?.encryptedKey;
  } catch {
    return undefined;
  }
}

router.post("/compare", async (req, res) => {
  const { prompt, systemPrompt, providers, temperature = 0.7 } = req.body as {
    prompt: string;
    systemPrompt?: string;
    providers: string[];
    temperature?: number;
  };

  if (!prompt || !providers || providers.length === 0) {
    res.status(400).json({ error: "prompt and providers are required" });
    return;
  }

  const calls: Promise<ProviderResult>[] = [];

  for (const provider of providers) {
    const normalized = provider.toLowerCase();
    const apiKey = await getApiKey(normalized);
    const opts = { prompt, systemPrompt, temperature, apiKey };

    if (normalized === "gemini") {
      calls.push(callGemini(opts));
    } else if (normalized === "grok") {
      calls.push(callGroq(opts));
    } else if (normalized === "kimi") {
      calls.push(callKimi(opts));
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

  const summary = computeSummary(resolvedResults);
  res.json({ results: resolvedResults, ...summary });
});

export default router;
