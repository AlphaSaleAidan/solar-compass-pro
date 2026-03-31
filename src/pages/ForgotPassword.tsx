import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Zap, ArrowLeft, Loader2, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{
      background: 'radial-gradient(ellipse at 30% 20%, rgba(0,212,200,0.06) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(59,130,246,0.04) 0%, transparent 60%), hsl(220, 30%, 4%)',
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

        {sent ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-lg font-black text-white mb-2">Check Your Email</h2>
            <p className="text-sm text-muted-foreground mb-6">
              If an account exists for <span className="text-primary font-bold">{email}</span>, we've sent a password reset link.
            </p>
            <Link to="/login" className="text-primary text-sm font-bold hover:underline inline-flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
            </Link>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-black text-white text-center mb-2">Reset Password</h2>
            <p className="text-sm text-muted-foreground text-center mb-6">Enter your email and we'll send you a reset link.</p>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-[11px] font-bold tracking-[1.5px] uppercase mb-1.5 text-gray-400">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-md text-sm outline-none"
                  style={{ background: 'hsl(220, 22%, 11%)', border: '1.5px solid hsl(222, 30%, 18%)', color: 'hsl(214, 32%, 91%)' }}
                  placeholder="Enter your email"
                  required
                />
              </div>
              <button type="submit" disabled={isLoading}
                className="w-full py-3.5 mt-2 bg-primary text-primary-foreground text-sm font-black tracking-wider uppercase rounded-md transition-all hover:-translate-y-px disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ boxShadow: '0 8px 24px rgba(0,212,200,0.2)' }}>
                {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : 'Send Reset Link →'}
              </button>
            </form>
            {error && (
              <div className="mt-3 text-xs text-center p-2 rounded-md" style={{ color: 'hsl(0, 100%, 65%)', background: 'rgba(255,77,77,0.08)', border: '1px solid rgba(255,77,77,0.2)' }}>
                {error}
              </div>
            )}
            <div className="mt-4 text-center">
              <Link to="/login" className="text-primary text-xs font-bold hover:underline inline-flex items-center gap-1">
                <ArrowLeft className="w-3 h-3" /> Back to Login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
