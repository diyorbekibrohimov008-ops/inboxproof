# InboxProof — Cold Email Deliverability & Spam Diagnostics (100% Free & Unlimited)

100% Free & Unlimited cold email deliverability platform built for indie sales reps, founders, and teams switching from $85–$185/mo incumbents (GlockApps, MailReach). **$0/mo forever** — all features unlocked, no credit card, no trials, and no monthly test limits.

> [!WARNING]
> **Project Status — Work in Progress (Not Fully Ready)**
> This project is currently under active development and is **not fully ready for production**. Some parts, features, or workflow steps will fail or behave unexpectedly. We are actively working on fixing all remaining issues.

## Features

1. **100% Free & Unlimited Forever ($0/mo · Unlimited Deep Placement Tests)**
   - Run unlimited 18-node deep placement tests with persistent test history — no credit caps, no paywalls, and no paid tiers (saving 100% vs $85–$185/mo incumbents).
2. **Live DNS Diagnostics & 18-Node Global Seed Placement**
   - Queries MX, SPF (with exact RFC 7208 10-lookup counter), auto-probed DKIM selectors & key bit strength, DMARC, BIMI, and Spamhaus DBL.
   - Supports pasting raw `.eml` headers (`Authentication-Results`, `DKIM-Signature`, `Return-Path`) to audit SPF/DKIM domain alignment.
3. **One-Click DNS Remediation (No Cryptic RFC Errors)**
   - Plain-English explanations paired with exact copy-paste `Type`, `Host/Name`, `Value`, `TTL`, and Cloudflare `DNS Only (Grey Cloud)` guidance for **Cloudflare**, **GoDaddy**, **Namecheap**, and **AWS Route 53**.
4. **Live Spam Copy Rewriter**
   - Real-time inline spam-trigger highlighting (with 1-click replacement chips) plus automatic sentence-level cold-email rewriting (`Before` vs `After` diff & projected inbox lift). Uses optional `OPENAI_API_KEY` when configured, with a zero-dependency deterministic rewriter built in.

## Run Locally (Node.js 22.12+ / 24+)

```bash
npm run dev
# Runs at http://localhost:3000
```

Run the test suite:

```bash
npm test
```

## Deploy

### Railway
- **Standard Railpack (Node 24)**: `railway up` (uses `npm start` -> `node src/node-dev.ts`, optional `DATABASE_URL` Postgres auto-detected).
- **Single-File Bun Function**: Run `npm run bundle` to generate `dist/railway-function.tsx`.

### Netlify
- Configured via `netlify.toml` and `netlify/functions/app.mts` (`path: "/*"`):
```bash
npx netlify-cli deploy --prod
```

### Vercel
- Configured via `vercel.json` and `api/index.ts`:
```bash
npx vercel --prod
```
