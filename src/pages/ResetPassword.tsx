import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Zap, CheckCircle, Lock } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://solar-compass-pro-production.up.railway.app';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    // Listen for auth state changes — Supabase automatically picks up
    // the recovery token from the URL hash fragment
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true);
        setSessionReady(true);
      } else if (event === 'SIGNED_IN' && session) {
        setSessionReady(true);
      }
    });

    // Also check URL hash manually for type=recovery
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      setIsRecovery(true);
    }

    // Check if we already have a session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);

    const { data, error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setIsLoading(false);
      return;
    }

    // Send password change confirmation email (best effort)
    try {
      const session = (await supabase.auth.getSession()).data.session;
      if (session?.user?.email) {
        fetch(`${API_URL}/api/auth/password-changed`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: session.user.email,
            userName: session.user.user_metadata?.full_name || session.user.user_metadata?.name,
          }),
        }).catch(() => {}); // Fire and forget
      }
    } catch {}

    setSuccess(true);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: 'radial-gradient(ellipse at 30% 20%, rgba(0,212,200,0.06) 0%, transparent 60%), hsl(220, 30%, 4%)' }}>
      <div className="w-[480px] max-w-[95vw] rounded-2xl p-12"
        style={{ background: 'hsl(222, 25%, 7%)', border: '1px solid hsl(222, 30%, 18%)' }}>
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
              <Zap className="w-5 h-5" />
            </div>
            <span className="text-[22px] font-black tracking-wider text-white">SET NEW PASSWORD</span>
          </div>
        </div>

        {success ? (
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-2"
              style={{ background: 'rgba(0,212,200,0.1)', border: '2px solid rgba(0,212,200,0.2)' }}>
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-bold text-white">Password Updated!</h3>
            <p className="text-gray-400 text-sm">Your password has been successfully changed. You can now log in with your new credentials.</p>
            <a href="/login"
              className="inline-block mt-2 px-8 py-3 bg-primary text-primary-foreground text-sm font-black tracking-wider uppercase rounded-md transition-all hover:brightness-110"
              style={{ boxShadow: '0 8px 24px rgba(0,212,200,0.2)' }}>
              Go to Login →
            </a>
          </div>
        ) : !sessionReady && isRecovery ? (
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400 text-sm">Verifying your reset link...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="flex items-center gap-2 mb-6 p-3 rounded-lg" style={{ background: 'rgba(0,212,200,0.05)', border: '1px solid rgba(0,212,200,0.1)' }}>
              <Lock className="w-4 h-4 text-primary flex-shrink-0" />
              <p className="text-gray-400 text-xs">Choose a strong password with at least 8 characters.</p>
            </div>
            <div className="mb-4">
              <label className="block text-[11px] font-bold tracking-[1.5px] uppercase mb-1.5 text-gray-400">New Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                className="w-full px-4 py-3 rounded-md text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                style={{ background: 'hsl(220, 22%, 11%)', border: '1.5px solid hsl(222, 30%, 18%)', color: 'hsl(214, 32%, 91%)' }}
                placeholder="Min 8 characters" />
            </div>
            <div className="mb-4">
              <label className="block text-[11px] font-bold tracking-[1.5px] uppercase mb-1.5 text-gray-400">Confirm Password</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
                className="w-full px-4 py-3 rounded-md text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                style={{ background: 'hsl(220, 22%, 11%)', border: '1.5px solid hsl(222, 30%, 18%)', color: 'hsl(214, 32%, 91%)' }}
                placeholder="Re-enter password" />
            </div>
            <button type="submit" disabled={isLoading}
              className="w-full py-3.5 bg-primary text-primary-foreground text-sm font-black tracking-wider uppercase rounded-md disabled:opacity-50 transition-all hover:brightness-110"
              style={{ boxShadow: '0 8px 24px rgba(0,212,200,0.2)' }}>
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Updating...
                </span>
              ) : 'Update Password →'}
            </button>
          </form>
        )}

        {error && (
          <div className="mt-3 text-xs text-center p-2 rounded-md"
            style={{ color: 'hsl(0, 100%, 65%)', background: 'rgba(255,77,77,0.08)', border: '1px solid rgba(255,77,77,0.2)' }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
