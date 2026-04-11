import { ProviderCallOptions, ProviderResult } from "./types.js";
import { computeScores } from "./utils.js";
import { executeWithCircuitBreaker } from "../circuitBreaker.js";

const INPUT_COST_PER_M = 0.075;
const OUTPUT_COST_PER_M = 0.30;

function calcCost(inputTokens: number, outputTokens: number) {
  return (inputTokens * INPUT_COST_PER_M + outputTokens * OUTPUT_COST_PER_M) / 1_000_000;
}

function getMockGeminiResponse(prompt: string): ProviderResult {
  const text = "Gemini provides broad, factual responses with strong reasoning. Add your Gemini API key in Settings to enable this provider.";
  const latencyMs = 1100;
  const inputTokens = Math.round(prompt.split(" ").length * 0.9);
  const outputTokens = Math.round(text.split(" ").length * 0.4);
  const tokenCount = inputTokens + outputTokens;
  const rawCost = calcCost(inputTokens, outputTokens);
  const estimatedCost = Math.round(rawCost * 10000) / 10000;
  const dollarCost = `$${rawCost.toFixed(6)}`;
  const scores = computeScores(text, "gemini");
  const costPerQuality = scores.overall > 0 ? rawCost / scores.overall : 0;
  const ttftMs = latencyMs;

  return {
    provider: "gemini",
    model: "gemini-1.5-flash",
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

export async function callGemini(options: ProviderCallOptions): Promise<ProviderResult> {
  const { prompt, systemPrompt, temperature = 0.7, apiKey } = options;

  if (!apiKey) {
    return getMockGeminiResponse(prompt);
  }

  return executeWithCircuitBreaker("gemini", async () => {
    const start = Date.now();
    const messages: { role: string; parts: { text: string }[] }[] = [];
    if (systemPrompt) {
      messages.push({ role: "user", parts: [{ text: systemPrompt }] });
      messages.push({ role: "model", parts: [{ text: "Understood." }] });
    }
    messages.push({ role: "user", parts: [{ text: prompt }] });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: messages,
          generationConfig: { temperature, maxOutputTokens: 1024 },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json() as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
      usageMetadata?: {
        promptTokenCount?: number;
        candidatesTokenCount?: number;
        totalTokenCount?: number;
      };
    };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const inputTokens = data.usageMetadata?.promptTokenCount ?? Math.round(text.split(" ").length * 0.9);
    const outputTokens = data.usageMetadata?.candidatesTokenCount ?? Math.round(text.split(" ").length * 0.4);
    const tokenCount = inputTokens + outputTokens;
    const latencyMs = Date.now() - start;
    // TTFT for non-streaming = full latency (first token = complete response)
    const ttftMs = latencyMs;
    const rawCost = calcCost(inputTokens, outputTokens);
    const estimatedCost = Math.round(rawCost * 10000) / 10000;
    const dollarCost = `$${rawCost.toFixed(6)}`;
    const scores = computeScores(text, "gemini");
    const costPerQuality = scores.overall > 0 ? rawCost / scores.overall : 0;

    return {
      provider: "gemini",
      model: "gemini-1.5-flash",
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
