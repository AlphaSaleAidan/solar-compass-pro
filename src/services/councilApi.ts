/**
 * Council API Service — LLM Council Backend for Alpha Sale Pro
 *
 * Manages AI council agents that review the platform from different
 * role perspectives (Design, Engineering, QA, Operations, Strategy).
 * Each agent can run reviews, generate recommendations, and respond
 * to directives from the CEO/CTO.
 *
 * Architecture:
 * - CouncilService: singleton managing all agents + session state
 * - AgentRunner: simulates LLM-powered agent review sessions
 * - DirectiveEngine: processes CEO directives into agent tasks
 * - ConsensusBuilder: synthesizes multi-agent recommendations
 *
 * Future: wire to OpenRouter/Supabase Edge Functions for real LLM calls
 */

import { getAgentAnalysis, searchFindings, getOverallScore, getManifestStats } from '@/lib/councilManifest';

// ─── Types ──────────────────────────────────────────────────────────

export type AgentRole = 'design' | 'engineering' | 'qa' | 'operations' | 'strategy';
export type Priority = 'critical' | 'high' | 'medium' | 'low';
export type ReviewStatus = 'pending' | 'in_progress' | 'completed' | 'deferred' | 'rejected';
export type AgentStatus = 'active' | 'idle' | 'reviewing' | 'paused';
export type DirectiveStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface Recommendation {
  id: string;
  agentId: AgentRole;
  area: string;
  title: string;
  description: string;
  priority: Priority;
  status: ReviewStatus;
  portal: string;
  effort: string;
  createdAt: string;
  updatedAt: string;
  implementationNotes?: string;
  linkedIssues?: string[];
  votes: { agree: AgentRole[]; disagree: AgentRole[]; abstain: AgentRole[] };
}

export interface ReviewSession {
  id: string;
  agentId: AgentRole;
  startedAt: string;
  completedAt?: string;
  portal: string;
  findings: Recommendation[];
  summary: string;
  score: number; // 0-100
  status: 'running' | 'completed' | 'failed';
}

export interface Directive {
  id: string;
  from: string; // CEO, CTO, etc
  text: string;
  priority: Priority;
  status: DirectiveStatus;
  createdAt: string;
  assignedAgents: AgentRole[];
  responses: DirectiveResponse[];
}

export interface DirectiveResponse {
  agentId: AgentRole;
  text: string;
  recommendations: string[];
  timestamp: string;
  confidence: number; // 0-1
}

export interface CouncilAgent {
  id: AgentRole;
  name: string;
  role: string;
  description: string;
  model: string;
  status: AgentStatus;
  lastReview: string;
  reviewScore: number;
  reviewHistory: ReviewSession[];
  recommendations: Recommendation[];
  systemPrompt: string;
  specialties: string[];
  avatar: string; // Short label or initials
}

export interface ConsensusReport {
  id: string;
  timestamp: string;
  topic: string;
  agents: AgentRole[];
  summary: string;
  agreements: string[];
  disagreements: string[];
  prioritizedActions: { action: string; priority: Priority; agents: AgentRole[] }[];
  overallScore: number;
}

export interface CouncilState {
  agents: CouncilAgent[];
  directives: Directive[];
  consensusReports: ConsensusReport[];
  activeReviews: ReviewSession[];
  globalConfig: {
    autoReview: boolean;
    reviewIntervalHours: number;
    consensusThreshold: number; // 0-1, how many agents must agree
    maxConcurrentReviews: number;
  };
}

// ─── Agent Definitions ──────────────────────────────────────────────

const AGENT_DEFINITIONS: Omit<CouncilAgent, 'reviewHistory' | 'recommendations'>[] = [
  {
    id: 'design',
    name: 'Aurora',
    role: 'Design Director',
    description: 'Reviews UI/UX, visual consistency, animations, and brand identity across all portals. Focuses on making every interaction feel premium and fluid.',
    model: 'Claude Sonnet 4',
    status: 'active',
    lastReview: new Date().toISOString(),
    reviewScore: 86,
    systemPrompt: `You are Aurora, the Design Director for Alpha Sale Pro. You obsess over visual polish, animation fluidity, and "sex appeal" of the platform. You review every pixel, every transition, every hover state. You think in terms of cinematic experience — scroll reveals, glass morphism depth, typography hierarchy, and color harmony. You push for the platform to feel like a premium SaaS product, not a basic tool.`,
    specialties: ['UI/UX', 'Animations', 'Typography', 'Color Theory', 'Responsive Design', '3D Graphics'],
    avatar: 'DX',
  },
  {
    id: 'engineering',
    name: 'Forge',
    role: 'Engineering Lead',
    description: 'Reviews code architecture, performance, bundle optimization, and technical debt. Ensures the codebase is maintainable and scalable.',
    model: 'GPT-5',
    status: 'active',
    lastReview: new Date().toISOString(),
    reviewScore: 78,
    systemPrompt: `You are Forge, the Engineering Lead for Alpha Sale Pro. You focus on code quality, performance budgets, architecture decisions, and developer experience. You think about bundle size, load times, code splitting, state management patterns, and API design. You push for clean, typed, tested code that scales.`,
    specialties: ['Performance', 'Architecture', 'State Management', 'TypeScript', 'Build Optimization', 'API Design'],
    avatar: 'EN',
  },
  {
    id: 'qa',
    name: 'Sentinel',
    role: 'QA Manager',
    description: 'Tests all portal flows, catches bugs, validates SOP compliance, and documents edge cases. The last line of defense before deployment.',
    model: 'Gemini 3 Pro',
    status: 'active',
    lastReview: new Date().toISOString(),
    reviewScore: 72,
    systemPrompt: `You are Sentinel, the QA Manager for Alpha Sale Pro. You ruthlessly test every user flow, every edge case, every error state. You think about what happens when data is missing, when users click things in the wrong order, when network fails. You validate against the Master SOP v2.0 document and ensure every workflow gate is enforced.`,
    specialties: ['Testing', 'SOP Compliance', 'Edge Cases', 'Error Handling', 'User Flows', 'Accessibility'],
    avatar: 'QA',
  },
  {
    id: 'operations',
    name: 'Nexus',
    role: 'Operations Director',
    description: 'Reviews business logic, workflow efficiency, SOP integration, and operational gaps. Ensures the platform matches real-world solar operations.',
    model: 'Grok 4',
    status: 'active',
    lastReview: new Date().toISOString(),
    reviewScore: 71,
    systemPrompt: `You are Nexus, the Operations Director for Alpha Sale Pro. You know the solar sales business inside and out. You review whether the platform correctly models real-world operations: deal flow, milestone progression, fund release chains, QC gates, installer coordination, and financier approval workflows. You push for operational excellence and SOP compliance.`,
    specialties: ['Business Logic', 'SOP Enforcement', 'Workflow Design', 'KPIs', 'Reporting', 'Compliance'],
    avatar: 'OP',
  },
  {
    id: 'strategy',
    name: 'Oracle',
    role: 'Strategy Advisor',
    description: 'Analyzes market positioning, product-market fit, competitive landscape, and growth opportunities. Thinks long-term about platform evolution.',
    model: 'Claude Opus 4',
    status: 'active',
    lastReview: new Date().toISOString(),
    reviewScore: 85,
    systemPrompt: `You are Oracle, the Strategy Advisor for Alpha Sale Pro. You think about the big picture: market positioning, competitive advantages, product-market fit, pricing strategy, and growth vectors. You analyze the platform from the lens of investors, customers, and market trends. You push for features that create defensible moats and accelerate growth.`,
    specialties: ['Market Analysis', 'Product Strategy', 'Competitive Intel', 'Growth', 'Pricing', 'Investor Relations'],
    avatar: 'ST',
  },
];

// ─── Review Templates (simulate LLM-generated reviews) ──────────────

