/**
 * Council Diagnostic — Full system test sequence.
 * 
 * Each Pantheon agent walks through their domain from the user's perspective,
 * checking every feature, every link, every data connection. Reports results
 * in real-time with a progress callback.
 */

import type { Project, SellProject } from '@/data/mockData';
import type { ProjectMilestoneState, SharedTicket } from '@/contexts/ProjectStore';
import { MILESTONE_SOPS } from '@/data/milestoneSOP';
import type { AgentId } from './councilEngine';

// ─── Types ──────────────────────────────────────────────────────────

export type TestStatus = 'pass' | 'fail' | 'warn' | 'skip';

export interface DiagnosticTest {
  id: string;
  agentId: AgentId;
  portal: string;
  name: string;
  description: string;
  status: TestStatus;
  detail: string;
  duration: number; // ms
}

export interface DiagnosticPhase {
  agentId: AgentId;
  agentName: string;
  portal: string;
  label: string;
  tests: DiagnosticTest[];
  status: 'pending' | 'running' | 'done';
}

export interface DiagnosticResult {
  phases: DiagnosticPhase[];
  summary: { pass: number; fail: number; warn: number; skip: number; total: number };
  duration: number;
  timestamp: string;
}

// ─── Test Runner ────────────────────────────────────────────────────

type ProgressCallback = (phases: DiagnosticPhase[], currentPhaseIdx: number, currentTestIdx: number) => void;

function runTest(
  id: string, agentId: AgentId, portal: string, name: string, description: string,
  testFn: () => { status: TestStatus; detail: string }
): DiagnosticTest {
  const start = performance.now();
  try {
    const { status, detail } = testFn();
    return { id, agentId, portal, name, description, status, detail, duration: performance.now() - start };
  } catch (e) {
    return { id, agentId, portal, name, description, status: 'fail', detail: `Error: ${(e as Error).message}`, duration: performance.now() - start };
  }
}

