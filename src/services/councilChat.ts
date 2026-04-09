/**
 * Council Chat Engine v2 — Deep contextual Q&A powered by live data.
 *
 * Smarter intent detection (scoring-based, not first-match).
 * Every response pulls real data and gives actionable analysis.
 * Fuzzy name matching, multi-entity extraction, cross-referencing.
 */

import type { Project, SellProject } from '@/data/mockData';
import type { ProjectMilestoneState } from '@/contexts/ProjectStore';
import { AGENTS, type AgentId, runCouncilAnalysis } from './councilEngine';
import { MILESTONE_SOPS } from '@/data/milestoneSOP';

// Helper — the Project type doesn't declare all DB fields, so we access extras safely
const pf = (p: Project, field: string): string | undefined => (p as Record<string, unknown>)[field] as string | undefined;

export interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  agentId?: AgentId;
  text: string;
  timestamp: string;
  data?: Record<string, unknown>;
}

// ─── Scoring-Based Intent Detection ─────────────────────────────────

type Intent =
  | 'project_status' | 'milestone_help' | 'pipeline_overview' | 'lead_status'
  | 'fund_status' | 'qc_help' | 'sop_question' | 'ticket_help'
  | 'conversion_help' | 'financier_info' | 'system_health' | 'feature_help'
  | 'error_scan' | 'action_request' | 'general';

interface DetectedIntent {
  intent: Intent;
  agent: AgentId;
  entities: Record<string, string>;
  confidence: number;
}

interface IntentRule {
  intent: Intent;
  agent: AgentId;
  keywords: string[];
  weight: number;
}

