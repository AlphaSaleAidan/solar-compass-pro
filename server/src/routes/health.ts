import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { STORAGE_BUCKETS } from '../config/buckets';
import { TRIGGER_MAP } from '../events/pipeline';

const router = Router();

/**
 * GET /api/health
 * System health check + status summary
 */
router.get('/', async (_req: Request, res: Response) => {
  let dbStatus = 'unknown';
  try {
    const { error } = await supabase.from('profiles').select('id').limit(1);
    dbStatus = error ? `error: ${error.message}` : 'connected';
  } catch {
    dbStatus = 'unreachable';
  }

  res.json({
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    database: dbStatus,
    buckets: Object.keys(STORAGE_BUCKETS).length,
    eventTypes: Object.keys(TRIGGER_MAP).length,
    uptime: process.uptime(),
  });
});

/**
 * GET /api/health/buckets
 * List all storage buckets and their config
 */
router.get('/buckets', (_req: Request, res: Response) => {
  const buckets = Object.entries(STORAGE_BUCKETS).map(([id, config]) => ({
    id,
    description: config.description,
    public: config.public,
    maxSizeMB: config.maxSizeMB,
    folderStructure: config.folderStructure,
    producedBy: config.producedBy,
    consumedBy: config.consumedBy,
  }));
  res.json({ buckets, count: buckets.length });
});

export default router;