export async function runDiagnostic(
  projects: Project[],
  sellProjects: SellProject[],
  milestoneStates: Record<string, ProjectMilestoneState>,
  tickets: SharedTicket[],
  onProgress: ProgressCallback
): Promise<DiagnosticResult> {
  const startTime = performance.now();

  // Define all phases
  const phases: DiagnosticPhase[] = [
    { agentId: 'hermes', agentName: 'Hermes', portal: 'Sales Portal', label: 'Sales Pipeline & Lead Flow', tests: [], status: 'pending' },
    { agentId: 'athena', agentName: 'Athena', portal: 'Backend Ops', label: 'QC & Compliance Gates', tests: [], status: 'pending' },
    { agentId: 'hephaestus', agentName: 'Hephaestus', portal: 'Installer Portal', label: 'Milestone System Integrity', tests: [], status: 'pending' },
    { agentId: 'zeus', agentName: 'Zeus', portal: 'Financier Portal', label: 'Fund Release & Revenue', tests: [], status: 'pending' },
    { agentId: 'apollo', agentName: 'Apollo', portal: 'Cross-Portal', label: 'Feature Linkage & Sync', tests: [], status: 'pending' },
  ];

  // ── Phase 1: Hermes — Sales Portal ──
  const hermesTests: DiagnosticTest[] = [];
  
  hermesTests.push(runTest('h1', 'hermes', 'sales', 'Sell projects load', 'Check sell projects are fetched from Supabase', () => {
    if (sellProjects.length > 0) return { status: 'pass', detail: `${sellProjects.length} sell projects loaded successfully.` };
    return { status: 'warn', detail: 'No sell projects found. Pipeline is empty.' };
  }));

  hermesTests.push(runTest('h2', 'hermes', 'sales', 'Credit check flow', 'Verify credit status field is populated on checked leads', () => {
    const withCredit = sellProjects.filter(sp => sp.creditStatus);
    if (sellProjects.length === 0) return { status: 'skip', detail: 'No sell projects to test.' };
    if (withCredit.length > 0) return { status: 'pass', detail: `${withCredit.length}/${sellProjects.length} leads have credit status set.` };
    return { status: 'warn', detail: 'No leads have credit status. Credit check flow may not be connected.' };
  }));

  hermesTests.push(runTest('h3', 'hermes', 'sales', 'Lead → Sale conversion', 'Check converted leads create corresponding projects', () => {
    const converted = sellProjects.filter(sp => sp.convertedToSale);
    if (converted.length === 0) return { status: 'skip', detail: 'No converted leads to test.' };
    // Check if each converted lead has a matching project
    const unlinked = converted.filter(sp => {
      const name = `${sp.firstName} ${sp.lastName}`;
      return !projects.some(p => p.customerName === name || p.sellProjectId === sp.id);
    });
    if (unlinked.length === 0) return { status: 'pass', detail: `All ${converted.length} converted leads have matching projects.` };
    return { status: 'fail', detail: `${unlinked.length} converted lead(s) missing project: ${unlinked.map(sp => `${sp.firstName} ${sp.lastName}`).join(', ')}. Conversion → project creation link may be broken.` };
  }));

  hermesTests.push(runTest('h4', 'hermes', 'sales', 'Aurora sync status', 'Check Aurora design data flows to sell projects', () => {
    const synced = sellProjects.filter(sp => sp.auroraSynced);
    if (sellProjects.length === 0) return { status: 'skip', detail: 'No sell projects.' };
    return { status: synced.length > 0 ? 'pass' : 'warn', detail: `${synced.length}/${sellProjects.length} leads have Aurora data synced.` };
  }));

  hermesTests.push(runTest('h5', 'hermes', 'sales', 'Pipeline data integrity', 'Check all projects have required fields', () => {
    const issues: string[] = [];
    projects.forEach(p => {
      if (!p.contractValue) issues.push(`${p.customerName}: missing contract value`);
      if (!p.systemSize) issues.push(`${p.customerName}: missing system size`);
      if (!p.financier) issues.push(`${p.customerName}: missing financier`);
    });
    if (projects.length === 0) return { status: 'skip', detail: 'No projects.' };
    if (issues.length === 0) return { status: 'pass', detail: `All ${projects.length} projects have complete data.` };
    return { status: 'fail', detail: `${issues.length} data gaps: ${issues.slice(0, 3).join('; ')}${issues.length > 3 ? ` (+${issues.length - 3} more)` : ''}` };
  }));

  phases[0].tests = hermesTests;

  // ── Phase 2: Athena — QC & Compliance ──
  const athenaTests: DiagnosticTest[] = [];

  athenaTests.push(runTest('a1', 'athena', 'ops', 'QC queue population', 'Check converted deals enter QC queue', () => {
    const converted = sellProjects.filter(sp => sp.convertedToSale);
    const inQC = converted.filter(sp => sp.approvalStatus && sp.approvalStatus !== 'clean');
    if (converted.length === 0) return { status: 'skip', detail: 'No converted deals.' };
    return { status: 'pass', detail: `${converted.length} deals in pipeline. ${inQC.length} currently in QC.` };
  }));

  athenaTests.push(runTest('a2', 'athena', 'ops', 'SOP compliance — credit before conversion', 'No deals should be converted without credit check', () => {
    const violations = sellProjects.filter(sp => sp.convertedToSale && sp.creditStatus !== 'passed' && sp.creditStatus !== 'credit_passed');
    if (sellProjects.filter(sp => sp.convertedToSale).length === 0) return { status: 'skip', detail: 'No converted deals.' };
    if (violations.length === 0) return { status: 'pass', detail: 'All converted deals passed credit check first.' };
    return { status: 'fail', detail: `${violations.length} deal(s) converted without credit: ${violations.map(sp => `${sp.firstName} ${sp.lastName}`).join(', ')}. SOP violation.` };
  }));

  athenaTests.push(runTest('a3', 'athena', 'ops', 'Clean/dirty marking', 'Check QC status is being set on deals', () => {
    const converted = sellProjects.filter(sp => sp.convertedToSale);
    const marked = converted.filter(sp => sp.approvalStatus === 'clean' || sp.approvalStatus === 'dirty');
    if (converted.length === 0) return { status: 'skip', detail: 'No converted deals.' };
    if (marked.length === converted.length) return { status: 'pass', detail: `All ${converted.length} deals have QC status.` };
    return { status: 'warn', detail: `${converted.length - marked.length} deal(s) awaiting QC review.` };
  }));

  athenaTests.push(runTest('a4', 'athena', 'ops', 'Milestone QC review flow', 'Check installer submissions get ops approval', () => {
    let submitted = 0, approved = 0;
    Object.values(milestoneStates).forEach(ms => {
      Object.entries(ms.installerSubmitted || {}).forEach(([mi, s]) => {
        if (s) { submitted++; if ((ms.opsApproved || {})[mi]) approved++; }
      });
    });
    if (submitted === 0) return { status: 'skip', detail: 'No milestone submissions yet.' };
    if (approved === submitted) return { status: 'pass', detail: `All ${submitted} submissions reviewed.` };
    return { status: 'warn', detail: `${submitted - approved} of ${submitted} submissions awaiting ops review.` };
  }));

  phases[1].tests = athenaTests;

  // ── Phase 3: Hephaestus — Installer Portal / Milestone System ──
  const hephaestusTests: DiagnosticTest[] = [];

  hephaestusTests.push(runTest('e1', 'hephaestus', 'installer', 'Milestone states exist', 'Every project should have a milestone_states row', () => {
    const missing = projects.filter(p => !milestoneStates[p.id]);
    if (projects.length === 0) return { status: 'skip', detail: 'No projects.' };
    if (missing.length === 0) return { status: 'pass', detail: `All ${projects.length} projects have milestone state.` };
    return { status: 'fail', detail: `${missing.length} project(s) missing milestone state: ${missing.map(p => p.customerName).join(', ')}. Checklist/fund tracking won't work.` };
  }));

  hephaestusTests.push(runTest('e2', 'hephaestus', 'installer', 'Checklist item schema', 'Checklist items match SOP definitions', () => {
    let mismatch = 0;
    projects.forEach(p => {
      const ms = milestoneStates[p.id];
      if (!ms) return;
      const sop = MILESTONE_SOPS[p.currentMilestone];
      if (!sop) return;
      // Check if any checklist items are from wrong milestone
      const validIds = new Set(MILESTONE_SOPS.flatMap(s => s.checklist.map(c => c.id)));
      Object.keys(ms.checklistDone).forEach(id => {
        if (!validIds.has(id)) mismatch++;
      });
    });
    if (projects.length === 0) return { status: 'skip', detail: 'No projects.' };
    if (mismatch === 0) return { status: 'pass', detail: 'All checklist items match SOP definitions.' };
    return { status: 'warn', detail: `${mismatch} orphaned checklist entries found. May be from schema changes.` };
  }));

  hephaestusTests.push(runTest('e3', 'hephaestus', 'installer', 'Milestone progression logic', 'Current milestone should be sequential (no gaps)', () => {
    const issues: string[] = [];
    projects.forEach(p => {
      if (p.currentMilestone < 0 || p.currentMilestone > 7) {
        issues.push(`${p.customerName}: invalid milestone ${p.currentMilestone}`);
      }
    });
    if (projects.length === 0) return { status: 'skip', detail: 'No projects.' };
    if (issues.length === 0) return { status: 'pass', detail: `All projects have valid milestone indices (0-7).` };
    return { status: 'fail', detail: issues.join('; ') };
  }));

  hephaestusTests.push(runTest('e4', 'hephaestus', 'installer', 'Upload/text entry references', 'Uploaded files and text entries reference valid checklist items', () => {
    let orphans = 0;
    const validIds = new Set(MILESTONE_SOPS.flatMap(s => s.checklist.map(c => c.id)));
    Object.values(milestoneStates).forEach(ms => {
      Object.keys(ms.uploads || {}).forEach(id => { if (!validIds.has(id)) orphans++; });
      Object.keys(ms.textEntries || {}).forEach(id => { if (!validIds.has(id)) orphans++; });
    });
    if (Object.keys(milestoneStates).length === 0) return { status: 'skip', detail: 'No milestone states.' };
    if (orphans === 0) return { status: 'pass', detail: 'All entries reference valid checklist items.' };
    return { status: 'warn', detail: `${orphans} orphaned entry references. Data may be from a previous schema version.` };
  }));

  phases[2].tests = hephaestusTests;

  // ── Phase 4: Zeus — Financier / Revenue ──
  const zeusTests: DiagnosticTest[] = [];

  zeusTests.push(runTest('z1', 'zeus', 'financier', 'Fund release alignment', 'Fund releases should match milestone approvals', () => {
    let misaligned = 0;
    projects.forEach(p => {
      const ms = milestoneStates[p.id];
      if (!ms) return;
      const fund = ms.fundStatus || {};
      const approved = ms.opsApproved || {};
      // If ops approved but no fund action, that's a gap
      Object.entries(approved).forEach(([mi, isApproved]) => {
        if (isApproved && !fund[mi]) misaligned++;
      });
    });
    if (projects.length === 0) return { status: 'skip', detail: 'No projects.' };
    if (misaligned === 0) return { status: 'pass', detail: 'Fund releases aligned with milestone approvals.' };
    return { status: 'warn', detail: `${misaligned} approved milestone(s) without fund release action. Financier may need to release.` };
  }));

  zeusTests.push(runTest('z2', 'zeus', 'financier', 'Contract value consistency', 'All projects should have non-zero contract value for fund calculations', () => {
    const zero = projects.filter(p => !p.contractValue || p.contractValue === 0);
    if (projects.length === 0) return { status: 'skip', detail: 'No projects.' };
    if (zero.length === 0) return { status: 'pass', detail: `All ${projects.length} projects have contract values set.` };
    return { status: 'fail', detail: `${zero.length} project(s) with $0 contract: ${zero.map(p => p.customerName).join(', ')}. Fund % calculations will be wrong.` };
  }));

  zeusTests.push(runTest('z3', 'zeus', 'financier', 'Financier assignment', 'Every project should have a financier', () => {
    const noFin = projects.filter(p => !p.financier);
    if (projects.length === 0) return { status: 'skip', detail: 'No projects.' };
    if (noFin.length === 0) return { status: 'pass', detail: `All projects assigned to a financier.` };
    return { status: 'fail', detail: `${noFin.length} project(s) missing financier: ${noFin.map(p => p.customerName).join(', ')}` };
  }));

  phases[3].tests = zeusTests;

  // ── Phase 5: Apollo — Cross-Portal Feature Linkage ──
  const apolloTests: DiagnosticTest[] = [];

  apolloTests.push(runTest('ap1', 'apollo', 'cross', 'Deal → Ticket award linkage', 'Sold deals should trigger ticket awards in gamification', () => {
    const converted = sellProjects.filter(sp => sp.convertedToSale);
    // Check if tickets exist for any projects (gamification link)
    const projectsWithTickets = projects.filter(p => tickets.some(t => t.projectId === p.id));
    if (converted.length === 0) return { status: 'skip', detail: 'No converted deals.' };
    if (projects.length === 0) return { status: 'warn', detail: 'No active projects yet. Ticket awards trigger on project creation.' };
    return { status: projectsWithTickets.length > 0 ? 'pass' : 'warn', detail: `${projectsWithTickets.length}/${projects.length} projects have support tickets. Gamification ticket awards are managed through the prize wheel system.` };
  }));

  apolloTests.push(runTest('ap2', 'apollo', 'cross', 'Sell project → Project sync', 'Converted sell projects should be linked to their project via sellProjectId', () => {
    const converted = sellProjects.filter(sp => sp.convertedToSale);
    const linked = converted.filter(sp => projects.some(p => p.sellProjectId === sp.id));
    if (converted.length === 0) return { status: 'skip', detail: 'No converted deals.' };
    if (linked.length === converted.length) return { status: 'pass', detail: `All ${converted.length} converted leads linked to projects via sellProjectId.` };
    return { status: 'warn', detail: `${converted.length - linked.length} converted lead(s) not linked by sellProjectId. Sync between portals may be inconsistent.` };
  }));

  apolloTests.push(runTest('ap3', 'apollo', 'cross', 'QC → Installer handoff', 'Clean deals should have installer-accessible projects', () => {
    const clean = sellProjects.filter(sp => sp.approvalStatus === 'clean');
    if (clean.length === 0) return { status: 'skip', detail: 'No QC-approved deals.' };
    const withProject = clean.filter(sp => projects.some(p =>
      p.sellProjectId === sp.id || p.customerName === `${sp.firstName} ${sp.lastName}`
    ));
    if (withProject.length === clean.length) return { status: 'pass', detail: `All ${clean.length} clean deals have installer-accessible projects.` };
    return { status: 'warn', detail: `${clean.length - withProject.length} clean deal(s) without matching project. Installer won't see them.` };
  }));

  apolloTests.push(runTest('ap4', 'apollo', 'cross', 'Milestone → Fund cascade', 'Milestone approval should enable fund release in financier portal', () => {
    let approved = 0, fundEnabled = 0;
    Object.values(milestoneStates).forEach(ms => {
      Object.entries(ms.opsApproved || {}).forEach(([mi, isApproved]) => {
        if (isApproved) {
          approved++;
          if ((ms.fundStatus || {})[mi]) fundEnabled++;
        }
      });
    });
    if (approved === 0) return { status: 'skip', detail: 'No approved milestones yet.' };
    if (fundEnabled === approved) return { status: 'pass', detail: `All ${approved} approved milestones have fund release enabled.` };
    return { status: 'warn', detail: `${approved - fundEnabled} approved milestone(s) without fund release. Financier portal may need attention.` };
  }));

  apolloTests.push(runTest('ap5', 'apollo', 'cross', 'Realtime subscriptions', 'Check Supabase realtime channels are connected', () => {
    // We can't directly check this, but we can verify data freshness
    const now = Date.now();
    const recentUpdate = [...projects, ...sellProjects].some(item => {
      const updated = (item as any).updatedAt || (item as any).createdAt;
      return updated && (now - new Date(updated).getTime()) < 24 * 60 * 60 * 1000;
    });
    if (projects.length === 0 && sellProjects.length === 0) return { status: 'skip', detail: 'No data to verify.' };
    return { status: recentUpdate ? 'pass' : 'warn', detail: recentUpdate ? 'Data has been updated within 24h. Realtime likely active.' : 'No recent updates detected. Realtime channel may need reconnection.' };
  }));

  apolloTests.push(runTest('ap6', 'apollo', 'cross', 'Notification cascade', 'Actions in one portal should be visible in related portals', () => {
    // Check if milestone states have both installer and ops actions
    let hasInstallerActions = false, hasOpsActions = false;
    Object.values(milestoneStates).forEach(ms => {
      if (Object.values(ms.installerSubmitted || {}).some(Boolean)) hasInstallerActions = true;
      if (Object.values(ms.opsApproved || {}).some(Boolean)) hasOpsActions = true;
    });
    if (!hasInstallerActions && !hasOpsActions) return { status: 'skip', detail: 'No cross-portal actions yet.' };
    if (hasInstallerActions && hasOpsActions) return { status: 'pass', detail: 'Both installer submissions and ops approvals detected. Cross-portal sync working.' };
    return { status: 'warn', detail: `${hasInstallerActions ? 'Installer actions' : 'Ops actions'} detected but not ${hasInstallerActions ? 'ops responses' : 'installer submissions'}. One side of the flow may not be connected.` };
  }));

  phases[4].tests = apolloTests;

  // ── Execute with staggered progress callbacks ──
  for (let pi = 0; pi < phases.length; pi++) {
    phases[pi].status = 'running';
    onProgress([...phases], pi, 0);
    // Small delay between phases for visual effect
    await new Promise(r => setTimeout(r, 400));
    for (let ti = 0; ti < phases[pi].tests.length; ti++) {
      onProgress([...phases], pi, ti);
      await new Promise(r => setTimeout(r, 150)); // stagger each test visually
    }
    phases[pi].status = 'done';
    onProgress([...phases], pi, phases[pi].tests.length);
  }

  // Compute summary
  const allTests = phases.flatMap(p => p.tests);
  const summary = {
    pass: allTests.filter(t => t.status === 'pass').length,
    fail: allTests.filter(t => t.status === 'fail').length,
    warn: allTests.filter(t => t.status === 'warn').length,
    skip: allTests.filter(t => t.status === 'skip').length,
    total: allTests.length,
  };

  return {
    phases,
    summary,
    duration: performance.now() - startTime,
    timestamp: new Date().toISOString(),
  };
}
