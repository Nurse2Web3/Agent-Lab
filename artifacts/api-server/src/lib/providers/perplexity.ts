import { ProviderCallOptions, ProviderResult } from "./types.js";
import { computeScores } from "./utils.js";

const MODEL = "sonar-pro";
const BASE_URL = "https://api.perplexity.ai";

const INPUT_COST_PER_M  = 3.00;
const OUTPUT_COST_PER_M = 15.00;

function calcCost(inputTokens: number, outputTokens: number) {
  return (inputTokens * INPUT_COST_PER_M + outputTokens * OUTPUT_COST_PER_M) / 1_000_000;
}

function getMockPerplexityResponse(prompt: string): ProviderResult {
  return {
    provider: "Perplexity",
    model: MODEL,
    text: "Perplexity AI provides real-time, web-grounded answers with citations. To use this provider, add your Perplexity API key in Settings.",
    latencyMs: 900,
    estimatedCost: 0.0003,
    tokenCount: 60,
    qualityScore: 85,
    clarityScore: 88,
    toneScore: 84,
    overallScore: 86,
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
