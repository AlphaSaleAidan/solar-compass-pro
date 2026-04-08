/**
 * Project Lifecycle State Machine
 * 
 * States: lead → qualified → qc_review → active (M1-M7) → completed → archived
 *                                ↘ rejected (can be re-routed)
 * 
 * Every transition has guard checks enforcing SOP requirements.
 * No state can be skipped.
 */

// ─── Types ─────────────────────────────────────────────────────────────

export type ProjectState =
  | 'lead'         // New sell project, no Aurora data
  | 'qualified'    // Aurora synced, credit passed
  | 'qc_review'    // Submitted to QC for initial approval
  | 'active'       // QC approved, in M1-M7 installation cycle
  | 'completed'    // All milestones done, funds released
  | 'archived'     // Closed out — historical record
  | 'rejected';    // Failed QC or financier/installer rejection

export type TransitionAction =
  | 'qualify'           // lead → qualified
  | 'submit_to_qc'     // qualified → qc_review
  | 'approve_qc'       // qc_review → active
  | 'reject_qc'        // qc_review → rejected
  | 'complete'         // active → completed (all M1-M7 done)
  | 'archive'          // completed → archived
  | 'reject'           // active → rejected (installer/financier issue)
  | 'reroute';         // rejected → lead (re-assign and restart)

export interface TransitionGuard {
  field: string;
  check: string;       // Human-readable check description
  evaluate: (ctx: GuardContext) => boolean;
}

export interface GuardContext {
  // Sell project data
  firstName?: string;
  lastName?: string;
  creditStatus?: string;
  auroraSynced?: boolean;
  auroraData?: Record<string, unknown> | null;
  convertedToSale?: boolean;
  qcInitialApproved?: boolean;
  approvalStatus?: string;
  // Docs & onboarding
  docsSent?: boolean;
  allDocsSigned?: boolean;
  welcomeCallComplete?: boolean;
  siteSurveyComplete?: boolean;
  // Milestone data  
  currentMilestone?: number;
  totalMilestones?: number;
  allMilestonesApproved?: boolean;
  allFundsReleased?: boolean;
}

interface TransitionDef {
  from: ProjectState;
  to: ProjectState;
  action: TransitionAction;
  guards: TransitionGuard[];
}

// ─── Transition Definitions ────────────────────────────────────────────

const transitions: TransitionDef[] = [
  {
    from: 'lead',
    to: 'qualified',
    action: 'qualify',
    guards: [
      {
        field: 'firstName',
        check: 'Customer first name is set',
        evaluate: (ctx) => !!ctx.firstName?.trim(),
      },
      {
        field: 'lastName',
        check: 'Customer last name is set',
        evaluate: (ctx) => !!ctx.lastName?.trim(),
      },
      {
        field: 'creditStatus',
        check: 'Credit check has passed',
        evaluate: (ctx) => ctx.creditStatus === 'passed',
      },
      {
        field: 'auroraSynced',
        check: 'Aurora data is synced',
        evaluate: (ctx) => ctx.auroraSynced === true,
      },
    ],
  },
  {
    from: 'qualified',
    to: 'qc_review',
    action: 'submit_to_qc',
    guards: [
      {
        field: 'convertedToSale',
        check: 'Project has been converted to a sale',
        evaluate: (ctx) => ctx.convertedToSale === true,
      },
      {
        field: 'auroraData',
        check: 'Aurora design data exists',
        evaluate: (ctx) => ctx.auroraData != null && Object.keys(ctx.auroraData).length > 0,
      },
    ],
  },
  {
    from: 'qc_review',
    to: 'active',
    action: 'approve_qc',
    guards: [
      {
        field: 'qcInitialApproved',
        check: 'QC initial review is approved',
        evaluate: (ctx) => ctx.qcInitialApproved === true,
      },
    ],
  },
  {
    from: 'qc_review',
    to: 'rejected',
    action: 'reject_qc',
    guards: [], // No guards — rejection is always allowed from QC
  },
  {
    from: 'active',
    to: 'completed',
    action: 'complete',
    guards: [
      {
        field: 'allMilestonesApproved',
        check: 'All milestones (M1-M7) are ops-approved',
        evaluate: (ctx) => ctx.allMilestonesApproved === true,
      },
      {
        field: 'allFundsReleased',
        check: 'All milestone funds have been released',
        evaluate: (ctx) => ctx.allFundsReleased === true,
      },
    ],
  },
  {
    from: 'active',
    to: 'rejected',
    action: 'reject',
    guards: [], // Rejection allowed (e.g., installer/financier drops the project)
  },
  {
    from: 'completed',
    to: 'archived',
    action: 'archive',
    guards: [], // Archiving a completed project is always allowed
  },
  {
    from: 'rejected',
    to: 'lead',
    action: 'reroute',
    guards: [], // Re-routing resets the project to lead for re-assignment
  },
];

