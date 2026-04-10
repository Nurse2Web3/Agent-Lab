import { ProviderCallOptions, ProviderResult, StreamCallback, StreamingProviderResult } from "./types.js";
import { computeScores, estimateTokens } from "./utils.js";

const MODEL = "sonar-pro";
const BASE_URL = "https://api.perplexity.ai";

const INPUT_COST_PER_M  = 3.00;
const OUTPUT_COST_PER_M = 15.00;

function calcCost(inputTokens: number, outputTokens: number) {
  return (inputTokens * INPUT_COST_PER_M + outputTokens * OUTPUT_COST_PER_M) / 1_000_000;
}

function getMockPerplexityResponse(prompt: string): ProviderResult {
  const INPUT_COST_PER_M = 3.00;
  const OUTPUT_COST_PER_M = 15.00;
  const text = "Perplexity AI provides real-time, web-grounded answers with citations. To use this provider, add your Perplexity API key in Settings.";
  const latencyMs = 900;
  const inputTokens = Math.round(prompt.split(" ").length * 0.9);
  const outputTokens = Math.round(text.split(" ").length * 0.4);
  const tokenCount = inputTokens + outputTokens;
  const rawCost = (inputTokens * INPUT_COST_PER_M + outputTokens * OUTPUT_COST_PER_M) / 1_000_000;
  const estimatedCost = Math.round(rawCost * 10000) / 10000;
  const dollarCost = `$${rawCost.toFixed(6)}`;
  const qualityScore = 85;
  const clarityScore = 88;
  const toneScore = 84;
  const overallScore = 86;
  const costPerQuality = overallScore > 0 ? rawCost / overallScore : 0;
  return {
    provider: "Perplexity",
    model: MODEL,
    text,
    latencyMs,
    inputTokens,
    outputTokens,
    tokenCount,
    estimatedCost,
    dollarCost,
    costPerQuality,
    qualityScore,
    clarityScore,
    toneScore,
    overallScore,
    isDemo: true,
  };
}

export async function callPerplexity(options: ProviderCallOptions): Promise<ProviderResult> {
  const { prompt, systemPrompt, temperature = 0.7, apiKey } = options;

  if (!apiKey) {
    return getMockPerplexityResponse(prompt);
  }

  const start = Date.now();
  try {
    const messages: { role: string; content: string }[] = [];
    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt });
    }
    messages.push({ role: "user", content: prompt });

    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json() as {
      choices?: { message?: { content?: string } }[];
      usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
    };

    const text = data.choices?.[0]?.message?.content ?? "";
    const inputTokens  = data.usage?.prompt_tokens    ?? Math.round(text.split(" ").length * 0.9);
    const outputTokens = data.usage?.completion_tokens ?? Math.round(text.split(" ").length * 0.4);
    const tokenCount   = inputTokens + outputTokens;
    const latencyMs    = Date.now() - start;
    const rawCost      = calcCost(inputTokens, outputTokens);
    const estimatedCost = Math.round(rawCost * 10000) / 10000;
    const dollarCost    = `$${rawCost.toFixed(6)}`;
    const scores        = computeScores(text, "perplexity");
    const costPerQuality = scores.overall > 0 ? rawCost / scores.overall : 0;

    return {
      provider: "Perplexity",
      model: MODEL,
      text,
      latencyMs,
      inputTokens,
      outputTokens,
      tokenCount,
      estimatedCost,
      dollarCost,
      costPerQuality,
      qualityScore: scores.quality,
      clarityScore: scores.clarity,
      toneScore:    scores.tone,
      overallScore: scores.overall,
      isDemo: false,
    };
  } catch (err) {
    console.error("Perplexity error:", err);
    return { ...getMockPerplexityResponse(prompt), isDemo: true };
  }
}

const PERPLEXITY_INPUT_COST_PER_M = 3.00;
const PERPLEXITY_OUTPUT_COST_PER_M = 15.00;

function perplexityCalcCost(inputTokens: number, outputTokens: number) {
  return (inputTokens * PERPLEXITY_INPUT_COST_PER_M + outputTokens * PERPLEXITY_OUTPUT_COST_PER_M) / 1_000_000;
}

export async function callPerplexityStream(
  opts: { prompt: string; systemPrompt?: string; temperature?: number; apiKey?: string },
  onChunk: StreamCallback,
  cfg: { defaultModel: string },
): Promise<StreamingProviderResult> {
  const { prompt, systemPrompt, temperature = 0.7, apiKey } = opts;
  const start = Date.now();
  let ttftMs = 0;
  let accumulated = "";

  const messages: { role: string; content: string }[] = [];
  if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
  messages.push({ role: "user", content: prompt });

  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, messages, temperature, max_tokens: 1024, stream: true }),
  });

  if (!response.body) throw new Error("No response body");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  const base: StreamingProviderResult = {
    provider: "perplexity", model: MODEL, text: "", isComplete: false,
    latencyMs: 0, ttftMs: 0, inputTokens: 0, outputTokens: 0, tokenCount: 0,
    estimatedCost: 0, dollarCost: "$0.000000",
    qualityScore: 0, clarityScore: 0, toneScore: 0, overallScore: 0, isDemo: false,
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    for (const line of chunk.split("\n")) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6);
      if (data === "[DONE]") continue;
      try {
        const token = JSON.parse(data).choices?.[0]?.delta?.content;
        if (token) {
          if (ttftMs === 0) ttftMs = Date.now() - start;
          accumulated += token;
          onChunk({ ...base, text: accumulated, ttftMs, latencyMs: Date.now() - start });
        }
      } catch {}
    }
  }

  const tokens = estimateTokens(accumulated);
  const rawCost = perplexityCalcCost(tokens.input, tokens.output);
  const scores = computeScores(accumulated, "perplexity");
  const final: StreamingProviderResult = {
    ...base, ...scores,
    text: accumulated, isComplete: true, latencyMs: Date.now() - start, ttftMs,
    inputTokens: tokens.input, outputTokens: tokens.output, tokenCount: tokens.total,
    estimatedCost: Math.round(rawCost * 10000) / 10000, dollarCost: `$${rawCost.toFixed(6)}`,
  };
  onChunk(final);
  return final;
}
