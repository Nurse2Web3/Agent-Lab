import { useState, useEffect } from "react";
import { useRunComparison, useSaveRun } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Save, Copy, Loader2, Star, AlertCircle, Clock,
  DollarSign, Database, Tag, Sparkles, Trophy, CheckCircle2,
  ArrowRight, Zap, ChevronRight, Download, TrendingDown, Printer
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { ProviderIcon } from "@/components/provider-icon";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useBillingStatus } from "@/hooks/use-billing";
import { useTrialStatus } from "@/hooks/use-trial";
import { TrialGate } from "@/components/trial-gate";
import { Link } from "wouter";
import { getCompositeFingerprint } from "@/lib/deviceFingerprint";

const PROVIDERS = [
  { id: "OpenAI",      name: "OpenAI",                   model: "gpt-4o-mini",               plan: ["sandbox", "pro", "studio"] },
  { id: "Claude",      name: "Claude",                   model: "claude-3-5-sonnet-20241022", plan: ["sandbox", "pro", "studio"] },
  { id: "Grok",        name: "GROK THE ELON MODEL 🥇",   model: "grok-beta",                 plan: ["pro", "studio"] },
  { id: "Perplexity",  name: "Perplexity",               model: "sonar-pro",                 plan: ["studio"] },
];

const TEMPLATES = [
  {
    name: "Customer Support",
    prompt: "Customer: My order hasn't arrived and support is ignoring me!\nWrite a professional, empathetic support reply in under 100 words. Be helpful, concise, and solution-focused. End with next steps.",
    sys: "You are an expert customer success manager. Keep it brief and professional.",
  },
  {
    name: "Summarization",
    prompt: "Summarize this content in 3 bullet points max. Keep key facts, remove fluff:\n\nAI is changing how startups build products. Founders now test multiple models before committing to one. The rise of open-source models has dramatically lowered the cost of experimentation. Teams that move fast with AI are shipping 3x faster than those that don't.",
    sys: "You are a concise editor. Bullet points only, no padding.",
  },
  {
    name: "Code Review",
    prompt: "Review this React code for performance issues: useEffect(() => { fetch('/api').then(r => set(r.data)) })",
    sys: "You are a senior React developer. Point out anti-patterns.",
  },
  {
    name: "Product Copy",
    prompt: "Write a short landing page hero section for an AI-powered code editor.",
    sys: "You are a world-class startup copywriter. Use strong, action-oriented verbs.",
  },
];

const LOADING_STAGES = [
  "Running your comparison…",
  "Checking provider responses…",
  "Scoring quality, speed, and cost…",
  "Choosing the best overall option…",
];

