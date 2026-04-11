import { ProviderCallOptions, ProviderResult, StreamCallback, StreamingProviderResult } from "./types.js";
import { computeScores, estimateTokens } from "./utils.js";
import { PROVIDER_CONFIG } from "./config.js";
import { executeWithCircuitBreaker } from "../circuitBreaker.js";

const cfg = PROVIDER_CONFIG.claude;

const INPUT_COST_PER_M = 3.00;
const OUTPUT_COST_PER_M = 15.00;

function calcCost(inputTokens: number, outputTokens: number) {
  return (inputTokens * INPUT_COST_PER_M + outputTokens * OUTPUT_COST_PER_M) / 1_000_000;
}

export async function callClaude(options: ProviderCallOptions): Promise<ProviderResult> {
  const { prompt, systemPrompt, temperature = 0.7, apiKey } = options;

  if (!apiKey) {
    return getMockClaudeResponse(prompt);
  }

  return executeWithCircuitBreaker("claude", async () => {
    const start = Date.now();
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: cfg.defaultModel,
        max_tokens: 1024,
        system: systemPrompt || undefined,
        messages: [{ role: "user", content: prompt }],
        temperature,
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json() as {
      content?: { type: string; text?: string }[];
      usage?: { input_tokens?: number; output_tokens?: number };
    };
    const text = data.content?.find((c) => c.type === "text")?.text ?? "";
    const inputTokens = data.usage?.input_tokens ?? Math.round(text.split(" ").length * 0.9);
    const outputTokens = data.usage?.output_tokens ?? Math.round(text.split(" ").length * 0.4);
    const tokenCount = inputTokens + outputTokens;
    const latencyMs = Date.now() - start;
    // TTFT for non-streaming = full latency (first token = complete response)
    const ttftMs = latencyMs;
    const rawCost = calcCost(inputTokens, outputTokens);
    const estimatedCost = Math.round(rawCost * 10000) / 10000;
    const dollarCost = `$${rawCost.toFixed(6)}`;
    const scores = computeScores(text, "claude");
    const costPerQuality = scores.overall > 0 ? rawCost / scores.overall : 0;

    return {
      provider: "claude",
      model: cfg.defaultModel,
      text,
      latencyMs,
      ttftMs,
      inputTokens,
      outputTokens,
      tokenCount,
      estimatedCost,
      dollarCost,
      costPerQuality,
      qualityScore: scores.quality,
      clarityScore: scores.clarity,
      toneScore: scores.tone,
      overallScore: scores.overall,
      isDemo: false,
    };
  }, options);
}

export async function callClaudeStream(
  opts: { prompt: string; systemPrompt?: string; temperature?: number; apiKey?: string },
  onChunk: StreamCallback,
  cfg: { defaultModel: string },
): Promise<StreamingProviderResult> {
  const { prompt, systemPrompt, temperature = 0.7, apiKey } = opts;
  const start = Date.now();
  let ttftMs = 0;
  let accumulated = "";

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey ?? "",
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: cfg.defaultModel,
      max_tokens: 1024,
      system: systemPrompt || undefined,
      messages: [{ role: "user", content: prompt }],
      temperature,
      stream: true,
    }),
  });

  if (!response.body) throw new Error("No response body");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  const base: StreamingProviderResult = {
    provider: "claude",
    model: cfg.defaultModel,
    text: "",
    isComplete: false,
    latencyMs: 0, ttftMs: 0,
    inputTokens: 0, outputTokens: 0, tokenCount: 0,
    estimatedCost: 0, dollarCost: "$0.000000",
    qualityScore: 0, clarityScore: 0, toneScore: 0, overallScore: 0,
    isDemo: false,
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
        const parsed = JSON.parse(data);
        const token = parsed.choices?.[0]?.delta?.content;
        if (token) {
          if (ttftMs === 0) ttftMs = Date.now() - start;
          accumulated += token;
          onChunk({ ...base, text: accumulated, ttftMs, latencyMs: Date.now() - start });
        }
      } catch {}
    }
  }

  const tokens = estimateTokens(accumulated);
  const rawCost = calcCost(tokens.input, tokens.output);
  const scores = computeScores(accumulated, "claude");
  const final: StreamingProviderResult = {
    ...base, ...scores,
    text: accumulated, isComplete: true,
    latencyMs: Date.now() - start, ttftMs,
    inputTokens: tokens.input, outputTokens: tokens.output, tokenCount: tokens.total,
    estimatedCost: Math.round(rawCost * 10000) / 10000,
    dollarCost: `$${rawCost.toFixed(6)}`,
  };
  onChunk(final);
  return final;
}

function getMockClaudeResponse(prompt: string): ProviderResult {
  const responses = [
    "Claude approaches this thoughtfully, weighing multiple considerations before arriving at a precise, well-reasoned response. Nuance and accuracy are prioritized, with clear acknowledgment of uncertainty where it exists.",
    "Let me think through this carefully. The core question here involves trade-offs that deserve careful consideration. Claude excels at reasoning through ambiguous situations and providing structured, honest guidance.",
  ];
  const text = responses[Math.floor(Math.random() * responses.length)] + " In response to: " + prompt.slice(0, 60);
  const latencyMs = Math.round(800 + Math.random() * 1000);
  const inputTokens = Math.round(text.split(" ").length * 0.9);
  const outputTokens = Math.round(text.split(" ").length * 0.4);
  const tokenCount = inputTokens + outputTokens;
  const rawCost = calcCost(inputTokens, outputTokens);
  const estimatedCost = Math.round(rawCost * 10000) / 10000;
  const dollarCost = `$${rawCost.toFixed(6)}`;
  const scores = computeScores(text, "claude");
  const costPerQuality = scores.overall > 0 ? rawCost / scores.overall : 0;

  const ttftMs = latencyMs;

  return {
    provider: "claude",
    model: cfg.defaultModel,
    text,
    latencyMs,
    ttftMs,
    inputTokens,
    outputTokens,
    tokenCount,
    estimatedCost,
    dollarCost,
    costPerQuality,
    qualityScore: scores.quality,
    clarityScore: scores.clarity,
    toneScore: scores.tone,
    overallScore: scores.overall,
    isDemo: true,
  };
}
