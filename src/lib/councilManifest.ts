/**
 * Council Code Analysis Manifest
 *
 * This is the "brain" of the council — a structured map of every finding
 * tied to real implementation status, file paths, and evidence.
 *
 * Updated each build cycle by Viktor after code changes.
 * Agents reference this manifest to give data-backed answers.
 *
 * Last updated: 2026-04-08T07:30Z (build #31)
 */

export interface CodeEvidence {
  file: string;
  line?: number;
  snippet?: string;
  status: 'verified' | 'partial' | 'missing';
  notes?: string;
}

export interface FindingAnalysis {
  id: string;
  title: string;
  councilClaim: string;         // What the council originally said
  realStatus: 'fixed' | 'partial' | 'open' | 'council_wrong';
  evidence: CodeEvidence[];
  fixedInCommit?: string;
  remainingWork?: string;
  scoreImpact: number;          // -10 to +10
}

export interface AgentCodeAnalysis {
  agentId: string;
  currentScore: number;
  scoreBreakdown: Record<string, number>; // category → score
  findings: FindingAnalysis[];
}

/** Live code analysis — regenerated each deploy */
export const CODE_ANALYSIS: AgentCodeAnalysis[] = [
  {
    agentId: 'design',
    currentScore: 78,
    scoreBreakdown: {
      'Visual Polish': 82,
      'Animations': 75,
      'Typography': 80,
      'Responsive': 70,
      'Consistency': 78,
    },
    findings: [
      {
        id: 'design-pipeline-hover',
        title: 'Pipeline card hover states lack depth',
        councilClaim: 'Deal cards feel flat — need layered shadow, scale, glass reflection.',
        realStatus: 'fixed',
        evidence: [
          { file: 'src/components/sales/Pipeline.tsx', status: 'verified', notes: 'hover:scale-[1.01], layered box-shadow, glass reflection line via ::before pseudo-element' },
        ],
        fixedInCommit: 'Quick wins batch',
        scoreImpact: 3,
      },
      {
        id: 'design-aurora-loading',
        title: 'Aurora import needs loading choreography',
        councilClaim: 'Show satellite dish → data stream → success burst instead of generic spinner.',
        realStatus: 'open',
        evidence: [
          { file: 'src/components/sales/SellProjectCard.tsx', line: 37, snippet: 'const [syncing, setSyncing] = useState(false)', status: 'partial', notes: 'Has basic Loader2 spinner only — no cinematic sequence' },
        ],
        remainingWork: 'Build multi-step animation: satellite pulse → streaming dots → checkmark burst. ~2h.',
        scoreImpact: -3,
      },
      {
        id: 'design-m1m7-timeline',
        title: 'M1-M7 timeline needs visual progression',
        councilClaim: 'Milestone list is functional but not visual.',
        realStatus: 'fixed',
        evidence: [
          { file: 'src/components/shared/MilestoneTimeline.tsx', status: 'verified', notes: 'Horizontal timeline with glow nodes, animated connections, completion checkmarks, pulse on current' },
          { file: 'src/components/ProjectLifecycleBar.tsx', status: 'verified', notes: 'Additional lifecycle state bar with 7 states, glow effects, status badges' },
        ],
        fixedInCommit: 'M1-M7 visual timeline',
        scoreImpact: 5,
      },
      {
        id: 'design-upload-polish',
        title: 'Upload and date entry fields need polish',
        councilClaim: 'File upload buttons look like default HTML.',
        realStatus: 'open',
        evidence: [
          { file: 'src/components/plus/InstallerPortal.tsx', line: 1353, snippet: '<input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />', status: 'partial', notes: 'Hidden input with styled button trigger, but no drag-drop zone, no file type icons, no upload progress' },
        ],
        remainingWork: 'Build DragDropZone component with dashed borders, file type icons, progress bar. Themed date pickers. ~2h.',
        scoreImpact: -4,
      },
      {
        id: 'design-fund-celebration',
        title: 'Fund release needs celebration animation',
        councilClaim: 'Add vault door → green particle burst → amount ticking animation.',
        realStatus: 'open',
        evidence: [
          { file: 'src/components/plus/FinancierPortal.tsx', status: 'missing', notes: 'No celebration animation on fund release — just a toast notification' },
        ],
        remainingWork: 'Build FundReleaseAnimation component with confetti/particle burst + amount counter. ~2h.',
        scoreImpact: -3,
      },
      {
        id: 'design-parallax-landing',
        title: 'Section reveals need parallax depth layers',
        councilClaim: 'Each section needs 3 depth layers for cinematic scroll.',
        realStatus: 'partial',
        evidence: [
          { file: 'src/hooks/useParallax.ts', status: 'verified', notes: 'useParallax() and useMouseParallax() hooks written with configurable speed/range' },
          { file: 'src/pages/LandingPage.tsx', status: 'missing', notes: 'Hooks exist but are NOT imported or used in the landing page — zero parallax in production' },
        ],
        remainingWork: 'Import useParallax into LandingPage sections, add depth layers to background/content/accents. ~1h.',
        scoreImpact: -5,
      },
      {
        id: 'design-qc-glow',
        title: 'QC approval flow needs visual weight',
        councilClaim: 'Approve/reject buttons need glow states and review summary card.',
        realStatus: 'fixed',
        evidence: [
          { file: 'src/components/ops/QCReview.tsx', line: 166, status: 'verified', notes: 'Green glow hover on approve (shadow-[0_0_20px_rgba(34,197,94)]), red pulse on reject, review summary card with Aurora data preview' },
        ],
        fixedInCommit: 'Quick wins batch',
        scoreImpact: 3,
      },
    ],
  },
  {
    agentId: 'engineering',
    currentScore: 76,
    scoreBreakdown: {
      'Bundle Size': 85,
      'State Management': 62,
      'Type Safety': 78,
      'Architecture': 75,
      'API Design': 72,
    },
    findings: [
      {
        id: 'eng-lazy-threejs',
        title: 'Lazy-load Three.js and R3F',
        councilClaim: 'Three.js adds ~800KB. Use React.lazy() + Suspense.',
        realStatus: 'fixed',
        evidence: [
          { file: 'src/App.tsx', line: 20, snippet: "const CinematicBackground = React.lazy(() => import('@/components/shared/CinematicBackground'))", status: 'verified', notes: '873KB chunk code-split, clean 0.8s fade-in Suspense fallback' },
        ],
        fixedInCommit: 'Three.js lazy-load',
        scoreImpact: 8,
      },
      {
        id: 'eng-zustand',
        title: 'Replace prop drilling with Zustand slices',
        councilClaim: 'ProjectStore context re-renders entire tree. Migrate to Zustand.',
        realStatus: 'open',
        evidence: [
          { file: 'src/contexts/SupabaseProjectStore.tsx', status: 'partial', notes: 'Still using React Context with useContext. ~835 lines. Every state change re-renders all consumers. Zustand would enable selective subscriptions per slice.' },
        ],
        remainingWork: 'Big refactor: create zustand store with slices for projects, sellProjects, milestones, tickets, financier, messages. ~4h. Risk: touching every component.',
        scoreImpact: -6,
      },
      {
        id: 'eng-rbac-rls',
        title: 'Implement RBAC with Supabase RLS',
        councilClaim: 'Production auth needs Row Level Security policies.',
        realStatus: 'partial',
        evidence: [
          { file: 'src/lib/rbac.ts', status: 'verified', notes: 'RBAC skeleton with ROLES hierarchy (master_admin → vp → regional → divisional → manager → rep), PERMISSIONS map, hasPermission() + canAccessProject() helpers' },
          { file: 'src/contexts/AuthContext.tsx', status: 'partial', notes: 'AuthContext has can() helper that calls rbac.hasPermission(), but role is not loaded from profiles table — defaults to master_admin' },
          { file: 'Supabase RLS policies', status: 'missing', notes: 'No RLS policies applied to Supabase tables. Need SQL migration: ALTER TABLE projects ENABLE ROW LEVEL SECURITY; + CREATE POLICY for each role.' },
        ],
        remainingWork: '1) Load role from profiles table in AuthContext. 2) Generate RLS SQL migration. 3) Ask Aidan to run it in Supabase dashboard (port 5432 blocked from sandbox).',
        scoreImpact: -5,
      },
      {
        id: 'eng-realtime',
        title: 'Add Supabase Realtime for cross-portal sync',
        councilClaim: 'Use Supabase Realtime channels for instant updates.',
        realStatus: 'partial',
        evidence: [
          { file: 'src/contexts/SupabaseProjectStore.tsx', line: 190, snippet: "supabase.channel('prod-projects').on('postgres_changes', ...)", status: 'verified', notes: '3 channels active: prod-projects, prod-sell-projects, prod-milestone-states. All refetch on any change.' },
          { file: 'src/contexts/SupabaseProjectStore.tsx', status: 'partial', notes: 'Missing channels: tickets, notifications, financier_updates (financier channel exists in load but not realtime subscription for tickets/notifications)' },
          { file: 'src/components/AppHeader.tsx', line: 43, status: 'verified', notes: 'Realtime health indicator in header — green dot when connected' },
        ],
        remainingWork: 'Add realtime channels for tickets and notifications tables. ~30min.',
        scoreImpact: -2,
      },
      {
        id: 'eng-zod',
        title: 'Add Zod schema validation to sell sheets',
        councilClaim: 'Sell project form has no runtime validation.',
        realStatus: 'partial',
        evidence: [
          { file: 'src/lib/sellProjectSchema.ts', status: 'verified', notes: 'Schemas defined: customerInfoSchema, utilitySchema, auroraDataSchema, sellProjectSubmitSchema, conversionGateSchema. validateFields() helper returns inline errors.' },
          { file: 'src/components/sales/SellProjectCard.tsx', status: 'missing', notes: 'Schemas exist but are NOT imported in SellProjectCard — form still has no runtime validation on submit. Need to wire validateFields() into the save/convert handlers.' },
        ],
        remainingWork: 'Import sellProjectSchema in SellProjectCard, call validateFields() on save, show inline error messages. ~1h.',
        scoreImpact: -3,
      },
    ],
  },
  {
    agentId: 'qa',
    currentScore: 80,
    scoreBreakdown: {
      'Workflow Correctness': 85,
      'Edge Cases': 78,
      'Input Validation': 72,
      'Error Handling': 82,
      'Testing': 65,
    },
    findings: [
      {
        id: 'qa-milestone-order',
        title: 'Milestones can be completed out of order',
        councilClaim: 'BUG: Installer can skip M2 and complete M4.',
        realStatus: 'fixed',
        evidence: [
          { file: 'src/components/plus/InstallerPortal.tsx', line: 364, snippet: 'const isLocked = i > p.currentMilestone', status: 'verified', notes: 'Soft lock: future milestones show lock icon, greyed out with opacity-50 pointer-events-none. Can only interact with current milestone.' },
        ],
        fixedInCommit: 'Milestone soft-lock',
        scoreImpact: 6,
      },
      {
        id: 'qa-qc-submit',
        title: 'Submit for QC button appears without all items done',
        councilClaim: 'EDGE CASE: Toggling items on/off desynchronizes the button state via caching.',
        realStatus: 'council_wrong',
        evidence: [
          { file: 'src/components/plus/InstallerPortal.tsx', line: 435, snippet: "const allDone = instItems.length > 0 && instItems.every(c => ms.checklistDone[c.id])", status: 'verified', notes: 'allDone is recomputed every render via .every() on reactive state. There is NO caching — ms.checklistDone is React state that triggers re-render on every toggle. Council was wrong about this being a bug.' },
          { file: 'src/components/plus/InstallerPortal.tsx', line: 833, status: 'verified', notes: 'Second instance also correct — same pattern, fresh computation each render.' },
        ],
        scoreImpact: 0,
      },
      {
        id: 'qa-fund-gate',
        title: 'Fund release skips ops verification gate',
        councilClaim: 'BUG: Financier can release funds without ops verification.',
        realStatus: 'fixed',
        evidence: [
          { file: 'src/contexts/SupabaseProjectStore.tsx', line: 437, status: 'verified', notes: 'approveMilestone sets fundStatus to "pending" (not released). Fund flow: installer_submitted → ops approves (sets pending) → financier can only approve/release after that. Direct release bypasses are removed.' },
          { file: 'src/components/plus/FinancierPortal.tsx', status: 'verified', notes: 'Financier portal checks fundStatus before showing approve/release buttons. Locked milestones show "Awaiting Ops approval".' },
        ],
        fixedInCommit: 'Fund gate enforcement',
        scoreImpact: 6,
      },
      {
        id: 'qa-empty-convert',
        title: 'Empty sell projects can be converted to sale',
        councilClaim: 'BUG: No validation before conversion.',
        realStatus: 'fixed',
        evidence: [
          { file: 'src/components/sales/SellProjectCard.tsx', line: 175, snippet: "const hasRequiredData = !!(project.firstName?.trim() && project.lastName?.trim())", status: 'verified', notes: 'canConvert requires hasRequiredData AND auroraSynced. Button is conditionally rendered only when canConvert is true.' },
        ],
        fixedInCommit: 'Sell validation gate',
        scoreImpact: 4,
      },
      {
        id: 'qa-notifications-session',
        title: 'Cascade notifications only show in current session',
        councilClaim: 'Toast notifications disappear on refresh — need persistent storage.',
        realStatus: 'partial',
        evidence: [
          { file: 'src/lib/notificationCascade.ts', status: 'verified', notes: 'cascadeNotification() writes to Supabase notifications table — persistent. But notification READING is not wired into the UI — no notification bell, no unread counter, no notification panel.' },
        ],
        remainingWork: 'Build NotificationBell component that reads from notifications table, shows unread count, marks as read on click. ~2h.',
        scoreImpact: -4,
      },
    ],
  },
  {
    agentId: 'operations',
    currentScore: 82,
    scoreBreakdown: {
      'SOP Compliance': 88,
      'State Machine': 85,
      'Audit Trail': 75,
      'Reporting': 80,
      'Notifications': 68,
    },
    findings: [
      {
        id: 'ops-state-machine',
        title: 'Build state machine for project lifecycle',
        councilClaim: 'Projects need formal state machine with guarded transitions.',
        realStatus: 'fixed',
        evidence: [
          { file: 'src/lib/projectStateMachine.ts', status: 'verified', notes: '7 states: lead → qualified → qc_review → active → completed → archived → rejected. canTransition() with guard checks, inferState() auto-detection from project data, STATE_META with labels/colors/icons, HAPPY_PATH ordering.' },
          { file: 'src/components/ProjectLifecycleBar.tsx', status: 'verified', notes: 'Visual lifecycle bar component with animated glow nodes, checkmarks for past states, pulse for current.' },
        ],
        fixedInCommit: 'State machine + lifecycle bar',
        scoreImpact: 8,
      },
      {
        id: 'ops-audit-trail',
        title: 'Every action needs timestamped audit log',
        councilClaim: 'Need immutable audit trail for compliance.',
        realStatus: 'partial',
        evidence: [
          { file: 'src/lib/auditLog.ts', status: 'verified', notes: 'Module complete: 30+ AuditAction types, logAuditEvent() fire-and-forget to project_activity_log table, getAuditLog() fetcher.' },
          { file: 'src/contexts/SupabaseProjectStore.tsx', status: 'verified', notes: 'logAuditEvent() wired into: acceptDeal, submitMilestoneForQC, approveMilestone, approveFundRelease, releaseFund, addSellProject, markSellProjectClean, markSellProjectDirty — 8 key mutations.' },
        ],
        remainingWork: 'Build admin Audit Log Viewer UI component. Currently logs are written but there is no UI to browse them.',
        scoreImpact: 4,
      },
      {
        id: 'ops-executive-kpi',
        title: 'Executive dashboard with real-time KPIs',
        councilClaim: 'CEO/VP users need pipeline value, deal stages, milestone times, etc.',
        realStatus: 'fixed',
        evidence: [
          { file: 'src/components/ops/ExecutiveDashboard.tsx', status: 'verified', notes: 'Full dashboard: pipeline value, active deals, total leads, QC pass rate, avg milestone time, funds released/pending, open tickets, deal stage funnel bar chart.' },
          { file: 'src/pages/Dashboard.tsx', status: 'verified', notes: 'Executive tab wired into Dashboard, accessible for ops roles.' },
          { file: 'src/components/AppHeader.tsx', status: 'verified', notes: 'Executive tab added to ops navigation.' },
        ],
        fixedInCommit: 'Executive KPI dashboard',
        scoreImpact: 5,
      },
      {
        id: 'ops-notification-routing',
        title: 'Role-based notification routing',
        councilClaim: 'Auto-notify relevant parties on milestone/fund actions.',
        realStatus: 'partial',
        evidence: [
          { file: 'src/lib/notificationCascade.ts', status: 'verified', notes: 'Full cascade system: 15 notification types, routing by role (SR → Ops → Installer → Financier), writes to Supabase notifications table.' },
          { file: 'src/components/ops/QCReview.tsx', status: 'verified', notes: 'cascadeQCApproved and cascadeQCRejected called on QC actions — notifies SR, Installer, Financier.' },
        ],
        remainingWork: 'Wire cascade calls into more SupabaseProjectStore actions (milestone approval, fund release). Build notification bell UI.',
        scoreImpact: -2,
      },
    ],
  },
  {
    agentId: 'strategy',
    currentScore: 79,
    scoreBreakdown: {
      'Market Position': 82,
      'Social Proof': 78,
      'Onboarding': 60,
      'Pricing Model': 55,
      'Growth Features': 72,
    },
    findings: [
      {
        id: 'strat-risk-mitigation',
        title: 'Emphasize risk mitigation as core differentiator',
        councilClaim: 'Landing page should lead with risk reduction, not generic CRM messaging.',
        realStatus: 'fixed',
        evidence: [
          { file: 'src/pages/LandingPage.tsx', status: 'verified', notes: 'Hero section headline: "Risk-Mitigated Solar Operations" with sub-copy about milestone-gated escrow. Features section emphasizes compliance enforcement, automated QC gates, fund protection.' },
        ],
        fixedInCommit: 'Landing page copy update',
        scoreImpact: 4,
      },
      {
        id: 'strat-social-proof',
        title: 'Add social proof section with metrics',
        councilClaim: 'Landing page needs "X projects processed, $Y funds released" etc.',
        realStatus: 'fixed',
        evidence: [
          { file: 'src/pages/LandingPage.tsx', status: 'verified', notes: 'Social proof bar with animated counters: projects processed, funds secured, QC pass rate, installer partners. Uses CountUp-style animation on scroll.' },
        ],
        fixedInCommit: 'Social proof metrics',
        scoreImpact: 3,
      },
      {
        id: 'strat-onboarding',
        title: 'Add customer onboarding wizard',
        councilClaim: 'New orgs need guided setup: profile → roles → SOP → first project.',
        realStatus: 'open',
        evidence: [
          { file: 'src/', status: 'missing', notes: 'No onboarding wizard exists. New users land on Dashboard with no guidance. Big build: 6+ steps, organization profile, role assignment, SOP customization, walkthrough.' },
        ],
        remainingWork: 'Build OnboardingWizard component — multi-step flow. ~6h.',
        scoreImpact: -6,
      },
      {
        id: 'strat-usage-pricing',
        title: 'Build usage-based pricing into the platform',
        councilClaim: 'Track projects/users/API calls for pricing models.',
        realStatus: 'open',
        evidence: [
          { file: 'src/', status: 'missing', notes: 'No usage tracking or metrics collection. Would need: usage_events table, event logging middleware, admin usage dashboard.' },
        ],
        remainingWork: 'Design usage schema, add event logging, build admin view. ~4h.',
        scoreImpact: -4,
      },
    ],
  },
];

