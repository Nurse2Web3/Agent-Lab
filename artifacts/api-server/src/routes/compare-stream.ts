import { Router, type IRouter } from "express";
import { callOpenAIStream, callClaudeStream, callGroqStream, callPerplexityStream } from "../lib/providers/index.js";
import { streamingProviderConfig } from "../lib/providers/config.js";
import { db } from "@workspace/db";
import { apiKeysTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { computeSummary } from "../lib/scoring.js";
import type { StreamingProviderResult } from "../lib/providers/types.js";

const router: IRouter = Router();

const ENV_KEY_MAP: Record<string, string> = {
  openai: "OPENAI_API_KEY",
  claude: "ANTHROPIC_API_KEY",
  grok: "XAI_API_KEY",
  perplexity: "PERPLEXITY_API_KEY",
};

async function getApiKey(provider: string): Promise<string | undefined> {
  try {
    const rows = await db.select().from(apiKeysTable).where(eq(apiKeysTable.provider, provider));
    if (rows[0]?.encryptedKey) return rows[0].encryptedKey;
  } catch {
  }
  const envKey = ENV_KEY_MAP[provider.toLowerCase()];
  return envKey ? process.env[envKey] : undefined;
}

router.post("/compare/stream", async (req, res) => {
  // Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const { prompt, systemPrompt, providers, temperature = 0.7 } = req.body as {
    prompt: string; systemPrompt?: string; providers: string[]; temperature?: number;
  };

  const send = (event: string, data: unknown) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  const finalResults: StreamingProviderResult[] = [];
  let completed = 0;

  const calls = providers.map(async (provider: string) => {
    const normalized = provider.toLowerCase();
    const apiKey = await getApiKey(normalized);
    const cfg = streamingProviderConfig[normalized];

    try {
      let streamFn;
      if (normalized === "openai") streamFn = callOpenAIStream;
      else if (normalized === "claude") streamFn = callClaudeStream;
      else if (normalized === "grok") streamFn = callGroqStream;
      else if (normalized === "perplexity") streamFn = callPerplexityStream;
      else throw new Error(`Unknown provider: ${normalized}`);

      const result = await streamFn({ prompt, systemPrompt, temperature, apiKey }, (partial: StreamingProviderResult) => {
        send("provider-update", partial);
      }, cfg);

      finalResults.push(result);
    } catch (err: any) {
      finalResults.push({
        provider: normalized,
        model: cfg?.defaultModel ?? "",
        text: "",
        isComplete: true,
        latencyMs: 0, ttftMs: 0,
        inputTokens: 0, outputTokens: 0, tokenCount: 0,
        estimatedCost: 0, dollarCost: "$0.000000",
        qualityScore: 0, clarityScore: 0, toneScore: 0, overallScore: 0,
        isDemo: false,
        error: err?.message ?? "Unknown error",
      });
    } finally {
      completed++;
      if (completed === providers.length) {
        const summary = computeSummary(finalResults as any);
        send("comparison-complete", summary);
        send("close", {});
        res.end();
      }
    }
  });

  // Fire and forget — response closed if client disconnects
  Promise.allSettled(calls);
});

export default router;
