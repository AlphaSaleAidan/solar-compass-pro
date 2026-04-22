import { useState } from 'react';
import { Zap, ArrowLeft, CheckCircle, Mail } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://solar-compass-pro-production.up.railway.app';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
      } else {
        setSent(true);
      }
    } catch {
      setError('Could not reach the server. Please try again later.');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: 'radial-gradient(ellipse at 30% 20%, rgba(0,212,200,0.06) 0%, transparent 60%), hsl(220, 30%, 4%)' }}>
      <div className="w-[480px] max-w-[95vw] rounded-2xl p-12"
        style={{ background: 'hsl(222, 25%, 7%)', border: '1px solid hsl(222, 30%, 18%)' }}>
        <a href="/" className="flex items-center gap-1.5 text-gray-500 text-xs font-bold mb-6 hover:text-primary transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
        </a>
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
              <Zap className="w-5 h-5" />
            </div>
            <span className="text-[22px] font-black tracking-wider text-white">RESET PASSWORD</span>
          </div>
        </div>

        {sent ? (
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-2"
              style={{ background: 'rgba(0,212,200,0.1)', border: '2px solid rgba(0,212,200,0.2)' }}>
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-bold text-white">Check your email</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              We've sent a password reset link to<br />
              <span className="text-gray-300 font-semibold">{email}</span>
            </p>
            <div className="pt-2 space-y-2">
              <p className="text-gray-500 text-xs">
                Didn't get it? Check your spam folder or{' '}
                <button onClick={() => { setSent(false); setError(''); }} className="text-primary hover:underline font-bold">
                  try again
                </button>
              </p>
              <a href="/" className="block text-gray-500 text-xs hover:text-primary transition-colors">
                ← Back to Login
              </a>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <p className="text-gray-400 text-sm mb-6">
              Enter the email address associated with your account and we'll send you a link to reset your password.
            </p>
            <div className="mb-4">
              <label className="block text-[11px] font-bold tracking-[1.5px] uppercase mb-1.5 text-gray-400">Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required
                className="w-full px-4 py-3 rounded-md text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                style={{ background: 'hsl(220, 22%, 11%)', border: '1.5px solid hsl(222, 30%, 18%)', color: 'hsl(214, 32%, 91%)' }}
                placeholder="your@email.com" />
            </div>
            <button type="submit" disabled={isLoading}
              className="w-full py-3.5 bg-primary text-primary-foreground text-sm font-black tracking-wider uppercase rounded-md disabled:opacity-50 transition-all hover:brightness-110"
              style={{ boxShadow: '0 8px 24px rgba(0,212,200,0.2)' }}>
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Sending...
                </span>
              ) : 'Send Reset Link →'}
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
