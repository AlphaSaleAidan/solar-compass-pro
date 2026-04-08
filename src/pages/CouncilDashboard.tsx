/**
 * CouncilDashboard — LLM Council Management for Alpha Sale Pro
 *
 * Full management interface for the AI council:
 * - View all agents with status, scores, and recommendations
 * - Run reviews (single agent or full council)
 * - Submit CEO directives and see agent responses
 * - View consensus reports
 * - Manage recommendation statuses
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Shield, Paintbrush, Code, ClipboardCheck, Activity,
  ChevronDown, ChevronRight, CheckCircle, CheckCircle2, Circle, Clock,
  AlertTriangle, Star, Zap, MessageSquare, Settings, Eye,
  ArrowRight, ArrowLeft, BarChart3, Users, Layers, RefreshCw, Send,
  Play, Pause, Target, TrendingUp, FileText, Sparkles,
  Filter, Search, X, Hash, Compass
} from 'lucide-react';
import { toast } from 'sonner';
import CouncilAPI, {
  type CouncilAgent, type Recommendation, type Directive,
  type AgentRole, type Priority, type ReviewStatus, type ConsensusReport
} from '@/services/councilApi';

/* ─── Icon mapping ────────────────────────────────────────────────── */

const AGENT_ICONS: Record<AgentRole, typeof Brain> = {
  design: Paintbrush,
  engineering: Code,
  qa: Shield,
  operations: ClipboardCheck,
  strategy: Compass,
};

/* ─── Priority / Status helpers ───────────────────────────────────── */

