/**
 * Council Dashboard — Live AI-powered operations intelligence.
 * 
 * The Pantheon: 5 Greek god agents analyze real Supabase data in real-time.
 * No mock data, no hardcoded findings. Every metric is computed from live project state.
 */
import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDataSource } from '@/contexts/DataSourceProvider';
import { runCouncilAnalysis, AGENTS, SEVERITY_CONFIG, type AgentId, type Finding, type CouncilState, type Severity } from '@/services/councilEngine';
import {
  Shield, Activity, ChevronRight, ChevronDown, ExternalLink,
  AlertTriangle, AlertCircle, Info, CheckCircle2, Zap,
  BarChart3, Eye, RefreshCw,
} from 'lucide-react';

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

// Score ring SVG component
const ScoreRing = ({ score, size = 80, strokeWidth = 6, color }: { score: number; size?: number; strokeWidth?: number; color: string }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={strokeWidth} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeLinecap="round" strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, ease: EASE_OUT, delay: 0.2 }}
      />
    </svg>
  );
};

// Severity icon
const SeverityIcon = ({ severity }: { severity: Severity }) => {
  const cfg = SEVERITY_CONFIG[severity];
  switch (severity) {
    case 'critical': return <AlertTriangle className={`w-4 h-4 ${cfg.color}`} />;
    case 'high': return <AlertCircle className={`w-4 h-4 ${cfg.color}`} />;
    case 'medium': return <Zap className={`w-4 h-4 ${cfg.color}`} />;
    case 'low': return <Info className={`w-4 h-4 ${cfg.color}`} />;
    case 'info': return <CheckCircle2 className={`w-4 h-4 ${cfg.color}`} />;
  }
};

const scoreColor = (score: number) =>
  score >= 80 ? '#00D4C8' : score >= 60 ? '#F2C94C' : score >= 40 ? '#F2994A' : '#EB5757';

