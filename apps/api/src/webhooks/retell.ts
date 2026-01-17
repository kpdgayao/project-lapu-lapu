import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { z } from 'zod';
import { searchProducts, formatProductForVoice, formatProductDetailsForVoice } from '../services/products.js';

const router: RouterType = Router();

// Retell webhook event types
// See: https://docs.retellai.com/api-references/list-calls

const RetellCallEventSchema = z.object({
  event: z.enum(['call_started', 'call_ended', 'call_analyzed']),
  call: z.object({
    call_id: z.string(),
    agent_id: z.string(),
    call_status: z.string(),
    start_timestamp: z.number().optional(),
    end_timestamp: z.number().optional(),
    transcript: z.string().optional(),
    recording_url: z.string().optional(),
    from_number: z.string().optional(),
    to_number: z.string().optional(),
    direction: z.enum(['inbound', 'outbound']).optional(),
    call_analysis: z.object({
      call_summary: z.string().optional(),
      user_sentiment: z.string().optional(),
      call_successful: z.boolean().optional(),
      custom_analysis_data: z.record(z.unknown()).optional(),
    }).optional(),
  }),
});

type RetellCallEvent = z.infer<typeof RetellCallEventSchema>;

// Store for POC logs (in-memory, will be replaced with DB in Phase 1)
const callLogs: Array<{
  timestamp: string;
  event: string;
  callId: string;
  data: unknown;
}> = [];

const orders: Array<{
  id: string;
  timestamp: string;
  productName: string;
  quantity: number;
  customerName: string;
  customerPhone: string;
  deliveryAddress?: string;
  isPwdSenior: boolean;
  totalPrice: number;
  status: string;
}> = [];

const complaints: Array<{
  id: string;
  timestamp: string;
  customerName?: string;
  customerPhone?: string;
  complaintType: string;
  description: string;
  status: string;
}> = [];

/**
 * Main Retell webhook endpoint
 * Receives call lifecycle events from Retell AI
 */
router.post('/', async (req: Request, res: Response) => {
  const timestamp = new Date().toISOString();

  console.log('\n=== Retell Webhook Event ===');
  console.log('Timestamp:', timestamp);
  console.log('Body:', JSON.stringify(req.body, null, 2));

  try {
    const event = RetellCallEventSchema.parse(req.body);

    // Log the event
    callLogs.push({
      timestamp,
      event: event.event,
      callId: event.call.call_id,
      data: event,
    });

    // Handle different event types
    switch (event.event) {
      case 'call_started':
        console.log(`📞 Call started: ${event.call.call_id}`);
        console.log(`   From: ${event.call.from_number || 'web'}`);
        console.log(`   Direction: ${event.call.direction || 'unknown'}`);
        break;

      case 'call_ended':
        console.log(`📴 Call ended: ${event.call.call_id}`);
        console.log(`   Status: ${event.call.call_status}`);
        if (event.call.transcript) {
          console.log(`   Transcript: ${event.call.transcript.substring(0, 200)}...`);
        }
        break;

      case 'call_analyzed':
        console.log(`📊 Call analyzed: ${event.call.call_id}`);
        if (event.call.call_analysis) {
          console.log(`   Summary: ${event.call.call_analysis.call_summary || 'N/A'}`);
          console.log(`   Sentiment: ${event.call.call_analysis.user_sentiment || 'N/A'}`);
        }
        break;
    }

    // Return 204 as per Retell docs
    res.status(204).send();
  } catch (error) {
    console.error('Webhook validation error:', error);
    // Still acknowledge receipt
    res.status(204).send();
  }
});

/**
 * GET endpoint to view recent call logs (for debugging)
 */
router.get('/logs', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 20;
  const recentLogs = callLogs.slice(-limit);

  res.json({
    total: callLogs.length,
    showing: recentLogs.length,
    logs: recentLogs,
  });
});

/**
 * GET endpoint to view orders (for debugging)
 */
router.get('/orders', (req: Request, res: Response) => {
  res.json({
    total: orders.length,
    orders: orders.slice(-20),
  });
});

/**
 * GET endpoint to view complaints (for debugging)
 */
router.get('/complaints', (req: Request, res: Response) => {
  res.json({
    total: complaints.length,
    complaints: complaints.slice(-20),
  });
});

/**
 * Retell tool endpoint - handles function calls from the AI agent
 */
