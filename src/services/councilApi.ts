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
      { id: '', agentId: 'design', area: 'Deal Cards', title: 'Pipeline card hover states lack depth', description: 'Deal cards in the pipeline view feel flat. Add layered box-shadow transitions, subtle scale(1.02) on hover, and a glass reflection effect along the top edge. The premium feel should extend to every interactive element.', priority: 'medium', status: 'pending', portal: 'Sales', effort: '1h', createdAt: '', updatedAt: '', votes: { agree: ['engineering'], disagree: [], abstain: ['qa'] } },
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
      { id: '', agentId: 'engineering', area: 'Bundle Size', title: 'Lazy-load Three.js and R3F', description: 'Three.js adds ~800KB to the bundle. Use React.lazy() + Suspense to code-split the 3D components. Users who go directly to portals skip the landing page and dont need Three.js immediately.', priority: 'critical', status: 'pending', portal: 'All', effort: '2h', createdAt: '', updatedAt: '', votes: { agree: ['qa'], disagree: ['design'], abstain: [] } },
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
      { id: '', agentId: 'qa', area: 'Milestone Flow', title: 'Milestones can be completed out of order', description: 'BUG: An installer can skip M2 and complete M4 items. The SOP requires sequential milestone completion. Add a gate check: M(n) can only start when M(n-1) is fully approved by Ops.', priority: 'critical', status: 'pending', portal: 'Installer', effort: '3h', createdAt: '', updatedAt: '', votes: { agree: ['operations', 'engineering'], disagree: [], abstain: [] } },
      { id: '', agentId: 'qa', area: 'QC Submit', title: 'Submit for QC button appears without all items done', description: 'EDGE CASE: If items are toggled on then off, the submit button state can get out of sync. Need a fresh recount on every render, not a cached value.', priority: 'high', status: 'pending', portal: 'Installer', effort: '1h', createdAt: '', updatedAt: '', votes: { agree: ['engineering'], disagree: [], abstain: [] } },
    ],
    'Financier Portal': [
      { id: '', agentId: 'qa', area: 'Fund Chain', title: 'Fund release skips ops verification gate', description: 'BUG: Financier can approve and release funds without ops milestone verification. The flow should be: Installer Submit → Ops Verify → Financier Approve → Financier Release. Currently Financier can go directly to Release.', priority: 'critical', status: 'pending', portal: 'Financier', effort: '3h', createdAt: '', updatedAt: '', votes: { agree: ['operations', 'engineering'], disagree: [], abstain: [] } },
    ],
    'Sales Portal': [
      { id: '', agentId: 'qa', area: 'Deal Flow', title: 'Empty sell projects can be converted to sale', description: 'BUG: A sell project with no customer name or system data can still be converted to a sale and passed to QC. Add validation gate before conversion.', priority: 'high', status: 'pending', portal: 'Sales', effort: '1h', createdAt: '', updatedAt: '', votes: { agree: ['operations'], disagree: [], abstain: [] } },
    ],
    'Backend Ops': [
      { id: '', agentId: 'qa', area: 'Notification', title: 'Cascade notifications only show in current session', description: 'Toast notifications for milestone approvals and QC decisions only appear if the user is currently on the page. Need persistent notification storage for cross-session visibility.', priority: 'medium', status: 'in_progress', portal: 'All', effort: '2h', createdAt: '', updatedAt: '', votes: { agree: ['engineering', 'operations'], disagree: [], abstain: [] } },
    ],
  },
  operations: {
    'SOP Compliance': [
      { id: '', agentId: 'operations', area: 'Workflow Engine', title: 'Build state machine for project lifecycle', description: 'Projects need a formal state machine: Lead → Qualified → QC Review → Active (M1-M7) → Completed → Archived. Each transition should have guards that check SOP requirements. No skipping steps.', priority: 'critical', status: 'pending', portal: 'All', effort: '6h', createdAt: '', updatedAt: '', votes: { agree: ['qa', 'engineering'], disagree: [], abstain: ['design'] } },
      { id: '', agentId: 'operations', area: 'Audit Trail', title: 'Every action needs timestamped audit log', description: 'For compliance: log who did what, when, on which project. Milestone approvals, fund releases, document uploads, QC decisions — all need an immutable audit trail viewable by admin.', priority: 'high', status: 'pending', portal: 'All', effort: '3h', createdAt: '', updatedAt: '', votes: { agree: ['qa', 'strategy'], disagree: [], abstain: [] } },
    ],
    'Reporting': [
      { id: '', agentId: 'operations', area: 'KPIs', title: 'Executive dashboard with real-time KPIs', description: 'CEO/VP users need: total pipeline value, deals by stage, average milestone time, installer performance, fund release velocity, QC rejection rate. Build a dedicated analytics view.', priority: 'high', status: 'pending', portal: 'Admin', effort: '4h', createdAt: '', updatedAt: '', votes: { agree: ['strategy', 'design'], disagree: [], abstain: [] } },
    ],
    'Communication': [
      { id: '', agentId: 'operations', area: 'Messaging', title: 'Role-based notification routing', description: 'When ops approves a milestone, auto-notify the assigned installer and financier. When financier releases funds, notify the sales rep and ops. Build a notification routing table based on project assignments.', priority: 'medium', status: 'pending', portal: 'All', effort: '3h', createdAt: '', updatedAt: '', votes: { agree: ['qa', 'engineering'], disagree: [], abstain: [] } },
    ],
  },
  strategy: {
    'Product': [
      { id: '', agentId: 'strategy', area: 'Market Position', title: 'Emphasize risk mitigation as core differentiator', description: 'Solar sales platforms compete on CRM features. ASP\'s moat is risk mitigation through operational enforcement. The landing page should lead with "risk reduction" language, not generic "sales platform" messaging. This has been partially addressed.', priority: 'high', status: 'in_progress', portal: 'Landing', effort: '2h', createdAt: '', updatedAt: '', votes: { agree: ['design', 'operations'], disagree: [], abstain: [] } },
      { id: '', agentId: 'strategy', area: 'Growth', title: 'Add customer onboarding wizard', description: 'New organizations need a guided setup: company profile → team roles → SOP customization → first project walkthrough. Reduces time-to-value and increases retention.', priority: 'medium', status: 'pending', portal: 'Admin', effort: '6h', createdAt: '', updatedAt: '', votes: { agree: ['design', 'operations'], disagree: [], abstain: [] } },
    ],
    'Competitive': [
      { id: '', agentId: 'strategy', area: 'Pricing', title: 'Build usage-based pricing into the platform', description: 'Track projects processed, users active, and API calls. Display usage metrics in admin. This data supports per-seat or per-project pricing models for enterprise customers.', priority: 'low', status: 'pending', portal: 'Admin', effort: '4h', createdAt: '', updatedAt: '', votes: { agree: ['engineering'], disagree: [], abstain: ['operations'] } },
    ],
    'Landing': [
      { id: '', agentId: 'strategy', area: 'Conversion', title: 'Add social proof section with metrics', description: 'Landing page needs: "X projects processed, $Y in funds released, Z% reduction in QC failures." Even with demo data, showing these metrics builds credibility and demonstrates platform capability.', priority: 'medium', status: 'pending', portal: 'Landing', effort: '2h', createdAt: '', updatedAt: '', votes: { agree: ['design', 'operations'], disagree: [], abstain: [] } },
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

    // Simulate each agent responding (staggered)
    for (const agent of councilState.agents) {
      await new Promise(r => setTimeout(r, 800 + Math.random() * 1200));

      const response = generateDirectiveResponse(agent, text);
      directive.responses.push(response);
      notify();
    }

    directive.status = 'completed';
    notify();

    return directive;
  },

  // Build consensus from all agent recommendations
  buildConsensus(topic: string): ConsensusReport {
    const allRecs = this.getAllRecommendations();
    const criticalRecs = allRecs.filter(r => r.priority === 'critical');
    const highRecs = allRecs.filter(r => r.priority === 'high');

    // Find agreements (recommendations that multiple agents' votes support)
    const agreements = allRecs
      .filter(r => r.votes.agree.length >= 2)
      .map(r => `${r.title} (${r.votes.agree.length + 1} agents agree)`);

    // Find disagreements
    const disagreements = allRecs
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
      summary: `Platform score: ${avgScore}/100. Code analysis: ${stats.fixed} findings fixed, ${stats.partial} in progress, ${stats.open} open, ${stats.councilWrong} original findings were incorrect. ${criticalRecs.length} critical and ${highRecs.length} high-priority recommendations remain.`,
      agreements,
      disagreements,
      prioritizedActions,
      overallScore: Math.round(avgScore),
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
 * Instead of returning canned text, this searches the code analysis
 * manifest for findings relevant to the user's question, then builds
 * a response that references actual implementation status, file paths,
 * and remaining work. This makes the council a real troubleshooting tool.
 */
function generateDirectiveResponse(agent: CouncilAgent, directiveText: string): DirectiveResponse {
  const lower = directiveText.toLowerCase();
  const analysis = getAgentAnalysis(agent.id);

  // ── 1. Find relevant findings ─────────────────────────────────
  // Search the manifest for matches to the user's query
  const relevantFindings = analysis?.findings.filter(f => {
    const haystack = `${f.title} ${f.councilClaim} ${f.remainingWork || ''} ${f.evidence.map(e => e.notes || '').join(' ')}`.toLowerCase();
    // Split query into keywords (3+ chars) and check if any match
    const keywords = lower.split(/\s+/).filter(w => w.length >= 3);
    return keywords.some(kw => haystack.includes(kw));
  }) || [];

  // Also search across ALL agents if this agent has no specific matches
  const crossAgentMatches = relevantFindings.length === 0
    ? searchFindings(directiveText).slice(0, 3)
    : [];

  // ── 2. Build context-aware response text ──────────────────────
  const allMatches = relevantFindings.length > 0 ? relevantFindings : crossAgentMatches;
  const fixedCount = allMatches.filter(f => f.realStatus === 'fixed').length;
  const openCount = allMatches.filter(f => f.realStatus === 'open').length;
  const partialCount = allMatches.filter(f => f.realStatus === 'partial').length;

  let text: string;
  let recommendations: string[];
  let confidence: number;

  if (allMatches.length > 0) {
    // Build detailed response from real findings
    const findingSummaries = allMatches.slice(0, 4).map(f => {
      const status = f.realStatus === 'fixed' ? '✓ Fixed'
        : f.realStatus === 'partial' ? '◐ Partial'
        : f.realStatus === 'council_wrong' ? '✗ Not a bug'
        : '○ Open';
      const file = f.evidence[0]?.file || 'N/A';
      const detail = f.realStatus === 'open' && f.remainingWork
        ? ` — ${f.remainingWork}`
        : f.realStatus === 'fixed' && f.evidence[0]?.notes
        ? ` — ${f.evidence[0].notes}`
        : '';
      return `[${status}] ${f.title} (${file})${detail}`;
    });

    const summary = analysis
      ? `Score: ${analysis.currentScore}/100 across ${Object.keys(analysis.scoreBreakdown).join(', ')}.`
      : '';

    text = `Found ${allMatches.length} related finding(s) in my analysis. ${fixedCount} resolved, ${partialCount} in progress, ${openCount} remaining.\n\n${findingSummaries.join('\n\n')}\n\n${summary}`;

    recommendations = allMatches
      .filter(f => f.realStatus === 'open' || f.realStatus === 'partial')
      .slice(0, 4)
      .map(f => f.remainingWork || f.title);

    confidence = allMatches.length > 2 ? 0.92 : allMatches.length > 0 ? 0.85 : 0.65;
  } else {
    // No specific matches — give general agent-perspective answer
    const agentPerspectives: Record<string, string> = {
      design: `From my analysis (score: ${analysis?.currentScore || '?'}/100), the key open areas are: ${analysis?.findings.filter(f => f.realStatus === 'open').map(f => f.title).join(', ') || 'none identified'}. For your specific question, I'd need more context about which portal or component you're referring to.`,
      engineering: `Engineering health is at ${analysis?.currentScore || '?'}/100. Open items: ${analysis?.findings.filter(f => f.realStatus === 'open').map(f => f.title).join(', ') || 'none'}. The biggest architectural gaps are Zustand migration and Supabase RLS policies.`,
      qa: `QA score: ${analysis?.currentScore || '?'}/100. Most critical bugs have been fixed. Remaining edge cases: ${analysis?.findings.filter(f => f.realStatus === 'open').map(f => f.title).join(', ') || 'none found'}. The notification persistence issue is the top remaining gap.`,
      operations: `Operations compliance is at ${analysis?.currentScore || '?'}/100. State machine and audit trail are live. Open items: ${analysis?.findings.filter(f => f.realStatus === 'open' || f.realStatus === 'partial').map(f => f.title).join(', ') || 'all clear'}.`,
      strategy: `Strategic score: ${analysis?.currentScore || '?'}/100. Biggest opportunity gaps: ${analysis?.findings.filter(f => f.realStatus === 'open').map(f => f.title).join(', ') || 'none'}. Risk mitigation positioning and social proof are already live.`,
    };

    text = agentPerspectives[agent.id] || `I don't have specific findings matching your query. My current score is ${analysis?.currentScore || '?'}/100.`;

    recommendations = analysis?.findings
      .filter(f => f.realStatus === 'open')
      .slice(0, 3)
      .map(f => f.title) || [];

    confidence = 0.65;
  }

  return {
    agentId: agent.id,
    text,
    recommendations,
    timestamp: new Date().toISOString(),
    confidence,
  };
}

export default CouncilAPI;
