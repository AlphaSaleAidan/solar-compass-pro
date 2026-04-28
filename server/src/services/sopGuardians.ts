/**
 * SOP Guardian Agents — 7 autonomous agents that protect pipeline integrity.
 *
 * Each agent owns one process variable and produces violations
 * when data violates the Alpha Sale Pro SOP rules.
 *
 * Agents:
 *   1. lead-gatekeeper    — Validates leads before conversion
 *   2. qc-inspector       — Enforces clean/dirty gate rules
 *   3. milestone-sequencer — Guards M1→M7 progression order
 *   4. fund-controller     — Validates fund release conditions
 *   5. doc-auditor         — Checks required uploads per milestone
 *   6. data-integrity      — Schema consistency & orphan detection
 *   7. notification-enforcer — SLA timing & overdue milestones
 */

import { supabase } from '../config/supabase';

// ─── Types ────────────────────────────────────────────────

export interface Violation {
  project_id: string;
  agent_id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  rule_code: string;
  title: string;
  description: string;
  context: Record<string, unknown>;
}

export interface GuardianResult {
  agentId: string;
  agentName: string;
  violations: Violation[];
  durationMs: number;
}

export interface SwarmResult {
  agents: GuardianResult[];
  totalViolations: number;
  criticalCount: number;
  highCount: number;
  durationMs: number;
}

// Fund release schedule per milestone (1-indexed)
const FUND_SCHEDULE: Record<number, number> = {
  1: 15, 2: 20, 3: 15, 4: 20, 5: 20, 6: 10, 7: 5,
};

// Required uploads per milestone
const REQUIRED_UPLOADS: Record<number, string[]> = {
  1: ['m1-sow-confirmed'],
  2: ['m2-permit-proof', 'm2-equipment-invoice'],
  3: [],
  4: ['m4-install-photos'],
  5: ['m5-inspection-proof', 'm5-interconnection'],
  6: ['m6-pto-letter'],
  7: [],
};

// ─── Agent 1: Lead Gatekeeper ────────────────────────────

async function runLeadGatekeeper(): Promise<GuardianResult> {
  const start = performance.now();
  const violations: Violation[] = [];

  const { data: leads } = await supabase
    .from('sell_projects')
    .select('*')
    .or('converted_to_sale.eq.true,approval_status.eq.pending');

  if (leads) {
    for (const lead of leads) {
      const id = lead.id;
      const name = `${lead.first_name || ''} ${lead.last_name || ''}`.trim();

      // Converted without credit check
      if (lead.converted_to_sale && lead.credit_status !== 'credit_passed') {
        violations.push({
          project_id: id, agent_id: 'lead-gatekeeper', severity: 'critical',
          rule_code: 'LG-001', title: 'Conversion without credit check',
          description: `${name} was converted to sale without passing credit check (status: ${lead.credit_status})`,
          context: { leadId: id, creditStatus: lead.credit_status },
        });
      }

      // Converted without Aurora sync
      if (lead.converted_to_sale && !lead.aurora_synced) {
        violations.push({
          project_id: id, agent_id: 'lead-gatekeeper', severity: 'high',
          rule_code: 'LG-002', title: 'Conversion without Aurora design',
          description: `${name} converted without Aurora solar design sync`,
          context: { leadId: id },
        });
      }

      // Submitted for QC without welcome call
      if (lead.submitted_for_approval && !lead.welcome_call_complete) {
        violations.push({
          project_id: id, agent_id: 'lead-gatekeeper', severity: 'high',
          rule_code: 'LG-003', title: 'QC submission without welcome call',
          description: `${name} submitted for QC but welcome call not completed`,
          context: { leadId: id },
        });
      }

      // Submitted without site survey
      if (lead.submitted_for_approval && !lead.site_survey_complete) {
        violations.push({
          project_id: id, agent_id: 'lead-gatekeeper', severity: 'high',
          rule_code: 'LG-004', title: 'QC submission without site survey',
          description: `${name} submitted for QC but site survey not complete`,
          context: { leadId: id },
        });
      }

      // Missing required fields
      if (lead.converted_to_sale && (!lead.email || !lead.phone || !lead.address)) {
        violations.push({
          project_id: id, agent_id: 'lead-gatekeeper', severity: 'medium',
          rule_code: 'LG-005', title: 'Incomplete lead data',
          description: `${name} has missing contact fields (email/phone/address)`,
          context: { leadId: id, email: !!lead.email, phone: !!lead.phone, address: !!lead.address },
        });
      }
    }
  }

  return { agentId: 'lead-gatekeeper', agentName: 'Lead Gatekeeper', violations, durationMs: Math.round(performance.now() - start) };
}

