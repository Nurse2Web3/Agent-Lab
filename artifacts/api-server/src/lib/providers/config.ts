export type PlanKey = "sandbox" | "pro" | "studio";

export interface ProviderConfig {
  id: string;
  label: string;
  defaultModel: string;
  fallbackModel: string;
  plans: PlanKey[];
  active: boolean;
  description: string;
}

export const PROVIDER_CONFIG: Record<string, ProviderConfig> = {
  openai: {
    id: "openai",
    label: "OpenAI",
    defaultModel: "gpt-4o-mini",
    fallbackModel: "gpt-4o",
    plans: ["sandbox", "pro", "studio"],
    active: true,
    description: "OpenAI's GPT-4o mini — fast, capable, cost-effective.",
  },
  claude: {
    id: "claude",
    label: "Claude",
    defaultModel: "claude-3-5-sonnet-20241022",
    fallbackModel: "claude-3-haiku-20240307",
    plans: ["sandbox", "pro", "studio"],
    active: true,
    description: "Anthropic's Claude — thoughtful, safety-focused, and precise.",
  },
  grok: {
    id: "grok",
    label: "GROK THE ELON MODEL 🥇",
    defaultModel: "grok-beta",
    fallbackModel: "grok-beta",
    plans: ["pro", "studio"],
    active: true,
    description: "xAI's Grok Beta — the model everyone's talking about.",
  },
  perplexity: {
    id: "perplexity",
    label: "Perplexity Sonar Pro",
    defaultModel: "sonar-pro",
    fallbackModel: "sonar-pro",
    plans: ["studio"],
    active: true,
    description: "Real-time web-grounded AI with citations.",
  },
  gemini: {
    id: "gemini",
    label: "Google Gemini",
    defaultModel: "gemini-1.5-flash",
    fallbackModel: "gemini-1.5-pro",
    plans: ["pro", "studio"],
    active: true,
    description: "Google's fast, long-context multimodal model.",
  },
  kimi: {
    id: "kimi",
    label: "Moonshot Kimi",
    defaultModel: "moonshot-v1-8k",
    fallbackModel: "moonshot-v1-32k",
    plans: ["pro", "studio"],
    active: true,
    description: "Moonshot AI's long-context model optimized for reasoning.",
  },
  deepseek: {
    id: "deepseek",
    label: "DeepSeek V3",
    defaultModel: "deepseek-chat",
    fallbackModel: "deepseek-chat",
    plans: ["pro", "studio"],
    active: true,
    description: "DeepSeek V3 — open-source frontier model at a fraction of the cost.",
  },
};

export function getProvidersForPlan(plan: PlanKey): ProviderConfig[] {
  return Object.values(PROVIDER_CONFIG).filter(
    (p) => p.active && p.plans.includes(plan)
  );
}

export function isProviderAllowedForPlan(providerId: string, plan: PlanKey): boolean {
  const config = PROVIDER_CONFIG[providerId];
  if (!config || !config.active) return false;
  return config.plans.includes(plan);
}

// Streaming config — models that support SSE streaming
export const streamingProviderConfig: Record<string, ProviderConfig> = {
  openai: {
    id: "openai",
    label: "OpenAI",
    defaultModel: "gpt-4o-mini",
    fallbackModel: "gpt-4o",
    plans: ["sandbox", "pro", "studio"],
    active: true,
    description: "",
  },
  claude: {
    id: "claude",
    label: "Claude",
    defaultModel: "claude-3-5-sonnet-20241022",
    fallbackModel: "claude-3-haiku-20240307",
    plans: ["sandbox", "pro", "studio"],
    active: true,
    description: "",
  },
  grok: {
    id: "grok",
    label: "Grok",
    defaultModel: "grok-beta",
    fallbackModel: "grok-beta",
    plans: ["pro", "studio"],
    active: true,
    description: "",
  },
  perplexity: {
    id: "perplexity",
    label: "Perplexity",
    defaultModel: "sonar-pro",
    fallbackModel: "sonar-pro",
    plans: ["studio"],
    active: true,
    description: "",
  },
};
