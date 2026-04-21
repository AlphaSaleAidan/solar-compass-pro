/**
 * ASP Event Pipeline — Master Trigger Map
 * 
 * Every state change in the system flows through here.
 * Each event defines: trigger condition → validation → side effects → next state.
 * 
 * ═══════════════════════════════════════════════════════════════
 * USER ROLES & THEIR SYSTEM FUNCTIONS
 * ═══════════════════════════════════════════════════════════════
 * 
 * SALES REP (SR)
 *   - Creates appointments (SET or SELF-GEN)
 *   - Closes deals → creates sell_project
 *   - Runs welcome call
 *   - Takes site survey photos
 *   - Converts deal → triggers ops pipeline
 *   - Earns gamification tickets
 * 
 * SETTER
 *   - Books appointments for closers
 *   - Earns split commission on deals they set
 *   - Gets setter_split_percent on closed deals
 * 
 * BACKEND OPS
 *   - QC review on incoming deals (approve / reject)
 *   - Manages milestone progression (M1-M7)
 *   - Verifies uploads, contacts homeowners
 *   - Approves fund releases to financier
 *   - Manages support tickets
 *   - Controls project lifecycle
 * 
 * INSTALLER
 *   - Views assigned projects in Installer Portal
 *   - Uploads: SOW, permit proof, equipment invoice, install photos, 
 *     inspection proof, interconnection docs, PTO letter
 *   - Confirms install dates
 *   - Communicates via project messaging
 *   - Submits support tickets
 * 
 * FINANCIER
 *   - Views fund release schedule
 *   - Reviews SOW vs real cost reports
 *   - Releases funds per milestone approval
 *   - Posts updates on project progress
 *   - Monitors escrow/payment pipeline
 * 
 * MASTER
 *   - All permissions from every role
 *   - Manages user accounts & registration approvals
 *   - System configuration
 * ═══════════════════════════════════════════════════════════════
 */

import { supabase } from '../config/supabase';

// ─── EVENT TYPES ──────────────────────────────────────────────

export type EventType =
  // Sales Pipeline
  | 'APPOINTMENT_CREATED'
  | 'DEAL_SUBMITTED'         // SR submits a sell_project
  | 'WELCOME_CALL_COMPLETED'
  | 'SITE_SURVEY_COMPLETED'
  | 'CREDIT_CHECK_PASSED'
  | 'CREDIT_CHECK_FAILED'
  | 'DEAL_CONVERTED_TO_SALE' // SR converts → enters ops pipeline
  
  // QC Pipeline
  | 'QC_APPROVED'            // Ops approves deal → routes to all portals
  | 'QC_REJECTED'            // Ops rejects → back to SR
  
  // Milestone Pipeline (M1-M7)
  | 'MILESTONE_CHECKLIST_UPDATED'
  | 'MILESTONE_UPLOAD_ADDED'
  | 'MILESTONE_ALL_CHECKED'  // All checklist items done for a milestone
  | 'MILESTONE_OPS_APPROVED' // Ops gives final approval → fund release
  | 'MILESTONE_ADVANCED'     // Project advances to next milestone
  | 'FUND_RELEASE_REQUESTED'
  | 'FUND_RELEASE_APPROVED'
  
  // Support
  | 'TICKET_CREATED'
  | 'TICKET_MESSAGE_ADDED'
  | 'TICKET_RESOLVED'
  
  // Gamification
  | 'TICKETS_AWARDED'        // Gamification tickets awarded to SR
  | 'PRIZE_CLAIMED'
  | 'STREAK_UPDATED'
  
  // Communication
  | 'PROJECT_MESSAGE_SENT'
  | 'FINANCIER_UPDATE_POSTED'
  
  // System
  | 'AURORA_DATA_SYNCED'
  | 'DOCUMENT_SIGNED'
  | 'USER_REGISTERED';

// ─── EVENT PAYLOAD ────────────────────────────────────────────

export interface PipelineEvent {
  type: EventType;
  timestamp: string;
  actor: {
    userId: string;
    role: string;
    name: string;
  };
  projectId?: string;
  sellProjectId?: string;
  data: Record<string, any>;
}

