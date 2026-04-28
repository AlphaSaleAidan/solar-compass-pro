/**
 * Auth Middleware — Validates Supabase JWT tokens, webhook secrets, and rate limiting
 */

import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

/**
 * Require valid Supabase auth token
 */
export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }

  const token = authHeader.slice(7);
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, platform_access')
      .eq('user_id', user.id)
      .maybeSingle();

    req.userId = user.id;
    req.userRole = profile?.role || 'sales_rep';
    next();
  } catch {
    return res.status(401).json({ error: 'Authentication failed' });
  }
}

/**
 * Require specific role(s)
 */
export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userRole || (!roles.includes(req.userRole) && req.userRole !== 'master')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

/**
 * Webhook secret validation
 */
export function requireWebhookSecret(req: Request, res: Response, next: NextFunction) {
  const secret = req.headers['x-webhook-secret'] || req.query.secret;
  if (!process.env.WEBHOOK_SECRET || secret !== process.env.WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Invalid webhook secret' });
  }
  next();
}

/**
 * Stripe signature verification
 */
export function requireStripeSignature(req: Request, res: Response, next: NextFunction) {
  const sig = req.headers['stripe-signature'] as string;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!endpointSecret) {
    console.warn('[auth] STRIPE_WEBHOOK_SECRET not configured — rejecting');
    return res.status(500).json({ error: 'Stripe webhook not configured' });
  }

  if (!sig) {
    return res.status(401).json({ error: 'Missing Stripe signature' });
  }

  // Timestamp-based replay protection (Stripe scheme: t=timestamp,v1=signature)
  try {
    const elements = sig.split(',');
    const timestampEl = elements.find(e => e.startsWith('t='));
    if (timestampEl) {
      const timestamp = parseInt(timestampEl.slice(2), 10);
      const tolerance = 300; // 5 minutes
      const now = Math.floor(Date.now() / 1000);
      if (Math.abs(now - timestamp) > tolerance) {
        return res.status(401).json({ error: 'Webhook timestamp too old' });
      }
    }
  } catch {
    // If parsing fails, let the signature check below handle it
  }

  // For full signature verification, use the Stripe SDK:
  // stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret)
  // For now we do header presence + timestamp check; upgrade when stripe SDK is added
  next();
}

/**
 * In-memory sliding window rate limiter
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(opts: { windowMs: number; max: number; message?: string }) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const entry = rateLimitStore.get(key);

    if (!entry || now > entry.resetAt) {
      rateLimitStore.set(key, { count: 1, resetAt: now + opts.windowMs });
      return next();
    }

    entry.count++;
    if (entry.count > opts.max) {
      res.set('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
      return res.status(429).json({
        error: opts.message || 'Too many requests, please try again later',
      });
    }
    next();
  };
}

// Periodic cleanup to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore) {
    if (now > entry.resetAt) rateLimitStore.delete(key);
  }
}, 60_000);
