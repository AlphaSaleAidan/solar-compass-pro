/**
 * CouncilDashboard — LLM Council Management for Alpha Sale Pro
 *
 * Shows AI agent roles, their portal reviews, improvement recommendations,
 * and lets the CTO/CEO manage tasks and priorities.
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Shield, Paintbrush, Code, ClipboardCheck, Activity,
  ChevronDown, ChevronUp, CheckCircle2, Circle, Clock,
  AlertTriangle, Star, Zap, MessageSquare, Settings, Eye,
  ArrowRight, BarChart3, Users, Layers, RefreshCw
} from 'lucide-react';

/* ─── Agent Definitions ──────────────────────────────────────────── */

interface AgentRecommendation {
  id: string;
  area: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed' | 'deferred';
  portal: string;
  effort: string;
}

interface CouncilAgent {
  id: string;
  name: string;
  role: string;
  description: string;
  icon: typeof Brain;
  color: string;
  model: string;
  status: 'active' | 'idle' | 'reviewing';
  lastReview: string;
  reviewScore: number;
  recommendations: AgentRecommendation[];
}

const COUNCIL_AGENTS: CouncilAgent[] = [
  {
    id: 'design',
    name: 'Aurora',
    role: 'Design Director',
    description: 'Reviews UI/UX, visual consistency, animations, and sex appeal across all portals.',
    icon: Paintbrush,
    color: '#8b5cf6',
    model: 'Claude Sonnet 4.5',
    status: 'active',
    lastReview: '2026-04-07 20:00',
    reviewScore: 82,
    recommendations: [
      { id: 'd1', area: 'Landing Page', title: 'Scroll-triggered section reveals need GSAP stagger', description: 'The About, Features, and Portals sections appear abruptly. Add scroll-triggered blur-to-sharp reveals with staggered card entrances for cinematic flow.', priority: 'high', status: 'in_progress', portal: 'Landing', effort: '2h' },
      { id: 'd2', area: 'Portal Cards', title: 'Glass-panel hover states need depth', description: 'Cards should lift on hover with a subtle shadow + scale transform. Current hover is too flat. Add translateY(-2px) + box-shadow expansion.', priority: 'medium', status: 'in_progress', portal: 'All Portals', effort: '1h' },
      { id: 'd3', area: 'Typography', title: 'Heading hierarchy needs more contrast', description: 'Portal section headings blend into body text. Use gradient text or larger font-weight differential. The Inter font is solid but needs sizing polish.', priority: 'medium', status: 'pending', portal: 'All Portals', effort: '30m' },
      { id: 'd4', area: 'Financier Portal', title: 'Fund release flow needs visual feedback', description: 'When approving or releasing funds, there\'s no satisfying visual confirmation. Add a pulse animation + confetti burst on fund release.', priority: 'low', status: 'pending', portal: 'Financier', effort: '1h' },
      { id: 'd5', area: 'Mobile', title: 'Responsive breakpoints need attention', description: '3D background is GPU-intensive on mobile. Add reduced-motion media query and simpler fallback. Card grids should stack properly below 768px.', priority: 'high', status: 'pending', portal: 'All', effort: '3h' },
    ],
  },
  {
    id: 'engineering',
    name: 'Forge',
    role: 'Engineering Lead',
    description: 'Reviews code architecture, performance, bundle size, and technical debt.',
    icon: Code,
    color: '#00d4c8',
    model: 'GPT 5.1',
    status: 'active',
    lastReview: '2026-04-07 20:00',
    reviewScore: 75,
    recommendations: [
      { id: 'e1', area: 'Performance', title: 'Code-split Three.js into lazy chunk', description: 'The bundle is 2.3MB. Three.js + R3F should be lazy-loaded with React.lazy() and Suspense. Could save 800KB from initial load for users who navigate directly to portals.', priority: 'critical', status: 'pending', portal: 'All', effort: '2h' },
      { id: 'e2', area: 'State Management', title: 'Project deletion sync needs event bus', description: 'Cross-portal deletion now works via shared context, but real-time sync between browser tabs requires a BroadcastChannel or localStorage event listener.', priority: 'high', status: 'in_progress', portal: 'All Portals', effort: '2h' },
      { id: 'e3', area: 'Auth', title: 'Production auth needs role-based access control', description: 'Master admin (apierce@alphasale.co) needs to see all portals. Sub-positions (Manager, Divisional, Regional, VP) need scoped access. Currently all demo roles see everything.', priority: 'high', status: 'pending', portal: 'Auth', effort: '4h' },
      { id: 'e4', area: 'Data Layer', title: 'Supabase real-time subscriptions for live sync', description: 'Production mode should use Supabase Realtime channels so changes in one portal instantly appear in others without page refresh.', priority: 'medium', status: 'pending', portal: 'All Portals', effort: '3h' },
      { id: 'e5', area: 'Build', title: 'Add Vite PWA plugin for offline support', description: 'Solar installers often work in areas with poor connectivity. Service worker + offline caching would make the app usable in the field.', priority: 'low', status: 'pending', portal: 'Installer', effort: '2h' },
    ],
  },
  {
    id: 'qa',
    name: 'Sentinel',
    role: 'QA Manager',
    description: 'Tests all portal flows, catches bugs, validates SOP compliance, and checks edge cases.',
    icon: Shield,
    color: '#f59e0b',
    model: 'Gemini 3 Pro',
    status: 'active',
    lastReview: '2026-04-07 20:00',
    reviewScore: 70,
    recommendations: [
      { id: 'q1', area: 'Installer Portal', title: 'M1-M7 milestone actions not wired', description: 'Milestone checklist items can be toggled but the actual workflow gates (QC review → fund request → release) don\'t enforce SOP order. An installer can skip M2 and go to M4.', priority: 'critical', status: 'pending', portal: 'Installer', effort: '4h' },
      { id: 'q2', area: 'Financier Portal', title: 'Fund release has no approval chain', description: 'The financier can release funds directly without ops verification. SOP requires: Installer completes milestone → Ops verifies → Financier reviews → Fund released.', priority: 'critical', status: 'pending', portal: 'Financier', effort: '3h' },
      { id: 'q3', area: 'Sales Portal', title: 'New deal submission needs validation', description: 'The sell sheet form allows submission with empty required fields. Aurora data import can fail silently if the format is unexpected.', priority: 'high', status: 'pending', portal: 'Sales', effort: '2h' },
      { id: 'q4', area: 'Cross-Portal', title: 'Notification cascade missing', description: 'When a milestone is approved in Installer Portal, the Financier and Ops portals should receive a notification. Currently there\'s no notification system.', priority: 'high', status: 'pending', portal: 'All Portals', effort: '3h' },
      { id: 'q5', area: 'Login', title: 'Demo login flow needs error handling', description: 'Entering wrong demo credentials shows no error message. The ASP/ASP+ toggle can confuse users about which roles are available.', priority: 'medium', status: 'pending', portal: 'Auth', effort: '1h' },
    ],
  },
  {
    id: 'ops',
    name: 'Nexus',
    role: 'Operations Director',
    description: 'Reviews business logic, SOP compliance, workflow efficiency, and operational gaps.',
    icon: ClipboardCheck,
    color: '#22c55e',
    model: 'Grok 4',
    status: 'active',
    lastReview: '2026-04-07 20:00',
    reviewScore: 68,
    recommendations: [
      { id: 'o1', area: 'SOP Compliance', title: 'Master SOP v2.0 not fully integrated', description: 'The SOP document defines 7 milestones with specific checklist items, actors, and gates. Only basic checklist toggling is implemented. Need full SOP enforcement engine.', priority: 'critical', status: 'pending', portal: 'All Portals', effort: '8h' },
      { id: 'o2', area: 'Workflow', title: 'Project lifecycle needs state machine', description: 'Projects should follow: New → QC Review → Active → M1-M7 → Completed. Currently any state transition is possible. Need a proper state machine with guards.', priority: 'high', status: 'pending', portal: 'All Portals', effort: '4h' },
      { id: 'o3', area: 'Reporting', title: 'No executive dashboard or KPIs', description: 'CEO/VP level users need aggregate views: total pipeline value, conversion rates, average milestone completion time, installer performance rankings.', priority: 'high', status: 'pending', portal: 'Master', effort: '4h' },
      { id: 'o4', area: 'Communication', title: 'Project messaging needs role tagging', description: 'Messages in project threads don\'t notify the right people. Need @-mentions and role-based notification routing (e.g., @installer, @financier).', priority: 'medium', status: 'pending', portal: 'All Portals', effort: '2h' },
      { id: 'o5', area: 'Audit Trail', title: 'No activity log for compliance', description: 'Every action (milestone approval, fund release, document upload) needs a timestamped audit trail with actor identity for compliance and dispute resolution.', priority: 'high', status: 'pending', portal: 'All Portals', effort: '3h' },
    ],
  },
];

