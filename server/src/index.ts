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
 *   POST /api/webhooks/stripe  — Stripe payment webhook
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
import { startCronJobs } from './jobs/crons';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// ─── Middleware ────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: [
    'https://alphasalepro.com',
    'https://www.alphasalepro.com',
    'http://localhost:5173',    // Vite dev
    'http://localhost:8080',    // Lovable dev
  ],
  credentials: true,
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));

// ─── Routes ───────────────────────────────────────────────
app.use('/api/health', healthRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/auth', authRoutes);

// ─── Root ─────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({
    name: 'Alpha Sale Pro — Backend API',
    version: '1.0.0',
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
