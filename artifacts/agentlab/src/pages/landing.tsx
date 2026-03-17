import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Trophy, History, Download, Plug, GitCompare, Sparkles, Check, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { ProviderIcon } from "@/components/provider-icon";

const FAQS = [
  {
    q: "What makes Ai AgentLab different from a normal AI playground?",
    a: "A normal playground helps you generate outputs. Ai AgentLab helps you compare them, score them, and decide what to ship.",
  },
  {
    q: "Do I need API keys to use it?",
    a: "No. You can start in demo mode and explore the workflow before connecting any providers.",
  },
  {
    q: "Who is this built for?",
    a: "Non-technical founders, indie makers, and product builders evaluating prompts and models for real AI features.",
  },
  {
    q: "Can I export what works?",
    a: "Yes. Paid plans let you copy the winning prompt, settings, and payload so you can use them in production.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border/50 rounded-2xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between p-6 text-left hover:bg-secondary/20 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span className="font-semibold text-base pr-4">{q}</span>
        {open ? <ChevronUp className="w-4 h-4 shrink-0 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground" />}
      </button>
      {open && (
        <div className="px-6 pb-6 text-muted-foreground leading-relaxed border-t border-border/30 pt-4">{a}</div>
      )}
    </div>
  );
}

export default function Landing() {
  return (
    <div className="relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[60%] rounded-full bg-indigo-500/10 blur-[120px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/80 to-background" />
      </div>

      {/* ── HERO ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8"
        >
          <Sparkles className="w-4 h-4" />
          <span>The AI decision studio for founders</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-7xl font-display font-bold tracking-tight text-white mb-6 leading-[1.1]"
        >
          Test AI agents. <br className="hidden md:block" />
          <span className="text-gradient-primary">Compare outputs.</span><br />
          Ship with confidence.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Ai AgentLab helps founders compare prompts and models side by side, score what matters, and choose the best option to ship — without scripts, spreadsheets, or switching between tabs.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Button size="lg" className="h-14 px-8 text-base rounded-full shadow-lg shadow-primary/25 bg-gradient-to-r from-primary to-primary/90 hover:opacity-90" asChild>
            <Link href="/playground">
              Try the Lab <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="h-14 px-8 text-base rounded-full bg-secondary/50 backdrop-blur border-border/50 hover:bg-secondary" asChild>
            <Link href="/playground">
              View Demo
            </Link>
          </Button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="mt-6 text-sm text-muted-foreground/70"
        >
          Built for non-technical founders, indie makers, and product builders shipping AI features.
        </motion.p>

        {/* Provider strip */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.55 }}
          className="mt-10"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60 mb-4">
            Compare outputs across leading AI providers in one workspace
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {["Gemini", "Grok", "Kimi", "OpenAI", "Claude"].map((p) => (
              <span key={p} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/50 border border-border/50 text-sm font-medium text-foreground/80 backdrop-blur-sm">
                <ProviderIcon provider={p} className="w-3.5 h-3.5" />
                {p}
              </span>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── PROBLEM SECTION ── */}
      <div className="relative z-10 border-t border-border/30 bg-background/40 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-6">Why this exists</p>
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">
            Choosing an AI model should not feel like guesswork.
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Most founders test the same prompt across multiple tools, compare responses manually, and try to remember which output was better, faster, or cheaper. The process is messy, inconsistent, and hard to trust.
          </p>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto mt-4">
            Ai AgentLab turns that into one workflow: run once, compare everything side by side, and choose what to ship with more confidence.
          </p>
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <div className="py-24 border-t border-border/50 bg-background/50 backdrop-blur-sm relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-4">How it works</p>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">One prompt. Multiple providers. Clear decision.</h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              {[
                { step: "01", title: "Run once", desc: "Enter your prompt, choose your providers, and launch a comparison in one click." },
                { step: "02", title: "Compare everything", desc: "See output quality, speed, token count, and estimated cost in one view instead of across scattered tabs." },
                { step: "03", title: "Choose the winner", desc: "Use the Winner Engine to surface Best Quality, Cheapest, Fastest, and the best overall option to ship." },
                { step: "04", title: "Export to production", desc: "Copy the winning prompt, settings, and payload so you can move from testing to shipping without rebuilding the setup manually." },
              ].map((item, i) => (
                <div key={i} className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full border border-primary/30 flex items-center justify-center text-primary font-display font-bold">
                    {item.step}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-2">{item.title}</h4>
                    <p className="text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-indigo-500/20 blur-3xl rounded-full" />
              <div className="glass-card rounded-2xl p-2 relative">
                <div className="bg-background rounded-xl border border-border overflow-hidden">
                  <div className="flex items-center gap-2 p-3 border-b border-border bg-secondary/50">
                    <div className="w-3 h-3 rounded-full bg-red-500/50" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                    <div className="w-3 h-3 rounded-full bg-green-500/50" />
                    <span className="ml-2 text-xs text-muted-foreground font-mono">agentlab — compare run</span>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="space-y-2">
                      <div className="h-2 rounded bg-secondary/60 w-3/4" />
                      <div className="h-2 rounded bg-secondary/60 w-1/2" />
                    </div>
                    <div className="grid grid-cols-3 gap-3 mt-4">
                      {["Gemini", "Grok", "HF"].map((p) => (
                        <div key={p} className="rounded-lg border border-border/50 p-3 bg-secondary/20">
                          <div className="text-xs font-medium mb-2 text-muted-foreground">{p}</div>
                          <div className="space-y-1">
                            <div className="h-1.5 rounded bg-secondary/80 w-full" />
                            <div className="h-1.5 rounded bg-secondary/60 w-5/6" />
                            <div className="h-1.5 rounded bg-secondary/40 w-4/5" />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 p-4 rounded-xl bg-primary/10 border border-primary/25">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Recommended Winner</div>
                          <span className="font-bold text-foreground">Grok</span>
                        </div>
                        <span className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded-full font-semibold">Ship This 🏆</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CORE FEATURES ── */}
      <div className="relative z-10 py-24 border-t border-border/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-4">Core features</p>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">A faster way to decide what to ship.</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: GitCompare,
                title: "Side-by-side comparison",
                desc: "Run the same prompt across multiple AI providers and compare outputs in a single view.",
                highlight: false,
              },
              {
                icon: Trophy,
                title: "Winner Engine",
                desc: "Ai AgentLab does not just show outputs. It recommends what to ship. Every run surfaces Best Quality, Cheapest, Fastest, and Recommended Winner so you can make tradeoffs quickly.",
                highlight: true,
              },
              {
                icon: Zap,
                title: "Demo mode",
                desc: "Try the workflow before connecting any API keys. Demo mode lets you explore the full product experience with realistic simulated results.",
                highlight: false,
              },
              {
                icon: History,
                title: "Saved history",
                desc: "Keep a record of past runs, revisit decisions, and compare new experiments against what worked before.",
                highlight: false,
              },
              {
                icon: Download,
                title: "Production export",
                desc: "Copy the winning prompt, settings, and API payload for real use in your product. No more rerunning tests just to recreate what worked.",
                highlight: false,
              },
              {
                icon: Plug,
                title: "Provider connections",
                desc: "Connect providers when you are ready and compare real outputs across Gemini, Hugging Face models, and Grok-hosted models.",
                highlight: false,
              },
            ].map((feature, i) => (
              <div
                key={i}
                className={`glass-card p-8 rounded-3xl text-left relative overflow-hidden group ${feature.highlight ? "border-primary/30 ring-1 ring-primary/20" : ""}`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${feature.highlight ? "bg-primary/20 text-primary" : "bg-secondary text-primary"}`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                {feature.highlight && (
                  <span className="inline-block text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full mb-3">Core feature</span>
                )}
                <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── WINNER ENGINE HIGHLIGHT ── */}
      <div className="relative z-10 py-24 border-t border-border/30 bg-background/40 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-4">Why it is different</p>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">
              More than a playground. A decision engine for AI builders.
            </h2>
          </div>

          <div className="glass-card rounded-3xl p-10 border-primary/20 ring-1 ring-primary/10 grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                Most tools help you generate outputs. Ai AgentLab helps you decide what to ship.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-8">
                The Winner Engine balances quality, speed, and cost efficiency so you can move faster with fewer bad guesses. Instead of comparing responses by eye and hoping for the best, you get a clearer path to a production-ready choice.
              </p>
              <ul className="space-y-3">
                {["Best Quality", "Cheapest", "Fastest", "Recommended Winner"].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm font-medium">
                    <div className="w-5 h-5 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-primary/25 bg-primary/5 overflow-hidden">
              <div className="px-5 py-3 border-b border-primary/15 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">Winner Engine</span>
              </div>
              <div className="p-6 space-y-4">
                {[
                  { label: "Best Quality", value: "Gemini", bar: "w-[92%]", color: "bg-emerald-500/60" },
                  { label: "Cheapest", value: "Grok", bar: "w-[78%]", color: "bg-sky-500/60" },
                  { label: "Fastest", value: "Grok", bar: "w-[95%]", color: "bg-violet-500/60" },
                ].map((row) => (
                  <div key={row.label}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-muted-foreground">{row.label}</span>
                      <span className="font-semibold text-foreground">{row.value}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-border/40">
                      <div className={`h-full rounded-full ${row.bar} ${row.color}`} />
                    </div>
                  </div>
                ))}
                <div className="mt-4 p-4 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-muted-foreground mb-0.5">Recommended Winner</div>
                    <span className="font-bold text-lg">Grok</span>
                  </div>
                  <span className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-full font-semibold">Ship This 🏆</span>
                </div>
              </div>
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground/70 mt-8">
            Built to grow from prompt comparison into full agent testing, version tracking, and workflow evaluation.
          </p>
        </div>
      </div>

      {/* ── PROVIDERS ── */}
      <div className="relative z-10 py-24 border-t border-border/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-4">Supported providers</p>
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-12">Start with free-friendly providers. Expand when ready.</h2>

          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {[
              { name: "Gemini", sub: "Balanced and a strong free-tier starting point", emoji: "✦" },
              { name: "Hugging Face", sub: "Open-model variety and flexibility", emoji: "🤗" },
              { name: "Grok", sub: "Speed-first comparisons", emoji: "⚡" },
            ].map((p) => (
              <div key={p.name} className="glass-card rounded-2xl p-8 text-center group hover:border-primary/30 transition-colors">
                <div className="text-3xl mb-4">{p.emoji}</div>
                <h3 className="text-lg font-bold mb-2">{p.name}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.sub}</p>
              </div>
            ))}
          </div>

          <p className="text-sm text-muted-foreground/70">
            Designed to support real provider comparisons today, with room to expand into broader agent workflows over time.
          </p>
        </div>
      </div>

      {/* ── WHO IT'S FOR ── */}
      <div className="relative z-10 py-24 border-t border-border/30 bg-background/40 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-4">Who it is for</p>
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">Built for founders making product decisions.</h2>
          <p className="text-lg text-muted-foreground leading-relaxed mb-10 max-w-2xl mx-auto">
            Ai AgentLab is designed for non-technical founders, indie makers, and product builders who want a faster, clearer way to choose the right AI setup for their product.
          </p>
          <ul className="inline-flex flex-col items-start gap-4 text-left">
            {[
              "Compare prompts without writing test scripts",
              "Understand tradeoffs without using spreadsheets",
              "Move from testing to shipping with less friction",
              "Make better model decisions with more confidence",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-base">
                <div className="w-5 h-5 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-primary" />
                </div>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── PRICING PREVIEW ── */}
      <div className="relative z-10 py-24 border-t border-border/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-4">Pricing</p>
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-12">
            Start with a Trial. Upgrade when you are ready to ship seriously.
          </h2>

          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {[
              {
                name: "Ai AgentLab Trial",
                price: "$0",
                providers: ["Gemini", "Grok"],
                desc: "Try Ai AgentLab with 3 side-by-side AI comparisons using Gemini and Grok.",
                highlight: false,
              },
              {
                name: "Ai AgentLab Pro",
                price: "$29/mo",
                providers: ["Gemini", "Grok", "Kimi"],
                desc: "For founders and builders who want more comparisons and access to Gemini, Grok, and Kimi.",
                highlight: true,
              },
              {
                name: "Ai AgentLab Premium",
                price: "$49/mo",
                providers: ["Gemini", "Grok", "Kimi", "OpenAI", "Claude"],
                desc: "Advanced AI comparison with everything in Pro, plus OpenAI, Claude, deeper evaluation, and richer decision support.",
                highlight: false,
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`glass-card rounded-2xl p-8 text-left ${plan.highlight ? "border-primary/40 ring-1 ring-primary/20 relative" : ""}`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold uppercase tracking-wider text-primary-foreground bg-primary px-3 py-1 rounded-full">Recommended</span>
                )}
                <div className="flex items-baseline justify-between mb-1">
                  <h3 className="text-lg font-bold">{plan.name}</h3>
                  <span className="text-sm font-semibold text-muted-foreground">{plan.price}</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{plan.desc}</p>
                <div className="flex flex-wrap gap-1.5">
                  {plan.providers.map((p) => (
                    <span key={p} className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-secondary/60 border border-border/50 text-foreground/80">
                      <ProviderIcon provider={p} className="w-3 h-3" />
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <p className="text-sm text-muted-foreground/70">
            The Trial is built for exploration. Paid plans are built for real shipping decisions.
          </p>

          <div className="mt-8">
            <Button variant="outline" className="rounded-full" asChild>
              <Link href="/pricing">See full pricing</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* ── FAQ ── */}
      <div className="relative z-10 py-24 border-t border-border/30 bg-background/40 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-bold">Common questions</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq) => (
              <FaqItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </div>

      {/* ── FINAL CTA ── */}
      <div className="py-32 relative z-10">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
            Stop guessing which AI setup to ship.
          </h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-xl mx-auto leading-relaxed">
            Compare prompts, evaluate tradeoffs, and choose the best version with more confidence.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="h-14 px-10 text-base rounded-full shadow-lg shadow-primary/25 bg-gradient-to-r from-primary to-primary/90 hover:opacity-90" asChild>
              <Link href="/playground">
                Try the Lab <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-8 text-base rounded-full bg-secondary/50 backdrop-blur border-border/50 hover:bg-secondary" asChild>
              <Link href="/pricing">View Pricing</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
