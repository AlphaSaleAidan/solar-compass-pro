/**
 * Event Pipeline Routes
 * 
 * POST /api/events — Process a pipeline event
 * GET  /api/events/triggers — List all triggers and their variables
 * GET  /api/events/flow — Get the full data flow diagram
 */

import { Router, Request, Response } from 'express';
import { processEvent, TRIGGER_MAP, type PipelineEvent, type EventType } from '../events/pipeline';
import { z } from 'zod';

const router = Router();

const EventSchema = z.object({
  type: z.string(),
  actor: z.object({
    userId: z.string(),
    role: z.string(),
    name: z.string(),
  }),
  projectId: z.string().optional(),
  sellProjectId: z.string().optional(),
  data: z.record(z.any()),
});

/**
 * POST /api/events
 * Process a pipeline event with full trigger chain
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const parsed = EventSchema.parse(req.body);
    const event: PipelineEvent = {
      ...parsed,
      type: parsed.type as EventType,
      timestamp: new Date().toISOString(),
    };

    await processEvent(event);
    
    const trigger = TRIGGER_MAP[event.type];
    res.json({
      success: true,
      event: event.type,
      sideEffects: trigger?.sideEffects || [],
      nextEvents: trigger?.nextEvents || [],
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid event payload', details: err.errors });
    } else {
      console.error('Event processing error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

/**
 * GET /api/events/triggers
 * List all triggers, their required variables, and side effects
 */
router.get('/triggers', (_req: Request, res: Response) => {
  const triggers = Object.entries(TRIGGER_MAP).map(([type, config]) => ({
    event: type,
    ...config,
  }));
  res.json({ triggers, count: triggers.length });
});

/**
 * GET /api/events/flow
 * Full sequencing flow — what triggers what
 */
router.get('/flow', (_req: Request, res: Response) => {
  const flows = Object.entries(TRIGGER_MAP).map(([type, config]) => ({
    event: type,
    triggers: config.nextEvents,
    description: config.description,
  }));

  // Build adjacency list
  const graph: Record<string, string[]> = {};
  for (const [type, config] of Object.entries(TRIGGER_MAP)) {
    graph[type] = config.nextEvents;
  }

  // Full pipeline sequences
  const sequences = [
    {
      name: 'Deal Lifecycle (Happy Path)',
      steps: [
        'APPOINTMENT_CREATED',
        'DEAL_SUBMITTED → TICKETS_AWARDED (2 tickets to SR)',
        'WELCOME_CALL_COMPLETED',
        'SITE_SURVEY_COMPLETED',
        'CREDIT_CHECK_PASSED',
        'DEAL_CONVERTED_TO_SALE → TICKETS_AWARDED (2 tickets to SR)',
        'QC_APPROVED → routes to Installer + Financier portals',
        'M1: MILESTONE_CHECKLIST_UPDATED → MILESTONE_ALL_CHECKED → MILESTONE_OPS_APPROVED → FUND_RELEASE (15%)',
        'M2: ... → FUND_RELEASE (20%)',
        'M3: ... → FUND_RELEASE (15%)',
        'M4: ... → FUND_RELEASE (20%) + TICKETS_AWARDED (3 tickets to SR for install)',
        'M5: ... → FUND_RELEASE (20%)',
        'M6: ... → FUND_RELEASE (10%)',
        'M7: ... → FUND_RELEASE (5%) — Speed Bonus if PTO ≤ 35 days',
      ],
    },
    {
      name: 'Gamification Flow',
      steps: [
        'Deal sold → 2 tickets',
        'Deal converted → 2 tickets',
        'Install complete (M4) → 3 tickets',
        'Ticket resolved → 1 ticket',
        'Daily deal → streak_days++',
        'Streak ≥ 3 → bonus ticket',
        'Tickets → Spin Wheel or Puzzle Game → prizes',
      ],
    },
    {
      name: 'Fund Release Flow',
      steps: [
        'Milestone checklist 100% → Ops reviews',
        'Ops approves → FUND_RELEASE_REQUESTED',
        'Financier sees in portal → reviews SOW vs cost',
        'Financier approves → FUND_RELEASE_APPROVED',
        'Funds released → logged + notified',
      ],
    },
  ];

  res.json({ flows, graph, sequences });
});

export default router;
