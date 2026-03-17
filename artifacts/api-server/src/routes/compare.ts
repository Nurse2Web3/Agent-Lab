import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { apiKeysTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { callGemini, callHuggingFace, callGroq } from "../lib/providers/index.js";
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
    const apiKey = await getApiKey(provider);
    const opts = { prompt, systemPrompt, temperature, apiKey };

    if (provider === "gemini") {
      calls.push(callGemini(opts));
    } else if (provider === "huggingface") {
      calls.push(callHuggingFace(opts));
    } else if (provider === "grok") {
      calls.push(callGroq(opts));
    }
  }

  const results = await Promise.all(calls);
  const summary = computeSummary(results);

  res.json({ results, ...summary });
});

export default router;
