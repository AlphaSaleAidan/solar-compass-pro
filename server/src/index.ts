/**
 * ASP Backend — Railway Server
 * 
 * Express API with event pipeline, webhook handlers, and cron jobs.
 * Connects to Supabase for database, auth, and storage.
 * 
 * Routes:
 *   GET  /api/health           — Health check + system status
 *   GET  /api/health/buckets   — Storage bucket configuration
 *   POST /api/events           — Process pipeline event
 *   GET  /api/events/triggers  — List all triggers & variables
 *   GET  /api/events/flow      — Full data flow sequences
 *   POST /api/webhooks/aurora  — Aurora Solar webhook
 *   POST /api/webhooks/docusign— DocuSign webhook
 *   POST /api/auth/forgot-password — Custom branded password reset
 *   POST /api/auth/password-changed — Password change confirmation
 *   GET  /api/auth/config           — Auth system status
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import healthRoutes from './routes/health';
import eventRoutes from './routes/events';
import webhookRoutes from './routes/webhooks';
import authRoutes from './routes/auth';
import councilRoutes from './routes/council';
import { startCronJobs } from './jobs/crons';
import { rateLimit } from './middleware/auth';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);
const isProd = process.env.NODE_ENV === 'production';

// ─── Middleware ────────────────────────────────────────────
app.use(helmet());

const allowedOrigins = [
  'https://alphasalepro.com',
  'https://www.alphasalepro.com',
];
if (!isProd) {
  allowedOrigins.push('http://localhost:5173', 'http://localhost:8080');
}
app.use(cors({ origin: allowedOrigins, credentials: true }));

app.use(morgan(isProd ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));

// Global rate limit: 200 requests per minute per IP
app.use(rateLimit({ windowMs: 60_000, max: 200 }));

// ─── Routes ───────────────────────────────────────────────
app.use('/api/health', healthRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/council', councilRoutes);

// ─── Root ─────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({
    name: 'Alpha Sale Pro — Backend API',
    version: '1.0.3',
    docs: {
      health: '/api/health',
      buckets: '/api/health/buckets',
      triggers: '/api/events/triggers',
      flow: '/api/events/flow',
    },
  });
});

// ─── Start ────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
  ╔═══════════════════════════════════════════╗
  ║  🚀 ASP Backend running on port ${PORT}      ║
  ║                                           ║
  ║  Health:   /api/health                    ║
  ║  Triggers: /api/events/triggers           ║
  ║  Flow:     /api/events/flow               ║
  ║  Webhooks: /api/webhooks/{aurora,docusign} ║
  ╚═══════════════════════════════════════════╝
  `);

  // Start cron jobs
  startCronJobs();
});

export default app;
