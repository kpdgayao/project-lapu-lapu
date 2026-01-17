# CLAUDE.md - Project Lapu-lapu

## Project Overview

AI-powered voice customer service system for a Philippine pharmaceutical company, replacing their Magellan Solutions call center. Built with Retell AI for voice, Telnyx for telephony, and designed to handle English and Taglish (Filipino-English code-switching).

## Current Phase

**Phase 0: Proof of Concept (POC)** - Validating Retell AI works with Taglish accents before full build.

**Live Deployment:** https://api-production-c04f.up.railway.app

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
│   │   │   ├── webhooks/
│   │   │   │   └── retell.ts   # Retell webhook + tool handlers
│   │   │   ├── routes/
│   │   │   │   └── web-call.ts # Web call session creation
│   │   │   └── services/
│   │   │       └── products.ts # Product catalog search
│   │   ├── data/
│   │   │   ├── products.csv    # 28 CyberMeds products
│   │   │   └── retell-agent-prompt.md  # Agent system prompt
│   │   ├── public/
│   │   │   ├── test-call.html  # Web call test page
│   │   │   └── cybermeds-logo.png  # Cybermeds branding
│   │   ├── Dockerfile          # Railway deployment
│   │   ├── railway.json        # Railway config
│   │   └── package.json
│   └── dashboard/              # Next.js frontend (Phase 4+)
├── docs/
│   └── RETELL_SETUP.md         # Comprehensive Retell setup guide
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
- `apps/api/src/services/products.ts` - Product catalog search and formatting
- `apps/api/src/routes/web-call.ts` - Web call session creation API
- `apps/api/data/products.csv` - 28 CyberMeds pharmaceutical products
- `apps/api/data/retell-agent-prompt.md` - Maya agent system prompt
- `docs/RETELL_SETUP.md` - Step-by-step Retell configuration guide
- `.env` - Environment variables (not committed)
- `.env.example` - Environment template

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Health check, returns status and version |
| `/webhooks/retell` | POST | Receives Retell call lifecycle events |
| `/webhooks/retell/tools` | POST | Retell tool function calls |
| `/webhooks/retell/logs` | GET | View recent call logs (debugging) |
| `/webhooks/retell/orders` | GET | View orders (debugging) |
| `/webhooks/retell/complaints` | GET | View complaints (debugging) |
| `/api/web-call` | POST | Create web call session (rate limited) |
| `/api/web-call/agents` | GET | List available Retell agents |
| `/api/web-call/status` | GET | Check rate limit status |
| `/test-call.html` | Static | Web-based call test page |

## Rate Limiting (POC)

To conserve Retell credits during testing:
- **10 calls per day** (global limit across all users)
- **5 calls per IP per hour**
- **5 minute max call duration** (auto-terminates)

Check remaining calls: `GET /api/web-call/status`

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

### Tool Functions (Implemented)
- `lookup_product` - Search product catalog by name, generic name, or condition
- `create_order` - Place customer order with PWD/Senior discount support
- `log_complaint` - Create complaint ticket
- `transfer_to_human` - Handoff to pharmacist, customer service, or manager

### Product Catalog
- 28 CyberMeds pharmaceutical products loaded from CSV
- Categories: Neuroprotective, Antihypertensive, Anti-inflammatory, Neuropathic Pain, Antipsychotic, Antidepressant, Antiplatelet, Food Supplements
- Supports PWD/Senior Citizen 20% discount pricing

## Phase Roadmap

- [x] Phase 0: POC - Validate Taglish voice handling
  - [x] Railway deployment live
  - [x] Product catalog loaded (28 products)
  - [x] Custom functions implemented
  - [x] Web call testing interface
  - [ ] Conduct test calls with Taglish speakers
- [ ] Phase 1: Core Infrastructure - PostgreSQL, Drizzle, API structure
- [ ] Phase 2: Voice System - Full Retell tools, Telnyx routing
- [ ] Phase 3: Notifications - SMS/Email confirmations
- [ ] Phase 4: Dashboard - Next.js monitoring UI
- [ ] Phase 5: Testing & Soft Launch

## Testing Notes

For POC testing:
1. Use web test interface: https://api-production-c04f.up.railway.app/test-call.html
2. Or use ngrok for local development: `ngrok http 3000`
3. Test with English, Taglish, and various PH accents
4. Check `/webhooks/retell/logs` for transcription accuracy
5. Target: >90% English accuracy, >80% Taglish accuracy

## Deployment

**Live:** https://api-production-c04f.up.railway.app

Deployed on Railway with Dockerfile. Key files:
- `apps/api/Dockerfile` - Node.js 18 Alpine build
- `apps/api/railway.json` - Railway config-as-code

For local webhook testing:
```bash
ngrok http 3000
# Use the HTTPS URL for Retell webhook config
```
