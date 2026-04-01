/**
 * SOP Engine — Enforces sequential pipeline stage progression
 * and validates transitions for production users.
 *
 * Pipeline stages (in order):
 *   draft → aurora_synced → sale_converted → docs_sent → docs_signed →
 *   welcome_call_done → site_survey_done → submitted_for_qc →
 *   qc_clean | qc_dirty → in_pipeline → complete
 */

// Ordered pipeline stages
export const PIPELINE_STAGES = [
  'draft',
  'aurora_synced',
  'sale_converted',
  'docs_sent',
  'docs_signed',
  'welcome_call_done',
  'site_survey_done',
  'submitted_for_qc',
  'qc_clean',
  'qc_dirty',
  'in_pipeline',
  'complete',
] as const;

export type PipelineStage = typeof PIPELINE_STAGES[number];

/**
 * Returns the next valid stage for a given current stage.
 * qc_dirty loops back to submitted_for_qc on resubmission.
 */
export function getNextStage(current: PipelineStage): PipelineStage | null {
  if (current === 'qc_dirty') return 'submitted_for_qc';
  if (current === 'complete') return null;
  const idx = PIPELINE_STAGES.indexOf(current);
  if (idx === -1 || idx >= PIPELINE_STAGES.length - 1) return null;
  // Skip qc_dirty in normal flow (only reached via Backend Ops marking dirty)
  const next = PIPELINE_STAGES[idx + 1];
  return next === 'qc_dirty' ? 'qc_clean' : next;
}

/**
 * Check if a stage transition is allowed.
 */
export function canTransitionTo(current: PipelineStage, target: PipelineStage): boolean {
  // Special cases
  if (target === 'qc_dirty' && current === 'submitted_for_qc') return true;
  if (target === 'qc_clean' && current === 'submitted_for_qc') return true;
  if (target === 'submitted_for_qc' && current === 'qc_dirty') return true;
  if (target === 'in_pipeline' && current === 'qc_clean') return true;

  const next = getNextStage(current);
  return next === target;
}

/**
 * Determines the stage index for ordering/progress display.
 */
export function getStageIndex(stage: PipelineStage): number {
  return PIPELINE_STAGES.indexOf(stage);
}

/**
 * Whether a stage is in the pre-pipeline phase (Sales Rep workflow)
 */
export function isPrePipeline(stage: PipelineStage): boolean {
  return getStageIndex(stage) < getStageIndex('in_pipeline');
}

// ─── Welcome Call Validation ───

export interface WelcomeCallAnswers {
  q1_zero_upfront: boolean;
  q2_monthly_payment: boolean;
  q3_warranty: boolean;
  q4_personally_signed: boolean;
  q5_roof_damage: boolean;
  q6_25_year_term: boolean;
  q7_rate_increase: string; // "A" | "B" | "C"
  q8_transferable: boolean;
  q9_outside_promises: boolean;
  q10_annual_usage_kwh: number;
}

export interface WelcomeCallFlag {
  question: string;
  issue: string;
}

/**
 * Validate welcome call answers and produce flags.
 * Returns an array of flags. Empty = all clear.
 */
export function validateWelcomeCall(
  answers: WelcomeCallAnswers,
  systemProductionKwh?: number
): WelcomeCallFlag[] {
  const flags: WelcomeCallFlag[] = [];

  if (answers.q5_roof_damage) {
    flags.push({ question: 'Q5', issue: 'Roof damage reported — assess before proceeding' });
  }

  if (answers.q7_rate_increase !== 'A') {
    flags.push({ question: 'Q7', issue: 'Incorrect rate answer — re-education needed' });
  }

  if (answers.q9_outside_promises) {
    flags.push({ question: 'Q9', issue: 'Outside promises reported — BLOCK and alert Backend Ops' });
  }

  if (systemProductionKwh && answers.q10_annual_usage_kwh > 0) {
    const offset = (systemProductionKwh / answers.q10_annual_usage_kwh) * 100;
    if (offset < 80) {
      flags.push({ question: 'Q10', issue: `Production offset only ${offset.toFixed(1)}% — below 80% threshold` });
    }
  }

  return flags;
}

// ─── Site Survey Validation ───

export const SITE_SURVEY_SECTIONS = [
  { id: 'rafters', label: 'Rafters', minPhotos: 2, required: true },
  { id: 'shingles', label: 'Shingles', minPhotos: 2, required: true },
  { id: 'drone', label: 'Drone/Aerial', minPhotos: 1, required: true },
  { id: 'main_panel', label: 'Main Panel', minPhotos: 2, required: true },
  { id: 'sub_panel', label: 'Sub-Panel', minPhotos: 1, required: false },
] as const;

/**
 * Validate that all required site survey sections have minimum photos.
 * photoCounts: Record<sectionId, count>
 */
export function validateSiteSurvey(photoCounts: Record<string, number>): { valid: boolean; missing: string[] } {
  const missing: string[] = [];
  for (const section of SITE_SURVEY_SECTIONS) {
    if (!section.required) continue;
    const count = photoCounts[section.id] || 0;
    if (count < section.minPhotos) {
      missing.push(`${section.label} (need ${section.minPhotos}, have ${count})`);
    }
  }
  return { valid: missing.length === 0, missing };
}

// ─── Pre-submission Checklist ───

export interface PreSubmissionCheck {
  label: string;
  passed: boolean;
}

/**
 * Build the pre-submission checklist for Step A7.
 */
export function getPreSubmissionChecklist(project: {
  auroraSynced?: boolean;
  convertedToSale?: boolean;
  documentsSigned?: boolean;
  welcomeCallComplete?: boolean;
  siteSurveyComplete?: boolean;
  welcomeCallFlags?: WelcomeCallFlag[];
}): PreSubmissionCheck[] {
  return [
    { label: 'Aurora synced with all data confirmed', passed: !!project.auroraSynced },
    { label: 'Convert to Sale completed', passed: !!project.convertedToSale },
    { label: 'All ASP documents signed', passed: !!project.documentsSigned },
    { label: 'Welcome Call completed and recorded', passed: !!project.welcomeCallComplete },
    { label: 'All site survey sections submitted', passed: !!project.siteSurveyComplete },
    { label: 'No open flags from Welcome Call', passed: !project.welcomeCallFlags?.length },
  ];
}

// ─── M7 Speed Bonus ───

/**
 * Calculate whether a project qualifies for the M7 speed bonus.
 * PTO must be achieved within 35 calendar days of permit approval.
 */
export function calculateSpeedBonus(permitApprovalDate: string, ptoDate: string): { qualifies: boolean; dayCount: number } {
  const permit = new Date(permitApprovalDate);
  const pto = new Date(ptoDate);
  const dayCount = Math.floor((pto.getTime() - permit.getTime()) / (1000 * 60 * 60 * 24));
  return { qualifies: dayCount <= 35, dayCount };
}
