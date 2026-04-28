/**
 * Council Engine — 4-Agent AI Council for Alpha Sale Pro
 *
 * Agents:
 *   1. UI Inspector — frontend visual/UX review
 *   2. Code Auditor — TypeScript/security/perf scanning
 *   3. Backend Operator — Supabase/API/data integrity
 *   4. User Comms — answers user questions with live data
 *
 * Also runs rule-based analysis for the Dashboard view.
 */

import type { Project, SellProject } from '@/data/mockData';
import type { ProjectMilestoneState } from '@/contexts/ProjectStore';
import { MILESTONE_SOPS } from '@/data/milestoneSOP';

const pf = (p: Project, field: string): string | undefined =>
  (p as Record<string, unknown>)[field] as string | undefined;

// ─── Types ──────────────────────────────────────────────────────────

export type AgentId = 'ui-inspector' | 'code-auditor' | 'backend-operator' | 'user-comms';
export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface CouncilAgent {
  id: AgentId;
  name: string;
  domain: string;
  description: string;
  icon: string;
  color: string;
  accentHex: string;
}

export interface Finding {
  id: string;
  agentId: AgentId;
  severity: Severity;
  title: string;
  description: string;
  recommendation: string;
  portal: string;
  metric?: string;
  projectIds?: string[];
  timestamp: string;
}

export interface AgentReport {
  agent: CouncilAgent;
  findings: Finding[];
  score: number;
  summary: string;
  lastAnalyzed: string;
}

export interface CouncilState {
  reports: AgentReport[];
  overallScore: number;
  totalFindings: number;
  criticalCount: number;
  lastFullScan: string;
}

// ─── Agent Definitions ──────────────────────────────────────────────

export const AGENTS: Record<AgentId, CouncilAgent> = {
  'ui-inspector': {
    id: 'ui-inspector',
    name: 'UI Inspector',
    domain: 'Frontend & UX',
    description: 'Reviews components, layouts, error states, and accessibility.',
    icon: '🔍',
    color: 'text-cyan-400',
    accentHex: '#00D4C8',
  },
  'code-auditor': {
    id: 'code-auditor',
    name: 'Code Auditor',
    domain: 'Security & Quality',
    description: 'Scans for errors, vulnerabilities, dead code, and performance issues.',
    icon: '🛡️',
    color: 'text-red-400',
    accentHex: '#EB5757',
  },
  'backend-operator': {
    id: 'backend-operator',
    name: 'Backend Operator',
    domain: 'Infrastructure',
    description: 'Monitors Supabase, API routes, data integrity, and server health.',
    icon: '⚙️',
    color: 'text-blue-400',
    accentHex: '#4EA7FC',
  },
  'user-comms': {
    id: 'user-comms',
    name: 'User Comms',
    domain: 'Support & Intel',
    description: 'Answers questions about deals, milestones, and platform features.',
    icon: '💬',
    color: 'text-purple-400',
    accentHex: '#BB87FC',
  },
};

export const SEVERITY_CONFIG: Record<Severity, { label: string; color: string; bg: string; border: string; weight: number }> = {
  critical: { label: 'Critical', color: 'text-red-400', bg: 'bg-red-500/[0.06]', border: 'border-red-500/20', weight: 25 },
  high: { label: 'High', color: 'text-orange-400', bg: 'bg-orange-500/[0.06]', border: 'border-orange-500/20', weight: 15 },
  medium: { label: 'Medium', color: 'text-yellow-400', bg: 'bg-yellow-500/[0.06]', border: 'border-yellow-500/20', weight: 8 },
  low: { label: 'Low', color: 'text-blue-400', bg: 'bg-blue-500/[0.06]', border: 'border-blue-500/20', weight: 3 },
  info: { label: 'Info', color: 'text-gray-400', bg: 'bg-white/[0.02]', border: 'border-white/[0.06]', weight: 0 },
};