const INTENT_RULES: IntentRule[] = [
  { intent: 'project_status', agent: 'hermes', keywords: ['project', 'status', 'progress', 'update', 'doing', 'where', 'how is', 'how\'s'], weight: 1 },
  { intent: 'milestone_help', agent: 'athena', keywords: ['milestone', 'm1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'checklist', 'step', 'sow', 'permit', 'install', 'inspection', 'pto'], weight: 1.2 },
  { intent: 'pipeline_overview', agent: 'zeus', keywords: ['pipeline', 'funnel', 'overview', 'summary', 'all projects', 'show me', 'dashboard', 'total', 'how many'], weight: 1 },
  { intent: 'lead_status', agent: 'hermes', keywords: ['lead', 'sell project', 'prospect', 'new customer', 'leads'], weight: 1 },
  { intent: 'fund_status', agent: 'hermes', keywords: ['fund', 'release', 'payment', 'money', 'escrow', 'disburs', 'paid', 'owe'], weight: 1.1 },
  { intent: 'financier_info', agent: 'zeus', keywords: ['financier', 'goodleap', 'sunlight', 'mosaic', 'lender', 'financing'], weight: 1.2 },
  { intent: 'qc_help', agent: 'athena', keywords: ['qc', 'quality', 'reject', 'dirty', 'clean', 'review', 'approve', 'approval'], weight: 1.1 },
  { intent: 'sop_question', agent: 'athena', keywords: ['sop', 'procedure', 'process', 'rule', 'compliance', 'requirement', 'flow', 'how does'], weight: 1 },
  { intent: 'ticket_help', agent: 'hephaestus', keywords: ['ticket', 'issue', 'bug', 'problem', 'broken', 'not working', 'error', 'wrong', 'fix'], weight: 1.1 },
  { intent: 'error_scan', agent: 'hephaestus', keywords: ['error', 'scan', 'what\'s wrong', 'issues', 'problems', 'find errors', 'what\'s broken', 'audit', 'check'], weight: 1.3 },
  { intent: 'conversion_help', agent: 'zeus', keywords: ['convert', 'sale', 'sold', 'close', 'win', 'conversion'], weight: 1 },
  { intent: 'system_health', agent: 'hephaestus', keywords: ['health', 'score', 'diagnostic', 'test', 'system'], weight: 1 },
  { intent: 'feature_help', agent: 'apollo', keywords: ['how do i', 'how to', 'where is', 'help me', 'what does', 'feature', 'button', 'page', 'portal', 'navigate'], weight: 0.9 },
  { intent: 'action_request', agent: 'hermes', keywords: ['mark dirty', 'approve', 'reject', 'release fund', 'create', 'delete', 'assign', 'update'], weight: 1.2 },
];

function fuzzyMatch(haystack: string, needle: string): boolean {
  const h = haystack.toLowerCase();
  const n = needle.toLowerCase();
  if (h.includes(n)) return true;
  // Simple edit distance for short names
  if (n.length >= 3 && h.length >= 3) {
    for (let i = 0; i <= h.length - 3; i++) {
      let matches = 0;
      for (let j = 0; j < n.length && i + j < h.length; j++) {
        if (h[i + j] === n[j]) matches++;
      }
      if (matches >= n.length * 0.7) return true;
    }
  }
  return false;
}

function detectIntent(query: string, projects: Project[], sellProjects: SellProject[]): DetectedIntent {
  const lower = query.toLowerCase();
  const entities: Record<string, string> = {};

  // Extract entities — customer name (fuzzy match against known names)
  const allNames = [
    ...projects.map(p => p.customerName),
    ...sellProjects.map(sp => `${sp.firstName} ${sp.lastName}`),
  ].filter(Boolean);
  for (const name of allNames) {
    if (fuzzyMatch(lower, name.toLowerCase()) || name.split(' ').some(part => part.length > 2 && lower.includes(part.toLowerCase()))) {
      entities.customerName = name;
      break;
    }
  }

  // Extract milestone reference
  const mMatch = lower.match(/\bm([1-7])\b/i);
  if (mMatch) entities.milestone = mMatch[1];

  // Score each intent
  let bestScore = 0;
  let bestIntent: Intent = 'general';
  let bestAgent: AgentId = 'zeus';

  for (const rule of INTENT_RULES) {
    let score = 0;
    for (const kw of rule.keywords) {
      if (lower.includes(kw)) score += rule.weight;
    }
    if (score > bestScore) {
      bestScore = score;
      bestIntent = rule.intent;
      bestAgent = rule.agent;
    }
  }

  // If we found a customer name and no strong intent, default to project_status
  if (entities.customerName && bestScore < 1) {
    bestIntent = 'project_status';
    bestAgent = 'hermes';
    bestScore = 1;
  }

  return { intent: bestIntent, agent: bestAgent, entities, confidence: Math.min(bestScore / 3, 1) };
}

// ─── Response Generators ────────────────────────────────────────────

function findProjectAndLead(projects: Project[], sellProjects: SellProject[], name: string) {
  const lower = name.toLowerCase();
  const project = projects.find(p => fuzzyMatch(p.customerName?.toLowerCase() || '', lower) || p.customerName?.toLowerCase().includes(lower.split(' ')[0]));
  const sellProject = sellProjects.find(sp =>
    fuzzyMatch(`${sp.firstName} ${sp.lastName}`.toLowerCase(), lower) ||
    (sp.firstName && lower.includes(sp.firstName.toLowerCase())) ||
    (sp.lastName && lower.includes(sp.lastName.toLowerCase()))
  );
  return { project, sellProject };
}

function respondProjectStatus(
  projects: Project[], sellProjects: SellProject[], milestoneStates: Record<string, ProjectMilestoneState>,
  entities: Record<string, string>
): { text: string; agent: AgentId } {
  if (entities.customerName) {
    const { project, sellProject } = findProjectAndLead(projects, sellProjects, entities.customerName);

    if (project) {
      const ms = milestoneStates[project.id];
      const sop = MILESTONE_SOPS[project.currentMilestone];
      const completedChecks = ms ? Object.values(ms.checklistDone || {}).filter(Boolean).length : 0;
      const totalChecks = sop ? sop.checklist.length : 0;
      const submitted = ms ? Object.values(ms.installerSubmitted || {}).filter(Boolean).length : 0;
      const approved = ms ? Object.values(ms.opsApproved || {}).filter(Boolean).length : 0;
      const funded = ms ? Object.values(ms.fundStatus || {}).filter(v => v === 'released').length : 0;
      const totalFundPct = MILESTONE_SOPS.slice(0, funded).reduce((s, m) => s + m.fundPercent, 0);
      const systemSize = typeof project.systemSize === 'string' ? project.systemSize : `${project.systemSize || '?'} kW`;

      // Identify specific issues
      const issues: string[] = [];
      if (!ms) issues.push('⚠️ No milestone tracking data — checklist and approvals cannot function');
      if (completedChecks === 0 && project.currentMilestone > 0) issues.push('⚠️ At M' + project.currentMilestone + ' but zero checklist items completed');
      if (!project.contractValue) issues.push('⚠️ Contract value is $0 — fund releases will be $0');
      const financier = pf(project, 'financier');
      if (!financier || financier === 'TBD') issues.push('⚠️ No financier assigned — fund releases blocked');
      if (submitted > approved) issues.push(`⚠️ ${submitted - approved} milestone(s) submitted but awaiting ops review`);

      return {
        text: `*${project.customerName}* — *M${project.currentMilestone}* (${sop?.name || 'Pre-milestone'})\n\n` +
          `• System: ${systemSize} | ${project.battery || 'No battery'}\n` +
          `• Contract: $${(project.contractValue || 0).toLocaleString()} | Financier: ${financier || 'Not assigned'}\n` +
          `• Checklist: ${completedChecks}/${totalChecks} complete\n` +
          `• Milestones: ${approved} approved, ${submitted} submitted, ${funded} funded (${totalFundPct}% released)\n` +
          `• Status: ${project.status || 'active'}\n` +
          (issues.length > 0 ? `\n*Issues found:*\n${issues.join('\n')}\n` : '\n✅ No issues detected.\n') +
          `\n*Next step:* ${!ms ? 'Create milestone_states row for this project.' : completedChecks < totalChecks ? `Complete ${totalChecks - completedChecks} remaining checklist items for ${sop?.shortName || 'current milestone'}.` : submitted <= approved ? 'Submit milestone for ops review.' : 'Awaiting ops approval.'}`,
        agent: 'hermes',
      };
    }

    if (sellProject) {
      const issues: string[] = [];
      if (sellProject.convertedToSale && !sellProject.creditStatus?.includes('pass')) issues.push('⚠️ SOP VIOLATION: Converted without credit approval');
      if (sellProject.convertedToSale && !sellProject.auroraSynced) issues.push('⚠️ Converted without Aurora design sync');
      if (sellProject.approvalStatus === 'dirty' && !sellProject.approvalNotes) issues.push('⚠️ Marked dirty but no rejection notes — rep can\'t fix');
      if (sellProject.convertedToSale && sellProject.qcInitialApproved && !projects.some(p => fuzzyMatch(p.customerName?.toLowerCase() || '', `${sellProject.firstName} ${sellProject.lastName}`.toLowerCase()))) {
        issues.push('⚠️ QC approved but no project created — stuck between portals');
      }

      return {
        text: `*${sellProject.firstName} ${sellProject.lastName}* — Sell Project\n\n` +
          `• Credit: ${sellProject.creditStatus === 'passed' || sellProject.creditStatus === 'credit_passed' ? '✅ Passed' : sellProject.creditStatus || '⏳ Not run'}\n` +
          `• Aurora: ${sellProject.auroraSynced ? '✅ Synced' : '⏳ Not synced'}\n` +
          `• Converted to sale: ${sellProject.convertedToSale ? '✅ Yes' : '❌ Not yet'}\n` +
          `• QC Approved: ${sellProject.qcInitialApproved ? '✅ Yes' : '⏳ No'}\n` +
          `• Docs signed: ${sellProject.documentsSigned ? '✅ Yes' : '❌ No'}\n` +
          `• Welcome call: ${sellProject.welcomeCallComplete ? '✅ Done' : '❌ Not done'}\n` +
          `• Site survey: ${sellProject.siteSurveyComplete ? '✅ Done' : '❌ Not done'}\n` +
          `• Status: ${sellProject.approvalStatus || 'pending'}\n` +
          (issues.length > 0 ? `\n*Issues found:*\n${issues.join('\n')}\n` : '\n✅ No issues detected.\n') +
          `\n*Next step:* ${!sellProject.creditStatus ? 'Run credit check.' : !sellProject.auroraSynced ? 'Complete Aurora design sync.' : !sellProject.convertedToSale ? 'Convert to sale.' : !sellProject.qcInitialApproved ? 'Awaiting QC review.' : 'Progressing normally.'}`,
        agent: 'hermes',
      };
    }

    return { text: `No project or lead found matching "${entities.customerName}". I searched ${projects.length} projects and ${sellProjects.length} leads.\n\nCurrent projects: ${projects.map(p => p.customerName).join(', ') || 'None'}\nCurrent leads: ${sellProjects.map(sp => `${sp.firstName} ${sp.lastName}`).join(', ') || 'None'}`, agent: 'hermes' };
  }

  // General overview
  return respondPipeline(projects, sellProjects, milestoneStates);
}

function respondMilestoneHelp(entities: Record<string, string>, projects: Project[], milestoneStates: Record<string, ProjectMilestoneState>): { text: string; agent: AgentId } {
  if (entities.milestone) {
    const idx = parseInt(entities.milestone) - 1;
    const sop = MILESTONE_SOPS[idx];
    if (sop) {
      // Show which projects are currently at this milestone
      const atThisMilestone = projects.filter(p => p.currentMilestone === idx);
      const projectInfo = atThisMilestone.length > 0
        ? `\n\n*Projects currently at ${sop.id}:*\n${atThisMilestone.map(p => {
          const ms = milestoneStates[p.id];
          const done = ms ? Object.values(ms.checklistDone || {}).filter(Boolean).length : 0;
          return `• ${p.customerName} — ${done}/${sop.checklist.length} items done`;
        }).join('\n')}`
        : `\n\n_No projects currently at ${sop.id}._`;

      return {
        text: `*${sop.id}: ${sop.name}* — ${sop.fundPercent}% fund release\n\n${sop.description}\n\n*Checklist (${sop.checklist.length} items):*\n${sop.checklist.map((item, i) => `${i + 1}. ${item.label} — _${item.actor.replace('_', ' ')}_${item.requiresUpload ? ' 📎 upload required' : ''}${item.requiresDate ? ' 📅 date required' : ''}${item.requiresText ? ' 📝 text entry required' : ''}`).join('\n')}\n\n*Flow:* Installer completes → submits to Ops → Ops approves → ${sop.fundPercent}% fund release triggers.${projectInfo}`,
        agent: 'athena',
      };
    }
  }

  // Overview of all milestones
  return {
    text: `*Milestones M1-M7 Overview:*\n\n${MILESTONE_SOPS.map((sop, i) => {
      const count = projects.filter(p => p.currentMilestone === i).length;
      return `*${sop.id}* — ${sop.name} (${sop.fundPercent}% release) ${count > 0 ? `[${count} project${count > 1 ? 's' : ''}]` : ''}\n  ${sop.checklist.length} items | ${sop.description.slice(0, 100)}`;
    }).join('\n\n')}\n\n*Total release schedule:* ${MILESTONE_SOPS.map(s => `${s.id}:${s.fundPercent}%`).join(' → ')} = 105%\n\nAsk about a specific milestone (e.g. "tell me about M3") for full checklist.`,
    agent: 'athena',
  };
}

function respondPipeline(projects: Project[], sellProjects: SellProject[], milestoneStates: Record<string, ProjectMilestoneState>): { text: string; agent: AgentId } {
  const totalValue = projects.reduce((s, p) => s + (p.contractValue || 0), 0);
  const creditPassed = sellProjects.filter(sp => sp.creditStatus === 'passed' || sp.creditStatus === 'credit_passed').length;
  const converted = sellProjects.filter(sp => sp.convertedToSale).length;
  const convRate = sellProjects.length > 0 ? ((converted / sellProjects.length) * 100).toFixed(0) : '0';

  return {
    text: `*Pipeline Overview*\n\n` +
      `*Projects:* ${projects.length} active | $${totalValue.toLocaleString()} total value\n` +
      `*Leads:* ${sellProjects.length} total | ${creditPassed} credit passed | ${converted} converted (${convRate}%)\n\n` +
      (projects.length > 0 ? `*Active Projects:*\n${projects.map(p => {
        const ms = milestoneStates[p.id];
        const done = ms ? Object.values(ms.checklistDone || {}).filter(Boolean).length : 0;
        const sop = MILESTONE_SOPS[p.currentMilestone];
        return `• *${p.customerName}* — M${p.currentMilestone} (${sop?.shortName || '?'}) | $${(p.contractValue || 0).toLocaleString()} | ${done} items done`;
      }).join('\n')}\n\n` : '') +
      (sellProjects.length > 0 ? `*Leads:*\n${sellProjects.map(sp => {
        const status = sp.convertedToSale ? '✅ Converted' : sp.creditStatus === 'passed' || sp.creditStatus === 'credit_passed' ? '🟡 Credit passed' : sp.creditStatus ? `🔴 Credit: ${sp.creditStatus}` : '⚪ New';
        return `• *${sp.firstName} ${sp.lastName}* — ${status}`;
      }).join('\n')}` : '_No leads in pipeline._'),
    agent: 'zeus',
  };
}

function respondFundStatus(projects: Project[], milestoneStates: Record<string, ProjectMilestoneState>): { text: string; agent: AgentId } {
  if (projects.length === 0) return { text: 'No active projects with fund tracking.', agent: 'hermes' };

  const lines = projects.map(p => {
    const ms = milestoneStates[p.id];
    const contractValue = p.contractValue || 0;
    if (!ms) return `• *${p.customerName}* — ⚠️ No milestone data (cannot track funds)`;
    const funded = Object.entries(ms.fundStatus || {}).filter(([, s]) => s === 'released');
    const approved = Object.entries(ms.opsApproved || {}).filter(([, a]) => a);
    const pending = approved.filter(([idx]) => (ms.fundStatus?.[Number(idx)] || 'pending') !== 'released');
    const releasedPct = funded.reduce((s, [idx]) => s + (MILESTONE_SOPS[Number(idx)]?.fundPercent || 0), 0);
    const releasedAmt = contractValue * releasedPct / 100;
    const pendingPct = pending.reduce((s, [idx]) => s + (MILESTONE_SOPS[Number(idx)]?.fundPercent || 0), 0);

    return `• *${p.customerName}* ($${contractValue.toLocaleString()} contract)\n  Released: ${funded.length} milestones (${releasedPct}% = $${releasedAmt.toLocaleString()})${pending.length > 0 ? `\n  ⚠️ Pending release: ${pending.length} approved but not yet released (${pendingPct}%)` : ''}`;
  });

  return {
    text: `*Fund Release Status*\n\n${lines.join('\n\n')}\n\n*Release schedule:* ${MILESTONE_SOPS.map(s => `${s.id}:${s.fundPercent}%`).join(' → ')}`,
    agent: 'hermes',
  };
}

function respondQCHelp(sellProjects: SellProject[]): { text: string; agent: AgentId } {
  const pending = sellProjects.filter(sp => sp.convertedToSale && !sp.qcInitialApproved && sp.approvalStatus === 'pending');
  const dirty = sellProjects.filter(sp => sp.approvalStatus === 'dirty');
  const clean = sellProjects.filter(sp => sp.approvalStatus === 'clean' || sp.qcInitialApproved);
  const violations = sellProjects.filter(sp => sp.convertedToSale && sp.creditStatus !== 'passed' && sp.creditStatus !== 'credit_passed');

  return {
    text: `*QC Review Status*\n\n` +
      `• ✅ Clean: ${clean.length}\n• 🔴 Dirty: ${dirty.length}\n• ⏳ Pending: ${pending.length}\n` +
      (violations.length > 0 ? `• ⚠️ SOP violations: ${violations.length} (converted without credit)\n` : '') +
      (dirty.length > 0 ? `\n*Flagged deals:*\n${dirty.map(sp => `• ${sp.firstName} ${sp.lastName} — ${sp.approvalNotes || '⚠️ No rejection notes (rep can\'t fix without knowing why)'}`).join('\n')}\n` : '') +
      (pending.length > 0 ? `\n*Awaiting review:*\n${pending.map(sp => `• ${sp.firstName} ${sp.lastName}`).join('\n')}\n` : '') +
      `\n*QC SOP:*\n1. Sales rep converts → enters queue\n2. Backend Ops reviews (target: <24hrs)\n3. Clean → project creation\n4. Dirty → returned with notes\n` +
      `\n${pending.length > 0 ? '⚠️ Action needed: Process the QC queue in Ops Portal.' : '✅ No pending reviews.'}`,
    agent: 'athena',
  };
}

function respondErrorScan(projects: Project[], sellProjects: SellProject[], milestoneStates: Record<string, ProjectMilestoneState>): { text: string; agent: AgentId } {
  const council = runCouncilAnalysis(projects, sellProjects, milestoneStates);
  const criticals = council.reports.flatMap(r => r.findings).filter(f => f.severity === 'critical');
  const highs = council.reports.flatMap(r => r.findings).filter(f => f.severity === 'high');
  const mediums = council.reports.flatMap(r => r.findings).filter(f => f.severity === 'medium');

  if (council.totalFindings === 0) return { text: '✅ Full scan complete — no errors found across all portals.', agent: 'hephaestus' };

  return {
    text: `*Full Error Scan — ${council.totalFindings} issues found*\nOverall health: ${council.overallScore}/100\n\n` +
      (criticals.length > 0 ? `*🔴 CRITICAL (${criticals.length}):*\n${criticals.map(f => `• *${f.title}*\n  ${f.description.slice(0, 150)}...\n  Fix: ${f.recommendation.slice(0, 150)}`).join('\n\n')}\n\n` : '') +
      (highs.length > 0 ? `*🟠 HIGH (${highs.length}):*\n${highs.map(f => `• *${f.title}*\n  ${f.description.slice(0, 120)}`).join('\n\n')}\n\n` : '') +
      (mediums.length > 0 ? `*🟡 MEDIUM (${mediums.length}):*\n${mediums.map(f => `• ${f.title}`).join('\n')}\n\n` : '') +
      `Switch to the *Dashboard* tab to see full details on each finding, or *Diagnostic* tab to run feature-level tests.`,
    agent: 'hephaestus',
  };
}

function respondSOPQuestion(): { text: string; agent: AgentId } {
  return {
    text: `*AlphaSale Master SOP*\n\n*Phase 1 — Lead Entry (Sales Rep)*\n• Enter customer info → run credit check via Aurora\n• Credit passes → complete Aurora design → convert to sale\n• State: lead → qualified → qc_review\n\n*Phase 2 — QC Gate (Backend Ops)*\n• Review converted deal for data quality\n• Mark clean (proceed) or dirty (return with notes)\n• Guards: credit must pass, Aurora must sync, customer data complete\n\n*Phase 3 — Project Creation*\n• Clean deal → active project with M0\n• Assign installer company + financier\n• Create milestone_states row\n\n*Phase 4 — Milestones M1-M7*\n• Installer: complete checklist items, upload docs\n• Installer: submit milestone for QC\n• Ops: review and approve milestone\n• Fund release: triggered at approval\n• M1: 15% | M2: 20% | M3: 15% | M4: 20% | M5: 20% | M6: 10% | M7: 5%\n\n*Phase 5 — Fund Releases (Financier)*\n• Each ops approval unlocks a release percentage\n• Financier reviews and releases funds\n\n*Phase 6 — Completion*\n• M7 complete (speed bonus if PTO ≤ 35 days)\n• All funds released → project complete → archive\n\n*Known SOP enforcement gaps:*\n• gamification.recordDeal() not called on conversion\n• 3 of 7 cascade notification types not wired\n• Fund releases can happen without ops approval (no guard)`,
    agent: 'athena',
  };
}

function respondFeatureHelp(): { text: string; agent: AgentId } {
  return {
    text: `*Portal Guide*\n\n*Sales Portal* 👤\n• *Sell Tab* — Create leads, run credit, sync Aurora, convert to sale\n• *Pipeline* — View active projects + sell-derived entries\n• *Commissions* — Track earnings per deal\n• *Rankings* — Leaderboard with ticket bonus tiers\n• *ShopSpin* — Spend tickets on prize wheel (⚠️ tickets not yet awarded from deals)\n• *Puzzle* — Earn prizes by selling deals (⚠️ recordDeal not wired)\n\n*Backend Ops Portal* ⚙️\n• *QC Review* — Approve/reject converted deals\n• *Projects* — Monitor all projects, approve milestones, manage fund releases\n• *Final Approval* — Last gate before project activation\n• *Support* — Ticket management\n\n*Installer Portal* 🔧\n• *Project cards* — View assigned projects\n• *Checklists* — Complete M1-M7 items, upload docs\n• *Submit for QC* — Send milestones for ops review\n\n*Financier Portal* 💰\n• *NTP Review* — Approve Notice to Proceed\n• *Fund releases* — Process milestone payments\n• *Project tracking* — Monitor funded projects\n\n*The Pantheon* 👑\n• *Dashboard* — Live error detection across all portals\n• *Chat* — Q&A with live data (you're here)\n• *Diagnostic* — Automated cross-portal testing`,
    agent: 'apollo',
  };
}

function respondActionRequest(): { text: string; agent: AgentId } {
  return {
    text: `Auto-resolution actions are being built. Soon I'll be able to:\n\n• Mark deals dirty/clean\n• Approve/reject milestones\n• Trigger fund releases\n• Create projects from approved deals\n• Send notification cascades\n\nFor now, perform these actions through the respective portal. I can tell you exactly what needs to be done — switch to the Dashboard tab for prioritized action items.`,
    agent: 'hermes',
  };
}

// ─── Main Chat Handler ──────────────────────────────────────────────

export function processChat(
  query: string,
  projects: Project[],
  sellProjects: SellProject[],
  milestoneStates: Record<string, ProjectMilestoneState>
): ChatMessage {
  const { intent, agent, entities } = detectIntent(query, projects, sellProjects);
  let result: { text: string; agent: AgentId };

  switch (intent) {
    case 'project_status':
    case 'lead_status':
      result = respondProjectStatus(projects, sellProjects, milestoneStates, entities);
      break;
    case 'milestone_help':
      result = respondMilestoneHelp(entities, projects, milestoneStates);
      break;
    case 'pipeline_overview':
    case 'conversion_help':
      result = respondPipeline(projects, sellProjects, milestoneStates);
      break;
    case 'fund_status':
    case 'financier_info':
      result = respondFundStatus(projects, milestoneStates);
      break;
    case 'qc_help':
      result = respondQCHelp(sellProjects);
      break;
    case 'sop_question':
      result = respondSOPQuestion();
      break;
    case 'error_scan':
      result = respondErrorScan(projects, sellProjects, milestoneStates);
      break;
    case 'feature_help':
      result = respondFeatureHelp();
      break;
    case 'action_request':
      result = respondActionRequest();
      break;
    case 'ticket_help':
    case 'system_health':
      result = respondErrorScan(projects, sellProjects, milestoneStates);
      break;
    default:
      // Try to find a name even if no intent matched
      if (entities.customerName) {
        result = respondProjectStatus(projects, sellProjects, milestoneStates, entities);
      } else {
        result = {
          text: `I can help with:\n\n• *"Maria Gonzalez"* — look up any project or lead by name\n• *"Show me the pipeline"* — overview of all projects and leads\n• *"What's M3?"* — milestone details and checklist\n• *"Fund status"* — track fund releases per project\n• *"QC review"* — see pending approvals and dirty deals\n• *"What's broken?"* — full error scan across all portals\n• *"How does the SOP work?"* — master process flow\n• *"How do I use the installer portal?"* — feature guide\n\nOr just ask a question in plain language.`,
          agent: 'zeus',
        };
      }
  }

  return {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    role: 'agent',
    agentId: result.agent,
    text: result.text,
    timestamp: new Date().toISOString(),
  };
}
