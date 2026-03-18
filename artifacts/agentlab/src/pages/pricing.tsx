import { Check, X, ArrowRight, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ProviderIcon } from "@/components/provider-icon";
import { useBillingStatus, useBillingProducts, useCheckout, useManageBilling } from "@/hooks/use-billing";
import { useToast } from "@/hooks/use-toast";

const PROVIDER_PILLS = ["Gemini", "Grok", "Kimi", "OpenAI", "Claude"];

const TIERS = [
  {
    key: "sandbox",
    planKey: null,
    name: "Ai AgentLab Trial",
    price: "$0",
    period: null,
    badge: null,
    popular: false,
    tagline: "Try Ai AgentLab.",
    desc: "Try Ai AgentLab with 3 side-by-side AI comparisons using Gemini and Grok.",
    cta: "Start Trial",
    providers: ["Gemini", "Grok"],
    features: [
      { label: "3 total comparisons", included: true },
      { label: "2 starter providers (Gemini, Grok)", included: true },
      { label: "Side-by-side output view", included: true },
      { label: "Basic speed visibility", included: true },
      { label: "Saved history", included: false },
      { label: "Exports", included: false },
      { label: "Advanced scoring", included: false },
    ],
  },
  {
    key: "pro",
    planKey: "pro",
    name: "Ai AgentLab Pro",
    price: "$29",
    period: "/month",
    badge: "Recommended",
    popular: true,
    tagline: "For founders who need more.",
    desc: "For founders and builders who want more comparisons and access to Gemini, Grok, and Kimi.",
    cta: "Upgrade to Pro",
    providers: ["Gemini", "Grok", "Kimi"],
    features: [
      { label: "100 comparisons per month", included: true },
      { label: "Gemini, Grok, and Kimi access", included: true },
      { label: "Saved test history", included: true },
      { label: "Side-by-side comparison view", included: true },
      { label: "Basic export support", included: true },
      { label: "Winner Engine recommendations", included: true },
      { label: "OpenAI and Claude access", included: false },
      { label: "Advanced scoring", included: false },
    ],
  },
  {
    key: "studio",
    planKey: "studio",
    name: "Ai AgentLab Premium",
    price: "$49",
    period: "/month",
    badge: null,
    popular: false,
    tagline: "Full access. Deeper evaluation.",
    desc: "Advanced AI comparison with everything in Pro, plus OpenAI, Claude, deeper evaluation, and richer decision support.",
    cta: "Get Premium",
    providers: ["Gemini", "Grok", "Kimi", "OpenAI", "Claude"],
    features: [
      { label: "Everything in Pro", included: true },
      { label: "300 comparisons per month", included: true },
      { label: "OpenAI (GPT-4o) access", included: true },
      { label: "Claude access", included: true },
      { label: "Advanced scoring", included: true },
      { label: "Richer evaluation insights", included: true },
      { label: "Premium export and comparison workflow", included: true },
    ],
  },
];

const COMPARISON_ROWS = [
  { label: "Comparisons",       trial: "3 total",                        pro: "100 / month",                   premium: "300 / month" },
  { label: "Providers",         trial: "Gemini, Grok",                   pro: "Gemini, Grok, Kimi",            premium: "Gemini, Grok, Kimi, OpenAI, Claude" },
  { label: "Saved history",     trial: "—",                              pro: "✓",                             premium: "✓" },
  { label: "Exports",           trial: "—",                              pro: "Basic",                         premium: "Full" },
  { label: "Advanced scoring",  trial: "—",                              pro: "—",                             premium: "✓" },
  { label: "Winner Engine",     trial: "—",                              pro: "✓",                             premium: "✓" },
];

