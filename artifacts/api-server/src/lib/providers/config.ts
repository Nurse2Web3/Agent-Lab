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
  gemini: {
    id: "gemini",
    label: "Gemini",
    defaultModel: "gemini-1.5-flash",
    fallbackModel: "gemini-1.0-pro",
    plans: ["sandbox", "pro", "studio"],
    active: true,
    description: "Google's balanced and capable AI model.",
  },
  grok: {
    id: "grok",
    label: "Grok",
    defaultModel: "llama-3.1-8b-instant",
    fallbackModel: "llama3-8b-8192",
    plans: ["sandbox", "pro", "studio"],
    active: true,
    description: "Ultra-fast inference. Speed-first comparisons.",
  },
  kimi: {
    id: "kimi",
    label: "Kimi",
    defaultModel: "moonshot-v1-8k",
    fallbackModel: "moonshot-v1-32k",
    plans: ["pro", "studio"],
    active: true,
    description: "Moonshot AI's Kimi — strong reasoning and long context.",
  },
  openai: {
    id: "openai",
    label: "OpenAI",
    defaultModel: "gpt-4o",
    fallbackModel: "gpt-4o-mini",
    plans: ["studio"],
    active: true,
    description: "OpenAI's flagship GPT-4o model.",
  },
  claude: {
    id: "claude",
    label: "Claude",
    defaultModel: "claude-3-5-sonnet-20241022",
    fallbackModel: "claude-3-haiku-20240307",
    plans: ["studio"],
    active: true,
    description: "Anthropic's Claude — thoughtful, safety-focused, and precise.",
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
