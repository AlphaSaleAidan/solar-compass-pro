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
