import { useState } from 'react';
import { useAuth, PortalMode } from '@/contexts/AuthContext';
import { Zap, Loader2 } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<PortalMode>('asp');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    const result = await login(email, password);
    if (!result.success) {
      setError(result.error || 'Invalid credentials');
    }
    setIsLoading(false);
  };

  const handleModeToggle = () => {
    setMode(mode === 'asp' ? 'asp_plus' : 'asp');
  };

  return (
    <div className={mode === 'asp_plus' ? 'asp-plus' : ''}>
      <div
        className="min-h-screen flex items-center justify-center relative overflow-hidden"
        style={{
          background: mode === 'asp'
            ? 'radial-gradient(ellipse at 30% 20%, rgba(0,212,200,0.06) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(59,130,246,0.04) 0%, transparent 60%), hsl(220, 30%, 4%)'
            : 'radial-gradient(ellipse at 30% 20%, rgba(0,184,173,0.08) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(59,130,246,0.05) 0%, transparent 60%), hsl(210, 20%, 98%)',
        }}
      >
        <div
          className="w-[480px] max-w-[95vw] rounded-2xl p-12 relative animate-scale-in"
          style={{
            background: mode === 'asp' ? 'hsl(222, 25%, 7%)' : 'white',
            border: `1px solid ${mode === 'asp' ? 'hsl(222, 30%, 18%)' : 'hsl(214, 32%, 91%)'}`,
            boxShadow: mode === 'asp'
              ? '0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px hsl(222, 30%, 18%)'
              : '0 24px 80px rgba(0,0,0,0.08), 0 0 0 1px hsl(214, 32%, 91%)',
          }}
        >
          {/* Teal line accent */}
          <div
            className="absolute top-0 left-[10%] right-[10%] h-px"
            style={{ background: 'linear-gradient(90deg, transparent, hsl(177, 100%, 41%), transparent)' }}
          />

          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2.5">
              <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
                <Zap className="w-5 h-5" />
              </div>
              <span className={`text-[22px] font-black tracking-wider ${mode === 'asp' ? 'text-white' : 'text-gray-900'}`}>
                ALPHA SALE PRO {mode === 'asp_plus' && <span className="text-primary">+</span>}
              </span>
            </div>
            <div className={`text-[11px] tracking-[3px] uppercase mt-1.5 ${mode === 'asp' ? 'text-gray-500' : 'text-gray-400'}`}>
              {mode === 'asp' ? 'SOLAR OPERATIONS PLATFORM' : 'INSTALLER & FINANCIER PORTAL'}
            </div>
          </div>

          {/* Portal Toggle */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className={`text-xs font-bold ${mode === 'asp' ? 'text-primary' : 'text-muted-foreground'}`}>ASP</span>
            <button
              onClick={handleModeToggle}
              className="relative w-14 h-7 rounded-full transition-colors duration-300"
              style={{
                background: mode === 'asp' ? 'hsl(220, 22%, 11%)' : 'hsl(210, 20%, 93%)',
                border: `2px solid ${mode === 'asp' ? 'hsl(177, 100%, 41%)' : 'hsl(177, 100%, 36%)'}`,
              }}
            >
              <div
                className="absolute top-0.5 w-5 h-5 rounded-full bg-primary transition-transform duration-300"
                style={{ transform: mode === 'asp_plus' ? 'translateX(28px)' : 'translateX(2px)' }}
              />
            </button>
            <span className={`text-xs font-bold ${mode === 'asp_plus' ? 'text-primary' : 'text-muted-foreground'}`}>ASP+</span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className={`block text-[11px] font-bold tracking-[1.5px] uppercase mb-1.5 ${mode === 'asp' ? 'text-gray-400' : 'text-gray-500'}`}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-md text-sm transition-colors duration-200 outline-none"
                style={{
                  background: mode === 'asp' ? 'hsl(220, 22%, 11%)' : 'hsl(210, 20%, 96%)',
                  border: `1.5px solid ${mode === 'asp' ? 'hsl(222, 30%, 18%)' : 'hsl(214, 32%, 91%)'}`,
                  color: mode === 'asp' ? 'hsl(214, 32%, 91%)' : 'hsl(222, 47%, 11%)',
                }}
                placeholder="Enter email"
                required
              />
            </div>
            <div className="mb-4">
              <label className={`block text-[11px] font-bold tracking-[1.5px] uppercase mb-1.5 ${mode === 'asp' ? 'text-gray-400' : 'text-gray-500'}`}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-md text-sm transition-colors duration-200 outline-none"
                style={{
                  background: mode === 'asp' ? 'hsl(220, 22%, 11%)' : 'hsl(210, 20%, 96%)',
                  border: `1.5px solid ${mode === 'asp' ? 'hsl(222, 30%, 18%)' : 'hsl(214, 32%, 91%)'}`,
                  color: mode === 'asp' ? 'hsl(214, 32%, 91%)' : 'hsl(222, 47%, 11%)',
                }}
                placeholder="Enter password"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 mt-2 bg-primary text-primary-foreground text-sm font-black tracking-wider uppercase rounded-md transition-all duration-200 hover:-translate-y-px active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ boxShadow: '0 8px 24px rgba(0,212,200,0.2)' }}
            >
              {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing In...</> : 'Sign In →'}
            </button>
          </form>

          {error && (
            <div className="mt-3 text-xs text-center p-2 rounded-md" style={{
              color: 'hsl(0, 100%, 65%)',
              background: 'rgba(255,77,77,0.08)',
              border: '1px solid rgba(255,77,77,0.2)',
            }}>
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