/** Get analysis for a specific agent */
export function getAgentAnalysis(agentId: string): AgentCodeAnalysis | undefined {
  return CODE_ANALYSIS.find(a => a.agentId === agentId);
}

/** Get all findings across all agents */
export function getAllFindings(): FindingAnalysis[] {
  return CODE_ANALYSIS.flatMap(a => a.findings);
}

/** Get overall council score */
export function getOverallScore(): number {
  const scores = CODE_ANALYSIS.map(a => a.currentScore);
  return Math.round(scores.reduce((s, v) => s + v, 0) / scores.length);
}

/** Search findings by keyword (for directive responses) */
export function searchFindings(query: string): FindingAnalysis[] {
  const lower = query.toLowerCase();
  return getAllFindings().filter(f =>
    f.title.toLowerCase().includes(lower) ||
    f.councilClaim.toLowerCase().includes(lower) ||
    f.evidence.some(e => e.notes?.toLowerCase().includes(lower)) ||
    f.remainingWork?.toLowerCase().includes(lower)
  );
}

/** Get summary stats */
export function getManifestStats() {
  const all = getAllFindings();
  return {
    total: all.length,
    fixed: all.filter(f => f.realStatus === 'fixed').length,
    partial: all.filter(f => f.realStatus === 'partial').length,
    open: all.filter(f => f.realStatus === 'open').length,
    councilWrong: all.filter(f => f.realStatus === 'council_wrong').length,
  };
}
