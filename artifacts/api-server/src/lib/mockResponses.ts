import { ProviderResult } from "./providers/types.js";

const geminiResponses = [
  "This is a well-structured and comprehensive response from Gemini. The answer covers the key aspects systematically: first considering the context, then analyzing the requirements, and finally providing actionable recommendations. Gemini excels at organized, balanced outputs that are easy to scan and understand.",
  "Gemini provides a balanced perspective here. The response is organized into clear sections, addressing the core question with supporting evidence and practical examples. This structured approach makes it ideal for technical documentation or detailed explanations.",
];

const huggingFaceResponses = [
  "Here's my take on this — drawing from a diverse range of open-source training data, this response reflects a more varied perspective. Open models like this often surface unexpected angles and creative approaches that proprietary models might smooth over. Worth considering the alternative viewpoints presented.",
  "Based on the input, here's what I can provide: the topic spans multiple domains and the optimal answer depends heavily on context. From what I can infer, the most likely scenario involves several factors working together. Let me break down each component for clarity.",
];

const grokResponses = [
  "Direct answer: yes, this approach works. Key points: (1) speed matters most here, (2) the tradeoff is acceptable, (3) implement with minimal overhead. Grok delivers fast, concise outputs optimized for latency-sensitive applications.",
  "Quick summary: the core idea is sound. Three things to watch: efficiency, scalability, maintainability. Prioritize in that order. Fast inference means faster iteration cycles for your team.",
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function computeScores(text: string, provider: string): { quality: number; clarity: number; tone: number; overall: number } {
  const baseQuality = provider === "gemini" ? 4.2 : provider === "grok" ? 3.8 : 3.5;
  const baseClarity = provider === "gemini" ? 4.5 : provider === "grok" ? 4.0 : 3.6;
  const baseTone = provider === "gemini" ? 4.0 : provider === "grok" ? 3.7 : 3.9;

  const quality = Math.min(5, Math.max(1, baseQuality + randomBetween(-0.3, 0.3)));
  const clarity = Math.min(5, Math.max(1, baseClarity + randomBetween(-0.3, 0.3)));
  const tone = Math.min(5, Math.max(1, baseTone + randomBetween(-0.3, 0.3)));
  const overall = (quality + clarity + tone) / 3;

  return {
    quality: Math.round(quality * 10) / 10,
    clarity: Math.round(clarity * 10) / 10,
    tone: Math.round(tone * 10) / 10,
    overall: Math.round(overall * 10) / 10,
  };
}

export function getMockGeminiResponse(prompt: string): ProviderResult {
  const text = pickRandom(geminiResponses) + "\n\nContext: " + prompt.slice(0, 100);
  const latencyMs = Math.round(randomBetween(800, 1800));
  const tokenCount = Math.round(text.split(" ").length * 1.3);
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
    isDemo: true,
  };
}

export function getMockHuggingFaceResponse(prompt: string): ProviderResult {
  const text = pickRandom(huggingFaceResponses) + "\n\nRegarding: " + prompt.slice(0, 80);
  const latencyMs = Math.round(randomBetween(1500, 3500));
  const tokenCount = Math.round(text.split(" ").length * 1.3);
  const estimatedCost = Math.round(tokenCount * 0.0000005 * 10000) / 10000;
  const scores = computeScores(text, "huggingface");

  return {
    provider: "huggingface",
    model: "mistralai/Mistral-7B-Instruct-v0.3",
    text,
    latencyMs,
    estimatedCost,
    tokenCount,
    qualityScore: scores.quality,
    clarityScore: scores.clarity,
    toneScore: scores.tone,
    overallScore: scores.overall,
    isDemo: true,
  };
}

export function getMockGroqResponse(prompt: string): ProviderResult {
  const text = pickRandom(grokResponses) + " Input summary: " + prompt.slice(0, 60);
  const latencyMs = Math.round(randomBetween(200, 600));
  const tokenCount = Math.round(text.split(" ").length * 1.3);
  const estimatedCost = Math.round(tokenCount * 0.0000002 * 10000) / 10000;
  const scores = computeScores(text, "grok");

  return {
    provider: "grok",
    model: "llama-3.1-8b-instant",
    text,
    latencyMs,
    estimatedCost,
    tokenCount,
    qualityScore: scores.quality,
    clarityScore: scores.clarity,
    toneScore: scores.tone,
    overallScore: scores.overall,
    isDemo: true,
  };
}