// ─── Agent 2: QC Inspector ───────────────────────────────

async function runQCInspector(): Promise<GuardianResult> {
  const start = performance.now();
  const violations: Violation[] = [];

  const { data: leads } = await supabase
    .from('sell_projects')
    .select('*')
    .eq('submitted_for_approval', true);

  if (leads) {
    for (const lead of leads) {
      const id = lead.id;
      const name = `${lead.first_name || ''} ${lead.last_name || ''}`.trim();

      // Pending QC for too long (>48 hours)
      if (lead.approval_status === 'pending' && lead.submitted_at) {
        const hours = (Date.now() - new Date(lead.submitted_at).getTime()) / (1000 * 60 * 60);
        if (hours > 48) {
          violations.push({
            project_id: id, agent_id: 'qc-inspector', severity: 'high',
            rule_code: 'QC-001', title: 'QC review overdue',
            description: `${name} has been pending QC review for ${Math.round(hours)}h (SLA: 48h)`,
            context: { leadId: id, hoursWaiting: Math.round(hours) },
          });
        }
      }

      // Dirty with no notes
      if (lead.approval_status === 'dirty' && !lead.approval_notes) {
        violations.push({
          project_id: id, agent_id: 'qc-inspector', severity: 'medium',
          rule_code: 'QC-002', title: 'Dirty flag without notes',
          description: `${name} marked dirty but no rejection notes provided`,
          context: { leadId: id },
        });
      }

      // Clean without all documents signed
      if (lead.approval_status === 'clean' && !lead.documents_signed) {
        violations.push({
          project_id: id, agent_id: 'qc-inspector', severity: 'critical',
          rule_code: 'QC-003', title: 'QC clean without signed documents',
          description: `${name} passed QC but documents are not fully signed`,
          context: { leadId: id },
        });
      }
    }
  }

  return { agentId: 'qc-inspector', agentName: 'QC Inspector', violations, durationMs: Math.round(performance.now() - start) };
}

// ─── Agent 3: Milestone Sequencer ────────────────────────

async function runMilestoneSequencer(): Promise<GuardianResult> {
  const start = performance.now();
  const violations: Violation[] = [];

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .in('status', ['active', 'delayed']);

  const { data: milestones } = await supabase
    .from('milestone_states')
    .select('*');

  const msMap = new Map<string, Record<string, unknown>>();
  if (milestones) {
    for (const m of milestones) msMap.set(m.project_id, m);
  }

  if (projects) {
    for (const proj of projects) {
      const id = proj.id;
      const name = proj.customer_name || id;
      const current = proj.current_milestone || 1;
      const ms = msMap.get(id);

      // Milestone skipped — check previous milestones have ops approval
      if (ms && current > 1) {
        for (let m = 1; m < current; m++) {
          const opsApproved = (ms.ops_approved as Record<string, boolean>)?.[String(m)];
          if (!opsApproved) {
            violations.push({
              project_id: id, agent_id: 'milestone-sequencer', severity: 'critical',
              rule_code: 'MS-001', title: `M${m} skipped without approval`,
              description: `${name} is on M${current} but M${m} was never approved by Ops`,
              context: { projectId: id, currentMilestone: current, skippedMilestone: m },
            });
          }
        }
      }

      // Installer submitted but ops hasn't reviewed in >72h
      if (ms) {
        const submitted = (ms.installer_submitted as Record<string, boolean>)?.[String(current)];
        const approved = (ms.ops_approved as Record<string, boolean>)?.[String(current)];
        if (submitted && !approved && proj.updated_at) {
          const hours = (Date.now() - new Date(proj.updated_at).getTime()) / (1000 * 60 * 60);
          if (hours > 72) {
            violations.push({
              project_id: id, agent_id: 'milestone-sequencer', severity: 'high',
              rule_code: 'MS-002', title: `M${current} review overdue`,
              description: `${name} M${current} submitted by installer ${Math.round(hours)}h ago, no Ops review`,
              context: { projectId: id, milestone: current, hoursWaiting: Math.round(hours) },
            });
          }
        }
      }

      // Project delayed >30 days on same milestone
      if (proj.status === 'delayed' || proj.status === 'active') {
        if (proj.updated_at) {
          const days = (Date.now() - new Date(proj.updated_at).getTime()) / (1000 * 60 * 60 * 24);
          if (days > 30) {
            violations.push({
              project_id: id, agent_id: 'milestone-sequencer', severity: 'medium',
              rule_code: 'MS-003', title: `Stalled on M${current}`,
              description: `${name} hasn't progressed from M${current} in ${Math.round(days)} days`,
              context: { projectId: id, milestone: current, daysStalled: Math.round(days) },
            });
          }
        }
      }
    }
  }

  return { agentId: 'milestone-sequencer', agentName: 'Milestone Sequencer', violations, durationMs: Math.round(performance.now() - start) };
}

