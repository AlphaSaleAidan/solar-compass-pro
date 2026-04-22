/**
 * Auth Routes — Custom Password Reset Flow
 * 
 * POST /api/auth/forgot-password  — Generate recovery link & send branded email
 * POST /api/auth/verify-reset     — Verify token and exchange for session
 * GET  /api/auth/config           — Return auth configuration status
 * 
 * Uses Supabase Admin API to generate recovery links, then sends
 * a custom ASP-branded email via Resend instead of Supabase's default.
 */

import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { sendEmail, getAppUrl, isMailerConfigured } from '../services/mailer';
import { passwordResetEmail, passwordChangedEmail } from '../templates/passwordReset';
import { z } from 'zod';

const router = Router();

const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});

const PasswordChangeNotifySchema = z.object({
  email: z.string().email(),
  userName: z.string().optional(),
});

/**
 * POST /api/auth/forgot-password
 * 
 * 1. Validates email exists in Supabase auth
 * 2. Generates a recovery link via admin API
 * 3. Rewrites the redirect URL to point to our frontend
 * 4. Sends branded ASP email via Resend
 */
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = ForgotPasswordSchema.parse(req.body);
    const appUrl = getAppUrl();

    // Rate limiting hint — log for monitoring
    console.log(`[auth] Password reset requested for: ${email}`);

    // Generate recovery link using admin API
    // This bypasses Supabase's email system entirely
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: `${appUrl}/reset-password`,
      },
    });

    if (linkError) {
      console.error('[auth] generateLink error:', linkError.message);
      // Don't reveal if the email exists or not — always return success
      return res.json({
        success: true,
        message: 'If an account exists with that email, a reset link has been sent.',
      });
    }

    // The action_link from Supabase looks like:
    // https://PROJECT.supabase.co/auth/v1/verify?token=TOKEN&type=recovery&redirect_to=URL
    // We need to rewrite the redirect_to to our app URL
    let resetUrl = linkData.properties?.action_link || '';
    
    // Ensure the redirect_to in the link points to our frontend
    if (resetUrl) {
      try {
        const url = new URL(resetUrl);
        url.searchParams.set('redirect_to', `${appUrl}/reset-password`);
        resetUrl = url.toString();
      } catch {
        // If URL parsing fails, use as-is
      }
    }

    // Look up user name for personalization
    const userName = linkData.user?.user_metadata?.full_name 
      || linkData.user?.user_metadata?.name
      || undefined;

    // Send branded email
    if (isMailerConfigured()) {
      const emailResult = await sendEmail({
        to: email,
        subject: 'Reset Your Password — Alpha Sale Pro',
        html: passwordResetEmail(resetUrl, userName),
      });

      if (!emailResult.success) {
        console.error('[auth] Email send failed:', emailResult.error);
        // Fall through — we still return success to not reveal info
      }
    } else {
      console.warn('[auth] Mailer not configured — recovery link generated but not emailed');
      console.log('[auth] Recovery link (dev only):', resetUrl);
      
      // In dev/staging without Resend, fall back to Supabase's built-in email
      // by calling resetPasswordForEmail with the anon client
      // This sends Supabase's default email but at least the user gets a link
      const { createClient } = require('@supabase/supabase-js');
      const anonClient = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || '',
      );
      await anonClient.auth.resetPasswordForEmail(email, {
        redirectTo: `${appUrl}/reset-password`,
      });
      console.log('[auth] Fallback: Supabase default email sent');
    }

    return res.json({
      success: true,
      message: 'If an account exists with that email, a reset link has been sent.',
      mailerConfigured: isMailerConfigured(),
    });

  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Invalid email address' });
    }
    console.error('[auth] Forgot password error:', err.message);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/password-changed
 * 
 * Called after a successful password update to send a confirmation email.
 * Optional — nice-to-have for security notifications.
 */
router.post('/password-changed', async (req: Request, res: Response) => {
  try {
    const { email, userName } = PasswordChangeNotifySchema.parse(req.body);

    if (isMailerConfigured()) {
      await sendEmail({
        to: email,
        subject: 'Password Updated — Alpha Sale Pro',
        html: passwordChangedEmail(userName),
      });
    }

    return res.json({ success: true });
  } catch (err: any) {
    console.error('[auth] Password changed notify error:', err.message);
    return res.json({ success: true }); // Don't fail the flow
  }
});

/**
 * GET /api/auth/config
 * 
 * Returns the auth system configuration status.
 * Used by frontend to know if custom emails are enabled.
 */
router.get('/config', (_req: Request, res: Response) => {
  res.json({
    customEmails: isMailerConfigured(),
    appUrl: getAppUrl(),
    provider: isMailerConfigured() ? 'resend' : 'supabase-default',
  });
});

export default router;