function LoadingStages({ count }: { count: number }) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setStage((s) => (s < LOADING_STAGES.length - 1 ? s + 1 : s));
    }, 1200);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-6">
      {/* Stage indicator */}
      <div className="glass-card rounded-2xl p-8 text-center space-y-6">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
          <Loader2 className="w-7 h-7 text-primary animate-spin" />
        </div>
        <div>
          <AnimatePresence mode="wait">
            <motion.p
              key={stage}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="text-base font-semibold text-foreground"
            >
              {LOADING_STAGES[stage]}
            </motion.p>
          </AnimatePresence>
          <p className="text-sm text-muted-foreground mt-1">This usually takes a few seconds.</p>
        </div>

        {/* Steps */}
        <div className="flex items-center justify-center gap-3 flex-wrap">
          {LOADING_STAGES.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full transition-all duration-500 ${i <= stage ? "bg-primary scale-125" : "bg-border"}`} />
              {i < LOADING_STAGES.length - 1 && (
                <div className={`w-6 h-px transition-all duration-500 ${i < stage ? "bg-primary" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Skeleton cards */}
      <div className={`grid grid-cols-1 ${count >= 2 ? "md:grid-cols-2" : ""} ${count >= 3 ? "lg:grid-cols-3" : ""} gap-5`}>
        {[...Array(count || 2)].map((_, i) => (
          <Card key={i} className="bg-card/40 border-border/40 animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-5 bg-secondary rounded w-1/3 mb-2" />
              <div className="h-3 bg-secondary rounded w-1/2" />
              <div className="flex gap-2 mt-4">
                <div className="h-6 bg-secondary rounded w-16" />
                <div className="h-6 bg-secondary rounded w-16" />
                <div className="h-6 bg-secondary rounded w-16" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              <div className="h-3.5 bg-secondary rounded w-full" />
              <div className="h-3.5 bg-secondary rounded w-[92%]" />
              <div className="h-3.5 bg-secondary rounded w-[85%]" />
              <div className="h-3.5 bg-secondary rounded w-[70%]" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

const DEMO_PROMPT = "What's the best way to start a startup as a non-technical founder?";
const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";

export default function Playground() {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [selectedProviders, setSelectedProviders] = useState<string[]>(["OpenAI", "Claude"]);
  const [temperature, setTemperature] = useState([0.7]);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [demoResponse, setDemoResponse] = useState<any>(null);
  const [demoLoading, setDemoLoading] = useState(false);

  const isDemoMode = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("demo");

  const { data: billingStatus, isLoading: billingLoading } = useBillingStatus();
  const { stage, status: trialStatus, userId: trialUserId, notifyComparisonUsed } = useTrialStatus();
  const isPaidPlan = !billingLoading && (billingStatus?.plan === "pro" || billingStatus?.plan === "studio");

  const { mutate: runCompare, data: realResponse, isPending: realPending, error } = useRunComparison();
  const { mutate: saveToHistory, isPending: isSaving } = useSaveRun();

  const response = isDemoMode ? demoResponse : realResponse;
  const isPending = isDemoMode ? demoLoading : realPending;

  useEffect(() => {
    if (!isDemoMode) return;
    setPrompt(DEMO_PROMPT);
    setSelectedProviders(["OpenAI", "Claude", "Grok"]);
    setDemoLoading(true);
    fetch(`${API_BASE}/compare/demo`, { method: "POST", headers: { "Content-Type": "application/json" } })
      .then((r) => r.json())
      .then((data) => setDemoResponse(data))
      .catch(() => {})
      .finally(() => setDemoLoading(false));
  }, [isDemoMode]);

  const handleRun = () => {
    if (!prompt) {
      toast({ title: "Prompt required", description: "Please enter a prompt to compare.", variant: "destructive" });
      return;
    }
    if (selectedProviders.length === 0) {
      toast({ title: "Provider required", description: "Select at least one provider.", variant: "destructive" });
      return;
    }
    if (isDemoMode) {
      setDemoResponse(null);
      setDemoLoading(true);
      fetch(`${API_BASE}/compare/demo`, { method: "POST", headers: { "Content-Type": "application/json" } })
        .then((r) => r.json())
        .then((data) => setDemoResponse(data))
        .catch(() => toast({ title: "Demo failed", description: "Could not load demo results.", variant: "destructive" }))
        .finally(() => setDemoLoading(false));
      return;
    }
    setScores({});
    const extraFields = !isPaidPlan && trialUserId
      ? { trialUserId, deviceFingerprint: getCompositeFingerprint() }
      : {};
    runCompare(
      { data: { prompt, systemPrompt, providers: selectedProviders, temperature: temperature[0], ...extraFields } as any },
      {
        onSuccess: () => {
          if (!isPaidPlan) notifyComparisonUsed();
        },
        onError: (err: any) => {
          toast({ title: "Comparison failed", description: err.message, variant: "destructive" });
        },
      }
    );
  };

  const applyTemplate = (tpl: typeof TEMPLATES[0]) => {
    setPrompt(tpl.prompt);
    setSystemPrompt(tpl.sys);
  };

  const handleSaveWinner = (providerName: string) => {
    if (!response || !prompt) return;
    saveToHistory(
      {
        data: {
          name: prompt.slice(0, 30) + "…",
          prompt,
          systemPrompt,
          providers: selectedProviders,
          winner: providerName,
          temperature: temperature[0],
          results: JSON.stringify(response.results),
        },
      },
      {
        onSuccess: () => toast({ title: "Saved to history", description: `${providerName} marked as winner.` }),
        onError: () => toast({ title: "Failed to save", variant: "destructive" }),
      }
    );
  };

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: `${label} copied to clipboard.` });
  };

  const downloadCSV = () => {
    if (!response?.csvExport) return;
    const blob = new Blob([response.csvExport], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `agentlab-comparison-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: "Results downloaded as CSV." });
  };

  const handlePrint = () => {
    window.print();
  };

  /* ------------------------------------------------------------------ */
  /* Derive "why it won" rationale from scores                           */
  /* ------------------------------------------------------------------ */
  const whyItWon = (() => {
    if (!response) return "";
    const parts: string[] = [];
    if (response.bestQuality === response.recommendedWinner) parts.push("highest quality score");
    if (response.fastest === response.recommendedWinner) parts.push("fastest response");
    if (response.cheapest === response.recommendedWinner) parts.push("lowest cost");
    if (parts.length === 0) parts.push("best overall balance of quality, speed, and cost");
    return "Scored " + parts.join(" + ") + " across all providers.";
  })();

  /* ------------------------------------------------------------------ */
  return (
    <TrialGate isPaidPlan={isPaidPlan}>
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col xl:flex-row gap-8">

        {/* ── LEFT: Setup Panel ── */}
        <div className="w-full xl:w-[380px] flex-shrink-0">
          <div className="glass-card p-6 rounded-2xl space-y-6 sticky top-24">

            {/* Header */}
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2 mb-0.5">
                <Sparkles className="w-4 h-4 text-primary" /> Compare Setup
              </h2>
              <p className="text-xs text-muted-foreground">Compare before you ship. See the tradeoffs clearly.</p>
            </div>

            {/* Templates */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Start with a template</p>
              <div className="flex flex-wrap gap-2">
                {TEMPLATES.map((tpl, i) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors py-1 px-2.5"
                    onClick={() => applyTemplate(tpl)}
                  >
                    <Tag className="w-3 h-3 mr-1" /> {tpl.name}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Prompts */}
            <div className="space-y-4 pt-2 border-t border-border/40">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">System Prompt <span className="font-normal">(optional)</span></Label>
                <Textarea
                  placeholder="e.g. You are a helpful assistant…"
                  className="h-20 resize-none bg-background/50 text-sm"
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  User Prompt <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  placeholder="Write the prompt you want to test across providers…"
                  className="h-32 resize-none bg-background/50 border-primary/30 focus-visible:ring-primary/20 text-sm"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>
            </div>

            {/* Providers */}
            <div className="space-y-3 pt-2 border-t border-border/40">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Providers</p>
              {(() => {
                const userPlan = billingStatus?.plan ?? "sandbox";
                const planAllowlist: Record<string, string[]> = {
                  sandbox: ["OpenAI", "Claude"],
                  pro: ["OpenAI", "Claude", "Grok"],
                  studio: ["OpenAI", "Claude", "Grok", "Perplexity"],
                };
                const allowed = new Set(planAllowlist[userPlan] ?? planAllowlist["sandbox"]);
                return PROVIDERS.map((p) => {
                  const isLocked = !allowed.has(p.id);
                  const isGrok = p.id === "Grok";
                  return (
                    <div key={p.id}>
                      <div className={`flex items-center justify-between group ${isLocked ? "opacity-60" : ""}`}>
                        <div className="flex items-center gap-2.5">
                          <Checkbox
                            id={`prov-${p.id}`}
                            checked={selectedProviders.includes(p.id) && !isLocked}
                            disabled={isLocked}
                            onCheckedChange={(checked) => {
                              if (isLocked) return;
                              if (checked) setSelectedProviders([...selectedProviders, p.id]);
                              else setSelectedProviders(selectedProviders.filter((id) => id !== p.id));
                            }}
                          />
                          <label
                            htmlFor={`prov-${p.id}`}
                            className={`text-sm font-medium flex items-center gap-2 ${isLocked ? "cursor-not-allowed" : "cursor-pointer"}`}
                          >
                            <ProviderIcon provider={p.id} className="w-4 h-4" />
                            {p.name}
                          </label>
                          {isLocked && (
                            <span className="text-[10px] font-semibold text-primary/70 border border-primary/20 bg-primary/5 px-1.5 py-0.5 rounded">
                              {p.id === "Perplexity" ? "Premium" : "Pro"}
                            </span>
                          )}
                        </div>
                        {!isLocked && (
                          <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-60 transition-opacity font-mono">
                            {p.model}
                          </span>
                        )}
                      </div>
                      {isLocked && isGrok && (
                        <Link href="/pricing" className="mt-1.5 ml-6 flex items-center gap-1 text-[11px] font-semibold text-primary/80 hover:text-primary transition-colors">
                          Unlock Grok with Pro — $29/mo <ArrowRight className="w-2.5 h-2.5" />
                        </Link>
                      )}
                      {isLocked && p.id === "Perplexity" && (
                        <Link href="/pricing" className="mt-1.5 ml-6 flex items-center gap-1 text-[11px] font-semibold text-cyan-400/80 hover:text-cyan-400 transition-colors">
                          Unlock Perplexity with Premium — $49/mo <ArrowRight className="w-2.5 h-2.5" />
                        </Link>
                      )}
                    </div>
                  );
                });
              })()}
            </div>

            {/* Temperature */}
            <div className="space-y-3 pt-2 border-t border-border/40">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Creativity</p>
                <span className="text-sm font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded">{temperature[0]}</span>
              </div>
              <Slider value={temperature} onValueChange={setTemperature} max={2} step={0.1} className="py-1" />
              <p className="text-xs text-muted-foreground">
                {temperature[0] <= 0.4 ? "Precise and deterministic" : temperature[0] <= 1.0 ? "Balanced creativity" : "More varied, experimental outputs"}
              </p>
            </div>

            {/* Run button */}
            <Button
              className="w-full h-12 text-sm font-semibold rounded-xl shadow-lg shadow-primary/20"
              onClick={handleRun}
              disabled={isPending}
            >
              {isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Running…</>
              ) : (
                <><Play className="mr-2 h-4 w-4 fill-current" /> Run Comparison</>
              )}
            </Button>

            {error && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>Comparison failed. Check API keys in Settings.</p>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Results ── */}
        <div className="flex-1 min-w-0 space-y-6">

          {/* Empty state */}
          {!response && !isPending && (
            <div className="min-h-[580px] flex flex-col items-center justify-center text-center p-10 border-2 border-dashed border-border/30 rounded-3xl bg-secondary/5">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 text-primary">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Run your first comparison</h3>
              <p className="text-muted-foreground max-w-md leading-relaxed mb-8">
                Test one prompt across multiple providers and see which option wins on quality, speed, and cost.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                {TEMPLATES.map((tpl, i) => (
                  <Button key={i} variant="outline" size="sm" className="rounded-full" onClick={() => applyTemplate(tpl)}>
                    <Tag className="w-3.5 h-3.5 mr-1.5" /> {tpl.name}
                  </Button>
                ))}
              </div>
              <p className="mt-6 text-xs text-muted-foreground/60">
                Or write your own prompt in the panel on the left.
              </p>
            </div>
          )}

          {/* Loading */}
          {isPending && <LoadingStages count={selectedProviders.length} />}

          {/* Results */}
          {response && !isPending && (
            <motion.div
              className="space-y-8"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >

              {/* ── WINNER ENGINE ── */}
              <div className="rounded-2xl border border-primary/30 bg-primary/5 overflow-hidden shadow-xl shadow-primary/10">
                {/* Header */}
                <div className="px-6 py-3.5 border-b border-primary/20 flex items-center gap-2.5 bg-primary/8">
                  <Trophy className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold text-primary uppercase tracking-widest">Winner Engine</span>
                  <span className="ml-auto text-xs text-muted-foreground">Scoring: quality 40 · speed 30 · cost 30</span>
                </div>

                <div className="p-6 space-y-6">
                  {/* Recommended Winner — hero row */}
                  <div className="flex flex-col sm:flex-row sm:items-start gap-5">
                    <div className="flex-1">
                      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Recommended Winner</p>
                      <div className="flex items-center gap-3 mb-2">
                        <ProviderIcon provider={response.recommendedWinner} className="w-7 h-7 text-primary" />
                        <span className="text-3xl font-display font-bold tracking-tight">{response.recommendedWinner}</span>
                        <span className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-full font-bold shadow-sm">
                          Ship This 🏆
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">{whyItWon}</p>
                    </div>

                    {/* Secondary stats */}
                    <div className="flex gap-5 flex-wrap sm:flex-nowrap sm:border-l sm:border-border/40 sm:pl-6">
                      {[
                        { label: "Best Quality", value: response.bestQuality, icon: CheckCircle2 },
                        { label: "Fastest",       value: response.fastest,      icon: Zap },
                        { label: "Cheapest",      value: response.cheapest,     icon: DollarSign },
                        { label: "Best Value",    value: (response as any).bestValue ?? response.cheapest, icon: TrendingDown },
                      ].map(({ label, value, icon: Icon }) => (
                        <div key={label} className="min-w-[80px]">
                          <div className="flex items-center gap-1 mb-1">
                            <Icon className="w-3 h-3 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">{label}</p>
                          </div>
                          <p className="text-base font-bold">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Ready to Ship */}
                  <div className="rounded-xl border border-border/50 bg-background/40 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <ArrowRight className="w-3.5 h-3.5 text-primary" />
                      <p className="text-xs font-bold uppercase tracking-widest text-primary">Ready to Ship</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Copy the winning prompt, settings, or full API payload to move from testing to production.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline" size="sm" className="h-8 text-xs rounded-lg"
                        onClick={() => copy(prompt, "Prompt")}
                      >
                        <Copy className="w-3 h-3 mr-1.5" /> Copy Prompt
                      </Button>
                      <Button
                        variant="outline" size="sm" className="h-8 text-xs rounded-lg"
                        onClick={() => copy(JSON.stringify({ prompt, systemPrompt, providers: selectedProviders, temperature: temperature[0] }, null, 2), "Settings JSON")}
                      >
                        <Copy className="w-3 h-3 mr-1.5" /> Copy Settings
                      </Button>
                      <Button
                        variant="outline" size="sm" className="h-8 text-xs rounded-lg"
                        onClick={() => copy(JSON.stringify(response, null, 2), "API Payload")}
                      >
                        <Copy className="w-3 h-3 mr-1.5" /> Copy API Payload
                      </Button>
                      <Button
                        variant="outline" size="sm" className="h-8 text-xs rounded-lg"
                        onClick={downloadCSV}
                        disabled={!(response as any).csvExport}
                      >
                        <Download className="w-3 h-3 mr-1.5" /> Export CSV
                      </Button>
                      <Button
                        variant="outline" size="sm" className="h-8 text-xs rounded-lg print:hidden"
                        onClick={handlePrint}
                      >
                        <Printer className="w-3 h-3 mr-1.5" /> Print / Save PDF
                      </Button>
                      <Button
                        size="sm" className="h-8 text-xs rounded-lg shadow-sm shadow-primary/20"
                        onClick={() => handleSaveWinner(response.recommendedWinner)}
                        disabled={isSaving}
                      >
                        <Save className="w-3 h-3 mr-1.5" /> Save Winner
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── RESULT CARDS ── */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Provider outputs</p>
                <div className={`grid grid-cols-1 gap-5 ${response.results.length >= 2 ? "md:grid-cols-2" : ""} ${response.results.length >= 3 ? "lg:grid-cols-3" : ""} items-start`}>
                  {response.results.map((result, i) => {
                    const isWinner = response.recommendedWinner === result.provider;
                    const isFastest = response.fastest === result.provider;
                    const isCheapest = response.cheapest === result.provider;
                    const isBestQuality = response.bestQuality === result.provider;

                    return (
                      <motion.div
                        key={result.provider}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <Card className={`overflow-hidden flex flex-col h-full ${
                          isWinner
                            ? "ring-2 ring-primary/60 border-primary/40 shadow-xl shadow-primary/10"
                            : "border-border/40 bg-card/40"
                        }`}>

                          {/* Card header */}
                          <CardHeader className="pb-3 border-b border-border/40 bg-secondary/20">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <ProviderIcon provider={result.provider} className="w-5 h-5" />
                                <div>
                                  <CardTitle className="text-base leading-tight">{result.provider}</CardTitle>
                                  <CardDescription className="font-mono text-[10px] mt-0.5">{result.model}</CardDescription>
                                </div>
                              </div>
                              <div className="flex flex-wrap justify-end gap-1">
                                {isWinner && (
                                  <span className="text-[10px] font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                                    Winner 🏆
                                  </span>
                                )}
                                {isBestQuality && !isWinner && (
                                  <span className="text-[10px] font-semibold bg-emerald-500/15 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                                    Best Quality
                                  </span>
                                )}
                                {isFastest && !isWinner && (
                                  <span className="text-[10px] font-semibold bg-violet-500/15 text-violet-400 border border-violet-500/20 px-2 py-0.5 rounded-full">
                                    Fastest
                                  </span>
                                )}
                                {isCheapest && !isWinner && (
                                  <span className="text-[10px] font-semibold bg-sky-500/15 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded-full">
                                    Cheapest
                                  </span>
                                )}
                                {result.isDemo && (
                                  <Badge variant="outline" className="text-[10px] bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                                    Demo
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Metric row */}
                            <div className="flex gap-2 mt-3 flex-wrap">
                              <div className="flex items-center gap-1 bg-secondary/60 rounded-lg px-2.5 py-1">
                                <Clock className="w-3 h-3 text-muted-foreground" />
                                <span className="text-xs font-mono font-medium">{result.latencyMs}ms</span>
                              </div>
                              <div className="flex items-center gap-1 bg-secondary/60 rounded-lg px-2.5 py-1">
                                <DollarSign className="w-3 h-3 text-muted-foreground" />
                                <span className="text-xs font-mono font-medium">{(result as any).dollarCost ?? `$${result.estimatedCost.toFixed(5)}`}</span>
                              </div>
                              <div className="flex items-center gap-1 bg-secondary/60 rounded-lg px-2.5 py-1">
                                <Database className="w-3 h-3 text-muted-foreground" />
                                <span className="text-xs font-mono font-medium">{result.tokenCount} tokens</span>
                              </div>
                              {(result as any).costPerQuality !== undefined && (
                                <div className="flex items-center gap-1 bg-secondary/60 rounded-lg px-2.5 py-1">
                                  <TrendingDown className="w-3 h-3 text-muted-foreground" />
                                  <span className="text-xs font-mono font-medium">
                                    {((result as any).costPerQuality * 1000000).toFixed(2)}μ$/pt
                                  </span>
                                </div>
                              )}
                            </div>
                          </CardHeader>

                          {/* Output text */}
                          <CardContent className="p-5 flex-1 relative group">
                            <Button
                              variant="ghost" size="icon"
                              className="absolute top-3 right-3 w-7 h-7 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm"
                              onClick={() => copy(result.text, "Output")}
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </Button>
                            <div className="prose prose-sm dark:prose-invert max-w-none text-foreground/90 leading-relaxed whitespace-pre-wrap text-sm">
                              {result.text}
                            </div>
                          </CardContent>

                          {/* Footer */}
                          <CardFooter className="bg-secondary/10 border-t border-border/40 p-4 flex-col gap-3">
                            {/* Star rating */}
                            <div className="w-full flex items-center justify-between">
                              <span className="text-xs text-muted-foreground font-medium">Your rating</span>
                              <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    onClick={() => setScores({ ...scores, [result.provider]: star })}
                                    className="focus:outline-none transition-transform hover:scale-110"
                                  >
                                    <Star className={`w-4 h-4 ${
                                      (scores[result.provider] || 0) >= star
                                        ? "fill-primary text-primary"
                                        : "text-muted-foreground/25"
                                    }`} />
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Save button */}
                            <Button
                              variant={isWinner ? "default" : "outline"}
                              size="sm"
                              className={`w-full text-xs h-9 rounded-lg ${isWinner ? "shadow-sm shadow-primary/20" : ""}`}
                              onClick={() => handleSaveWinner(result.provider)}
                              disabled={isSaving}
                            >
                              <Save className="w-3.5 h-3.5 mr-1.5" />
                              {isWinner ? "Save as Winner 🏆" : "Save This Run"}
                            </Button>
                          </CardFooter>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

            </motion.div>
          )}
        </div>
      </div>
    </div>
    </TrialGate>
  );
}