// ─── Agent 4: Fund Controller ────────────────────────────

async function runFundController(): Promise<GuardianResult> {
  const start = performance.now();
  const violations: Violation[] = [];

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .in('status', ['active', 'delayed', 'completed']);

  const { data: milestones } = await supabase
    .from('milestone_states')
    .select('*');

  const msMap = new Map<string, Record<string, unknown>>();
  if (milestones) {
    for (const m of milestones) msMap.set(m.project_id, m);
  }

  if (projects) {
    for (const proj of projects) {
      const id = proj.id;
      const name = proj.customer_name || id;
      const ms = msMap.get(id);
      if (!ms) continue;

      const fundStatus = (ms.fund_status as Record<string, string>) || {};
      const opsApproved = (ms.ops_approved as Record<string, boolean>) || {};

      for (let m = 1; m <= 7; m++) {
        const status = fundStatus[String(m)];
        const approved = opsApproved[String(m)];

        // Fund released without ops approval
        if ((status === 'released' || status === 'approved') && !approved) {
          violations.push({
            project_id: id, agent_id: 'fund-controller', severity: 'critical',
            rule_code: 'FC-001', title: `M${m} fund released without approval`,
            description: `${name} M${m} funds marked as ${status} but Ops never approved this milestone`,
            context: { projectId: id, milestone: m, fundStatus: status, expectedPercent: FUND_SCHEDULE[m] },
          });
        }

        // Dual approval required for large releases (>$10K threshold)
        const contractValue = proj.contract_value || 0;
        const releaseAmount = contractValue * (FUND_SCHEDULE[m] || 0) / 100;
        if (status === 'released' && releaseAmount > 10000) {
          const dual = (ms.dual_approval as Record<string, Record<string, unknown>>)?.[String(m)];
          if (dual?.required && (!dual?.firstApprover || !dual?.secondApprover)) {
            violations.push({
              project_id: id, agent_id: 'fund-controller', severity: 'critical',
              rule_code: 'FC-002', title: `M${m} missing dual approval`,
              description: `${name} M${m} release is $${releaseAmount.toLocaleString()} (>$10K) but lacks dual approval`,
              context: { projectId: id, milestone: m, amount: releaseAmount },
            });
          }
        }
      }

      // Total fund percentage sanity check
      const totalReleased = Object.entries(fundStatus)
        .filter(([, s]) => s === 'released')
        .reduce((sum, [m]) => sum + (FUND_SCHEDULE[parseInt(m)] || 0), 0);
      if (totalReleased > 100) {
        violations.push({
          project_id: id, agent_id: 'fund-controller', severity: 'critical',
          rule_code: 'FC-003', title: 'Fund overrelease',
          description: `${name} total released funds = ${totalReleased}% (exceeds 100%)`,
          context: { projectId: id, totalPercent: totalReleased },
        });
      }
    }
  }

  return { agentId: 'fund-controller', agentName: 'Fund Controller', violations, durationMs: Math.round(performance.now() - start) };
}

// ─── Agent 5: Doc Auditor ────────────────────────────────

