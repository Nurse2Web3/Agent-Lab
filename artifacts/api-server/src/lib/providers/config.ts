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
