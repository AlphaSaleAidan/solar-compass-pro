import { useState } from 'react';
import { useAuth, PortalMode, UserRole } from '@/contexts/AuthContext';
import { Zap, Loader2, Crosshair, Settings, HardHat, Landmark, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

type LoginPortal = {
  role: UserRole;
  label: string;
  subtitle: string;
  icon: typeof Crosshair;
  mode: PortalMode;
  gradient: string;
  borderColor: string;
};

const PORTALS: LoginPortal[] = [
  {
    role: 'sales_rep',
    label: 'Sales Rep',
    subtitle: 'Close deals & manage pipeline',
    icon: Crosshair,
    mode: 'asp',
    gradient: 'linear-gradient(135deg, hsla(177, 100%, 41%, 0.12), hsla(177, 100%, 41%, 0.03))',
    borderColor: 'hsla(177, 100%, 41%, 0.3)',
  },
  {
    role: 'backend_ops',
    label: 'Backend Ops',
    subtitle: 'QC, approvals & milestones',
    icon: Settings,
    mode: 'asp',
    gradient: 'linear-gradient(135deg, hsla(217, 91%, 60%, 0.12), hsla(217, 91%, 60%, 0.03))',
    borderColor: 'hsla(217, 91%, 60%, 0.3)',
  },
  {
    role: 'installer',
    label: 'Installer',
    subtitle: 'Projects, milestones & payments',
    icon: HardHat,
    mode: 'asp_plus',
    gradient: 'linear-gradient(135deg, hsla(177, 100%, 36%, 0.12), hsla(177, 100%, 36%, 0.03))',
    borderColor: 'hsla(177, 100%, 36%, 0.3)',
  },
  {
    role: 'financier',
    label: 'Financier',
    subtitle: 'Portfolio, escrow & fund releases',
    icon: Landmark,
    mode: 'asp_plus',
    gradient: 'linear-gradient(135deg, hsla(45, 93%, 47%, 0.12), hsla(45, 93%, 47%, 0.03))',
    borderColor: 'hsla(45, 93%, 47%, 0.3)',
  },
];

const Login = () => {
  const { login, setActiveRole } = useAuth();
  const [selectedPortal, setSelectedPortal] = useState<LoginPortal | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPortal) return;
    setError('');
    setIsLoading(true);
    const result = await login(email, password);
    if (!result.success) {
      setError(result.error || 'Invalid credentials');
    } else {
      setTimeout(() => setActiveRole(selectedPortal.role), 100);
    }
    setIsLoading(false);
  };

  const isPlus = selectedPortal?.mode === 'asp_plus';
  const isDark = !selectedPortal || !isPlus;

  return (
    <div className={isPlus ? 'asp-plus' : ''}>
      <div
        className="min-h-screen flex items-center justify-center relative overflow-hidden"
        style={{
          background: isDark
            ? 'radial-gradient(ellipse at 30% 20%, rgba(0,212,200,0.06) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(59,130,246,0.04) 0%, transparent 60%), hsl(220, 30%, 4%)'
            : 'radial-gradient(ellipse at 30% 20%, rgba(0,184,173,0.08) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(59,130,246,0.05) 0%, transparent 60%), hsl(210, 20%, 98%)',
          transition: 'background 0.4s ease',
        }}
      >
        {/* Register Button */}
        <Link
          to="/register"
          className="fixed top-5 right-5 z-50 px-5 py-2.5 text-xs font-black tracking-wider uppercase rounded-lg transition-all hover:-translate-y-px"
          style={{
            background: isDark ? 'hsl(220, 22%, 11%)' : 'white',
            border: `1.5px solid ${isDark ? 'hsl(177, 100%, 41%)' : 'hsl(177, 100%, 36%)'}`,
            color: isDark ? 'hsl(177, 100%, 41%)' : 'hsl(177, 100%, 36%)',
            boxShadow: '0 4px 16px rgba(0,212,200,0.15)',
          }}
        >
          Register →
        </Link>

        <div
          className="w-[520px] max-w-[95vw] rounded-2xl p-10 relative animate-scale-in"
          style={{
            background: isDark ? 'hsl(222, 25%, 7%)' : 'white',
            border: `1px solid ${isDark ? 'hsl(222, 30%, 18%)' : 'hsl(214, 32%, 91%)'}`,
            boxShadow: isDark
              ? '0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px hsl(222, 30%, 18%)'
              : '0 24px 80px rgba(0,0,0,0.08), 0 0 0 1px hsl(214, 32%, 91%)',
            transition: 'all 0.4s ease',
          }}
        >
          <div className="absolute top-0 left-[10%] right-[10%] h-px" style={{ background: 'linear-gradient(90deg, transparent, hsl(177, 100%, 41%), transparent)' }} />

          {/* Logo */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2.5">
              <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
                <Zap className="w-5 h-5" />
              </div>
              <span className={`text-[22px] font-black tracking-wider ${isDark ? 'text-white' : 'text-gray-900'}`}>
                ALPHA SALE PRO {isPlus && <span className="text-primary">+</span>}
              </span>
            </div>
            <div className={`text-[11px] tracking-[3px] uppercase mt-1.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              {selectedPortal
                ? selectedPortal.mode === 'asp' ? 'SOLAR OPERATIONS PLATFORM' : 'INSTALLER & FINANCIER PORTAL'
                : 'SELECT YOUR PORTAL'}
            </div>
          </div>

          {/* Portal Selection or Login Form */}
          {!selectedPortal ? (
            <>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {PORTALS.map((portal) => {
                  const Icon = portal.icon;
                  return (
                    <button
                      key={portal.role}
                      onClick={() => setSelectedPortal(portal)}
                      className="group relative flex flex-col items-center gap-2.5 p-5 rounded-xl cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                      style={{
                        background: portal.gradient,
                        border: `1.5px solid ${portal.borderColor}`,
                      }}
                    >
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 group-hover:scale-110"
                        style={{
                          background: isDark ? 'hsl(220, 22%, 11%)' : 'white',
                          border: `2px solid ${portal.borderColor}`,
                        }}
                      >
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="text-center">
                        <div className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{portal.label}</div>
                        <div className={`text-[10px] mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{portal.subtitle}</div>
                      </div>
                      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ boxShadow: `0 0 20px ${portal.borderColor}` }} />
                    </button>
                  );
                })}
              </div>
              <div className={`text-center text-[10px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                Select a portal to sign in
              </div>
            </>
          ) : (
            <>
              {/* Back button */}
              <button
                onClick={() => { setSelectedPortal(null); setError(''); }}
                className={`flex items-center gap-1.5 mb-5 text-xs font-bold transition-colors ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to portals
              </button>

              {/* Selected portal indicator */}
              <div className="flex items-center justify-center gap-3 mb-6 p-3 rounded-xl" style={{ background: selectedPortal.gradient, border: `1.5px solid ${selectedPortal.borderColor}` }}>
                <selectedPortal.icon className="w-5 h-5 text-primary" />
                <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Signing in as {selectedPortal.label}
                </span>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className={`block text-[11px] font-bold tracking-[1.5px] uppercase mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-md text-sm transition-colors duration-200 outline-none"
                    style={{
                      background: isDark ? 'hsl(220, 22%, 11%)' : 'hsl(210, 20%, 96%)',
                      border: `1.5px solid ${isDark ? 'hsl(222, 30%, 18%)' : 'hsl(214, 32%, 91%)'}`,
                      color: isDark ? 'hsl(214, 32%, 91%)' : 'hsl(222, 47%, 11%)',
                    }}
                    placeholder="Enter email" required />
                </div>
                <div className="mb-2">
                  <label className={`block text-[11px] font-bold tracking-[1.5px] uppercase mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Password</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-md text-sm transition-colors duration-200 outline-none"
                    style={{
                      background: isDark ? 'hsl(220, 22%, 11%)' : 'hsl(210, 20%, 96%)',
                      border: `1.5px solid ${isDark ? 'hsl(222, 30%, 18%)' : 'hsl(214, 32%, 91%)'}`,
                      color: isDark ? 'hsl(214, 32%, 91%)' : 'hsl(222, 47%, 11%)',
                    }}
                    placeholder="Enter password" required />
                </div>
                <div className="text-right mb-4">
                  <Link to="/forgot-password" className="text-[11px] font-bold text-primary hover:underline">
                    Forgot Password?
                  </Link>
                </div>
                <button type="submit" disabled={isLoading}
                  className="w-full py-3.5 bg-primary text-primary-foreground text-sm font-black tracking-wider uppercase rounded-md transition-all duration-200 hover:-translate-y-px active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ boxShadow: '0 8px 24px rgba(0,212,200,0.2)' }}>
                  {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing In...</> : `Sign In →`}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
