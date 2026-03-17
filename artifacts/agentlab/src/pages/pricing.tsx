import { Check, X, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const TIERS = [
  {
    name: "Sandbox",
    price: "$0",
    period: null,
    badge: null,
    tagline: "Built for exploration.",
    desc: "Get a feel for the workflow before committing to anything. Demo mode included, no API keys needed.",
    cta: "Start Free",
    href: "/playground",
    popular: false,
    features: [
      { label: "Demo mode (no API keys needed)", included: true },
      { label: "1 live API provider", included: true },
      { label: "5 saved runs", included: true },
      { label: "Basic side-by-side comparison", included: true },
      { label: "Basic cost estimation", included: true },
      { label: "Production export tools", included: false },
      { label: "Winner Engine recommendations", included: false },
      { label: "Advanced scoring", included: false },
      { label: "Unlimited saved runs", included: false },
      { label: "Team features", included: false },
    ],
  },
  {
    name: "Pro",
    price: "$19",
    period: "/month",
    badge: "Recommended",
    tagline: "Built for real shipping decisions.",
    desc: "The full working tier. Compare providers, get winner recommendations, and export the setup that works — all in one place.",
    cta: "Upgrade to Pro",
    href: "/playground",
    popular: true,
    features: [
      { label: "Multiple providers (Gemini, HF, Groq)", included: true },
      { label: "Unlimited saved runs", included: true },
      { label: "Winner Engine recommendations", included: true },
      { label: "Production export tools", included: true },
      { label: "Full comparison workflow", included: true },
      { label: "Advanced scoring (quality, speed, cost)", included: true },
      { label: "Deeper run history", included: true },
      { label: "Built for real product decisions", included: true },
      { label: "Shared workspaces", included: false },
      { label: "Team collaboration", included: false },
    ],
  },
  {
    name: "Studio",
    price: "$49",
    period: "/month",
    badge: null,
    tagline: "Built for teams.",
    desc: "Everything in Pro, plus shared workspaces, review links, and collaboration tools for teams making AI decisions together.",
    cta: "Get Studio",
    href: "/playground",
    popular: false,
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
];

export default function Pricing() {
  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[40%] rounded-full bg-primary/10 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">

        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-6">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-xs font-semibold uppercase tracking-widest text-primary mb-4"
          >
            Pricing
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="text-4xl md:text-5xl font-display font-bold mb-5 leading-tight"
          >
            Start in Sandbox.<br className="hidden sm:block" /> Upgrade when you are ready to ship seriously.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-muted-foreground text-base"
          >
            The free tier is built for exploration. Paid plans are built for real shipping decisions.
          </motion.p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch mt-16">
          {TIERS.map((tier, i) => (
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
              {/* Badge */}
              {tier.badge && (
                <div className="absolute -top-4 inset-x-0 flex justify-center">
                  <span className="bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider py-1.5 px-4 rounded-full shadow-lg shadow-primary/30">
                    {tier.badge}
                  </span>
                </div>
              )}

              <div className="p-8 pb-0 pt-10">
                {/* Plan name + tagline */}
                <div className="mb-6">
                  <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-1">{tier.name}</h2>
                  <p className={`text-base font-semibold ${tier.popular ? "text-primary" : "text-foreground/70"}`}>{tier.tagline}</p>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-1 mb-4">
                  <span className={`text-5xl font-display font-bold tracking-tight ${tier.popular ? "text-white" : "text-foreground"}`}>
                    {tier.price}
                  </span>
                  {tier.period && (
                    <span className="text-muted-foreground text-sm">{tier.period}</span>
                  )}
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground leading-relaxed mb-8">{tier.desc}</p>

                {/* CTA */}
                <Button
                  asChild
                  className={`w-full h-12 text-sm font-semibold rounded-xl mb-8 ${
                    tier.popular
                      ? "bg-primary hover:opacity-90 shadow-lg shadow-primary/30"
                      : ""
                  }`}
                  variant={tier.popular ? "default" : "outline"}
                >
                  <Link href={tier.href}>
                    {tier.cta}
                    {tier.popular && <ArrowRight className="ml-2 w-4 h-4" />}
                  </Link>
                </Button>

                <div className="h-px bg-border/40 w-full" />
              </div>

              {/* Feature list */}
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
          ))}
        </div>

        {/* Supporting line */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="text-center text-sm text-muted-foreground/60 mt-12"
        >
          The free tier is built for exploration. Paid plans are built for real shipping decisions.
        </motion.p>

        {/* Comparison table hint */}
        <div className="mt-24 max-w-3xl mx-auto">
          <h3 className="text-center text-xl font-bold mb-8 text-foreground/80">Why upgrade to Pro?</h3>
          <div className="glass-card rounded-2xl overflow-hidden border border-border/40">
            <div className="grid grid-cols-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground border-b border-border/40">
              <div className="p-4 col-span-1">Feature</div>
              <div className="p-4 text-center border-l border-border/40">Sandbox</div>
              <div className="p-4 text-center border-l border-border/40 text-primary">Pro</div>
            </div>
            {[
              { label: "Providers", free: "1", pro: "All 3" },
              { label: "Saved runs", free: "5", pro: "Unlimited" },
              { label: "Winner Engine", free: "—", pro: "✓" },
              { label: "Production export", free: "—", pro: "✓" },
              { label: "Advanced scoring", free: "—", pro: "✓" },
              { label: "Run history", free: "Basic", pro: "Full" },
            ].map((row, i) => (
              <div key={row.label} className={`grid grid-cols-3 text-sm ${i % 2 === 0 ? "bg-secondary/10" : ""}`}>
                <div className="p-4 text-foreground/70 font-medium">{row.label}</div>
                <div className="p-4 text-center text-muted-foreground border-l border-border/40">{row.free}</div>
                <div className="p-4 text-center text-primary font-semibold border-l border-border/40">{row.pro}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground">
            Questions about which plan is right for you?{" "}
            <a href="mailto:hello@agentlab.ai" className="text-primary hover:underline">
              Get in touch
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