// ─── TRIGGER → ACTION MAP ─────────────────────────────────────
// This is the master sequencing table.
// Each trigger has required variables and produces side effects.

export const TRIGGER_MAP: Record<EventType, {
  description: string;
  requiredVariables: string[];
  sideEffects: string[];
  nextEvents: EventType[];
}> = {

  // ═══ SALES PIPELINE ═══

  APPOINTMENT_CREATED: {
    description: 'Sales rep or setter creates a new appointment',
    requiredVariables: [
      'rep_id',           // Who created it
      'customer_name',    // Homeowner name
      'address',          // Property address
      'appointment_date', // Scheduled date
      'appointment_time', // Scheduled time
      'setter',           // Setter name (if set appointment)
      'closer',           // Assigned closer (nullable for self-gen)
    ],
    sideEffects: [
      'INSERT appointments row',
      'Notify assigned closer if setter appointment',
      'Log to project_activity_log',
    ],
    nextEvents: [],
  },

  DEAL_SUBMITTED: {
    description: 'Sales rep submits a new deal (sell_project created)',
    requiredVariables: [
      'created_by',       // SR user_id
      'customer_name',    // Homeowner name
      'address',          // Property address
      'credit_status',    // new | credit_passed | credit_fail
      'aurora_data',      // System design data (nullable if not synced)
    ],
    sideEffects: [
      'INSERT sell_projects row',
      'Award 2 gamification tickets to SR',
      'Update leaderboard deals_count',
      'Log to project_activity_log',
    ],
    nextEvents: ['TICKETS_AWARDED'],
  },

  WELCOME_CALL_COMPLETED: {
    description: 'Sales rep completes welcome call with homeowner',
    requiredVariables: [
      'sell_project_id',  // Which deal
      'answers',          // Welcome call Q&A responses
      'recording_url',    // Call recording (nullable)
      'flags',            // Any flagged issues
    ],
    sideEffects: [
      'UPDATE sell_projects.welcome_call_done = true',
      'UPDATE sell_projects.welcome_call_recording_url',
      'Store answers in sell_projects.welcome_call_answers',
      'Log to project_activity_log',
    ],
    nextEvents: [],
  },

  SITE_SURVEY_COMPLETED: {
    description: 'Sales rep submits site survey photos',
    requiredVariables: [
      'sell_project_id',  // Which deal
      'photos',           // Record<section, url[]> — uploaded to site-surveys bucket
    ],
    sideEffects: [
      'UPDATE sell_projects.site_survey_done = true',
      'Store photo URLs in sell_projects.site_survey_photos',
      'Log to project_activity_log',
    ],
    nextEvents: [],
  },

  CREDIT_CHECK_PASSED: {
    description: 'Credit check comes back approved',
    requiredVariables: [
      'sell_project_id',
      'credit_score',     // Nullable — depends on financier
    ],
    sideEffects: [
      'UPDATE sell_projects.credit_status = credit_passed',
      'Notify SR that credit passed',
      'Log to project_activity_log',
    ],
    nextEvents: [],
  },

  CREDIT_CHECK_FAILED: {
    description: 'Credit check comes back denied',
    requiredVariables: [
      'sell_project_id',
      'reason',           // Denial reason
    ],
    sideEffects: [
      'UPDATE sell_projects.credit_status = credit_fail',
      'Notify SR that credit failed',
      'Log to project_activity_log',
    ],
    nextEvents: [],
  },

  DEAL_CONVERTED_TO_SALE: {
    description: 'SR converts sell_project → project (enters ops pipeline)',
    requiredVariables: [
      'sell_project_id',
      'aurora_synced',    // Must be true — system data verified
      'welcome_call_done',// Must be true
      'site_survey_done', // Must be true
      'credit_status',    // Must be credit_passed
    ],
    sideEffects: [
      'INSERT projects row (from sell_project data)',
      'Initialize 7 milestone_states rows (M1-M7)',
      'UPDATE sell_projects.converted_to_sale = true',
      'Deal appears in Backend Ops QC queue',
      'Award 2 gamification tickets to SR',
      'Update leaderboard',
      'Log to project_activity_log',
    ],
    nextEvents: ['TICKETS_AWARDED', 'QC_APPROVED'],
  },

  // ═══ QC PIPELINE ═══

  QC_APPROVED: {
    description: 'Backend Ops approves deal → routes to ALL portals',
    requiredVariables: [
      'project_id',       // Ops project ID
      'approved_by',      // Ops user_id
    ],
    sideEffects: [
      'UPDATE projects.qc_status = clean',
      'UPDATE sell_projects.approval_status = clean',
      'Project visible in Installer Portal (assigned installer)',
      'Project visible in Financier Portal (assigned financier)',
      'Project enters M1 milestone flow',
      'Notify installer of new project',
      'Notify financier of new project',
      'Log to project_activity_log',
    ],
    nextEvents: ['MILESTONE_CHECKLIST_UPDATED'],
  },

  QC_REJECTED: {
    description: 'Backend Ops rejects deal → back to SR for fixes',
    requiredVariables: [
      'project_id',
      'rejected_by',      // Ops user_id
      'rejection_reason',  // Notes explaining what's wrong
    ],
    sideEffects: [
      'UPDATE sell_projects.approval_status = dirty',
      'UPDATE sell_projects.rejection_reason',
      'Notify SR of rejection with reason',
      'Log to project_activity_log',
    ],
    nextEvents: [],
  },

  // ═══ MILESTONE PIPELINE (M1-M7) ═══

  MILESTONE_CHECKLIST_UPDATED: {
    description: 'Any user checks/unchecks a milestone checklist item',
    requiredVariables: [
      'project_id',
      'milestone_index',  // 0-6
      'checklist_item_id',// e.g. m1-ho-agreement
      'checked',          // boolean
      'actor_role',       // Who checked it (must match item.actor)
    ],
    sideEffects: [
      'UPDATE milestone_states.checklist_done',
      'Check if all items are now done → trigger MILESTONE_ALL_CHECKED',
      'Log to project_activity_log',
    ],
    nextEvents: ['MILESTONE_ALL_CHECKED'],
  },

  MILESTONE_UPLOAD_ADDED: {
    description: 'User uploads a file for a milestone checklist item',
    requiredVariables: [
      'project_id',
      'milestone_index',
      'checklist_item_id',
      'file_url',         // Supabase Storage URL (milestone-docs bucket)
      'file_name',        // Original filename
    ],
    sideEffects: [
      'Upload file to milestone-docs/{project_id}/{item_id}/',
      'UPDATE milestone_states.uploads (append URL)',
      'Mark checklist item as done',
      'Log to project_activity_log',
    ],
    nextEvents: ['MILESTONE_CHECKLIST_UPDATED'],
  },

  MILESTONE_ALL_CHECKED: {
    description: 'All checklist items for a milestone are done — awaiting ops approval',
    requiredVariables: [
      'project_id',
      'milestone_index',
    ],
    sideEffects: [
      'Highlight milestone as ready for ops approval in UI',
      'Notify Backend Ops',
    ],
    nextEvents: ['MILESTONE_OPS_APPROVED'],
  },

  MILESTONE_OPS_APPROVED: {
    description: 'Backend Ops gives final approval on milestone → triggers fund release',
    requiredVariables: [
      'project_id',
      'milestone_index',
      'approved_by',      // Ops user_id
    ],
    sideEffects: [
      'UPDATE milestone_states.fund_status = approved',
      'Calculate fund_amount = contract_value * milestone.fundPercent',
      'INSERT fund_releases row',
      'Notify financier of pending release',
      'Advance project to next milestone',
      'Award 3 gamification tickets to SR if install milestone (M4)',
      'Log to project_activity_log',
    ],
    nextEvents: ['FUND_RELEASE_REQUESTED', 'MILESTONE_ADVANCED', 'TICKETS_AWARDED'],
  },

  MILESTONE_ADVANCED: {
    description: 'Project advances to the next milestone',
    requiredVariables: [
      'project_id',
      'from_milestone',   // Previous index
      'to_milestone',     // New index
    ],
    sideEffects: [
      'UPDATE projects.current_milestone = to_milestone',
      'Initialize next milestone checklist state',
      'Notify installer of new milestone requirements',
      'Log to project_activity_log',
    ],
    nextEvents: [],
  },

  FUND_RELEASE_REQUESTED: {
    description: 'Fund release is requested after milestone approval',
    requiredVariables: [
      'project_id',
      'milestone_index',
      'amount',           // Dollar amount
      'percent',          // Percentage of contract (e.g. 15 for M1)
    ],
    sideEffects: [
      'INSERT fund_releases row (status: requested)',
      'Visible in Financier Portal under pending releases',
      'Log to project_activity_log',
    ],
    nextEvents: ['FUND_RELEASE_APPROVED'],
  },

  FUND_RELEASE_APPROVED: {
    description: 'Financier approves and releases funds',
    requiredVariables: [
      'fund_release_id',
      'approved_by',      // Financier user_id
      'payment_reference',// External payment ref
    ],
    sideEffects: [
      'UPDATE fund_releases.status = released',
      'UPDATE fund_releases.released_at',
      'Notify Backend Ops of release',
      'Update project financials',
      'Log to project_activity_log',
    ],
    nextEvents: [],
  },

  // ═══ SUPPORT ═══

  TICKET_CREATED: {
    description: 'Any user creates a support ticket on a project',
    requiredVariables: [
      'project_id',
      'created_by',
      'subject',
      'initial_message',
      'priority',         // low | normal | high | urgent
    ],
    sideEffects: [
      'INSERT tickets row',
      'INSERT ticket_messages row',
      'Notify Backend Ops of new ticket',
      'Log to project_activity_log',
    ],
    nextEvents: [],
  },

  TICKET_MESSAGE_ADDED: {
    description: 'User adds a message to an existing ticket',
    requiredVariables: [
      'ticket_id',
      'sender_id',
      'message',
    ],
    sideEffects: [
      'INSERT ticket_messages row',
      'Notify other participants',
    ],
    nextEvents: [],
  },

  TICKET_RESOLVED: {
    description: 'Backend Ops or creator resolves a ticket',
    requiredVariables: [
      'ticket_id',
      'resolved_by',
    ],
    sideEffects: [
      'UPDATE tickets.status = resolved',
      'UPDATE tickets.resolved_at',
      'Award 1 gamification ticket to resolver',
      'Log to project_activity_log',
    ],
    nextEvents: ['TICKETS_AWARDED'],
  },

  // ═══ GAMIFICATION ═══

  TICKETS_AWARDED: {
    description: 'Gamification tickets awarded to a user',
    requiredVariables: [
      'user_id',
      'amount',           // Number of tickets
      'reason',           // Why (deal_sold, install_complete, ticket_resolved)
      'source_event',     // Which event triggered this
    ],
    sideEffects: [
      'UPDATE user_gamification.total_tickets += amount',
      'UPDATE user_gamification.available_tickets += amount',
      'Check streak: if deal today, increment streak_days',
      'UPDATE user_gamification.streak_last_deal_date',
      'Log to project_activity_log',
    ],
    nextEvents: ['STREAK_UPDATED'],
  },

  PRIZE_CLAIMED: {
    description: 'User spends gamification tickets on a prize',
    requiredVariables: [
      'user_id',
      'prize_type',       // spin | puzzle
      'tickets_spent',
      'reward_name',
    ],
    sideEffects: [
      'UPDATE user_gamification.available_tickets -= tickets_spent',
      'INSERT rewards row',
      'Log prize claim',
    ],
    nextEvents: [],
  },

  STREAK_UPDATED: {
    description: 'Deal streak counter is updated',
    requiredVariables: [
      'user_id',
      'new_streak',
      'last_deal_date',
    ],
    sideEffects: [
      'UPDATE user_gamification.streak_days',
      'UPDATE user_gamification.streak_last_deal_date',
      'If streak >= 3 → award bonus ticket',
    ],
    nextEvents: [],
  },

  // ═══ COMMUNICATION ═══

  PROJECT_MESSAGE_SENT: {
    description: 'Message sent in project communication hub',
    requiredVariables: [
      'project_id',
      'sender_id',
      'sender_role',
      'message',
    ],
    sideEffects: [
      'INSERT project_messages row',
      'Notify all project participants',
    ],
    nextEvents: [],
  },

  FINANCIER_UPDATE_POSTED: {
    description: 'Financier posts an update on a project',
    requiredVariables: [
      'project_id',
      'posted_by',
      'update_type',      // fund_approved | fund_denied | status_update
      'message',
    ],
    sideEffects: [
      'INSERT financier_updates row',
      'Notify Backend Ops',
      'Log to project_activity_log',
    ],
    nextEvents: [],
  },

  // ═══ SYSTEM ═══

  AURORA_DATA_SYNCED: {
    description: 'Aurora data is synced for a project',
    requiredVariables: [
      'project_id',
      'aurora_project_id',
      'system_size',
      'panel_count',
      'financier',
      'monthly_payment',
    ],
    sideEffects: [
      'UPDATE sell_projects.aurora_data',
      'UPDATE sell_projects.aurora_synced = true',
      'Refresh data in all portals',
      'Log to project_activity_log',
    ],
    nextEvents: [],
  },

  DOCUMENT_SIGNED: {
    description: 'Document is signed via e-signature integration',
    requiredVariables: [
      'project_id',
      'document_type',    // agreement | change_order | completion_cert
      'signed_by',
      'signed_at',
      'document_url',
    ],
    sideEffects: [
      'UPDATE sell_projects.documents_signed = true (if agreement)',
      'Store signed document URL',
      'Log to project_activity_log',
    ],
    nextEvents: [],
  },

  USER_REGISTERED: {
    description: 'New user registration request',
    requiredVariables: [
      'email',
      'full_name',
      'requested_role',
      'organization_id',
    ],
    sideEffects: [
      'INSERT registration_requests row',
      'Notify master users of pending approval',
    ],
    nextEvents: [],
  },
};