// ─── Utility ────────────────────────────────────────────────────────

const makeFinding = (
  agentId: AgentId, severity: Severity, title: string,
  description: string, recommendation: string, portal: string,
  opts?: { metric?: string; projectIds?: string[] }
): Finding => ({
  id: `${agentId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  agentId, severity, title, description, recommendation, portal,
  metric: opts?.metric, projectIds: opts?.projectIds,
  timestamp: new Date().toISOString(),
});

const daysSince = (dateStr?: string | null): number => {
  if (!dateStr) return Infinity;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
};

// ─── UI Inspector Analysis ──────────────────────────────────────────

function analyzeUIInspector(projects: Project[], sellProjects: SellProject[], milestoneStates: Record<string, ProjectMilestoneState>): Finding[] {
  const findings: Finding[] = [];

  if (projects.length > 0) {
    findings.push(makeFinding('ui-inspector', 'medium',
      'Pipeline uses sell-derived data when real projects exist',
      'Pipeline component creates derived project objects from sell_projects with hardcoded values (soldPPW: 3.20) instead of showing real project data.',
      'Prioritize projects table data in Pipeline.tsx. Only fall back to sell-derived entries for deals not yet created as projects.',
      'Sales Portal'));
  }

  const projectsWithFullData = projects.filter(p =>
    p.customerName && p.address && p.contractValue && pf(p, 'financier') && p.systemSize
  );
  const completenessRate = projects.length > 0 ? Math.round((projectsWithFullData.length / projects.length) * 100) : 100;
  if (completenessRate < 80) {
    findings.push(makeFinding('ui-inspector', 'medium',
      `${100 - completenessRate}% of projects display incomplete data across portals`,
      `${projects.length - projectsWithFullData.length} projects are missing display fields (name, address, value, financier, system size). Portals show gaps, placeholders, or $0.`,
      'Complete all project fields through the Ops Portal editor. Focus on contract value and financier first.',
      'Cross-Portal UX'));
  }

  findings.push(makeFinding('ui-inspector', 'low',
    'Notification center depends on a notifications table',
    'NotificationCenter component relies on a notifications table. If it does not exist, the bell appears but shows nothing.',
    'Verify the notifications table exists in Supabase with the schema from notificationCascade.ts.',
    'Cross-Portal'));

  return findings;
}

// ─── Code Auditor Analysis ──────────────────────────────────────────

function analyzeCodeAuditor(projects: Project[], sellProjects: SellProject[], milestoneStates: Record<string, ProjectMilestoneState>): Finding[] {
  const findings: Finding[] = [];

  const missingStates = projects.filter(p => !milestoneStates[p.id]);
  if (missingStates.length > 0) {
    findings.push(makeFinding('code-auditor', 'critical',
      `${missingStates.length} project${missingStates.length > 1 ? 's' : ''} missing milestone_states row`,
      `Projects without milestone tracking: ${missingStates.map(p => `${p.customerName} (M${p.currentMilestone})`).join(', ')}. The M1-M7 flow is broken for these.`,
      'Create milestone_states rows. Check the project creation flow in SupabaseProjectStore.',
      'Data Integrity', { metric: `${missingStates.length} missing`, projectIds: missingStates.map(p => p.id) }));
  }

  const zeroValue = projects.filter(p => !p.contractValue || p.contractValue === 0);
  if (zeroValue.length > 0) {
    findings.push(makeFinding('code-auditor', 'high',
      `${zeroValue.length} project${zeroValue.length > 1 ? 's' : ''} with $0 contract value`,
      `Projects: ${zeroValue.map(p => p.customerName).join(', ')}. Fund release calculations produce $0 for every milestone.`,
      'Update contract values in the Ops Portal project editor.',
      'Data Integrity', { metric: `${zeroValue.length} at $0`, projectIds: zeroValue.map(p => p.id) }));
  }

  const noCreditConvert = sellProjects.filter(sp =>
    sp.convertedToSale && sp.creditStatus !== 'passed' && sp.creditStatus !== 'credit_passed'
  );
  if (noCreditConvert.length > 0) {
    findings.push(makeFinding('code-auditor', 'critical',
      `SOP Violation: ${noCreditConvert.length} deal${noCreditConvert.length > 1 ? 's' : ''} converted without passing credit`,
      `Deals: ${noCreditConvert.map(sp => `${sp.firstName} ${sp.lastName} (credit: ${sp.creditStatus || 'not run'})`).join(', ')}. Credit must pass before conversion per SOP.`,
      'Flag these deals as dirty in QC. The credit guard may have been bypassed.',
      'Compliance', { metric: `${noCreditConvert.length} violations` }));
  }

  const fundsWithoutApproval = projects.filter(p => {
    const ms = milestoneStates[p.id];
    if (!ms) return false;
    return Object.entries(ms.fundStatus || {}).some(([idx, status]) =>
      status === 'released' && !ms.opsApproved?.[Number(idx)]
    );
  });
  if (fundsWithoutApproval.length > 0) {
    findings.push(makeFinding('code-auditor', 'critical',
      `SOP Violation: ${fundsWithoutApproval.length} project${fundsWithoutApproval.length > 1 ? 's' : ''} have fund releases without ops approval`,
      `Funds released for unapproved milestones: ${fundsWithoutApproval.map(p => p.customerName).join(', ')}. Money left escrow without verification.`,
      'Audit these releases immediately. Hold future releases until retroactive review is completed.',
      'Compliance', { metric: `${fundsWithoutApproval.length} ungated releases` }));
  }

  return findings;
}

// ─── Backend Operator Analysis ──────────────────────────────────────

function analyzeBackendOperator(projects: Project[], sellProjects: SellProject[], milestoneStates: Record<string, ProjectMilestoneState>): Finding[] {
  const findings: Finding[] = [];

  const stalled = projects.filter(p => p.status === 'active' && daysSince(pf(p, 'updatedAt') || p.addedDate) > 7);
  if (stalled.length > 0) {
    findings.push(makeFinding('backend-operator', 'high',
      `${stalled.length} project${stalled.length > 1 ? 's' : ''} stalled (7+ days no activity)`,
      `Stalled: ${stalled.map(p => `${p.customerName} (M${p.currentMilestone})`).join(', ')}. Blocks fund releases and hurts installer ratings.`,
      'Review in Ops Portal. Check if installers are waiting on permits, equipment, or homeowner communication.',
      'Operations', { metric: `${stalled.length} stalled`, projectIds: stalled.map(p => p.id) }));
  }

  const pendingFunds = projects.filter(p => {
    const ms = milestoneStates[p.id];
    if (!ms) return false;
    return Object.entries(ms.opsApproved || {}).some(([idx, approved]) =>
      approved && (ms.fundStatus?.[Number(idx)] || 'pending') !== 'released'
    );
  });
  if (pendingFunds.length > 0) {
    findings.push(makeFinding('backend-operator', 'high',
      `${pendingFunds.length} project${pendingFunds.length > 1 ? 's' : ''} with approved milestones awaiting fund release`,
      `Milestones approved but funds unreleased: ${pendingFunds.map(p => p.customerName).join(', ')}. SOP requires release within 24 hours of approval.`,
      'Process pending fund releases in the Financier Portal.',
      'Operations', { metric: `${pendingFunds.length} pending`, projectIds: pendingFunds.map(p => p.id) }));
  }

  const convertedButNoProject = sellProjects.filter(sp =>
    sp.convertedToSale && sp.qcInitialApproved &&
    !projects.some(p => p.customerName?.toLowerCase().includes(sp.firstName?.toLowerCase() || '---'))
  );
  if (convertedButNoProject.length > 0) {
    findings.push(makeFinding('backend-operator', 'critical',
      `${convertedButNoProject.length} deal${convertedButNoProject.length > 1 ? 's' : ''} QC-approved but no project created`,
      `Orphaned deals: ${convertedButNoProject.map(sp => `${sp.firstName} ${sp.lastName}`).join(', ')}. Stuck between portals — installer sees nothing.`,
      'Create projects for these deals in Ops Portal. Check the deal-to-project creation flow.',
      'Data Sync', { metric: `${convertedButNoProject.length} orphaned` }));
  }

  const noFinancier = projects.filter(p => { const f = pf(p, 'financier'); return !f || f === 'TBD' || f === 'Not set'; });
  if (noFinancier.length > 0) {
    findings.push(makeFinding('backend-operator', 'medium',
      `${noFinancier.length} project${noFinancier.length > 1 ? 's' : ''} without financier assignment`,
      `Missing financier: ${noFinancier.map(p => p.customerName).join(', ')}. Fund releases cannot trigger without a financier.`,
      'Assign a financier (Goodleap, Sunlight, Mosaic) through the Ops Portal.',
      'Operations', { metric: `${noFinancier.length} unassigned` }));
  }

  return findings;
}

// ─── User Comms Analysis ────────────────────────────────────────────

function analyzeUserComms(projects: Project[], sellProjects: SellProject[], milestoneStates: Record<string, ProjectMilestoneState>): Finding[] {
  const findings: Finding[] = [];
  const totalValue = projects.reduce((s, p) => s + (p.contractValue || 0), 0);
  const converted = sellProjects.filter(sp => sp.convertedToSale).length;
  const convRate = sellProjects.length > 0 ? (converted / sellProjects.length) * 100 : 0;

  if (sellProjects.length > 0 && convRate < 40) {
    findings.push(makeFinding('user-comms', convRate < 20 ? 'high' : 'medium',
      `Conversion rate is ${convRate.toFixed(0)}%`,
      `${converted} of ${sellProjects.length} leads converted. ${sellProjects.filter(sp => !sp.creditStatus || sp.creditStatus === 'pending').length} haven't run credit.`,
      'Focus on converting credit-passed leads within 48 hours.',
      'Strategy', { metric: `${convRate.toFixed(0)}% rate` }));
  }

  if (projects.length > 0) {
    findings.push(makeFinding('user-comms', 'info',
      `Pipeline: $${totalValue.toLocaleString()} across ${projects.length} projects`,
      `Average: $${Math.round(totalValue / projects.length).toLocaleString()}. Early-stage: ${projects.filter(p => p.currentMilestone <= 2).length}, mid: ${projects.filter(p => p.currentMilestone >= 3 && p.currentMilestone <= 5).length}, late: ${projects.filter(p => p.currentMilestone >= 6).length}.`,
      'Continue balanced pipeline management.',
      'Strategy', { metric: `$${(totalValue / 1000).toFixed(0)}K` }));
  }

  const creditPassedNotConverted = sellProjects.filter(sp =>
    (sp.creditStatus === 'passed' || sp.creditStatus === 'credit_passed') && !sp.convertedToSale
  );
  if (creditPassedNotConverted.length > 0) {
    findings.push(makeFinding('user-comms', 'high',
      `${creditPassedNotConverted.length} lead${creditPassedNotConverted.length > 1 ? 's' : ''} passed credit but not converted`,
      `Ready to convert: ${creditPassedNotConverted.map(sp => `${sp.firstName} ${sp.lastName}`).join(', ')}. These are your highest-probability deals.`,
      'Convert today. Fast-track Aurora design if needed.',
      'Strategy', { metric: `${creditPassedNotConverted.length} ready` }));
  }

  return findings;
}

