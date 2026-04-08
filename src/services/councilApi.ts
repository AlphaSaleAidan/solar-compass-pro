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

    // Simulate each agent responding (staggered — appears like real thinking)
    for (const agent of councilState.agents) {
      // Vary delay to feel organic: 0.8-2.0s between agents
      await new Promise(r => setTimeout(r, 800 + Math.random() * 1200));

      // Set agent status to 'reviewing' during thinking
      agent.status = 'reviewing';
      notify();

      // Short "thinking" pause
      await new Promise(r => setTimeout(r, 300 + Math.random() * 500));

      const response = generateDirectiveResponse(agent, text, directive.responses);
      directive.responses.push(response);

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
 * Each agent responds from their unique perspective with real data-backed
 * analysis. Responses avoid repetition by checking what previous agents
 * already said and covering new ground. Each agent has distinct personality,
 * concerns, and recommendations.
 */
function generateDirectiveResponse(agent: CouncilAgent, directiveText: string, previousResponses: DirectiveResponse[] = []): DirectiveResponse {
  const lower = directiveText.toLowerCase();
  const analysis = getAgentAnalysis(agent.id);

  // ── Topic classification ──────────────────────────────────────
  // Classify the question to route to the right response template
  const topics = {
    installer: /install|milestone|m[1-7]|pto|permit|inspection|panel|roof|crew/i.test(lower),
    financier: /financ|fund|escrow|portfolio|capital|release|payment|risk/i.test(lower),
    sales: /sales|pipeline|sell|convert|lead|proposal|close|rep|commission/i.test(lower),
    ops: /ops|operation|qc|review|approve|reject|compliance|sop|audit/i.test(lower),
    council: /council|agent|recommend|review|score|finding/i.test(lower),
    auth: /auth|login|role|permission|rbac|admin|access/i.test(lower),
    performance: /performance|speed|load|slow|optimize|bundle|build/i.test(lower),
    data: /data|mock|fake|real|connect|sync|supabase|database/i.test(lower),
    design: /design|ui|ux|visual|animation|transition|color|theme|style|sleek/i.test(lower),
    bug: /bug|error|crash|broken|fix|issue|problem|wrong/i.test(lower),
    general: true,
  };
  const primaryTopic = Object.entries(topics).find(([_, v]) => v && _ !== 'general')?.[0] || 'general';

  // Gather relevant findings from this agent's manifest
  const relevantFindings = analysis?.findings.filter(f => {
    const haystack = `${f.title} ${f.councilClaim} ${f.remainingWork || ''} ${f.evidence.map(e => e.notes || '').join(' ')}`.toLowerCase();
    const keywords = lower.split(/\s+/).filter(w => w.length >= 3);
    return keywords.some(kw => haystack.includes(kw));
  }) || [];

  // Cross-agent search if this agent has no direct matches
  const crossMatches = relevantFindings.length === 0 ? searchFindings(directiveText).slice(0, 3) : [];
  const allMatches = relevantFindings.length > 0 ? relevantFindings : crossMatches;

  // Avoid repeating what other agents already said
  const prevTopics = new Set(previousResponses.flatMap(r => r.recommendations.map(x => x.toLowerCase().slice(0, 30))));

  // ── Agent-specific perspectives ─────────────────────────────
  const openItems = analysis?.findings.filter(f => f.realStatus === 'open') || [];
  const partialItems = analysis?.findings.filter(f => f.realStatus === 'partial') || [];
  const fixedItems = analysis?.findings.filter(f => f.realStatus === 'fixed') || [];
  const score = analysis?.currentScore || 0;

  // Generate a unique question hash to vary responses
  const qHash = lower.split('').reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0);

  // ── Topic-aware response templates ─────────────────────────
  // Each agent has different things to say depending on what's being asked about
  const topicInsights: Record<string, Record<string, { perspective: string; recs: string[] }>> = {
    design: {
      installer: { perspective: 'The installer portal UX needs work on the milestone progression flow. The M1-M7 timeline could use better visual progress states, and the checklist items need clearer upload/completion indicators.', recs: ['Redesign milestone progress indicators with step-by-step visual flow', 'Add drag-drop zones for document uploads'] },
      financier: { perspective: 'The financier portal should feel like a financial dashboard — clean typography, data-dense tables with subtle color coding. The escrow and portfolio tabs need clearer data hierarchy.', recs: ['Add sparkline charts for fund release trends', 'Improve portfolio card density and scan-ability'] },
      sales: { perspective: 'The sales pipeline cards look good but need more depth. Hover states should reveal key metrics. The conversion funnel should feel interactive and alive.', recs: ['Add pipeline card hover previews with key metrics', 'Design conversion funnel animation'] },
      ops: { perspective: 'The operations portal needs visual priority indicators for QC reviews. Projects in different states should be immediately distinguishable at a glance.', recs: ['Add color-coded state badges to project rows', 'Design QC review dashboard with urgency indicators'] },
      design: { perspective: 'Overall design language is cohesive. The glass-morphism works well but some areas lack contrast. Micro-interactions on buttons and cards would elevate the feel significantly.', recs: ['Add subtle scale/glow on button hovers across all portals', 'Improve contrast ratios on muted text elements'] },
      performance: { perspective: 'Animations might be contributing to perceived slowness. We should audit framer-motion usage and ensure we\'re not re-rendering entire lists during transitions.', recs: ['Audit animation performance on lower-end devices', 'Use layout animations instead of full re-renders'] },
      data: { perspective: 'When data loads, there should be skeleton states, not blank areas. Loading choreography makes the app feel premium.', recs: ['Add skeleton loading states for all data sections', 'Design loading choreography sequence'] },
      bug: { perspective: 'Visual bugs often hide in edge states — empty lists, long text overflow, responsive breakpoints. These need systematic testing.', recs: ['Test all portals at mobile/tablet breakpoints', 'Add text truncation with tooltips for overflow'] },
      auth: { perspective: 'The login experience sets first impressions. It should feel secure and premium — animated background, smooth transitions.', recs: ['Add subtle background animation to login page', 'Smooth transition from login to dashboard'] },
      general: { perspective: 'The platform visual quality is strong overall. Areas for improvement: micro-interactions, loading states, and edge case styling.', recs: ['Polish hover and focus states across all interactive elements', 'Add empty state illustrations'] },
    },
    engineering: {
      installer: { perspective: 'The installer portal loads all project data upfront. For scale, we need pagination or virtual scrolling. The milestone state updates should use optimistic UI with rollback.', recs: ['Add virtual scrolling for large project lists', 'Implement optimistic updates for milestone changes'] },
      financier: { perspective: 'Fund release calculations are client-side. This should move to Supabase edge functions for audit compliance. Risk flag computation should be server-side too.', recs: ['Move fund calculations to Supabase edge functions', 'Add server-side risk assessment'] },
      sales: { perspective: 'The sell project flow uses client-side validation only. We need Zod schemas wired to the actual form fields, plus server-side validation on insert.', recs: ['Wire Zod schemas to SellProjectCard form', 'Add server-side validation on project creation'] },
      ops: { perspective: 'The state machine is in place but transitions aren\'t enforced at the database level. We need RLS policies and database triggers for compliance.', recs: ['Create Supabase RLS policies for role enforcement', 'Add database triggers for state transition validation'] },
      performance: { perspective: 'The bundle is 1.5MB gzipped. We should code-split each portal, lazy-load Three.js, and tree-shake unused Lucide icons.', recs: ['Lazy-load portal components with React.lazy', 'Tree-shake Lucide icons and code-split Three.js'] },
      data: { perspective: 'Currently using Supabase REST queries. We should add Realtime channels for live updates — when an installer completes a milestone, the ops and financier portals should update instantly.', recs: ['Implement Supabase Realtime channels for cross-portal sync', 'Add real-time notification push on state changes'] },
      auth: { perspective: 'Auth is functional but roles are hardcoded. We need to load roles from the Supabase profiles table and apply RLS policies based on role.', recs: ['Load user role from Supabase profiles on login', 'Generate RLS migration for role-based access'] },
      bug: { perspective: 'Error boundaries catch component crashes, but we need better error reporting. Unhandled promise rejections and network errors should show user-friendly messages.', recs: ['Add global error handler for network failures', 'Implement user-friendly error toast notifications'] },
      general: { perspective: 'Architecture is solid for beta. Key gaps: Realtime sync, RLS policies, and code splitting. These are the three biggest technical debts.', recs: ['Implement Supabase Realtime for live sync', 'Add RLS policies and code-split portals'] },
    },
    qa: {
      installer: { perspective: 'I\'d flag the milestone progression flow for regression testing. Key scenarios: completing all M1 checklist items, uploading files, marking milestones done in sequence vs. out of order.', recs: ['Test: complete M1-M7 in order with all checklist items', 'Test: attempt to skip milestone — verify guard blocks it'] },
      financier: { perspective: 'The fund release flow needs edge case testing: releasing when balance is zero, double-clicking release button, releasing for a project that\'s been put on hold.', recs: ['Test: fund release with zero-balance edge case', 'Test: concurrent fund release attempts'] },
      sales: { perspective: 'The sell project form needs validation testing: empty fields, negative numbers, extremely long customer names, special characters in addresses.', recs: ['Test: form submission with invalid/edge data', 'Test: duplicate project name handling'] },
      ops: { perspective: 'QC review flow is critical. Test: approving a project then reverting, rejecting with notes, approving a project with missing checklist items.', recs: ['Test: QC approve → revert → re-approve flow', 'Test: rejection with mandatory notes'] },
      data: { perspective: 'Data integrity is the top QA concern. All Supabase queries should handle null/undefined gracefully. Test with empty databases and populated databases.', recs: ['Test all portals with empty Supabase data', 'Test data display with null/missing fields'] },
      bug: { perspective: 'Current open bugs are mostly edge cases. The highest risk items are around state transitions and data display when projects have incomplete data.', recs: ['Prioritize fixing state transition edge cases', 'Add null guards for all data display components'] },
      general: { perspective: 'Core happy paths are solid. Risk areas: edge cases in milestone flow, fund releases, and data display with incomplete project records.', recs: ['Run full regression on M1-M7 lifecycle', 'Test all portals with newly created (sparse) projects'] },
    },
    operations: {
      installer: { perspective: 'SOP compliance for installers requires every milestone have documented evidence before progression. Current implementation has the checklist but doesn\'t enforce all items before advancing.', recs: ['Enforce all checklist items required before milestone advance', 'Add document retention policy for uploaded evidence'] },
      financier: { perspective: 'Fund release operations need dual-approval for amounts over thresholds. The current single-click release doesn\'t meet audit requirements for enterprise clients.', recs: ['Implement dual-approval for fund releases above threshold', 'Add fund release audit trail with timestamps'] },
      sales: { perspective: 'Sales to operations handoff needs a formal QC gate. Currently a sold project enters ops immediately — we need mandatory QC review before it becomes active.', recs: ['Add mandatory QC gate between sales and operations', 'Create handoff checklist for sales-to-ops transition'] },
      ops: { perspective: 'The operations portal is the compliance backbone. Audit trail is logging but there\'s no admin viewer yet. For beta, we need at minimum a read-only audit log viewer.', recs: ['Build audit log viewer for admin users', 'Add compliance dashboard with SOP adherence metrics'] },
      auth: { perspective: 'Role-based access is essential for operations. Installers shouldn\'t see financier data, and regional managers need different permissions than divisional.', recs: ['Implement role hierarchy: Admin > VP > Regional > Divisional > Manager', 'Add permission gates to sensitive operations data'] },
      general: { perspective: 'State machine and audit trail are live. Next operational priorities: notification routing, role-based permissions, and a compliance dashboard.', recs: ['Build notification routing for all stakeholders', 'Create SOP compliance dashboard for management'] },
    },
    strategy: {
      installer: { perspective: 'The installer experience is a key differentiator. If installers prefer ASP over competitors\' portals, they become our evangelists. Make it so good they recommend us.', recs: ['Benchmark installer UX against competitor platforms', 'Add installer NPS tracking after milestone completion'] },
      financier: { perspective: 'Financier trust is everything. The portfolio view should feel like Bloomberg Terminal — data-dense, real-time, authoritative. Risk flags should feel automated and intelligent.', recs: ['Design financier dashboard for institutional trust', 'Add automated risk scoring with transparent methodology'] },
      sales: { perspective: 'The sales pipeline is revenue. Every friction point in the sell flow costs money. Optimize for speed — a rep should be able to create a project in under 2 minutes.', recs: ['Time the sell flow and reduce to under 2 minutes', 'Add quick-sell templates for common system configurations'] },
      ops: { perspective: 'Operations efficiency is ASP\'s moat. If we can show 30% faster time-to-PTO compared to manual processes, that\'s the key selling metric.', recs: ['Track and display time-to-PTO metrics', 'Build ROI calculator showing ASP efficiency gains'] },
      data: { perspective: 'Real data is the beta milestone. Every mock data point remaining undermines credibility with early users. Prioritize complete data connectivity.', recs: ['Audit and eliminate all remaining mock data', 'Ensure all metrics are computed from real Supabase data'] },
      general: { perspective: 'The platform is feature-complete for beta. Strategic priorities: onboard real users, collect feedback, track usage metrics, and iterate based on data.', recs: ['Design customer onboarding flow for first 10 beta users', 'Build usage analytics to inform pricing decisions'] },
    },
  };

  // Build unique, opinionated response per agent role
  const agentResponders: Record<string, () => { text: string; recs: string[]; conf: number }> = {
    design: () => {
      const insight = topicInsights.design[primaryTopic] || topicInsights.design.general;
      const hasMatches = allMatches.length > 0;

      let text = `Aurora here. Visual quality score: ${score}/100.\n\n`;

      // Topic-specific insight first
      text += insight.perspective;

      // Then relevant findings if any
      if (hasMatches) {
        text += `\n\nRelated findings from my code review:`;
        allMatches.slice(0, 2).forEach(f => {
          const st = f.realStatus === 'fixed' ? '✓' : f.realStatus === 'partial' ? '◐' : '○';
          text += `\n${st} ${f.title}`;
        });
      }

      // Unique recommendation based on question + topic
      const contextRec = insight.recs[Math.abs(qHash) % insight.recs.length];
      text += `\n\nMy top recommendation: ${contextRec}`;

      const recs = insight.recs.filter(r => !prevTopics.has(r.toLowerCase().slice(0, 30)));
      return { text, recs: recs.length > 0 ? recs : insight.recs, conf: hasMatches ? 0.91 : 0.82 };
    },

    engineering: () => {
      const insight = topicInsights.engineering[primaryTopic] || topicInsights.engineering.general;

      let text = `Forge reporting. Engineering health: ${score}/100.\n\n`;
      text += insight.perspective;

      if (allMatches.length > 0) {
        text += `\n\nCode analysis findings:`;
        allMatches.slice(0, 2).forEach(f => {
          const st = f.realStatus === 'fixed' ? '✓' : f.realStatus === 'partial' ? '◐' : '○';
          text += `\n[${st}] ${f.title}`;
          if (f.evidence[0]?.file) text += ` (${f.evidence[0].file})`;
          if (f.remainingWork && f.realStatus !== 'fixed') text += `\n  → ${f.remainingWork}`;
        });
      }

      text += `\n\nEngineering priority: ${insight.recs[0]}`;

      const recs = insight.recs.filter(r => !prevTopics.has(r.toLowerCase().slice(0, 30)));
      return { text, recs: recs.length > 0 ? recs : insight.recs, conf: allMatches.length > 0 ? 0.93 : 0.80 };
    },

    qa: () => {
      const insight = topicInsights.qa[primaryTopic] || topicInsights.qa.general;

      let text = `Sentinel here. QA confidence: ${score}/100.\n\n`;
      text += insight.perspective;

      if (allMatches.length > 0) {
        text += `\n\nKnown issues in this area:`;
        allMatches.slice(0, 2).forEach(f => {
          const st = f.realStatus === 'fixed' ? '✓ Verified' : f.realStatus === 'partial' ? '◐ Partial' : '○ Open';
          text += `\n[${st}] ${f.title}`;
        });
      }

      const bugCount = openItems.length;
      text += `\n\n${bugCount} open items remaining. ${insight.recs[Math.abs(qHash) % insight.recs.length]} should be the immediate focus.`;

      const recs = insight.recs.filter(r => !prevTopics.has(r.toLowerCase().slice(0, 30)));
      return { text, recs: recs.length > 0 ? recs : insight.recs, conf: allMatches.length > 0 ? 0.90 : 0.76 };
    },

    operations: () => {
      const insight = topicInsights.operations[primaryTopic] || topicInsights.operations.general;

      let text = `Nexus here. Operational compliance: ${score}/100.\n\n`;
      text += insight.perspective;

      if (allMatches.length > 0) {
        text += `\n\nCompliance findings:`;
        allMatches.slice(0, 2).forEach(f => {
          const st = f.realStatus === 'fixed' ? '✓' : f.realStatus === 'partial' ? '◐' : '○';
          text += `\n${st} ${f.title}: ${f.councilClaim}`;
        });
      }

      text += `\n\nSOP status: State machine live, audit trail active. Next priority: ${insight.recs[0]}`;

      const recs = insight.recs.filter(r => !prevTopics.has(r.toLowerCase().slice(0, 30)));
      return { text, recs: recs.length > 0 ? recs : insight.recs, conf: allMatches.length > 0 ? 0.88 : 0.74 };
    },

    strategy: () => {
      const insight = topicInsights.strategy[primaryTopic] || topicInsights.strategy.general;

      let text = `Oracle here. Strategic assessment: ${score}/100.\n\n`;
      text += insight.perspective;

      if (allMatches.length > 0) {
        text += `\n\nStrategic relevance:`;
        allMatches.slice(0, 2).forEach(f => {
          const st = f.realStatus === 'fixed' ? '✓' : f.realStatus === 'partial' ? '◐' : '○';
          text += `\n${st} ${f.title}`;
        });
      }

      text += `\n\nStrategic recommendation: ${insight.recs[Math.abs(qHash) % insight.recs.length]}`;

      const recs = insight.recs.filter(r => !prevTopics.has(r.toLowerCase().slice(0, 30)));
      return { text, recs: recs.length > 0 ? recs : insight.recs, conf: allMatches.length > 0 ? 0.89 : 0.77 };
    },
  };

  const responder = agentResponders[agent.id];
  const result = responder ? responder() : { text: `Score: ${score}/100. No specific analysis available.`, recs: [], conf: 0.5 };

  return {
    agentId: agent.id,
    text: result.text,
    recommendations: result.recs,
    timestamp: new Date().toISOString(),
    confidence: result.conf,
  };
}

export default CouncilAPI;
