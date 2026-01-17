# Retell AI Setup Guide for CyberMeds

This guide walks through setting up the Retell AI agent for the CyberMeds pharmaceutical customer service system.

## Prerequisites

- Retell AI account (https://retellai.com)
- Railway deployment running (https://api-production-c04f.up.railway.app)
- Product CSV uploaded to Retell Knowledge Base

## Step 1: Create Retell Account

1. Go to https://retellai.com
2. Click "Get Started" or "Sign Up"
3. Complete registration
4. Navigate to Dashboard

## Step 2: Get API Key

1. Go to **Settings** → **API Keys**
2. Click **Create API Key**
3. Copy the key and save it securely
4. Add to Railway environment variables:
   - Variable name: `RETELL_API_KEY`
   - Value: your API key

## Step 3: Create Knowledge Base

1. Go to **Knowledge Base** in the sidebar
2. Click **Create Knowledge Base**
3. Name it: `CyberMeds Product Catalog`
4. Upload the product CSV file:
   - File: `apps/api/data/products.csv`
   - Format: CSV (supported up to 1,000 rows)
5. Click **Save**

## Step 4: Create the Agent

1. Go to **Agents** in the sidebar
2. Click **Create Agent**
3. Choose **Single Prompt Agent** (for POC)

### Agent Configuration

| Setting | Value |
|---------|-------|
| **Name** | Maya - CyberMeds Assistant |
| **Language** | English |
| **Voice** | Choose a warm, professional female voice (ElevenLabs or OpenAI) |
| **Model** | GPT-4o or Claude |

### System Prompt

Copy the prompt from `apps/api/data/retell-agent-prompt.md` (the content inside the code block).

### Attach Knowledge Base

1. Scroll to **Knowledge Base** section
2. Select `CyberMeds Product Catalog`
3. Enable "Always retrieve from knowledge base"

## Step 5: Configure Custom Functions

Add these custom functions in the agent's **Functions** section:

### Function 1: lookup_product

```json
{
  "name": "lookup_product",
  "description": "Search for product information by name or health condition",
  "parameters": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "description": "Product name, generic name, or health condition to search for"
      }
    },
    "required": ["query"]
  }
}
```

- **HTTP Method**: POST
- **URL**: `https://api-production-c04f.up.railway.app/webhooks/retell/tools`
- **Speak during execution**: Yes
- **Speak after execution**: Yes

### Function 2: create_order

```json
{
  "name": "create_order",
  "description": "Create a new order for a customer",
  "parameters": {
    "type": "object",
    "properties": {
      "product_name": {
        "type": "string",
        "description": "Name of the product to order"
      },
      "quantity": {
        "type": "number",
        "description": "Number of units to order"
      },
      "customer_name": {
        "type": "string",
        "description": "Customer's full name"
      },
      "customer_phone": {
        "type": "string",
        "description": "Customer's phone number"
      },
      "delivery_address": {
        "type": "string",
        "description": "Delivery address"
      },
      "is_pwd_senior": {
        "type": "boolean",
        "description": "Whether customer is PWD or Senior Citizen (20% discount eligible)"
      }
    },
    "required": ["product_name", "quantity", "customer_name", "customer_phone"]
  }
}
```

- **HTTP Method**: POST
- **URL**: `https://api-production-c04f.up.railway.app/webhooks/retell/tools`
- **Speak during execution**: Yes ("Let me process your order...")
- **Speak after execution**: Yes

### Function 3: log_complaint

```json
{
  "name": "log_complaint",
  "description": "Record a customer complaint or concern",
  "parameters": {
    "type": "object",
    "properties": {
      "customer_name": {
        "type": "string",
        "description": "Customer's name"
      },
      "customer_phone": {
        "type": "string",
        "description": "Customer's phone number"
      },
      "complaint_type": {
        "type": "string",
        "description": "Type of complaint: product_quality, delivery, service, billing, other"
      },
      "description": {
        "type": "string",
        "description": "Detailed description of the complaint"
      }
    },
    "required": ["complaint_type", "description"]
  }
}
```

- **HTTP Method**: POST
- **URL**: `https://api-production-c04f.up.railway.app/webhooks/retell/tools`
- **Speak during execution**: Yes
- **Speak after execution**: Yes

### Function 4: transfer_to_human

```json
{
  "name": "transfer_to_human",
  "description": "Transfer the call to a human agent",
  "parameters": {
    "type": "object",
    "properties": {
      "reason": {
        "type": "string",
        "description": "Reason for transferring to human"
      },
      "department": {
        "type": "string",
        "enum": ["pharmacist", "customer_service", "manager"],
        "description": "Department to transfer to"
      }
    },
    "required": ["reason", "department"]
  }
}
```

- **HTTP Method**: POST
- **URL**: `https://api-production-c04f.up.railway.app/webhooks/retell/tools`
- **Speak during execution**: Yes ("Please hold while I transfer you...")
- **Speak after execution**: No

## Step 6: Configure Webhooks

1. Go to agent **Settings** → **Webhooks**
2. Set webhook URL: `https://api-production-c04f.up.railway.app/webhooks/retell`
3. Enable events:
   - `call_started`
   - `call_ended`
   - `call_analyzed`

## Step 7: Test the Agent

### Web Call Test (No Phone Needed)

1. Go to your agent in the Dashboard
2. Click **Test** button (top right)
3. Allow microphone access
4. Start talking to Maya!

### Test Scenarios

| Scenario | What to Say |
|----------|-------------|
| Product inquiry | "What medications do you have for high blood pressure?" |
| Price check | "How much is Pregabalin 75mg?" |
| PWD discount | "I'm a senior citizen. What's the discounted price for Vas8?" |
| Place order | "I'd like to order 2 boxes of Recox" |
| Complaint | "I have a complaint about my last delivery" |
| Transfer | "Can I speak to a pharmacist?" |
| Taglish | "Meron ba kayong gamot for nerve pain?" |

## Step 8: Deploy with Phone Number (Optional)

### Option A: Buy from Retell

1. Go to **Phone Numbers**
2. Click **Buy New Number**
3. Select Philippines (+63)
4. Purchase and assign to your agent

### Option B: Use Telnyx

1. Create Telnyx account
2. Buy Philippines number
3. In Retell, go to **Phone Numbers** → **Import**
4. Follow Telnyx integration guide

## Monitoring & Logs

### View Call Logs

1. Go to **Calls** in the sidebar
2. Filter by agent, date, or status
3. Click on a call to see:
   - Full transcript
   - Recording (if enabled)
   - Function calls made
   - Duration and outcome

### Check Webhook Logs

Visit: `https://api-production-c04f.up.railway.app/webhooks/retell/logs`

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Agent not responding | Check microphone permissions |
| Functions not working | Verify webhook URL is correct and Railway is running |
| Knowledge base not found | Ensure CSV was uploaded and attached to agent |
| Voice sounds robotic | Try a different voice provider (ElevenLabs recommended) |
| Taglish not understood | Agent uses English primarily; Taglish understood in prompts |

## Environment Variables

Add these to Railway:

| Variable | Description |
|----------|-------------|
| `RETELL_API_KEY` | Your Retell API key |
| `PORT` | 3000 (Railway sets automatically) |

## Next Steps

1. Test thoroughly with various scenarios
2. Refine the agent prompt based on test results
3. Add more custom functions as needed
4. Set up phone number for real calls
5. Monitor call analytics and improve
