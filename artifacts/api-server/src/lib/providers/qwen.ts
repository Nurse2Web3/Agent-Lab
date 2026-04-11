import { ProviderCallOptions, ProviderResult } from "./types.js";
import { computeScores } from "./utils.js";
import { executeWithCircuitBreaker } from "../circuitBreaker.js";

const MODEL = "qwen-plus";
const BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1";

const INPUT_COST_PER_M  = 0.60;
const OUTPUT_COST_PER_M = 2.40;

function calcCost(inputTokens: number, outputTokens: number) {
  return (inputTokens * INPUT_COST_PER_M + outputTokens * OUTPUT_COST_PER_M) / 1_000_000;
}

function getMockQwenResponse(prompt: string): ProviderResult {
  const responses = [
    "Qwen delivers comprehensive, detail-rich responses with strong multilingual capabilities. The model shows particular strength in instruction following and produces well-structured outputs suitable for production integration.",
    "Analysis: Qwen Plus provides thorough, nuanced responses with excellent contextual awareness. Particularly strong on multilingual tasks and demonstrates robust reasoning across technical and creative domains.",
  ];
  const text = responses[Math.floor(Math.random() * responses.length)] + " Query: " + prompt.slice(0, 60);
  const latencyMs = Math.round(800 + Math.random() * 1000);
  const inputTokens = Math.round(text.split(" ").length * 0.9);
  const outputTokens = Math.round(text.split(" ").length * 0.4);
  const tokenCount = inputTokens + outputTokens;
  const rawCost = calcCost(inputTokens, outputTokens);
  const estimatedCost = Math.round(rawCost * 10000) / 10000;
  const dollarCost = `$${rawCost.toFixed(6)}`;
  const scores = computeScores(text, "qwen");
  const costPerQuality = scores.overall > 0 ? rawCost / scores.overall : 0;

  const ttftMs = latencyMs;

  return {
    provider: "qwen",
    model: MODEL,
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

export async function callQwen(options: ProviderCallOptions): Promise<ProviderResult> {
  const { prompt, systemPrompt, temperature = 0.7, apiKey } = options;

  if (!apiKey) {
    return getMockQwenResponse(prompt);
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
      throw new Error(`Qwen API error: ${response.status}`);
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
    // TTFT for non-streaming = full latency (first token = complete response)
    const ttftMs       = latencyMs;
    const rawCost      = calcCost(inputTokens, outputTokens);
    const estimatedCost = Math.round(rawCost * 10000) / 10000;
    const dollarCost   = `$${rawCost.toFixed(6)}`;
    const scores       = computeScores(text, "qwen");
    const costPerQuality = scores.overall > 0 ? rawCost / scores.overall : 0;

    return {
      provider: "qwen",
      model: MODEL,
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
  } catch (err) {
    console.error("Qwen error:", err);
    return { ...getMockQwenResponse(prompt), isDemo: true };
  }
}
