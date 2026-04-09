/**
 * Council Dashboard — The Pantheon: Live AI Operations Intelligence
 * 
 * Three modes: Dashboard (findings), Chat (Q&A), Diagnostic (system test).
 * All powered by real Supabase data — no mock/hardcoded content.
 */
import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useDataSource } from '@/contexts/DataSourceProvider';
import { runCouncilAnalysis, AGENTS, SEVERITY_CONFIG, type AgentId, type Finding, type CouncilState, type Severity } from '@/services/councilEngine';
import { processChat, type ChatMessage } from '@/services/councilChat';
import { runDiagnostic, type DiagnosticPhase, type DiagnosticResult, type TestStatus } from '@/services/councilDiagnostic';
import {
  Shield, Activity, ChevronRight, ExternalLink,
  AlertTriangle, AlertCircle, Info, CheckCircle2, Zap,
  Eye, RefreshCw, X, MessageSquare, FlaskConical,
  Send, ArrowLeft, Loader2, CheckCircle, XCircle, AlertOctagon,
} from 'lucide-react';

const EASE_OUT = [0.22, 1, 0.36, 1] as const;
type Tab = 'dashboard' | 'chat' | 'diagnostic';

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

const TestStatusIcon = ({ status }: { status: TestStatus }) => {
  switch (status) {
    case 'pass': return <CheckCircle className="w-4 h-4 text-emerald-400" />;
    case 'fail': return <XCircle className="w-4 h-4 text-red-400" />;
    case 'warn': return <AlertOctagon className="w-4 h-4 text-yellow-400" />;
    case 'skip': return <Info className="w-4 h-4 text-gray-500" />;
  }
};

// ─── Main Dashboard ─────────────────────────────────────────────────

