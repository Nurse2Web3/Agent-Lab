import { ProviderCallOptions, ProviderResult } from "./types.js";
import { getMockGeminiResponse } from "../mockResponses.js";
import { computeScores } from "./utils.js";

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
      usageMetadata?: { totalTokenCount?: number };
    };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const tokenCount = data.usageMetadata?.totalTokenCount ?? Math.round(text.split(" ").length * 1.3);
    const latencyMs = Date.now() - start;
    const estimatedCost = Math.round(tokenCount * 0.000001 * 10000) / 10000;
    const scores = computeScores(text, "gemini");

    return {
      provider: "gemini",
      model: "gemini-1.5-flash",
      text,
      latencyMs,
      estimatedCost,
      tokenCount,
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
