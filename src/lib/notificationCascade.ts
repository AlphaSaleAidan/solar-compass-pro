/**
 * Notification Cascade System — "The Wave"
 *
 * When a ticket/milestone is resolved by one party, the next party in the
 * chain is automatically notified. This creates a wave-like flow through
 * the entire deal lifecycle.
 *
 * Flow: Sales Rep → Backend Ops → Installer → Financier
 *       (with feedback loops at each stage)
 */

import { supabase } from '@/integrations/supabase/client';

/* ─── Types ──────────────────────────────────────────────────────────── */

export type NotificationType =
  | 'deal_submitted'        // SR → Ops: new deal for QC
  | 'qc_approved'           // Ops → SR + Installer + Financier: deal is clean
  | 'qc_rejected'           // Ops → SR: deal needs fixes
  | 'milestone_completed'   // Installer → Ops + Financier: milestone done
  | 'milestone_verified'    // Ops → Financier: milestone verified, release funds
  | 'funds_released'        // Financier → Ops + Installer: payment sent
  | 'ticket_created'        // Any → Ops: issue flagged
  | 'ticket_resolved'       // Ops → originator: issue fixed
  | 'document_uploaded'     // Any → Ops: doc ready for review
  | 'welcome_call_done'     // SR → Ops: welcome call completed
  | 'site_survey_done'      // SR → Ops: site survey submitted
  | 'install_scheduled'     // Installer → Ops + SR: install date set
  | 'pto_granted'           // Utility → All: permission to operate
  | 'note_added'            // Any → target portal: note for attention
  | 'status_change';        // System → relevant parties: project status changed

export interface Notification {
  id?: string;
  project_id: string;
  type: NotificationType;
  title: string;
  message: string;
  from_role: string;
  from_user_id: string;
  to_role: string;        // target portal/role
  to_user_id?: string;    // specific user (optional)
  priority: 'low' | 'medium' | 'high' | 'urgent';
  read: boolean;
  created_at?: string;
  metadata?: Record<string, unknown>;
}

/* ─── Cascade Rules ──────────────────────────────────────────────────── */

/**
 * Defines who gets notified when an event happens.
 * Each event type maps to an array of target roles.
 */
const CASCADE_RULES: Record<NotificationType, string[]> = {
  deal_submitted:      ['backend_ops'],
  qc_approved:         ['sales_rep', 'installer', 'financier'],
  qc_rejected:         ['sales_rep'],
  milestone_completed: ['backend_ops', 'financier'],
  milestone_verified:  ['financier', 'installer'],
  funds_released:      ['backend_ops', 'installer', 'sales_rep'],
  ticket_created:      ['backend_ops'],
  ticket_resolved:     ['sales_rep', 'installer', 'financier'], // originator gets notified
  document_uploaded:   ['backend_ops'],
  welcome_call_done:   ['backend_ops'],
  site_survey_done:    ['backend_ops'],
  install_scheduled:   ['backend_ops', 'sales_rep'],
  pto_granted:         ['sales_rep', 'backend_ops', 'installer', 'financier'],
  note_added:          [], // dynamically determined
  status_change:       [], // dynamically determined
};

/* ─── Core Functions ─────────────────────────────────────────────────── */

/**
 * Trigger a notification cascade — sends notifications to all relevant parties.
 */
export async function triggerCascade(params: {
  projectId: string;
  type: NotificationType;
  title: string;
  message: string;
  fromRole: string;
  fromUserId: string;
  targetRoles?: string[];   // override cascade rules
  targetUserId?: string;    // specific user
  priority?: Notification['priority'];
  metadata?: Record<string, unknown>;
}): Promise<{ success: boolean; notified: string[] }> {
  const {
    projectId, type, title, message,
    fromRole, fromUserId,
    targetRoles, targetUserId,
    priority = 'medium',
    metadata,
  } = params;

  const roles = targetRoles || CASCADE_RULES[type] || [];
  const notified: string[] = [];

  for (const role of roles) {
    // Don't notify the sender's own role (unless explicitly targeted)
    if (role === fromRole && !targetRoles) continue;

    const notification: Omit<Notification, 'id' | 'created_at'> = {
      project_id: projectId,
      type,
      title,
      message,
      from_role: fromRole,
      from_user_id: fromUserId,
      to_role: role,
      to_user_id: targetUserId,
      priority,
      read: false,
      metadata,
    };

    const { error } = await supabase
      .from('notifications')
      .insert(notification);

    if (!error) {
      notified.push(role);
    } else {
      console.warn(`[Cascade] Failed to notify ${role}:`, error.message);
    }
  }

  return { success: notified.length > 0, notified };
}

