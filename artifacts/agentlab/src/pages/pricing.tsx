import { Check, X, ArrowRight, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useBillingStatus, useBillingProducts, useCheckout, useManageBilling } from "@/hooks/use-billing";
import { useToast } from "@/hooks/use-toast";

const PLAN_CONFIG: Record<string, {
  name: string; price: string; period: string | null; badge: string | null;
  tagline: string; desc: string; cta: string; popular: boolean;
  planKey: string;
  features: { label: string; included: boolean }[];
}> = {
  Pro: {
    name: "Pro",
    price: "$19",
    period: "/month",
    badge: "Recommended",
    tagline: "Built for real shipping decisions.",
    desc: "The full working tier. Compare providers, get winner recommendations, and export the setup that works.",
    cta: "Upgrade to Pro",
    popular: true,
    planKey: "pro",
    features: [
      { label: "Multiple providers (Gemini, HF, Groq)", included: true },
      { label: "Unlimited saved runs", included: true },
      { label: "Winner Engine recommendations", included: true },
      { label: "Production export tools", included: true },
      { label: "Full comparison workflow", included: true },
      { label: "Advanced scoring (quality, speed, cost)", included: true },
      { label: "Deeper run history", included: true },
      { label: "Shared workspaces", included: false },
      { label: "Team collaboration", included: false },
    ],
  },
  Studio: {
    name: "Studio",
    price: "$49",
    period: "/month",
    badge: null,
    tagline: "Built for teams.",
    desc: "Everything in Pro, plus shared workspaces, review links, and collaboration tools for teams.",
    cta: "Get Studio",
    popular: false,
    planKey: "studio",
    features: [
      { label: "Everything in Pro", included: true },
      { label: "Shared workspaces", included: true },
      { label: "Review links", included: true },
      { label: "Workspace organization", included: true },
      { label: "Advanced decision support", included: true },
      { label: "Team collaboration features", included: true },
      { label: "Multiple providers (Gemini, HF, Groq)", included: true },
      { label: "Unlimited saved runs", included: true },
      { label: "Winner Engine recommendations", included: true },
      { label: "Production export tools", included: true },
    ],
  },
};

const SANDBOX_TIER = {
  name: "Trial",
  price: "$0",
  period: null,
  badge: null,
  tagline: "Try AI AgentLab free.",
  desc: "Try AI AgentLab with 4 free comparisons and see how different AI models respond to the same prompt.",
  popular: false,
  cta: "Start Trial",
  features: [
    { label: "4 total comparisons", included: true },
    { label: "1 AI provider", included: true },
    { label: "Side-by-side output view", included: true },
    { label: "Basic speed and cost visibility", included: true },
    { label: "Saved history", included: false },
    { label: "Production exports", included: false },
    { label: "Advanced scoring", included: false },
  ],
};

