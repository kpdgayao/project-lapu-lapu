import { Router } from 'express';
import Retell from 'retell-sdk';

export const webCallRouter = Router();

// Initialize Retell client
const getRetellClient = () => {
  const apiKey = process.env.RETELL_API_KEY;
  if (!apiKey) {
    throw new Error('RETELL_API_KEY environment variable is not set');
  }
  return new Retell({ apiKey });
};

/**
 * POST /api/web-call
 * Creates a web call and returns the access token for the frontend
 */
webCallRouter.post('/', async (req, res) => {
  try {
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

    console.log(`Web call created: ${webCallResponse.call_id}`);

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
webCallRouter.get('/agents', async (req, res) => {
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
