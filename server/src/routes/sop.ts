/**
 * SOP Guardian Routes — API for running and managing guardian agents
 *
 * POST /api/sop/scan           — Run all 7 guardians (full swarm scan)
 * POST /api/sop/scan/:agentId  — Run a single guardian agent
 * GET  /api/sop/violations     — List open violations
 * PATCH /api/sop/violations/:id — Acknowledge/resolve/override a violation
 * GET  /api/sop/history        — Recent guardian run history
 * GET  /api/sop/agents         — List all guardian agents and metadata
 *
 * Gated to backend_ops and master roles.
 */

import { Router, Response } from 'express';
import { requireAuth, requireRole, type AuthRequest } from '../middleware/auth';
import { supabase } from '../config/supabase';
import { runGuardianSwarm, runSingleGuardian, AGENT_META } from '../services/sopGuardians';

const router = Router();

// Run full swarm scan
router.post('/scan', requireAuth, requireRole('backend_ops', 'master'), async (req: AuthRequest, res: Response) => {
  try {
    const result = await runGuardianSwarm(req.userId);
    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Scan failed';
    console.error('[sop] Swarm scan error:', message);
    res.status(500).json({ error: message });
  }
});

// Run single agent
router.post('/scan/:agentId', requireAuth, requireRole('backend_ops', 'master'), async (req: AuthRequest, res: Response) => {
  try {
    const result = await runSingleGuardian(req.params.agentId);
    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Agent scan failed';
    res.status(400).json({ error: message });
  }
});

// List open violations
router.get('/violations', requireAuth, requireRole('backend_ops', 'master'), async (_req: AuthRequest, res: Response) => {
  const { data, error } = await supabase
    .from('sop_violations')
    .select('*')
    .in('status', ['open', 'acknowledged'])
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ violations: data || [], count: data?.length || 0 });
});

// Update violation status
router.patch('/violations/:id', requireAuth, requireRole('backend_ops', 'master'), async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status, override_reason } = req.body;

  if (!['acknowledged', 'resolved', 'overridden'].includes(status)) {
    return res.status(400).json({ error: 'Status must be acknowledged, resolved, or overridden' });
  }

  if (status === 'overridden' && !override_reason) {
    return res.status(400).json({ error: 'Override requires a reason' });
  }

  const update: Record<string, unknown> = {
    status,
    resolved_by: req.userId,
    resolved_at: new Date().toISOString(),
  };
  if (override_reason) update.override_reason = override_reason;

  const { error } = await supabase
    .from('sop_violations')
    .update(update)
    .eq('id', id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// Run history
router.get('/history', requireAuth, requireRole('backend_ops', 'master'), async (_req: AuthRequest, res: Response) => {
  const { data, error } = await supabase
    .from('sop_guardian_runs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ runs: data || [] });
});

// Agent metadata
router.get('/agents', requireAuth, async (_req: AuthRequest, res: Response) => {
  res.json({ agents: AGENT_META });
});

export default router;
