/**
 * Council AI — Streaming proxy for Anthropic API
 *
 * POST /api/council/stream  — Stream an agent response (SSE)
 * GET  /api/council/usage   — Get daily usage stats
 *
 * Gated to backend_ops and master roles.
 * 50 calls/user/day, 1000 tokens max, logged to council_logs.
 */

import { Router, Response } from 'express';
import { requireAuth, requireRole, type AuthRequest } from '../middleware/auth';
import { supabase } from '../config/supabase';

const router = Router();

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-haiku-4-5-20251001';
const MAX_TOKENS = 1000;
const DAILY_LIMIT = 50;

const AGENT_PROMPTS: Record<string, string> = {
  'ui-inspector': `You are the UI Inspector agent for Alpha Sale Pro, a solar sales operations platform built with React, TypeScript, Tailwind CSS, and shadcn/ui.

Your role: Review frontend components and user flows for visual bugs, broken layouts, missing error states, accessibility issues, and UX problems.

Focus areas: src/components/ and src/pages/

When reporting issues, be specific:
- Name the exact component and file path
- Describe the visual or functional problem
- Suggest a concrete fix
- Rate severity: critical / high / medium / low

Keep responses concise and actionable. Use bullet points.`,

  'code-auditor': `You are the Code Auditor agent for Alpha Sale Pro.

Your role: Scan for TypeScript errors, security vulnerabilities (XSS, injection, auth bypasses), dead code, performance bottlenecks, and architectural concerns.

Focus areas: src/ (React frontend) and server/src/ (Express backend)

When reporting issues:
- Cite exact file paths and describe the problem
- Flag security issues as critical
- Identify unused imports, dead functions, type safety gaps
- Suggest specific fixes with code snippets when helpful

Prioritize: security > correctness > performance > style.`,

  'backend-operator': `You are the Backend Operator agent for Alpha Sale Pro.

Your role: Monitor Supabase schema health, RLS policies, API routes, data integrity, and server operations.

Focus areas: supabase/ migrations, server/src/routes/, database schema

Key knowledge:
- Supabase PostgreSQL with RLS policies
- Express server on Railway (auth, events, webhooks, crons)
- Tables: projects, sell_projects, milestone_states, profiles, notifications, council_logs, council_usage
- 7-milestone system (M1-M7) with fund release percentages

Report on: missing RLS policies, data inconsistencies, unprotected routes, schema gaps, missing indexes.`,

  'user-comms': `You are the User Communications agent for Alpha Sale Pro, a solar sales operations platform.

Your role: Answer questions about the platform, solar installation process, deal status, milestones, and project details. Use the live data context provided to give specific, accurate answers.

Alpha Sale Pro lifecycle:
1. Sales rep creates lead → runs credit → syncs Aurora Solar design → converts to sale
2. Backend Ops QC review → approves (clean) or rejects (dirty with notes)
3. Approved deal → active project with milestones M1-M7
4. Installer completes milestone checklists, uploads docs, submits for QC
5. Ops approves milestone → fund release triggers
6. Fund schedule: M1:15% M2:20% M3:15% M4:20% M5:20% M6:10% M7:5%
7. All milestones complete → project archived

Be helpful, reference specific project names and data, use bullet points. If data is provided in context, cite it directly.`,
};

router.post('/stream', requireAuth, requireRole('backend_ops', 'master'), async (req: AuthRequest, res: Response) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'ANTHROPIC_API_KEY not configured on server' });
  }

  const { agentId, message, history, context } = req.body;
  const userId = req.userId!;

  if (!agentId || !message) {
    return res.status(400).json({ error: 'agentId and message are required' });
  }

  if (!AGENT_PROMPTS[agentId]) {
    return res.status(400).json({ error: `Unknown agent: ${agentId}` });
  }

  // Check daily usage
  const today = new Date().toISOString().split('T')[0];
  const { data: usage } = await supabase
    .from('council_usage')
    .select('call_count')
    .eq('user_id', userId)
    .eq('date', today)
    .maybeSingle();

  const currentCount = usage?.call_count || 0;
  if (currentCount >= DAILY_LIMIT) {
    return res.status(429).json({
      error: `Daily limit reached (${DAILY_LIMIT} calls/day)`,
      remaining: 0,
    });
  }

  // Increment usage
  if (usage) {
    await supabase
      .from('council_usage')
      .update({ call_count: currentCount + 1 })
      .eq('user_id', userId)
      .eq('date', today);
  } else {
    await supabase
      .from('council_usage')
      .insert({ user_id: userId, date: today, call_count: 1 });
  }

  // Build system prompt
  let systemPrompt = AGENT_PROMPTS[agentId];
  if (context) {
    systemPrompt += `\n\nLIVE DATA CONTEXT:\n${context}`;
  }

  const messages = [
    ...(history || []).slice(-8).map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user' as const, content: message },
  ];

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const start = performance.now();

  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'anthropic-version': '2023-06-01',
        'x-api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        stream: true,
        system: systemPrompt,
        messages,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[council] Anthropic error:', response.status, errText);
      res.write(`data: ${JSON.stringify({ type: 'error', error: `API error ${response.status}` })}\n\n`);
      res.end();
      return;
    }

    const reader = (response.body as any).getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let totalTokens = 0;

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

          if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
            fullText += event.delta.text;
            res.write(`data: ${JSON.stringify({ type: 'text', content: event.delta.text })}\n\n`);
          }

          if (event.type === 'message_delta' && event.usage) {
            totalTokens = event.usage.output_tokens || 0;
          }
        } catch {}
      }
    }

    const latencyMs = Math.round(performance.now() - start);
    const remaining = DAILY_LIMIT - (currentCount + 1);

    res.write(`data: ${JSON.stringify({ type: 'done', tokens: totalTokens, latencyMs, remaining })}\n\n`);
    res.end();

    // Log interaction (fire and forget)
    supabase.from('council_logs').insert({
      user_id: userId,
      agent_id: agentId,
      message,
      response: fullText,
      tokens_used: totalTokens,
      model: MODEL,
      latency_ms: latencyMs,
    }).then(() => {});

  } catch (err: any) {
    console.error('[council] Stream error:', err.message);
    res.write(`data: ${JSON.stringify({ type: 'error', error: 'Stream interrupted' })}\n\n`);
    res.end();
  }
});

router.get('/usage', requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const today = new Date().toISOString().split('T')[0];

  const { data } = await supabase
    .from('council_usage')
    .select('call_count')
    .eq('user_id', userId)
    .eq('date', today)
    .maybeSingle();

  const used = data?.call_count || 0;
  res.json({ used, remaining: Math.max(0, DAILY_LIMIT - used), limit: DAILY_LIMIT });
});

export default router;
