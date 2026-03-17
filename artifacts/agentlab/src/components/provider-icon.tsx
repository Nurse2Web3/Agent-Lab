import { Bot, Cpu, Zap, Cloud, Sparkles } from "lucide-react";

export function ProviderIcon({ provider, className = "w-5 h-5" }: { provider: string, className?: string }) {
  const normalized = provider.toLowerCase();
  
  if (normalized.includes("gemini") || normalized.includes("google")) {
    return <Sparkles className={`${className} text-blue-400`} />;
  }
  if (normalized.includes("hugging") || normalized.includes("hf")) {
    return <Cloud className={`${className} text-yellow-500`} />;
  }
  if (normalized.includes("groq")) {
    return <Zap className={`${className} text-red-500`} />;
  }
  if (normalized.includes("open") || normalized.includes("gpt")) {
    return <Bot className={`${className} text-emerald-500`} />;
  }
  if (normalized.includes("anthropic") || normalized.includes("claude")) {
    return <Cpu className={`${className} text-orange-400`} />;
  }
  
  return <Bot className={className} />;
}

export function ProviderBadge({ provider }: { provider: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary/80 border border-border/50 text-xs font-medium text-foreground">
      <ProviderIcon provider={provider} className="w-3.5 h-3.5" />
      {provider}
    </div>
  );
}