/* ─── Priority Badge ──────────────────────────────────────────────── */

const PriorityBadge = ({ priority }: { priority: string }) => {
  const colors = {
    critical: 'bg-red-500/20 text-red-400 border-red-500/30',
    high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  };
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${colors[priority as keyof typeof colors] || colors.medium}`}>
      {priority}
    </span>
  );
};

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case 'completed': return <CheckCircle2 className="w-4 h-4 text-green-400" />;
    case 'in_progress': return <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" style={{ animationDuration: '3s' }} />;
    case 'deferred': return <Clock className="w-4 h-4 text-gray-500" />;
    default: return <Circle className="w-4 h-4 text-gray-500" />;
  }
};

/* ─── Agent Card ──────────────────────────────────────────────────── */

const AgentCard = ({ agent, onToggle, isExpanded }: {
  agent: CouncilAgent;
  onToggle: () => void;
  isExpanded: boolean;
}) => {
  const Icon = agent.icon;
  const criticalCount = agent.recommendations.filter(r => r.priority === 'critical').length;
  const completedCount = agent.recommendations.filter(r => r.status === 'completed').length;

  return (
    <motion.div
      layout
      className="glass-panel overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Agent Header */}
      <button onClick={onToggle} className="w-full p-5 flex items-center gap-4 text-left hover:bg-white/[0.02] transition-colors">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${agent.color}15`, border: `1px solid ${agent.color}30` }}>
          <Icon className="w-6 h-6" style={{ color: agent.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-sm">{agent.name}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-mono" style={{ background: `${agent.color}15`, color: agent.color, border: `1px solid ${agent.color}30` }}>
              {agent.role}
            </span>
            <div className="flex items-center gap-1 ml-auto">
              {criticalCount > 0 && (
                <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/20">
                  <AlertTriangle className="w-3 h-3" /> {criticalCount} critical
                </span>
              )}
              <span className="text-[10px] text-gray-500">{completedCount}/{agent.recommendations.length}</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-0.5 truncate">{agent.description}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-[10px] text-gray-500 font-mono">{agent.model}</span>
            <span className="text-[10px] text-gray-600">•</span>
            <span className="text-[10px] text-gray-500">Last review: {agent.lastReview}</span>
            <span className="text-[10px] text-gray-600">•</span>
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3" style={{ color: agent.color }} />
              <span className="text-[10px] font-bold" style={{ color: agent.color }}>{agent.reviewScore}/100</span>
            </div>
          </div>
        </div>
        <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-5 h-5 text-gray-500" />
        </motion.div>
      </button>

      {/* Recommendations List */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-2 border-t border-white/[0.04] pt-4">
              {agent.recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors group"
                >
                  <StatusIcon status={rec.status} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-xs text-white">{rec.title}</span>
                      <PriorityBadge priority={rec.priority} />
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.05] text-gray-400 border border-white/[0.06]">{rec.portal}</span>
                      <span className="text-[10px] text-gray-600 ml-auto">{rec.effort}</span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">{rec.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/* ─── Summary Stats ──────────────────────────────────────────────── */

const SummaryStats = ({ agents }: { agents: CouncilAgent[] }) => {
  const allRecs = agents.flatMap(a => a.recommendations);
  const total = allRecs.length;
  const critical = allRecs.filter(r => r.priority === 'critical').length;
  const inProgress = allRecs.filter(r => r.status === 'in_progress').length;
  const completed = allRecs.filter(r => r.status === 'completed').length;
  const avgScore = Math.round(agents.reduce((sum, a) => sum + a.reviewScore, 0) / agents.length);

  const stats = [
    { label: 'Total Issues', value: total, icon: Layers, color: '#00d4c8' },
    { label: 'Critical', value: critical, icon: AlertTriangle, color: '#ef4444' },
    { label: 'In Progress', value: inProgress, icon: RefreshCw, color: '#3b82f6' },
    { label: 'Completed', value: completed, icon: CheckCircle2, color: '#22c55e' },
    { label: 'Avg Score', value: `${avgScore}/100`, icon: BarChart3, color: '#f59e0b' },
  ];

  return (
    <div className="grid grid-cols-5 gap-3">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <div key={s.label} className="glass-panel p-4 text-center">
            <Icon className="w-5 h-5 mx-auto mb-2" style={{ color: s.color }} />
            <div className="text-xl font-bold text-white">{s.value}</div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">{s.label}</div>
          </div>
        );
      })}
    </div>
  );
};

