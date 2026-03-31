/**
 * SOP Workflow Engine — Alpha Sale Pro
 * 
 * Enforces the sequential deal intake process across all 4 portals:
 * Sales Rep → Backend Ops QC → Pipeline (Installer + Financier)
 * 
 * Status Flow:
 * new → credit_check → aurora_synced → converted → documents_sent
 * → welcome_call_done → site_survey_done → submitted_for_approval
 * → approved_clean | marked_dirty → in_pipeline → completed
 */

export type ProjectStatus =
  | 'new'
  | 'credit_check'
  | 'aurora_synced'
  | 'converted'
  | 'documents_sent'
  | 'welcome_call_done'
  | 'site_survey_done'
  | 'submitted_for_approval'
  | 'approved_clean'
  | 'marked_dirty'
  | 'in_pipeline'
  | 'completed';

export type MilestoneNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7;

// Ordered status flow — each status can only advance to the next
const STATUS_ORDER: ProjectStatus[] = [
  'new',
  'credit_check',
  'aurora_synced',
  'converted',
  'documents_sent',
  'welcome_call_done',
  'site_survey_done',
  'submitted_for_approval',
  'approved_clean',
  'in_pipeline',
  'completed',
];

// Milestone fund release percentages (of system price)
export const MILESTONE_FUND_PERCENTS: Record<MilestoneNumber, number> = {
  1: 15, // M1: SOW Confirmed
  2: 20, // M2: Permit + Materials
  3: 15, // M3: Install Scheduled
  4: 20, // M4: Install Complete
  5: 20, // M5: Utility Inspection
  6: 10, // M6: PTO Granted
  7: 5,  // M7: Speed Bonus
};

export const MILESTONE_NAMES: Record<MilestoneNumber, string> = {
  1: 'SOW Confirmed',
  2: 'Permit + Materials Ordered',
  3: 'Install Scheduled',
  4: 'Install Complete',
  5: 'Utility Inspection Passed',
  6: 'PTO Granted',
  7: 'Speed Bonus (35-Day PTO)',
};

// Welcome Call question definitions from SOP
export interface WelcomeCallQuestion {
  id: number;
  text: string;
  type: 'yesno' | 'multichoice' | 'text';
  correctAnswer?: string;
  flag?: 'q7_wrong' | 'q9_yes' | 'q10_offset';
  dynamicField?: 'monthly_payment' | 'financier' | 'annual_production';
}

export const WELCOME_CALL_QUESTIONS: WelcomeCallQuestion[] = [
  { id: 1, text: 'Do you understand that you are paying $0 for your upfront cost today?', type: 'yesno' },
  { id: 2, text: 'Do you understand that your initial monthly payment is {monthly_payment}?', type: 'yesno', dynamicField: 'monthly_payment' },
  { id: 3, text: 'Do you understand that your solar system is fully warrantied by {financier} for the duration of the agreement?', type: 'yesno', dynamicField: 'financier' },
  { id: 4, text: 'Did you personally sign the TPO agreement and all associated documents?', type: 'yesno' },
  { id: 5, text: 'Is there any significant or pre-existing damage to your roof that you are aware of?', type: 'yesno' },
  { id: 6, text: 'Do you understand that this agreement is for a term of 25 years?', type: 'yesno' },
  { id: 7, text: 'Do you understand that your agreement rate will never increase more than the following annually? (A) 2.99% (B) 3.99% (C) 5.99%', type: 'multichoice', correctAnswer: 'A', flag: 'q7_wrong' },
  { id: 8, text: 'Do you understand that your solar agreement is fully transferable to a future buyer of your home?', type: 'yesno' },
  { id: 9, text: 'Were any promises made to you that are not reflected in your signed agreement?', type: 'yesno', flag: 'q9_yes' },
  { id: 10, text: 'Our records show your system is projected to produce {annual_production} kWh annually. Please enter your approximate annual electricity usage below.', type: 'text', dynamicField: 'annual_production', flag: 'q10_offset' },
];

