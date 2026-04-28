/**
 * Council LLM — Streams AI responses from the Railway backend proxy.
 *
 * Architecture:
 * 1. Frontend sends message + context to Railway /api/council/stream
 * 2. Railway validates auth, checks usage, calls Anthropic API with streaming
 * 3. Railway pipes SSE events back to the frontend
 * 4. Frontend renders text as it arrives
 *
 * Model: claude-haiku-4-5-20251001 (cheapest, fast, capable)
 * Max tokens: 1000 per response
 * Daily limit: 50 calls per user
 */

import { API_BASE } from '@/lib/api';
import type { AgentId } from './councilEngine';

export interface StreamCallbacks {
  onChunk: (text: string) => void;
  onDone: (info: { tokens: number; latencyMs: number; remaining: number }) => void;
  onError: (error: string) => void;
}

export interface UsageInfo {
  used: number;
  remaining: number;
  limit: number;
}

async function getAuthToken(): Promise<string | null> {
  const { supabase } = await import('@/integrations/supabase/client');
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

/**
 * Stream a council AI response. Calls the Railway server which proxies to Anthropic.
 */
export async function streamCouncilChat(
  agentId: AgentId,
  message: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  context: string,
  callbacks: StreamCallbacks,
): Promise<void> {
  const token = await getAuthToken();
  if (!token) {
    callbacks.onError('Not authenticated');
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/api/council/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ agentId, message, history, context }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
      callbacks.onError(err.error || `Server error ${response.status}`);
      return;
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const payload = line.slice(6).trim();
        if (!payload) continue;

        try {
          const event = JSON.parse(payload);
          if (event.type === 'text') {
            callbacks.onChunk(event.content);
          } else if (event.type === 'done') {
            callbacks.onDone({
              tokens: event.tokens || 0,
              latencyMs: event.latencyMs || 0,
              remaining: event.remaining ?? 50,
            });
          } else if (event.type === 'error') {
            callbacks.onError(event.error || 'Unknown error');
          }
        } catch {}
      }
    }
  } catch (err: any) {
    callbacks.onError(err.message || 'Network error');
  }
}

/**
 * Fetch daily usage stats.
 */
export async function fetchUsage(): Promise<UsageInfo> {
  const token = await getAuthToken();
  if (!token) return { used: 0, remaining: 50, limit: 50 };

  try {
    const res = await fetch(`${API_BASE}/api/council/usage`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) return { used: 0, remaining: 50, limit: 50 };
    return await res.json();
  } catch {
    return { used: 0, remaining: 50, limit: 50 };
  }
}