const CouncilDashboard = () => {
  const { projects, sellProjects, milestoneStates } = useDataSource();
  const [selectedAgent, setSelectedAgent] = useState<AgentId | null>(null);
  const [severityFilter, setSeverityFilter] = useState<Severity | 'all'>('all');
  const [scanKey, setScanKey] = useState(0); // for re-scan animation

  // Run live analysis
  const council: CouncilState = useMemo(() => {
    return runCouncilAnalysis(projects, sellProjects, milestoneStates);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects, sellProjects, milestoneStates, scanKey]);

  const activeReport = selectedAgent ? council.reports.find(r => r.agent.id === selectedAgent) : null;
  const allFindings = council.reports.flatMap(r => r.findings);
  const filteredFindings = (selectedAgent ? activeReport?.findings || [] : allFindings)
    .filter(f => severityFilter === 'all' || f.severity === severityFilter)
    .sort((a, b) => {
      const order: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
      return order[a.severity] - order[b.severity];
    });

  const handleRescan = () => setScanKey(k => k + 1);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <div className="border-b border-white/[0.06] bg-black/30 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-teal-500/20 border border-white/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight">The Pantheon</h1>
                <p className="text-xs text-gray-500 font-medium">AI Operations Council • Live Analysis</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleRescan}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs font-semibold text-gray-400 hover:text-white hover:border-white/20 transition-all btn-press"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Re-scan
              </button>
              <a
                href="https://linear.app/alpha-sale-pro-hub/team/ALP/active"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs font-semibold text-gray-400 hover:text-white hover:border-white/20 transition-all btn-press"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Linear Board
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Overall Score + Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
          className="flex items-center gap-6 p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl"
        >
          <div className="relative flex items-center justify-center">
            <ScoreRing score={council.overallScore} size={88} strokeWidth={7} color={scoreColor(council.overallScore)} />
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.span
                key={council.overallScore}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-2xl font-black"
                style={{ color: scoreColor(council.overallScore) }}
              >
                {council.overallScore}
              </motion.span>
            </div>
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold text-white mb-1">System Health Score</div>
            <div className="text-xs text-gray-500">
              {council.totalFindings} finding{council.totalFindings !== 1 ? 's' : ''} across {council.reports.length} agents
              {council.criticalCount > 0 && (
                <span className="text-red-400 font-semibold ml-2">• {council.criticalCount} critical</span>
              )}
            </div>
          </div>
          <div className="flex gap-4">
            {[
              { label: 'Projects', value: projects.length, color: 'text-teal-400' },
              { label: 'Leads', value: sellProjects.length, color: 'text-blue-400' },
              { label: 'Findings', value: council.totalFindings, color: council.criticalCount > 0 ? 'text-red-400' : 'text-yellow-400' },
            ].map(stat => (
              <div key={stat.label} className="text-center px-4">
                <div className={`text-xl font-black ${stat.color}`}>{stat.value}</div>
                <div className="text-[10px] text-gray-600 font-semibold uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Agent Cards Grid */}
        <div className="grid grid-cols-5 gap-3">
          {council.reports.map((report, i) => {
            const isSelected = selectedAgent === report.agent.id;
            return (
              <motion.button
                key={report.agent.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.05 * i, ease: EASE_OUT }}
                onClick={() => setSelectedAgent(isSelected ? null : report.agent.id)}
                className={`relative p-4 rounded-xl border text-left transition-all duration-300 ${
                  isSelected
                    ? 'bg-white/[0.06] border-white/20 shadow-lg'
                    : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/10'
                }`}
              >
                {/* Active indicator */}
                {isSelected && (
                  <motion.div
                    layoutId="agent-indicator"
                    className="absolute inset-0 rounded-xl border-2 pointer-events-none"
                    style={{ borderColor: report.agent.accentHex + '40' }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
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
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-black" style={{ color: report.agent.accentHex }}>
                      {report.score}
                    </span>
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

        {/* Findings Section */}
        <div className="grid grid-cols-12 gap-5">
          {/* Severity Filter Sidebar */}
          <div className="col-span-3">
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Filter by Severity</div>
              {(['all', 'critical', 'high', 'medium', 'low', 'info'] as const).map(sev => {
                const count = sev === 'all'
                  ? (selectedAgent ? activeReport?.findings.length || 0 : allFindings.length)
                  : (selectedAgent ? activeReport?.findings || [] : allFindings).filter(f => f.severity === sev).length;
                const cfg = sev === 'all' ? null : SEVERITY_CONFIG[sev];
                const isActive = severityFilter === sev;

                return (
                  <button
                    key={sev}
                    onClick={() => setSeverityFilter(sev)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-white/[0.08] text-white border border-white/10'
                        : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.03] border border-transparent'
                    }`}
                  >
                    {cfg ? <SeverityIcon severity={sev as Severity} /> : <Eye className="w-4 h-4" />}
                    <span className="flex-1 text-left capitalize">{sev}</span>
                    <span className={`tabular-nums ${isActive ? 'text-white' : 'text-gray-600'}`}>{count}</span>
                  </button>
                );
              })}

              {/* Agent Summary */}
              {activeReport && (
                <div className="mt-4 pt-4 border-t border-white/[0.06]">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base">{activeReport.agent.icon}</span>
                    <span className="text-sm font-black">{activeReport.agent.name}</span>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-relaxed">{activeReport.summary}</p>
                  <p className="text-[10px] text-gray-600 mt-2">{activeReport.agent.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Findings List */}
          <div className="col-span-9 space-y-2">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-bold text-gray-300">
                  {selectedAgent ? `${AGENTS[selectedAgent].name}'s Findings` : 'All Findings'}
                </span>
                <span className="text-xs text-gray-600">({filteredFindings.length})</span>
              </div>
              {selectedAgent && (
                <button
                  onClick={() => setSelectedAgent(null)}
                  className="text-xs text-gray-500 hover:text-white transition-colors"
                >
                  Show all agents
                </button>
              )}
            </div>

            <AnimatePresence mode="popLayout">
              {filteredFindings.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-16 text-center"
                >
                  <CheckCircle2 className="w-10 h-10 text-teal-500/30 mb-3" />
                  <div className="text-sm font-bold text-gray-500">All Clear</div>
                  <div className="text-xs text-gray-600 mt-1">
                    {selectedAgent ? `${AGENTS[selectedAgent].name} found no issues` : 'No findings match the current filter'}
                  </div>
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
    </div>
  );
};

// Individual finding card
const FindingCard = ({ finding, index, showAgent }: { finding: Finding; index: number; showAgent: boolean }) => {
  const [expanded, setExpanded] = useState(false);
  const cfg = SEVERITY_CONFIG[finding.severity];
  const agent = AGENTS[finding.agentId];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.3), ease: EASE_OUT }}
      className={`rounded-xl border ${cfg.border} ${cfg.bg} backdrop-blur-xl overflow-hidden transition-all duration-200 hover:border-opacity-40`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-3 p-4 text-left"
      >
        <div className="mt-0.5">
          <SeverityIcon severity={finding.severity} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {showAgent && (
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: agent.accentHex }}>
                {agent.icon} {agent.name}
              </span>
            )}
            <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.color}`}>
              {cfg.label}
            </span>
            {finding.portal && (
              <span className="text-[10px] text-gray-600 font-medium">{finding.portal}</span>
            )}
          </div>
          <div className="text-sm font-bold text-white leading-snug">{finding.title}</div>
          <div className="text-xs text-gray-400 mt-1 line-clamp-1">{finding.description}</div>
          {finding.metric && (
            <span className="inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/[0.05] text-gray-400">
              {finding.metric}
            </span>
          )}
        </div>
        <motion.div
          animate={{ rotate: expanded ? 90 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-gray-600 mt-1"
        >
          <ChevronRight className="w-4 h-4" />
        </motion.div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE_OUT }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-0 border-t border-white/[0.04]">
              <div className="pt-3 space-y-3">
                <div>
                  <div className="text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">Analysis</div>
                  <p className="text-xs text-gray-400 leading-relaxed">{finding.description}</p>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">Recommendation</div>
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
