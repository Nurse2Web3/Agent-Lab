export interface ProviderResult {
  provider: string;
  model: string;
  text: string;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  tokenCount: number;
  estimatedCost: number;
  dollarCost: string;
  costPerQuality: number;
  qualityScore: number;
  clarityScore: number;
  toneScore: number;
  overallScore: number;
  isDemo: boolean;
  error?: string;
}

export interface ProviderCallOptions {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  apiKey?: string;
}

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

export type StreamCallback = (partial: StreamingProviderResult) => void;