// Site survey required sections from SOP
export const SITE_SURVEY_SECTIONS = [
  { id: 'rafters', label: 'Rafters', minPhotos: 2, required: true, description: 'Rafter spacing, material, and condition' },
  { id: 'shingles', label: 'Shingles', minPhotos: 2, required: true, description: 'Roof shingle condition, age, damage' },
  { id: 'drone', label: 'Drone Shots', minPhotos: 1, required: true, description: 'Aerial view of full roofline' },
  { id: 'main_panel', label: 'Main Panel', minPhotos: 2, required: true, description: 'Breaker layout + amperage rating' },
  { id: 'sub_panel', label: 'Sub-Panel', minPhotos: 0, required: false, description: 'If present or planned as adder' },
];

// Backend Ops QC checklist from SOP 2.1
export const QC_CHECKLIST_ITEMS = [
  { id: 'data_accuracy', label: 'Data Accuracy', description: 'Homeowner name, address, phone, email, financier match Aurora records' },
  { id: 'offset_verification', label: 'Offset Verification', description: 'System production ≥80% of annual usage' },
  { id: 'site_survey_photos', label: 'Site Survey Photos', description: 'All required sections present, no significant damage' },
  { id: 'system_design', label: 'System Design Confirmation', description: 'Panel count, system size, battery, adders match sold terms' },
  { id: 'document_completeness', label: 'Document Completeness', description: 'All ASP TPO documents fully signed' },
  { id: 'welcome_call', label: 'Welcome Call Recording', description: 'All 10 questions valid, Q9=No, Q7=A (2.99%)' },
  { id: 'no_flags', label: 'No Open Flags', description: 'No active flags from Welcome Call' },
];

// ------- SOP VALIDATION FUNCTIONS -------

export interface ProjectData {
  status: ProjectStatus;
  aurora_synced_at?: string | null;
  aurora_data?: Record<string, unknown> | null;
  documents_sent?: boolean | null;
  welcome_call_completed?: boolean | null;
  welcome_call_data?: Record<string, unknown> | null;
  site_survey_completed?: boolean | null;
  site_survey_data?: Record<string, unknown> | null;
  submitted_for_approval?: boolean | null;
  approval_status?: string | null;
  system_size?: number | null;
  annual_production?: number | null;
  current_milestone?: number | null;
}

/**
 * Returns list of available actions for a project given its current state.
 * Enforces sequential SOP — can only perform the next action in sequence.
 */
export function getAvailableActions(project: ProjectData): string[] {
  const actions: string[] = [];
  const s = project.status;

  switch (s) {
    case 'new':
    case 'credit_check':
      actions.push('sync_aurora');
      break;
    case 'aurora_synced':
      actions.push('convert_to_sale');
      break;
    case 'converted':
      actions.push('send_documents');
      break;
    case 'documents_sent':
      actions.push('start_welcome_call');
      break;
    case 'welcome_call_done':
      actions.push('start_site_survey');
      break;
    case 'site_survey_done':
      actions.push('submit_for_approval');
      break;
    case 'submitted_for_approval':
      actions.push('mark_clean', 'mark_dirty');
      break;
    case 'marked_dirty':
      // Sales rep can fix and resubmit
      actions.push('resubmit_for_approval');
      break;
    case 'approved_clean':
      actions.push('add_to_pipeline');
      break;
    case 'in_pipeline':
      // Milestone actions available
      if (project.current_milestone != null && project.current_milestone < 7) {
        actions.push('advance_milestone');
      }
      break;
  }

  return actions;
}

/**
 * Validates a status transition is legal per the SOP.
 */