// ─── Score & Summary ────────────────────────────────────────────────

function calculateScore(findings: Finding[]): number {
  if (findings.length === 0) return 100;
  const penalty = findings.reduce((s, f) => s + SEVERITY_CONFIG[f.severity].weight, 0);
  return Math.max(0, Math.min(100, 100 - penalty));
}

function generateSummary(agent: CouncilAgent, findings: Finding[], score: number): string {
  const criticals = findings.filter(f => f.severity === 'critical').length;
  const highs = findings.filter(f => f.severity === 'high').length;
  if (criticals > 0) return `${agent.name} found ${criticals} critical issue${criticals > 1 ? 's' : ''} requiring immediate attention.`;
  if (highs > 0) return `${agent.name} identified ${highs} high-priority finding${highs > 1 ? 's' : ''}.`;
  if (findings.length > 0) return `${agent.name} found ${findings.length} item${findings.length > 1 ? 's' : ''} to review.`;
  return `${agent.name}: All clear. No issues detected.`;
}

// ─── Context Builder (for AI agent prompts) ─────────────────────────

export function buildDataContext(
  projects: Project[],
  sellProjects: SellProject[],
  milestoneStates: Record<string, ProjectMilestoneState>,
): string {
  const projectDetails = projects.map(p => {
    const ms = milestoneStates[p.id];
    const completedMilestones = ms ? Object.entries(ms.opsApproved || {}).filter(([, v]) => v).length : 0;
    return `• ${p.customerName} | ${p.status} | M${p.currentMilestone}/7 | $${(p.contractValue || 0).toLocaleString()} | ${completedMilestones} approved`;
  }).join('\n');

  const dealDetails = sellProjects.map(sp => {
    const status = sp.convertedToSale ? 'Converted' : sp.creditStatus === 'passed' || sp.creditStatus === 'credit_passed' ? 'Credit passed' : sp.creditStatus || 'New';
    return `• ${sp.firstName} ${sp.lastName} | ${status} | ${sp.address || 'No address'}`;
  }).join('\n');

  const activeProjects = projects.filter(p => p.status === 'active').length;
  const totalValue = projects.reduce((s, p) => s + (p.contractValue || 0), 0);

  return [
    `Active projects: ${activeProjects} | Total pipeline: $${totalValue.toLocaleString()}`,
    `Leads: ${sellProjects.length} total | ${sellProjects.filter(sp => sp.convertedToSale).length} converted`,
    '',
    'PROJECTS:',
    projectDetails || 'None',
    '',
    'LEADS:',
    dealDetails || 'None',
  ].join('\n');
}

