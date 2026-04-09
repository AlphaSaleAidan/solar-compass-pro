/**
 * Council LLM Integration — Groq-powered intelligence for the Pantheon.
 *
 * Architecture:
 * 1. Builds rich context from all project/deal/milestone data
 * 2. Calls Groq API (Llama 3.3 70B) for natural language reasoning
 * 3. Falls back to rule-based responses if no API key or on error
 *
 * The API key is stored in VITE_GROQ_API_KEY env var.
 * For production, this should move to a Supabase Edge Function.
 */

import type { Project, SellProject } from '@/data/mockData';
import type { ProjectMilestoneState } from '@/contexts/ProjectStore';
import { MILESTONE_SOPS } from '@/data/milestoneSOP';
import { AGENTS, type AgentId, runCouncilAnalysis } from './councilEngine';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

// ─── Context Builder ────────────────────────────────────────────────

interface PantheonContext {
  summary: string;
  projectDetails: string;
  dealDetails: string;
  milestoneDetails: string;
  councilFindings: string;
  sopReference: string;
}

const pf = (p: Project, field: string): string | undefined =>
  (p as Record<string, unknown>)[field] as string | undefined;

function buildContext(
  projects: Project[],
  sellProjects: SellProject[],
  milestoneStates: Record<string, ProjectMilestoneState>,
): PantheonContext {
  // Project summaries
  const projectDetails = projects.map(p => {
    const ms = milestoneStates[p.id];
    const completedMilestones = ms ? Object.entries(ms.opsApproved || {}).filter(([, v]) => v).length : 0;
    const fundedMilestones = ms ? Object.entries(ms.fundStatus || {}).filter(([, v]) => v === 'released').length : 0;
    return [
      `• ${p.customerName} | ${p.status} | M${p.currentMilestone}/7`,
      `  System: ${p.systemSize}kW ${p.battery ? '+ battery' : ''} | ${pf(p, 'financier') || 'Unknown'} | $${(p.contractValue || 0).toLocaleString()}`,
      `  Address: ${p.address}`,
      `  Milestones completed: ${completedMilestones}/7, Funds released: ${fundedMilestones}/7`,
      ms?.fundStatus ? `  Fund status: ${JSON.stringify(ms.fundStatus)}` : '',
    ].filter(Boolean).join('\n');
  }).join('\n\n');

  // Deal pipeline
  const dealDetails = sellProjects.map(sp => {
    const status = sp.convertedToSale ? '✅ Converted' :
      sp.approvalStatus === 'approved' ? '🟢 Approved' :
      sp.approvalStatus === 'dirty' ? '🟡 Dirty/Flagged' :
      sp.qcInitialApproved ? '🔵 QC Passed' : '⚪ New';
    return `• ${sp.firstName} ${sp.lastName} | ${status} | Credit: ${sp.creditStatus || 'pending'} | ${sp.address}`;
  }).join('\n');

  // Milestone details for each project
  const milestoneDetails = projects.map(p => {
    const ms = milestoneStates[p.id];
    if (!ms) return `• ${p.customerName}: No milestone data`;
    const milestones = MILESTONE_SOPS.map((sop, i) => {
      const submitted = ms.installerSubmitted?.[i] ? '✅' : '⬜';
      const approved = ms.opsApproved?.[i] ? '✅' : '⬜';
      const funded = ms.fundStatus?.[i] === 'released' ? '💰' : ms.fundStatus?.[i] === 'approved' ? '🟡' : '⬜';
      return `  M${i + 1} ${sop.name}: Submit${submitted} Approve${approved} Fund${funded}`;
    });
    return [`• ${p.customerName}:`, ...milestones].join('\n');
  }).join('\n\n');

  // Run council analysis for live findings
  const analysis = runCouncilAnalysis(projects, sellProjects, milestoneStates);
  const councilFindings = analysis.findings.slice(0, 15).map(f =>
    `[${f.severity.toUpperCase()}] ${AGENTS[f.agentId].name}: ${f.title} — ${f.description}${f.recommendation ? ` → ${f.recommendation}` : ''}`
  ).join('\n');

  // SOP reference
  const sopReference = MILESTONE_SOPS.map((sop, i) =>
    `M${i + 1} "${sop.name}" (${sop.fundPercent}% funds): ${sop.checklist.map(c => c.label).join(', ')}`
  ).join('\n');

  // Overall summary
  const activeProjects = projects.filter(p => p.status === 'active').length;
  const totalValue = projects.reduce((s, p) => s + (p.contractValue || 0), 0);
  const pendingDeals = sellProjects.filter(sp => !sp.convertedToSale).length;
  const criticalFindings = analysis.findings.filter(f => f.severity === 'critical' || f.severity === 'high').length;

  const summary = [
    `Alpha Sale Pro — Live Operations Summary`,
    `Active projects: ${activeProjects} | Total pipeline: $${totalValue.toLocaleString()}`,
    `Pending deals: ${pendingDeals} | Converted: ${sellProjects.filter(sp => sp.convertedToSale).length}`,
    `Council findings: ${analysis.findings.length} total, ${criticalFindings} critical/high`,
    `Agents: ${Object.values(analysis.agents).map(a => `${a.name} (${a.findings} findings)`).join(', ')}`,
  ].join('\n');

  return { summary, projectDetails, dealDetails, milestoneDetails, councilFindings, sopReference };
}