const CouncilDashboard = () => {
  const navigate = useNavigate();
  const { projects, sellProjects, milestoneStates, tickets } = useDataSource();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [selectedAgent, setSelectedAgent] = useState<AgentId | null>(null);
  const [severityFilter, setSeverityFilter] = useState<Severity | 'all'>('all');
  const [scanKey, setScanKey] = useState(0);
  const [isScanning, setIsScanning] = useState(true);
  const [visibleFindings, setVisibleFindings] = useState(0);

  const council: CouncilState = useMemo(() => {
    return runCouncilAnalysis(projects, sellProjects, milestoneStates);
  }, [projects, sellProjects, milestoneStates, scanKey]);

  // Progressive reveal — findings appear one by one on load/re-scan
  useEffect(() => {
    setIsScanning(true);
    setVisibleFindings(0);
    const allCount = council.reports.flatMap(r => r.findings).length;
    if (allCount === 0) { setIsScanning(false); return; }
    let count = 0;
    const interval = setInterval(() => {
      count++;
      setVisibleFindings(count);
      if (count >= allCount) {
        clearInterval(interval);
        setTimeout(() => setIsScanning(false), 300);
      }
    }, 80); // 80ms per finding = fast but visible
    return () => clearInterval(interval);
  }, [council, scanKey]);

  const activeReport = selectedAgent ? council.reports.find(r => r.agent.id === selectedAgent) : null;
  const allFindings = council.reports.flatMap(r => r.findings);
  const filteredFindings = (selectedAgent ? activeReport?.findings || [] : allFindings)
    .filter(f => severityFilter === 'all' || f.severity === severityFilter)
    .sort((a, b) => {
      const order: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
      return order[a.severity] - order[b.severity];
    });

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <div className="border-b border-white/[0.06] bg-black/30 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Exit Button */}
              <button
                onClick={() => navigate(-1)}
                className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-gray-400 hover:text-white hover:border-white/20 transition-all btn-press"
                title="Exit Council"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-teal-500/20 border border-white/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight">The Pantheon</h1>
                <p className="text-xs text-gray-500 font-medium">AI Operations Council</p>
              </div>
            </div>

            {/* Tab Switcher */}
            <div className="flex items-center gap-1 bg-white/[0.03] rounded-xl p-1 border border-white/[0.06]">
              {([
                { id: 'dashboard' as Tab, icon: Activity, label: 'Dashboard' },
                { id: 'chat' as Tab, icon: MessageSquare, label: 'Chat' },
                { id: 'diagnostic' as Tab, icon: FlaskConical, label: 'Diagnostic' },
              ]).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === tab.id
                      ? 'bg-white/[0.08] text-white border border-white/10'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              {activeTab === 'dashboard' && (
                <button onClick={() => setScanKey(k => k + 1)} disabled={isScanning}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all btn-press ${
                    isScanning ? 'bg-purple-500/10 border border-purple-500/20 text-purple-300' : 'bg-white/[0.04] border border-white/[0.08] text-gray-400 hover:text-white hover:border-white/20'
                  }`}>
                  <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} /> {isScanning ? 'Scanning…' : 'Re-scan'}
                </button>
              )}
              <a href="https://linear.app/alpha-sale-pro-hub/team/ALP/active" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs font-semibold text-gray-400 hover:text-white hover:border-white/20 transition-all btn-press">
                <ExternalLink className="w-3.5 h-3.5" /> Linear
              </a>
              <button onClick={() => navigate(-1)}
                className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-gray-400 hover:text-white hover:bg-red-500/10 hover:border-red-500/20 transition-all btn-press"
                title="Close">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'dashboard' && (
          <motion.div key="dashboard" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            <DashboardView
              council={council} projects={projects} sellProjects={sellProjects}
              selectedAgent={selectedAgent} setSelectedAgent={setSelectedAgent}
              severityFilter={severityFilter} setSeverityFilter={setSeverityFilter}
              filteredFindings={filteredFindings} activeReport={activeReport} allFindings={allFindings}
              isScanning={isScanning} visibleFindings={visibleFindings}
            />
          </motion.div>
        )}
        {activeTab === 'chat' && (
          <motion.div key="chat" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            <ChatView projects={projects} sellProjects={sellProjects} milestoneStates={milestoneStates} />
          </motion.div>
        )}
        {activeTab === 'diagnostic' && (
          <motion.div key="diagnostic" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            <DiagnosticView projects={projects} sellProjects={sellProjects} milestoneStates={milestoneStates} tickets={tickets} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Dashboard View ─────────────────────────────────────────────────

interface DashboardViewProps {
  council: CouncilState;
  projects: any[]; sellProjects: any[];
  selectedAgent: AgentId | null; setSelectedAgent: (a: AgentId | null) => void;
  severityFilter: Severity | 'all'; setSeverityFilter: (s: Severity | 'all') => void;
  filteredFindings: Finding[]; activeReport: any; allFindings: Finding[];
  isScanning?: boolean; visibleFindings?: number;
}

const DashboardView = ({
  council, projects, sellProjects,
  selectedAgent, setSelectedAgent,
  severityFilter, setSeverityFilter,
  filteredFindings, activeReport, allFindings,
  isScanning = false, visibleFindings = Infinity,
}: DashboardViewProps) => (
  <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-6">
    {/* Overall Score */}
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE_OUT }}
      className="flex items-center gap-6 p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl">
      <div className="relative flex items-center justify-center">
        <ScoreRing score={council.overallScore} size={88} strokeWidth={7} color={scoreColor(council.overallScore)} />
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span key={council.overallScore} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            className="text-2xl font-black" style={{ color: scoreColor(council.overallScore) }}>
            {council.overallScore}
          </motion.span>
        </div>
      </div>
      <div className="flex-1">
        <div className="text-sm font-bold text-white mb-1">System Health Score</div>
        <div className="text-xs text-gray-500">
          {council.totalFindings} finding{council.totalFindings !== 1 ? 's' : ''} across {council.reports.length} agents
          {council.criticalCount > 0 && <span className="text-red-400 font-semibold ml-2">• {council.criticalCount} critical</span>}
        </div>
      </div>
      <div className="flex gap-4">
        {[
          { label: 'Projects', value: projects.length, color: 'text-teal-400' },
          { label: 'Leads', value: sellProjects.length, color: 'text-blue-400' },
          { label: 'Findings', value: council.totalFindings, color: council.criticalCount > 0 ? 'text-red-400' : 'text-yellow-400' },
        ].map(s => (
          <div key={s.label} className="text-center px-4">
            <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-[10px] text-gray-600 font-semibold uppercase tracking-wider">{s.label}</div>
          </div>
        ))}
      </div>
    </motion.div>

    {/* Agent Cards */}
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
      {council.reports.map((report, i) => {
        const isSelected = selectedAgent === report.agent.id;
        return (
          <motion.button key={report.agent.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 * i, ease: EASE_OUT }}
            onClick={() => setSelectedAgent(isSelected ? null : report.agent.id)}
            className={`relative p-4 rounded-xl border text-left transition-all duration-300 ${
              isSelected ? 'bg-white/[0.06] border-white/20 shadow-lg' : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/10'
            }`}>
            {isSelected && (
              <motion.div layoutId="agent-indicator" className="absolute inset-0 rounded-xl border-2 pointer-events-none"
                style={{ borderColor: report.agent.accentHex + '40' }} transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
            )}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{report.agent.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-black truncate">{report.agent.name}</div>
                <div className="text-[10px] text-gray-500 font-medium truncate">{report.agent.domain}</div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="relative w-10 h-10">
                <ScoreRing score={report.score} size={40} strokeWidth={3} color={report.agent.accentHex} />
                <span className="absolute inset-0 flex items-center justify-center text-xs font-black" style={{ color: report.agent.accentHex }}>{report.score}</span>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-gray-400">{report.findings.length}</div>
                <div className="text-[9px] text-gray-600 uppercase">findings</div>
              </div>
            </div>
            {report.findings.some((f: Finding) => f.severity === 'critical') && (
              <div className="absolute top-2 right-2">
                <span className="flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" /></span>
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
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Filter by Severity</div>
          {(['all', 'critical', 'high', 'medium', 'low', 'info'] as const).map(sev => {
            const count = sev === 'all'
              ? (selectedAgent ? activeReport?.findings.length || 0 : allFindings.length)
              : (selectedAgent ? activeReport?.findings || [] : allFindings).filter((f: Finding) => f.severity === sev).length;
            const cfg = sev === 'all' ? null : SEVERITY_CONFIG[sev];
            const isActive = severityFilter === sev;
            return (
              <button key={sev} onClick={() => setSeverityFilter(sev)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  isActive ? 'bg-white/[0.08] text-white border border-white/10' : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.03] border border-transparent'
                }`}>
                {cfg ? <SeverityIcon severity={sev as Severity} /> : <Eye className="w-4 h-4" />}
                <span className="flex-1 text-left capitalize">{sev}</span>
                <span className={`tabular-nums ${isActive ? 'text-white' : 'text-gray-600'}`}>{count}</span>
              </button>
            );
          })}
          {activeReport && (
            <div className="mt-4 pt-4 border-t border-white/[0.06]">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">{activeReport.agent.icon}</span>
                <span className="text-sm font-black">{activeReport.agent.name}</span>
              </div>
              <p className="text-[11px] text-gray-500 leading-relaxed">{activeReport.summary}</p>
            </div>
          )}
        </div>
      </div>
      <div className="col-span-9 space-y-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-bold text-gray-300">{selectedAgent ? `${AGENTS[selectedAgent].name}'s Findings` : 'All Findings'}</span>
            <span className="text-xs text-gray-600">({filteredFindings.length})</span>
            {isScanning && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1.5 ml-2 px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20">
                <Loader2 className="w-3 h-3 text-purple-400 animate-spin" />
                <span className="text-[10px] text-purple-300 font-bold">Scanning…</span>
              </motion.span>
            )}
          </div>
          {selectedAgent && <button onClick={() => setSelectedAgent(null)} className="text-xs text-gray-500 hover:text-white transition-colors">Show all</button>}
        </div>
        <AnimatePresence mode="popLayout">
          {filteredFindings.length === 0 && !isScanning ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16 text-center">
              <CheckCircle2 className="w-10 h-10 text-teal-500/30 mb-3" />
              <div className="text-sm font-bold text-gray-500">All Clear</div>
              <div className="text-xs text-gray-600 mt-1">{selectedAgent ? `${AGENTS[selectedAgent].name} found no issues` : 'No findings match filter'}</div>
            </motion.div>
          ) : (
            filteredFindings.slice(0, visibleFindings).map((finding, i) => <FindingCard key={finding.id} finding={finding} index={i} showAgent={!selectedAgent} />)
          )}
        </AnimatePresence>
      </div>
    </div>
  </div>
);

