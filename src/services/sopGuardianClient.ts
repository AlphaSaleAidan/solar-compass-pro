/**
 * SOP Guardian Client — Frontend API for the guardian agent swarm.
 */

import { API_BASE } from '@/lib/api';

export interface Violation {
  id: string;
  project_id: string;
  agent_id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  rule_code: string;
  title: string;
  description: string;
  context: Record<string, unknown>;
  status: 'open' | 'acknowledged' | 'resolved' | 'overridden';
  resolved_by?: string;
  resolved_at?: string;
  override_reason?: string;
  created_at: string;
}

export interface GuardianAgentResult {
  agentId: string;
  agentName: string;
  violations: Violation[];
  durationMs: number;
}

export interface SwarmScanResult {
  agents: GuardianAgentResult[];
  totalViolations: number;
  criticalCount: number;
  highCount: number;
  durationMs: number;
}

export interface GuardianRun {
  id: string;
  triggered_by: string;
  agents_run: string[];
  violations_found: number;
  duration_ms: number;
  created_at: string;
}

export const GUARDIAN_AGENTS: Record<string, { name: string; icon: string; description: string; color: string }> = {
  'lead-gatekeeper':       { name: 'Lead Gatekeeper',       icon: '🚪', description: 'Validates leads before conversion', color: '#f59e0b' },
  'qc-inspector':          { name: 'QC Inspector',          icon: '🔬', description: 'Enforces clean/dirty gate rules', color: '#8b5cf6' },
  'milestone-sequencer':   { name: 'Milestone Sequencer',   icon: '📋', description: 'Guards M1→M7 progression order', color: '#3b82f6' },
  'fund-controller':       { name: 'Fund Controller',       icon: '💰', description: 'Validates fund release conditions', color: '#10b981' },
  'doc-auditor':           { name: 'Doc Auditor',           icon: '📎', description: 'Checks required uploads per milestone', color: '#f97316' },
  'data-integrity':        { name: 'Data Integrity',        icon: '🔗', description: 'Schema consistency & orphan detection', color: '#06b6d4' },
  'notification-enforcer': { name: 'Notification Enforcer', icon: '🔔', description: 'SLA timing & overdue milestones', color: '#ec4899' },
};

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { supabase } = await import('@/integrations/supabase/client');
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
}

export async function runFullScan(): Promise<SwarmScanResult> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/sop/scan`, { method: 'POST', headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || 'Scan failed');
  }
  return res.json();
}

export async function runAgentScan(agentId: string): Promise<GuardianAgentResult> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/sop/scan/${agentId}`, { method: 'POST', headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || 'Agent scan failed');
  }
  return res.json();
}

export async function fetchViolations(): Promise<{ violations: Violation[]; count: number }> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/sop/violations`, { headers });
  if (!res.ok) return { violations: [], count: 0 };
  return res.json();
}

export async function updateViolation(
  id: string,
  status: 'acknowledged' | 'resolved' | 'overridden',
  overrideReason?: string,
): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/sop/violations/${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ status, override_reason: overrideReason }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || 'Update failed');
  }
}

export async function fetchRunHistory(): Promise<GuardianRun[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/sop/history`, { headers });
  if (!res.ok) return [];
  const data = await res.json();
  return data.runs || [];
}
