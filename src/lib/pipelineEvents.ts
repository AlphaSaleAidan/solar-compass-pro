/**
 * Pipeline Event Helpers — Typed wrappers for common frontend actions
 * 
 * Each function fires the appropriate event through the Railway backend,
 * which handles sequencing, side effects, and ticket awards.
 */

import { fireEvent } from './api';

interface Actor {
  userId: string;
  role: string;
  name: string;
}

// ─── SALES PIPELINE ───────────────────────────────────────

export async function onAppointmentCreated(actor: Actor, data: {
  customer_name: string;
  address: string;
  date: string;
  time: string;
  setter?: string;
  closer?: string;
}) {
  return fireEvent({
    type: 'APPOINTMENT_CREATED',
    actor,
    data,
  });
}

export async function onDealSubmitted(actor: Actor, sellProjectId: string, data: {
  customer_name: string;
  address: string;
  credit_status?: string;
  aurora_data?: Record<string, unknown>;
}) {
  return fireEvent({
    type: 'DEAL_SUBMITTED',
    actor,
    sellProjectId,
    data,
  });
}

export async function onWelcomeCallCompleted(actor: Actor, sellProjectId: string, data: {
  answers: Record<string, unknown>;
  recording_url?: string;
  flags?: string[];
}) {
  return fireEvent({
    type: 'WELCOME_CALL_COMPLETED',
    actor,
    sellProjectId,
    data,
  });
}

export async function onSiteSurveyCompleted(actor: Actor, sellProjectId: string, data: {
  photos: Record<string, string[]>;
}) {
  return fireEvent({
    type: 'SITE_SURVEY_COMPLETED',
    actor,
    sellProjectId,
    data,
  });
}

export async function onCreditCheckPassed(actor: Actor, sellProjectId: string) {
  return fireEvent({
    type: 'CREDIT_CHECK_PASSED',
    actor,
    sellProjectId,
    data: { status: 'passed' },
  });
}

export async function onDealConvertedToSale(actor: Actor, sellProjectId: string, projectId: string) {
  return fireEvent({
    type: 'DEAL_CONVERTED_TO_SALE',
    actor,
    sellProjectId,
    projectId,
    data: {},
  });
}

// ─── QC GATE ──────────────────────────────────────────────

export async function onQcApproved(actor: Actor, projectId: string) {
  return fireEvent({
    type: 'QC_APPROVED',
    actor,
    projectId,
    data: { approved_by: actor.userId },
  });
}

export async function onQcRejected(actor: Actor, projectId: string, reason: string) {
  return fireEvent({
    type: 'QC_REJECTED',
    actor,
    projectId,
    data: { rejected_by: actor.userId, rejection_reason: reason },
  });
}

// ─── MILESTONES ───────────────────────────────────────────

export async function onMilestoneChecklistUpdated(actor: Actor, projectId: string, data: {
  milestone_index: number;
  checklist_item_id: string;
  checked: boolean;
}) {
  return fireEvent({
    type: 'MILESTONE_CHECKLIST_UPDATED',
    actor,
    projectId,
    data,
  });
}

export async function onMilestoneOpsApproved(actor: Actor, projectId: string, milestoneIndex: number) {
  return fireEvent({
    type: 'MILESTONE_OPS_APPROVED',
    actor,
    projectId,
    data: { milestone_index: milestoneIndex, approved_by: actor.userId },
  });
}

// ─── FUND RELEASES ────────────────────────────────────────

export async function onFundReleaseApproved(actor: Actor, projectId: string, data: {
  fund_release_id: string;
  payment_reference?: string;
}) {
  return fireEvent({
    type: 'FUND_RELEASE_APPROVED',
    actor,
    projectId,
    data: { ...data, approved_by: actor.userId },
  });
}

// ─── TICKETS & GAMIFICATION ───────────────────────────────

export async function onTicketResolved(actor: Actor, data: {
  ticket_id: string;
}) {
  return fireEvent({
    type: 'TICKET_RESOLVED',
    actor,
    data: { ...data, resolved_by: actor.userId },
  });
}

// ─── DOCUMENTS ────────────────────────────────────────────

export async function onDocumentSigned(actor: Actor, projectId: string, data: {
  document_type: string;
  signed_by: string;
  document_url?: string;
}) {
  return fireEvent({
    type: 'DOCUMENT_SIGNED',
    actor,
    projectId,
    data,
  });
}

// ─── AURORA ───────────────────────────────────────────────

export async function onAuroraDataSynced(actor: Actor, data: {
  aurora_project_id: string;
  system_size?: number;
  panel_count?: number;
}) {
  return fireEvent({
    type: 'AURORA_DATA_SYNCED',
    actor,
    data,
  });
}

// ─── MESSAGES ─────────────────────────────────────────────

export async function onProjectMessageSent(actor: Actor, projectId: string, data: {
  message: string;
}) {
  return fireEvent({
    type: 'PROJECT_MESSAGE_SENT',
    actor,
    projectId,
    data,
  });
}
