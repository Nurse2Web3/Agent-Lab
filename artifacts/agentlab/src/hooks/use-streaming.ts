import { useState, useCallback } from "react";

export interface StreamingProviderResult {
  provider: string;
  model: string;
  text: string;
  isComplete: boolean;
  latencyMs: number;
  ttftMs: number;
  inputTokens: number;
  outputTokens: number;
  tokenCount: number;
  estimatedCost: number;
  dollarCost: string;
  qualityScore: number;
  clarityScore: number;
  toneScore: number;
  overallScore: number;
  isDemo: boolean;
  error?: string;
}

export interface ComparisonSummary {
  recommendedWinner: string;
  bestQuality: string;
  cheapest: string;
  fastest: string;
  bestValue: string;
  csvExport: string;
}

export function useStreamingCompare() {
  const [streamingResults, setStreamingResults] = useState<Record<string, StreamingProviderResult>>({});
  const [summary, setSummary] = useState<ComparisonSummary | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  const startStream = useCallback(async (body: {
    prompt: string; systemPrompt?: string; providers: string[]; temperature?: number;
  }) => {
    setStreamingResults({});
    setSummary(null);
    setIsStreaming(true);

    try {
      const response = await fetch("/api/compare/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.body) return;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("event: ") && !line.startsWith("data: ")) continue;
          if (line.startsWith("event: ")) continue;
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(5).trim();
          if (!data || data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.provider) {
              setStreamingResults((prev) => ({ ...prev, [parsed.provider]: parsed }));
            } else if (parsed.recommendedWinner) {
              setSummary(parsed);
            }
          } catch {
            // ignore parse errors for keep-alive comments
          }
        }
      }
    } finally {
      setIsStreaming(false);
    }
  }, []);

  return { streamingResults, summary, isStreaming, startStream };
}
