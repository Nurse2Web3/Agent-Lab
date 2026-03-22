# Ai AgentLab

## Overview

Ai AgentLab is a founder-friendly AI comparison studio. Users can compare prompts side-by-side across multiple AI models (GPT-4o, Claude, Grok), score outputs, and see speed + cost breakdowns.

**Tagline:** Compare AI models side-by-side. Find what works. Ship faster.

## Tiers

- **Trial** — $0, 3 comparisons, GPT-4o + Claude only
- **Pro** — $29/mo, 100 comparisons/mo, adds GROK THE ELON MODEL 🥇
- **Premium (Studio)** — $49/mo, 500 comparisons/mo, all 3 models

## Stack

- **Monorepo**: pnpm workspaces
- **Frontend**: React + Vite + Tailwind CSS (`artifacts/agentlab`)
- **Backend**: Express 5 (`artifacts/api-server`)
- **Database**: PostgreSQL + Drizzle ORM
- **Email**: Resend (from: `noreply@nurse2web3.com`)
- **Payments**: Stripe (subscriptions + card verification)
- **CAPTCHA**: Cloudflare Turnstile (site key: `0x4AAAAAACuksF2bnJ4Rzaei`)
- **Animations**: Framer Motion

## Structure

```text
artifacts/
├── agentlab/               # React + Vite frontend
│   └── src/
│       ├── pages/          # Landing, Playground, History, Pricing, Settings
│       ├── components/     # trial-gate.tsx, card-activation-modal.tsx, ui/
│       ├── hooks/          # use-billing.ts, use-trial.ts
│       └── lib/            # deviceFingerprint.ts
├── api-server/             # Express 5 backend
│   └── src/
│       ├── lib/
│       │   ├── providers/        # openai.ts, claude.ts, groq.ts (xAI grok-beta)
│       │   ├── email.ts          # Resend magic link emails
│       │   └── disposableEmailDomains.ts
│       ├── middleware/
│       │   └── rateLimiter.ts    # IP + device rate limiting
│       ├── trialStorage.ts       # Trial DB operations (card_verified, setup_intent_id)
│       ├── billingStorage.ts     # Monthly usage tracking
│       └── routes/               # compare.ts, trial.ts, billing.ts, history.ts
```

## Trial Abuse Protection (6 layers)

1. **Cloudflare Turnstile** — invisible managed CAPTCHA, verified server-side
2. **Honeypot field** — hidden form field catches bots
3. **Timing check** — rejects submissions < 3s after form load
4. **Disposable email blocking** — 200+ throwaway domain blocklist
5. **IP + device fingerprint blocking** — max 2 signups per IP/device per 24h; permanent block after verified trial
6. **Stripe card verification** — SetupIntent ($0 charge) required to activate trial; verifies real human identity

## Database Tables

- `history` — saved comparison runs
- `api_keys` — provider API keys (server-side only)
- `billing_users` — Stripe customer + subscription IDs
- `trial_users` — email, email_verified, card_verified, setup_intent_id, payment_method_id, device_fingerprint, ip_address
- `trial_signup_log` — audit log for all suspicious/blocked events

## Key Secrets

- `STRIPE_API_KEY` — Stripe live secret key (user-added)
- `STRIPE_SECRET_KEY` — legacy/integration key (superseded by STRIPE_API_KEY)
- `RESEND_API_KEY` — Resend email service
- `TURNSTILE_SECRET_KEY` — Cloudflare Turnstile secret
- `ANTHROPIC_API_KEY` — Claude API

## Trial Flow

1. User enters email on Playground → Cloudflare Turnstile verifies
2. Magic link sent via Resend from `noreply@nurse2web3.com`
3. User clicks link → redirected back with `trialId` in URL
4. Card activation modal appears (Stripe Elements, $0 charge, dark theme)
5. Card confirmed → trial active → 3 comparisons unlocked

## Stripe Configuration

- Stripe publishable key: `pk_live_51TC2tOCs26Gb3UhACBGhYa1B0vyZGMzV5sTuxfVQXmhV27K0XdevRZyUMAX1wjAemXj0oaTkj8hEuMOEOZGaRMP000JvQvNjYw`
- Pro Buy Button: `buy_btn_1TC8ZbCs26Gb3UhAKbarfXoH`
- Premium Buy Button: `buy_btn_1TC8jMCs26Gb3UhALojeQP5U`
- Tier key for Premium in DB: `"studio"`

## Providers (API routes)

- `POST /api/compare` — run comparison (checks trial/plan limits)
- `POST /api/trial/signup` — create trial user (Turnstile + abuse checks)
- `POST /api/trial/setup-intent` — create Stripe SetupIntent for card verification
- `POST /api/trial/activate-card` — confirm card, activate trial
- `GET /api/trial/status/:id` — check trial stage + card_verified
- `GET /api/billing/status` — check paid subscription status

## Notes

- Brand name: "Ai AgentLab" (lowercase 'i' is intentional)
- Stripe webhook synced via `stripe-replit-sync`
- stripeClient.ts checks `STRIPE_API_KEY` before `STRIPE_SECRET_KEY`
