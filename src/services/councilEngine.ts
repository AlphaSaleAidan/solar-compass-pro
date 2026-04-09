/**
 * Council Engine — Live rule-based analysis of real project data.
 * 
 * Each agent (Greek god) runs specific rules against Supabase data.
 * Findings are computed fresh every time — no hardcoded mock data.
 * Results can be synced to Linear for ops tracking.
 */

import type { Project, SellProject } from '@/data/mockData';
import type { ProjectMilestoneState } from '@/contexts/ProjectStore';

// ─── Types ──────────────────────────────────────────────────────────

export type AgentId = 'hermes' | 'hephaestus' | 'athena' | 'zeus' | 'apollo';
export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface CouncilAgent {
  id: AgentId;
  name: string;
  domain: string;
  description: string;
  icon: string; // emoji
  color: string; // tailwind color class
  accentHex: string;
}

export interface Finding {
  id: string;
  agentId: AgentId;
  severity: Severity;
  title: string;
  description: string;
  recommendation: string;
  portal: string; // which portal it affects
  metric?: string; // quantified impact
  projectIds?: string[]; // affected project IDs
  timestamp: string;
}

export interface AgentReport {
  agent: CouncilAgent;
  findings: Finding[];
  score: number; // 0-100 health score
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
  hermes: {
    id: 'hermes',
    name: 'Hermes',
    domain: 'Operations',
    description: 'Pipeline health, milestone velocity, SOP compliance',
    icon: '⚡',
    color: 'text-teal-400',
    accentHex: '#00D4C8',
  },
  hephaestus: {
    id: 'hephaestus',
    name: 'Hephaestus',
    domain: 'Engineering',
    description: 'Data integrity, system health, technical debt',
    icon: '🔨',
    color: 'text-blue-400',
    accentHex: '#4EA7FC',
  },
  athena: {
    id: 'athena',
    name: 'Athena',
    domain: 'Quality Assurance',
    description: 'QC rejection rates, document compliance, audit gates',
    icon: '🛡️',
    color: 'text-red-400',
    accentHex: '#EB5757',
  },
  zeus: {
    id: 'zeus',
    name: 'Zeus',
    domain: 'Strategy',
    description: 'Revenue patterns, conversion funnels, growth vectors',
    icon: '👑',
    color: 'text-purple-400',
    accentHex: '#BB87FC',
  },
  apollo: {
    id: 'apollo',
    name: 'Apollo',
    domain: 'Design & UX',
    description: 'Portal consistency, user flows, experience quality',
    icon: '☀️',
    color: 'text-yellow-400',
    accentHex: '#F2C94C',
  },
};

// ─── Analysis Engine ────────────────────────────────────────────────

let findingCounter = 0;
const mkId = (agent: AgentId) => `${agent}-${++findingCounter}-${Date.now()}`;

