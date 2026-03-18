# AI AgentLab

## Overview

AI AgentLab is a founder-friendly AI comparison and testing studio. It helps users compare prompts across multiple AI providers, score outputs, view speed and estimated cost, save winners, and export the best version for production use.

**Tagline:** Test AI agents. Compare outputs. Ship with confidence.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + Tailwind CSS (artifacts/agentlab)
- **Backend**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Animations**: Framer Motion

## Structure

```text
artifacts/
├── agentlab/               # React + Vite frontend
│   └── src/
│       ├── pages/          # Landing, Playground, History, Pricing, Settings
│       ├── components/     # Shared components (layout, provider-icon, trial-gate, ui/)
│       ├── hooks/          # use-billing.ts, use-trial.ts
│       ├── lib/            # deviceFingerprint.ts
│       └── index.css       # Theme variables + tailwind
├── api-server/             # Express 5 backend
│   └── src/
│       ├── lib/
│       │   ├── providers/        # gemini.ts, groq.ts, kimi.ts, openai.ts, claude.ts, config.ts
│       │   ├── disposableEmailDomains.ts  # Blocklist of throwaway email domains
│       │   ├── mockResponses.ts  # Demo mode fallbacks
│       │   └── scoring.ts        # Winner calculation logic
│       ├── middleware/
│       │   └── rateLimiter.ts    # In-memory IP rate limiting
│       ├── trialStorage.ts       # Trial DB operations
│       └── routes/               # compare.ts, history.ts, settings.ts, billing.ts, trial.ts
lib/
├── api-spec/openapi.yaml   # API contract (source of truth)
├── api-client-react/       # Generated React Query hooks
├── api-zod/                # Generated Zod schemas
└── db/src/schema/          # history.ts, apiKeys.ts tables
```

## Trial Abuse Protection

The trial system is enforced on both frontend and backend:

### Database Tables
- `trial_users` — stores email, email_verified, trial_used, trial_comparisons_used, device_fingerprint, ip_address, verification_token
- `trial_signup_log` — logs all signup/verify/compare/blocked actions for admin review

### Backend Checks (routes/trial.ts + routes/compare.ts)
1. **CAPTCHA** — server-generated math challenge (HMAC-signed, 10min TTL)
2. **Disposable email blocking** — 200+ known throwaway domain blocklist
3. **IP rate limiting** — max 5 signups per IP per hour (in-memory)
4. **Device fingerprint check** — blocks same device from starting a new trial if previous trial was exhausted
5. **Device signup frequency** — blocks >3 signup attempts from same device per 24h
6. **Email verification** — UUID token stored in DB, expires in 1 hour; comparisons blocked until verified
7. **Trial limit enforcement on API** — `/api/compare` checks trial_comparisons_used < 3 server-side
8. **Provider allowlist** — trial users can only use Gemini and Grok, enforced server-side
9. **Admin logs** — GET /api/trial/admin/logs returns last 200 suspicious events

### Frontend (components/trial-gate.tsx + hooks/use-trial.ts)
- `TrialGate` wraps the playground, shows signup form for new users
- Device fingerprint = localStorage UUID + browser signal hash (userAgent, timezone, screen dims)
- Polls `/api/trial/status/:userId` every 4s during pending_verify state
- Shows remaining comparison dots (e.g. 3 dots, filled as used)
- Shows upgrade prompt when trial exhausted
- In dev mode: displays the verification link directly in the gate UI

## Pages

1. **Landing** (`/`) — Marketing page with hero, features, workflow, pricing preview, FAQ
2. **Playground** (`/playground`) — Main comparison tool: prompt input, provider selection, results cards
3. **History** (`/history`) — Saved test runs with search, delete, reopen
4. **Settings** (`/settings`) — API key management for Gemini, HuggingFace, Groq (+ future OpenAI, Anthropic)
5. **Pricing** (`/pricing`) — 3 tier cards: Sandbox ($0), Pro ($19/mo), Studio ($49/mo)

## API Routes

- `POST /api/compare` — Run prompt comparison across selected providers
- `GET /api/history` — Get all saved runs
- `POST /api/history` — Save a run
- `DELETE /api/history/:id` — Delete a run
- `GET /api/settings` — Get provider connection statuses
- `POST /api/settings` — Save an API key
- `POST /api/settings/test` — Test a provider connection

## Providers

- **Gemini**: Google's Gemini 1.5 Flash — balanced, organized outputs
- **HuggingFace**: Mistral-7B-Instruct — open-source, variable outputs
- **Groq**: LLaMA 3.1 8B Instant — fast, concise outputs
- **OpenAI / Anthropic**: Coming soon placeholders in settings

## Demo Mode

If no API keys are present, the app automatically returns realistic mock responses. Each provider has distinct demo output styles:
- Gemini = balanced and organized
- HuggingFace = more variable / open-model style
- Groq = fast and concise

## Adding API Keys

API keys are stored securely in the PostgreSQL database (server-side only). Never exposed to the frontend.

To add keys:
1. Go to Settings page
2. Enter the API key for each provider
3. Click Save Key
4. Click Test Connection to verify

Environment variables needed for providers:
- Keys are stored in `api_keys` DB table, NOT in environment variables

## Database Tables

- `history` — saved comparison runs
- `api_keys` — provider API keys (stored server-side only)

## Scoring Algorithm

Results are scored on:
- Quality (40% weight for winner calculation)
- Speed / latency (30%)
- Cost efficiency (30%)

Each card also shows: qualityScore, clarityScore, toneScore, overallScore (1–5 scale)