async function runDocAuditor(): Promise<GuardianResult> {
  const start = performance.now();
  const violations: Violation[] = [];

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .in('status', ['active', 'delayed']);

  const { data: milestones } = await supabase
    .from('milestone_states')
    .select('*');

  const msMap = new Map<string, Record<string, unknown>>();
  if (milestones) {
    for (const m of milestones) msMap.set(m.project_id, m);
  }

  if (projects) {
    for (const proj of projects) {
      const id = proj.id;
      const name = proj.customer_name || id;
      const current = proj.current_milestone || 1;
      const ms = msMap.get(id);
      if (!ms) continue;

      const uploads = (ms.uploads as Record<string, string[]>) || {};
      const opsApproved = (ms.ops_approved as Record<string, boolean>) || {};

      // Check all completed milestones have required docs
      for (let m = 1; m <= Math.min(current, 7); m++) {
        const required = REQUIRED_UPLOADS[m] || [];
        if (required.length === 0) continue;

        const isApproved = opsApproved[String(m)];
        for (const docId of required) {
          const files = uploads[docId] || [];
          if (files.length === 0) {
            violations.push({
              project_id: id, agent_id: 'doc-auditor',
              severity: isApproved ? 'critical' : 'medium',
              rule_code: 'DA-001', title: `M${m} missing required upload`,
              description: `${name} M${m}: required document "${docId}" not uploaded${isApproved ? ' (milestone already approved!)' : ''}`,
              context: { projectId: id, milestone: m, missingDoc: docId, milestoneApproved: isApproved },
            });
          }
        }
      }
    }
  }

  return { agentId: 'doc-auditor', agentName: 'Doc Auditor', violations, durationMs: Math.round(performance.now() - start) };
}

// ─── Agent 6: Data Integrity Monitor ─────────────────────

async function runDataIntegrity(): Promise<GuardianResult> {
  const start = performance.now();
  const violations: Violation[] = [];

  // Projects without milestone state records
  const { data: projects } = await supabase
    .from('projects')
    .select('id, customer_name, status')
    .in('status', ['active', 'delayed']);

  const { data: milestones } = await supabase
    .from('milestone_states')
    .select('project_id');

  const msIds = new Set((milestones || []).map(m => m.project_id));

  if (projects) {
    for (const proj of projects) {
      if (!msIds.has(proj.id)) {
        violations.push({
          project_id: proj.id, agent_id: 'data-integrity', severity: 'high',
          rule_code: 'DI-001', title: 'Missing milestone state',
          description: `${proj.customer_name || proj.id} has no milestone_states record`,
          context: { projectId: proj.id },
        });
      }
    }
  }

  // Active projects with invalid milestone numbers
  if (projects) {
    for (const proj of projects) {
      const current = (proj as Record<string, unknown>).current_milestone as number | undefined;
      if (current !== undefined && (current < 1 || current > 7)) {
        violations.push({
          project_id: proj.id, agent_id: 'data-integrity', severity: 'critical',
          rule_code: 'DI-002', title: 'Invalid milestone number',
          description: `${proj.customer_name || proj.id} has current_milestone=${current} (must be 1-7)`,
          context: { projectId: proj.id, currentMilestone: current },
        });
      }
    }
  }

  // Sell projects with conversion flag but no matching project
  const { data: sells } = await supabase
    .from('sell_projects')
    .select('id, first_name, last_name')
    .eq('converted_to_sale', true);

  const projectIds = new Set((projects || []).map(p => p.id));

  if (sells) {
    for (const sell of sells) {
      if (!projectIds.has(sell.id)) {
        violations.push({
          project_id: sell.id, agent_id: 'data-integrity', severity: 'medium',
          rule_code: 'DI-003', title: 'Orphaned conversion',
          description: `${sell.first_name} ${sell.last_name} marked converted but no matching project found`,
          context: { sellId: sell.id },
        });
      }
    }
  }

  return { agentId: 'data-integrity', agentName: 'Data Integrity Monitor', violations, durationMs: Math.round(performance.now() - start) };
}

// ─── Agent 7: Notification Enforcer ──────────────────────

