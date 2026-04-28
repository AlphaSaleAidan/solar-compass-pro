/**
 * Council Chat — Message types and rule-based fallback for the AI Council.
 *
 * When the Railway/Anthropic backend is unavailable, falls back to
 * rule-based responses using live Supabase data.
 */

import type { Project, SellProject } from '@/data/mockData';
import type { ProjectMilestoneState } from '@/contexts/ProjectStore';
import { AGENTS, type AgentId, runCouncilAnalysis, buildDataContext } from './councilEngine';
import { MILESTONE_SOPS } from '@/data/milestoneSOP';

export interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  agentId?: AgentId;
  text: string;
  timestamp: string;
  isStreaming?: boolean;
  tokens?: number;
  latencyMs?: number;
}

const pf = (p: Project, field: string): string | undefined =>
  (p as Record<string, unknown>)[field] as string | undefined;

/**
 * Rule-based fallback chat handler.
 * Used when the AI backend is unavailable.
 */
export function processChat(
  query: string,
  agentId: AgentId,
  projects: Project[],
  sellProjects: SellProject[],
  milestoneStates: Record<string, ProjectMilestoneState>,
): ChatMessage {
  const lower = query.toLowerCase();
  let text: string;

  if (agentId === 'user-comms') {
    text = handleUserCommsQuery(lower, projects, sellProjects, milestoneStates);
  } else if (agentId === 'backend-operator') {
    text = handleBackendQuery(lower, projects, sellProjects, milestoneStates);
  } else if (agentId === 'code-auditor') {
    text = handleAuditQuery(lower, projects, sellProjects, milestoneStates);
  } else {
    text = handleUIQuery(lower, projects, sellProjects);
  }

  return {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    role: 'agent',
    agentId,
    text,
    timestamp: new Date().toISOString(),
  };
}

function handleUserCommsQuery(query: string, projects: Project[], sellProjects: SellProject[], milestoneStates: Record<string, ProjectMilestoneState>): string {
  if (/pipeline|overview|summary/.test(query)) {
    const totalValue = projects.reduce((s, p) => s + (p.contractValue || 0), 0);
    const converted = sellProjects.filter(sp => sp.convertedToSale).length;
    return `**Pipeline Overview**\n\n` +
      `• **Projects:** ${projects.length} active | $${totalValue.toLocaleString()} total\n` +
      `• **Leads:** ${sellProjects.length} total | ${converted} converted\n\n` +
      (projects.length > 0 ? projects.map(p => `• **${p.customerName}** — M${p.currentMilestone} | $${(p.contractValue || 0).toLocaleString()}`).join('\n') : '_No active projects._');
  }

  if (/milestone|m[1-7]/.test(query)) {
    const mMatch = query.match(/m([1-7])/i);
    if (mMatch) {
      const idx = parseInt(mMatch[1]) - 1;
      const sop = MILESTONE_SOPS[idx];
      if (sop) {
        return `**${sop.id}: ${sop.name}** — ${sop.fundPercent}% fund release\n\n${sop.description}\n\n**Checklist (${sop.checklist.length} items):**\n${sop.checklist.map((item, i) => `${i + 1}. ${item.label}`).join('\n')}`;
      }
    }
    return `**Milestones M1-M7:**\n\n${MILESTONE_SOPS.map(s => `• **${s.id}** — ${s.name} (${s.fundPercent}%)`).join('\n')}`;
  }

  if (/sop|process|procedure/.test(query)) {
    return `**AlphaSale SOP:**\n1. Lead Entry → credit check → Aurora design → convert\n2. QC Gate → clean/dirty\n3. Active project with M1-M7\n4. Installer completes milestones, submits for QC\n5. Ops approves → fund release\n6. Schedule: M1:15% M2:20% M3:15% M4:20% M5:20% M6:10% M7:5%`;
  }

  // Customer name search
  const allNames = [...projects.map(p => p.customerName), ...sellProjects.map(sp => `${sp.firstName} ${sp.lastName}`)].filter(Boolean);
  for (const name of allNames) {
    if (query.includes(name.toLowerCase().split(' ')[0]?.toLowerCase() || '---')) {
      const project = projects.find(p => p.customerName?.toLowerCase().includes(name.toLowerCase().split(' ')[0]));
      if (project) {
        const ms = milestoneStates[project.id];
        return `**${project.customerName}** — M${project.currentMilestone}\n• Contract: $${(project.contractValue || 0).toLocaleString()}\n• Status: ${project.status}\n• Checklist: ${ms ? Object.values(ms.checklistDone || {}).filter(Boolean).length : 0} items done`;
      }
    }
  }

  return `I can help with:\n• **Pipeline overview** — all projects and leads\n• **M1-M7** — milestone details\n• **SOP process** — how the system works\n• **Customer name** — look up any deal or project`;
}

function handleBackendQuery(query: string, projects: Project[], sellProjects: SellProject[], milestoneStates: Record<string, ProjectMilestoneState>): string {
  if (/error|scan|broken|issue/.test(query)) {
    const council = runCouncilAnalysis(projects, sellProjects, milestoneStates);
    const criticals = council.reports.flatMap(r => r.findings).filter(f => f.severity === 'critical');
    if (criticals.length === 0) return '✅ No critical issues found. System health: ' + council.overallScore + '/100';
    return `**${criticals.length} Critical Issues:**\n\n${criticals.map(f => `• **${f.title}** — ${f.description.slice(0, 120)}`).join('\n\n')}`;
  }
  return `**Backend Status:** ${projects.length} projects tracked, ${sellProjects.length} leads in pipeline. Ask me about errors, data integrity, or system health.`;
}

function handleAuditQuery(query: string, projects: Project[], sellProjects: SellProject[], milestoneStates: Record<string, ProjectMilestoneState>): string {
  const council = runCouncilAnalysis(projects, sellProjects, milestoneStates);
  const findings = council.reports.flatMap(r => r.findings).filter(f => f.severity !== 'info');
  if (findings.length === 0) return '✅ No issues found. Score: ' + council.overallScore + '/100';
  return `**Audit: ${findings.length} findings** (Score: ${council.overallScore}/100)\n\n${findings.slice(0, 5).map(f => `• [${f.severity.toUpperCase()}] **${f.title}** — ${f.description.slice(0, 100)}`).join('\n\n')}`;
}

function handleUIQuery(query: string, projects: Project[], sellProjects: SellProject[]): string {
  return `**UI Inspector** — Ready to analyze frontend components.\n\nAsk me to review specific pages, check layouts, or scan for accessibility issues.\n\nCurrent data: ${projects.length} projects, ${sellProjects.length} leads loaded.`;
}

export { buildDataContext };
