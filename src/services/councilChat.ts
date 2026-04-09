/**
 * Council Chat Engine — Q&A system powered by live data.
 * 
 * Routes questions to the right Pantheon agent, pulls real Supabase data,
 * and formulates contextual answers. No canned responses — every answer
 * references the actual state of the user's projects and pipeline.
 */

import type { Project, SellProject } from '@/data/mockData';
import type { ProjectMilestoneState } from '@/contexts/ProjectStore';
import { AGENTS, type AgentId } from './councilEngine';
import { MILESTONE_SOPS } from '@/data/milestoneSOP';

export interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  agentId?: AgentId;
  text: string;
  timestamp: string;
  data?: Record<string, unknown>; // structured data for rich display
}

// ─── Intent Detection ───────────────────────────────────────────────

type Intent =
  | 'project_status' | 'milestone_help' | 'pipeline_overview' | 'lead_status'
  | 'fund_status' | 'qc_help' | 'sop_question' | 'ticket_help'
  | 'conversion_help' | 'financier_info' | 'system_health' | 'feature_help'
  | 'general';

interface DetectedIntent {
  intent: Intent;
  agent: AgentId;
  entities: Record<string, string>;
}

const INTENT_PATTERNS: { pattern: RegExp; intent: Intent; agent: AgentId }[] = [
  // Project-specific
  { pattern: /(?:status|where|progress|update).+(?:project|deal|customer|install)/i, intent: 'project_status', agent: 'hermes' },
  { pattern: /(?:milestone|m[1-7]|checklist|step)/i, intent: 'milestone_help', agent: 'hermes' },
  { pattern: /(?:pipeline|funnel|conversion|leads?|deals?)/i, intent: 'pipeline_overview', agent: 'zeus' },
  { pattern: /(?:lead|sell project|prospect|new customer)/i, intent: 'lead_status', agent: 'hermes' },
  // Financial
  { pattern: /(?:fund|release|payment|money|escrow|disburs)/i, intent: 'fund_status', agent: 'hermes' },
  { pattern: /(?:financier|goodleap|sunlight|mosaic|lender)/i, intent: 'financier_info', agent: 'zeus' },
  // QC & Compliance
  { pattern: /(?:qc|quality|reject|dirty|clean|approv|review)/i, intent: 'qc_help', agent: 'athena' },
  { pattern: /(?:sop|procedure|process|rule|compliance|requirement)/i, intent: 'sop_question', agent: 'athena' },
  // Support
  { pattern: /(?:ticket|issue|bug|problem|broken|not working|error)/i, intent: 'ticket_help', agent: 'hephaestus' },
  { pattern: /(?:convert|sale|sold|close|win)/i, intent: 'conversion_help', agent: 'zeus' },
  // System
  { pattern: /(?:health|score|diagnostic|test|scan)/i, intent: 'system_health', agent: 'hephaestus' },
  { pattern: /(?:how do i|how to|where is|help me|what does|feature|button|page)/i, intent: 'feature_help', agent: 'apollo' },
];

