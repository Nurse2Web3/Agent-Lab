export interface ProviderResult {
  provider: string;
  model: string;
  text: string;
  latencyMs: number;
  estimatedCost: number;
  tokenCount: number;
  qualityScore: number;
  clarityScore: number;
  toneScore: number;
  overallScore: number;
  isDemo: boolean;
}

export interface ProviderCallOptions {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  apiKey?: string;
}
