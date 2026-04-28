/**
 * Council Dashboard — The Pantheon: 4-Agent AI Council
 *
 * Agents: UI Inspector, Code Auditor, Backend Operator, User Comms
 * Features: Streaming responses, daily usage cap, role-gated access
 */
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useDataSource } from '@/contexts/DataSourceProvider';
import {
  AGENTS, SEVERITY_CONFIG, runCouncilAnalysis,
  buildDataContext, type AgentId, type Finding, type CouncilState, type Severity,
} from '@/services/councilEngine';
import { processChat, type ChatMessage } from '@/services/councilChat';
import { streamCouncilChat, fetchUsage, type UsageInfo } from '@/services/councilLLM';
import {
  Shield, Activity, ChevronRight, Send, ArrowLeft,
  Loader2, AlertTriangle, AlertCircle, Info, CheckCircle2,
  Zap, Eye, RefreshCw, X, Lock,
} from 'lucide-react';

const EASE_OUT = [0.22, 1, 0.36, 1] as const;
type Tab = 'chat' | 'dashboard';

// ─── Shared Components ──────────────────────────────────────────────

const ScoreRing = ({ score, size = 80, strokeWidth = 6, color }: { score: number; size?: number; strokeWidth?: number; color: string }) => {
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={strokeWidth} />
      <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeLinecap="round" strokeDasharray={c}
        initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c - (score / 100) * c }}
        transition={{ duration: 1.2, ease: EASE_OUT, delay: 0.2 }} />
    </svg>
  );
};

const SeverityIcon = ({ severity, className = 'w-4 h-4' }: { severity: Severity; className?: string }) => {
  const cfg = SEVERITY_CONFIG[severity];
  const props = { className: `${className} ${cfg.color}` };
  switch (severity) {
    case 'critical': return <AlertTriangle {...props} />;
    case 'high': return <AlertCircle {...props} />;
    case 'medium': return <Zap {...props} />;
    case 'low': return <Info {...props} />;
    case 'info': return <CheckCircle2 {...props} />;
  }
};

const scoreColor = (s: number) => s >= 80 ? '#00D4C8' : s >= 60 ? '#F2C94C' : s >= 40 ? '#F2994A' : '#EB5757';

// ─── Access Gate ────────────────────────────────────────────────────

const AccessDenied = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
      <div className="text-center max-w-md px-6">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
          <Lock className="w-8 h-8 text-red-400" />
        </div>
        <h1 className="text-2xl font-black mb-2">Access Restricted</h1>
        <p className="text-gray-500 text-sm mb-6">
          The AI Council is available to Backend Ops and Admin roles only.
        </p>
        <button onClick={() => navigate('/dashboard')}
          className="px-6 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-sm font-bold hover:bg-white/[0.1] transition-all">
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

// ─── Main Dashboard ─────────────────────────────────────────────────

const CouncilDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { projects, sellProjects, milestoneStates } = useDataSource();
  const [activeTab, setActiveTab] = useState<Tab>('chat');
  const [selectedAgent, setSelectedAgent] = useState<AgentId>('user-comms');

  // Role gate — only backend_ops and master
  const hasAccess = user?.role === 'backend_ops' || user?.role === 'master' || user?.isDemo;
  if (!hasAccess) return <AccessDenied />;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <div className="border-b border-white/[0.06] bg-black/30 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(-1)}
                className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-gray-400 hover:text-white hover:border-white/20 transition-all">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight">The Pantheon</h1>
                <p className="text-xs text-gray-500 font-medium">AI Council • 4 Agents</p>
              </div>
            </div>

            <div className="flex items-center gap-1 bg-white/[0.03] rounded-xl p-1 border border-white/[0.06]">
              {([
                { id: 'chat' as Tab, icon: Send, label: 'Chat' },
                { id: 'dashboard' as Tab, icon: Activity, label: 'Dashboard' },
              ]).map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === tab.id
                      ? 'bg-white/[0.08] text-white border border-white/10'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}>
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>

            <button onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-gray-400 hover:text-white hover:bg-red-500/10 hover:border-red-500/20 transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}>
        {activeTab === 'chat' ? (
          <ChatView
            selectedAgent={selectedAgent}
            setSelectedAgent={setSelectedAgent}
            projects={projects}
            sellProjects={sellProjects}
            milestoneStates={milestoneStates}
          />
        ) : (
          <DashboardView projects={projects} sellProjects={sellProjects} milestoneStates={milestoneStates} />
        )}
      </motion.div>
    </div>
  );
};

