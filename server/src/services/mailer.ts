/**
 * ASP Email Service
 * 
 * Sends transactional emails via Resend API.
 * Falls back gracefully if RESEND_API_KEY is not configured.
 * 
 * Required env vars:
 *   RESEND_API_KEY  — Resend API key (https://resend.com)
 *   FROM_EMAIL      — Verified sender (e.g. noreply@alphasalepro.com)
 *   APP_URL         — Frontend URL (e.g. https://alphasalepro.com)
 */

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

const RESEND_API_URL = 'https://api.resend.com/emails';

export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.FROM_EMAIL || 'Alpha Sale Pro <onboarding@resend.dev>';

  if (!apiKey) {
    console.warn('[mailer] RESEND_API_KEY not configured — email not sent');
    return { success: false, error: 'RESEND_API_KEY not configured' };
  }

  try {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [options.to],
        subject: options.subject,
        html: options.html,
        reply_to: options.replyTo,
      }),
    });

    const data = (await response.json()) as Record<string, unknown>;

    if (!response.ok) {
      console.error('[mailer] Resend API error:', data);
      return { success: false, error: (data.message as string) || 'Failed to send email' };
    }

    console.log(`[mailer] Email sent to ${options.to} — id: ${data.id}`);
    return { success: true, id: data.id as string };
  } catch (err: any) {
    console.error('[mailer] Send error:', err.message);
    return { success: false, error: err.message };
  }
}

export function getAppUrl(): string {
  return process.env.APP_URL || 'https://alphasalepro.com';
}

export function isMailerConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}
