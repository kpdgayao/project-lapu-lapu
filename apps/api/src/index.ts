import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { retellWebhookRouter } from './webhooks/retell.js';
import { webCallRouter } from './routes/web-call.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Serve static files from public directory
// Using process.cwd() since this runs from the api directory
app.use(express.static(path.join(process.cwd(), 'public')));

// Request logging for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '0.1.0',
    phase: 'POC'
  });
});

// Retell webhooks
app.use('/webhooks/retell', retellWebhookRouter);

// Web call API routes
app.use('/api/web-call', webCallRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Project Lapu-lapu POC server running on port ${PORT}`);
  console.log(`  Health check: http://localhost:${PORT}/health`);
  console.log(`  Voice test:   http://localhost:${PORT}/test-call.html`);
  console.log(`  Webhooks:     http://localhost:${PORT}/webhooks/retell`);
});