// ─── Finding Card ───────────────────────────────────────────────────

const FindingCard = ({ finding, index, showAgent }: { finding: Finding; index: number; showAgent: boolean }) => {
  const [expanded, setExpanded] = useState(false);
  const cfg = SEVERITY_CONFIG[finding.severity];
  const agent = AGENTS[finding.agentId];
  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.3), ease: EASE_OUT }}
      className={`rounded-xl border ${cfg.border} ${cfg.bg} backdrop-blur-xl overflow-hidden transition-all duration-200 hover:border-opacity-40`}>
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-start gap-3 p-4 text-left">
        <div className="mt-0.5"><SeverityIcon severity={finding.severity} /></div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {showAgent && <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: agent.accentHex }}>{agent.icon} {agent.name}</span>}
            <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
            {finding.portal && <span className="text-[10px] text-gray-600 font-medium">{finding.portal}</span>}
          </div>
          <div className="text-sm font-bold text-white leading-snug">{finding.title}</div>
          <div className="text-xs text-gray-400 mt-1 line-clamp-1">{finding.description}</div>
          {finding.metric && <span className="inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/[0.05] text-gray-400">{finding.metric}</span>}
        </div>
        <motion.div animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration: 0.2 }} className="text-gray-600 mt-1">
          <ChevronRight className="w-4 h-4" />
        </motion.div>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: EASE_OUT }} className="overflow-hidden">
            <div className="px-4 pb-4 pt-0 border-t border-white/[0.04]">
              <div className="pt-3 space-y-3">
                <div><div className="text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">Analysis</div><p className="text-xs text-gray-400 leading-relaxed">{finding.description}</p></div>
                <div><div className="text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">Recommendation</div><p className="text-xs text-gray-300 leading-relaxed">{finding.recommendation}</p></div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ─── Chat View ──────────────────────────────────────────────────────

