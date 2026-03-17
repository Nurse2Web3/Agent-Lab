import { Check, X } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";

export default function Pricing() {
  const tiers = [
    {
      name: "Sandbox",
      price: "$0",
      desc: "Explore the platform and get a feel for AI comparisons.",
      features: [
        "Demo mode",
        "1 live API provider",
        "5 saved runs",
        "Basic compare",
      ],
      missing: [
        "No exports",
        "No advanced scoring",
      ],
      cta: "Start Free",
      href: "/playground",
      popular: false
    },
    {
      name: "Pro",
      price: "$19",
      period: "/mo",
      desc: "Everything you need to ship better AI prompts faster.",
      features: [
        "3 providers",
        "Unlimited saved runs",
        "Export tools",
        "Winner recommendation",
        "History",
        "Better scoring",
      ],
      missing: [],
      cta: "Upgrade to Pro",
      href: "/",
      popular: true
    },
    {
      name: "Studio",
      price: "$49",
      period: "/mo",
      desc: "Built for teams collaborating on prompt engineering.",
      features: [
        "Everything in Pro",
        "Teams",
        "Shared workspaces",
        "Review links",
        "Advanced testing",
      ],
      missing: [],
      cta: "Contact Sales",
      href: "/",
      popular: false
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">Simple, transparent pricing</h1>
        <p className="text-xl text-muted-foreground">Start testing for free, upgrade when you need to run real production API calls.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {tiers.map((tier) => (
          <Card 
            key={tier.name} 
            className={`relative flex flex-col ${
              tier.popular 
                ? 'border-primary ring-1 ring-primary shadow-2xl shadow-primary/20 bg-card/80 scale-105 z-10' 
                : 'border-border/50 bg-card/40 hover:bg-card/60'
            } backdrop-blur-sm transition-all`}
          >
            {tier.popular && (
              <div className="absolute top-0 inset-x-0 -translate-y-1/2 flex justify-center">
                <span className="bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full">
                  Most Popular
                </span>
              </div>
            )}
            
            <CardHeader className="text-center pt-8 pb-4">
              <h3 className="text-xl font-bold mb-2">{tier.name}</h3>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-display font-bold">{tier.price}</span>
                {tier.period && <span className="text-muted-foreground">{tier.period}</span>}
              </div>
              <p className="text-sm text-muted-foreground mt-4 h-10">{tier.desc}</p>
            </CardHeader>
            
            <CardContent className="flex-1">
              <div className="h-px bg-border/50 w-full mb-6" />
              <ul className="space-y-3">
                {tier.features.map((feat) => (
                  <li key={feat} className="flex items-center gap-3">
                    <Check className={`w-4 h-4 shrink-0 ${tier.popular ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="text-sm text-foreground/80">{feat}</span>
                  </li>
                ))}
                {tier.missing.map((feat) => (
                  <li key={feat} className="flex items-center gap-3 opacity-40">
                    <X className="w-4 h-4 shrink-0 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{feat}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            
            <CardFooter className="pb-8">
              <Button 
                asChild 
                className="w-full h-12 text-base" 
                variant={tier.popular ? "default" : "secondary"}
              >
                <Link href={tier.href}>{tier.cta}</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      <div className="mt-20 text-center">
        <p className="text-muted-foreground">
          Need an enterprise license or self-hosted deployment? <a href="#" className="text-primary hover:underline">Contact us</a>.
        </p>
      </div>
    </div>
  );
}
