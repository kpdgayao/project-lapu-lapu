# Project Lapu-lapu

AI-powered voice customer service system for a Philippine pharmaceutical company, built with Retell AI and Telnyx.

## Overview

This system replaces the traditional call center with an AI voice agent that:
- Handles customer inquiries in English and Taglish (Filipino-English mix)
- Processes orders, complaints, and product inquiries
- Transfers to human agents when needed
- Sends SMS/email confirmations

## Project Structure

```
project-lapu-lapu/
├── apps/
│   ├── api/                    # Node.js/TypeScript backend
│   │   ├── src/
│   │   │   ├── index.ts        # Express server entry
│   │   │   ├── webhooks/       # Retell/Telnyx webhooks
│   │   │   ├── routes/         # API routes (Phase 1+)
│   │   │   ├── services/       # Business logic (Phase 1+)
│   │   │   ├── tools/          # Retell tool handlers (Phase 2+)
│   │   │   └── db/             # Database (Phase 1+)
│   │   └── package.json
│   └── dashboard/              # Next.js frontend (Phase 4+)
├── packages/
│   └── shared/                 # Shared types (Phase 1+)
├── scripts/                    # Migrations, seeds (Phase 1+)
├── docker-compose.yml          # Local dev (Phase 1+)
└── package.json                # Workspace root
```

## Current Phase: POC (Phase 0) - LIVE

**Goal:** Validate Retell AI works with Taglish accents before full build.

**Live Deployment:** https://api-production-c04f.up.railway.app

### POC Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Health check |
| `/webhooks/retell` | POST | Retell call lifecycle events |
| `/webhooks/retell/tools` | POST | Retell tool function calls |
| `/webhooks/retell/logs` | GET | View recent call logs |
| `/webhooks/retell/orders` | GET | View orders (debugging) |
| `/webhooks/retell/complaints` | GET | View complaints (debugging) |
| `/api/web-call/create` | POST | Create web call session |
| `/test-call.html` | GET | Web-based call test page |

### Implemented Custom Functions

- `lookup_product` - Search product catalog by name or condition
- `create_order` - Create order with PWD/Senior discount support
- `log_complaint` - Record customer complaints
- `transfer_to_human` - Transfer to pharmacist/customer service/manager

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- Accounts (create during POC setup):
  - [Retell AI](https://retellai.com/)
  - [Telnyx](https://telnyx.com/)
  - [Semaphore](https://semaphore.co/) (PH SMS)
  - [Resend](https://resend.com/) (Email)

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env
# Edit .env with your API keys

# Start development server
pnpm dev
```

### Exposing for Retell Webhooks

For local development, use ngrok or similar to expose your server:

```bash
# Install ngrok: https://ngrok.com/
ngrok http 3000

# Use the HTTPS URL for Retell webhook configuration
# Example: https://abc123.ngrok.io/webhooks/retell
```

## Service Setup Guides

### 1. Retell AI Setup

See **[docs/RETELL_SETUP.md](docs/RETELL_SETUP.md)** for comprehensive setup instructions including:
- Account creation and API key setup
- Knowledge base creation with product catalog
- Agent configuration with custom functions
- Webhook configuration

Quick start:
1. Create account at [retellai.com](https://retellai.com/)
2. Go to Dashboard > API Keys > Create new key
3. Add to `.env` as `RETELL_API_KEY`
4. Follow the full setup guide in `docs/RETELL_SETUP.md`

### 2. Telnyx Setup

1. Create account at [portal.telnyx.com](https://portal.telnyx.com/)
2. Buy a Philippines phone number (+63)
3. Get API key from API Keys section
4. Add to `.env`:
   - `TELNYX_API_KEY`
   - `TELNYX_PHONE_NUMBER`
5. Configure the number to forward to Retell (connection setup in Retell dashboard)

### 3. Semaphore Setup (Phase 3)

1. Create account at [semaphore.co](https://semaphore.co/)
2. Get API key from dashboard
3. Add to `.env`:
   - `SEMAPHORE_API_KEY`
   - `SEMAPHORE_SENDER_NAME`

### 4. Resend Setup (Phase 3)

1. Create account at [resend.com](https://resend.com/)
2. Verify your domain
3. Get API key
4. Add to `.env`:
   - `RESEND_API_KEY`
   - `RESEND_FROM_EMAIL`

## POC Testing Checklist

| Test Case | Pass Criteria | Result |
|-----------|---------------|--------|
| English call | >90% transcription accuracy | |
| Taglish call | >80% transcription accuracy | |
| Latency | Response within 2 seconds | |
| Interruption | Can handle caller interruptions | |
| Call transfer | Can trigger transfer to human | |

### Test Call Instructions

1. Dial the Telnyx number
2. Have a conversation testing:
   - Pure English
   - Taglish (code-switching)
   - Various accents
3. Check `/webhooks/retell/logs` for transcripts
4. Document accuracy and issues

## Deployment

### Railway (Recommended for POC)

1. Connect GitHub repo to Railway
2. Add environment variables
3. Deploy automatically on push

```bash
# Railway CLI alternative
railway login
railway init
railway up
```

### Environment Variables for Production

Ensure all `.env.example` variables are set in your deployment platform.

## Development Commands

```bash
# Start API dev server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Type check
pnpm --filter api typecheck
```

## Phase Roadmap

- [x] **Phase 0**: POC - Validate Taglish voice handling
  - [x] Railway deployment live
  - [x] Product catalog (28 CyberMeds products)
  - [x] Custom functions (lookup, order, complaint, transfer)
  - [x] Web call testing interface
  - [ ] Conduct test calls with Taglish speakers
- [ ] **Phase 1**: Core Infrastructure - DB, migrations, API structure
- [ ] **Phase 2**: Voice System - Full Retell integration with tools
- [ ] **Phase 3**: Notifications - SMS/Email confirmations
- [ ] **Phase 4**: Dashboard - Monitoring and management UI
- [ ] **Phase 5**: Testing & Soft Launch

## License

Private - All rights reserved.
