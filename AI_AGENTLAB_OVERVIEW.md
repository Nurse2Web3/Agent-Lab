# Ai AgentLab — Full System Overview

## What It Is

Ai AgentLab is a SaaS platform that lets founders run side-by-side AI comparisons across multiple large language models (LLMs). Users submit a prompt and receive structured, scored outputs from each AI — helping them evaluate which model performs best for their use case.

---

## Subscription Tiers

### Trial (Free — $0/month)
- **Comparisons:** 3 lifetime comparisons (no reset)
- **Models included:** OpenAI GPT + Anthropic Claude
- **Activation:** Email verification required (magic link sent via Resend)
- **Card verification:** Stripe SetupIntent used to confirm identity and prevent abuse (card is not charged)
- **Anti-abuse protections:** Cloudflare Turnstile bot check, device fingerprint limiting, IP rate limiting, disposable email blocking
- **Goal:** Let founders evaluate the product before committing

### Pro ($29/month)
- **Comparisons:** 100 per month (resets monthly)
- **Models included:** OpenAI GPT + Anthropic Claude + **GROK THE ELON MODEL 🥇** (xAI)
- **Billing:** Stripe monthly subscription via Buy Button (`buy_btn_1TC8ZbCs26Gb3UhAKbarfXoH`)
- **Badge:** "Recommended"
- **Goal:** Primary revenue tier for active founders

### Premium / Studio ($49/month)
- **Comparisons:** 500 per month (resets monthly)
- **Models included:** All Pro models + deeper evaluation, richer decision support
- **Billing:** Stripe monthly subscription via Buy Button (`buy_btn_1TC8jMCs26Gb3UhALojeQP5U`)
- **Badge:** "Scale"
- **Goal:** Power users, agencies, teams who need volume and depth

---

## AI Models & APIs

| Model | Provider | API Endpoint | Plan Availability |
|---|---|---|---|
| GPT (latest) | OpenAI | `api.openai.com` | Trial, Pro, Premium |
| Claude (latest) | Anthropic | `api.anthropic.com` | Trial, Pro, Premium |
| Grok (xAI) | xAI / Elon Musk's xAI | xAI API | Pro, Premium only |

**How keys are managed:** Provider API keys are stored encrypted in the `api_keys` database table. If no custom key is stored, the server falls back to the environment variables (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `XAI_API_KEY`). Users can test their connections from the Settings page.

---

## Third-Party Connections

### Stripe — Payments & Billing
- **Purpose:** Subscriptions, customer management, card verification for trials, customer portal
- **Integration type:** Replit Stripe integration (syncs Stripe data into a local `stripe` schema in PostgreSQL)
- **Secret key:** `STRIPE_SECRET_KEY` environment variable
- **Publishable key:** Embedded in the frontend pricing page
- **What it handles:**
  - Pro and Premium subscriptions via Stripe Buy Buttons (embedded on pricing page)
  - Stripe Customer Portal (lets subscribers manage or cancel their plan)
  - `SetupIntent` for trial card verification (no charge — identity confirmation only)
  - Webhook endpoint (`POST /api/stripe/webhook`) for real-time subscription status sync
- **Billing session:** After subscribing, users enter their email on the Settings page; the server verifies it matches their Stripe customer record and sets an HMAC-SHA256 signed session cookie (`bs`) — valid 30 days, httpOnly, secure

### Cloudflare Turnstile — Bot Protection
- **Purpose:** Prevents automated/bot trial signups
- **Integration type:** Frontend widget + backend server-side verification
- **Site key:** `0x4AAAAAACuksF2bnJ4Rzaei` (embedded in trial signup form)
- **Secret key:** `TURNSTILE_SECRET_KEY` environment variable
- **Allowed domains (must be whitelisted in Cloudflare dashboard):**
  - `localhost` (development)
  - `agentlab.nurse2web3.com` (custom domain)
  - `agent-lab.replit.app` (Replit deployment domain)
- **Flow:** User completes invisible challenge → token sent to backend → backend verifies with Cloudflare API before allowing signup

### Resend — Transactional Email
- **Purpose:** Sends magic link verification emails to trial signups
- **Integration type:** REST API via `RESEND_API_KEY`
- **Sending address:** `noreply@nurse2web3.com`
- **DNS requirement:** nurse2web3.com must have Resend's DNS records (MX, SPF, DKIM) configured in Cloudflare
- **Flow:** Trial signup → server generates unique token → email sent with link → user clicks link → `email_verified` flag set in database → user redirected to playground
- **Support contact email:** `nwright38@icloud.com` (shown in billing policy / refund section)

---

