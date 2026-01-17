# Project Lapu-lapu: AI Voice Customer Service System

## Overview

Build an AI-powered voice customer service system for a Philippine pharmaceutical company to replace their current third-party call center (Magellan Solutions). The system handles inbound calls for product inquiries, order processing, and complaint management.

**Internal Codename:** Lapu-lapu (the AI that defeats Magellan)

---

## Tech Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Voice AI Platform | Retell AI | Handles STT, TTS, conversation orchestration, interruption handling |
| Telephony | Telnyx | PH phone numbers, SIP connectivity |
| LLM | Claude API (Anthropic) | Conversation intelligence, tool calling |
| Backend | Node.js / TypeScript | API server, webhook handlers, business logic |
| Database | PostgreSQL | Call logs, orders, customers, products |
| Infrastructure | Railway.com | Hosting (API, DB, dashboard) |
| SMS | Semaphore | PH SMS delivery for confirmations |
| Email | Resend or AWS SES | Email confirmations |
| Frontend | React / Next.js | Monitoring dashboard |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 Inbound Call (Telnyx PH Number)             │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                      Retell AI                               │
│  • Speech-to-Text (STT)                                     │
│  • Conversation Management                                   │
│  • Text-to-Speech (TTS)                                     │
│  • Latency Optimization                                     │
│  • Interruption Handling                                    │
│  • Claude API Integration (LLM)                             │
└─────────────────────┬───────────────────────────────────────┘
                      │ Webhooks (tool calls)
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              Backend API (Railway - Node.js)                 │
│  • Product lookup                                           │
│  • Order creation                                           │
│  • Customer management                                      │
│  • Complaint logging                                        │
│  • Human handoff trigger                                    │
│  • SMS/Email confirmation dispatch                          │
└─────────────────────┬───────────────────────────────────────┘
                      │
          ┌──────────┼──────────┐
          ▼          ▼          ▼
    ┌──────────┐ ┌──────────┐ ┌──────────┐
    │ Postgres │ │Semaphore │ │  Resend  │
    │    DB    │ │   SMS    │ │  Email   │
    └──────────┘ └──────────┘ └──────────┘
```

---

## Core Features

### 1. Voice AI Agent

**Capabilities:**
- Answer product inquiries (dosage, usage, availability, pricing)
- Process orders (capture customer info, delivery address, payment method)
- Handle complaints and feedback
- Provide store/pharmacy locator information
- Transfer to human agent when needed

**Language Support:**
- Primary: English, Taglish (Filipino-English mix)
- Voice AI optimized for English pronunciation
- Text fallback for pure Tagalog/Cebuano speakers

**Conversation Flow:**
```
1. Greeting: "Hello, thank you for calling [Company]. How can I help you today?"
2. Intent Detection: Product inquiry / Order / Complaint / Other
3. Information Gathering: Use tool calls to fetch/create data
4. Confirmation: Summarize and confirm details
5. Wrap-up: Send SMS/email confirmation, thank customer
```

### 2. Tool Functions (Retell → Backend)

Define these as Retell custom functions that call your backend API:

```typescript
// Tool: lookup_product
interface LookupProductInput {
  product_name?: string;
  symptoms?: string;
  category?: string;
}
interface LookupProductOutput {
  products: Array<{
    id: string;
    name: string;
    generic_name: string;
    dosage: string;
    price: number;
    stock_status: 'in_stock' | 'low_stock' | 'out_of_stock';
    description: string;
    usage_instructions: string;
  }>;
}

// Tool: create_order
interface CreateOrderInput {
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  delivery_address: string;
  items: Array<{
    product_id: string;
    quantity: number;
  }>;
  payment_method: 'cod' | 'gcash' | 'bank_transfer';
  notes?: string;
}
interface CreateOrderOutput {
  order_id: string;
  total_amount: number;
  estimated_delivery: string;
  confirmation_sent: boolean;
}

// Tool: log_complaint
interface LogComplaintInput {
  customer_name: string;
  customer_phone: string;
  complaint_type: 'product_quality' | 'delivery' | 'service' | 'other';
  description: string;
  order_id?: string;
}
interface LogComplaintOutput {
  ticket_id: string;
  status: 'received';
  follow_up_date: string;
}

