import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Trophy, History, Download, Plug, GitCompare, Sparkles, Check, ChevronDown, ChevronUp, ShieldCheck, BarChart3, Layers, FlaskConical } from "lucide-react";
import { useState } from "react";
import { ProviderIcon } from "@/components/provider-icon";
import { BillingPolicy } from "@/components/billing-policy";

const FAQS = [
  {
    q: "What is Ai AgentLab?",
    a: "Ai AgentLab is an AI evaluation workspace. You build a test set, run it across models and prompts, score outputs on quality, speed, cost, and consistency, then get a clear recommendation for what is safe to ship.",
  },
  {
    q: "How is this different from a prompt playground?",
    a: "Playgrounds help you generate outputs. AgentLab helps you validate them. Every run is scored, compared against your criteria, and summarized into a ship or do not ship decision — so you are not guessing when you go to production.",
  },
  {
    q: "Who is this built for?",
    a: "Founders, product teams, and indie makers who are building AI features and need evidence — not gut feel — to choose the right model, prompt, or agent setup before they ship.",
  },
  {
    q: "Can I export the evaluation results?",
    a: "Yes. Paid plans let you export scored results as CSV or PDF — including the winning model, score breakdown, and recommendation — so you can share it with your team or document the decision.",
  },
  {
    q: "Do I need API keys to start?",
    a: "No. You can explore the workflow in demo mode before connecting any providers. When you are ready, connect your keys and run real evaluations.",
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
          <FlaskConical className="w-4 h-4" />
          <span>AI evaluation workspace for founders &amp; product teams</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-7xl font-display font-bold tracking-tight text-white mb-6 leading-[1.1]"
        >
          Validate AI<br className="hidden md:block" />
          <span className="text-gradient-primary">before you ship.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Run the same tasks across models and prompts, score outputs on quality, speed, cost, and consistency, detect regressions, and choose what is safe to ship — with evidence, not gut feel.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Button size="lg" className="h-14 px-8 text-base rounded-full shadow-lg shadow-primary/25 bg-gradient-to-r from-primary to-primary/90 hover:opacity-90" asChild>
            <Link href="/playground">
              Start Evaluating <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="h-14 px-8 text-base rounded-full bg-secondary/50 backdrop-blur border-border/50 hover:bg-secondary" asChild>
            <Link href="/playground?demo=true">
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
          Pre-production validation for founders, product teams, and AI builders.
        </motion.p>

        {/* Provider strip */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.55 }}
          className="mt-10"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60 mb-4">
            Evaluate across four leading AI providers in one workspace
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {["OpenAI", "Claude", "GROK THE ELON MODEL 🥇", "Perplexity"].map((p) => (
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
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-6">The problem</p>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">
              Most teams ship AI without validation.
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              One test run, one output, one guess. That is not a release process — that is how regressions end up in production.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { title: "Manual testing is slow", desc: "Copying prompts across ChatGPT, Claude, and API playgrounds wastes hours and produces results you can't reproduce." },
              { title: "One-off outputs are misleading", desc: "A single response tells you nothing about consistency, reliability, or how the model behaves under variation." },
              { title: "Prompt changes create hidden regressions", desc: "A small edit to your system prompt can silently break behavior you already validated. Without a baseline, you won't catch it." },
              { title: "Teams ship without evidence", desc: "Most AI releases are based on vibes, not data. There is no paper trail, no scoring, no documented reason for the decision." },
            ].map((item, i) => (
              <div key={i} className="glass-card rounded-2xl p-6 flex gap-4 items-start">
                <div className="w-6 h-6 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-red-400 text-xs font-bold">✕</span>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">{item.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <div className="py-24 border-t border-border/50 bg-background/50 backdrop-blur-sm relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-4">How it works</p>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">From test set to ship decision in one workflow.</h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              {[
                { step: "01", title: "Build a test set", desc: "Write the prompts and tasks that matter for your product. Organize them by use case — support, coding, research, or your own custom criteria." },
                { step: "02", title: "Run across models and prompts", desc: "Fire your test set across up to 4 AI providers simultaneously. No switching tabs. No copy-pasting. One click." },
                { step: "03", title: "Score quality, speed, cost, consistency", desc: "Every run is scored across multiple dimensions. The Winner Engine surfaces the best option for each tradeoff — not just the one that looked good once." },
                { step: "04", title: "Compare against baseline", desc: "Test new prompt versions and model updates against a known-good baseline. Catch regressions before they reach production." },
                { step: "05", title: "Approve what ships", desc: "Export a scored recommendation — with evidence — so your team can make a documented, confident release decision." },
              ].map((item, i) => (
                <div key={i} className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full border border-primary/30 flex items-center justify-center text-primary font-display font-bold text-sm">
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
                    <span className="ml-2 text-xs text-muted-foreground font-mono">agentlab — evaluation run</span>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="space-y-1 mb-3">
                      <div className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Test prompt</div>
                      <div className="h-2 rounded bg-secondary/60 w-3/4" />
                      <div className="h-2 rounded bg-secondary/60 w-1/2" />
                    </div>
                    <div className="grid grid-cols-3 gap-3 mt-4">
                      {["OpenAI", "Claude", "Grok"].map((p) => (
                        <div key={p} className="rounded-lg border border-border/50 p-3 bg-secondary/20">
                          <div className="text-xs font-medium mb-2 text-muted-foreground">{p}</div>
                          <div className="space-y-1">
                            <div className="h-1.5 rounded bg-secondary/80 w-full" />
                            <div className="h-1.5 rounded bg-secondary/60 w-5/6" />
                            <div className="h-1.5 rounded bg-secondary/40 w-4/5" />
                          </div>
                          <div className="mt-2 text-xs text-emerald-400 font-semibold">Score: 91</div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-xs text-muted-foreground mb-0.5">Validation result</div>
                          <span className="font-bold text-foreground text-sm">Grok — Safe to ship</span>
                        </div>
                        <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full font-semibold">✓ Approved</span>
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
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-4">Evaluation features</p>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Everything you need to validate before shipping.</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: BarChart3,
                title: "Multi-dimensional scoring",
                desc: "Every run is scored on quality, speed, cost, and consistency — not just how the output looks. The Winner Engine surfaces the best option for each tradeoff so you can make an informed decision.",
                highlight: true,
              },
              {
                icon: GitCompare,
                title: "Baseline vs. challenger",
                desc: "Set a known-good baseline. Run a new prompt version or model against it. Get a side-by-side regression report so you can see exactly what changed — and whether it got better or worse.",
                highlight: false,
              },
              {
                icon: ShieldCheck,
                title: "Pre-production validation",
                desc: "AgentLab is not a sandbox for exploration. It is a validation layer for release decisions — built for teams who need evidence before they deploy an AI feature.",
                highlight: false,
              },
              {
                icon: History,
                title: "Evaluation history",
                desc: "Every test run is saved. Go back, compare across sessions, and build a documented record of every decision your team made before shipping.",
                highlight: false,
              },
              {
                icon: Download,
                title: "Exportable decision reports",
                desc: "Export your evaluation as CSV or PDF — scored outputs, winner recommendation, and failure cases included. Share it with your team or attach it to your release process.",
                highlight: false,
              },
              {
                icon: Layers,
                title: "Four AI providers",
                desc: "Evaluate across GPT-4o, Claude 3.5, Grok, and Perplexity Sonar Pro in one workspace. No switching tabs, no rebuilding the same prompt four times.",
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
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-4">The Winner Engine</p>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">
              Not just outputs. A scored, documented release decision.
            </h2>
          </div>

          <div className="glass-card rounded-3xl p-10 border-primary/20 ring-1 ring-primary/10 grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                Most teams pick a model based on one output that felt right. The Winner Engine gives you a structured score across every dimension that matters in production.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-8">
                Quality. Speed. Cost. Consistency. Every run is evaluated across all four — so when you ship, you have data behind the decision, not just a hunch.
              </p>
              <ul className="space-y-3">
                {["Output quality score", "Speed and latency ranking", "Cost efficiency comparison", "Consistency across runs", "Recommended Winner with rationale"].map((item) => (
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
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">Evaluation Report</span>
              </div>
              <div className="p-6 space-y-4">
                {[
                  { label: "Output Quality", value: "Grok 🥇", bar: "w-[92%]", color: "bg-emerald-500/60" },
                  { label: "Cost Efficiency", value: "Grok", bar: "w-[85%]", color: "bg-sky-500/60" },
                  { label: "Response Speed", value: "Grok", bar: "w-[95%]", color: "bg-violet-500/60" },
                  { label: "Consistency", value: "Claude", bar: "w-[88%]", color: "bg-amber-500/60" },
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
                    <div className="text-xs text-muted-foreground mb-0.5">Recommended to Ship</div>
                    <span className="font-bold text-lg">Grok</span>
                  </div>
                  <span className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-full font-semibold">Ship This 🏆</span>
                </div>
              </div>
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground/70 mt-8">
            Built to scale from prompt validation into full agent regression testing and production monitoring.
          </p>
        </div>
      </div>

      {/* ── USE CASES ── */}
      <div className="relative z-10 py-24 border-t border-border/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-4">Use cases</p>
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-12">What teams validate with AgentLab.</h2>

          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {[
              { emoji: "🤝", name: "Support agents", desc: "Validate that your support AI handles edge cases, escalation prompts, and out-of-scope questions before going live." },
              { emoji: "💻", name: "AI copilots", desc: "Test your coding or writing assistant across models to find the one that produces the most consistent, high-quality output for your use case." },
              { emoji: "🔍", name: "Research assistants", desc: "Evaluate factual accuracy and citation quality across models — especially with Perplexity Sonar Pro for real-time web-grounded responses." },
              { emoji: "📋", name: "Prompt QA", desc: "Run your system prompts through structured test sets before every release. Catch regressions early instead of in production." },
              { emoji: "🚀", name: "Release testing", desc: "Set a baseline, run a challenger version, and get a regression report — so your team can make a documented, confident deploy decision." },
              { emoji: "🏢", name: "Internal policy assistants", desc: "Validate that AI tools trained on company policy respond accurately and stay in-scope across a range of realistic employee queries." },
            ].map((p) => (
              <div key={p.name} className="glass-card rounded-2xl p-6 text-left group hover:border-primary/30 transition-colors">
                <div className="text-2xl mb-3">{p.emoji}</div>
                <h3 className="text-base font-bold mb-2">{p.name}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── PROVIDERS ── */}
      <div className="relative z-10 py-24 border-t border-border/30 bg-background/40 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-4">Supported providers</p>
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-12">Four leading AI providers. One evaluation workspace.</h2>

          <div className="grid md:grid-cols-4 gap-6 mb-10">
            {[
              { name: "OpenAI", sub: "GPT-4o — fast and cost-effective", emoji: "◎" },
              { name: "Claude", sub: "Nuanced, safe, highly consistent", emoji: "✺" },
              { name: "GROK THE ELON MODEL 🥇", sub: "Fast, direct, and widely discussed", emoji: "⚡" },
              { name: "Perplexity Sonar Pro", sub: "Real-time web-grounded AI — Premium only", emoji: "🌐" },
            ].map((p) => (
              <div key={p.name} className="glass-card rounded-2xl p-8 text-center group hover:border-primary/30 transition-colors">
                <div className="text-3xl mb-4">{p.emoji}</div>
                <h3 className="text-lg font-bold mb-2">{p.name}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.sub}</p>
              </div>
            ))}
          </div>

          <p className="text-sm text-muted-foreground/70">
            Built for real provider evaluation today, with a roadmap toward multi-step agent testing and production monitoring.
          </p>
        </div>
      </div>

      {/* ── WHO IT'S FOR ── */}
      <div className="relative z-10 py-24 border-t border-border/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-4">Who it is for</p>
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">For teams who need evidence before they ship.</h2>
          <p className="text-lg text-muted-foreground leading-relaxed mb-10 max-w-2xl mx-auto">
            Ai AgentLab is built for founders, product managers, and developers who are accountable for AI features in production — and who need a documented, defensible process for getting there.
          </p>
          <ul className="inline-flex flex-col items-start gap-4 text-left">
            {[
              "Validate prompts and models before every release",
              "Catch regressions before they reach production",
              "Score outputs on quality, speed, cost, and consistency",
              "Export a recommendation your team can act on",
              "Build a history of decisions — not just a folder of screenshots",
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
      <div className="relative z-10 py-24 border-t border-border/30 bg-background/40 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-4">Pricing</p>
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-12">
            Start free. Upgrade when your release process demands it.
          </h2>
        </div>

        <BillingPolicy />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {[
              {
                name: "Ai AgentLab Trial",
                price: "$0",
                providers: ["OpenAI", "Claude"],
                desc: "3 evaluations — GPT + Claude. Understand the workflow before you commit.",
                highlight: false,
              },
              {
                name: "Ai AgentLab Pro",
                price: "$29/mo",
                providers: ["OpenAI", "Claude", "GROK THE ELON MODEL 🥇"],
                desc: "100 evaluations/month across 3 models. CSV and PDF export. Saved history. Built for founders shipping regularly.",
                highlight: true,
              },
              {
                name: "Ai AgentLab Premium",
                price: "$49/mo",
                providers: ["Perplexity", "OpenAI", "Claude", "GROK THE ELON MODEL 🥇"],
                desc: "500 evaluations/month. All 4 providers including Perplexity Sonar Pro. Advanced scoring. Built for teams and power users.",
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
                  <h3 className="text-sm font-semibold text-muted-foreground">{plan.name}</h3>
                  <span className="text-xl font-bold text-foreground">{plan.price}</span>
                </div>
                <p className="text-sm text-foreground/70 mb-4 leading-relaxed">{plan.desc}</p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {plan.providers.map((prov) => (
                    <span key={prov} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-secondary/60 border border-border/50 text-foreground/70">
                      <ProviderIcon provider={prov} className="w-3 h-3" />
                      {prov}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <Button size="lg" className="rounded-full px-8" asChild>
            <Link href="/pricing">See full pricing <ArrowRight className="ml-2 w-4 h-4" /></Link>
          </Button>
        </div>
      </div>

      {/* ── FAQ ── */}
      <div className="relative z-10 py-24 border-t border-border/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-4">FAQ</p>
            <h2 className="text-3xl md:text-4xl font-display font-bold">Common questions.</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => <FaqItem key={i} {...faq} />)}
          </div>
        </div>
      </div>

      {/* ── FINAL CTA ── */}
      <div className="relative z-10 py-24 border-t border-border/30 bg-background/40 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
            Stop guessing.<br />
            <span className="text-gradient-primary">Start validating.</span>
          </h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
            Run your first evaluation in minutes. No API keys required to start.
          </p>
          <Button size="lg" className="h-14 px-10 text-base rounded-full shadow-lg shadow-primary/25 bg-gradient-to-r from-primary to-primary/90 hover:opacity-90" asChild>
            <Link href="/playground">
              Start Evaluating Free <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