// ─── EVENT PROCESSOR ──────────────────────────────────────────

export async function processEvent(event: PipelineEvent): Promise<void> {
  const trigger = TRIGGER_MAP[event.type];
  if (!trigger) {
    console.warn(`Unknown event type: ${event.type}`);
    return;
  }

  // Validate required variables
  const missing = trigger.requiredVariables.filter(v => !(v in event.data));
  if (missing.length > 0) {
    console.warn(`Event ${event.type} missing variables: ${missing.join(', ')}`);
    // Don't block — log and continue with what we have
  }

  // Log to activity log
  if (event.projectId) {
    await supabase.from('project_activity_log').insert({
      project_id: event.projectId,
      actor_id: event.actor.userId,
      event_type: event.type,
      details: event.data,
    });
  }

  // Process side effects based on event type
  switch (event.type) {
    case 'DEAL_SUBMITTED':
      await onDealSubmitted(event);
      break;
    case 'DEAL_CONVERTED_TO_SALE':
      await onDealConverted(event);
      break;
    case 'QC_APPROVED':
      await onQCApproved(event);
      break;
    case 'MILESTONE_OPS_APPROVED':
      await onMilestoneApproved(event);
      break;
    case 'TICKET_RESOLVED':
      await onTicketResolved(event);
      break;
    // Add more handlers as they're built out
    default:
      console.log(`Event ${event.type} logged (no handler yet)`);
  }
}