// Tool: get_customer_orders
interface GetCustomerOrdersInput {
  phone_number: string;
}
interface GetCustomerOrdersOutput {
  orders: Array<{
    order_id: string;
    date: string;
    status: string;
    items: string[];
    total: number;
  }>;
}

// Tool: transfer_to_human
interface TransferToHumanInput {
  reason: string;
  customer_phone: string;
  summary: string;
}
```

### 3. SMS Confirmations (Semaphore)

**Trigger Points:**
- Order placed → Send order confirmation with details
- Complaint logged → Send ticket number and follow-up timeline
- Delivery update → Send tracking/status update

**SMS Template Examples:**
```
[ORDER CONFIRMATION]
Hi {customer_name}! Your order #{order_id} has been received.
Items: {items_summary}
Total: ₱{total}
Payment: {payment_method}
Delivery: {estimated_delivery}
Thank you for choosing {company_name}!

[COMPLAINT RECEIVED]
Hi {customer_name}, we received your concern (Ticket #{ticket_id}).
Our team will contact you within {follow_up_hours} hours.
Thank you for your patience.
```

**Semaphore Integration:**
```typescript
// POST https://api.semaphore.co/api/v4/messages
interface SemaphoreRequest {
  apikey: string;
  number: string; // PH format: 09XXXXXXXXX
  message: string;
  sendername?: string; // Registered sender name
}
```

### 4. Email Confirmations (Resend)

**Trigger Points:**
- Order placed (if email provided)
- Order shipped
- Complaint resolution

**Email Templates:**
- Order confirmation (HTML with order details table)
- Shipping notification
- Complaint acknowledgment

### 5. Monitoring Dashboard (React/Next.js)

**Pages:**

1. **Live Calls Dashboard**
   - Active calls list with real-time status
   - Call duration, customer phone (masked), current intent
   - "Listen" button to monitor conversation
   - "Intervene" button to take over call

2. **Call History**
   - Searchable/filterable call logs
   - Call recording playback
   - Transcript view
   - Call outcome (completed, transferred, abandoned)

3. **Orders Management**
   - Order list with status filters
   - Order details view
   - Status update capability
   - Export to CSV

4. **Complaints/Tickets**
   - Ticket list with priority/status
   - Ticket details and history
   - Resolution workflow
   - Escalation tracking

5. **Analytics**
   - Call volume over time
   - Average call duration
   - Intent distribution (inquiry/order/complaint)
   - Resolution rate
   - Peak hours heatmap

6. **Settings**
   - Product catalog management
   - Response templates
   - Business hours configuration
   - Notification preferences

---

## Database Schema

```sql
-- Customers
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255),
  email VARCHAR(255),
  address TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku VARCHAR(50) UNIQUE,
  name VARCHAR(255) NOT NULL,
  generic_name VARCHAR(255),
  category VARCHAR(100),
  description TEXT,
  usage_instructions TEXT,
  price DECIMAL(10,2) NOT NULL,
  stock_quantity INTEGER DEFAULT 0,
  stock_status VARCHAR(20) DEFAULT 'in_stock',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(20) UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id),
  status VARCHAR(50) DEFAULT 'pending',
  payment_method VARCHAR(50),
  payment_status VARCHAR(50) DEFAULT 'pending',
  subtotal DECIMAL(10,2),
  shipping_fee DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2),
  delivery_address TEXT,
  notes TEXT,
  call_id UUID REFERENCES calls(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Order Items
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL
);