/* ─── Main Dashboard ──────────────────────────────────────────────── */

const CouncilDashboard = () => {
  const [expandedAgents, setExpandedAgents] = useState<Set<string>>(new Set(['design']));
  const [filter, setFilter] = useState<'all' | 'critical' | 'high' | 'in_progress'>('all');

  const toggleAgent = (id: string) => {
    setExpandedAgents(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const filteredAgents = useMemo(() => {
    if (filter === 'all') return COUNCIL_AGENTS;
    return COUNCIL_AGENTS.map(agent => ({
      ...agent,
      recommendations: agent.recommendations.filter(r => {
        if (filter === 'critical') return r.priority === 'critical';
        if (filter === 'high') return r.priority === 'critical' || r.priority === 'high';
        if (filter === 'in_progress') return r.status === 'in_progress';
        return true;
      }),
    })).filter(a => a.recommendations.length > 0);
  }, [filter]);

  return (
    <div className="min-h-screen pt-[70px] px-6 pb-12 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-3 mb-1">
          <Brain className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-black text-white tracking-tight">LLM Council</h1>
          <span className="text-[10px] px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 font-mono">v1.0</span>
        </div>
        <p className="text-sm text-gray-400 ml-11">AI agents reviewing Alpha Sale Pro from every angle. Managed by the CEO.</p>
      </motion.div>

      {/* Summary */}
      <SummaryStats agents={COUNCIL_AGENTS} />

      {/* Filters */}
      <div className="flex items-center gap-2 mt-6 mb-4">
        <span className="text-xs text-gray-500 mr-2">Filter:</span>
        {(['all', 'critical', 'high', 'in_progress'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
              filter === f
                ? 'bg-primary/15 text-primary border-primary/30'
                : 'bg-white/[0.03] text-gray-400 border-white/[0.06] hover:bg-white/[0.06]'
            }`}
          >
            {f === 'all' ? 'All Issues' : f === 'critical' ? '🔴 Critical' : f === 'high' ? '🟠 High+' : '🔄 In Progress'}
          </button>
        ))}
      </div>

      {/* Agent Cards */}
      <div className="space-y-3">
        {filteredAgents.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            isExpanded={expandedAgents.has(agent.id)}
            onToggle={() => toggleAgent(agent.id)}
          />
        ))}
      </div>

      {/* Council Directive */}
      <motion.div
        className="glass-panel p-6 mt-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-white text-sm">Council Synthesis</h3>
        </div>
        <p className="text-xs text-gray-300 leading-relaxed">
          The council has identified <strong className="text-white">4 critical issues</strong> that should be addressed before the next release:
          SOP milestone enforcement (Ops), fund release approval chain (QA), code splitting for performance (Engineering),
          and milestone scroll reveals (Design). The platform's visual identity has improved dramatically — the wireframe planets
          and dark glassmorphism create a cohesive, premium feel. The priority now shifts to operational depth:
          making the portal workflows actually enforce the business rules defined in the Master SOP v2.0.
        </p>
      </motion.div>
    </div>
  );
};

export default CouncilDashboard;