// ─── SIDE EFFECT HANDLERS ─────────────────────────────────────

async function onDealSubmitted(event: PipelineEvent) {
  // Award 2 tickets to the sales rep
  await awardTickets(event.actor.userId, 2, 'deal_sold', event.type);
  
  // Update leaderboard
  await supabase.rpc('increment_leaderboard_deals', { p_user_id: event.actor.userId });
}

async function onDealConverted(event: PipelineEvent) {
  const { sell_project_id } = event.data;
  
  // Get sell_project data
  const { data: sp } = await supabase
    .from('sell_projects')
    .select('*')
    .eq('id', sell_project_id)
    .single();
  
  if (!sp) return;

  // Create ops project
  const { data: project } = await supabase
    .from('projects')
    .insert({
      customer_name: sp.customer_name,
      address: sp.address,
      system_size: sp.system_size,
      pipeline_stage: 'in_pipeline',
      current_milestone: 0,
      status: 'in_pipeline',
      qc_status: 'pending',
      sales_rep_id: sp.created_by,
      source: 'sell_pipeline',
    })
    .select('id')
    .single();

  if (!project) return;

  // Initialize 7 milestone rows
  const milestoneRows = Array.from({ length: 7 }, (_, i) => ({
    project_id: project.id,
    milestone_index: i,
  }));
  await supabase.from('milestone_states').insert(milestoneRows);

  // Mark sell_project as converted
  await supabase.from('sell_projects')
    .update({ converted_to_sale: true })
    .eq('id', sell_project_id);

  // Award tickets
  await awardTickets(event.actor.userId, 2, 'deal_converted', event.type);
}