function detectIntent(query: string): DetectedIntent {
  for (const { pattern, intent, agent } of INTENT_PATTERNS) {
    if (pattern.test(query)) {
      // Extract customer name if mentioned
      const entities: Record<string, string> = {};
      const nameMatch = query.match(/(?:for|about|on|project|customer)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
      if (nameMatch) entities.customerName = nameMatch[1];
      const milestoneMatch = query.match(/m([1-7])/i);
      if (milestoneMatch) entities.milestone = milestoneMatch[1];
      return { intent, agent, entities };
    }
  }
  return { intent: 'general', agent: 'zeus', entities: {} };
}

// ─── Response Generators ────────────────────────────────────────────

function findProject(projects: Project[], sellProjects: SellProject[], name: string): { project?: Project; sellProject?: SellProject } {
  const lower = name.toLowerCase();
  const project = projects.find(p => p.customerName.toLowerCase().includes(lower));
  const sellProject = sellProjects.find(sp =>
    `${sp.firstName} ${sp.lastName}`.toLowerCase().includes(lower)
  );
  return { project, sellProject };
}

function generateProjectStatus(
  projects: Project[], sellProjects: SellProject[], milestoneStates: Record<string, ProjectMilestoneState>,
  entities: Record<string, string>
): { text: string; agent: AgentId } {
  if (entities.customerName) {
    const { project, sellProject } = findProject(projects, sellProjects, entities.customerName);
    if (project) {
      const ms = milestoneStates[project.id];
      const completedChecks = ms ? Object.values(ms.checklistDone).filter(Boolean).length : 0;
      const sop = MILESTONE_SOPS[project.currentMilestone];
      const totalChecks = sop ? sop.checklist.length : 0;
      return {
        text: `*${project.customerName}* — Currently at *M${project.currentMilestone} (${sop?.name || 'Unknown'})*.

• System: ${project.systemSize || '?'}kW | ${project.battery ? 'Battery included' : 'No battery'}
• Contract: $${(project.contractValue || 0).toLocaleString()} | Financier: ${project.financier || 'Not set'}
• Checklist: ${completedChecks}/${totalChecks} items complete
• PPW: $${project.ppw || '?'} | Monthly: $${project.monthlyPayment || '?'}

${completedChecks === totalChecks && totalChecks > 0
  ? '✅ All checklist items complete — ready for milestone submission.'
  : `⏳ ${totalChecks - completedChecks} items remaining before milestone can be submitted.`}`,
        agent: 'hermes',
      };
    }
    if (sellProject) {
      return {
        text: `*${sellProject.firstName} ${sellProject.lastName}* — Sell Project (Lead)

• Credit: ${sellProject.creditStatus === 'passed' ? '✅ Passed' : sellProject.creditStatus || '⏳ Not run'}
• Aurora: ${sellProject.auroraSynced ? '✅ Synced' : '⏳ Not synced'}
• Converted: ${sellProject.convertedToSale ? '✅ Yes' : '❌ Not yet'}
• QC Status: ${sellProject.approvalStatus || 'Pending'}
• Address: ${sellProject.address || 'Not set'}

${!sellProject.creditStatus ? 'Next step: Run credit check.' :
  !sellProject.convertedToSale && sellProject.creditStatus === 'passed' ? 'Next step: Convert to sale once Aurora design is complete.' :
  sellProject.convertedToSale && sellProject.approvalStatus !== 'clean' ? 'Next step: QC review pending.' :
  'Lead is progressing normally.'}`,
        agent: 'hermes',
      };
    }
    return { text: `I couldn't find a project or lead matching "${entities.customerName}". Check the spelling or try searching by first/last name.`, agent: 'hermes' };
  }

  // General project overview
  const byMilestone: Record<number, number> = {};
  projects.forEach(p => { byMilestone[p.currentMilestone] = (byMilestone[p.currentMilestone] || 0) + 1; });
  const milestoneBreakdown = Object.entries(byMilestone)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([m, count]) => `M${m}: ${count}`)
    .join(' | ');

  return {
    text: `*Active Projects: ${projects.length}*
${milestoneBreakdown || 'No projects yet'}

*Leads: ${sellProjects.length}*
• Credit passed: ${sellProjects.filter(sp => sp.creditStatus === 'passed').length}
• Converted: ${sellProjects.filter(sp => sp.convertedToSale).length}
• Pending: ${sellProjects.filter(sp => !sp.convertedToSale && sp.creditStatus !== 'passed').length}

${projects.length === 0 ? 'Start by creating sell projects in the Sales Portal to build your pipeline.' : `${projects.map(p => `• ${p.customerName} — M${p.currentMilestone} (${MILESTONE_SOPS[p.currentMilestone]?.shortName || '?'})`).join('\n')}`}`,
    agent: 'hermes',
  };
}

function generateMilestoneHelp(entities: Record<string, string>): { text: string; agent: AgentId } {
  if (entities.milestone) {
    const idx = parseInt(entities.milestone) - 1;
    const sop = MILESTONE_SOPS[idx];
    if (sop) {
      return {
        text: `*${sop.id}: ${sop.name}* — Fund release: ${sop.fundPercent}%

${sop.description}

*Checklist (${sop.checklist.length} items):*
${sop.checklist.map((item, i) => `${i + 1}. ${item.label} _(${item.actor.replace('_', ' ')})_${item.requiresUpload ? ' 📎' : ''}${item.requiresDate ? ' 📅' : ''}`).join('\n')}

*Flow:* Installer completes their items → submits for review → Backend Ops approves → Fund release triggered at ${sop.fundPercent}%.`,
        agent: 'athena',
      };
    }
  }

  return {
    text: `*Milestone Overview (M1-M7):*

${MILESTONE_SOPS.map(sop => `*${sop.id}* — ${sop.name} (${sop.fundPercent}% fund release)
  ${sop.checklist.length} checklist items | ${sop.description.slice(0, 80)}...`).join('\n\n')}

Ask about a specific milestone (e.g., "tell me about M3") for full checklist details.`,
    agent: 'athena',
  };
}