// ─── System Prompt ──────────────────────────────────────────────────

function buildSystemPrompt(ctx: PantheonContext): string {
  return `You are The Pantheon — Alpha Sale Pro's AI Operations Council. You are a team of 5 specialized AI agents working together:

• Hermes (⚡ Operations) — Monitors project flow, milestone velocity, bottlenecks
• Hephaestus (🔨 Engineering) — Tracks system integrity, data quality, integrations
• Athena (🛡️ QA) — Enforces quality gates, SOP compliance, approval chains
• Zeus (👑 Strategy) — Analyzes pipeline health, revenue optimization, scaling
• Apollo (☀️ Design) — Reviews UX patterns, portal navigation, user experience

You speak as whichever agent is most relevant to the question. Be direct, data-driven, and actionable. Use the real data below — never make up numbers or projects.

CURRENT OPERATIONS STATE:
${ctx.summary}

ACTIVE PROJECTS:
${ctx.projectDetails || 'No active projects'}

DEAL PIPELINE:
${ctx.dealDetails || 'No deals in pipeline'}

MILESTONE PROGRESS:
${ctx.milestoneDetails || 'No milestone data'}

LIVE COUNCIL FINDINGS:
${ctx.councilFindings || 'No findings — all systems nominal'}

SOP REFERENCE (7-Milestone System):
${ctx.sopReference}

RULES:
- Always reference specific project names and real data
- If asked about a project, show its exact milestone status
- If asked to take action, explain what you'd do and suggest the user confirm
- Keep responses concise but thorough — bullet points preferred
- If you detect an issue, recommend a specific fix
- Sign responses with the relevant agent emoji and name
- Format important data with *bold* markers
- For SOP questions, cite the specific milestone and checklist items`;
}

// ─── Groq API Call ──────────────────────────────────────────────────

interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface LLMResponse {
  text: string;
  agentId: AgentId;
  model: string;
  tokens: number;
  latencyMs: number;
}

export function isLLMEnabled(): boolean {
  const key = import.meta.env.VITE_GROQ_API_KEY;
  return !!key && key !== 'undefined' && key.length > 10;
}

export async function queryLLM(
  userMessage: string,
  conversationHistory: GroqMessage[],
  projects: Project[],
  sellProjects: SellProject[],
  milestoneStates: Record<string, ProjectMilestoneState>,
): Promise<LLMResponse | null> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey || apiKey === 'undefined') return null;

  const ctx = buildContext(projects, sellProjects, milestoneStates);
  const systemPrompt = buildSystemPrompt(ctx);

  const messages: GroqMessage[] = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.slice(-8), // Keep last 8 messages for context
    { role: 'user', content: userMessage },
  ];

  const start = performance.now();

  try {
    const res = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: 0.4,
        max_tokens: 1024,
        top_p: 0.9,
        stream: false,
      }),
    });

    if (!res.ok) {
      console.warn('[Pantheon LLM] Groq API error:', res.status, await res.text());
      return null;
    }

    const data = await res.json();
    const latencyMs = Math.round(performance.now() - start);
    const text = data.choices?.[0]?.message?.content || '';
    const tokens = data.usage?.total_tokens || 0;

    // Detect which agent should "speak" based on content
    const agentId = detectAgent(userMessage, text);

    return { text, agentId, model: MODEL, tokens, latencyMs };
  } catch (err) {
    console.warn('[Pantheon LLM] Groq API call failed:', err);
    return null;
  }
}

// ─── Agent Detection from Response Content ──────────────────────────

function detectAgent(question: string, answer: string): AgentId {
  const combined = (question + ' ' + answer).toLowerCase();

  const scores: Record<AgentId, number> = {
    hermes: 0, hephaestus: 0, athena: 0, zeus: 0, apollo: 0,
  };

  // Hermes — operations
  if (/milestone|progress|velocity|bottleneck|stall|delay|schedule|timeline/i.test(combined)) scores.hermes += 3;
  if (/project.*status|install.*date|permit|pto|inspection/i.test(combined)) scores.hermes += 2;

  // Hephaestus — engineering
  if (/data.*quality|missing.*field|error|bug|sync|integration|api|system/i.test(combined)) scores.hephaestus += 3;
  if (/database|schema|null|undefined|crash/i.test(combined)) scores.hephaestus += 2;

  // Athena — QA
  if (/qc|quality|review|approval|reject|compliance|checklist|sop/i.test(combined)) scores.athena += 3;
  if (/flag|dirty|clean|verify|audit/i.test(combined)) scores.athena += 2;

  // Zeus — strategy
  if (/pipeline|revenue|conversion|performance|rep.*stat|ranking|growth|scale/i.test(combined)) scores.zeus += 3;
  if (/rate|average|trend|forecast|total.*value/i.test(combined)) scores.zeus += 2;

  // Apollo — design/UX
  if (/portal|ui|ux|design|layout|navigation|mobile|responsive/i.test(combined)) scores.apollo += 3;
  if (/button|screen|page|tab|display/i.test(combined)) scores.apollo += 2;

  const best = (Object.entries(scores) as [AgentId, number][])
    .sort((a, b) => b[1] - a[1])[0];

  return best[1] > 0 ? best[0] : 'hermes';
}

// ─── Context Builder Export (for chat service) ──────────────────────

export { buildContext, type PantheonContext };