export default function Pricing() {
  const { data: billingStatus } = useBillingStatus();
  const { data: productsData, isLoading: productsLoading } = useBillingProducts();
  const { mutate: checkout, isPending: isCheckingOut } = useCheckout();
  const { mutate: managePortal, isPending: isPortaling } = useManageBilling();
  const { toast } = useToast();

  const currentPlan = billingStatus?.plan ?? "sandbox";

  function getPriceId(productName: string): string | undefined {
    if (!productsData?.products) return undefined;
    const product = productsData.products.find((p) =>
      p.name.toLowerCase() === productName.toLowerCase()
    );
    const monthlyPrice = product?.prices.find((p) => p.recurring?.interval === "month");
    return monthlyPrice?.id;
  }

  function handleUpgrade(planName: string) {
    const priceId = getPriceId(planName);
    if (!priceId) {
      toast({ title: "Products not loaded yet", description: "Please wait a moment and try again.", variant: "destructive" });
      return;
    }
    checkout(priceId);
  }

  const tiers = [
    { config: null, data: SANDBOX_TIER },
    { config: PLAN_CONFIG["Pro"], data: PLAN_CONFIG["Pro"] },
    { config: PLAN_CONFIG["Studio"], data: PLAN_CONFIG["Studio"] },
  ];

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[40%] rounded-full bg-primary/10 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">

        <div className="text-center max-w-3xl mx-auto mb-6">
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            className="text-xs font-semibold uppercase tracking-widest text-primary mb-4">
            Pricing
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }}
            className="text-4xl md:text-5xl font-display font-bold mb-5 leading-tight">
            Start with a Trial.<br className="hidden sm:block" /> Upgrade when you are ready to ship seriously.
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
            className="text-muted-foreground text-base">
            The Trial is built for exploration. Paid plans are built for real shipping decisions.
          </motion.p>
        </div>

        {/* Current plan banner */}
        {currentPlan !== "sandbox" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="max-w-5xl mx-auto mb-8 p-4 rounded-2xl bg-primary/5 border border-primary/20 flex items-center justify-between gap-4">
            <p className="text-sm font-medium">
              You're on the <span className="text-primary font-bold capitalize">{currentPlan}</span> plan.
            </p>
            <Button variant="outline" size="sm" className="rounded-xl text-xs" onClick={() => managePortal()} disabled={isPortaling}>
              {isPortaling ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : null}
              Manage Subscription
            </Button>
          </motion.div>
        )}

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch mt-16">
          {[SANDBOX_TIER, PLAN_CONFIG["Pro"]!, PLAN_CONFIG["Studio"]!].map((tier: any, i) => {
            const isCurrent = (tier.planKey ?? "sandbox") === currentPlan || (!tier.planKey && currentPlan === "sandbox");

            return (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 + i * 0.07 }}
                className={`relative flex flex-col rounded-3xl border backdrop-blur-sm transition-all ${
                  tier.popular
                    ? "border-primary/50 bg-card/70 ring-1 ring-primary/30 shadow-2xl shadow-primary/20 z-10 scale-[1.03]"
                    : "border-border/40 bg-card/30 hover:bg-card/50 hover:border-border/70"
                }`}
              >
                {tier.badge && (
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
                  <div className="mb-6">
                    <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-1">{tier.name}</h2>
                    <p className={`text-base font-semibold ${tier.popular ? "text-primary" : "text-foreground/70"}`}>{tier.tagline}</p>
                  </div>

                  <div className="flex items-baseline gap-1 mb-4">
                    <span className={`text-5xl font-display font-bold tracking-tight ${tier.popular ? "text-white" : "text-foreground"}`}>
                      {tier.price}
                    </span>
                    {tier.period && <span className="text-muted-foreground text-sm">{tier.period}</span>}
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed mb-8">{tier.desc}</p>

                  {/* CTA */}
                  {!tier.planKey ? (
                    <Button asChild className="w-full h-12 text-sm font-semibold rounded-xl mb-8" variant="outline">
                      <Link href="/playground">{tier.cta ?? "Start Trial"}</Link>
                    </Button>
                  ) : isCurrent ? (
                    <Button
                      className="w-full h-12 text-sm font-semibold rounded-xl mb-8"
                      variant="outline"
                      onClick={() => managePortal()}
                      disabled={isPortaling}
                    >
                      {isPortaling ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      Manage Subscription
                    </Button>
                  ) : (
                    <Button
                      className={`w-full h-12 text-sm font-semibold rounded-xl mb-8 ${tier.popular ? "shadow-lg shadow-primary/30" : ""}`}
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
                    {tier.features.map((feat: any) => (
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

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.4 }}
          className="text-center text-sm text-muted-foreground/60 mt-12">
          The free tier is built for exploration. Paid plans are built for real shipping decisions.
        </motion.p>

        {/* Comparison table */}
        <div className="mt-24 max-w-3xl mx-auto">
          <h3 className="text-center text-xl font-bold mb-8 text-foreground/80">Why upgrade to Pro?</h3>
          <div className="glass-card rounded-2xl overflow-hidden border border-border/40">
            <div className="grid grid-cols-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground border-b border-border/40">
              <div className="p-4 col-span-1">Feature</div>
              <div className="p-4 text-center border-l border-border/40">Trial</div>
              <div className="p-4 text-center border-l border-border/40 text-primary">Pro</div>
            </div>
            {[
              { label: "Providers", free: "1", pro: "All 3" },
              { label: "Comparisons", free: "4 total", pro: "Unlimited" },
              { label: "Saved history", free: "—", pro: "Full" },
              { label: "Winner Engine", free: "—", pro: "✓" },
              { label: "Production export", free: "—", pro: "✓" },
              { label: "Advanced scoring", free: "—", pro: "✓" },
            ].map((row, i) => (
              <div key={row.label} className={`grid grid-cols-3 text-sm ${i % 2 === 0 ? "bg-secondary/10" : ""}`}>
                <div className="p-4 text-foreground/70 font-medium">{row.label}</div>
                <div className="p-4 text-center text-muted-foreground border-l border-border/40">{row.free}</div>
                <div className="p-4 text-center text-primary font-semibold border-l border-border/40">{row.pro}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground">
            Questions about which plan is right for you?{" "}
            <a href="mailto:hello@agentlab.ai" className="text-primary hover:underline">Get in touch</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
