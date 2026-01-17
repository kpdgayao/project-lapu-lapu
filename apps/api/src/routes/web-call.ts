import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import Retell from 'retell-sdk';

export const webCallRouter = Router();

// =============================================================================
// Rate Limiting Configuration (adjust these values as needed)
// =============================================================================
const RATE_LIMIT = {
  perIpPerHour: 5,        // Max calls per IP per hour
  globalPerDay: 50,       // Max total calls per day across all users
};

// Global daily counter (resets on server restart or daily)
let globalDailyCallCount = 0;
let lastResetDate = new Date().toDateString();

function checkAndResetDailyCounter() {
  const today = new Date().toDateString();
  if (today !== lastResetDate) {
    globalDailyCallCount = 0;
    lastResetDate = today;
    console.log('Daily call counter reset');
  }
}

// Per-IP rate limiter
const perIpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: RATE_LIMIT.perIpPerHour,
  message: {
    error: 'Rate limit exceeded',
    message: `Maximum ${RATE_LIMIT.perIpPerHour} calls per hour. Please try again later.`
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use X-Forwarded-For for Railway/proxied requests
    return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
      || req.ip
      || 'unknown';
  }
});

// =============================================================================
// Retell Client
// =============================================================================
const getRetellClient = () => {
  const apiKey = process.env.RETELL_API_KEY;
  if (!apiKey) {
    throw new Error('RETELL_API_KEY environment variable is not set');
  }
  return new Retell({ apiKey });
};

// =============================================================================
// Routes
// =============================================================================

/**
 * GET /api/web-call/status
 * Returns current rate limit status
 */
webCallRouter.get('/status', (req: Request, res: Response) => {
  checkAndResetDailyCounter();
  res.json({
    dailyCallsUsed: globalDailyCallCount,
    dailyCallsLimit: RATE_LIMIT.globalPerDay,
    dailyCallsRemaining: Math.max(0, RATE_LIMIT.globalPerDay - globalDailyCallCount),
    perIpLimit: RATE_LIMIT.perIpPerHour
  });
});

/**
 * POST /api/web-call
 * Creates a web call and returns the access token for the frontend
 */
webCallRouter.post('/', perIpLimiter, async (req: Request, res: Response) => {
  try {
    // Check global daily limit
    checkAndResetDailyCounter();
    if (globalDailyCallCount >= RATE_LIMIT.globalPerDay) {
      return res.status(429).json({
        error: 'Daily limit reached',
        message: `Maximum ${RATE_LIMIT.globalPerDay} calls per day. Please try again tomorrow.`
      });
    }

    const { agent_id } = req.body;

    if (!agent_id) {
      return res.status(400).json({
        error: 'agent_id is required',
        hint: 'Get your agent_id from the Retell dashboard after creating an agent'
      });
    }

    const client = getRetellClient();

    const webCallResponse = await client.call.createWebCall({
      agent_id,
      metadata: {
        source: 'poc-test',
        timestamp: new Date().toISOString()
      }
    });

    // Increment global counter on successful call creation
    globalDailyCallCount++;
    console.log(`Web call created: ${webCallResponse.call_id} (Daily count: ${globalDailyCallCount}/${RATE_LIMIT.globalPerDay})`);

    res.json({
      success: true,
      call_id: webCallResponse.call_id,
      access_token: webCallResponse.access_token,
      agent_id: webCallResponse.agent_id
    });
  } catch (error) {
    console.error('Error creating web call:', error);

    if (error instanceof Error) {
      res.status(500).json({
        error: 'Failed to create web call',
        message: error.message
      });
    } else {
      res.status(500).json({ error: 'Failed to create web call' });
    }
  }
});

/**
 * GET /api/web-call/agents
 * Lists available agents (helpful for testing)
 */
webCallRouter.get('/agents', async (req: Request, res: Response) => {
  try {
    const client = getRetellClient();
    const agents = await client.agent.list();

    res.json({
      success: true,
      agents: agents.map(agent => ({
        agent_id: agent.agent_id,
        agent_name: agent.agent_name,
        voice_id: agent.voice_id
      }))
    });
  } catch (error) {
    console.error('Error listing agents:', error);

    if (error instanceof Error) {
      res.status(500).json({
        error: 'Failed to list agents',
        message: error.message
      });
    } else {
      res.status(500).json({ error: 'Failed to list agents' });
    }
  }
});
