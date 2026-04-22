import { Link } from 'react-router-dom';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Zap, ArrowLeft } from 'lucide-react';

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
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: 'radial-gradient(ellipse at 30% 20%, rgba(0,212,200,0.06) 0%, transparent 60%), hsl(220, 30%, 4%)' }}>
      <div className="w-[480px] max-w-[95vw] rounded-2xl p-12"
        style={{ background: 'hsl(222, 25%, 7%)', border: '1px solid hsl(222, 30%, 18%)' }}>
        <Link to="/login" className="flex items-center gap-1.5 text-gray-500 text-xs font-bold mb-6 hover:text-primary transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
        </Link>
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
              <Zap className="w-5 h-5" />
            </div>
            <span className="text-[22px] font-black tracking-wider text-white">RESET PASSWORD</span>
          </div>
        </div>

        {sent ? (
          <div className="text-center">
            <p className="text-gray-400 text-sm">Check your email for a password reset link.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-[11px] font-bold tracking-[1.5px] uppercase mb-1.5 text-gray-400">Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required
                className="w-full px-4 py-3 rounded-md text-sm outline-none"
                style={{ background: 'hsl(220, 22%, 11%)', border: '1.5px solid hsl(222, 30%, 18%)', color: 'hsl(214, 32%, 91%)' }}
                placeholder="your@email.com" />
            </div>
            <button type="submit" disabled={isLoading}
              className="w-full py-3.5 bg-primary text-primary-foreground text-sm font-black tracking-wider uppercase rounded-md disabled:opacity-50"
              style={{ boxShadow: '0 8px 24px rgba(0,212,200,0.2)' }}>
              {isLoading ? 'Sending...' : 'Send Reset Link →'}
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

export default ForgotPassword;