/* ─── Convenience Cascade Triggers ───────────────────────────────────── */

/** Sales Rep submits a new deal for QC review */
export const cascadeDealSubmitted = (projectId: string, userId: string, projectName: string) =>
  triggerCascade({
    projectId, type: 'deal_submitted',
    title: 'New Deal Submitted for QC',
    message: `${projectName} has been submitted and is awaiting QC review.`,
    fromRole: 'sales_rep', fromUserId: userId,
    priority: 'high',
  });

/** Backend Ops approves a deal — wave goes to all parties */
export const cascadeQCApproved = (projectId: string, userId: string, projectName: string) =>
  triggerCascade({
    projectId, type: 'qc_approved',
    title: 'Deal Approved — Pipeline Ready',
    message: `${projectName} passed QC and has been added to the active pipeline.`,
    fromRole: 'backend_ops', fromUserId: userId,
    priority: 'high',
  });

/** Backend Ops rejects a deal back to Sales Rep */
export const cascadeQCRejected = (projectId: string, userId: string, projectName: string, reason: string) =>
  triggerCascade({
    projectId, type: 'qc_rejected',
    title: 'Deal Returned — Needs Attention',
    message: `${projectName} was flagged during QC: ${reason}`,
    fromRole: 'backend_ops', fromUserId: userId,
    priority: 'urgent',
  });

/** Installer completes a milestone */
export const cascadeMilestoneCompleted = (
  projectId: string, userId: string, projectName: string, milestoneName: string, pct: string
) =>
  triggerCascade({
    projectId, type: 'milestone_completed',
    title: `Milestone Complete: ${milestoneName}`,
    message: `${projectName} — ${milestoneName} (${pct}) completed by installer. Awaiting verification.`,
    fromRole: 'installer', fromUserId: userId,
    priority: 'high',
    metadata: { milestone: milestoneName, pct },
  });

/** Ops verifies a milestone — tells financier to release funds */
export const cascadeMilestoneVerified = (
  projectId: string, userId: string, projectName: string, milestoneName: string, pct: string
) =>
  triggerCascade({
    projectId, type: 'milestone_verified',
    title: `Milestone Verified: ${milestoneName}`,
    message: `${projectName} — ${milestoneName} verified by Ops. ${pct} fund release authorized.`,
    fromRole: 'backend_ops', fromUserId: userId,
    priority: 'urgent',
    metadata: { milestone: milestoneName, pct },
  });

/** Financier releases funds */
export const cascadeFundsReleased = (
  projectId: string, userId: string, projectName: string, amount: string, milestoneName: string
) =>
  triggerCascade({
    projectId, type: 'funds_released',
    title: `Funds Released: ${milestoneName}`,
    message: `${projectName} — $${amount} released for ${milestoneName}.`,
    fromRole: 'financier', fromUserId: userId,
    priority: 'high',
    metadata: { amount, milestone: milestoneName },
  });

/** PTO granted — everyone celebrates */
export const cascadePTOGranted = (projectId: string, userId: string, projectName: string) =>
  triggerCascade({
    projectId, type: 'pto_granted',
    title: '⚡ PTO Granted!',
    message: `${projectName} has received Permission to Operate. System is LIVE.`,
    fromRole: 'backend_ops', fromUserId: userId,
    priority: 'urgent',
  });

/* ─── Subscribe to Real-Time Notifications ───────────────────────────── */

/**
 * Subscribe to notifications for a specific role (or user).
 * Returns an unsubscribe function.
 */
export function subscribeToNotifications(
  role: string,
  userId: string,
  onNotification: (notification: Notification) => void,
): () => void {
  const channel = supabase
    .channel(`notifications:${role}:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `to_role=eq.${role}`,
      },
      (payload) => {
        const notif = payload.new as Notification;
        // Only deliver if it's for this user or for the whole role
        if (!notif.to_user_id || notif.to_user_id === userId) {
          onNotification(notif);
        }
      }
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}
