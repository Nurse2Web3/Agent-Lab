import { Check } from "lucide-react";

function GreenCheck() {
  return (
    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/30 shrink-0 mt-0.5">
      <Check className="w-3 h-3 text-emerald-400" />
    </span>
  );
}

export function BillingPolicy() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
      <div className="grid sm:grid-cols-2 gap-6">
        {/* Subscriptions */}
        <div className="glass-card rounded-2xl p-7 border border-border/40">
          <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-5">
            Subscriptions
          </h3>
          <ul className="space-y-3.5">
            {[
              { text: "Month-to-month billing" },
              {
                text: (
                  <>
                    <a
                      href="https://support.stripe.com/questions/canceling-a-subscription"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
                    >
                      Cancel anytime
                    </a>{" "}
                    in the Stripe dashboard
                  </>
                ),
              },
              { text: "No contracts, no long-term commitments" },
              { text: "Pro access until end of paid month after cancellation" },
              { text: "No refunds after 7 days (Stripe policy)" },
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-foreground/80 leading-snug">
                <GreenCheck />
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Returns Policy */}
        <div className="glass-card rounded-2xl p-7 border border-border/40">
          <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-5">
            Returns Policy
          </h3>
          <ul className="space-y-3.5">
            {[
              { text: "7-day full refund guarantee" },
              {
                text: (
                  <>
                    Contact{" "}
                    <a
                      href="mailto:support@nurse2web3.com"
                      className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
                    >
                      support@nurse2web3.com
                    </a>{" "}
                    within 7 days
                  </>
                ),
              },
              { text: "Refunds processed to original payment method" },
              { text: "After 7 days: no refunds (digital service already delivered)" },
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-foreground/80 leading-snug">
                <GreenCheck />
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