interface ChatViewProps {
  projects: any[]; sellProjects: any[];
  milestoneStates: Record<string, any>;
}

const ChatView = ({ projects, sellProjects, milestoneStates }: ChatViewProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'agent',
      agentId: 'zeus',
      text: `Welcome to The Pantheon. I'm *Zeus*, and the council is ready to assist.\n\nAsk us anything about your projects, pipeline, milestones, SOP processes, or portal features. The right agent will respond with live data.\n\nTry: "Show me the pipeline" or "How is Maria Gonzalez doing?" or "What's M3?"`,
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(() => {
    const q = input.trim();
    if (!q) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: q,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    // Process immediately — no artificial delay
    const response = processChat(q, projects, sellProjects, milestoneStates);
    setMessages(prev => [...prev, response]);
  }, [input, projects, sellProjects, milestoneStates]);

  const suggestions = [
    'What\'s broken?',
    'Show me the pipeline',
    'Tell me about M3',
    'QC review status',
    'Fund release status',
    'What\'s the SOP process?',
  ];

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-6 flex flex-col" style={{ height: 'calc(100vh - 72px)' }}>
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pb-4 scrollbar-thin scrollbar-thumb-white/10">
        {messages.map(msg => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
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
                  <span className="text-[10px] text-gray-600">• {AGENTS[msg.agentId].domain}</span>
                </div>
              )}
              <div className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">
                {msg.text.split(/(\*[^*]+\*)/).map((part, i) =>
                  part.startsWith('*') && part.endsWith('*')
                    ? <strong key={i} className="text-white font-bold">{part.slice(1, -1)}</strong>
                    : <span key={i}>{part}</span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
        {/* Responses are instant — no typing indicator needed */}
      </div>

      {/* Quick Suggestions */}
      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 pb-3">
          {suggestions.map(s => (
            <button key={s} onClick={() => { setInput(s); setTimeout(() => inputRef.current?.focus(), 50); }}
              className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-gray-400 hover:text-white hover:border-white/15 transition-all">
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Ask the Pantheon anything..."
          className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 outline-none"
        />
        <button onClick={handleSend} disabled={!input.trim()}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
            input.trim() ? 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 btn-press' : 'text-gray-600'
          }`}>
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// ─── Diagnostic View ────────────────────────────────────────────────

interface DiagnosticViewProps {
  projects: any[]; sellProjects: any[];
  milestoneStates: Record<string, any>;
  tickets: any[];
}

const DiagnosticView = ({ projects, sellProjects, milestoneStates, tickets }: DiagnosticViewProps) => {
  const [phases, setPhases] = useState<DiagnosticPhase[]>([]);
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(-1);

  const startDiagnostic = async () => {
    setIsRunning(true);
    setResult(null);
    setPhases([]);
    setCurrentPhase(0);

    const res = await runDiagnostic(
      projects, sellProjects, milestoneStates, tickets,
      (updatedPhases, phaseIdx) => {
        setPhases([...updatedPhases]);
        setCurrentPhase(phaseIdx);
      }
    );

    setResult(res);
    setIsRunning(false);
  };

  const statusColors: Record<TestStatus, string> = {
    pass: 'text-emerald-400',
    fail: 'text-red-400',
    warn: 'text-yellow-400',
    skip: 'text-gray-500',
  };

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-6">
      {/* Start Button / Summary */}
      <div className="flex items-center justify-between p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
        <div>
          <div className="text-sm font-bold text-white mb-1">System Diagnostic</div>
          <div className="text-xs text-gray-500">
            {result
              ? `Completed in ${(result.duration / 1000).toFixed(1)}s — ${result.summary.total} tests`
              : 'Each agent explores their portal from the user\'s perspective, checking every feature and connection.'}
          </div>
        </div>
        <button
          onClick={startDiagnostic}
          disabled={isRunning}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all btn-press ${
            isRunning
              ? 'bg-purple-500/10 border border-purple-500/20 text-purple-300'
              : 'bg-gradient-to-r from-purple-500/20 to-teal-500/20 border border-white/10 text-white hover:border-white/20'
          }`}
        >
          {isRunning ? <><Loader2 className="w-4 h-4 animate-spin" /> Running...</> : <><FlaskConical className="w-4 h-4" /> Run Full Diagnostic</>}
        </button>
      </div>

      {/* Result Summary Bar */}
      {result && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {([
            { label: 'Passed', value: result.summary.pass, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
            { label: 'Failed', value: result.summary.fail, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
            { label: 'Warnings', value: result.summary.warn, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
            { label: 'Skipped', value: result.summary.skip, color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/20' },
          ]).map(s => (
            <div key={s.label} className={`p-4 rounded-xl ${s.bg} border ${s.border} text-center`}>
              <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Phase Results */}
      <div className="space-y-3">
        {phases.map((phase, pi) => {
          const agent = AGENTS[phase.agentId];
          return (
            <motion.div
              key={phase.agentId}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: pi * 0.1 }}
              className="rounded-xl bg-white/[0.02] border border-white/[0.06] overflow-hidden"
            >
              {/* Phase Header */}
              <div className="flex items-center gap-3 px-5 py-3 border-b border-white/[0.04]">
                <span className="text-lg">{agent.icon}</span>
                <div className="flex-1">
                  <div className="text-sm font-bold" style={{ color: agent.accentHex }}>{agent.name}</div>
                  <div className="text-[10px] text-gray-500">{phase.label} — {phase.portal}</div>
                </div>
                <div className="flex items-center gap-1.5">
                  {phase.status === 'running' && <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />}
                  {phase.status === 'done' && (
                    <>
                      <span className="text-emerald-400 text-xs font-bold">{phase.tests.filter(t => t.status === 'pass').length}✓</span>
                      {phase.tests.some(t => t.status === 'fail') && (
                        <span className="text-red-400 text-xs font-bold">{phase.tests.filter(t => t.status === 'fail').length}✗</span>
                      )}
                      {phase.tests.some(t => t.status === 'warn') && (
                        <span className="text-yellow-400 text-xs font-bold">{phase.tests.filter(t => t.status === 'warn').length}⚠</span>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Tests */}
              <div className="divide-y divide-white/[0.03]">
                {phase.tests.map((test, ti) => (
                  <motion.div
                    key={test.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: ti * 0.05 }}
                    className="flex items-start gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="mt-0.5"><TestStatusIcon status={test.status} /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{test.name}</span>
                        <span className={`text-[10px] font-bold uppercase ${statusColors[test.status]}`}>{test.status}</span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">{test.detail}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {phases.length === 0 && !isRunning && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FlaskConical className="w-12 h-12 text-gray-700 mb-4" />
          <div className="text-sm font-bold text-gray-500 mb-1">No diagnostic results yet</div>
          <div className="text-xs text-gray-600">Click "Run Full Diagnostic" to have each agent test their portal domain.</div>
        </div>
      )}
    </div>
  );
};

export default CouncilDashboard;
