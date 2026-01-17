# CLAUDE.md - Project Lapu-lapu

## Project Overview

AI-powered voice customer service system for a Philippine pharmaceutical company, replacing their Magellan Solutions call center. Built with Retell AI for voice, Telnyx for telephony, and designed to handle English and Taglish (Filipino-English code-switching).

## Current Phase

**Phase 0: Proof of Concept (POC)** - Validating Retell AI works with Taglish accents before full build.

## Tech Stack

- **Runtime:** Node.js 18+
- **Language:** TypeScript
- **Package Manager:** pnpm (monorepo with workspaces)
- **API Framework:** Express
- **Voice AI:** Retell AI
- **Telephony:** Telnyx
- **SMS:** Semaphore (Philippines)
- **Email:** Resend
- **Database:** PostgreSQL with Drizzle ORM (Phase 1+)
- **Dashboard:** Next.js with NextAuth.js (Phase 4+)

## Project Structure

```
project-lapu-lapu/
├── apps/
│   ├── api/                    # Express backend (current focus)
│   │   ├── src/
│   │   │   ├── index.ts        # Server entry point
│   │   │   ├── webhooks/       # Retell/Telnyx webhook handlers
│   │   │   ├── routes/         # API routes (Phase 1+)
│   │   │   ├── services/       # Business logic (Phase 1+)
│   │   │   ├── tools/          # Retell tool handlers (Phase 2+)
│   │   │   └── db/             # Database queries/migrations (Phase 1+)
│   │   └── package.json
│   └── dashboard/              # Next.js frontend (Phase 4+)
├── packages/
│   └── shared/                 # Shared types, constants (Phase 1+)
├── scripts/                    # DB migrations, seed data (Phase 1+)
└── package.json                # Workspace root
```

## Commands

```bash
# Install dependencies
pnpm install

# Start API dev server
pnpm dev

# Build API
pnpm build

# Start production server
pnpm start

# Type check
pnpm --filter api typecheck
```

## Key Files

- `apps/api/src/index.ts` - Express server entry, health check, middleware
- `apps/api/src/webhooks/retell.ts` - Retell webhook handler (call events, tool calls)
- `.env` - Environment variables (not committed)
- `.env.example` - Environment template

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Health check, returns status and version |
| `/webhooks/retell` | POST | Receives Retell call lifecycle events |
| `/webhooks/retell/logs` | GET | View recent call logs (debugging) |
| `/webhooks/retell/tools` | POST | Retell tool function calls |

## Environment Variables

Required for POC:
- `PORT` - Server port (default: 3000)
- `RETELL_API_KEY` - Retell AI API key

Future phases:
- `TELNYX_API_KEY`, `TELNYX_PHONE_NUMBER` - Telephony
- `SEMAPHORE_API_KEY` - Philippines SMS
- `RESEND_API_KEY` - Email
- `DATABASE_URL` - PostgreSQL connection

## Code Conventions

- Use TypeScript strict mode
- Use Zod for runtime validation
- Use ES modules (`.js` extension in imports)
- Express routers exported as named exports
- Console logging for POC debugging (will add structured logging later)

## Retell Integration

### Webhook Events
- `call_started` - Call initiated
- `call_ended` - Call completed, includes transcript
- `call_analyzed` - Post-call analysis with summary/sentiment

### Tool Functions (Phase 2)
- `lookup_product` - Search product catalog
- `create_order` - Place customer order
- `log_complaint` - Create complaint ticket
- `get_customer_orders` - Order history lookup
- `transfer_to_human` - Handoff to human agent

## Phase Roadmap

- [x] Phase 0: POC - Validate Taglish voice handling
- [ ] Phase 1: Core Infrastructure - PostgreSQL, Drizzle, API structure
- [ ] Phase 2: Voice System - Full Retell tools, Telnyx routing
- [ ] Phase 3: Notifications - SMS/Email confirmations
- [ ] Phase 4: Dashboard - Next.js monitoring UI
- [ ] Phase 5: Testing & Soft Launch

## Testing Notes

For POC testing:
1. Use ngrok to expose local server for Retell webhooks
2. Test with English, Taglish, and various PH accents
3. Check `/webhooks/retell/logs` for transcription accuracy
4. Target: >90% English accuracy, >80% Taglish accuracy

## Deployment

Target platform: Railway (API + PostgreSQL)

For local webhook testing:
```bash
ngrok http 3000
# Use the HTTPS URL for Retell webhook config
```