async function onQCApproved(event: PipelineEvent) {
  const { project_id } = event.data;

  // Mark as clean
  await supabase.from('projects')
    .update({ qc_status: 'clean' })
    .eq('id', project_id);

  // Project is now visible in installer + financier portals via RLS
  // (their RLS policies check qc_status = 'clean' or project access)
}

async function onMilestoneApproved(event: PipelineEvent) {
  const { project_id, milestone_index } = event.data;

  // Get project for contract value
  const { data: project } = await supabase
    .from('projects')
    .select('contract_value, sales_rep_id')
    .eq('id', project_id)
    .single();

  if (!project) return;

  // Fund percentages per milestone: M1=15, M2=20, M3=15, M4=20, M5=20, M6=10, M7=5
  const fundPercents = [15, 20, 15, 20, 20, 10, 5];
  const percent = fundPercents[milestone_index] || 0;
  const amount = (project.contract_value || 0) * (percent / 100);

  // Create fund release request
  await supabase.from('fund_releases').insert({
    project_id,
    milestone_index,
    amount,
    percent,
    status: 'requested',
  });

  // Advance milestone
  await supabase.from('projects')
    .update({ current_milestone: milestone_index + 1 })
    .eq('id', project_id);

  // Award tickets on install complete (M4)
  if (milestone_index === 3 && project.sales_rep_id) {
    await awardTickets(project.sales_rep_id, 3, 'install_complete', event.type);
  }
}