export default function Pricing() {
  const { data: billingStatus } = useBillingStatus();
  const { data: productsData, isLoading: productsLoading } = useBillingProducts();
  const { mutate: checkout, isPending: isCheckingOut } = useCheckout();
  const { mutate: managePortal, isPending: isPortaling } = useManageBilling();
  const { toast } = useToast();

  const currentPlan = billingStatus?.plan ?? "sandbox";

  function getPriceId(planName: string): string | undefined {
    if (!productsData?.products) return undefined;
    const product = productsData.products.find((p) =>
      p.name.toLowerCase().includes(planName.toLowerCase())
    );
    const monthlyPrice = product?.prices.find((p) => p.recurring?.interval === "month");
    return monthlyPrice?.id;
  }

  function handleUpgrade(tierName: string) {
    const priceId = getPriceId(tierName);
    if (!priceId) {
      toast({ title: "Products not loaded yet", description: "Please wait a moment and try again.", variant: "destructive" });
      return;
    }
    checkout(priceId);
  }

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[40%] rounded-full bg-primary/10 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">

        {/* Heading */}
        <div className="text-center max-w-3xl mx-auto mb-6">
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            className="text-xs font-semibold uppercase tracking-widest text-primary mb-4">
            Pricing
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }}
            className="text-4xl md:text-5xl font-display font-bold mb-5 leading-tight">
            Choose the right plan<br className="hidden sm:block" /> for how you build.
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
            className="text-muted-foreground text-base">
            Start with a trial, compare AI outputs side by side, and upgrade when you need more providers and deeper testing.
          </motion.p>
        </div>

        {/* Current plan banner */}
        {currentPlan !== "sandbox" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="max-w-5xl mx-auto mb-8 p-4 rounded-2xl bg-primary/5 border border-primary/20 flex items-center justify-between gap-4">
            <p className="text-sm font-medium">
              You're on the <span className="text-primary font-bold">
                {TIERS.find(t => t.planKey === currentPlan)?.name ?? currentPlan}
              </span> plan.
            </p>
            <Button variant="outline" size="sm" className="rounded-xl text-xs" onClick={() => managePortal()} disabled={isPortaling}>
              {isPortaling ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : null}
              Manage Subscription
            </Button>
          </motion.div>
        )}

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch mt-16">
          {TIERS.map((tier, i) => {
            const isCurrent = tier.planKey === currentPlan || (!tier.planKey && currentPlan === "sandbox");
            return (
              <motion.div
                key={tier.key}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 + i * 0.07 }}
                className={`relative flex flex-col rounded-3xl border backdrop-blur-sm transition-all ${
                  tier.popular
                    ? "border-primary/50 bg-card/70 ring-1 ring-primary/30 shadow-2xl shadow-primary/20 z-10 scale-[1.03]"
                    : "border-border/40 bg-card/30 hover:bg-card/50 hover:border-border/70"
                }`}
              >
                {tier.badge && !isCurrent && (
                  <div className="absolute -top-4 inset-x-0 flex justify-center">
                    <span className="bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider py-1.5 px-4 rounded-full shadow-lg shadow-primary/30">
                      {tier.badge}
                    </span>
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute -top-4 inset-x-0 flex justify-center">
                    <span className="bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider py-1.5 px-4 rounded-full">
                      Current Plan
                    </span>
                  </div>
                )}

                <div className="p-8 pb-0 pt-10">
                  <div className="mb-5">
                    <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-1">{tier.name}</h2>
                    <p className={`text-base font-semibold ${tier.popular ? "text-primary" : "text-foreground/70"}`}>{tier.tagline}</p>
                  </div>

                  <div className="flex items-baseline gap-1 mb-3">
                    <span className={`text-5xl font-display font-bold tracking-tight ${tier.popular ? "text-white" : "text-foreground"}`}>
                      {tier.price}
                    </span>
                    {tier.period && <span className="text-muted-foreground text-sm">{tier.period}</span>}
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed mb-5">{tier.desc}</p>

                  {/* Provider pills */}
                  <div className="mb-6">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Included providers</p>
                    <div className="flex flex-wrap gap-1.5">
                      {tier.providers.map((prov) => (
                        <span key={prov} className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-secondary/60 border border-border/50 text-foreground/80">
                          <ProviderIcon provider={prov} className="w-3 h-3" />
                          {prov}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* CTA */}
                  {!tier.planKey ? (
                    <Button asChild className="w-full h-12 text-sm font-semibold rounded-xl mb-6" variant="outline">
                      <Link href="/playground">{tier.cta}</Link>
                    </Button>
                  ) : isCurrent ? (
                    <Button
                      className="w-full h-12 text-sm font-semibold rounded-xl mb-6"
                      variant="outline"
                      onClick={() => managePortal()}
                      disabled={isPortaling}
                    >
                      {isPortaling ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      Manage Subscription
                    </Button>
                  ) : tier.key === "pro" ? (
                    import.meta.env.DEV ? (
                      <a
                        href="https://agent-lab.replit.app/pricing"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mb-6 flex w-full items-center justify-center h-12 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-lg shadow-primary/30 hover:bg-primary/90 transition-colors"
                      >
                        Upgrade to Pro →
                      </a>
                    ) : (
                      <div className="mb-6 flex justify-center [&>stripe-buy-button]:w-full">
                        <stripe-buy-button
                          buy-button-id="buy_btn_1TC8ZbCs26Gb3UhAKbarfXoH"
                          publishable-key="pk_live_51TC2tOCs26Gb3UhACBGhYa1B0vyZGMzV5sTuxfVQXmhV27K0XdevRZyUMAX1wjAemXj0oaTkj8hEuMOEOZGaRMP000JvQvNjYw"
                        />
                      </div>
                    )
                  ) : tier.key === "studio" ? (
                    import.meta.env.DEV ? (
                      <a
                        href="https://agent-lab.replit.app/pricing"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mb-6 flex w-full items-center justify-center h-12 rounded-xl border border-border text-foreground text-sm font-semibold hover:bg-secondary/50 transition-colors"
                      >
                        Get Premium →
                      </a>
                    ) : (
                      <div className="mb-6 flex justify-center [&>stripe-buy-button]:w-full">
                        <stripe-buy-button
                          buy-button-id="buy_btn_1TC8jMCs26Gb3UhALojeQP5U"
                          publishable-key="pk_live_51TC2tOCs26Gb3UhACBGhYa1B0vyZGMzV5sTuxfVQXmhV27K0XdevRZyUMAX1wjAemXj0oaTkj8hEuMOEOZGaRMP000JvQvNjYw"
                        />
                      </div>
                    )
                  ) : (
                    <Button
                      className={`w-full h-12 text-sm font-semibold rounded-xl mb-6 ${tier.popular ? "shadow-lg shadow-primary/30" : ""}`}
                      variant={tier.popular ? "default" : "outline"}
                      onClick={() => handleUpgrade(tier.name)}
                      disabled={isCheckingOut || productsLoading}
                    >
                      {isCheckingOut ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <>
                          {tier.cta}
                          {tier.popular && <ArrowRight className="ml-2 w-4 h-4" />}
                        </>
                      )}
                    </Button>
                  )}

                  <div className="h-px bg-border/40 w-full" />
                </div>

                <div className="p-8 pt-6 flex-1">
                  <ul className="space-y-3.5">
                    {tier.features.map((feat) => (
                      <li key={feat.label} className={`flex items-start gap-3 ${!feat.included ? "opacity-35" : ""}`}>
                        {feat.included ? (
                          <Check className={`w-4 h-4 mt-0.5 shrink-0 ${tier.popular ? "text-primary" : "text-muted-foreground"}`} />
                        ) : (
                          <X className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
                        )}
                        <span className={`text-sm leading-snug ${feat.included ? "text-foreground/85" : "text-muted-foreground"}`}>
                          {feat.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Footer note */}
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.4 }}
          className="text-center text-sm text-muted-foreground/60 mt-12">
          The Trial is built for exploration. Paid plans are built for real shipping decisions.
        </motion.p>

        {/* Comparison table */}
        <div className="mt-24 max-w-4xl mx-auto">
          <h3 className="text-center text-xl font-bold mb-8 text-foreground/80">Plan comparison</h3>
          <div className="glass-card rounded-2xl overflow-hidden border border-border/40">
            {/* Header */}
            <div className="grid grid-cols-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground border-b border-border/40">
              <div className="p-4 col-span-1">Feature</div>
              <div className="p-4 text-center border-l border-border/40">Trial</div>
              <div className="p-4 text-center border-l border-border/40 text-primary">Pro</div>
              <div className="p-4 text-center border-l border-border/40 text-violet-400">Premium</div>
            </div>
            {COMPARISON_ROWS.map((row, i) => (
              <div key={row.label} className={`grid grid-cols-4 text-sm ${i % 2 === 0 ? "bg-secondary/10" : ""}`}>
                <div className="p-4 text-foreground/70 font-medium">{row.label}</div>
                <div className="p-4 text-center text-muted-foreground border-l border-border/40 text-xs">{row.trial}</div>
                <div className="p-4 text-center text-primary font-semibold border-l border-border/40 text-xs">{row.pro}</div>
                <div className="p-4 text-center text-violet-400 font-semibold border-l border-border/40 text-xs">{row.premium}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Provider strip */}
        <div className="mt-16 max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">All available providers</p>
          <div className="flex flex-wrap justify-center gap-2">
            {PROVIDER_PILLS.map((p) => (
              <span key={p} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/50 border border-border/50 text-sm font-medium text-foreground/80">
                <ProviderIcon provider={p} className="w-3.5 h-3.5" />
                {p}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            Questions about which plan is right for you?{" "}
            <a href="mailto:hello@agentlab.ai" className="text-primary hover:underline">Get in touch</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