// ─── State Machine API ─────────────────────────────────────────────────

export interface TransitionResult {
  allowed: boolean;
  targetState: ProjectState;
  action: TransitionAction;
  failedGuards: { field: string; check: string }[];
  passedGuards: { field: string; check: string }[];
}

/**
 * Check if a specific transition is allowed given the current context.
 */
export function canTransition(
  currentState: ProjectState,
  action: TransitionAction,
  ctx: GuardContext
): TransitionResult {
  const def = transitions.find(t => t.from === currentState && t.action === action);

  if (!def) {
    return {
      allowed: false,
      targetState: currentState,
      action,
      failedGuards: [{ field: '_transition', check: `No transition "${action}" from state "${currentState}"` }],
      passedGuards: [],
    };
  }

  const passed: { field: string; check: string }[] = [];
  const failed: { field: string; check: string }[] = [];

  for (const guard of def.guards) {
    if (guard.evaluate(ctx)) {
      passed.push({ field: guard.field, check: guard.check });
    } else {
      failed.push({ field: guard.field, check: guard.check });
    }
  }

  return {
    allowed: failed.length === 0,
    targetState: def.to,
    action,
    failedGuards: failed,
    passedGuards: passed,
  };
}

/**
 * Get all available transitions from the current state.
 * Returns each with guard evaluation results.
 */
export function getAvailableTransitions(
  currentState: ProjectState,
  ctx: GuardContext
): TransitionResult[] {
  return transitions
    .filter(t => t.from === currentState)
    .map(t => canTransition(currentState, t.action, ctx));
}

/**
 * Infer the current state from sell project / project data.
 * Used to sync legacy data with the state machine.
 */
export function inferState(ctx: GuardContext & {
  approvalStatus?: string;
  projectExists?: boolean; // Whether a projects table row exists
}): ProjectState {
  // Rejected
  if (ctx.approvalStatus === 'rejected') return 'rejected';

  // Completed — all milestones done
  if (ctx.allMilestonesApproved && ctx.allFundsReleased) return 'completed';

  // Active — QC approved and in milestone cycle
  if (ctx.qcInitialApproved && ctx.convertedToSale) return 'active';

  // QC Review — converted but not yet approved
  if (ctx.convertedToSale && !ctx.qcInitialApproved) return 'qc_review';

  // Qualified — has aurora data and credit passed
  if (ctx.auroraSynced && ctx.creditStatus === 'passed') return 'qualified';

  // Default: lead
  return 'lead';
}

// ─── State Metadata ────────────────────────────────────────────────────

export const STATE_META: Record<ProjectState, {
  label: string;
  color: string;       // Tailwind color class
  glowColor: string;   // CSS glow for the timeline node
  icon: string;        // Emoji for quick visual
  description: string;
}> = {
  lead: {
    label: 'Lead',
    color: 'text-gray-400',
    glowColor: 'rgba(156,163,175,0.4)',
    icon: 'L',
    description: 'New prospect — needs qualification',
  },
  qualified: {
    label: 'Qualified',
    color: 'text-blue-400',
    glowColor: 'rgba(96,165,250,0.5)',
    icon: 'Q',
    description: 'Credit passed, Aurora synced — ready for conversion',
  },
  qc_review: {
    label: 'QC Review',
    color: 'text-amber-400',
    glowColor: 'rgba(251,191,36,0.5)',
    icon: 'QC',
    description: 'Awaiting quality control approval',
  },
  active: {
    label: 'Active',
    color: 'text-emerald-400',
    glowColor: 'rgba(52,211,153,0.5)',
    icon: 'A',
    description: 'In M1-M7 installation cycle',
  },
  completed: {
    label: 'Completed',
    color: 'text-primary',
    glowColor: 'rgba(0,212,200,0.5)',
    icon: '✓',
    description: 'All milestones done, funds released',
  },
  archived: {
    label: 'Archived',
    color: 'text-gray-500',
    glowColor: 'rgba(107,114,128,0.3)',
    icon: 'AR',
    description: 'Closed — historical record',
  },
  rejected: {
    label: 'Rejected',
    color: 'text-red-400',
    glowColor: 'rgba(248,113,113,0.5)',
    icon: '✗',
    description: 'Failed QC or dropped — can be re-routed',
  },
};

/** Ordered list of the "happy path" states for rendering timelines */
export const HAPPY_PATH: ProjectState[] = [
  'lead', 'qualified', 'qc_review', 'active', 'completed', 'archived',
];