async function onTicketResolved(event: PipelineEvent) {
  // Award 1 ticket to resolver
  await awardTickets(event.actor.userId, 1, 'ticket_resolved', event.type);
}

// ─── GAMIFICATION HELPER ──────────────────────────────────────

async function awardTickets(
  userId: string,
  amount: number,
  reason: string,
  sourceEvent: string
) {
  // Get current state
  const { data: gam } = await supabase
    .from('user_gamification')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  const today = new Date().toISOString().split('T')[0];

  if (gam) {
    const isStreak = gam.streak_last_deal_date === today;
    await supabase.from('user_gamification')
      .update({
        total_tickets: (gam.total_tickets || 0) + amount,
        available_tickets: (gam.available_tickets || 0) + amount,
        streak_days: reason === 'deal_sold'
          ? (isStreak ? gam.streak_days : (gam.streak_days || 0) + 1)
          : gam.streak_days,
        streak_last_deal_date: reason === 'deal_sold' ? today : gam.streak_last_deal_date,
      })
      .eq('user_id', userId);
  } else {
    await supabase.from('user_gamification').insert({
      user_id: userId,
      total_tickets: amount,
      available_tickets: amount,
      streak_days: reason === 'deal_sold' ? 1 : 0,
      streak_last_deal_date: reason === 'deal_sold' ? today : null,
    });
  }

  console.log(`🎫 Awarded ${amount} ticket(s) to ${userId} for ${reason}`);
}

export { awardTickets };