const REVIEW_TEMPLATES: Record<AgentRole, Record<string, Recommendation[]>> = {
  design: {
    'Sales Portal': [
      { id: '', agentId: 'design', area: 'Deal Cards', title: 'Pipeline card hover states lack depth', description: 'RESOLVED: Cards now have layered box-shadow transitions and scale effects on hover.', priority: 'medium', status: 'completed', portal: 'Sales', effort: '1h', createdAt: '', updatedAt: '', votes: { agree: ['engineering'], disagree: [], abstain: ['qa'] } },
      { id: '', agentId: 'design', area: 'Aurora Sync', title: 'Aurora import needs loading choreography', description: 'When syncing Aurora data, show a cinematic loading sequence: satellite dish animation → data stream particles → success burst. The current spinner is generic. This is a key differentiator moment.', priority: 'low', status: 'pending', portal: 'Sales', effort: '2h', createdAt: '', updatedAt: '', votes: { agree: ['strategy'], disagree: ['engineering'], abstain: [] } },
    ],
    'Installer Portal': [
      { id: '', agentId: 'design', area: 'Milestone Timeline', title: 'M1-M7 timeline needs visual progression', description: 'The milestone list is functional but not visual. Add a vertical timeline with glowing progress nodes, animated connection lines, and completion celebrations. Each milestone should feel like an achievement.', priority: 'high', status: 'pending', portal: 'Installer', effort: '3h', createdAt: '', updatedAt: '', votes: { agree: ['operations', 'strategy'], disagree: [], abstain: [] } },
      { id: '', agentId: 'design', area: 'Checklist Items', title: 'Upload and date entry fields need polish', description: 'File upload buttons look like default HTML. Need drag-drop zones with dashed borders, file type icons, and upload progress animations. Date pickers should match the dark theme.', priority: 'medium', status: 'pending', portal: 'Installer', effort: '2h', createdAt: '', updatedAt: '', votes: { agree: ['qa'], disagree: [], abstain: [] } },
    ],
    'Financier Portal': [
      { id: '', agentId: 'design', area: 'Fund Release', title: 'Fund release needs celebration animation', description: 'Releasing funds is a major action. Add a satisfying confirmation: vault door animation → green particle burst → amount counter ticking up. Make it feel like money moving.', priority: 'medium', status: 'pending', portal: 'Financier', effort: '2h', createdAt: '', updatedAt: '', votes: { agree: ['strategy'], disagree: ['engineering'], abstain: [] } },
    ],
    'Landing': [
      { id: '', agentId: 'design', area: 'Scroll Experience', title: 'Section reveals need parallax depth layers', description: 'Each content section should have 3 depth layers: background (slow), content (normal), accent elements (fast). Creates cinematic depth as user scrolls. The 3D sphere should react to scroll position.', priority: 'high', status: 'in_progress', portal: 'Landing', effort: '3h', createdAt: '', updatedAt: '', votes: { agree: ['strategy', 'engineering'], disagree: [], abstain: [] } },
    ],
    'Backend Ops': [
      { id: '', agentId: 'design', area: 'QC Review', title: 'QC approval flow needs visual weight', description: 'The approve/reject buttons for QC review should be more prominent with distinct visual states. Green glow for approve, red pulse for reject. Add a brief review summary card before the action.', priority: 'medium', status: 'pending', portal: 'Backend Ops', effort: '1h', createdAt: '', updatedAt: '', votes: { agree: ['qa', 'operations'], disagree: [], abstain: [] } },
    ],
  },
  engineering: {
    'Performance': [
      { id: '', agentId: 'engineering', area: 'Bundle Size', title: 'Lazy-load Three.js and R3F', description: 'Three.js is code-split via CinematicBackground chunk. Portal users skip the landing 3D scene.', priority: 'medium', status: 'completed', portal: 'All', effort: '2h', createdAt: '', updatedAt: '', votes: { agree: ['qa'], disagree: ['design'], abstain: [] } },
      { id: '', agentId: 'engineering', area: 'State', title: 'Replace prop drilling with Zustand slices', description: 'The ProjectStore context re-renders the entire tree on any change. Migrate to Zustand with separate slices for projects, milestones, financier, and messages. Selective subscriptions prevent unnecessary re-renders.', priority: 'high', status: 'pending', portal: 'All', effort: '4h', createdAt: '', updatedAt: '', votes: { agree: ['operations'], disagree: [], abstain: ['design'] } },
    ],
    'Architecture': [
      { id: '', agentId: 'engineering', area: 'Auth', title: 'Implement RBAC with Supabase RLS', description: 'Production auth needs Row Level Security policies in Supabase. Master admin sees everything, managers see their division, reps see their deals only. Define RLS policies for projects, milestones, funds.', priority: 'high', status: 'pending', portal: 'Auth', effort: '4h', createdAt: '', updatedAt: '', votes: { agree: ['qa', 'operations'], disagree: [], abstain: [] } },
      { id: '', agentId: 'engineering', area: 'Real-time', title: 'Add Supabase Realtime for cross-portal sync', description: 'Use Supabase Realtime channels to broadcast project updates across portals. When an installer completes a milestone, ops and financier see it instantly without refresh.', priority: 'medium', status: 'pending', portal: 'All', effort: '3h', createdAt: '', updatedAt: '', votes: { agree: ['operations', 'qa'], disagree: [], abstain: [] } },
    ],
    'Sales Portal': [
      { id: '', agentId: 'engineering', area: 'Form Validation', title: 'Add Zod schema validation to sell sheets', description: 'The sell project form has no runtime validation. Add Zod schemas for customer data, system specs, and financials. Show inline errors before submission.', priority: 'medium', status: 'pending', portal: 'Sales', effort: '2h', createdAt: '', updatedAt: '', votes: { agree: ['qa'], disagree: [], abstain: [] } },
    ],
  },
  qa: {
    'Installer Portal': [
      { id: '', agentId: 'qa', area: 'Milestone Flow', title: 'Milestones can be completed out of order', description: 'RESOLVED: Sequential milestone guard implemented — M(n) requires M(n-1) completion.', priority: 'critical', status: 'completed', portal: 'Installer', effort: '3h', createdAt: '', updatedAt: '', votes: { agree: ['operations', 'engineering'], disagree: [], abstain: [] } },
      { id: '', agentId: 'qa', area: 'QC Submit', title: 'Submit for QC button appears without all items done', description: 'EDGE CASE: If items are toggled on then off, the submit button state can get out of sync. Need a fresh recount on every render, not a cached value.', priority: 'high', status: 'pending', portal: 'Installer', effort: '1h', createdAt: '', updatedAt: '', votes: { agree: ['engineering'], disagree: [], abstain: [] } },
    ],
    'Financier Portal': [
      { id: '', agentId: 'qa', area: 'Fund Chain', title: 'Fund release skips ops verification gate', description: 'RESOLVED: Ops verification gate enforced — fund release requires milestone verification first.', priority: 'critical', status: 'completed', portal: 'Financier', effort: '3h', createdAt: '', updatedAt: '', votes: { agree: ['operations', 'engineering'], disagree: [], abstain: [] } },
    ],
    'Sales Portal': [
      { id: '', agentId: 'qa', area: 'Deal Flow', title: 'Empty sell projects can be converted to sale', description: 'RESOLVED: Validation gate added — sell project requires customer name, system size, and price before conversion.', priority: 'high', status: 'completed', portal: 'Sales', effort: '1h', createdAt: '', updatedAt: '', votes: { agree: ['operations'], disagree: [], abstain: [] } },
    ],
    'Backend Ops': [
      { id: '', agentId: 'qa', area: 'Notification', title: 'Cascade notifications only show in current session', description: 'Toast notifications for milestone approvals and QC decisions only appear if the user is currently on the page. Need persistent notification storage for cross-session visibility.', priority: 'medium', status: 'in_progress', portal: 'All', effort: '2h', createdAt: '', updatedAt: '', votes: { agree: ['engineering', 'operations'], disagree: [], abstain: [] } },
    ],
  },
  operations: {
    'SOP Compliance': [
      { id: '', agentId: 'operations', area: 'Workflow Engine', title: 'Build state machine for project lifecycle', description: 'RESOLVED: State machine implemented with typed transitions and guard checks. Pipeline stages enforce sequential flow.', priority: 'critical', status: 'completed', portal: 'All', effort: '6h', createdAt: '', updatedAt: '', votes: { agree: ['qa', 'engineering'], disagree: [], abstain: ['design'] } },
      { id: '', agentId: 'operations', area: 'Audit Trail', title: 'Every action needs timestamped audit log', description: 'For compliance: log who did what, when, on which project. Milestone approvals, fund releases, document uploads, QC decisions — all need an immutable audit trail viewable by admin.', priority: 'high', status: 'pending', portal: 'All', effort: '3h', createdAt: '', updatedAt: '', votes: { agree: ['qa', 'strategy'], disagree: [], abstain: [] } },
    ],
    'Reporting': [
      { id: '', agentId: 'operations', area: 'KPIs', title: 'Executive dashboard with real-time KPIs', description: 'RESOLVED: Executive tab live with pipeline metrics, milestone tracking, and performance indicators.', priority: 'high', status: 'completed', portal: 'Admin', effort: '4h', createdAt: '', updatedAt: '', votes: { agree: ['strategy', 'design'], disagree: [], abstain: [] } },
    ],
    'Communication': [
      { id: '', agentId: 'operations', area: 'Messaging', title: 'Role-based notification routing', description: 'When ops approves a milestone, auto-notify the assigned installer and financier. When financier releases funds, notify the sales rep and ops. Build a notification routing table based on project assignments.', priority: 'medium', status: 'pending', portal: 'All', effort: '3h', createdAt: '', updatedAt: '', votes: { agree: ['qa', 'engineering'], disagree: [], abstain: [] } },
    ],
  },
  strategy: {
    'Product': [
      { id: '', agentId: 'strategy', area: 'Market Position', title: 'Emphasize risk mitigation as core differentiator', description: 'Solar sales platforms compete on CRM features. ASP\'s moat is risk mitigation through operational enforcement. The landing page should lead with "risk reduction" language, not generic "sales platform" messaging. This has been partially addressed.', priority: 'medium', status: 'completed', portal: 'Landing', effort: '2h', createdAt: '', updatedAt: '', votes: { agree: ['design', 'operations'], disagree: [], abstain: [] } },
      { id: '', agentId: 'strategy', area: 'Growth', title: 'Add customer onboarding wizard', description: 'New organizations need a guided setup: company profile → team roles → SOP customization → first project walkthrough. Reduces time-to-value and increases retention.', priority: 'medium', status: 'pending', portal: 'Admin', effort: '6h', createdAt: '', updatedAt: '', votes: { agree: ['design', 'operations'], disagree: [], abstain: [] } },
    ],
    'Competitive': [
      { id: '', agentId: 'strategy', area: 'Pricing', title: 'Build usage-based pricing into the platform', description: 'Track projects processed, users active, and API calls. Display usage metrics in admin. This data supports per-seat or per-project pricing models for enterprise customers.', priority: 'low', status: 'pending', portal: 'Admin', effort: '4h', createdAt: '', updatedAt: '', votes: { agree: ['engineering'], disagree: [], abstain: ['operations'] } },
    ],
    'Landing': [
      { id: '', agentId: 'strategy', area: 'Conversion', title: 'Add social proof section with metrics', description: 'Landing page needs: "X projects processed, $Y in funds released, Z% reduction in QC failures." Even with demo data, showing these metrics builds credibility and demonstrates platform capability.', priority: 'medium', status: 'completed', portal: 'Landing', effort: '2h', createdAt: '', updatedAt: '', votes: { agree: ['design', 'operations'], disagree: [], abstain: [] } },
    ],
  },
};

// ─── Council Service ────────────────────────────────────────────────

let _stateVersion = 0;
const _listeners = new Set<() => void>();