export function canTransition(from: ProjectStatus, to: ProjectStatus): boolean {
  // Special case: dirty can go back to submitted
  if (from === 'marked_dirty' && to === 'submitted_for_approval') return true;

  const fromIdx = STATUS_ORDER.indexOf(from);
  const toIdx = STATUS_ORDER.indexOf(to);

  // Must be exactly one step forward (or marked_dirty which is a branch)
  if (from === 'submitted_for_approval' && to === 'marked_dirty') return true;
  if (from === 'submitted_for_approval' && to === 'approved_clean') return true;

  return toIdx === fromIdx + 1;
}

/**
 * Determines the next status for a given action.
 */
export function getNextStatus(currentStatus: ProjectStatus, action: string): ProjectStatus | null {
  const transitions: Record<string, Record<string, ProjectStatus>> = {
    sync_aurora: { new: 'aurora_synced', credit_check: 'aurora_synced' },
    convert_to_sale: { aurora_synced: 'converted' },
    send_documents: { converted: 'documents_sent' },
    start_welcome_call: { documents_sent: 'documents_sent' }, // stays until complete
    complete_welcome_call: { documents_sent: 'welcome_call_done' },
    start_site_survey: { welcome_call_done: 'welcome_call_done' }, // stays until complete
    complete_site_survey: { welcome_call_done: 'site_survey_done' },
    submit_for_approval: { site_survey_done: 'submitted_for_approval' },
    mark_clean: { submitted_for_approval: 'approved_clean' },
    mark_dirty: { submitted_for_approval: 'marked_dirty' },
    resubmit_for_approval: { marked_dirty: 'submitted_for_approval' },
    add_to_pipeline: { approved_clean: 'in_pipeline' },
  };

  return transitions[action]?.[currentStatus] || null;
}

/**
 * Validates welcome call answers per SOP.
 * Returns flags for Backend Ops review.
 */
export function validateWelcomeCall(answers: { questionId: number; answer: string }[]): {
  valid: boolean;
  flags: string[];
} {
  const flags: string[] = [];

  const q7 = answers.find(a => a.questionId === 7);
  if (q7 && q7.answer !== 'A') {
    flags.push('Q7: Incorrect escalation rate answer (expected A: 2.99%)');
  }

  const q9 = answers.find(a => a.questionId === 9);
  if (q9 && q9.answer.toLowerCase() === 'yes') {
    flags.push('Q9: Homeowner reports undocumented promises — STOP and notify Backend Ops');
  }

  return { valid: flags.length === 0, flags };
}

/**
 * Validates production offset — system must produce ≥80% of usage.
 */
export function validateOffset(annualProduction: number, annualUsage: number): {
  valid: boolean;
  offsetPercent: number;
  flag?: string;
} {
  const offsetPercent = annualUsage > 0 ? (annualProduction / annualUsage) * 100 : 0;
  const valid = offsetPercent >= 80;
  return {
    valid,
    offsetPercent: Math.round(offsetPercent),
    flag: !valid ? `Production offset ${Math.round(offsetPercent)}% is below 80% minimum — redesign required` : undefined,
  };
}

/**
 * Validates site survey completeness per SOP.
 */
export function validateSiteSurvey(photos: Record<string, string[]>): {
  valid: boolean;
  missing: string[];
} {
  const missing: string[] = [];

  for (const section of SITE_SURVEY_SECTIONS) {
    if (!section.required) continue;
    const sectionPhotos = photos[section.id] || [];
    if (sectionPhotos.length < section.minPhotos) {
      missing.push(`${section.label}: need ${section.minPhotos} photos, have ${sectionPhotos.length}`);
    }
  }

  return { valid: missing.length === 0, missing };
}

/**
 * Pre-submission checklist validation (SOP 1.5).
 * Returns which items pass/fail.
 */