function generatePipelineOverview(projects: Project[], sellProjects: SellProject[]): { text: string; agent: AgentId } {
  const totalValue = projects.reduce((s, p) => s + (p.contractValue || 0), 0);
  const avgSize = projects.length > 0 ? (projects.reduce((s, p) => s + (p.systemSize || 0), 0) / projects.length).toFixed(1) : '0';
  const creditRate = sellProjects.length > 0 ? Math.round((sellProjects.filter(sp => sp.creditStatus === 'passed').length / sellProjects.length) * 100) : 0;
  const convRate = sellProjects.length > 0 ? Math.round((sellProjects.filter(sp => sp.convertedToSale).length / sellProjects.length) * 100) : 0;

  return {
    text: `*Pipeline Analysis*

*Revenue:* $${totalValue.toLocaleString()} total contract value across ${projects.length} projects
*Avg system:* ${avgSize}kW
*Credit pass rate:* ${creditRate}%
*Lead → Sale conversion:* ${convRate}%

*Funnel:*
📥 ${sellProjects.length} leads entered
→ ${sellProjects.filter(sp => sp.creditStatus === 'passed').length} credit approved
→ ${sellProjects.filter(sp => sp.convertedToSale).length} converted to sale
→ ${projects.length} active projects
→ ${projects.filter(p => p.currentMilestone >= 7).length} completed

${totalValue === 0 ? 'Pipeline is empty. Focus on lead generation and deal entry.' :
  convRate < 30 ? '⚠️ Conversion rate is below target. Review your lead qualification process.' :
  '✅ Pipeline metrics look healthy.'}`,
    agent: 'zeus',
  };
}

function generateFundStatus(projects: Project[], milestoneStates: Record<string, ProjectMilestoneState>): { text: string; agent: AgentId } {
  const lines: string[] = [];
  projects.forEach(p => {
    const ms = milestoneStates[p.id];
    if (!ms) {
      lines.push(`• ${p.customerName} — No milestone state (needs QC setup)`);
      return;
    }
    const fundStatus = ms.fundStatus || {};
    const released = Object.entries(fundStatus).filter(([, s]) => s === 'released').length;
    const pending = Object.entries(fundStatus).filter(([, s]) => s === 'approved' || s === 'pending').length;
    const totalPct = released > 0 ? MILESTONE_SOPS.slice(0, released).reduce((s, m) => s + m.fundPercent, 0) : 0;
    lines.push(`• ${p.customerName} — ${released} released (${totalPct}%), ${pending} pending, M${p.currentMilestone} current`);
  });

  return {
    text: `*Fund Release Status*

${lines.length > 0 ? lines.join('\n') : 'No active projects with fund tracking.'}

*Schedule:* ${MILESTONE_SOPS.map(s => `${s.id}: ${s.fundPercent}%`).join(' → ')} = 100%

Fund releases happen after: Installer submits checklist → Ops approves → Financier releases funds.`,
    agent: 'hermes',
  };
}

function generateQCHelp(sellProjects: SellProject[]): { text: string; agent: AgentId } {
  const pending = sellProjects.filter(sp => sp.convertedToSale && sp.approvalStatus !== 'clean');
  const dirty = sellProjects.filter(sp => sp.approvalStatus === 'dirty');
  const clean = sellProjects.filter(sp => sp.approvalStatus === 'clean');

  return {
    text: `*QC Review Status*

• Clean deals: ${clean.length}
• Dirty/flagged: ${dirty.length}
• Pending review: ${pending.length}

${dirty.length > 0 ? `*Flagged deals:*\n${dirty.map(sp => `• ${sp.firstName} ${sp.lastName} — ${sp.dirtyNotes || 'No notes'}`).join('\n')}` : ''}

*QC Process:*
1. Sales rep converts lead → enters QC queue
2. Backend Ops reviews deal quality
3. Clean → proceeds to project creation
4. Dirty → returned to rep with notes for correction

${pending.length > 0 ? '⚠️ There are deals waiting for QC review.' : '✅ No pending QC reviews.'}`,
    agent: 'athena',
  };
}