// ─── Chat View ──────────────────────────────────────────────────────

interface ChatViewProps {
  selectedAgent: AgentId;
  setSelectedAgent: (a: AgentId) => void;
  projects: any[];
  sellProjects: any[];
  milestoneStates: Record<string, any>;
}

const ChatView = ({ selectedAgent, setSelectedAgent, projects, sellProjects, milestoneStates }: ChatViewProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [usage, setUsage] = useState<UsageInfo>({ used: 0, remaining: 50, limit: 50 });
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchUsage().then(setUsage);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // Reset chat when agent changes
  useEffect(() => {
    const agent = AGENTS[selectedAgent];
    setMessages([{
      id: 'welcome',
      role: 'agent',
      agentId: selectedAgent,
      text: `**${agent.name}** online — ${agent.description}\n\nHow can I help?`,
      timestamp: new Date().toISOString(),
    }]);
    setError(null);
  }, [selectedAgent]);

  const context = useMemo(
    () => buildDataContext(projects, sellProjects, milestoneStates),
    [projects, sellProjects, milestoneStates],
  );

  const handleSend = useCallback(async () => {
    const q = input.trim();
    if (!q || isStreaming) return;
    if (usage.remaining <= 0) {
      setError('Daily limit reached (50 calls). Resets at midnight.');
      return;
    }

    setError(null);
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: q,
      timestamp: new Date().toISOString(),
    };

    const streamMsgId = `agent-${Date.now()}`;
    const streamMsg: ChatMessage = {
      id: streamMsgId,
      role: 'agent',
      agentId: selectedAgent,
      text: '',
      timestamp: new Date().toISOString(),
      isStreaming: true,
    };

    setMessages(prev => [...prev, userMsg, streamMsg]);
    setInput('');
    setIsStreaming(true);

    const history = messages
      .filter(m => m.role === 'user' || m.role === 'agent')
      .slice(-8)
      .map(m => ({
        role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: m.text,
      }));

    let accumulated = '';

    await streamCouncilChat(selectedAgent, q, history, context, {
      onChunk: (text) => {
        accumulated += text;
        const current = accumulated;
        setMessages(prev => prev.map(m =>
          m.id === streamMsgId ? { ...m, text: current } : m
        ));
      },
      onDone: (info) => {
        setMessages(prev => prev.map(m =>
          m.id === streamMsgId
            ? { ...m, isStreaming: false, tokens: info.tokens, latencyMs: info.latencyMs }
            : m
        ));
        setUsage(prev => ({
          ...prev,
          used: prev.used + 1,
          remaining: info.remaining,
        }));
        setIsStreaming(false);
      },
      onError: (errMsg) => {
        // Fallback to rule-based response
        const fallback = processChat(q, selectedAgent, projects, sellProjects, milestoneStates);
        setMessages(prev => prev.map(m =>
          m.id === streamMsgId
            ? { ...m, text: fallback.text, isStreaming: false }
            : m
        ));
        setIsStreaming(false);
        if (errMsg.includes('ANTHROPIC_API_KEY')) {
          setError('AI not configured — using rule-based responses');
        }
      },
    });
  }, [input, selectedAgent, messages, isStreaming, projects, sellProjects, milestoneStates, context, usage.remaining]);

  const agentList = Object.values(AGENTS);

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6 flex flex-col" style={{ height: 'calc(100vh - 72px)' }}>
      {/* Agent Selector + Usage */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 flex gap-2 overflow-x-auto pb-1">
          {agentList.map(agent => (
            <button key={agent.id} onClick={() => setSelectedAgent(agent.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedAgent === agent.id
                  ? 'bg-white/[0.08] border border-white/15 text-white shadow-lg'
                  : 'bg-white/[0.02] border border-white/[0.06] text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]'
              }`}>
              <span className="text-base">{agent.icon}</span>
              <span>{agent.name}</span>
              {selectedAgent === agent.id && (
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: agent.accentHex }} />
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] flex-shrink-0">
          <div className={`w-2 h-2 rounded-full ${usage.remaining > 10 ? 'bg-emerald-400' : usage.remaining > 0 ? 'bg-yellow-400' : 'bg-red-400'}`} />
          <span className="text-[11px] font-bold text-gray-400">
            {usage.remaining}<span className="text-gray-600">/{usage.limit}</span>
          </span>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="mb-3 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300 flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-white"><X className="w-3 h-3" /></button>
        </motion.div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 pb-4 scrollbar-thin scrollbar-thumb-white/10">
        {messages.map(msg => (
          <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'agent' && msg.agentId && (
              <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mr-3 mt-1 flex-shrink-0">
                <span className="text-sm">{AGENTS[msg.agentId].icon}</span>
              </div>
            )}
            <div className={`max-w-[80%] ${msg.role === 'user'
              ? 'bg-purple-500/15 border border-purple-500/20 rounded-2xl rounded-br-md'
              : 'bg-white/[0.03] border border-white/[0.06] rounded-2xl rounded-bl-md'
            } px-4 py-3`}>
              {msg.role === 'agent' && msg.agentId && (
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: AGENTS[msg.agentId].accentHex }}>
                    {AGENTS[msg.agentId].name}
                  </span>
                  {msg.isStreaming && (
                    <motion.div className="flex gap-0.5 ml-1" animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1.2, repeat: Infinity }}>
                      {[0, 1, 2].map(i => (
                        <div key={i} className="w-1 h-1 rounded-full" style={{ backgroundColor: AGENTS[msg.agentId!].accentHex }} />
                      ))}
                    </motion.div>
                  )}
                  {msg.tokens !== undefined && (
                    <span className="text-[9px] text-gray-600 ml-auto">{msg.tokens}tok • {msg.latencyMs}ms</span>
                  )}
                </div>
              )}
              <div className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">
                {msg.text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/).map((part, i) => {
                  if (part.startsWith('**') && part.endsWith('**'))
                    return <strong key={i} className="text-white font-bold">{part.slice(2, -2)}</strong>;
                  if (part.startsWith('*') && part.endsWith('*'))
                    return <em key={i} className="text-gray-300">{part.slice(1, -1)}</em>;
                  return <span key={i}>{part}</span>;
                })}
                {msg.isStreaming && msg.text === '' && (
                  <span className="text-gray-500 text-xs">Thinking...</span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Input */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.06]"
          title={AGENTS[selectedAgent].name}>
          <span className="text-xs">{AGENTS[selectedAgent].icon}</span>
        </div>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder={`Ask ${AGENTS[selectedAgent].name}...`}
          className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 outline-none"
          disabled={isStreaming}
        />
        <button onClick={handleSend} disabled={!input.trim() || isStreaming}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
            input.trim() && !isStreaming
              ? 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30'
              : 'text-gray-600'
          }`}>
          {isStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};

// ─── Dashboard View ─────────────────────────────────────────────────

interface DashboardViewProps {
  projects: any[];
  sellProjects: any[];
  milestoneStates: Record<string, any>;
}

const DashboardView = ({ projects, sellProjects, milestoneStates }: DashboardViewProps) => {
  const [selectedAgent, setSelectedAgent] = useState<AgentId | null>(null);
  const [severityFilter, setSeverityFilter] = useState<Severity | 'all'>('all');

  const council: CouncilState = useMemo(
    () => runCouncilAnalysis(projects, sellProjects, milestoneStates),
    [projects, sellProjects, milestoneStates],
  );

  const activeReport = selectedAgent ? council.reports.find(r => r.agent.id === selectedAgent) : null;
  const allFindings = council.reports.flatMap(r => r.findings);
  const filteredFindings = (selectedAgent ? activeReport?.findings || [] : allFindings)
    .filter(f => severityFilter === 'all' || f.severity === severityFilter)
    .sort((a, b) => {
      const order: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
      return order[a.severity] - order[b.severity];
    });

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-6">
      {/* Overall Score */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-6 p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
        <div className="relative flex items-center justify-center">
          <ScoreRing score={council.overallScore} size={88} strokeWidth={7} color={scoreColor(council.overallScore)} />
          <span className="absolute text-2xl font-black" style={{ color: scoreColor(council.overallScore) }}>
            {council.overallScore}
          </span>
        </div>
        <div className="flex-1">
          <div className="text-sm font-bold text-white mb-1">System Health</div>
          <div className="text-xs text-gray-500">
            {council.totalFindings} finding{council.totalFindings !== 1 ? 's' : ''} across {council.reports.length} agents
            {council.criticalCount > 0 && <span className="text-red-400 font-semibold ml-2">• {council.criticalCount} critical</span>}
          </div>
        </div>
      </motion.div>

      {/* Agent Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {council.reports.map((report, i) => {
          const isSelected = selectedAgent === report.agent.id;
          return (
            <motion.button key={report.agent.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              onClick={() => setSelectedAgent(isSelected ? null : report.agent.id)}
              className={`relative p-4 rounded-xl border text-left transition-all ${
                isSelected ? 'bg-white/[0.06] border-white/20' : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]'
              }`}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{report.agent.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-black truncate">{report.agent.name}</div>
                  <div className="text-[10px] text-gray-500 truncate">{report.agent.domain}</div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="relative w-10 h-10">
                  <ScoreRing score={report.score} size={40} strokeWidth={3} color={report.agent.accentHex} />
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-black"
                    style={{ color: report.agent.accentHex }}>{report.score}</span>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-gray-400">{report.findings.length}</div>
                  <div className="text-[9px] text-gray-600 uppercase">findings</div>
                </div>
              </div>
              {report.findings.some(f => f.severity === 'critical') && (
                <div className="absolute top-2 right-2">
                  <span className="flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                  </span>
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Findings */}
      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-3">
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Severity</div>
            {(['all', 'critical', 'high', 'medium', 'low', 'info'] as const).map(sev => {
              const count = sev === 'all'
                ? (selectedAgent ? activeReport?.findings.length || 0 : allFindings.length)
                : (selectedAgent ? activeReport?.findings || [] : allFindings).filter(f => f.severity === sev).length;
              const cfg = sev === 'all' ? null : SEVERITY_CONFIG[sev];
              return (
                <button key={sev} onClick={() => setSeverityFilter(sev)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    severityFilter === sev ? 'bg-white/[0.08] text-white border border-white/10' : 'text-gray-500 hover:text-gray-300 border border-transparent'
                  }`}>
                  {cfg ? <SeverityIcon severity={sev as Severity} /> : <Eye className="w-4 h-4" />}
                  <span className="flex-1 text-left capitalize">{sev}</span>
                  <span className="tabular-nums text-gray-600">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="col-span-9 space-y-2">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-bold text-gray-300">
              {selectedAgent ? `${AGENTS[selectedAgent].name}'s Findings` : 'All Findings'}
            </span>
            <span className="text-xs text-gray-600">({filteredFindings.length})</span>
          </div>
          <AnimatePresence mode="popLayout">
            {filteredFindings.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-16 text-center">
                <CheckCircle2 className="w-10 h-10 text-teal-500/30 mb-3" />
                <div className="text-sm font-bold text-gray-500">All Clear</div>
              </motion.div>
            ) : (
              filteredFindings.map((finding, i) => (
                <FindingCard key={finding.id} finding={finding} index={i} showAgent={!selectedAgent} />
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

// ─── Finding Card ───────────────────────────────────────────────────

const FindingCard = ({ finding, index, showAgent }: { finding: Finding; index: number; showAgent: boolean }) => {
  const [expanded, setExpanded] = useState(false);
  const cfg = SEVERITY_CONFIG[finding.severity];
  const agent = AGENTS[finding.agentId];
  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.3), ease: EASE_OUT }}
      className={`rounded-xl border ${cfg.border} ${cfg.bg} overflow-hidden`}>
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-start gap-3 p-4 text-left">
        <div className="mt-0.5"><SeverityIcon severity={finding.severity} /></div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {showAgent && <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: agent.accentHex }}>{agent.icon} {agent.name}</span>}
            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
          </div>
          <div className="text-sm font-bold text-white leading-snug">{finding.title}</div>
          <div className="text-xs text-gray-400 mt-1 line-clamp-1">{finding.description}</div>
          {finding.metric && <span className="inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/[0.05] text-gray-400">{finding.metric}</span>}
        </div>
        <motion.div animate={{ rotate: expanded ? 90 : 0 }} className="text-gray-600 mt-1">
          <ChevronRight className="w-4 h-4" />
        </motion.div>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4 pt-0 border-t border-white/[0.04]">
              <div className="pt-3 space-y-3">
                <div>
                  <div className="text-[10px] font-bold text-gray-600 uppercase mb-1">Analysis</div>
                  <p className="text-xs text-gray-400 leading-relaxed">{finding.description}</p>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-gray-600 uppercase mb-1">Recommendation</div>
                  <p className="text-xs text-gray-300 leading-relaxed">{finding.recommendation}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default CouncilDashboard;