export function validatePreSubmission(project: ProjectData): {
  ready: boolean;
  items: { label: string; passed: boolean }[];
} {
  const items = [
    { label: 'Project synced from Aurora', passed: !!project.aurora_synced_at },
    { label: 'Convert to Sale completed', passed: project.status !== 'new' && project.status !== 'credit_check' && project.status !== 'aurora_synced' },
    { label: 'All ASP Documents signed', passed: !!project.documents_sent },
    { label: 'Welcome Call completed', passed: !!project.welcome_call_completed },
    { label: 'Site Survey submitted', passed: !!project.site_survey_completed },
    { label: 'No open Welcome Call flags', passed: !hasWelcomeCallFlags(project.welcome_call_data) },
  ];

  return { ready: items.every(i => i.passed), items };
}

function hasWelcomeCallFlags(data: Record<string, unknown> | null | undefined): boolean {
  if (!data) return false;
  const flags = data.flags as string[] | undefined;
  return Array.isArray(flags) && flags.length > 0;
}

/**
 * Calculate milestone fund amount based on system price.
 */
export function calculateMilestoneFund(systemPrice: number, milestone: MilestoneNumber): number {
  return Math.round(systemPrice * (MILESTONE_FUND_PERCENTS[milestone] / 100));
}

/**
 * Validates M7 Speed Bonus eligibility.
 * PTO must be achieved within 35 calendar days of permit approval.
 */
export function validateSpeedBonus(permitApprovalDate: string, ptoDate: string): {
  eligible: boolean;
  dayCount: number;
} {
  const permit = new Date(permitApprovalDate);
  const pto = new Date(ptoDate);
  const dayCount = Math.ceil((pto.getTime() - permit.getTime()) / (1000 * 60 * 60 * 24));
  return { eligible: dayCount <= 35, dayCount };
}

/**
 * Determines which roles can see a project based on its status.
 * Per SOP 4 — Platform Roles & Permissions.
 */
export function getProjectVisibility(status: ProjectStatus): {
  sales_rep: boolean;
  backend_ops: boolean;
  installer: boolean;
  financier: boolean;
} {
  const preApproval = ['new', 'credit_check', 'aurora_synced', 'converted', 'documents_sent', 'welcome_call_done', 'site_survey_done', 'submitted_for_approval', 'marked_dirty'];
  const postApproval = ['approved_clean', 'in_pipeline', 'completed'];

  if (preApproval.includes(status)) {
    return { sales_rep: true, backend_ops: status === 'submitted_for_approval' || status === 'marked_dirty', installer: false, financier: false };
  }

  if (postApproval.includes(status)) {
    return { sales_rep: true, backend_ops: true, installer: true, financier: true };
  }

  return { sales_rep: true, backend_ops: true, installer: false, financier: false };
}

/**
 * Generates mock Aurora data for a project (until real integration).
 */
export function generateMockAuroraData(highBill: number, lowBill: number) {
  const avgBill = (highBill + lowBill) / 2;
  const estimatedUsage = avgBill * 10; // rough kWh/month estimate
  const annualUsage = estimatedUsage * 12;
  const systemSizeKw = Math.round((annualUsage / 1400) * 10) / 10; // ~1400 kWh/kW in TX
  const panelCount = Math.ceil(systemSizeKw / 0.4); // ~400W panels

  const financiers = ['GoodLeap', 'Sunlight Financial', 'Mosaic'];
  const financier = financiers[Math.floor(Math.random() * financiers.length)];
  const monthlyPayment = Math.round(systemSizeKw * 18 + (Math.random() * 20));
  const pricePerWatt = 4.0 + Math.random() * 0.5;

  return {
    system_size: systemSizeKw,
    panel_count: panelCount,
    battery: 'Duracell 20kW',
    financier,
    monthly_payment: monthlyPayment,
    annual_production: Math.round(systemSizeKw * 1400),
    price_per_watt: Math.round(pricePerWatt * 100) / 100,
    escalation_rate: 2.99,
    adders: [
      { name: 'Battery', cost: 8500 },
      { name: 'Critter Guard', cost: 800 },
    ],
    contract_value: Math.round(systemSizeKw * 1000 * pricePerWatt),
  };
}