function notify() {
  _stateVersion++;
  _listeners.forEach(fn => fn());
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function initializeAgents(): CouncilAgent[] {
  return AGENT_DEFINITIONS.map(def => {
    const allRecs: Recommendation[] = [];
    const templates = REVIEW_TEMPLATES[def.id] || {};
    const agentManifest = getAgentAnalysis(def.id);

    Object.values(templates).forEach(recs => {
      recs.forEach(rec => {
        const now = new Date().toISOString();
        // Match recommendation to manifest finding by title similarity
        const finding = agentManifest?.findings.find(f =>
          f.title.toLowerCase().includes(rec.title.toLowerCase().slice(0, 20)) ||
          rec.title.toLowerCase().includes(f.title.toLowerCase().slice(0, 20))
        );
        // Derive status from manifest
        let status: ReviewStatus = rec.status;
        if (finding) {
          if (finding.realStatus === 'fixed') status = 'completed';
          else if (finding.realStatus === 'partial') status = 'in_progress';
          else if (finding.realStatus === 'council_wrong') status = 'completed'; // Not a bug = resolved
          else status = 'pending';
        }
        allRecs.push({
          ...rec,
          id: generateId(),
          status,
          createdAt: now,
          updatedAt: now,
        });
      });
    });

    // Use manifest score if available
    const manifestScore = agentManifest?.currentScore ?? 70;

    return {
      ...def,
      reviewScore: manifestScore,
      reviewHistory: [],
      recommendations: allRecs,
    };
  });
}

// Singleton state
let councilState: CouncilState = {
  agents: initializeAgents(),
  directives: [],
  consensusReports: [],
  activeReviews: [],
  globalConfig: {
    autoReview: false,
    reviewIntervalHours: 24,
    consensusThreshold: 0.6,
    maxConcurrentReviews: 2,
  },
};

// ─── Public API ─────────────────────────────────────────────────────

export const CouncilAPI = {
  // Subscribe to state changes
  subscribe(listener: () => void) {
    _listeners.add(listener);
    return () => _listeners.delete(listener);
  },

  getVersion() {
    return _stateVersion;
  },

  // Get full state
  getState(): CouncilState {
    return councilState;
  },

  // Get single agent
  getAgent(id: AgentRole): CouncilAgent | undefined {
    return councilState.agents.find(a => a.id === id);
  },

  // Get all recommendations across all agents
  getAllRecommendations(): Recommendation[] {
    return councilState.agents.flatMap(a => a.recommendations);
  },

  // Get recommendations filtered
  getRecommendations(filter?: { priority?: Priority; status?: ReviewStatus; portal?: string; agentId?: AgentRole }): Recommendation[] {
    let recs = this.getAllRecommendations();
    if (filter?.priority) recs = recs.filter(r => r.priority === filter.priority);
    if (filter?.status) recs = recs.filter(r => r.status === filter.status);
    if (filter?.portal) recs = recs.filter(r => r.portal === filter.portal);
    if (filter?.agentId) recs = recs.filter(r => r.agentId === filter.agentId);
    return recs;
  },

  // Update recommendation status
  updateRecommendation(recId: string, updates: Partial<Recommendation>) {
    councilState.agents.forEach(agent => {
      agent.recommendations = agent.recommendations.map(r =>
        r.id === recId ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r
      );
    });
    notify();
  },

  // Refresh all recommendations — runs diagnostic scan + generates fresh recs
  async refreshRecommendations(): Promise<void> {
    // Phase 1: Mark all agents as reviewing
    for (const agent of councilState.agents) {
      agent.status = 'reviewing';
    }
    notify();

    await new Promise(r => setTimeout(r, 600));

    // Phase 2: For each agent, remove resolved/completed recs and generate new ones
    const newRecTemplates: Record<string, string[]> = {
      design: [
        'Add micro-interaction feedback on all button clicks',
        'Implement skeleton loading screens for every data section',
        'Audit color contrast ratios across dark theme — fix WCAG violations',
        'Add scroll-triggered reveal animations to portal dashboard cards',
        'Design empty state illustrations for zero-data views',
        'Polish modal open/close transitions with spring physics',
        'Add subtle parallax effect to portal section headers',
        'Improve card shadow depth for better visual hierarchy',
      ],
      engineering: [
        'Implement React.lazy code splitting for each portal route',
        'Add React Query or SWR for data fetching with stale-while-revalidate',
        'Set up Supabase Realtime channels for project status updates',
        'Move fund release validation to Supabase edge function',
        'Add error boundary with user-friendly fallback for every portal',
        'Implement Zustand store slices to replace prop drilling',
        'Add service worker for offline-first PWA capabilities',
        'Set up database indexes for commonly filtered columns',
      ],
      qa: [
        'Test all portal flows with empty database — verify graceful empty states',
        'Verify milestone completion blocks out-of-order attempts end-to-end',
        'Test fund release with concurrent clicks — confirm idempotency',
        'Audit all form inputs for XSS and injection vulnerabilities',
        'Test role switching — verify data scoping changes per role',
        'Verify notification delivery across all portal state changes',
        'Test file upload with oversized files — check error handling',
        'Run accessibility audit with screen reader on all portals',
      ],
      operations: [
        'Build admin-facing audit log viewer for compliance officers',
        'Add SLA timers to QC review queue — auto-escalate overdue items',
        'Implement dual-approval workflow for fund releases over $10K',
        'Create SOP compliance dashboard with adherence metrics per installer',
        'Add automated monthly escrow reconciliation check',
        'Build notification fallback chain: in-app → email → SMS',
        'Create installer performance scorecard based on milestone velocity',
        'Add project handoff checklist enforcement between portals',
      ],
      strategy: [
        'Build demo mode for investor/prospect walkthroughs',
        'Design onboarding wizard for first-time org setup',
        'Add time-to-PTO tracking as a key platform KPI',
        'Build ROI calculator comparing ASP vs manual solar operations',
        'Create usage analytics dashboard for pricing model decisions',
        'Design installer NPS survey triggered after M7 completion',
        'Add competitive feature comparison matrix to marketing site',
        'Build referral tracking system for installer network growth',
      ],
    };

    for (const agent of councilState.agents) {
      // Remove completed items (already resolved)
      const openRecs = agent.recommendations.filter(r => r.status !== 'completed');
      
      // Generate fresh recs from the bank
      const bank = newRecTemplates[agent.id] || [];
      const existingTitles = new Set(openRecs.map(r => r.title.toLowerCase()));
      const seed = _directiveCallCount + Date.now();
      const freshRecs = pickUnique(bank.filter(t => !existingTitles.has(t.toLowerCase())), seed, 3);
      
      const now = new Date().toISOString();
      const generatedRecs: Recommendation[] = freshRecs.map((title, i) => ({
        id: generateId(),
        agentId: agent.id,
        title,
        description: `Identified during platform diagnostic scan at ${new Date().toLocaleTimeString()}`,
        priority: (i === 0 ? 'high' : 'medium') as Priority,
        status: 'pending' as ReviewStatus,
        portal: 'All',
        effort: `${1 + i}h`,
        createdAt: now,
        updatedAt: now,
        votes: { agree: [], disagree: [], abstain: [] },
      }));

      agent.recommendations = [...generatedRecs, ...openRecs];
      agent.status = 'active';
      agent.lastReview = now;
      notify();
      await new Promise(r => setTimeout(r, 200));
    }

    // Phase 3: Run the platform scan and add its results too
    await this.scanPlatform();
  },

  // Run a review session for an agent on a portal
  async runReview(agentId: AgentRole, portal: string): Promise<ReviewSession> {
    const agent = councilState.agents.find(a => a.id === agentId);
    if (!agent) throw new Error(`Agent ${agentId} not found`);

    // Set agent to reviewing
    agent.status = 'reviewing';
    notify();

    const session: ReviewSession = {
      id: generateId(),
      agentId,
      startedAt: new Date().toISOString(),
      portal,
      findings: [],
      summary: '',
      score: 0,
      status: 'running',
    };

    councilState.activeReviews.push(session);
    notify();

    // Simulate review process (2-4 seconds)
    await new Promise(r => setTimeout(r, 2000 + Math.random() * 2000));

    // Generate findings from templates
    const templates = REVIEW_TEMPLATES[agentId]?.[portal] || [];
    const findings = templates.map(t => ({
      ...t,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    // Use real score from manifest if available, otherwise derive from findings
    const manifestScore = getAgentAnalysis(agentId)?.currentScore;
    const score = manifestScore ?? Math.floor(60 + Math.random() * 30);

    session.findings = findings;
    session.score = score;
    session.summary = `${agent.name} completed review of ${portal}. Found ${findings.length} items: ${findings.filter(f => f.priority === 'critical').length} critical, ${findings.filter(f => f.priority === 'high').length} high priority. Score: ${score}/100.`;
    session.completedAt = new Date().toISOString();
    session.status = 'completed';

    // Update agent state
    agent.status = 'active';
    agent.lastReview = new Date().toISOString();
    agent.reviewScore = score;
    agent.reviewHistory.push(session);

    // Add new findings to agent's recommendations (avoid duplicates by title)
    const existingTitles = new Set(agent.recommendations.map(r => r.title));
    findings.forEach(f => {
      if (!existingTitles.has(f.title)) {
        agent.recommendations.push(f);
      }
    });

    // Remove from active
    councilState.activeReviews = councilState.activeReviews.filter(r => r.id !== session.id);
    notify();

    return session;
  },

  // Run full council review (all agents review all portals)
  async runFullReview(): Promise<ConsensusReport> {
    const portals = ['Sales Portal', 'Backend Ops', 'Installer Portal', 'Financier Portal', 'Landing'];
    const results: ReviewSession[] = [];

    for (const agent of councilState.agents) {
      for (const portal of portals) {
        if (REVIEW_TEMPLATES[agent.id]?.[portal]) {
          const session = await this.runReview(agent.id, portal);
          results.push(session);
        }
      }
    }

    return this.buildConsensus('Full Platform Review');
  },

  // Submit a CEO/CTO directive
  async submitDirective(text: string, from: string = 'CEO', priority: Priority = 'high'): Promise<Directive> {
    const directive: Directive = {
      id: generateId(),
      from,
      text,
      priority,
      status: 'processing',
      createdAt: new Date().toISOString(),
      assignedAgents: councilState.agents.map(a => a.id),
      responses: [],
    };

    councilState.directives.unshift(directive);
    notify();

    // Simulate each agent responding with streaming typewriter effect
    // Staggered start times to feel organic — agents "think" at different speeds
    for (const agent of councilState.agents) {
      // Vary delay to feel organic: 0.6-1.5s between agents
      await new Promise(r => setTimeout(r, 600 + Math.random() * 900));

      // Set agent status to 'reviewing' during thinking
      agent.status = 'reviewing';
      notify();

      // "Thinking" pause — varies per agent personality
      const thinkTime = agent.id === 'engineering' ? 500 + Math.random() * 300
        : agent.id === 'strategy' ? 400 + Math.random() * 600
        : 300 + Math.random() * 400;
      await new Promise(r => setTimeout(r, thinkTime));

      // Generate full response
      const response = generateDirectiveResponse(agent, text, directive.responses);
      
      // Stream the response word-by-word using a partial response
      const words = response.text.split(' ');
      const partialResponse = { ...response, text: '' };
      directive.responses.push(partialResponse);
      notify();

      // Stream words in small bursts (3-6 words at a time for speed)
      for (let i = 0; i < words.length;) {
        const burstSize = 3 + Math.floor(Math.random() * 4);
        const burst = words.slice(i, i + burstSize).join(' ');
        partialResponse.text += (i === 0 ? '' : ' ') + burst;
        i += burstSize;
        notify();
        // Tiny delay between bursts: 30-80ms (fast but visible)
        await new Promise(r => setTimeout(r, 30 + Math.random() * 50));
      }

      // Ensure final text matches
      partialResponse.text = response.text;
      partialResponse.recommendations = response.recommendations;

      // Add new recommendations from directive response to agent's rec list
      if (response.recommendations.length > 0) {
        const existingTitles = new Set(agent.recommendations.map(r => r.title.toLowerCase()));
        response.recommendations.forEach((recText, i) => {
          if (!existingTitles.has(recText.toLowerCase())) {
            agent.recommendations.unshift({
              id: generateId(),
              agentId: agent.id,
              title: recText,
              description: `Generated from directive: "${text.slice(0, 60)}..."`,
              priority: i === 0 ? 'high' : 'medium',
              portal: 'general',
              type: 'suggestion',
              status: 'pending',
              votes: { agree: [], disagree: [], abstain: [] },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          }
        });
      }

      // Set agent back to active
      agent.status = 'active';
      notify();
    }

    directive.status = 'completed';

    // Auto-generate a consensus synthesis for this directive
    const synthesis = this.buildDirectiveConsensus(directive);
    notify();

    return directive;
  },

  // Build consensus from a specific directive (synthesize all agent answers)
  buildDirectiveConsensus(directive: Directive): ConsensusReport {
    const responses = directive.responses;
    if (responses.length === 0) return this.buildConsensus(directive.text);

    // Find common themes across agent responses
    const allRecTexts = responses.flatMap(r => r.recommendations);
    const recFrequency: Record<string, AgentRole[]> = {};
    responses.forEach(r => {
      r.recommendations.forEach(rec => {
        const key = rec.toLowerCase().slice(0, 40);
        const existing = Object.keys(recFrequency).find(k => k.includes(key.slice(0, 20)) || key.includes(k.slice(0, 20)));
        const finalKey = existing || key;
        if (!recFrequency[finalKey]) recFrequency[finalKey] = [];
        if (!recFrequency[finalKey].includes(r.agentId)) recFrequency[finalKey].push(r.agentId);
      });
    });

    // High-confidence responses are agreements
    const highConfidence = responses.filter(r => r.confidence >= 0.85);
    const agreements = highConfidence.map(r => `${councilState.agents.find(a => a.id === r.agentId)?.name || r.agentId}: ${r.recommendations[0] || r.text.slice(0, 80)}`);

    // Low confidence or differing priorities are disagreements
    const lowConfidence = responses.filter(r => r.confidence < 0.7);
    const disagreements = lowConfidence.map(r => `${councilState.agents.find(a => a.id === r.agentId)?.name || r.agentId} is uncertain (${Math.round(r.confidence * 100)}%)`);

    // Synthesize a concise answer
    const avgConf = responses.reduce((s, r) => s + r.confidence, 0) / Math.max(responses.length, 1);
    const topRecs = [...new Set(allRecTexts)].slice(0, 5);

    // Build a coherent summary that actually answers the question
    const agentSummaries = responses.map(r => {
      const name = councilState.agents.find(a => a.id === r.agentId)?.name || r.agentId;
      const keyPoint = r.recommendations[0] || r.text.split('\n')[0].slice(0, 100);
      return `${name}: ${keyPoint}`;
    });

    const summary = `Directive: "${directive.text.slice(0, 100)}${directive.text.length > 100 ? '...' : ''}"\n\nCouncil consensus (${Math.round(avgConf * 100)}% average confidence):\n${agentSummaries.join('\n')}\n\nKey actions: ${topRecs.slice(0, 3).join(' | ') || 'No specific actions recommended.'}`;

    const prioritizedActions = topRecs.map((rec, i) => ({
      action: rec,
      priority: (i === 0 ? 'critical' : i < 3 ? 'high' : 'medium') as Priority,
      agents: responses.filter(r => r.recommendations.some(rx => rx === rec)).map(r => r.agentId),
    }));

    const report: ConsensusReport = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      topic: directive.text.slice(0, 120),
      agents: responses.map(r => r.agentId),
      summary,
      agreements,
      disagreements,
      prioritizedActions,
      overallScore: Math.round(avgConf * 100),
    };

    councilState.consensusReports.unshift(report);
    return report;
  },

  // Build consensus from all agent recommendations (full review)
  // Only shows OPEN items — resolved findings are excluded from priority actions
  buildConsensus(topic: string): ConsensusReport {
    const allRecs = this.getAllRecommendations();
    // Filter out completed/resolved items — only show what still needs work
    const openRecs = allRecs.filter(r => r.status !== 'completed');
    const criticalRecs = openRecs.filter(r => r.priority === 'critical');
    const highRecs = openRecs.filter(r => r.priority === 'high');
    const resolvedCount = allRecs.filter(r => r.status === 'completed').length;

    // Find agreements (recommendations that multiple agents' votes support)
    const agreements = openRecs
      .filter(r => r.votes.agree.length >= 2)
      .map(r => `${r.title} (${r.votes.agree.length + 1} agents agree)`);

    // Find disagreements
    const disagreements = openRecs
      .filter(r => r.votes.disagree.length >= 1)
      .map(r => `${r.title}: ${r.votes.disagree.join(', ')} disagree with ${r.agentId}`);

    const prioritizedActions = [
      ...criticalRecs.map(r => ({
        action: r.title,
        priority: 'critical' as Priority,
        agents: [r.agentId, ...r.votes.agree],
      })),
      ...highRecs.slice(0, 5).map(r => ({
        action: r.title,
        priority: 'high' as Priority,
        agents: [r.agentId, ...r.votes.agree],
      })),
    ];

    const avgScore = getOverallScore();
    const stats = getManifestStats();

    const report: ConsensusReport = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      topic,
      agents: councilState.agents.map(a => a.id),
      summary: `Platform score: ${avgScore}/100. ${resolvedCount} findings resolved, ${stats.partial} in progress, ${stats.open} still open. ${criticalRecs.length} critical and ${highRecs.length} high-priority open items remain.`,
      agreements,
      disagreements,
      prioritizedActions,
      overallScore: Math.round(avgScore),
    };

    councilState.consensusReports.unshift(report);
    notify();

    return report;
  },

  // Scan Platform — each agent "logs in" as their associated role and tests functions
  async scanPlatform(): Promise<ConsensusReport> {
    const roleScanResults: Record<string, { role: string; agent: string; checks: { name: string; status: 'pass' | 'warn' | 'fail'; detail: string }[] }> = {
      sales_rep: {
        role: 'Sales Rep', agent: 'strategy',
        checks: [
          { name: 'Pipeline view loads', status: 'pass', detail: 'All deal cards render with correct stage badges' },
          { name: 'Sell project form validation', status: 'warn', detail: 'Zod schemas defined but not wired to inline field validation yet' },
          { name: 'Project conversion to sale', status: 'pass', detail: 'Conversion flow checks required fields before allowing QC submission' },
          { name: 'Commission calculations', status: 'pass', detail: 'Commission tab renders with calculated values' },
          { name: 'Calendar integration', status: 'warn', detail: 'Calendar renders but no real event sync — uses mock data' },
          { name: 'Rankings board', status: 'pass', detail: 'Rankings display with correct ordering' },
        ],
      },
      backend_ops: {
        role: 'Backend Ops', agent: 'operations',
        checks: [
          { name: 'QC Review queue', status: 'pass', detail: 'Projects load correctly, approve/reject flows work with notes' },
          { name: 'State machine enforcement', status: 'pass', detail: 'Project lifecycle states enforce valid transitions — resolved in recent build' },
          { name: 'Audit trail logging', status: 'warn', detail: 'Actions are logged but no admin viewer UI for querying audit entries' },
          { name: 'Milestone verification', status: 'pass', detail: 'Ops can verify installer milestone completions before fund release' },
          { name: 'Communication hub', status: 'warn', detail: 'Messages send but do not persist across page refreshes (stored in component state)' },
          { name: 'Notification cascade', status: 'pass', detail: 'Cascade fires on state changes, toasts appear for relevant roles' },
        ],
      },
      installer: {
        role: 'Installer', agent: 'qa',
        checks: [
          { name: 'Accept project flow', status: 'pass', detail: 'Accept button renders before M1, confirmation dialog works' },
          { name: 'M1-M7 milestone progression', status: 'pass', detail: 'Sequential completion enforced — cannot skip milestones' },
          { name: 'Checklist item completion', status: 'pass', detail: 'Toggle items, upload files, enter dates all functional' },
          { name: 'File upload validation', status: 'warn', detail: 'Files upload to Supabase Storage but no size/type limit enforcement' },
          { name: 'SOW submission', status: 'pass', detail: 'Scope of Work renders and submits correctly' },
          { name: 'Project status visibility', status: 'pass', detail: 'Installer sees correct status badges and milestone progress' },
        ],
      },
      financier: {
        role: 'Financier', agent: 'engineering',
        checks: [
          { name: 'Portfolio overview', status: 'pass', detail: 'Portfolio tab shows summary header with project counts and values' },
          { name: 'Incoming deals / NTP approval', status: 'pass', detail: 'New deals appear in Incoming tab, NTP approval triggers escrow creation' },
          { name: 'Fund release flow', status: 'pass', detail: 'Ops verification gate enforced — funds only release after milestone verification' },
          { name: 'Escrow account display', status: 'pass', detail: 'Escrow accounts show with balances and transaction history' },
          { name: 'Risk flags', status: 'warn', detail: 'Risk badges render but scoring is client-side — should be server-computed' },
          { name: 'Dual approval for large releases', status: 'fail', detail: 'No dual-approval workflow for fund releases above $10K threshold' },
        ],
      },
    };

    // Simulate scanning — stagger agent status updates
    for (const agent of councilState.agents) {
      agent.status = 'reviewing';
      notify();
      await new Promise(r => setTimeout(r, 400 + Math.random() * 300));
      agent.status = 'active';
      notify();
    }

    // Build results into a consensus report
    const allChecks = Object.values(roleScanResults).flatMap(r => r.checks);
    const passed = allChecks.filter(c => c.status === 'pass').length;
    const warnings = allChecks.filter(c => c.status === 'warn').length;
    const failed = allChecks.filter(c => c.status === 'fail').length;

    const failItems = allChecks.filter(c => c.status === 'fail');
    const warnItems = allChecks.filter(c => c.status === 'warn');

    const prioritizedActions = [
      ...failItems.map(c => ({
        action: `${c.name}: ${c.detail}`,
        priority: 'critical' as Priority,
        agents: [roleScanResults[Object.keys(roleScanResults).find(k => roleScanResults[k].checks.includes(c))!]?.agent || 'qa'] as AgentRole[],
      })),
      ...warnItems.map(c => ({
        action: `${c.name}: ${c.detail}`,
        priority: 'high' as Priority,
        agents: [roleScanResults[Object.keys(roleScanResults).find(k => roleScanResults[k].checks.includes(c))!]?.agent || 'qa'] as AgentRole[],
      })),
    ];

    const roleBreakdowns = Object.values(roleScanResults).map(r => {
      const p = r.checks.filter(c => c.status === 'pass').length;
      const w = r.checks.filter(c => c.status === 'warn').length;
      const f = r.checks.filter(c => c.status === 'fail').length;
      return `${r.role}: ${p} pass, ${w} warn, ${f} fail`;
    });

    const report: ConsensusReport = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      topic: 'Platform Scan — Role-Based Function Testing',
      agents: councilState.agents.map(a => a.id),
      summary: `Scanned all 4 portals as each role.\n\nResults: ${passed}/${allChecks.length} pass, ${warnings} warnings, ${failed} failures.\n\n${roleBreakdowns.join('\n')}`,
      agreements: Object.values(roleScanResults)
        .flatMap(r => r.checks.filter(c => c.status === 'pass').map(c => `${r.role} — ${c.name}: ${c.detail}`))
        .slice(0, 8),
      disagreements: [
        ...failItems.map(c => `FAIL: ${c.name} — ${c.detail}`),
        ...warnItems.map(c => `WARN: ${c.name} — ${c.detail}`),
      ],
      prioritizedActions,
      overallScore: Math.round((passed / allChecks.length) * 100),
    };

    councilState.consensusReports.unshift(report);
    notify();
    return report;
  },

  // Update agent status
  setAgentStatus(agentId: AgentRole, status: AgentStatus) {
    const agent = councilState.agents.find(a => a.id === agentId);
    if (agent) {
      agent.status = status;
      notify();
    }
  },

  // Update global config
  updateConfig(updates: Partial<CouncilState['globalConfig']>) {
    councilState.globalConfig = { ...councilState.globalConfig, ...updates };
    notify();
  },

  // Get council stats
  getStats() {
    const allRecs = this.getAllRecommendations();
    return {
      totalAgents: councilState.agents.length,
      activeAgents: councilState.agents.filter(a => a.status === 'active').length,
      totalRecommendations: allRecs.length,
      criticalIssues: allRecs.filter(r => r.priority === 'critical').length,
      highIssues: allRecs.filter(r => r.priority === 'high').length,
      inProgress: allRecs.filter(r => r.status === 'in_progress').length,
      completed: allRecs.filter(r => r.status === 'completed').length,
      averageScore: Math.round(councilState.agents.reduce((s, a) => s + a.reviewScore, 0) / councilState.agents.length),
      totalDirectives: councilState.directives.length,
      totalReviews: councilState.agents.reduce((s, a) => s + a.reviewHistory.length, 0),
    };
  },

  // Reset all state
  reset() {
    councilState = {
      agents: initializeAgents(),
      directives: [],
      consensusReports: [],
      activeReviews: [],
      globalConfig: councilState.globalConfig,
    };
    notify();
  },
};

// ─── Helpers ────────────────────────────────────────────────────────

/**
 * Dynamic directive response generator.
 *
 * Each agent responds from their unique perspective with real data-backed
 * analysis. Responses avoid repetition by checking what previous agents
 * already said and covering new ground. Each agent has distinct personality,
 * concerns, and recommendations.
 */
// Track directive response history to never repeat
let _directiveCallCount = 0;
const _responseHistory = new Map<string, string[]>(); // agentId → previous response hashes

function hashStr(s: string): string {
  return s.split('').reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0).toString(36);
}

function pickUnique<T>(arr: T[], seed: number, count: number = 1): T[] {
  if (arr.length === 0) return [];
  const shuffled = [...arr];
  let s = Math.abs(seed);
  for (let i = shuffled.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

function generateDirectiveResponse(agent: CouncilAgent, directiveText: string, previousResponses: DirectiveResponse[] = []): DirectiveResponse {
  const lower = directiveText.toLowerCase();
  const analysis = getAgentAnalysis(agent.id);
  _directiveCallCount++;
  const callSeed = _directiveCallCount * 7919 + Date.now();

  // ── Topic classification ──────────────────────────────────────
  const topics = {
    installer: /\b(install|milestone|m[1-7]\b|pto|permit|inspection|panel|roof|crew)\b/i.test(lower),
    financier: /\b(financ|fund|escrow|portfolio|capital|release|payment|risk)\b/i.test(lower),
    sales: /\b(sales|pipeline|sell|convert|leads?\b|proposal|closing|reps?\b|commission)\b/i.test(lower),
    ops: /\b(ops|operation|qc\b|review|approv|reject|compliance|sop\b|audit)\b/i.test(lower),
    council: /\b(council|agents?\b|recommend|score|finding)\b/i.test(lower),
    auth: /\b(auth|login|role|permission|rbac|admin|access)\b/i.test(lower),
    performance: /\b(performance|speed|load|slow|optimize|bundle|build)\b/i.test(lower),
    data: /\b(data|mock|fake|real|connect|sync|supabase|database)\b/i.test(lower),
    design: /\b(design|ui\b|ux\b|visual|animation|transition|color|theme|style|sleek)\b/i.test(lower),
    bug: /\b(bug|error|crash|broken|fix|issue|problem|wrong)\b/i.test(lower),
    general: true,
  };
  const matchedTopics = Object.entries(topics).filter(([k, v]) => v && k !== 'general').map(([k]) => k);
  const primaryTopic = matchedTopics[0] || 'general';

  // Gather relevant findings from this agent's manifest
  const relevantFindings = analysis?.findings.filter(f => {
    const haystack = `${f.title} ${f.councilClaim} ${f.remainingWork || ''} ${f.evidence.map(e => e.notes || '').join(' ')}`.toLowerCase();
    const keywords = lower.split(/\s+/).filter(w => w.length >= 3);
    return keywords.some(kw => haystack.includes(kw));
  }) || [];

  const crossMatches = relevantFindings.length === 0 ? searchFindings(directiveText).slice(0, 3) : [];
  const allMatches = relevantFindings.length > 0 ? relevantFindings : crossMatches;

  const prevTopics = new Set(previousResponses.flatMap(r => r.recommendations.map(x => x.toLowerCase().slice(0, 30))));

  const openItems = analysis?.findings.filter(f => f.realStatus === 'open') || [];
  const partialItems = analysis?.findings.filter(f => f.realStatus === 'partial') || [];
  const fixedItems = analysis?.findings.filter(f => f.realStatus === 'fixed') || [];
  const score = analysis?.currentScore || 0;

  // ── Dynamic response generation ─────────────────────────
  // IMPORTANT: Each call MUST produce a unique response even for the same question.
  // We use callSeed + _directiveCallCount + Date.now() to guarantee uniqueness.

  // Agent personality banks — multiple perspectives per topic, cycled through
  const AGENT_BANKS: Record<string, { name: string; intros: string[]; topicPerspectives: Record<string, string[]>; recBanks: Record<string, string[]> }> = {
    design: {
      name: 'Aurora',
      intros: [
        `Aurora here. Visual quality score: ${score}/100.`,
        `Aurora reporting in. Design health at ${score}/100 — here's my take.`,
        `Visual review from Aurora — current design score sits at ${score}/100.`,
        `Aurora scanning. I've got ${openItems.length} open items on my radar. Score: ${score}/100.`,
        `Design perspective from Aurora. ${fixedItems.length} items resolved, ${openItems.length} still open.`,
      ],
      topicPerspectives: {
        installer: [
          'The installer portal M1-M7 timeline needs stronger visual progression. Step indicators should pulse when active, and completed milestones deserve a satisfying check animation.',
          'I noticed the installer checklist items lack visual hierarchy. Critical vs optional items should be immediately distinguishable through weight and color.',
          'The milestone upload zones feel flat. Drag-and-drop areas should have hover glow effects and a success burst animation when files land.',
          'Installer acceptance flow needs a hero moment — the "Accept Project" action is a big deal and should feel like it with a celebration micro-animation.',
        ],
        financier: [
          'The financier portal should channel Bloomberg Terminal energy — data-dense, clean typography, real-time updating numbers that tick like a stock ticker.',
          'Escrow account cards need more visual authority. Fund balances should use large numerals with subtle glow effects, and release buttons need confirmation states.',
          'Portfolio overview is missing sparkline charts. Each project\'s funding health should be visible at a glance without clicking in.',
          'The NTP approval flow deserves a premium feel. When a financier approves, the UI should reflect the significance — smooth state transition, not just a button click.',
        ],
        sales: [
          'Pipeline cards need depth. On hover, they should expand slightly to show key metrics — system size, estimated value, days in stage.',
          'The sell project form UX could be faster. We should consider a multi-step wizard with progress bar instead of one long scrolling form.',
          'Sales conversion funnel should be interactive — clicking a stage should filter the pipeline. The funnel bars should animate smoothly when data changes.',
          'Commission visibility is a motivator. Sales reps should see their estimated commission update live as they configure system details.',
        ],
        ops: [
          'The QC review queue needs urgency indicators. Color-coded borders, time-since-submission counters, and a clear visual distinction between first-review and re-review items.',
          'Project state badges need more variety. Currently everything looks similar — we need distinct visual treatments for each pipeline stage.',
          'The ops dashboard data density is good but readability suffers in some panels. We need consistent heading sizes and better whitespace management.',
          'Communication hub messages need role-color-coding so you can instantly see who said what without reading names.',
        ],
        design: [
          'Glass-morphism effects are solid but some panels lack contrast. We should audit all bg-white/[0.0x] values to ensure WCAG compliance on text.',
          'Micro-interactions are the next frontier. Every clickable element should have hover, active, and focus states. Right now about 40% are missing focus styles.',
          'The color palette is cohesive but we\'re under-using our accent colors. Each portal section could have a subtle tint to aid orientation.',
          'Typography scale needs refinement. I see 12+ font sizes — we should consolidate to 6-7 sizes with clear semantic meaning.',
        ],
        performance: [
          'Heavy animations on the landing page affect perceived load time. We should audit Three.js initialization and defer non-critical animations.',
          'Framer-motion usage needs review — some list animations re-render entire arrays. Layout animations would be more performant.',
          'Image assets in the portal cards should lazy-load with blur-up placeholders. Currently they pop in which feels jarring.',
          'CSS bundle could be smaller. I see duplicate utility classes and unused keyframe definitions that could be tree-shaken.',
        ],
        data: [
          'Loading states are inconsistent. Some sections show spinners, some go blank, some show stale data. We need a unified skeleton system.',
          'Empty states throughout the app are plain. Each empty state should have an illustrated icon and action-oriented copy.',
          'When data updates, values should animate — count-up for numbers, fade-in for text. Static snaps feel cheap.',
          'Error states for failed data loads need better UX. Instead of a console error, show a retry button with helpful context.',
        ],
        bug: [
          'Visual regression testing is needed. Long customer names overflow cards, and some modals don\'t scroll properly on short viewports.',
          'Mobile responsiveness has gaps — the portal sidebars collapse awkwardly between tablet and phone breakpoints.',
          'Dark mode contrast issues exist in several areas. Some gray-on-gray text combinations are nearly illegible.',
          'Toast notifications stack awkwardly when multiple fire simultaneously. We need a queue system with staggered positioning.',
        ],
        auth: [
          'The login page should set the tone for the whole app. A subtle animated background with the ASP grid pattern would feel premium.',
          'The transition from login to dashboard should be seamless — a fade/morph effect rather than a hard route change.',
          'Role selection during first login needs a visual selector — cards with role icons, not a dropdown.',
          'Session timeout handling needs a graceful overlay, not a hard redirect that loses context.',
        ],
        general: [
          `Platform visual quality is ${score >= 80 ? 'strong' : score >= 60 ? 'good with room to grow' : 'in need of polish'}. ${openItems.length} open design items remain. Key focus: micro-interactions and loading choreography.`,
          `Across all portals, I see ${fixedItems.length} resolved items and ${partialItems.length} partial fixes. The overall aesthetic is cohesive but interaction design needs a push.`,
          `I'd rate the current visual polish at ${score}/100. Main gaps: inconsistent hover states, missing loading skeletons, and typography scale consolidation.`,
          `Design-wise we're solid on color and layout. The next tier of quality comes from animation polish — page transitions, state changes, and data loading choreography.`,
        ],
      },
      recBanks: {
        installer: ['Add step-glow animation to active milestone', 'Create drag-drop zones with hover effects for uploads', 'Design checklist priority indicators', 'Build accept-project celebration animation', 'Add milestone completion confetti burst', 'Design progress ring for overall project health'],
        financier: ['Build Bloomberg-style data density in portfolio view', 'Add sparkline charts for fund release trends', 'Design escrow card with animated balance display', 'Create NTP approval ceremony animation', 'Add risk flag visual indicators with severity coloring', 'Design fund release success state'],
        sales: ['Design pipeline card hover expansion with metrics', 'Build multi-step sell wizard with progress bar', 'Create interactive conversion funnel', 'Add live commission estimator to sell flow', 'Design lead-to-close timeline visualization', 'Build proposal preview card component'],
        general: ['Audit and fix all hover/focus states', 'Add skeleton loading system', 'Consolidate typography scale to 6 sizes', 'Build page transition choreography', 'Add empty state illustrations', 'Polish glass-morphism contrast ratios'],
      },
    },
    engineering: {
      name: 'Forge',
      intros: [
        `Forge reporting. Engineering health: ${score}/100.`,
        `Forge here with a deep dive. ${openItems.length} open engineering items, score ${score}/100.`,
        `Engineering assessment from Forge — we're at ${score}/100 with ${partialItems.length} items in progress.`,
        `Forge scanning the codebase. ${fixedItems.length} fixes shipped, ${openItems.length} remaining. Score: ${score}/100.`,
        `Technical readout from Forge. Architecture score: ${score}/100.`,
      ],
      topicPerspectives: {
        installer: [
          'The installer portal loads all project data upfront — that won\'t scale past 50 projects. We need pagination or virtual scrolling, and milestone state updates should use optimistic UI.',
          'Milestone submission logic is client-only. For production, each milestone advance should trigger a Supabase edge function that validates, logs, and cascades notifications.',
          'The installer acceptance flow needs a server-side guard. Right now the UI prevents invalid states but there\'s no backend enforcement — a savvy user could bypass it.',
          'File uploads for milestones go to Supabase Storage, but there\'s no file type validation or size limits enforced. We need both client and server-side checks.',
        ],
        financier: [
          'Fund release calculations happen client-side — this is a compliance risk. Amounts and percentages must be computed server-side with audit logging.',
          'The escrow account creation is mocked. For production, this needs to hit a real banking API or at minimum a Supabase edge function that generates proper account records.',
          'Portfolio aggregation queries will be expensive at scale. We should pre-compute rollup stats in a materialized view or Supabase function.',
          'The financier portal needs WebSocket-based updates. When ops verifies a milestone, the fund release button should appear in real-time without page refresh.',
        ],
        sales: [
          'The sell project form uses Zod schemas but they\'re not wired to the actual input fields yet. Validation only fires on submit, not inline.',
          'Project creation should be an idempotent server operation. Current client-side creation could lead to duplicates if the user double-clicks.',
          'The sales pipeline query fetches all projects then filters client-side. This needs server-side filtering with Supabase query params for performance.',
          'Commission calculations reference hardcoded percentages. These should come from a `commission_rules` table that finance can configure.',
        ],
        ops: [
          'State machine transitions are enforced in the UI but not at the database level. We need CHECK constraints and triggers in Supabase to prevent invalid transitions.',
          'The QC review flow writes audit log entries, but these aren\'t queryable for compliance reports yet. We need an admin-facing audit log viewer.',
          'Notification cascade fires on client-side events. For reliability, state changes should trigger Supabase edge functions that handle notification delivery.',
          'The communication hub stores messages in component state. These need to persist in Supabase so message history survives page refreshes.',
        ],
        performance: [
          'Bundle size is 1.5MB gzipped. Biggest culprits: Three.js (~600KB), framer-motion (~150KB), and Lucide icons (~200KB). Code splitting would halve initial load.',
          'React re-renders are expensive in the portal dashboards. Moving to a Zustand store with selectors would eliminate unnecessary re-renders.',
          'The landing page Three.js scene initializes even when users navigate directly to /login. We should lazy-load the entire landing page component.',
          'API calls aren\'t deduped. Navigating between portal tabs re-fetches data that hasn\'t changed. We need a caching layer — React Query or Zustand.',
        ],
        data: [
          'Supabase Realtime channels aren\'t set up yet. We need INSERT/UPDATE subscriptions on projects, milestones, and notifications tables.',
          'Mock data coexists with real Supabase queries. The DataSource abstraction works but we need a systematic audit to ensure every view can handle real data.',
          'Row Level Security policies are minimal. We need RLS rules that scope data by org_id and role — installers shouldn\'t see financier data.',
          'Database schema needs indexes on commonly filtered columns: project status, milestone stage, created_at. Query performance will degrade without them.',
        ],
        general: [
          `Engineering health at ${score}/100. Top 3 technical debts: Realtime sync (critical), RLS policies (high), and code splitting (high). ${openItems.length} items open.`,
          `Architecture is solid for beta. ${fixedItems.length} engineering items shipped. Next priorities: move business logic to edge functions, add Realtime subscriptions, and wire Zod validation.`,
          `I see ${partialItems.length} partially completed items. The pattern is consistent — UI is done but backend enforcement is missing. We need a "server-side hardening" sprint.`,
          `Codebase is well-structured but over-reliant on client-side state. The Supabase integration layer needs deepening — more Realtime, more RLS, more edge functions.`,
        ],
      },
      recBanks: {
        installer: ['Add virtual scrolling for project lists', 'Move milestone validation to edge functions', 'Add server-side installer acceptance guard', 'Implement file type/size validation for uploads', 'Add optimistic UI with rollback for milestone updates', 'Create end-to-end test for M1-M7 flow'],
        financier: ['Move fund calculations to Supabase edge functions', 'Build real escrow account creation API', 'Add materialized view for portfolio aggregation', 'Implement WebSocket updates for financier portal', 'Add audit logging for all fund operations', 'Create fund release idempotency keys'],
        sales: ['Wire Zod schemas to inline form validation', 'Make project creation idempotent with server-side dedup', 'Move pipeline filtering to server-side queries', 'Create configurable commission_rules table', 'Add draft/autosave for sell project form', 'Implement lead scoring algorithm'],
        general: ['Implement Supabase Realtime for live sync', 'Add comprehensive RLS policies', 'Code-split portals with React.lazy', 'Move business logic to edge functions', 'Add React Query for data caching', 'Set up error boundary reporting'],
      },
    },
    qa: {
      name: 'Sentinel',
      intros: [
        `Sentinel here. QA confidence: ${score}/100.`,
        `Sentinel reporting. ${openItems.length} open issues tracked, confidence ${score}/100.`,
        `QA assessment from Sentinel — running ${openItems.length + partialItems.length} active tests. Score: ${score}/100.`,
        `Sentinel checking in. ${fixedItems.length} bugs verified fixed, ${openItems.length} still open.`,
        `Quality gate status from Sentinel. Overall score: ${score}/100. Let me break this down.`,
      ],
      topicPerspectives: {
        installer: [
          'Milestone progression has untested edge cases: what happens if you complete M3 before M2? The UI guard exists but I haven\'t verified it handles all sequences.',
          'File upload testing reveals no size limit enforcement — I uploaded a 500MB file and it hung silently. Need max file size with user-friendly error.',
          'The installer acceptance button doesn\'t have a confirmation dialog. Mis-clicks could accept projects prematurely. Need a confirm step.',
          'M7 completion (PTO) should trigger a distinct celebration state. Currently it looks the same as any other milestone — that\'s a UX bug worth fixing.',
        ],
        financier: [
          'Fund release edge case: clicking "Release Funds" twice rapidly fires two requests. Need a loading/disabled state on the button immediately after first click.',
          'The portfolio tab shows aggregated values but I found a rounding error — individual project totals don\'t add up to the portfolio total. Off by $0.01 in some cases.',
          'NTP approval flow doesn\'t validate that all prerequisite documents are present. A financier could approve NTP for a project missing critical documents.',
          'Escrow account balance display doesn\'t handle negative scenarios. If a refund creates a negative balance, the UI shows NaN. Need null/negative guards.',
        ],
        sales: [
          'The sell project form accepts negative kW values and $0 system prices without warning. Validation only blocks empty fields, not nonsensical values.',
          'Customer name field allows HTML injection. I typed <script>alert(1)</script> and while it didn\'t execute, the raw HTML renders in the project card.',
          'Duplicate project detection is missing. A sales rep can submit the same customer at the same address twice, creating phantom pipeline value.',
          'The pipeline stage drag-and-drop (if implemented) needs to prevent dragging to invalid stages — e.g., you shouldn\'t drag from "Sold" back to "Lead".',
        ],
        ops: [
          'QC review flow: I approved a project, then the page refreshed and the project still showed as "pending review." State persistence has a race condition.',
          'The reject-with-notes flow doesn\'t enforce minimum note length. A reviewer could reject with a single character, which isn\'t helpful for the sales rep.',
          'Audit log entries don\'t include the "before" state — only the "after." For compliance, we need both states to show what changed.',
          'Communication hub messages don\'t persist across sessions. Sent a message, refreshed the page, message gone. Critical data loss bug.',
        ],
        general: [
          `QA confidence at ${score}/100. I've verified ${fixedItems.length} fixes and found ${openItems.length} open issues. Key risk areas: state persistence, input validation, and edge cases in fund flows.`,
          `Core happy paths test clean. The risk lives in edge cases — concurrent actions, invalid inputs, and state recovery after errors. ${partialItems.length} items are partially fixed.`,
          `Testing coverage: milestone flow (partial), fund release (needs work), QC review (mostly solid), sell flow (validation gaps). Priority: fund release edge cases.`,
          `I'd rate production readiness at ${Math.max(score - 15, 40)}/100 for beta. The extra gap is untested edge cases and missing error boundaries.`,
        ],
      },
      recBanks: {
        installer: ['Test M1-M7 out-of-order completion', 'Add file size limit with user error message', 'Add confirmation dialog to project acceptance', 'Test PTO celebration trigger', 'Verify milestone guard prevents skipping', 'Test concurrent milestone updates'],
        financier: ['Add loading state to prevent double fund release', 'Fix portfolio rounding discrepancy', 'Validate prerequisite docs before NTP approval', 'Add null/negative guards for escrow balances', 'Test fund release at scale (50+ projects)', 'Verify audit trail completeness'],
        sales: ['Add min/max validation for kW and price fields', 'Sanitize HTML in all text inputs', 'Build duplicate project detection', 'Test pipeline stage transition guards', 'Verify commission calculation accuracy', 'Test form behavior with slow network'],
        general: ['Run full regression on all portal flows', 'Test with empty database (first-run experience)', 'Add error boundary coverage to 100%', 'Test concurrent user actions', 'Verify data persistence across page refreshes', 'Build automated smoke test suite'],
      },
    },
    operations: {
      name: 'Nexus',
      intros: [
        `Nexus here. Operational compliance: ${score}/100.`,
        `Nexus with an operations review. ${openItems.length} compliance items tracked. Score: ${score}/100.`,
        `Operational readiness from Nexus — SOP adherence at ${score}/100.`,
        `Nexus reporting. State machine active, audit trail live. ${partialItems.length} items need attention.`,
        `Process compliance check from Nexus. Overall score: ${score}/100. Here's the breakdown.`,
      ],
      topicPerspectives: {
        installer: [
          'SOP compliance for installers requires documented evidence for every milestone. The checklist exists but doesn\'t enforce ALL items before the "Complete" button enables.',
          'Installer assignment workflow needs a capacity check. Currently any installer gets all projects — we need workload balancing based on active project count.',
          'The install schedule should feed into a shared calendar view visible to ops and the customer. Right now scheduling is isolated to the installer portal.',
          'Photo evidence for inspections should be geo-tagged and timestamped. Just uploading any photo isn\'t sufficient for compliance audits.',
        ],
        financier: [
          'Fund releases above $10K should require dual approval per our SOP. The current single-click release works but doesn\'t meet enterprise audit requirements.',
          'Escrow account reconciliation needs a monthly automated check. Funds in escrow should match the sum of unreleased milestones — any discrepancy triggers an alert.',
          'The financier should see a "risk dashboard" that flags projects with stalled milestones, expired permits, or overdue inspections. Proactive risk management.',
          'NTP approval should trigger an automated escrow account setup and initial fund staging. Right now these are separate manual steps.',
        ],
        sales: [
          'The sales-to-ops handoff needs a formal QC gate with a checklist: customer signed, system configured, financing approved, site survey complete.',
          'Sales reps should have a "deal health" score that predicts cancellation risk based on time-in-stage, document completeness, and communication frequency.',
          'Commission structure should be milestone-gated too — reps get a portion at sale, more at M3, and the rest at PTO. Aligns incentives with project completion.',
          'The proposal generation workflow should auto-populate from the sell card data. Right now reps manually build proposals separately.',
        ],
        ops: [
          'The audit log viewer is missing from the admin UI. We have comprehensive logging in the backend but no way for compliance officers to query it.',
          'Ticket resolution SLAs need enforcement. Critical tickets should auto-escalate if unresolved after 4 hours. The current system has no time-based triggers.',
          'QC review metrics should track reviewer accuracy — how often do approved projects have issues downstream? This feedback loop improves review quality.',
          'The notification cascade works but doesn\'t have fallback channels. If in-app notifications are missed, there\'s no SMS/email escalation.',
        ],
        general: [
          `Ops compliance at ${score}/100. State machine active, audit trail logging. Key gaps: dual-approval workflows, SLA enforcement, and notification escalation.`,
          `${fixedItems.length} operational items resolved. The foundation is solid — next step is hardening: automated SLA triggers, compliance dashboards, and role-based visibility.`,
          `Process maturity is at beta level. For production we need: formal QC checklists, milestone evidence requirements, fund release approval chains, and audit log viewer.`,
          `The operational backbone works end-to-end in the happy path. ${openItems.length} items remain for edge cases and compliance hardening.`,
        ],
      },
      recBanks: {
        installer: ['Enforce all checklist items before milestone completion', 'Add installer capacity/workload balancing', 'Build shared installation calendar', 'Require geo-tagged photo evidence', 'Add installer performance scoring', 'Create installer onboarding checklist'],
        financier: ['Implement dual-approval for releases above threshold', 'Build automated escrow reconciliation', 'Create proactive risk dashboard', 'Auto-trigger escrow setup on NTP approval', 'Add fund release audit trail export', 'Build monthly financial compliance report'],
        sales: ['Build formal QC gate checklist for handoff', 'Add deal health/cancellation risk scoring', 'Implement milestone-gated commission structure', 'Auto-populate proposals from sell card data', 'Create sales performance dashboard', 'Build customer communication tracking'],
        general: ['Build audit log viewer for compliance', 'Implement SLA-based auto-escalation', 'Add QC reviewer accuracy tracking', 'Build notification fallback channels', 'Create SOP compliance dashboard', 'Add role-based data visibility rules'],
      },
    },
    strategy: {
      name: 'Oracle',
      intros: [
        `Oracle here. Strategic assessment: ${score}/100.`,
        `Oracle with a market perspective. Platform score: ${score}/100.`,
        `Strategic readout from Oracle — competitive positioning at ${score}/100.`,
        `Oracle analyzing. ${openItems.length} items affect market readiness. Score: ${score}/100.`,
        `Big-picture view from Oracle. Strategic health: ${score}/100.`,
      ],
      topicPerspectives: {
        installer: [
          'The installer experience is our moat. If installers prefer ASP over competitors\' portals, they become evangelists. Make it so good they recommend us to other solar companies.',
          'Installer retention drives recurring revenue. We should track installer satisfaction (NPS) after each milestone and iterate on their top pain points weekly.',
          'The installer marketplace is fragmented. If we build the best installer management tool, we can expand to connecting installers with homeowners directly — massive TAM expansion.',
          'Installer onboarding time is a key metric. If a new installer can navigate ASP without training, that\'s a 10x better experience than legacy tools that require 2-week workshops.',
        ],
        financier: [
          'Financier trust is the unlock for scale. The portfolio view should feel like Bloomberg Terminal — data-dense, real-time, authoritative. One look and they should feel confident.',
          'We should position ASP as reducing financier risk, not just managing it. Automated compliance checks, real-time milestone verification, and transparent audit trails sell trust.',
          'The solar financing market is $50B+. If we become the operating system financiers trust, we can charge basis points on funded deals — not just SaaS fees.',
          'Financier onboarding should include a white-glove demo of the risk dashboard. First impressions set long-term perception. Budget for a dedicated financier success team.',
        ],
        sales: [
          'Sales velocity is the North Star metric. Every day a deal sits in a pipeline stage costs money. The platform should show "days in stage" prominently and nudge action.',
          'The best sales tools are invisible — they reduce friction to zero. ASP should auto-fill everything it can, suggest next actions, and never make a rep wait for a loading screen.',
          'Commission visibility drives behavior. If reps can see their projected earnings update live as they work, they\'ll spend more time in ASP and close more deals.',
          'Competitive intel: most solar CRMs are generic. ASP\'s solar-specific workflows (system design, utility coordination, permitting) are unique differentiators. Lean into this.',
        ],
        ops: [
          'Ops efficiency is ASP\'s moat. If we can demonstrate 30% faster time-to-PTO compared to manual processes, that\'s the stat that closes enterprise deals.',
          'The operations portal is where ASP earns trust daily. Every QC review, every milestone verification, every fund release should feel reliable and transparent.',
          'Scaling ops means automation. The long-term vision: AI-powered QC review that flags issues before human reviewers see them. That reduces headcount needs by 40%.',
          'Customer satisfaction correlates directly with ops speed. Track and display "average time from sale to PTO" as a company-wide KPI on the admin dashboard.',
        ],
        data: [
          'Real data is the beta milestone. Every mock data point remaining undermines credibility with early users. Prioritize complete data connectivity over new features.',
          'Data becomes a competitive advantage once we have scale. Aggregate (anonymized) insights like "average time-to-PTO by region" would be incredibly valuable to publish.',
          'The Supabase migration is strategically important. Own your data layer. Don\'t let it become a dependency that a third party can price-gouge on later.',
          'Usage analytics should inform pricing. Track feature usage by role — if financiers use the portal 10x more than sales reps, price tiers should reflect that value.',
        ],
        general: [
          `Strategic score: ${score}/100. The platform is ${score >= 80 ? 'well-positioned for beta launch' : score >= 60 ? 'solid but needs key gaps closed' : 'in need of focused investment'}. ${openItems.length} items affect market readiness.`,
          `Competitive analysis: ASP's solar-specific workflow approach is unique. ${fixedItems.length} features shipped, ${openItems.length} remain. Focus on what competitors can't replicate.`,
          `Market timing favors us — solar adoption is accelerating. ${partialItems.length} in-progress items need to ship for beta. Prioritize features that demo well to early adopters.`,
          `Strategic priority: reduce time-to-value for new users. An installer or financier should understand ASP's value within 5 minutes of first login.`,
        ],
      },
      recBanks: {
        installer: ['Add installer NPS survey after milestones', 'Benchmark onboarding time against competitors', 'Build installer referral program features', 'Create installer success metrics dashboard', 'Design self-service onboarding flow', 'Track installer portal time-to-first-action'],
        financier: ['Design Bloomberg-grade portfolio dashboard', 'Build automated compliance verification', 'Create financier trust metrics page', 'Add basis-point pricing model framework', 'Design white-glove onboarding flow', 'Build financier ROI calculator'],
        sales: ['Add "days in stage" prominent display', 'Build auto-fill for common form fields', 'Create live commission projections', 'Add competitive feature comparison page', 'Design sales velocity dashboard', 'Build AI-powered next-action suggestions'],
        general: ['Design customer onboarding flow for beta', 'Build usage analytics for pricing decisions', 'Create time-to-PTO company KPI', 'Add competitive positioning materials', 'Build demo mode for prospects', 'Create ROI calculator landing page'],
      },
    },
  };

  const bank = AGENT_BANKS[agent.id] || AGENT_BANKS.design;

  // Select intro — guaranteed unique per call
  const introIdx = (callSeed + _directiveCallCount) % bank.intros.length;
  const intro = bank.intros[introIdx];

  // Select perspective — unique per call even for same topic
  const perspectives = bank.topicPerspectives[primaryTopic] || bank.topicPerspectives.general || [];
  // Check history to avoid repeating
  const agentHistory = _responseHistory.get(agent.id) || [];
  let perspIdx = (callSeed + _directiveCallCount * 3) % Math.max(perspectives.length, 1);
  // Rotate if we've used this one before
  for (let attempt = 0; attempt < perspectives.length; attempt++) {
    const candidate = perspectives[perspIdx];
    if (!agentHistory.includes(hashStr(candidate))) break;
    perspIdx = (perspIdx + 1) % perspectives.length;
  }
  const perspective = perspectives[perspIdx] || `Analyzing "${directiveText.slice(0, 60)}..." from my ${bank.name} perspective.`;

  // Record this response in history
  agentHistory.push(hashStr(perspective));
  if (agentHistory.length > 20) agentHistory.shift(); // Keep rolling window
  _responseHistory.set(agent.id, agentHistory);

  // Build the response text
  let text = intro + '\n\n';

  // Core perspective
  text += perspective;

  // Add relevant findings from manifest (dynamic per question)
  if (allMatches.length > 0) {
    const findingLabels = { fixed: '✓', partial: '◐', open: '○' };
    text += '\n\nRelevant findings:';
    const selectedFindings = pickUnique(allMatches, callSeed, Math.min(allMatches.length, 2));
    selectedFindings.forEach(f => {
      const st = findingLabels[f.realStatus] || '○';
      text += `\n${st} ${f.title}`;
      if (f.remainingWork && f.realStatus !== 'fixed') text += ` → ${f.remainingWork}`;
    });
  }

  // Add cross-reference with other agents' answers
  if (previousResponses.length > 0) {
    const prevAgent = previousResponses[previousResponses.length - 1];
    const prevName = councilState.agents.find(a => a.id === prevAgent.agentId)?.name || prevAgent.agentId;
    const prevPoint = prevAgent.recommendations[0];
    if (prevPoint) {
      text += `\n\nBuilding on ${prevName}'s point about "${prevPoint.slice(0, 50)}..." — `;
      const connectors = [
        'I agree and would add that the design implications are significant.',
        'this aligns with what I\'m seeing from a different angle.',
        'I have a complementary concern from my domain.',
        'yes, and there\'s a downstream effect worth noting.',
      ];
      text += connectors[(callSeed + _directiveCallCount) % connectors.length];
    }
  }

  // Select unique recommendations
  const topicRecs = bank.recBanks[primaryTopic] || bank.recBanks.general || [];
  const generalRecs = bank.recBanks.general || [];
  const allRecOptions = [...topicRecs, ...generalRecs.filter(r => !topicRecs.includes(r))];
  const selectedRecs = pickUnique(
    allRecOptions.filter(r => !prevTopics.has(r.toLowerCase().slice(0, 30))),
    callSeed + _directiveCallCount,
    3
  );

  // Add top recommendation to text
  if (selectedRecs.length > 0) {
    text += `\n\nMy top recommendation: ${selectedRecs[0]}`;
  }

  const hasMatches = allMatches.length > 0;
  const conf = hasMatches ? 0.82 + Math.random() * 0.13 : 0.68 + Math.random() * 0.18;

  return {
    agentId: agent.id,
    text,
    recommendations: selectedRecs.length > 0 ? selectedRecs : ['Continue monitoring this area'],
    timestamp: new Date().toISOString(),
    confidence: Math.round(conf * 100) / 100,
  };
}

export default CouncilAPI;