router.post('/tools', async (req: Request, res: Response) => {
  const timestamp = new Date().toISOString();

  console.log('\n=== Retell Tool Call ===');
  console.log('Timestamp:', timestamp);
  console.log('Body:', JSON.stringify(req.body, null, 2));

  // Retell sends: { name: string, args: object, call: object }
  const { name, args, call } = req.body;
  const toolName = name || req.body.tool_name;
  const toolArgs = args || req.body.arguments || {};

  try {
    switch (toolName) {
      case 'lookup_product': {
        const query = toolArgs.query || '';
        console.log(`🔍 Looking up product: "${query}"`);

        const products = searchProducts(query);

        if (products.length === 0) {
          res.json({
            result: `I couldn't find any products matching "${query}". Would you like me to help you search for something else, or would you like to speak with a pharmacist?`
          });
        } else if (products.length === 1) {
          res.json({
            result: formatProductDetailsForVoice(products[0])
          });
        } else {
          // Multiple matches - list them briefly
          const productList = products.slice(0, 5).map(p =>
            `${p.productName} ${p.sizeVariant} at ${p.regularPrice} pesos`
          ).join('; ');

          res.json({
            result: `I found ${products.length} products. Here are some options: ${productList}. Would you like more details about any of these?`
          });
        }
        break;
      }

      case 'create_order': {
        const { product_name, quantity, customer_name, customer_phone, delivery_address, is_pwd_senior } = toolArgs;
        console.log(`📦 Creating order for ${quantity}x ${product_name}`);

        // Find the product to get pricing
        const products = searchProducts(product_name);

        if (products.length === 0) {
          res.json({
            result: `I couldn't find the product "${product_name}" in our catalog. Could you please confirm the product name?`
          });
          break;
        }

        const product = products[0];
        const unitPrice = is_pwd_senior ? product.pwdSeniorPrice : product.regularPrice;
        const totalPrice = unitPrice * (quantity || 1);

        const orderId = `ORD-${Date.now()}`;

        orders.push({
          id: orderId,
          timestamp,
          productName: product.productName,
          quantity: quantity || 1,
          customerName: customer_name || 'Unknown',
          customerPhone: customer_phone || 'Unknown',
          deliveryAddress: delivery_address,
          isPwdSenior: is_pwd_senior || false,
          totalPrice,
          status: 'pending',
        });

        console.log(`✅ Order created: ${orderId}`);

        const discountText = is_pwd_senior ? ' with your PWD/Senior Citizen discount' : '';
        res.json({
          result: `Great! I've created your order. Order number: ${orderId}. ` +
            `You ordered ${quantity || 1} ${product.productName} ${product.sizeVariant}${discountText}. ` +
            `Your total is ${totalPrice} pesos. ` +
            `Our team will contact you at ${customer_phone} to confirm the order and arrange delivery. ` +
            `Is there anything else I can help you with?`
        });
        break;
      }

      case 'log_complaint': {
        const { customer_name, customer_phone, complaint_type, description } = toolArgs;
        console.log(`📝 Logging complaint: ${complaint_type}`);

        const complaintId = `CMP-${Date.now()}`;

        complaints.push({
          id: complaintId,
          timestamp,
          customerName: customer_name,
          customerPhone: customer_phone,
          complaintType: complaint_type || 'general',
          description: description || '',
          status: 'open',
        });

        console.log(`✅ Complaint logged: ${complaintId}`);

        res.json({
          result: `I've recorded your concern with reference number ${complaintId}. ` +
            `Our customer service team will review this and get back to you within 24 to 48 hours. ` +
            `Is there anything else I can help you with today?`
        });
        break;
      }

      case 'transfer_to_human': {
        const { reason, department } = toolArgs;
        console.log(`🔄 Transfer requested to ${department}: ${reason}`);

        // Log the transfer request
        callLogs.push({
          timestamp,
          event: 'transfer_requested',
          callId: call?.call_id || 'unknown',
          data: { reason, department },
        });

        // In POC, we just acknowledge. In production, this would trigger actual transfer.
        res.json({
          result: `I'm transferring you to our ${department || 'customer service team'} now. ` +
            `Please hold for a moment while I connect you. Thank you for your patience.`
        });
        break;
      }

      default:
        console.log(`⚠️ Unknown tool: ${toolName}`);
        res.json({
          result: `I'm not sure how to help with that. Would you like to speak with a customer service representative?`
        });
    }
  } catch (error) {
    console.error('Tool execution error:', error);
    res.json({
      result: `I'm sorry, I encountered an error processing your request. Would you like me to connect you with a customer service representative?`
    });
  }
});

export { router as retellWebhookRouter };
