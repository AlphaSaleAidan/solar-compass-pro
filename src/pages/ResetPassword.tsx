import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Zap, Loader2, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for recovery event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true);
      }
    });

    // Also check hash for type=recovery
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      setIsRecovery(true);
    }

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{
      background: 'radial-gradient(ellipse at 30% 20%, rgba(0,212,200,0.06) 0%, transparent 60%), hsl(220, 30%, 4%)',
    }}>
      <div className="w-[480px] max-w-[95vw] rounded-2xl p-12 relative animate-scale-in" style={{
        background: 'hsl(222, 25%, 7%)',
        border: '1px solid hsl(222, 30%, 18%)',
        boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
      }}>
        <div className="absolute top-0 left-[10%] right-[10%] h-px" style={{ background: 'linear-gradient(90deg, transparent, hsl(177, 100%, 41%), transparent)' }} />

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
              <Zap className="w-5 h-5" />
            </div>
            <span className="text-[22px] font-black tracking-wider text-white">ALPHA SALE PRO</span>
          </div>
        </div>

        {success ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-asp-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-asp-green" />
            </div>
            <h2 className="text-lg font-black text-white mb-2">Password Updated!</h2>
            <p className="text-sm text-muted-foreground">Redirecting to login...</p>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-black text-white text-center mb-2">Set New Password</h2>
            <p className="text-sm text-muted-foreground text-center mb-6">Enter your new password below.</p>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-[11px] font-bold tracking-[1.5px] uppercase mb-1.5 text-gray-400">New Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-md text-sm outline-none"
                  style={{ background: 'hsl(220, 22%, 11%)', border: '1.5px solid hsl(222, 30%, 18%)', color: 'hsl(214, 32%, 91%)' }}
                  placeholder="Enter new password" required />
              </div>
              <div className="mb-4">
                <label className="block text-[11px] font-bold tracking-[1.5px] uppercase mb-1.5 text-gray-400">Confirm Password</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-md text-sm outline-none"
                  style={{ background: 'hsl(220, 22%, 11%)', border: '1.5px solid hsl(222, 30%, 18%)', color: 'hsl(214, 32%, 91%)' }}
                  placeholder="Confirm new password" required />
              </div>
              <button type="submit" disabled={isLoading}
                className="w-full py-3.5 mt-2 bg-primary text-primary-foreground text-sm font-black tracking-wider uppercase rounded-md transition-all hover:-translate-y-px disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ boxShadow: '0 8px 24px rgba(0,212,200,0.2)' }}>
                {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating...</> : 'Update Password →'}
              </button>
            </form>
            {error && (
              <div className="mt-3 text-xs text-center p-2 rounded-md" style={{ color: 'hsl(0, 100%, 65%)', background: 'rgba(255,77,77,0.08)', border: '1px solid rgba(255,77,77,0.2)' }}>
                {error}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