// ─── Main Analysis ──────────────────────────────────────────────────

export function runCouncilAnalysis(
  projects: Project[],
  sellProjects: SellProject[],
  milestoneStates: Record<string, ProjectMilestoneState>
): CouncilState {
  const now = new Date().toISOString();
  const agentAnalyzers: Record<AgentId, () => Finding[]> = {
    'ui-inspector': () => analyzeUIInspector(projects, sellProjects, milestoneStates),
    'code-auditor': () => analyzeCodeAuditor(projects, sellProjects, milestoneStates),
    'backend-operator': () => analyzeBackendOperator(projects, sellProjects, milestoneStates),
    'user-comms': () => analyzeUserComms(projects, sellProjects, milestoneStates),
  };

  const reports: AgentReport[] = (Object.keys(AGENTS) as AgentId[]).map(agentId => {
    const agent = AGENTS[agentId];
    const findings = agentAnalyzers[agentId]();
    const score = calculateScore(findings);
    return { agent, findings, score, summary: generateSummary(agent, findings, score), lastAnalyzed: now };
  });

  const allFindings = reports.flatMap(r => r.findings);
  const overallScore = reports.length > 0 ? Math.round(reports.reduce((s, r) => s + r.score, 0) / reports.length) : 100;

  return {
    reports,
    overallScore,
    totalFindings: allFindings.length,
    criticalCount: allFindings.filter(f => f.severity === 'critical').length,
    lastFullScan: now,
  };
}