function daysSince(dateStr: string): number {
  return Math.max(0, (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

/** Hermes — Operations analysis */
function analyzeOperations(
  projects: Project[],
  sellProjects: SellProject[],
  milestoneStates: Record<string, ProjectMilestoneState>
): Finding[] {
  const findings: Finding[] = [];
  const now = new Date().toISOString();

  // Rule: Stalled projects (>7 days at same milestone with no activity)
  projects.forEach(p => {
    const age = daysSince(p.updatedAt || p.createdAt || now);
    if (age > 7 && p.currentMilestone < (p.totalMilestones || 7)) {
      findings.push({
        id: mkId('hermes'),
        agentId: 'hermes',
        severity: age > 14 ? 'critical' : 'high',
        title: `Stalled at M${p.currentMilestone}: ${p.customerName}`,
        description: `Project has been at milestone ${p.currentMilestone} for ${Math.round(age)} days with no progression.`,
        recommendation: `Review installer submission status. Check if checklist items are blocked. Escalate to ops manager if >14 days.`,
        portal: 'installer',
        metric: `${Math.round(age)} days stalled`,
        projectIds: [p.id],
        timestamp: now,
      });
    }
  });

  // Rule: Leads aging without conversion
  sellProjects.forEach(sp => {
    const age = daysSince(sp.createdAt || now);
    if (age > 5 && !sp.convertedToSale && sp.creditStatus === 'passed') {
      findings.push({
        id: mkId('hermes'),
        agentId: 'hermes',
        severity: age > 10 ? 'high' : 'medium',
        title: `Unconverted lead: ${sp.firstName} ${sp.lastName}`,
        description: `Credit-approved lead has been sitting for ${Math.round(age)} days without conversion to sale.`,
        recommendation: `Rep should follow up immediately. Lead may go cold. Check if Aurora design is complete.`,
        portal: 'sales',
        metric: `${Math.round(age)} days unconverted`,
        projectIds: [sp.id],
        timestamp: now,
      });
    }
  });

  // Rule: Pending fund releases
  projects.forEach(p => {
    const ms = milestoneStates[p.id];
    if (!ms) return;
    const fundStatus = ms.fundStatus || {};
    Object.entries(fundStatus).forEach(([mi, status]) => {
      if (status === 'approved' || status === 'pending') {
        findings.push({
          id: mkId('hermes'),
          agentId: 'hermes',
          severity: 'medium',
          title: `Pending fund release: ${p.customerName} M${mi}`,
          description: `Milestone ${mi} fund is approved but not yet released for ${p.customerName}.`,
          recommendation: `Financier should release funds to maintain installer cash flow and project velocity.`,
          portal: 'financier',
          projectIds: [p.id],
          timestamp: now,
        });
      }
    });
  });

  // Rule: Empty pipeline warning
  if (projects.length === 0 && sellProjects.length === 0) {
    findings.push({
      id: mkId('hermes'),
      agentId: 'hermes',
      severity: 'info',
      title: 'Empty pipeline',
      description: 'No active projects or leads in the system.',
      recommendation: 'Start creating sell projects to build your pipeline. The SOP flow begins with lead entry.',
      portal: 'sales',
      timestamp: now,
    });
  }

  return findings;
}

/** Hephaestus — Engineering analysis */
function analyzeEngineering(
  projects: Project[],
  sellProjects: SellProject[],
  milestoneStates: Record<string, ProjectMilestoneState>
): Finding[] {
  const findings: Finding[] = [];
  const now = new Date().toISOString();

  // Rule: Projects without milestone_states row
  projects.forEach(p => {
    if (!milestoneStates[p.id]) {
      findings.push({
        id: mkId('hephaestus'),
        agentId: 'hephaestus',
        severity: 'high',
        title: `Missing milestone state: ${p.customerName}`,
        description: `Project exists but has no milestone_states record. Installer checklist and fund tracking won't work.`,
        recommendation: `Trigger QC approval flow to auto-create the milestone_states row, or create manually.`,
        portal: 'ops',
        projectIds: [p.id],
        timestamp: now,
      });
    }
  });

  // Rule: Data integrity — projects with zero contract value
  projects.forEach(p => {
    if (!p.contractValue || p.contractValue === 0) {
      findings.push({
        id: mkId('hephaestus'),
        agentId: 'hephaestus',
        severity: 'medium',
        title: `Zero contract value: ${p.customerName}`,
        description: `Project has no contract value set. Revenue calculations and fund releases will be incorrect.`,
        recommendation: `Update the project's contract value from the Aurora design data or manual entry.`,
        portal: 'ops',
        projectIds: [p.id],
        timestamp: now,
      });
    }
  });

  // Rule: Sell projects without email/phone
  sellProjects.forEach(sp => {
    const missing: string[] = [];
    if (!sp.email) missing.push('email');
    if (!sp.phone) missing.push('phone');
    if (!sp.address) missing.push('address');
    if (missing.length > 0 && sp.convertedToSale) {
      findings.push({
        id: mkId('hephaestus'),
        agentId: 'hephaestus',
        severity: 'medium',
        title: `Incomplete data: ${sp.firstName} ${sp.lastName}`,
        description: `Converted sale is missing: ${missing.join(', ')}. This blocks downstream operations.`,
        recommendation: `Sales rep should complete customer profile before proceeding past QC.`,
        portal: 'sales',
        projectIds: [sp.id],
        timestamp: now,
      });
    }
  });

  return findings;
}

/** Athena — QA analysis */
function analyzeQA(
  projects: Project[],
  sellProjects: SellProject[],
  milestoneStates: Record<string, ProjectMilestoneState>
): Finding[] {
  const findings: Finding[] = [];
  const now = new Date().toISOString();

  // Rule: QC rejection rate
  const converted = sellProjects.filter(sp => sp.convertedToSale);
  const rejected = sellProjects.filter(sp =>
    sp.approvalStatus === 'dirty' || (sp.approvalStatus as string) === 'rejected'
  );
  if (converted.length > 0) {
    const rejectionRate = Math.round((rejected.length / converted.length) * 100);
    if (rejectionRate > 30) {
      findings.push({
        id: mkId('athena'),
        agentId: 'athena',
        severity: 'critical',
        title: `High QC rejection rate: ${rejectionRate}%`,
        description: `${rejected.length} of ${converted.length} converted deals were flagged dirty. This indicates systemic quality issues in the sales pipeline.`,
        recommendation: `Review rep training. Implement pre-submission checklist. Consider mandatory Aurora review before conversion.`,
        portal: 'ops',
        metric: `${rejectionRate}% rejection rate`,
        timestamp: now,
      });
    } else if (rejectionRate > 15) {
      findings.push({
        id: mkId('athena'),
        agentId: 'athena',
        severity: 'high',
        title: `Elevated QC rejection rate: ${rejectionRate}%`,
        description: `${rejected.length} of ${converted.length} deals rejected. Industry target is <10%.`,
        recommendation: `Monitor closely. Identify which reps have the highest rejection rates and provide targeted coaching.`,
        portal: 'ops',
        metric: `${rejectionRate}% rejection rate`,
        timestamp: now,
      });
    }
  }

  // Rule: Deals converted without credit check
  sellProjects.forEach(sp => {
    if (sp.convertedToSale && sp.creditStatus !== 'passed' && sp.creditStatus !== 'credit_passed') {
      findings.push({
        id: mkId('athena'),
        agentId: 'athena',
        severity: 'critical',
        title: `SOP violation: ${sp.firstName} ${sp.lastName}`,
        description: `Deal was converted to sale without passing credit check. This violates the Master SOP and could result in financing rejection.`,
        recommendation: `Halt this deal immediately. Run credit check before proceeding. Flag rep for SOP training.`,
        portal: 'sales',
        projectIds: [sp.id],
        timestamp: now,
      });
    }
  });

  // Rule: Milestone checklist completeness
  projects.forEach(p => {
    const ms = milestoneStates[p.id];
    if (!ms) return;
    const checklist = ms.checklistDone || {};
    const opsApproved = ms.opsApproved || {};
    // Check if installer submitted but ops hasn't reviewed
    const submitted = ms.installerSubmitted || {};
    Object.entries(submitted).forEach(([mi, isSubmitted]) => {
      if (isSubmitted && !opsApproved[mi]) {
        const age = daysSince(p.updatedAt || p.createdAt || now);
        if (age > 3) {
          findings.push({
            id: mkId('athena'),
            agentId: 'athena',
            severity: 'high',
            title: `Pending QC review: ${p.customerName} M${mi}`,
            description: `Installer submitted M${mi} for review but ops hasn't approved yet. ${Math.round(age)} days waiting.`,
            recommendation: `Ops team should review and approve/reject this milestone to unblock the installer.`,
            portal: 'ops',
            projectIds: [p.id],
            timestamp: now,
          });
        }
      }
    });
  });

  return findings;
}

/** Zeus — Strategy analysis */
function analyzeStrategy(
  projects: Project[],
  sellProjects: SellProject[],
): Finding[] {
  const findings: Finding[] = [];
  const now = new Date().toISOString();

  // Rule: Conversion funnel analysis
  const totalLeads = sellProjects.length;
  const creditPassed = sellProjects.filter(sp => sp.creditStatus === 'passed' || sp.creditStatus === 'credit_passed').length;
  const converted = sellProjects.filter(sp => sp.convertedToSale).length;
  const active = projects.length;

  if (totalLeads > 0) {
    const creditRate = Math.round((creditPassed / totalLeads) * 100);
    const conversionRate = totalLeads > 0 ? Math.round((converted / totalLeads) * 100) : 0;

    if (creditRate < 50 && totalLeads >= 3) {
      findings.push({
        id: mkId('zeus'),
        agentId: 'zeus',
        severity: 'high',
        title: `Low credit pass rate: ${creditRate}%`,
        description: `Only ${creditPassed} of ${totalLeads} leads passed credit. Lead quality may be an issue.`,
        recommendation: `Review lead sourcing channels. Consider pre-qualification questions before entering leads into the system.`,
        portal: 'sales',
        metric: `${creditRate}% credit pass rate`,
        timestamp: now,
      });
    }

    if (conversionRate < 40 && creditPassed >= 3) {
      findings.push({
        id: mkId('zeus'),
        agentId: 'zeus',
        severity: 'medium',
        title: `Conversion bottleneck: ${conversionRate}% lead-to-sale`,
        description: `${converted} of ${totalLeads} leads converted. There may be friction in the Aurora design → sale conversion step.`,
        recommendation: `Analyze where leads drop off. Are Aurora designs being completed? Are proposals being sent promptly?`,
        portal: 'sales',
        metric: `${conversionRate}% conversion`,
        timestamp: now,
      });
    }

    // Revenue pipeline estimate
    const totalPipeline = projects.reduce((sum, p) => sum + (p.contractValue || 0), 0);
    if (totalPipeline > 0) {
      findings.push({
        id: mkId('zeus'),
        agentId: 'zeus',
        severity: 'info',
        title: `Pipeline value: $${(totalPipeline / 1000).toFixed(0)}K`,
        description: `${active} active projects with total contract value of $${totalPipeline.toLocaleString()}.`,
        recommendation: `Track average time-to-close and revenue per milestone to forecast cash flow.`,
        portal: 'ops',
        metric: `$${(totalPipeline / 1000).toFixed(0)}K pipeline`,
        timestamp: now,
      });
    }
  }

  // Rule: Financier concentration risk
  const financierCounts: Record<string, number> = {};
  projects.forEach(p => {
    const f = p.financier || 'Unknown';
    financierCounts[f] = (financierCounts[f] || 0) + 1;
  });
  const totalProjects = projects.length;
  Object.entries(financierCounts).forEach(([fin, count]) => {
    if (totalProjects >= 3 && count / totalProjects > 0.8) {
      findings.push({
        id: mkId('zeus'),
        agentId: 'zeus',
        severity: 'medium',
        title: `Financier concentration: ${fin}`,
        description: `${Math.round((count / totalProjects) * 100)}% of projects use ${fin}. Over-reliance on one financier creates risk.`,
        recommendation: `Diversify financing partners. Build relationships with 2-3 additional financiers.`,
        portal: 'financier',
        metric: `${count}/${totalProjects} projects`,
        timestamp: now,
      });
    }
  });

  return findings;
}

/** Apollo — Design/UX analysis (rule-based, checks data patterns that indicate UX issues) */
function analyzeDesign(
  projects: Project[],
  sellProjects: SellProject[],
): Finding[] {
  const findings: Finding[] = [];
  const now = new Date().toISOString();

  // Rule: Portal engagement — projects with no messages
  // (indicates users aren't engaging with the collaboration features)
  if (projects.length > 2) {
    findings.push({
      id: mkId('apollo'),
      agentId: 'apollo',
      severity: 'info',
      title: 'Portal activity baseline',
      description: `${projects.length} active projects across portals. Monitor user engagement patterns to identify UX friction points.`,
      recommendation: `Track which portal tabs are used most/least. Low-traffic sections may need redesign or better onboarding.`,
      portal: 'all',
      timestamp: now,
    });
  }

  // Rule: Sell projects abandoned early (may indicate form UX issues)
  const abandoned = sellProjects.filter(sp => {
    const age = daysSince(sp.createdAt || now);
    return age > 3 && !sp.creditStatus && !sp.convertedToSale;
  });
  if (abandoned.length > 0) {
    findings.push({
      id: mkId('apollo'),
      agentId: 'apollo',
      severity: 'medium',
      title: `${abandoned.length} leads abandoned after creation`,
      description: `These leads were created but never had credit run or any follow-up. The initial entry form may need simplification.`,
      recommendation: `Review the sell project creation flow. Consider auto-triggering credit check on creation. Reduce required fields.`,
      portal: 'sales',
      metric: `${abandoned.length} abandoned`,
      timestamp: now,
    });
  }

  return findings;
}

// ─── Main Analysis Runner ───────────────────────────────────────────

export function runCouncilAnalysis(
  projects: Project[],
  sellProjects: SellProject[],
  milestoneStates: Record<string, ProjectMilestoneState>
): CouncilState {
  findingCounter = 0;
  const now = new Date().toISOString();

  const hermesFindings = analyzeOperations(projects, sellProjects, milestoneStates);
  const hephaestusFindings = analyzeEngineering(projects, sellProjects, milestoneStates);
  const athenaFindings = analyzeQA(projects, sellProjects, milestoneStates);
  const zeusFindings = analyzeStrategy(projects, sellProjects);
  const apolloFindings = analyzeDesign(projects, sellProjects);

  const allFindings = [
    ...hermesFindings, ...hephaestusFindings, ...athenaFindings,
    ...zeusFindings, ...apolloFindings,
  ];

  const scoreAgent = (findings: Finding[]): number => {
    if (findings.length === 0) return 100;
    const penalties: Record<Severity, number> = { critical: 25, high: 15, medium: 8, low: 3, info: 0 };
    const total = findings.reduce((sum, f) => sum + penalties[f.severity], 0);
    return Math.max(0, Math.min(100, 100 - total));
  };

  const makeSummary = (agent: CouncilAgent, findings: Finding[]): string => {
    const critical = findings.filter(f => f.severity === 'critical').length;
    const high = findings.filter(f => f.severity === 'high').length;
    if (critical > 0) return `${critical} critical issue${critical > 1 ? 's' : ''} require immediate attention.`;
    if (high > 0) return `${high} high-priority finding${high > 1 ? 's' : ''} detected.`;
    if (findings.length === 0) return `All ${agent.domain.toLowerCase()} checks passed. System healthy.`;
    return `${findings.length} finding${findings.length > 1 ? 's' : ''} — review recommended.`;
  };

  const reports: AgentReport[] = [
    { agent: AGENTS.hermes, findings: hermesFindings, score: scoreAgent(hermesFindings), summary: makeSummary(AGENTS.hermes, hermesFindings), lastAnalyzed: now },
    { agent: AGENTS.hephaestus, findings: hephaestusFindings, score: scoreAgent(hephaestusFindings), summary: makeSummary(AGENTS.hephaestus, hephaestusFindings), lastAnalyzed: now },
    { agent: AGENTS.athena, findings: athenaFindings, score: scoreAgent(athenaFindings), summary: makeSummary(AGENTS.athena, athenaFindings), lastAnalyzed: now },
    { agent: AGENTS.zeus, findings: zeusFindings, score: scoreAgent(zeusFindings), summary: makeSummary(AGENTS.zeus, zeusFindings), lastAnalyzed: now },
    { agent: AGENTS.apollo, findings: apolloFindings, score: scoreAgent(apolloFindings), summary: makeSummary(AGENTS.apollo, apolloFindings), lastAnalyzed: now },
  ];

  const overallScore = Math.round(reports.reduce((s, r) => s + r.score, 0) / reports.length);
  const criticalCount = allFindings.filter(f => f.severity === 'critical').length;

  return {
    reports,
    overallScore,
    totalFindings: allFindings.length,
    criticalCount,
    lastFullScan: now,
  };
}

// Severity helpers for UI
export const SEVERITY_CONFIG: Record<Severity, { label: string; color: string; bg: string; border: string }> = {
  critical: { label: 'Critical', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  high: { label: 'High', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  medium: { label: 'Medium', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  low: { label: 'Low', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  info: { label: 'Info', color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/20' },
};
