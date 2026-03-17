import { useState } from "react";
import { useGetSettings, useSaveApiKey, useTestConnection } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { Key, CheckCircle2, XCircle, Loader2, Server, Shield, CreditCard, ArrowRight, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ProviderIcon } from "@/components/provider-icon";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useBillingStatus, useManageBilling, useCheckout } from "@/hooks/use-billing";

const PLAN_LABELS: Record<string, string> = {
  sandbox: "Trial",
  pro: "AI AgentLab Pro",
  studio: "AI AgentLab Premium",
};

const PLAN_COLORS: Record<string, string> = {
  sandbox: "bg-muted text-muted-foreground",
  pro: "bg-primary/10 text-primary border-primary/20",
  studio: "bg-violet-500/10 text-violet-400 border-violet-500/20",
};

export default function Settings() {
  const { data, isLoading, refetch } = useGetSettings();
  const { mutate: saveKey, isPending: isSaving } = useSaveApiKey();
  const { mutate: testConnection, isPending: isTesting } = useTestConnection();
  const { toast } = useToast();
  const [location] = useLocation();

  const [keys, setKeys] = useState<Record<string, string>>({});
  const [testingId, setTestingId] = useState<string | null>(null);

  const { data: billingStatus, isLoading: billingLoading } = useBillingStatus();
  const { mutate: managePortal, isPending: isPortaling } = useManageBilling();
  const { mutate: checkout, isPending: isCheckingOut } = useCheckout();

  const billingSuccess = location.includes("billing=success");

  const handleSave = (provider: string) => {
    const apiKey = keys[provider];
    if (!apiKey) {
      toast({ title: "Key required", description: "Please enter an API key.", variant: "destructive" });
      return;
    }
    saveKey(
      { data: { provider, apiKey } },
      {
        onSuccess: () => {
          toast({ title: "Key saved", description: `${provider} API key securely stored.` });
          setKeys((prev) => ({ ...prev, [provider]: "" }));
          refetch();
        },
      }
    );
  };

  const handleTest = (provider: string) => {
    setTestingId(provider);
    testConnection(
      { data: { provider } },
      {
        onSuccess: (res) => {
          if (res.success) {
            toast({ title: "Connection Successful", description: `Latency: ${res.latencyMs}ms. Ready to test.` });
          } else {
            toast({ title: "Connection Failed", description: res.message, variant: "destructive" });
          }
          setTestingId(null);
        },
        onError: () => {
          toast({ title: "Test Failed", description: "Network error occurred.", variant: "destructive" });
          setTestingId(null);
        },
      }
    );
  };

  const hasNoKeys = data?.providers?.every((p) => !p.connected);
  const plan = billingStatus?.plan ?? "sandbox";
  const isActivePlan = plan !== "sandbox";

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">

      {billingSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex gap-4">
          <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
          <div>
            <h4 className="font-bold text-emerald-500">Subscription activated!</h4>
            <p className="text-sm text-emerald-500/80 mt-1">Your plan is now active. It may take a moment to reflect.</p>
          </div>
        </div>
      )}

      {/* ── BILLING SECTION ── */}
      <section>
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold flex items-center gap-3 mb-1">
            <CreditCard className="w-6 h-6 text-primary" /> Billing & Plan
          </h1>
          <p className="text-muted-foreground text-sm">Manage your subscription and plan features.</p>
        </div>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Current Plan</p>
                {billingLoading ? (
                  <div className="h-7 w-24 bg-secondary rounded animate-pulse" />
                ) : (
                  <div className="flex items-center gap-3">
                    {isActivePlan && <Crown className="w-5 h-5 text-primary" />}
                    <span className="text-xl font-bold">{PLAN_LABELS[plan]}</span>
                    <Badge className={`text-xs border ${PLAN_COLORS[plan]}`} variant="outline">
                      {isActivePlan ? "Active" : "Trial"}
                    </Badge>
                  </div>
                )}

                {billingStatus?.subscription && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Status: {billingStatus.subscription.status}
                    {billingStatus.subscription.currentPeriodEnd && (
                      <> · Renews {new Date(billingStatus.subscription.currentPeriodEnd * 1000).toLocaleDateString()}</>
                    )}
                  </p>
                )}

                {!isActivePlan && !billingLoading && (
                  <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                    You're on the Trial plan (4 free comparisons). Upgrade to AI AgentLab Pro to unlock multiple providers, the Winner Engine, unlimited saved runs, and production export tools.
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2 sm:items-end">
                {isActivePlan ? (
                  <Button
                    variant="outline"
                    onClick={() => managePortal()}
                    disabled={isPortaling}
                    className="rounded-xl"
                  >
                    {isPortaling ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CreditCard className="w-4 h-4 mr-2" />}
                    Manage Subscription
                  </Button>
                ) : (
                  <Button
                    className="rounded-xl shadow-lg shadow-primary/20"
                    onClick={() => {
                      window.location.href = "/pricing";
                    }}
                  >
                    <ArrowRight className="w-4 h-4 mr-2" /> Upgrade to AI AgentLab Pro
                  </Button>
                )}
              </div>
            </div>

            {/* Feature summary */}
            <div className="mt-6 pt-6 border-t border-border/40 grid sm:grid-cols-2 gap-3 text-sm">
              {[
                { label: "Providers", sandbox: "1", pro: "All 3", studio: "All 3" },
                { label: "Comparisons", sandbox: "4 total", pro: "Unlimited", studio: "Unlimited" },
                { label: "Winner Engine", sandbox: "—", pro: "✓", studio: "✓" },
                { label: "Production export", sandbox: "—", pro: "✓", studio: "✓" },
                { label: "Team workspaces", sandbox: "—", pro: "—", studio: "✓" },
                { label: "Review links", sandbox: "—", pro: "—", studio: "✓" },
              ].map((f) => (
                <div key={f.label} className="flex justify-between items-center py-1.5 border-b border-border/20 last:border-0">
                  <span className="text-muted-foreground">{f.label}</span>
                  <span className={`font-semibold ${(f as any)[plan] === "—" ? "text-muted-foreground/40" : "text-foreground"}`}>
                    {(f as any)[plan]}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ── API KEYS SECTION ── */}
      <section>
        <div className="mb-6">
          <h2 className="text-2xl font-display font-bold flex items-center gap-3 mb-1">
            <Key className="w-6 h-6 text-primary" /> API Keys & Providers
          </h2>
          <p className="text-muted-foreground text-sm">
            Connect your API keys to run real comparisons. Keys are stored server-side and never exposed to the browser.
          </p>
        </div>

        {hasNoKeys && !isLoading && (
          <div className="mb-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex gap-4">
            <Shield className="w-6 h-6 text-yellow-500 shrink-0" />
            <div>
              <h4 className="font-bold text-yellow-600 dark:text-yellow-500">Running in Demo Mode</h4>
              <p className="text-sm text-yellow-600/80 dark:text-yellow-500/80 mt-1">
                No API keys connected yet. The Compare workspace will return simulated responses. Add at least one key to run real requests.
              </p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <div className="grid gap-5">
            {data?.providers.map((p) => (
              <Card key={p.provider} className="glass-card overflow-hidden">
                <div className="flex flex-col sm:flex-row">
                  <div className="p-6 sm:w-1/3 bg-secondary/20 border-b sm:border-b-0 sm:border-r border-border/50 flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center shadow-sm border border-border">
                        <ProviderIcon provider={p.provider} className="w-5 h-5" />
                      </div>
                      <CardTitle className="text-lg">{p.provider}</CardTitle>
                    </div>
                    <CardDescription className="mb-4 text-sm">{p.description}</CardDescription>
                    <div className="mt-auto">
                      {p.connected ? (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 w-fit">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Connected
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-muted text-muted-foreground w-fit">
                          <XCircle className="w-3 h-3 mr-1" /> Not Configured
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-center space-y-4">
                    <div className="text-sm text-muted-foreground">
                      Default model: <code className="text-primary bg-primary/10 px-1.5 py-0.5 rounded text-xs">{p.model}</code>
                    </div>

                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="password"
                          placeholder={p.connected ? "•••••••••••••••••••• (Key saved)" : `Enter ${p.provider} API Key`}
                          className="pl-9 bg-background/50"
                          value={keys[p.provider] || ""}
                          onChange={(e) => setKeys({ ...keys, [p.provider]: e.target.value })}
                        />
                      </div>
                      <Button
                        onClick={() => handleSave(p.provider)}
                        disabled={!keys[p.provider] || isSaving}
                        className="shrink-0"
                      >
                        Save Key
                      </Button>
                    </div>

                    {p.connected && (
                      <div className="flex justify-end pt-2 border-t border-border/50">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleTest(p.provider)}
                          disabled={testingId === p.provider || isTesting}
                        >
                          {testingId === p.provider ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Testing…</>
                          ) : (
                            <><Server className="w-4 h-4 mr-2" /> Test Connection</>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}

            <div className="grid md:grid-cols-2 gap-5 mt-4 opacity-50">
              <h3 className="md:col-span-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/40 pb-2">
                Coming Soon
              </h3>
              {["OpenAI", "Anthropic"].map((name) => (
                <Card key={name} className="bg-card/20 border-dashed">
                  <CardHeader className="flex flex-row items-center gap-4">
                    <ProviderIcon provider={name} className="w-8 h-8 opacity-50" />
                    <div>
                      <CardTitle className="text-base">{name}</CardTitle>
                      <CardDescription className="text-xs">
                        {name === "OpenAI" ? "GPT-4o & GPT-4 Turbo" : "Claude 3.5 Sonnet & Opus"}
                      </CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