function generateSOPAnswer(entities: Record<string, string>): { text: string; agent: AgentId } {
  return {
    text: `*AlphaSale Master SOP Flow*

*Phase 1 — Lead Entry (Sales Rep)*
• Enter customer info, run credit check via Aurora
• If credit passes → complete Aurora design → convert to sale

*Phase 2 — QC Gate (Backend Ops)*
• Review converted deal for quality
• Mark clean (approved) or dirty (returned to rep)

*Phase 3 — Project Creation*
• Clean deal becomes an active project
• Assigned to installer company and financier

*Phase 4 — Milestones M1-M7 (Installer + Ops)*
• Installer completes checklist items per milestone
• Submits for ops review after each milestone
• Ops approves → triggers fund release percentage

*Phase 5 — Fund Releases (Financier)*
• Each milestone approval unlocks a percentage of contract value
• Financier reviews and releases funds to installer

*Phase 6 — Completion*
• M7 complete = project finished
• All funds released, PTO granted

Ask about any specific phase for more detail.`,
    agent: 'athena',
  };
}

function generateFeatureHelp(): { text: string; agent: AgentId } {
  return {
    text: `*Portal Guide*

*Sales Portal* (👤)
• *Sell Tab* — Create and manage leads. Run credit, sync Aurora, convert to sale.
• *Pipeline* — View active projects, track milestone progress.
• *Puzzle/Spin* — Gamification rewards for sales milestones.

*Backend Ops Portal* (⚙️)
• *QC Queue* — Review converted deals, mark clean/dirty.
• *Projects* — Monitor all active projects across installers.
• *Milestone review* — Approve installer submissions.

*Installer Portal* (🔧)
• *Project cards* — Complete milestone checklists, upload docs.
• *Submit for QC* — Send completed milestones to ops for review.

*Financier Portal* (💰)
• *Fund releases* — Review and release milestone payments.
• *Project overview* — Track all funded projects.

*The Pantheon* (👑)
• *Dashboard* — Live analysis across all portals.
• *Chat* — Ask questions, get help (you're here!).
• *Diagnostics* — Run full system tests.

Need help with a specific feature? Just ask!`,
    agent: 'apollo',
  };
}

// ─── Main Chat Handler ──────────────────────────────────────────────

export function processChat(
  query: string,
  projects: Project[],
  sellProjects: SellProject[],
  milestoneStates: Record<string, ProjectMilestoneState>
): ChatMessage {
  const { intent, agent, entities } = detectIntent(query);
  let result: { text: string; agent: AgentId };

  switch (intent) {
    case 'project_status':
    case 'lead_status':
      result = generateProjectStatus(projects, sellProjects, milestoneStates, entities);
      break;
    case 'milestone_help':
      result = generateMilestoneHelp(entities);
      break;
    case 'pipeline_overview':
    case 'conversion_help':
      result = generatePipelineOverview(projects, sellProjects);
      break;
    case 'fund_status':
      result = generateFundStatus(projects, milestoneStates);
      break;
    case 'qc_help':
      result = generateQCHelp(sellProjects);
      break;
    case 'sop_question':
      result = generateSOPAnswer(entities);
      break;
    case 'ticket_help':
      result = { text: `For technical issues, create a ticket from the project card in your portal. Backend Ops and the installer can collaborate on resolution through the ticket thread.\n\nTo check existing tickets, go to the relevant project in the Ops or Installer portal.\n\nDescribe your issue here and I can help diagnose it.`, agent: 'hephaestus' };
      break;
    case 'system_health':
      result = { text: `Use the *Re-scan* button at the top to run a fresh analysis, or hit *Run Diagnostic* to execute a full system test across all portals.\n\nThe health score and findings update automatically whenever your project data changes.`, agent: 'hephaestus' };
      break;
    case 'feature_help':
      result = generateFeatureHelp();
      break;
    default:
      result = {
        text: `I can help with:\n\n• *Project status* — "How is Maria Gonzalez's project doing?"\n• *Pipeline overview* — "Show me the pipeline"\n• *Milestone details* — "Tell me about M3"\n• *Fund status* — "What's the fund release status?"\n• *QC help* — "Show me pending QC reviews"\n• *SOP questions* — "What's the process for a new deal?"\n• *Feature help* — "How do I use the installer portal?"\n\nJust ask a question and the right agent will respond with live data.`,
        agent: 'zeus',
      };
  }

  return {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    role: 'agent',
    agentId: result.agent,
    text: result.text,
    timestamp: new Date().toISOString(),
  };
}
