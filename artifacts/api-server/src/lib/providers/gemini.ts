import { ProviderCallOptions, ProviderResult } from "./types.js";
import { getMockGeminiResponse } from "../mockResponses.js";
import { computeScores } from "./utils.js";

const INPUT_COST_PER_M = 0.075;
const OUTPUT_COST_PER_M = 0.30;

function calcCost(inputTokens: number, outputTokens: number) {
  return (inputTokens * INPUT_COST_PER_M + outputTokens * OUTPUT_COST_PER_M) / 1_000_000;
}

export async function callGemini(options: ProviderCallOptions): Promise<ProviderResult> {
  const { prompt, systemPrompt, temperature = 0.7, apiKey } = options;

  if (!apiKey) {
    return getMockGeminiResponse(prompt);
  }

  const start = Date.now();
  try {
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
    console.error("Gemini error:", err);
    return { ...getMockGeminiResponse(prompt), isDemo: true };
  }
}