-- Complaints/Tickets
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number VARCHAR(20) UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id),
  order_id UUID REFERENCES orders(id),
  type VARCHAR(50) NOT NULL,
  priority VARCHAR(20) DEFAULT 'normal',
  status VARCHAR(50) DEFAULT 'open',
  description TEXT,
  resolution TEXT,
  call_id UUID REFERENCES calls(id),
  assigned_to VARCHAR(255),
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Calls
CREATE TABLE calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  retell_call_id VARCHAR(100) UNIQUE,
  customer_id UUID REFERENCES customers(id),
  phone_number VARCHAR(20),
  direction VARCHAR(20) DEFAULT 'inbound',
  status VARCHAR(50),
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  duration_seconds INTEGER,
  intent VARCHAR(50),
  outcome VARCHAR(50),
  transcript TEXT,
  recording_url TEXT,
  transferred_to_human BOOLEAN DEFAULT false,
  transfer_reason TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Notifications (SMS/Email log)
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(20) NOT NULL, -- 'sms' or 'email'
  recipient VARCHAR(255) NOT NULL,
  subject VARCHAR(255),
  content TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  provider_response JSONB,
  related_order_id UUID REFERENCES orders(id),
  related_ticket_id UUID REFERENCES tickets(id),
  related_call_id UUID REFERENCES calls(id),
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Dashboard Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'agent', -- 'admin', 'agent', 'viewer'
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_calls_phone ON calls(phone_number);
CREATE INDEX idx_calls_created ON calls(created_at);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_active ON products(is_active);
```

---

## API Endpoints

### Backend API (for Retell tool calls)

```
POST /api/v1/products/search
POST /api/v1/orders
GET  /api/v1/orders/:phone
POST /api/v1/tickets
POST /api/v1/transfer
```

### Dashboard API

```
# Auth
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me

# Calls
GET  /api/calls                    # List with filters
GET  /api/calls/:id                # Call details
GET  /api/calls/:id/transcript     # Full transcript
GET  /api/calls/active             # Live calls

# Orders
GET  /api/orders                   # List with filters
GET  /api/orders/:id               # Order details
PATCH /api/orders/:id              # Update status

# Tickets
GET  /api/tickets                  # List with filters
GET  /api/tickets/:id              # Ticket details
PATCH /api/tickets/:id             # Update/resolve

# Products
GET  /api/products                 # List all
POST /api/products                 # Create
PATCH /api/products/:id            # Update
DELETE /api/products/:id           # Soft delete

# Analytics
GET  /api/analytics/calls          # Call metrics
GET  /api/analytics/orders         # Order metrics
GET  /api/analytics/usage          # Minutes used

# Settings
GET  /api/settings
PATCH /api/settings
```

### Webhook Endpoints (from Retell)

```
POST /webhooks/retell/call-started
POST /webhooks/retell/call-ended
POST /webhooks/retell/call-analyzed
```

---

## Retell AI Configuration

### Agent Setup

```json
{
  "agent_name": "Pharma Customer Service",
  "voice_id": "eleven_labs_voice_id",
  "language": "en-US",
  "llm_websocket_url": "wss://your-railway-app.up.railway.app/llm",
  "functions": [
    {
      "name": "lookup_product",
      "description": "Search for pharmaceutical products by name, symptoms, or category",
      "parameters": { ... }
    },
    {
      "name": "create_order",
      "description": "Create a new order for the customer",
      "parameters": { ... }
    },
    {
      "name": "log_complaint",
      "description": "Log a customer complaint or feedback",
      "parameters": { ... }
    },
    {
      "name": "get_customer_orders",
      "description": "Retrieve customer's previous orders by phone number",
      "parameters": { ... }
    },
    {
      "name": "transfer_to_human",
      "description": "Transfer the call to a human agent",
      "parameters": { ... }
    }
  ],
  "general_prompt": "You are a helpful customer service agent for [Company Name], a pharmaceutical company in the Philippines. You help customers with product inquiries, order placement, and complaint handling. Be polite, professional, and efficient. Always confirm important details like names, addresses, and order items before finalizing. If you cannot help with something, offer to transfer to a human agent."
}
```

### Telnyx Number Configuration

- Acquire PH phone number(s) via Telnyx
- Configure SIP trunk to route to Retell
- Set up fallback to human queue during outages

---

## Environment Variables

```bash
# Retell AI
RETELL_API_KEY=your_retell_api_key
RETELL_AGENT_ID=your_agent_id

# Telnyx
TELNYX_API_KEY=your_telnyx_api_key
TELNYX_PHONE_NUMBER=+63XXXXXXXXXX

# Claude API
ANTHROPIC_API_KEY=your_anthropic_api_key

# Database
DATABASE_URL=postgresql://user:pass@host:5432/lapu_lapu

# Semaphore SMS
SEMAPHORE_API_KEY=your_semaphore_api_key
SEMAPHORE_SENDER_NAME=PharmaCo

# Resend Email
RESEND_API_KEY=your_resend_api_key
FROM_EMAIL=orders@company.com