## Database — PostgreSQL

Hosted on Replit's built-in PostgreSQL. Accessed via `DATABASE_URL` environment variable using Drizzle ORM.

### Application Tables

| Table | Purpose |
|---|---|
| `billing_users` | Maps Stripe customer IDs and subscription IDs to local session records |
| `api_keys` | Stores encrypted API keys for OpenAI, Claude, and Grok providers |
| `history` | Stores all comparison runs — prompt, responses, scores, model metadata |
| `trial_users` | Tracks trial state: email, verification status, card verification, comparison count, device fingerprint, IP |
| `trial_signup_log` | Audit log for all signup attempts — used for abuse detection |

### Stripe-Synced Tables (schema: `stripe`)

| Table | Purpose |
|---|---|
| `stripe.subscriptions` | Live subscription records synced from Stripe |
| `stripe.products` | Product catalog synced from Stripe |
| `stripe.prices` | Pricing records (monthly amounts) synced from Stripe |
| `stripe.subscription_items` | Maps subscriptions to their price/product |

---

## Session & Authentication

There is no traditional login system. Access is controlled by two mechanisms:

1. **Trial session:** After email + card verification, a `userId` is stored in browser `localStorage`. The backend checks `trial_users` on each comparison request.
2. **Billing session cookie (`bs`):** Set when a paying subscriber activates their session via Settings. It is an HMAC-SHA256 token signed with `STRIPE_SECRET_KEY`, stored as a 30-day `httpOnly` cookie. The backend verifies it on `/api/billing/status` to determine the user's plan.

---

## Key API Routes

| Method | Route | What It Does |
|---|---|---|
| `GET` | `/api/billing/status` | Returns current plan (free / pro / studio) based on session cookie |
| `POST` | `/api/billing/activate-session` | Verifies subscriber email against Stripe, sets `bs` cookie |
| `POST` | `/api/billing/deactivate-session` | Clears `bs` cookie (sign out) |
| `POST` | `/api/compare` | Runs a real AI comparison (enforces plan limits) |
| `POST` | `/api/compare/demo` | Returns hardcoded demo scores (no API calls, no auth needed) |
| `POST` | `/api/trial/signup` | Registers trial user, runs anti-abuse checks, sends verification email |
| `GET` | `/api/trial/verify/:token` | Verifies email token, redirects to playground |
| `GET` | `/api/trial/status/:userId` | Returns trial comparison count, verified status, limits |
| `POST` | `/api/trial/setup-intent` | Creates Stripe SetupIntent for card verification |
| `POST` | `/api/trial/activate-card` | Confirms card verification step |
| `GET` | `/api/history` | Returns all saved comparison history |
| `GET` | `/api/settings` | Returns connected provider status |
| `POST` | `/api/stripe/webhook` | Stripe webhook for real-time subscription sync |
| `GET` | `/api/healthz` | Health check endpoint |

---

## Hosting & Domains

| Environment | Domain |
|---|---|
| Production (custom) | `agentlab.nurse2web3.com` |
| Production (Replit) | `agent-lab.replit.app` |
| Development | `localhost` (via Replit workspace) |

- **DNS:** Managed in Cloudflare. A record points to `34.111.179.208` (Replit's deployment IP). TXT record for domain verification is also set.
- **Future domain:** `aiagentlab.com` (planned purchase)
- **TLS:** Handled automatically by Replit Deployments

---

## Anti-Abuse Stack (Trial Signups)

Multiple layers run simultaneously when a trial signup is submitted:

1. **Cloudflare Turnstile** — bot/automation detection (client-side + server-side token verify)
2. **Disposable email blocking** — rejects known throwaway email domains
3. **IP rate limiting** — limits signups per IP address
4. **Device fingerprint limiting** — limits signups per browser/device fingerprint
5. **Card verification** — Stripe SetupIntent confirms a real payment method is on file (not charged)
6. **Audit log** — every signup attempt is recorded in `trial_signup_log` for manual review

---

## Summary of All Secrets / Environment Variables

| Variable | Used By | Purpose |
|---|---|---|
| `DATABASE_URL` | API Server | PostgreSQL connection |
| `STRIPE_SECRET_KEY` | API Server | Stripe API calls + session HMAC signing |
| `RESEND_API_KEY` | API Server | Sending verification emails |
| `TURNSTILE_SECRET_KEY` | API Server | Verifying Cloudflare Turnstile tokens |
| `ANTHROPIC_API_KEY` | API Server | Claude AI fallback key |
| `OPENAI_API_KEY` | API Server | GPT AI fallback key |
| `XAI_API_KEY` | API Server | Grok AI fallback key |
