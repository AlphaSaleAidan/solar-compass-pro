import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { STORAGE_BUCKETS } from '../config/buckets';
import { TRIGGER_MAP } from '../events/pipeline';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  let dbStatus = 'unknown';
  try {
    const { error } = await supabase.from('profiles').select('id').limit(1);
    dbStatus = error ? `error: ${error.message}` : 'connected';
  } catch (e: any) {
    dbStatus = `unreachable: ${e.message}`;
  }

  // Debug: show key prefixes (safe - not full keys)
  const url = process.env.SUPABASE_URL || '';
  const srkPrefix = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').substring(0, 10);
  const srkLength = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').length;
  const srkLast3 = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').slice(-3);

  res.json({
    status: 'ok',
    version: '1.0.1',
    timestamp: new Date().toISOString(),
    database: dbStatus,
    buckets: Object.keys(STORAGE_BUCKETS).length,
    eventTypes: Object.keys(TRIGGER_MAP).length,
    uptime: process.uptime(),
    debug: {
      supabase_url: url,
      key_prefix: srkPrefix + '...',
      key_length: srkLength,
      key_suffix: '...' + srkLast3,
    },
  });
});

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