const PRIORITY_COLORS: Record<Priority, string> = {
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

const STATUS_ICONS: Record<ReviewStatus, JSX.Element> = {
  pending: <Circle className="w-3.5 h-3.5 text-gray-500" />,
  in_progress: <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin" style={{ animationDuration: '3s' }} />,
  completed: <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />,
  deferred: <Clock className="w-3.5 h-3.5 text-gray-500" />,
  rejected: <X className="w-3.5 h-3.5 text-red-400" />,
};

/* ─── Tab Navigation ──────────────────────────────────────────────── */

type Tab = 'overview' | 'agents' | 'directives' | 'consensus';

/* ─── Main Component ──────────────────────────────────────────────── */

const CouncilDashboard = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('overview');
  const [state, setState] = useState(CouncilAPI.getState());
  const [expandedAgents, setExpandedAgents] = useState<Set<string>>(new Set());
  const [directiveText, setDirectiveText] = useState('');
  const [isRunningReview, setIsRunningReview] = useState(false);
  const [filter, setFilter] = useState<'all' | 'critical' | 'high' | 'in_progress'>('all');
  const [isSubmittingDirective, setIsSubmittingDirective] = useState(false);

  // Subscribe to CouncilAPI state changes
  useEffect(() => {
    const unsub = CouncilAPI.subscribe(() => setState({ ...CouncilAPI.getState() }));
    return unsub;
  }, []);

  const stats = useMemo(() => CouncilAPI.getStats(), [state]);

  const toggleAgent = useCallback((id: string) => {
    setExpandedAgents(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  // Run full council review
  const handleFullReview = useCallback(async () => {
    setIsRunningReview(true);
    toast.info('Council review initiated — all agents scanning...');
    try {
      const report = await CouncilAPI.runFullReview();
      toast.success(`Council review complete — score: ${report.overallScore}/100`);
    } catch (e) {
      toast.error('Review failed');
    }
    setIsRunningReview(false);
  }, []);

  // Run single agent review
  const handleAgentReview = useCallback(async (agentId: AgentRole, portal: string) => {
    toast.info(`${agentId} reviewing ${portal}...`);
    try {
      const session = await CouncilAPI.runReview(agentId, portal);
      toast.success(`Review complete — ${session.findings.length} findings, score: ${session.score}/100`);
    } catch (e) {
      toast.error('Review failed');
    }
  }, []);

  // Submit directive
  const handleSubmitDirective = useCallback(async () => {
    if (!directiveText.trim()) return;
    setIsSubmittingDirective(true);
    toast.info('Directive sent to all council agents...');
    try {
      const dir = await CouncilAPI.submitDirective(directiveText.trim(), 'CEO');
      toast.success(`Council responded — ${dir.responses.length} agents`);
      setDirectiveText('');
    } catch (e) {
      toast.error('Failed to process directive');
    }
    setIsSubmittingDirective(false);
  }, [directiveText]);

  // Filter recommendations
  const filteredRecs = useMemo(() => {
    let recs = CouncilAPI.getAllRecommendations();
    if (filter === 'critical') recs = recs.filter(r => r.priority === 'critical');
    if (filter === 'high') recs = recs.filter(r => r.priority === 'critical' || r.priority === 'high');
    if (filter === 'in_progress') recs = recs.filter(r => r.status === 'in_progress');
    return recs;
  }, [state, filter]);

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-6xl mx-auto relative z-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 mb-6"
      >
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center hover:bg-white/[0.08] hover:border-white/[0.15] transition-all duration-200 active:scale-95 group"
          title="Back"
        >
          <ArrowLeft className="w-4.5 h-4.5 text-gray-400 group-hover:text-white transition-colors" />
        </button>
        <div className="w-12 h-12 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
          <Brain className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-extrabold text-white tracking-tight">ASP Council</h1>
          <p className="text-xs text-gray-400">LLM agent council managing Alpha Sale Pro · {stats.totalAgents} agents active</p>
        </div>
        <button
          onClick={handleFullReview}
          disabled={isRunningReview}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary/15 text-primary border border-primary/30 rounded-xl text-xs font-bold hover:bg-primary/25 transition-all disabled:opacity-40 disabled:pointer-events-none"
        >
          {isRunningReview ? (
            <><RefreshCw className="w-4 h-4 animate-spin" /> Reviewing...</>
          ) : (
            <><Play className="w-4 h-4" /> Run Full Review</>
          )}
        </button>
      </motion.div>

      {/* Tab Bar */}
      <div className="flex items-center gap-1 mb-6 bg-white/[0.03] rounded-xl p-1 border border-white/[0.06]">
        {([
          { id: 'overview' as Tab, label: 'Overview', icon: BarChart3 },
          { id: 'agents' as Tab, label: 'Agents', icon: Users },
          { id: 'directives' as Tab, label: 'Directives', icon: MessageSquare },
          { id: 'consensus' as Tab, label: 'Consensus', icon: Target },
        ]).map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${
                tab === t.id
                  ? 'bg-primary/15 text-primary border border-primary/20'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-white/[0.03]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'overview' && (
          <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <OverviewTab stats={stats} agents={state.agents} filteredRecs={filteredRecs} filter={filter} setFilter={setFilter} directives={state.directives} />
          </motion.div>
        )}
        {tab === 'agents' && (
          <motion.div key="agents" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <AgentsTab agents={state.agents} expandedAgents={expandedAgents} toggleAgent={toggleAgent} onRunReview={handleAgentReview} />
          </motion.div>
        )}
        {tab === 'directives' && (
          <motion.div key="directives" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <DirectivesTab
              directives={state.directives}
              directiveText={directiveText}
              setDirectiveText={setDirectiveText}
              onSubmit={handleSubmitDirective}
              isSubmitting={isSubmittingDirective}
              agents={state.agents}
            />
          </motion.div>
        )}
        {tab === 'consensus' && (
          <motion.div key="consensus" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <ConsensusTab reports={state.consensusReports} agents={state.agents} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ─── Overview Tab ────────────────────────────────────────────────── */

const AGENT_COLORS: Record<string, string> = {
  design: '#8b5cf6',
  engineering: '#00d4c8',
  qa: '#f59e0b',
  operations: '#22c55e',
  strategy: '#6366f1',
};

const OverviewTab = ({ stats, agents, filteredRecs, filter, setFilter, directives }: {
  stats: ReturnType<typeof CouncilAPI.getStats>;
  agents: CouncilAgent[];
  filteredRecs: Recommendation[];
  filter: string;
  setFilter: (f: any) => void;
  directives: Directive[];
}) => {
  // Get latest agent thoughts from directives
  const latestThoughts = agents.map(agent => {
    const latestDirective = directives.find(d => d.status === 'completed' && d.responses.some(r => r.agentId === agent.id));
    const response = latestDirective?.responses.find(r => r.agentId === agent.id);
    return { agent, response, directive: latestDirective };
  });

  return (
    <div className="space-y-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Council Score', value: `${stats.averageScore}/100`, icon: Star, color: '#00d4c8' },
          { label: 'Critical Issues', value: stats.criticalIssues, icon: AlertTriangle, color: '#ef4444' },
          { label: 'In Progress', value: stats.inProgress, icon: RefreshCw, color: '#3b82f6' },
          { label: 'Directives Processed', value: directives.filter(d => d.status === 'completed').length, icon: MessageSquare, color: '#8b5cf6' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              className="glass-panel p-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4" style={{ color: s.color }} />
                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">{s.label}</span>
              </div>
              <div className="text-2xl font-extrabold text-white">{s.value}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Live Agent Thoughts */}
      <div className="glass-panel p-4">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold text-white">Live Agent Thoughts</span>
          {directives.length > 0 && (
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 font-bold">Active</span>
          )}
        </div>
        {latestThoughts.some(t => t.response) ? (
          <div className="space-y-2.5">
            {latestThoughts.filter(t => t.response).map(({ agent, response }) => {
              const Icon = AGENT_ICONS[agent.id];
              const color = AGENT_COLORS[agent.id] || '#888';
              // Show first meaningful line of the response
              const thoughtPreview = response!.text.split('\n').filter(l => l.trim().length > 0).slice(0, 2).join(' ').slice(0, 200);
              return (
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] transition-all"
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}15` }}>
                    <Icon className="w-4 h-4" style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-white">{agent.name}</span>
                      <span className="text-[9px] text-gray-500">{agent.role}</span>
                      <div className="ml-auto flex items-center gap-1">
                        <div className="h-1.5 w-10 rounded-full bg-white/[0.06] overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${(response!.confidence * 100)}%`, background: color }} />
                        </div>
                        <span className="text-[9px] text-gray-500">{Math.round(response!.confidence * 100)}%</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-300 leading-relaxed line-clamp-2">{thoughtPreview}</p>
                    {response!.recommendations.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {response!.recommendations.slice(0, 2).map((r, i) => (
                          <span key={i} className="text-[9px] px-2 py-0.5 rounded-full border border-white/[0.06] text-gray-400" style={{ background: `${color}08` }}>
                            {r.length > 40 ? r.slice(0, 40) + '...' : r}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6">
            <MessageSquare className="w-6 h-6 text-gray-600 mx-auto mb-2" />
            <p className="text-xs text-gray-500">Send a directive to see live agent analysis.</p>
            <p className="text-[10px] text-gray-600 mt-1">Go to the Directives tab and ask a question — all 5 agents will respond with data-backed answers.</p>
          </div>
        )}
      </div>

      {/* Agent Status Strip */}
      <div className="glass-panel p-4">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold text-white">Agent Status</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {agents.map(agent => {
            const Icon = AGENT_ICONS[agent.id];
            const color = AGENT_COLORS[agent.id] || '#888';
            return (
              <div key={agent.id} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-white truncate">{agent.name}</div>
                  <div className="text-[10px] text-gray-400">{agent.reviewScore}/100</div>
                </div>
                <div className={`w-2 h-2 rounded-full ${agent.status === 'active' ? 'bg-green-400' : agent.status === 'reviewing' ? 'bg-blue-400 animate-pulse' : 'bg-gray-500'}`} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters + Recommendations List */}
      <div className="glass-panel p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-white">All Recommendations</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-gray-400 font-bold">{filteredRecs.length}</span>
          </div>
          <div className="flex items-center gap-1">
            {(['all', 'critical', 'high', 'in_progress'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-[10px] px-2.5 py-1 rounded-full border transition-all ${
                  filter === f ? 'bg-primary/15 text-primary border-primary/30' : 'bg-white/[0.03] text-gray-400 border-white/[0.06] hover:bg-white/[0.06]'
                }`}
              >
                {f === 'all' ? 'All' : f === 'critical' ? 'Critical' : f === 'high' ? 'High+' : 'Active'}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
          {filteredRecs.map((rec, i) => (
            <RecommendationRow key={rec.id} rec={rec} index={i} />
          ))}
          {filteredRecs.length === 0 && (
            <div className="text-center py-8 text-xs text-gray-500">No recommendations match this filter.</div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Recommendation Row ──────────────────────────────────────────── */

const RecommendationRow = ({ rec, index }: { rec: Recommendation; index: number }) => {
  const agentColor = rec.agentId === 'design' ? '#8b5cf6' : rec.agentId === 'engineering' ? '#00d4c8' : rec.agentId === 'qa' ? '#f59e0b' : rec.agentId === 'operations' ? '#22c55e' : '#6366f1';

  const handleStatusChange = (newStatus: ReviewStatus) => {
    CouncilAPI.updateRecommendation(rec.id, { status: newStatus });
    toast.success(`Marked as ${newStatus}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.3) }}
      className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-all group"
    >
      <div className="mt-0.5">{STATUS_ICONS[rec.status]}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-bold text-white">{rec.title}</span>
          <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${PRIORITY_COLORS[rec.priority]}`}>
            {rec.priority}
          </span>
        </div>
        <div className="text-[10px] text-gray-400 line-clamp-1">{rec.description}</div>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: `${agentColor}15`, color: agentColor, border: `1px solid ${agentColor}30` }}>
            {rec.agentId}
          </span>
          <span className="text-[9px] text-gray-500">{rec.portal}</span>
          <span className="text-[9px] text-gray-500">· {rec.effort}</span>
          {rec.votes.agree.length > 0 && (
            <span className="text-[9px] text-green-400/70">+{rec.votes.agree.length} agree</span>
          )}
        </div>
      </div>
      {/* Quick actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {rec.status !== 'in_progress' && (
          <button onClick={() => handleStatusChange('in_progress')} className="p-1.5 rounded-md hover:bg-blue-500/15 text-blue-400 transition-colors" title="Start">
            <Play className="w-3 h-3" />
          </button>
        )}
        {rec.status !== 'completed' && (
          <button onClick={() => handleStatusChange('completed')} className="p-1.5 rounded-md hover:bg-green-500/15 text-green-400 transition-colors" title="Complete">
            <CheckCircle2 className="w-3 h-3" />
          </button>
        )}
        {rec.status !== 'deferred' && (
          <button onClick={() => handleStatusChange('deferred')} className="p-1.5 rounded-md hover:bg-gray-500/15 text-gray-400 transition-colors" title="Defer">
            <Clock className="w-3 h-3" />
          </button>
        )}
      </div>
    </motion.div>
  );
};

/* ─── Agents Tab ──────────────────────────────────────────────────── */

const AgentsTab = ({ agents, expandedAgents, toggleAgent, onRunReview }: {
  agents: CouncilAgent[];
  expandedAgents: Set<string>;
  toggleAgent: (id: string) => void;
  onRunReview: (agentId: AgentRole, portal: string) => void;
}) => (
  <div className="space-y-3">
    {agents.map(agent => {
      const Icon = AGENT_ICONS[agent.id];
      const isExpanded = expandedAgents.has(agent.id);
      const agentColor = agent.id === 'design' ? '#8b5cf6' : agent.id === 'engineering' ? '#00d4c8' : agent.id === 'qa' ? '#f59e0b' : agent.id === 'operations' ? '#22c55e' : '#6366f1';
      const criticalCount = agent.recommendations.filter(r => r.priority === 'critical').length;

      return (
        <motion.div
          key={agent.id}
          layout
          className="glass-panel overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Agent Header */}
          <button onClick={() => toggleAgent(agent.id)} className="w-full p-5 flex items-center gap-4 text-left hover:bg-white/[0.02] transition-colors">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${agentColor}15`, border: `1px solid ${agentColor}30` }}>
              <Icon className="w-6 h-6" style={{ color: agentColor }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">{agent.name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono" style={{ background: `${agentColor}15`, color: agentColor, border: `1px solid ${agentColor}30` }}>
                  {agent.role}
                </span>
                {criticalCount > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/20 font-bold">
                    {criticalCount} critical
                  </span>
                )}
              </div>
              <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{agent.description}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm font-bold text-white">{agent.reviewScore}<span className="text-xs text-gray-500">/100</span></div>
                <div className="text-[9px] text-gray-500">{agent.recommendations.length} findings</div>
              </div>
              <div className={`w-2.5 h-2.5 rounded-full ${agent.status === 'active' ? 'bg-green-400' : agent.status === 'reviewing' ? 'bg-blue-400 animate-pulse' : 'bg-gray-500'}`} />
              {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
            </div>
          </button>

          {/* Expanded Content */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-5 border-t border-white/[0.06]">
                  {/* Agent Info */}
                  <div className="grid grid-cols-3 gap-3 mt-4 mb-4">
                    <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                      <div className="text-[9px] text-gray-500 uppercase tracking-wider mb-1">Model</div>
                      <div className="text-xs font-bold text-white">{agent.model}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                      <div className="text-[9px] text-gray-500 uppercase tracking-wider mb-1">Specialties</div>
                      <div className="text-xs text-gray-300">{agent.specialties.slice(0, 3).join(', ')}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                      <div className="text-[9px] text-gray-500 uppercase tracking-wider mb-1">Reviews</div>
                      <div className="text-xs font-bold text-white">{agent.reviewHistory.length}</div>
                    </div>
                  </div>

                  {/* Run Review Buttons */}
                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    <span className="text-[10px] text-gray-500 mr-1">Run review:</span>
                    {['Sales Portal', 'Backend Ops', 'Installer Portal', 'Financier Portal', 'Landing'].map(portal => (
                      <button
                        key={portal}
                        onClick={(e) => { e.stopPropagation(); onRunReview(agent.id, portal); }}
                        className="text-[10px] px-2.5 py-1 rounded-full bg-white/[0.05] text-gray-300 border border-white/[0.08] hover:bg-primary/15 hover:text-primary hover:border-primary/30 transition-all"
                      >
                        {portal}
                      </button>
                    ))}
                  </div>

                  {/* Recommendations */}
                  <div className="text-xs font-bold text-white mb-2 flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-gray-400" /> Recommendations
                  </div>
                  <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                    {agent.recommendations.map((rec, i) => (
                      <RecommendationRow key={rec.id} rec={rec} index={i} />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      );
    })}
  </div>
);

/* ─── Directives Tab ──────────────────────────────────────────────── */

const DirectivesTab = ({ directives, directiveText, setDirectiveText, onSubmit, isSubmitting, agents }: {
  directives: Directive[];
  directiveText: string;
  setDirectiveText: (t: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  agents: CouncilAgent[];
}) => (
  <div className="space-y-4">
    {/* Directive Input */}
    <div className="glass-panel p-5">
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare className="w-4 h-4 text-primary" />
        <span className="text-xs font-bold text-white">Issue Directive to Council</span>
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={directiveText}
          onChange={(e) => setDirectiveText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !isSubmitting && onSubmit()}
          placeholder="e.g., Review the installer portal milestone flow and suggest improvements..."
          className="flex-1 px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-gray-500 outline-none focus:border-primary/40 transition-colors"
        />
        <button
          onClick={onSubmit}
          disabled={!directiveText.trim() || isSubmitting}
          className="flex items-center gap-2 px-5 py-3 bg-primary/20 text-primary border border-primary/30 rounded-xl text-xs font-bold hover:bg-primary/30 transition-all disabled:opacity-30 disabled:pointer-events-none"
        >
          {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Send
        </button>
      </div>
      <p className="text-[10px] text-gray-500 mt-2">All 5 council agents will analyze your directive and respond with recommendations.</p>
    </div>

    {/* Directive History */}
    {directives.length === 0 ? (
      <div className="glass-panel p-8 text-center">
        <Sparkles className="w-8 h-8 text-gray-600 mx-auto mb-3" />
        <p className="text-xs text-gray-400">No directives yet. Send one above to get council feedback.</p>
      </div>
    ) : (
      <div className="space-y-3">
        {directives.map(dir => (
          <DirectiveCard key={dir.id} directive={dir} agents={agents} />
        ))}
      </div>
    )}
  </div>
);

/* ─── Typewriter Text ─────────────────────────────────────────────── */

const TypewriterText = ({ text, speed = 12, onComplete }: { text: string; speed?: number; onComplete?: () => void }) => {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed('');
    setDone(false);
    let i = 0;
    const words = text.split(/(\s+)/); // split keeping whitespace
    let built = '';
    const tick = () => {
      if (i < words.length) {
        built += words[i];
        setDisplayed(built);
        i++;
        setTimeout(tick, speed + Math.random() * speed * 0.6);
      } else {
        setDone(true);
        onComplete?.();
      }
    };
    const t = setTimeout(tick, 100);
    return () => clearTimeout(t);
  }, [text]);

  return (
    <span>
      {displayed}
      {!done && <span className="inline-block w-1.5 h-3.5 bg-primary/70 ml-0.5 animate-pulse rounded-sm" />}
    </span>
  );
};

/* ─── Directive Card ──────────────────────────────────────────────── */

const DirectiveCard = ({ directive, agents }: { directive: Directive; agents: CouncilAgent[] }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  // Track which agent responses have finished their typewriter animation
  const [revealedAgents, setRevealedAgents] = useState<Set<string>>(new Set());
  const isProcessing = directive.status === 'processing';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel overflow-hidden"
    >
      <button onClick={() => setIsExpanded(!isExpanded)} className="w-full p-4 flex items-start gap-3 text-left hover:bg-white/[0.02] transition-colors">
        <div className={`w-8 h-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0 mt-0.5 ${isProcessing ? 'animate-pulse' : ''}`}>
          {isProcessing ? <RefreshCw className="w-4 h-4 text-primary animate-spin" /> : <MessageSquare className="w-4 h-4 text-primary" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">{directive.from}</span>
            <span className="text-[10px] text-gray-500">{new Date(directive.createdAt).toLocaleString()}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              directive.status === 'completed' ? 'bg-green-500/15 text-green-400' :
              directive.status === 'processing' ? 'bg-blue-500/15 text-blue-400 animate-pulse' : 'bg-gray-500/15 text-gray-400'
            }`}>
              {directive.status === 'processing' ? 'Agents thinking...' : directive.status}
            </span>
          </div>
          <p className="text-sm text-white font-medium">{directive.text}</p>
          <p className="text-[10px] text-gray-500 mt-1">
            {isProcessing ? (
              <span className="text-blue-400">
                {directive.responses.length === 0 ? 'Initializing council agents...' :
                  `${directive.responses.length} of ${directive.assignedAgents.length} agents have responded...`}
              </span>
            ) : (
              `${directive.responses.length} / ${directive.assignedAgents.length} agents responded`
            )}
          </p>
        </div>
        {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400 mt-1" /> : <ChevronRight className="w-4 h-4 text-gray-400 mt-1" />}
      </button>

      <AnimatePresence>
        {isExpanded && directive.responses.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2 border-t border-white/[0.06] pt-3">
              {directive.responses.map((res, resIdx) => {
                const agent = agents.find(a => a.id === res.agentId);
                const Icon = AGENT_ICONS[res.agentId];
                const agentColor = AGENT_COLORS[res.agentId] || '#888';
                const isRevealed = revealedAgents.has(res.agentId);

                return (
                  <motion.div
                    key={res.agentId}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: resIdx * 0.15 }}
                    className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.05]"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: `${agentColor}15` }}>
                        <Icon className="w-3.5 h-3.5" style={{ color: agentColor }} />
                      </div>
                      <span className="text-xs font-bold text-white">{agent?.name || res.agentId}</span>
                      <span className="text-[9px] text-gray-500">{agent?.role}</span>
                      <div className="ml-auto flex items-center gap-1">
                        <motion.div
                          className="h-1.5 w-12 rounded-full bg-white/[0.06] overflow-hidden"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.5 }}
                        >
                          <motion.div
                            className="h-full rounded-full"
                            style={{ background: agentColor }}
                            initial={{ width: 0 }}
                            animate={{ width: `${res.confidence * 100}%` }}
                            transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
                          />
                        </motion.div>
                        <span className="text-[9px] text-gray-500">{Math.round(res.confidence * 100)}%</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-300 leading-relaxed whitespace-pre-line">
                      <TypewriterText
                        text={res.text}
                        speed={8}
                        onComplete={() => setRevealedAgents(prev => new Set([...prev, res.agentId]))}
                      />
                    </div>
                    {isRevealed && res.recommendations.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-2 flex flex-wrap gap-1.5"
                      >
                        {res.recommendations.map((r, i) => (
                          <motion.span
                            key={i}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.15 }}
                            className="text-[9px] px-2 py-0.5 rounded-full bg-white/[0.04] text-gray-400 border border-white/[0.06]"
                          >
                            {r}
                          </motion.span>
                        ))}
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}

              {/* Show waiting indicator for agents that haven't responded yet */}
              {isProcessing && directive.responses.length < directive.assignedAgents.length && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-white/[0.01] border border-white/[0.03]">
                  <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                  <span className="text-[10px] text-blue-400">
                    {agents.filter(a => !directive.responses.some(r => r.agentId === a.id)).map(a => a.name).join(', ')} analyzing...
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/* ─── Consensus Tab ───────────────────────────────────────────────── */

const ConsensusTab = ({ reports, agents }: { reports: ConsensusReport[]; agents: CouncilAgent[] }) => {
  if (reports.length === 0) {
    return (
      <div className="glass-panel p-8 text-center">
        <Target className="w-8 h-8 text-gray-600 mx-auto mb-3" />
        <p className="text-sm font-bold text-white mb-1">No Consensus Reports Yet</p>
        <p className="text-xs text-gray-400">Send a directive to the council — the Consensus tab will show the synthesized answer from all agents.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reports.map((report, reportIdx) => {
        // Parse the summary to extract structured data
        const isDirectiveSynthesis = report.summary.includes('Directive:');
        const lines = report.summary.split('\n').filter(l => l.trim());

        return (
          <motion.div
            key={report.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reportIdx * 0.05 }}
            className="glass-panel p-5"
          >
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-5 h-5 text-primary" />
              <span className="font-bold text-white text-sm flex-1 truncate">{report.topic}</span>
              <span className="text-xs font-bold text-primary">{report.overallScore}% confidence</span>
            </div>

            {/* Concise Answer Section */}
            {isDirectiveSynthesis && (
              <div className="mb-4 p-3 rounded-lg bg-primary/[0.06] border border-primary/20">
                <div className="text-[10px] text-primary/70 uppercase tracking-wider font-bold mb-2 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Council Answer
                </div>
                <div className="space-y-1.5">
                  {lines.slice(2).filter(l => !l.startsWith('Key actions:')).map((line, i) => (
                    <p key={i} className="text-xs text-gray-200 leading-relaxed">{line}</p>
                  ))}
                </div>
                {/* Key Actions */}
                {lines.find(l => l.startsWith('Key actions:')) && (
                  <div className="mt-2 pt-2 border-t border-primary/10">
                    <p className="text-[10px] text-primary/80 font-bold">
                      {lines.find(l => l.startsWith('Key actions:'))}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Non-directive summary */}
            {!isDirectiveSynthesis && (
              <p className="text-xs text-gray-300 leading-relaxed mb-4">{report.summary}</p>
            )}

            {/* Prioritized Actions */}
            {report.prioritizedActions.length > 0 && (
              <div className="mb-4">
                <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-2">Priority Actions</div>
                <div className="space-y-1.5">
                  {report.prioritizedActions.slice(0, 6).map((action, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${PRIORITY_COLORS[action.priority]}`}>
                        {action.priority}
                      </span>
                      <span className="text-xs text-white flex-1">{action.action.length > 60 ? action.action.slice(0, 60) + '...' : action.action}</span>
                      <div className="flex items-center gap-0.5">
                        {action.agents.slice(0, 3).map(a => {
                          const Icon = AGENT_ICONS[a];
                          const c = AGENT_COLORS[a] || '#888';
                          return <div key={a} className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: `${c}15` }}><Icon className="w-3 h-3" style={{ color: c }} /></div>;
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Agreements / Disagreements */}
            {(report.agreements.length > 0 || report.disagreements.length > 0) && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[10px] text-green-400/70 uppercase tracking-wider font-bold mb-1.5 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Agreements ({report.agreements.length})</div>
                  <div className="space-y-1">
                    {report.agreements.slice(0, 4).map((a, i) => (
                      <div key={i} className="text-[10px] text-gray-400 p-1.5 rounded bg-green-500/[0.03] border border-green-500/[0.06]">{a}</div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-orange-400/70 uppercase tracking-wider font-bold mb-1.5 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Uncertain ({report.disagreements.length})</div>
                  <div className="space-y-1">
                    {report.disagreements.slice(0, 4).map((d, i) => (
                      <div key={i} className="text-[10px] text-gray-400 p-1.5 rounded bg-orange-500/[0.03] border border-orange-500/[0.06]">{d}</div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="text-[10px] text-gray-500 mt-3">{new Date(report.timestamp).toLocaleString()}</div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default CouncilDashboard;
