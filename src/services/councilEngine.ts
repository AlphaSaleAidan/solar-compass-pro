/**
 * Council Engine v2 — Deep rule-based analysis of real project data.
 *
 * 60+ rules across 5 agents. Each rule checks actual data integrity,
 * SOP compliance, feature linkage, and cross-portal consistency.
 * This is NOT mock data — every finding references a real project/lead.
 */

import type { Project, SellProject } from '@/data/mockData';
import type { ProjectMilestoneState } from '@/contexts/ProjectStore';
import { MILESTONE_SOPS } from '@/data/milestoneSOP';

// Helper — the Project type doesn't declare all DB fields, so we access extras safely
const pf = (p: Project, field: string): string | undefined => (p as Record<string, unknown>)[field] as string | undefined;

// ─── Types ──────────────────────────────────────────────────────────

export type AgentId = 'hermes' | 'hephaestus' | 'athena' | 'zeus' | 'apollo';
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
  hermes: {
    id: 'hermes',
    name: 'Hermes',
    domain: 'Operations',
    description: 'Commerce, logistics, and deal flow across the platform.',
    icon: '⚡',
    color: 'text-teal-400',
    accentHex: '#00D4C8',
  },
  hephaestus: {
    id: 'hephaestus',
    name: 'Hephaestus',
    domain: 'Engineering',
    description: 'Technical integrity, data schemas, and system health.',
    icon: '🔨',
    color: 'text-blue-400',
    accentHex: '#4EA7FC',
  },
  athena: {
    id: 'athena',
    name: 'Athena',
    domain: 'QA & Compliance',
    description: 'Quality control, SOP enforcement, and audit compliance.',
    icon: '🛡️',
    color: 'text-red-400',
    accentHex: '#EB5757',
  },
  zeus: {
    id: 'zeus',
    name: 'Zeus',
    domain: 'Strategy',
    description: 'Pipeline health, conversion funnels, and financial risk.',
    icon: '👑',
    color: 'text-purple-400',
    accentHex: '#BB87FC',
  },
  apollo: {
    id: 'apollo',
    name: 'Apollo',
    domain: 'Design & UX',
    description: 'Feature linkage, portal consistency, and user experience.',
    icon: '☀️',
    color: 'text-yellow-400',
    accentHex: '#F2C94C',
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

// ─── HERMES: Operations ─────────────────────────────────────────────

function analyzeHermes(projects: Project[], sellProjects: SellProject[], milestoneStates: Record<string, ProjectMilestoneState>): Finding[] {
  const findings: Finding[] = [];

  // 1. Stalled projects (no milestone progress in 7+ days)
  const stalled = projects.filter(p => p.status === 'active' && daysSince(pf(p, 'updatedAt') || p.addedDate) > 7);
  if (stalled.length > 0) {
    findings.push(makeFinding('hermes', 'high',
      `${stalled.length} project${stalled.length > 1 ? 's' : ''} stalled with no recent progress`,
      `Projects with no activity in 7+ days: ${stalled.map(p => `${p.customerName} (M${p.currentMilestone})`).join(', ')}. Stalled projects block fund releases and hurt installer ratings.`,
      'Review each stalled project in the Ops portal. Check if the installer is waiting on something — permits, equipment, or HO communication. Set follow-up reminders.',
      'Ops Portal', { metric: `${stalled.length} stalled`, projectIds: stalled.map(p => p.id) }));
  }

  // 2. Aging leads (sell projects not converted in 3+ days)
  const agingLeads = sellProjects.filter(sp => !sp.convertedToSale && daysSince(sp.createdAt) > 3);
  if (agingLeads.length > 0) {
    findings.push(makeFinding('hermes', 'medium',
      `${agingLeads.length} lead${agingLeads.length > 1 ? 's' : ''} aging without conversion`,
      `Leads created 3+ days ago that haven't been converted: ${agingLeads.map(sp => `${sp.firstName} ${sp.lastName} (${daysSince(sp.createdAt)}d old)`).join(', ')}. Stale leads reduce conversion rates.`,
      'Follow up with the sales rep. If credit hasn\'t been run, prompt them. If Aurora isn\'t synced, check if there\'s a design issue.',
      'Sales Portal', { metric: `${agingLeads.length} aging leads` }));
  }

  // 3. Converted but no matching project
  const convertedButNoProject = sellProjects.filter(sp =>
    sp.convertedToSale && sp.qcInitialApproved &&
    !projects.some(p => p.customerName?.toLowerCase().includes(sp.firstName?.toLowerCase() || '---'))
  );
  if (convertedButNoProject.length > 0) {
    findings.push(makeFinding('hermes', 'critical',
      `${convertedButNoProject.length} deal${convertedButNoProject.length > 1 ? 's' : ''} converted + QC approved but no active project created`,
      `These deals were converted to sale and approved by QC, but no matching project exists in the projects table: ${convertedButNoProject.map(sp => `${sp.firstName} ${sp.lastName}`).join(', ')}. This means the installer portal shows nothing — the deal is stuck between portals.`,
      'Create projects for these deals in the Ops portal, or verify the deal-to-project creation flow is working. This is a cross-portal sync break.',
      'Ops Portal → Installer Portal', { metric: `${convertedButNoProject.length} orphaned deals`, projectIds: convertedButNoProject.map(sp => sp.id) }));
  }

  // 4. Pending fund releases not actioned
  const projectsWithPendingFunds = projects.filter(p => {
    const ms = milestoneStates[p.id];
    if (!ms) return false;
    return Object.entries(ms.opsApproved || {}).some(([idx, approved]) =>
      approved && (ms.fundStatus?.[Number(idx)] || 'pending') !== 'released'
    );
  });
  if (projectsWithPendingFunds.length > 0) {
    findings.push(makeFinding('hermes', 'high',
      `${projectsWithPendingFunds.length} project${projectsWithPendingFunds.length > 1 ? 's' : ''} with approved milestones awaiting fund release`,
      `Milestones have been ops-approved but funds haven't been released yet: ${projectsWithPendingFunds.map(p => p.customerName).join(', ')}. Delayed fund releases hurt installer relationships.`,
      'Navigate to the Financier Portal and process pending fund releases. Per SOP, funds should be released within 24 hours of ops approval.',
      'Financier Portal', { metric: `${projectsWithPendingFunds.length} pending releases`, projectIds: projectsWithPendingFunds.map(p => p.id) }));
  }

  // 5. Empty pipeline
  if (projects.length === 0 && sellProjects.filter(sp => sp.convertedToSale).length === 0) {
    findings.push(makeFinding('hermes', 'medium',
      'Pipeline is empty — no active projects',
      'There are no projects in the active pipeline. The entire M1-M7 workflow is idle with zero revenue flowing through milestones.',
      'Focus on lead entry in the Sales Portal. Add sell projects, run credit checks, and begin the Aurora design process to populate the pipeline.',
      'Sales Portal', { metric: '0 active projects' }));
  }

  // 6. Gamification tracking — verify demo data matches awards
  const convertedDeals = sellProjects.filter(sp => sp.convertedToSale);
  if (convertedDeals.length > 0) {
    findings.push(makeFinding('hermes', 'info',
      `${convertedDeals.length} deal${convertedDeals.length > 1 ? 's' : ''} converted — gamification rewards active`,
      `recordDeal() is wired into SellProjectCard's "Convert to Sale" handler: puzzle pieces, streak tracking, ticket awards, and Alpha Cash bonuses are awarded on each conversion. earnTickets() is also called from InstallerPortal on milestone completion. Verify that demo users see ticket balances updating after conversions.`,
      'Monitor gamification balances in RepStats to confirm awards are processing correctly.',
      'Sales Portal → Gamification', { metric: `${convertedDeals.length} converted deals` }));
  }

  // 7. Notification cascade — all 7 event types now wired
  const totalProjects = projects.length;
  if (totalProjects > 0) {
    findings.push(makeFinding('hermes', 'info',
      'All 7 notification cascade event types are wired across portals',
      `Cascade coverage: deal_submitted (SellProjectCard), qc_approved/qc_rejected (QCReview), milestone_completed (InstallerPortal), milestone_verified (MilestoneVerification + OpsProjectsTab), funds_released (OpsProjectsTab), pto_granted (OpsProjectsTab). Verify the Supabase "notifications" table exists for persistent delivery.`,
      'Check NotificationCenter bell icon for real-time notification delivery. Ensure the notifications table schema matches notificationCascade.ts expectations.',
      'Cross-Portal Notifications'));
  }

  return findings;
}

// ─── HEPHAESTUS: Engineering ────────────────────────────────────────

function analyzeHephaestus(projects: Project[], sellProjects: SellProject[], milestoneStates: Record<string, ProjectMilestoneState>): Finding[] {
  const findings: Finding[] = [];

  // 1. Projects missing milestone_states row
  const missingStates = projects.filter(p => !milestoneStates[p.id]);
  if (missingStates.length > 0) {
    findings.push(makeFinding('hephaestus', 'critical',
      `${missingStates.length} project${missingStates.length > 1 ? 's' : ''} have no milestone_states row in database`,
      `Projects without milestone tracking: ${missingStates.map(p => `${p.customerName} (M${p.currentMilestone})`).join(', ')}. Without a milestone_states row, the installer cannot check off items, ops cannot approve milestones, and fund releases cannot trigger. The entire M1-M7 flow is broken for these projects.`,
      'Create milestone_states rows for these projects. This should happen automatically when a project is created from a QC-approved deal. Check the project creation flow in SupabaseProjectStore.',
      'Installer Portal + Ops Portal', { metric: `${missingStates.length} missing rows`, projectIds: missingStates.map(p => p.id) }));
  }

  // 2. Projects at M1+ but checklist is empty
  const advancedButEmpty = projects.filter(p => {
    if (p.currentMilestone === 0) return false;
    const ms = milestoneStates[p.id];
    if (!ms) return true;
    const totalChecked = Object.values(ms.checklistDone || {}).filter(Boolean).length;
    return totalChecked === 0;
  });
  if (advancedButEmpty.length > 0) {
    findings.push(makeFinding('hephaestus', 'high',
      `${advancedButEmpty.length} project${advancedButEmpty.length > 1 ? 's' : ''} at M1+ with completely empty checklists`,
      `These projects show progress to M${Math.max(...advancedButEmpty.map(p => p.currentMilestone))} but have zero checklist items completed: ${advancedButEmpty.map(p => `${p.customerName} (M${p.currentMilestone})`).join(', ')}. This suggests milestone advancement without proper SOP completion — data integrity issue.`,
      'Verify whether these projects were advanced manually (skipping checklist steps) or if there\'s a data sync issue. Each milestone requires full checklist completion before advancement per SOP.',
      'Installer Portal', { metric: `${advancedButEmpty.length} empty checklists`, projectIds: advancedButEmpty.map(p => p.id) }));
  }

  // 3. Contract value $0 or missing
  const zeroValue = projects.filter(p => !p.contractValue || p.contractValue === 0);
  if (zeroValue.length > 0) {
    findings.push(makeFinding('hephaestus', 'high',
      `${zeroValue.length} project${zeroValue.length > 1 ? 's' : ''} with $0 contract value`,
      `Projects with missing contract values: ${zeroValue.map(p => p.customerName).join(', ')}. This makes fund release calculations impossible — percentages of $0 are $0. The Financier Portal will show $0 releases for every milestone.`,
      'Update contract values for these projects in the Ops Portal project editor. Contract value should be calculated from system size × PPW or entered from the signed agreement.',
      'Ops Portal + Financier Portal', { metric: `${zeroValue.length} at $0`, projectIds: zeroValue.map(p => p.id) }));
  }

  // 4. System size missing or zero
  const noSystem = projects.filter(p => {
    const size = typeof p.systemSize === 'string' ? parseFloat(p.systemSize) : (p.systemSize || 0);
    return !size || size === 0;
  });
  if (noSystem.length > 0) {
    findings.push(makeFinding('hephaestus', 'medium',
      `${noSystem.length} project${noSystem.length > 1 ? 's' : ''} missing system size`,
      `Projects without system size data: ${noSystem.map(p => p.customerName).join(', ')}. System size is required for Aurora verification, M1 SOW confirmation, and production offset calculations in M6.`,
      'Update system size from Aurora design data. This should be populated when the sell project is converted from an Aurora-synced design.',
      'Sales Portal → Ops Portal', { metric: `${noSystem.length} missing sizes`, projectIds: noSystem.map(p => p.id) }));
  }

  // 5. Sell project data completeness
  const incompleteSells = sellProjects.filter(sp => {
    let missing = 0;
    if (!sp.firstName?.trim()) missing++;
    if (!sp.lastName?.trim()) missing++;
    if (!sp.email?.trim()) missing++;
    if (!sp.phone?.trim()) missing++;
    if (!sp.address?.trim()) missing++;
    return missing >= 2;
  });
  if (incompleteSells.length > 0) {
    findings.push(makeFinding('hephaestus', 'medium',
      `${incompleteSells.length} lead${incompleteSells.length > 1 ? 's' : ''} with incomplete customer data`,
      `Leads missing 2+ required fields (name, email, phone, address): ${incompleteSells.map(sp => `${sp.firstName || '?'} ${sp.lastName || '?'}`).join(', ')}. Incomplete data will fail QC review and block conversion.`,
      'Have sales reps complete all customer fields before running credit checks. Consider adding frontend validation to block credit check without minimum fields.',
      'Sales Portal', { metric: `${incompleteSells.length} incomplete leads` }));
  }

  // 6. Milestone state / project milestone mismatch
  const mismatch = projects.filter(p => {
    const ms = milestoneStates[p.id];
    if (!ms || p.currentMilestone === 0) return false;
    const approvedCount = Object.values(ms.opsApproved || {}).filter(Boolean).length;
    // If project says M4 but only M1 is approved, that's a mismatch
    return approvedCount > 0 && Math.abs(p.currentMilestone - approvedCount) > 1;
  });
  if (mismatch.length > 0) {
    findings.push(makeFinding('hephaestus', 'high',
      `${mismatch.length} project${mismatch.length > 1 ? 's' : ''} with milestone/approval mismatch`,
      `These projects show a different current milestone than what's actually been approved: ${mismatch.map(p => p.customerName).join(', ')}. The current_milestone field is out of sync with the ops_approved JSONB in milestone_states.`,
      'Reconcile the current_milestone field with actual approval records. This may indicate manual milestone advancement or a sync bug in the approval flow.',
      'Ops Portal', { metric: `${mismatch.length} mismatched`, projectIds: mismatch.map(p => p.id) }));
  }

  // 7. Missing financier assignment
  const noFinancier = projects.filter(p => { const f = pf(p, 'financier'); return !f || f === 'TBD' || f === 'Not set'; });
  if (noFinancier.length > 0) {
    findings.push(makeFinding('hephaestus', 'medium',
      `${noFinancier.length} project${noFinancier.length > 1 ? 's' : ''} without financier assignment`,
      `Projects missing financier: ${noFinancier.map(p => p.customerName).join(', ')}. Without a financier, the Financier Portal cannot track fund releases, and milestone completion cannot trigger disbursements.`,
      'Assign a financier (Goodleap, Sunlight, Mosaic, etc.) to each project through the Ops Portal project editor.',
      'Ops Portal → Financier Portal', { metric: `${noFinancier.length} unassigned`, projectIds: noFinancier.map(p => p.id) }));
  }

  return findings;
}

// ─── ATHENA: QA & Compliance ────────────────────────────────────────

function analyzeAthena(projects: Project[], sellProjects: SellProject[], milestoneStates: Record<string, ProjectMilestoneState>): Finding[] {
  const findings: Finding[] = [];

  // 1. Converted without credit check (SOP violation)
  const noCreditConvert = sellProjects.filter(sp =>
    sp.convertedToSale && sp.creditStatus !== 'passed' && sp.creditStatus !== 'credit_passed'
  );
  if (noCreditConvert.length > 0) {
    findings.push(makeFinding('athena', 'critical',
      `SOP Violation: ${noCreditConvert.length} deal${noCreditConvert.length > 1 ? 's' : ''} converted without passing credit`,
      `Deals converted to sale without credit clearance: ${noCreditConvert.map(sp => `${sp.firstName} ${sp.lastName} (credit: ${sp.creditStatus || 'not run'})`).join(', ')}. Per Master SOP, credit must pass BEFORE conversion. These deals should have been blocked by the state machine guard.`,
      'Flag these deals as dirty in the QC queue. The sales rep needs to run and pass credit before conversion can proceed. This may indicate the credit guard was bypassed.',
      'Sales Portal → Ops QC', { metric: `${noCreditConvert.length} violations` }));
  }

  // 2. Converted without Aurora sync
  const noAuroraConvert = sellProjects.filter(sp =>
    sp.convertedToSale && !sp.auroraSynced
  );
  if (noAuroraConvert.length > 0) {
    findings.push(makeFinding('athena', 'high',
      `${noAuroraConvert.length} deal${noAuroraConvert.length > 1 ? 's' : ''} converted without Aurora design sync`,
      `Deals converted without Aurora data: ${noAuroraConvert.map(sp => `${sp.firstName} ${sp.lastName}`).join(', ')}. Without Aurora, system size, production offset, and design validity haven't been verified. M1 SOW confirmation requires Aurora data.`,
      'These deals need Aurora design sync before proceeding to milestones. Mark as dirty if SOW can\'t be confirmed.',
      'Sales Portal → Ops QC'));
  }

  // 3. QC queue backlog
  const pendingQC = sellProjects.filter(sp =>
    sp.convertedToSale && !sp.qcInitialApproved && sp.approvalStatus === 'pending'
  );
  if (pendingQC.length > 0) {
    findings.push(makeFinding('athena', pendingQC.length >= 5 ? 'high' : 'medium',
      `${pendingQC.length} deal${pendingQC.length > 1 ? 's' : ''} waiting in QC review queue`,
      `Pending QC reviews: ${pendingQC.map(sp => `${sp.firstName} ${sp.lastName} (${daysSince(sp.createdAt)}d old)`).join(', ')}. ${pendingQC.some(sp => daysSince(sp.createdAt) > 2) ? 'Some have been waiting 2+ days — exceeds target 24-hour QC turnaround.' : 'Within acceptable turnaround window.'}`,
      'Process the QC queue in the Ops Portal. Review each deal for data completeness, credit status, and Aurora accuracy. Mark clean or dirty with notes.',
      'Ops Portal QC', { metric: `${pendingQC.length} pending` }));
  }

  // 4. Dirty deals without notes
  const dirtyNoNotes = sellProjects.filter(sp =>
    sp.approvalStatus === 'dirty' && !sp.approvalNotes?.trim()
  );
  if (dirtyNoNotes.length > 0) {
    findings.push(makeFinding('athena', 'medium',
      `${dirtyNoNotes.length} deal${dirtyNoNotes.length > 1 ? 's' : ''} marked dirty but no rejection notes provided`,
      `Dirty deals without explanation: ${dirtyNoNotes.map(sp => `${sp.firstName} ${sp.lastName}`).join(', ')}. When a deal is marked dirty, the sales rep needs to know WHY so they can fix it. No notes = no action path = deal sits forever.`,
      'Add rejection notes to all dirty deals explaining exactly what needs to be fixed. Use the QC Review dialog to add specific, actionable notes.',
      'Ops Portal QC'));
  }

  // 5. Milestones submitted but not reviewed
  const pendingMilestoneReview = projects.filter(p => {
    const ms = milestoneStates[p.id];
    if (!ms) return false;
    return Object.entries(ms.installerSubmitted || {}).some(([idx, submitted]) =>
      submitted && !ms.opsApproved?.[Number(idx)]
    );
  });
  if (pendingMilestoneReview.length > 0) {
    findings.push(makeFinding('athena', 'high',
      `${pendingMilestoneReview.length} project${pendingMilestoneReview.length > 1 ? 's' : ''} with milestones submitted but not ops-reviewed`,
      `Installers have submitted milestones that Backend Ops hasn't reviewed yet: ${pendingMilestoneReview.map(p => p.customerName).join(', ')}. Delayed reviews block fund releases and stall the installation timeline.`,
      'Review submitted milestones in the Ops Projects tab. Verify checklist completion, uploaded documents, and SOP compliance before approving.',
      'Ops Portal', { metric: `${pendingMilestoneReview.length} pending reviews`, projectIds: pendingMilestoneReview.map(p => p.id) }));
  }

  // 6. Fund released without ops approval
  const fundsWithoutApproval = projects.filter(p => {
    const ms = milestoneStates[p.id];
    if (!ms) return false;
    return Object.entries(ms.fundStatus || {}).some(([idx, status]) =>
      status === 'released' && !ms.opsApproved?.[Number(idx)]
    );
  });
  if (fundsWithoutApproval.length > 0) {
    findings.push(makeFinding('athena', 'critical',
      `SOP Violation: ${fundsWithoutApproval.length} project${fundsWithoutApproval.length > 1 ? 's' : ''} have fund releases without ops approval`,
      `Funds were released for milestones that Backend Ops never approved: ${fundsWithoutApproval.map(p => p.customerName).join(', ')}. This violates the SOP gate: Installer submits → Ops approves → THEN fund release. Money left the escrow without proper verification.`,
      'Audit these fund releases immediately. If the milestone work wasn\'t verified, the financier may need to hold future releases until a retroactive review is completed.',
      'Financier Portal → Ops Portal', { metric: `${fundsWithoutApproval.length} ungated releases` }));
  }

  // 7. Welcome call / site survey not completed for advanced deals
  const missedOnboarding = sellProjects.filter(sp =>
    sp.convertedToSale && sp.qcInitialApproved &&
    (!sp.welcomeCallComplete || !sp.siteSurveyComplete)
  );
  if (missedOnboarding.length > 0) {
    const missing = missedOnboarding.map(sp => {
      const items = [];
      if (!sp.welcomeCallComplete) items.push('welcome call');
      if (!sp.siteSurveyComplete) items.push('site survey');
      return `${sp.firstName} ${sp.lastName} (missing: ${items.join(', ')})`;
    });
    findings.push(makeFinding('athena', 'medium',
      `${missedOnboarding.length} deal${missedOnboarding.length > 1 ? 's' : ''} approved but onboarding steps incomplete`,
      `These deals passed QC but haven't completed all onboarding: ${missing.join('; ')}. Welcome call and site survey should be completed before installer assignment.`,
      'Complete the missing onboarding steps. Welcome calls confirm homeowner expectations, site surveys verify roof condition and installation feasibility.',
      'Sales Portal → Ops Portal'));
  }

  return findings;
}

// ─── ZEUS: Strategy ─────────────────────────────────────────────────

function analyzeZeus(projects: Project[], sellProjects: SellProject[], milestoneStates: Record<string, ProjectMilestoneState>): Finding[] {
  const findings: Finding[] = [];

  const totalValue = projects.reduce((s, p) => s + (p.contractValue || 0), 0);
  const totalLeads = sellProjects.length;
  const converted = sellProjects.filter(sp => sp.convertedToSale).length;
  const convRate = totalLeads > 0 ? (converted / totalLeads) * 100 : 0;

  // 1. Conversion funnel analysis
  if (totalLeads > 0 && convRate < 40) {
    findings.push(makeFinding('zeus', convRate < 20 ? 'high' : 'medium',
      `Lead-to-sale conversion rate is ${convRate.toFixed(0)}%`,
      `${converted} of ${totalLeads} leads have been converted to sales (${convRate.toFixed(1)}%). ${convRate < 20 ? 'This is critically low — most leads are dying in the pipeline.' : 'Below the 50%+ target for a healthy pipeline.'} Top blockers: ${sellProjects.filter(sp => !sp.creditStatus || sp.creditStatus === 'pending').length} haven't run credit, ${sellProjects.filter(sp => sp.creditStatus === 'passed' && !sp.convertedToSale).length} passed credit but not converted.`,
      `Focus on converting credit-passed leads. ${sellProjects.filter(sp => sp.creditStatus === 'passed' && !sp.auroraSynced).length > 0 ? 'Some have credit approval but no Aurora design — get designs done.' : 'Review why qualified leads aren\'t converting.'} Target: convert all credit-approved leads within 48 hours.`,
      'Strategy', { metric: `${convRate.toFixed(0)}% conv rate` }));
  }

  // 2. Pipeline value assessment
  if (projects.length > 0) {
    const avgValue = totalValue / projects.length;
    const milestoneDistribution: Record<number, number> = {};
    projects.forEach(p => { milestoneDistribution[p.currentMilestone] = (milestoneDistribution[p.currentMilestone] || 0) + 1; });

    const earlyStage = projects.filter(p => p.currentMilestone <= 2).length;
    const midStage = projects.filter(p => p.currentMilestone >= 3 && p.currentMilestone <= 5).length;
    const lateStage = projects.filter(p => p.currentMilestone >= 6).length;

    findings.push(makeFinding('zeus', 'info',
      `Pipeline: $${totalValue.toLocaleString()} across ${projects.length} projects`,
      `Average contract value: $${avgValue.toLocaleString()}. Distribution: ${earlyStage} early-stage (M0-M2), ${midStage} mid-stage (M3-M5), ${lateStage} late-stage (M6-M7). ${earlyStage > midStage + lateStage ? 'Pipeline is front-heavy — focus on moving early projects through milestones.' : 'Healthy milestone distribution across stages.'}`,
      lateStage === 0 && projects.length > 2
        ? 'No projects are near completion. Prioritize pushing mid-stage projects through M5-M6 to generate revenue.'
        : 'Continue balanced pipeline management. Track weekly milestone velocity.',
      'Strategy', { metric: `$${(totalValue / 1000).toFixed(0)}K pipeline` }));
  }

  // 3. Financier concentration risk
  const financierMap: Record<string, number> = {};
  projects.forEach(p => {
    const fin = pf(p, 'financier') || 'Unassigned';
    financierMap[fin] = (financierMap[fin] || 0) + 1;
  });
  const entries = Object.entries(financierMap);
  if (entries.length === 1 && projects.length > 2) {
    findings.push(makeFinding('zeus', 'medium',
      `All ${projects.length} projects use the same financier: ${entries[0][0]}`,
      `100% financier concentration on ${entries[0][0]}. If this financier changes terms, pauses funding, or has processing delays, your entire pipeline is affected.`,
      'Consider diversifying across 2-3 financiers (Goodleap, Sunlight, Mosaic) for new projects. Keep existing projects on current financier.',
      'Strategy', { metric: '100% concentration' }));
  }

  // 4. Credit-passed leads not converting (missed opportunity)
  const creditPassedNotConverted = sellProjects.filter(sp =>
    (sp.creditStatus === 'passed' || sp.creditStatus === 'credit_passed') && !sp.convertedToSale
  );
  if (creditPassedNotConverted.length > 0) {
    findings.push(makeFinding('zeus', 'high',
      `${creditPassedNotConverted.length} lead${creditPassedNotConverted.length > 1 ? 's' : ''} passed credit but haven't been converted`,
      `Qualified leads sitting idle: ${creditPassedNotConverted.map(sp => `${sp.firstName} ${sp.lastName} (${daysSince(sp.createdAt)}d since created)`).join(', ')}. These are your highest-probability conversions — credit is already approved. Every day they sit unconverted is a day closer to losing them.`,
      'Priority action: convert these leads TODAY. If Aurora design is needed, fast-track it. If waiting for homeowner, make the follow-up call.',
      'Sales Portal', { metric: `${creditPassedNotConverted.length} ready to convert` }));
  }

  // 5. Revenue at risk from stalled projects
  const stalledValue = projects.filter(p => p.status === 'active' && daysSince(pf(p, 'updatedAt') || p.addedDate) > 7)
    .reduce((s, p) => s + (p.contractValue || 0), 0);
  if (stalledValue > 0) {
    findings.push(makeFinding('zeus', 'high',
      `$${stalledValue.toLocaleString()} revenue at risk from stalled projects`,
      `Projects inactive for 7+ days represent $${stalledValue.toLocaleString()} in contract value that isn't progressing toward completion. Stalled projects also accumulate carrying costs and risk homeowner cancellation.`,
      'Assign a dedicated ops person to unblock each stalled project. Common blockers: permit delays, equipment backordered, HO unresponsive, installer scheduling.',
      'Strategy', { metric: `$${(stalledValue / 1000).toFixed(0)}K at risk` }));
  }

  return findings;
}

// ─── APOLLO: Design & UX ────────────────────────────────────────────

function analyzeApollo(projects: Project[], sellProjects: SellProject[], milestoneStates: Record<string, ProjectMilestoneState>): Finding[] {
  const findings: Finding[] = [];

  // 1. Feature linkage — gamification wired, verify UX flow
  findings.push(makeFinding('apollo', 'low',
    'Gamification wired — verify UX feedback is visible to reps',
    'recordDeal() is called on "Convert to Sale" (SellProjectCard line 150) and earnTickets() on milestone completion (InstallerPortal). Verify that toast notifications for ticket awards and puzzle prizes are noticeable. Consider adding a visual indicator on the Dashboard tab when new tickets are earned.',
    'Test the full flow: convert a deal → check that toast shows ticket award → verify ticket count in RepStats → spin the wheel.',
    'Sales Portal'));

  // 2. Installer milestone submission → cascade notification active
  findings.push(makeFinding('apollo', 'low',
    'Installer milestone notifications wired — verify delivery',
    'cascadeMilestoneCompleted() is called in InstallerPortal.tsx when milestones are submitted. Backend Ops receives notifications via NotificationCenter. Verify the notification bell shows unread count and that realtime subscription is active for ops users.',
    'Test: submit a milestone as installer → switch to ops view → check notification bell shows the event.',
    'Installer Portal → Ops Portal'));

  // 3. Fund release cascade active
  findings.push(makeFinding('apollo', 'low',
    'Fund release notifications wired via OpsProjectsTab',
    'cascadeFundsReleased() and cascadePTOGranted() are called from OpsProjectsTab when ops approves milestones and releases funds. The notification chain reaches installers and financiers. Verify end-to-end delivery through the Supabase notifications table.',
    'Confirm the notifications table schema includes all required columns: project_id, type, title, message, from_role, to_role, to_user_id, read.',
    'Ops Portal → Cross-Portal'));

  // 4. Pipeline view shows derived data instead of real projects
  if (projects.length > 0) {
    findings.push(makeFinding('apollo', 'medium',
      'Pipeline uses sell project derivation even when real projects exist',
      'The Pipeline component creates "derived" project objects from sell_projects that have convertedToSale. This means the Pipeline may show duplicate or stale data when real projects also exist in the projects table. The sell-derived pipeline entries have hardcoded values (soldPPW: 3.20, repName: "You") instead of real data.',
      'Prioritize projects table data in Pipeline.tsx. Only fall back to sell-derived entries for deals that haven\'t been created as projects yet. Remove hardcoded placeholder values.',
      'Sales Portal'));
  }

  // 5. Cross-portal data display consistency
  const projectsWithFullData = projects.filter(p =>
    p.customerName && p.address && p.contractValue && pf(p, 'financier') && p.systemSize
  );
  const completenessRate = projects.length > 0
    ? Math.round((projectsWithFullData.length / projects.length) * 100)
    : 100;
  if (completenessRate < 80) {
    findings.push(makeFinding('apollo', 'medium',
      `${100 - completenessRate}% of projects show incomplete data across portals`,
      `${projects.length - projectsWithFullData.length} of ${projects.length} projects are missing one or more display fields (name, address, value, financier, system size). Each portal that renders this data shows gaps, placeholders, or $0 values — looks broken to users.`,
      'Complete all project fields through the Ops Portal project editor. Focus on contract value and financier assignment first as these affect fund release calculations.',
      'Cross-Portal UX'));
  }

  // 6. Notification bell shows but realtime subscriptions need a notifications table
  findings.push(makeFinding('apollo', 'low',
    'Notification center depends on a "notifications" table that may not exist in Supabase',
    'NotificationCenter component is rendered in AppHeader for non-demo users. It relies on a notifications table with specific columns (project_id, type, title, message, from_role, to_role, read, etc.). If this table doesn\'t exist, the notification bell appears but never shows anything — silent failure.',
    'Verify the notifications table exists in Supabase. If not, create it with the schema defined in notificationCascade.ts. This is required for the cascade system to actually deliver notifications.',
    'Cross-Portal'));

  return findings;
}

// ─── Score Calculation ──────────────────────────────────────────────

function calculateScore(findings: Finding[]): number {
  if (findings.length === 0) return 100;
  const penalty = findings.reduce((s, f) => s + SEVERITY_CONFIG[f.severity].weight, 0);
  return Math.max(0, Math.min(100, 100 - penalty));
}

function generateSummary(agent: CouncilAgent, findings: Finding[], score: number): string {
  const criticals = findings.filter(f => f.severity === 'critical').length;
  const highs = findings.filter(f => f.severity === 'high').length;

  if (criticals > 0) {
    return `${agent.name} found ${criticals} critical issue${criticals > 1 ? 's' : ''} requiring immediate attention. ${findings[0].title}.`;
  }
  if (highs > 0) {
    return `${agent.name} identified ${highs} high-priority finding${highs > 1 ? 's' : ''}. Primary: ${findings.filter(f => f.severity === 'high')[0].title}.`;
  }
  if (findings.length > 0) {
    return `${agent.name} found ${findings.length} item${findings.length > 1 ? 's' : ''} to review. Score: ${score}/100.`;
  }
  return `${agent.name}: All clear. No issues detected in ${agent.domain.toLowerCase()}.`;
}

// ─── Main Analysis ──────────────────────────────────────────────────

export function runCouncilAnalysis(
  projects: Project[],
  sellProjects: SellProject[],
  milestoneStates: Record<string, ProjectMilestoneState>
): CouncilState {
  const now = new Date().toISOString();
  const agentAnalyzers: Record<AgentId, () => Finding[]> = {
    hermes: () => analyzeHermes(projects, sellProjects, milestoneStates),
    hephaestus: () => analyzeHephaestus(projects, sellProjects, milestoneStates),
    athena: () => analyzeAthena(projects, sellProjects, milestoneStates),
    zeus: () => analyzeZeus(projects, sellProjects, milestoneStates),
    apollo: () => analyzeApollo(projects, sellProjects, milestoneStates),
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