async function runNotificationEnforcer(): Promise<GuardianResult> {
  const start = performance.now();
  const violations: Violation[] = [];

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .in('status', ['active', 'delayed']);

  if (projects) {
    for (const proj of projects) {
      const id = proj.id;
      const name = proj.customer_name || id;

      // Delayed project with no recent activity
      if (proj.status === 'delayed' && proj.updated_at) {
        const days = (Date.now() - new Date(proj.updated_at).getTime()) / (1000 * 60 * 60 * 24);
        if (days > 14) {
          violations.push({
            project_id: id, agent_id: 'notification-enforcer', severity: 'high',
            rule_code: 'NE-001', title: 'Delayed project unattended',
            description: `${name} has been delayed for ${Math.round(days)} days with no activity`,
            context: { projectId: id, daysInactive: Math.round(days) },
          });
        }
      }

      // M7 speed bonus window closing — permit date set but approaching 35-day limit
      if (proj.current_milestone && proj.current_milestone >= 5) {
        const permitDate = (proj as Record<string, unknown>).permit_approval_date as string | undefined;
        if (permitDate) {
          const days = (Date.now() - new Date(permitDate).getTime()) / (1000 * 60 * 60 * 24);
          if (days >= 28 && days <= 35) {
            violations.push({
              project_id: id, agent_id: 'notification-enforcer', severity: 'medium',
              rule_code: 'NE-002', title: 'Speed bonus window closing',
              description: `${name} has ${Math.max(0, 35 - Math.round(days))} days left for M7 speed bonus (35-day limit)`,
              context: { projectId: id, daysSincePermit: Math.round(days), daysRemaining: Math.max(0, 35 - Math.round(days)) },
            });
          }
        }
      }

      // Homeowner hasn't been contacted recently (SOP requires regular contact)
      const lastContact = (proj as Record<string, unknown>).last_ho_contact as string | undefined;
      if (lastContact) {
        const days = (Date.now() - new Date(lastContact).getTime()) / (1000 * 60 * 60 * 24);
        if (days > 21) {
          violations.push({
            project_id: id, agent_id: 'notification-enforcer', severity: 'low',
            rule_code: 'NE-003', title: 'Homeowner contact overdue',
            description: `${name} last contacted ${Math.round(days)} days ago (SOP: every 21 days)`,
            context: { projectId: id, daysSinceContact: Math.round(days) },
          });
        }
      }
    }
  }

  return { agentId: 'notification-enforcer', agentName: 'Notification Enforcer', violations, durationMs: Math.round(performance.now() - start) };
}

// ─── Swarm Orchestrator ──────────────────────────────────

const ALL_AGENTS = [
  runLeadGatekeeper,
  runQCInspector,
  runMilestoneSequencer,
  runFundController,
  runDocAuditor,
  runDataIntegrity,
  runNotificationEnforcer,
];

const AGENT_META: Record<string, { name: string; icon: string; description: string }> = {
  'lead-gatekeeper':       { name: 'Lead Gatekeeper',       icon: '🚪', description: 'Validates leads before conversion' },
  'qc-inspector':          { name: 'QC Inspector',          icon: '🔬', description: 'Enforces clean/dirty gate rules' },
  'milestone-sequencer':   { name: 'Milestone Sequencer',   icon: '📋', description: 'Guards M1→M7 progression order' },
  'fund-controller':       { name: 'Fund Controller',       icon: '💰', description: 'Validates fund release conditions' },
  'doc-auditor':           { name: 'Doc Auditor',           icon: '📎', description: 'Checks required uploads per milestone' },
  'data-integrity':        { name: 'Data Integrity',        icon: '🔗', description: 'Schema consistency & orphan detection' },
  'notification-enforcer': { name: 'Notification Enforcer', icon: '🔔', description: 'SLA timing & overdue milestones' },
};

export { AGENT_META };

/**
 * Run all 7 guardian agents in parallel and return combined results.
 */
export async function runGuardianSwarm(triggeredBy?: string): Promise<SwarmResult> {
  const start = performance.now();

  const results = await Promise.all(ALL_AGENTS.map(fn => fn()));

  const allViolations = results.flatMap(r => r.violations);
  const criticalCount = allViolations.filter(v => v.severity === 'critical').length;
  const highCount = allViolations.filter(v => v.severity === 'high').length;
  const durationMs = Math.round(performance.now() - start);

  // Persist violations to database
  if (allViolations.length > 0) {
    await supabase.from('sop_violations').insert(allViolations);
  }

  // Log the run
  await supabase.from('sop_guardian_runs').insert({
    triggered_by: triggeredBy || null,
    agents_run: results.map(r => r.agentId),
    violations_found: allViolations.length,
    duration_ms: durationMs,
  });

  return {
    agents: results,
    totalViolations: allViolations.length,
    criticalCount,
    highCount,
    durationMs,
  };
}

/**
 * Run a single guardian agent by ID.
 */
export async function runSingleGuardian(agentId: string): Promise<GuardianResult> {
  const agentMap: Record<string, () => Promise<GuardianResult>> = {
    'lead-gatekeeper': runLeadGatekeeper,
    'qc-inspector': runQCInspector,
    'milestone-sequencer': runMilestoneSequencer,
    'fund-controller': runFundController,
    'doc-auditor': runDocAuditor,
    'data-integrity': runDataIntegrity,
    'notification-enforcer': runNotificationEnforcer,
  };

  const fn = agentMap[agentId];
  if (!fn) throw new Error(`Unknown guardian agent: ${agentId}`);
  return fn();
}
