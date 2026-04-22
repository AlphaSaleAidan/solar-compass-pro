/**
 * ASP API Client — Connects frontend to Railway backend
 * 
 * All pipeline events route through this client so the backend
 * can enforce sequencing, award tickets, and trigger side effects.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'https://solar-compass-pro-production.up.railway.app';

interface EventActor {
  userId: string;
  role: string;
  name: string;
}

interface PipelineEventPayload {
  type: string;
  actor: EventActor;
  projectId?: string;
  sellProjectId?: string;
  data: Record<string, unknown>;
}

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { supabase } = await import('@/integrations/supabase/client');
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  return headers;
}

/**
 * Fire a pipeline event through the Railway backend.
 * The backend handles sequencing, side effects, ticket awards, etc.
 */
export async function fireEvent(event: PipelineEventPayload): Promise<ApiResponse> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/api/events`, {
      method: 'POST',
      headers,
      body: JSON.stringify(event),
    });
    const json = await res.json();
    if (!res.ok) {
      console.error('Pipeline event error:', json);
      return { success: false, error: json.error || 'Event processing failed' };
    }
    return { success: true, data: json };
  } catch (err) {
    console.error('Pipeline event network error:', err);
    return { success: false, error: 'Network error — backend may be unreachable' };
  }
}

/**
 * Get all pipeline triggers and their required variables
 */
export async function getTriggers(): Promise<ApiResponse> {
  try {
    const res = await fetch(`${API_BASE}/api/events/triggers`);
    const json = await res.json();
    return { success: true, data: json };
  } catch (err) {
    console.error('Failed to fetch triggers:', err);
    return { success: false, error: 'Network error' };
  }
}

/**
 * Get the full deal lifecycle flow
 */
export async function getFlow(): Promise<ApiResponse> {
  try {
    const res = await fetch(`${API_BASE}/api/events/flow`);
    const json = await res.json();
    return { success: true, data: json };
  } catch (err) {
    console.error('Failed to fetch flow:', err);
    return { success: false, error: 'Network error' };
  }
}

/**
 * Health check — verify backend is connected
 */
export async function checkHealth(): Promise<ApiResponse> {
  try {
    const res = await fetch(`${API_BASE}/api/health`);
    const json = await res.json();
    return { success: true, data: json };
  } catch (err) {
    return { success: false, error: 'Backend unreachable' };
  }
}

/**
 * Auth — Request a password reset email
 */
export async function requestPasswordReset(email: string): Promise<ApiResponse> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const json = await res.json();
    if (!res.ok) {
      return { success: false, error: json.error || 'Failed to send reset email' };
    }
    return { success: true, data: json };
  } catch (err) {
    return { success: false, error: 'Network error — backend may be unreachable' };
  }
}

/**
 * Auth — Notify that a password was changed (sends confirmation email)
 */
export async function notifyPasswordChanged(email: string, userName?: string): Promise<void> {
  try {
    await fetch(`${API_BASE}/api/auth/password-changed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, userName }),
    });
  } catch {}
}

/**
 * Auth — Check auth system configuration
 */
export async function getAuthConfig(): Promise<ApiResponse> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/config`);
    const json = await res.json();
    return { success: true, data: json };
  } catch (err) {
    return { success: false, error: 'Backend unreachable' };
  }
}

export { API_BASE };
