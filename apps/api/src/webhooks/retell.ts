import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { z } from 'zod';

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

// Store for POC call logs (in-memory, will be replaced with DB in Phase 1)
const callLogs: Array<{
  timestamp: string;
  event: string;
  callId: string;
  data: unknown;
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
        console.log(`   From: ${event.call.from_number || 'unknown'}`);
        console.log(`   To: ${event.call.to_number || 'unknown'}`);
        console.log(`   Direction: ${event.call.direction || 'unknown'}`);
        break;

      case 'call_ended':
        console.log(`📴 Call ended: ${event.call.call_id}`);
        console.log(`   Status: ${event.call.call_status}`);
        if (event.call.transcript) {
          console.log(`   Transcript length: ${event.call.transcript.length} chars`);
        }
        if (event.call.recording_url) {
          console.log(`   Recording: ${event.call.recording_url}`);
        }
        break;

      case 'call_analyzed':
        console.log(`📊 Call analyzed: ${event.call.call_id}`);
        if (event.call.call_analysis) {
          console.log(`   Summary: ${event.call.call_analysis.call_summary || 'N/A'}`);
          console.log(`   Sentiment: ${event.call.call_analysis.user_sentiment || 'N/A'}`);
          console.log(`   Successful: ${event.call.call_analysis.call_successful ?? 'N/A'}`);
        }
        break;
    }

    res.json({ success: true, received: event.event });
  } catch (error) {
    // Log validation errors but still acknowledge receipt
    console.error('Validation error:', error);
    console.log('Raw body received (proceeding anyway):', req.body);

    // Still log unvalidated events for POC debugging
    callLogs.push({
      timestamp,
      event: 'unknown',
      callId: req.body?.call?.call_id || 'unknown',
      data: req.body,
    });

    res.json({ success: true, note: 'Event received but validation failed' });
  }
});

/**
 * GET endpoint to view recent call logs (for POC debugging)
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
 * Retell tool endpoint - handles function calls from the AI agent
 * This will be expanded in Phase 2 with actual tool implementations
 */
router.post('/tools', async (req: Request, res: Response) => {
  const timestamp = new Date().toISOString();

  console.log('\n=== Retell Tool Call ===');
  console.log('Timestamp:', timestamp);
  console.log('Body:', JSON.stringify(req.body, null, 2));

  const { tool_name, arguments: args } = req.body;

  // POC: Simple responses for testing
  switch (tool_name) {
    case 'lookup_product':
      res.json({
        result: {
          found: true,
          message: 'This is a test response. Product lookup will be implemented in Phase 2.',
          product: {
            name: 'Sample Product',
            price: 100,
            available: true,
          },
        },
      });
      break;

    case 'transfer_to_human':
      console.log('🔄 Transfer to human requested');
      res.json({
        result: {
          success: true,
          message: 'Transferring to human agent. This will be fully implemented in Phase 2.',
        },
      });
      break;

    default:
      res.json({
        result: {
          message: `Tool '${tool_name}' received. Full implementation coming in Phase 2.`,
          args_received: args,
        },
      });
  }
});

export { router as retellWebhookRouter };
