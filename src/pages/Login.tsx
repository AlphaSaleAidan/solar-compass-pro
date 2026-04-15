import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, UserRole, PortalMode } from '@/contexts/AuthContext';
import { Crosshair, Settings, HardHat, Landmark, Zap, Mail, Lock, ArrowLeft } from 'lucide-react';

type LoginMode = 'select' | 'demo' | 'production';

const Login = () => {
  const { login, loginWithEmail } = useAuth();
  const [loginMode, setLoginMode] = useState<LoginMode>('select');
  
  // Demo state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('sales_rep');
  const [mode, setMode] = useState<PortalMode>('asp');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Production state
  const [email, setEmail] = useState('');
  const [prodPassword, setProdPassword] = useState('');

  const aspRoles: { value: UserRole; icon: React.ReactNode; label: string; sub: string }[] = [
    { value: 'sales_rep', icon: <Crosshair className="w-7 h-7 text-primary" />, label: 'Sales Rep', sub: 'Deals & Pipeline' },
    { value: 'backend_ops', icon: <Settings className="w-7 h-7 text-primary" />, label: 'Backend Ops', sub: 'QC & Operations' },
  ];

  const aspPlusRoles: { value: UserRole; icon: React.ReactNode; label: string; sub: string }[] = [
    { value: 'installer', icon: <HardHat className="w-7 h-7 text-primary" />, label: 'Installer', sub: 'Project Tracking' },
    { value: 'financier', icon: <Landmark className="w-7 h-7 text-primary" />, label: 'Financier', sub: 'Funding & Escrow' },
  ];

  const roles = mode === 'asp' ? aspRoles : aspPlusRoles;

  const handleDemoLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    const success = await login(username, password, role, mode);
    if (!success) {
      setError('Invalid credentials. Try Test001 / ASP26!');
    }
    setIsLoading(false);
  };

  const handleProductionLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    const result = await loginWithEmail(email, prodPassword);
    if (!result.success) {
      setError(result.error || 'Login failed');
    }
    setIsLoading(false);
  };

  const handleModeToggle = () => {
    const newMode = mode === 'asp' ? 'asp_plus' : 'asp';
    setMode(newMode);
    setRole(newMode === 'asp' ? 'sales_rep' : 'installer');
  };

  // Select screen - choose demo or production
  if (loginMode === 'select') {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
        style={{ background: 'radial-gradient(ellipse at 30% 20%, rgba(0,212,200,0.06) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(59,130,246,0.04) 0%, transparent 60%), hsl(220, 30%, 4%)' }}>
        <div className="w-[480px] max-w-[95vw] rounded-2xl p-12 relative animate-scale-in"
          style={{ background: 'hsl(222, 25%, 7%)', border: '1px solid hsl(222, 30%, 18%)', boxShadow: '0 24px 80px rgba(0,0,0,0.7)' }}>
          <div className="absolute top-0 left-[10%] right-[10%] h-px" style={{ background: 'linear-gradient(90deg, transparent, hsl(177, 100%, 41%), transparent)' }} />
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2.5">
              <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
                <Zap className="w-5 h-5" />
              </div>
              <span className="text-[22px] font-black tracking-wider text-white">ALPHA SALE PRO</span>
            </div>
            <div className="text-[11px] tracking-[3px] uppercase mt-1.5 text-gray-500">SOLAR OPERATIONS PLATFORM</div>
          </div>

          <div className="space-y-4">
            <button onClick={() => setLoginMode('production')}
              className="w-full p-5 rounded-xl text-left transition-all duration-200 group"
              style={{ background: 'hsl(220, 22%, 11%)', border: '2px solid hsl(222, 30%, 18%)' }}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="text-white font-extrabold text-sm">Production Login</div>
                  <div className="text-gray-500 text-xs mt-0.5">Sign in with your email & password</div>
                </div>
              </div>
            </button>

            <button onClick={() => setLoginMode('demo')}
              className="w-full p-5 rounded-xl text-left transition-all duration-200 group"
              style={{ background: 'hsl(220, 22%, 11%)', border: '2px solid hsl(222, 30%, 18%)' }}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Lock className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <div className="text-white font-extrabold text-sm">Demo Mode</div>
                  <div className="text-gray-500 text-xs mt-0.5">Explore with test data (Test001 / ASP26!)</div>
                </div>
              </div>
            </button>
          </div>

          <div className="mt-6 text-center">
            <Link to="/register" className="text-primary text-xs font-bold hover:underline">Request Access →</Link>
          </div>
        </div>
      </div>
    );
  }

  // Production login
  if (loginMode === 'production') {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
        style={{ background: 'radial-gradient(ellipse at 30% 20%, rgba(0,212,200,0.06) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(59,130,246,0.04) 0%, transparent 60%), hsl(220, 30%, 4%)' }}>
        <div className="w-[480px] max-w-[95vw] rounded-2xl p-12 relative animate-scale-in"
          style={{ background: 'hsl(222, 25%, 7%)', border: '1px solid hsl(222, 30%, 18%)', boxShadow: '0 24px 80px rgba(0,0,0,0.7)' }}>
          <div className="absolute top-0 left-[10%] right-[10%] h-px" style={{ background: 'linear-gradient(90deg, transparent, hsl(177, 100%, 41%), transparent)' }} />

          <button onClick={() => { setLoginMode('select'); setError(''); }}
            className="flex items-center gap-1.5 text-gray-500 text-xs font-bold mb-6 hover:text-primary transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>

          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2.5">
              <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
                <Zap className="w-5 h-5" />
              </div>
              <span className="text-[22px] font-black tracking-wider text-white">ALPHA SALE PRO</span>
            </div>
            <div className="text-[11px] tracking-[3px] uppercase mt-1.5 text-gray-500">PRODUCTION LOGIN</div>
          </div>

          <form onSubmit={handleProductionLogin}>
            <div className="mb-4">
              <label className="block text-[11px] font-bold tracking-[1.5px] uppercase mb-1.5 text-gray-400">Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email"
                className="w-full px-4 py-3 rounded-md text-sm outline-none"
                style={{ background: 'hsl(220, 22%, 11%)', border: '1.5px solid hsl(222, 30%, 18%)', color: 'hsl(214, 32%, 91%)' }}
                placeholder="your@email.com" />
            </div>
            <div className="mb-4">
              <label className="block text-[11px] font-bold tracking-[1.5px] uppercase mb-1.5 text-gray-400">Password</label>
              <input type="password" value={prodPassword} onChange={(e) => setProdPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-md text-sm outline-none"
                style={{ background: 'hsl(220, 22%, 11%)', border: '1.5px solid hsl(222, 30%, 18%)', color: 'hsl(214, 32%, 91%)' }}
                placeholder="Enter password" />
            </div>
            <button type="submit" disabled={isLoading}
              className="w-full py-3.5 mt-2 bg-primary text-primary-foreground text-sm font-black tracking-wider uppercase rounded-md transition-all duration-200 hover:-translate-y-px active:translate-y-0 disabled:opacity-50"
              style={{ boxShadow: '0 8px 24px rgba(0,212,200,0.2)' }}>
              {isLoading ? 'Signing In...' : 'Sign In →'}
            </button>
          </form>

          {error && (
            <div className="mt-3 text-xs text-center p-2 rounded-md"
              style={{ color: 'hsl(0, 100%, 65%)', background: 'rgba(255,77,77,0.08)', border: '1px solid rgba(255,77,77,0.2)' }}>
              {error}
            </div>
          )}

          <div className="mt-4 text-center">
            <Link to="/forgot-password" className="text-gray-500 text-xs hover:text-primary transition-colors">Forgot Password?</Link>
          </div>
        </div>
      </div>
    );
  }

  // Demo login (original interface)
  return (
    <div className={mode === 'asp_plus' ? 'asp-plus' : ''}>
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
        style={{
          background: mode === 'asp'
            ? 'radial-gradient(ellipse at 30% 20%, rgba(0,212,200,0.06) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(59,130,246,0.04) 0%, transparent 60%), hsl(220, 30%, 4%)'
            : 'radial-gradient(ellipse at 30% 20%, rgba(0,184,173,0.08) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(59,130,246,0.05) 0%, transparent 60%), hsl(210, 20%, 98%)',
        }}>
        <div className="w-[480px] max-w-[95vw] rounded-2xl p-12 relative animate-scale-in"
          style={{
            background: mode === 'asp' ? 'hsl(222, 25%, 7%)' : 'white',
            border: `1px solid ${mode === 'asp' ? 'hsl(222, 30%, 18%)' : 'hsl(214, 32%, 91%)'}`,
            boxShadow: mode === 'asp' ? '0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px hsl(222, 30%, 18%)' : '0 24px 80px rgba(0,0,0,0.08), 0 0 0 1px hsl(214, 32%, 91%)',
          }}>
          <div className="absolute top-0 left-[10%] right-[10%] h-px" style={{ background: 'linear-gradient(90deg, transparent, hsl(177, 100%, 41%), transparent)' }} />

          <button onClick={() => { setLoginMode('select'); setError(''); }}
            className={`flex items-center gap-1.5 text-xs font-bold mb-6 transition-colors ${mode === 'asp' ? 'text-gray-500 hover:text-primary' : 'text-gray-400 hover:text-primary'}`}>
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>

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
              {mode === 'asp' ? 'DEMO MODE' : 'DEMO MODE — ASP+'}
            </div>
          </div>

          {/* Portal Toggle */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className={`text-xs font-bold ${mode === 'asp' ? 'text-primary' : 'text-muted-foreground'}`}>ASP</span>
            <button onClick={handleModeToggle}
              className="relative w-14 h-7 rounded-full transition-colors duration-300"
              style={{ background: mode === 'asp' ? 'hsl(220, 22%, 11%)' : 'hsl(210, 20%, 93%)', border: `2px solid hsl(177, 100%, ${mode === 'asp' ? '41' : '36'}%)` }}>
              <div className="absolute top-0.5 w-5 h-5 rounded-full bg-primary transition-transform duration-300"
                style={{ transform: mode === 'asp_plus' ? 'translateX(28px)' : 'translateX(2px)' }} />
            </button>
            <span className={`text-xs font-bold ${mode === 'asp_plus' ? 'text-primary' : 'text-muted-foreground'}`}>ASP+</span>
          </div>

          {/* Role Selection */}
          <div className="flex gap-3 mb-7">
            {roles.map((r) => (
              <button key={r.value} onClick={() => setRole(r.value)}
                className="flex-1 p-4 rounded-xl text-center transition-all duration-200 relative"
                style={{
                  background: role === r.value ? 'rgba(0,212,200,0.1)' : mode === 'asp' ? 'hsl(220, 22%, 11%)' : 'hsl(210, 20%, 96%)',
                  border: `2px solid ${role === r.value ? 'hsl(177, 100%, 41%)' : mode === 'asp' ? 'hsl(222, 30%, 18%)' : 'hsl(214, 32%, 91%)'}`,
                  boxShadow: role === r.value ? '0 0 20px rgba(0,212,200,0.15)' : 'none',
                }}>
                {role === r.value && <span className="absolute top-2 right-2.5 text-primary text-xs font-black">✓</span>}
                <div className="mb-1.5 flex justify-center">{r.icon}</div>
                <div className={`text-[13px] font-extrabold tracking-wide ${mode === 'asp' ? 'text-white' : 'text-gray-900'}`}>{r.label}</div>
                <div className={`text-[11px] mt-0.5 ${mode === 'asp' ? 'text-gray-500' : 'text-gray-400'}`}>{r.sub}</div>
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleDemoLogin}>
            <div className="mb-4">
              <label className={`block text-[11px] font-bold tracking-[1.5px] uppercase mb-1.5 ${mode === 'asp' ? 'text-gray-400' : 'text-gray-500'}`}>Username</label>
              <input value={username} onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-md text-sm transition-colors duration-200 outline-none"
                style={{ background: mode === 'asp' ? 'hsl(220, 22%, 11%)' : 'hsl(210, 20%, 96%)', border: `1.5px solid ${mode === 'asp' ? 'hsl(222, 30%, 18%)' : 'hsl(214, 32%, 91%)'}`, color: mode === 'asp' ? 'hsl(214, 32%, 91%)' : 'hsl(222, 47%, 11%)' }}
                placeholder="Enter username" />
            </div>
            <div className="mb-4">
              <label className={`block text-[11px] font-bold tracking-[1.5px] uppercase mb-1.5 ${mode === 'asp' ? 'text-gray-400' : 'text-gray-500'}`}>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-md text-sm transition-colors duration-200 outline-none"
                style={{ background: mode === 'asp' ? 'hsl(220, 22%, 11%)' : 'hsl(210, 20%, 96%)', border: `1.5px solid ${mode === 'asp' ? 'hsl(222, 30%, 18%)' : 'hsl(214, 32%, 91%)'}`, color: mode === 'asp' ? 'hsl(214, 32%, 91%)' : 'hsl(222, 47%, 11%)' }}
                placeholder="Enter password" />
            </div>
            <button type="submit" disabled={isLoading}
              className="w-full py-3.5 mt-2 bg-primary text-primary-foreground text-sm font-black tracking-wider uppercase rounded-md transition-all duration-200 hover:-translate-y-px active:translate-y-0 disabled:opacity-50"
              style={{ boxShadow: '0 8px 24px rgba(0,212,200,0.2)' }}>
              {isLoading ? 'Loading...' : 'Enter Demo →'}
            </button>
          </form>

          {error && (
            <div className="mt-3 text-xs text-center p-2 rounded-md"
              style={{ color: 'hsl(0, 100%, 65%)', background: 'rgba(255,77,77,0.08)', border: '1px solid rgba(255,77,77,0.2)' }}>
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
