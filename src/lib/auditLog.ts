import { supabase } from '@/integrations/supabase/client';

/**
 * Audit logging — every significant action gets a timestamped, immutable record.
 * 
 * Writes to `project_activity_log` table.
 * Used for compliance, debugging, and the admin audit trail view.
 */

export type AuditAction =
  // Sell project lifecycle
  | 'sell_project_created'
  | 'sell_project_updated'
  | 'aurora_synced'
  | 'credit_check_passed'
  | 'credit_check_failed'
  | 'converted_to_sale'
  // QC workflow
  | 'qc_submitted'
  | 'qc_approved'
  | 'qc_rejected'
  | 'qc_marked_dirty'
  | 'qc_marked_clean'
  // Milestone lifecycle
  | 'milestone_checklist_toggled'
  | 'milestone_submitted'
  | 'milestone_ops_approved'
  | 'milestone_ops_rejected'
  // Fund lifecycle
  | 'fund_approved'
  | 'fund_released'
  // Document & comm
  | 'document_uploaded'
  | 'document_signed'
  | 'welcome_call_completed'
  | 'site_survey_completed'
  // Admin
  | 'project_archived'
  | 'project_rerouted'
  | 'role_assigned'
  | 'user_invited';

interface LogEntry {
  action: AuditAction;
  actorId: string;
  projectId?: string;        // UUID from projects table
  sellProjectId?: string;    // UUID from sell_projects table
  details?: Record<string, unknown>;
}

/**
 * Log an audit event. Fire-and-forget — doesn't block the UI.
 */
export async function logAuditEvent(entry: LogEntry): Promise<void> {
  try {
    await supabase.from('project_activity_log').insert({
      action: entry.action,
      actor_id: entry.actorId,
      project_id: entry.projectId || null,
      sell_project_id: entry.sellProjectId || null,
      details: entry.details || {},
    });
  } catch (err) {
    // Never fail the user action because of logging
    console.error('[AuditLog] Failed to write:', err);
  }
}

/**
 * Fetch audit log for a specific project or sell project.
 */
export async function getAuditLog(opts: {
  projectId?: string;
  sellProjectId?: string;
  limit?: number;
}): Promise<Array<{
  id: string;
  action: string;
  actor_id: string;
  details: Record<string, unknown>;
  created_at: string;
}>> {
  let query = supabase
    .from('project_activity_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(opts.limit || 50);

  if (opts.projectId) {
    query = query.eq('project_id', opts.projectId);
  }
  if (opts.sellProjectId) {
    query = query.eq('sell_project_id', opts.sellProjectId);
  }

  const { data, error } = await query;
  if (error) {
    console.error('[AuditLog] Fetch error:', error);
    return [];
  }
  return (data || []) as any;
}