# App
NODE_ENV=production
PORT=3000
JWT_SECRET=your_jwt_secret
DASHBOARD_URL=https://dashboard.company.com
```

---

## Optional: Omnichannel Chat Add-on

For Taglish/Cebuano text-based support via Messenger and Viber.

### Architecture Addition

```
┌─────────────────────────────────────────────────────────────┐
│           Messenger / Viber Webhook                         │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              Chat Handler (Node.js)                          │
│  • Message parsing                                          │
│  • Claude API for Taglish/Cebuano                          │
│  • Same tool functions as voice                             │
│  • Response formatting                                      │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
                Same Backend API
```

### Additional Database Table

```sql
CREATE TABLE chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform VARCHAR(20) NOT NULL, -- 'messenger', 'viber'
  platform_user_id VARCHAR(255) NOT NULL,
  customer_id UUID REFERENCES customers(id),
  status VARCHAR(50) DEFAULT 'active',
  last_message_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES chat_conversations(id),
  role VARCHAR(20) NOT NULL, -- 'user', 'assistant'
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Development Phases

### Phase 1: Core Voice System (Week 1-3)
- [ ] Set up Railway project (API + PostgreSQL)
- [ ] Implement database schema
- [ ] Create Retell agent with basic prompt
- [ ] Implement tool functions (product lookup, order creation)
- [ ] Set up Telnyx phone number
- [ ] Basic call logging

### Phase 2: Notifications (Week 3)
- [ ] Semaphore SMS integration
- [ ] Resend email integration
- [ ] Order confirmation flow
- [ ] Complaint acknowledgment flow

### Phase 3: Dashboard (Week 4)
- [ ] Auth system (login, roles)
- [ ] Live calls view
- [ ] Call history with transcripts
- [ ] Orders management
- [ ] Tickets management
- [ ] Basic analytics

### Phase 4: Testing & Tuning (Week 4-5)
- [ ] Load product catalog
- [ ] Tune Retell prompts
- [ ] Test edge cases
- [ ] Staff training
- [ ] Go-live

### Phase 5: Optional Chat (Future)
- [ ] Messenger webhook setup
- [ ] Viber webhook setup
- [ ] Chat handler implementation
- [ ] Dashboard chat view

---

## Deployment (Railway)

```yaml
# railway.toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "npm start"
healthcheckPath = "/health"
healthcheckTimeout = 300

[[services]]
name = "api"
internalPort = 3000

[[services]]
name = "dashboard"
internalPort = 3001
```

### Services to Create on Railway:
1. **lapu-lapu-api** - Node.js backend
2. **lapu-lapu-dashboard** - Next.js frontend
3. **lapu-lapu-db** - PostgreSQL database

---

## Cost Tracking

Track usage for billing:

```sql
-- Monthly usage view
CREATE VIEW monthly_usage AS
SELECT 
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as total_calls,
  SUM(duration_seconds) / 60.0 as total_minutes,
  COUNT(*) FILTER (WHERE intent = 'order') as order_calls,
  COUNT(*) FILTER (WHERE intent = 'inquiry') as inquiry_calls,
  COUNT(*) FILTER (WHERE intent = 'complaint') as complaint_calls,
  COUNT(*) FILTER (WHERE transferred_to_human = true) as transferred_calls
FROM calls
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;
```

**Pricing Reference:**
- Included: 2,000 minutes/month
- Overage: ₱10/minute
- Track and alert at 80% threshold

---

## Security Considerations

- [ ] API authentication via JWT
- [ ] Rate limiting on public endpoints
- [ ] Input validation and sanitization
- [ ] PII masking in logs (phone numbers)
- [ ] HTTPS only
- [ ] Database connection encryption
- [ ] Regular backups
- [ ] Audit logging for sensitive operations

---

## Support & Maintenance

**Included in Monthly Fee:**
- System uptime monitoring
- Bug fixes
- Security patches
- Knowledge base updates (up to 2 hours/month)
- Email/chat support

**Additional Services (billable):**
- Major feature additions
- Integration with client's existing systems
- Custom analytics/reports
- On-site training

---

## Contact

**IOL Inc.**
Baguio City, Philippines
www.iol.ph

Project Lead: Kevin Philip D. Gayao, CPA, MBA
