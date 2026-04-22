import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Zap } from 'lucide-react';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [_isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      setIsRecovery(true);
    }
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
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }
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
          <div className="text-center">
            <p className="text-primary text-sm font-bold mb-4">Password updated successfully!</p>
            <a href="/" className="text-gray-400 text-xs hover:text-primary">← Back to Login</a>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-[11px] font-bold tracking-[1.5px] uppercase mb-1.5 text-gray-400">New Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                className="w-full px-4 py-3 rounded-md text-sm outline-none"
                style={{ background: 'hsl(220, 22%, 11%)', border: '1.5px solid hsl(222, 30%, 18%)', color: 'hsl(214, 32%, 91%)' }}
                placeholder="Min 8 characters" />
            </div>
            <div className="mb-4">
              <label className="block text-[11px] font-bold tracking-[1.5px] uppercase mb-1.5 text-gray-400">Confirm Password</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
                className="w-full px-4 py-3 rounded-md text-sm outline-none"
                style={{ background: 'hsl(220, 22%, 11%)', border: '1.5px solid hsl(222, 30%, 18%)', color: 'hsl(214, 32%, 91%)' }}
                placeholder="Re-enter password" />
            </div>
            <button type="submit" disabled={isLoading}
              className="w-full py-3.5 bg-primary text-primary-foreground text-sm font-black tracking-wider uppercase rounded-md disabled:opacity-50"
              style={{ boxShadow: '0 8px 24px rgba(0,212,200,0.2)' }}>
              {isLoading ? 'Updating...' : 'Update Password →'}
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
