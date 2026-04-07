import { useState } from 'react';
import { useAuth, UserRole, PortalMode } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Crosshair, Settings, HardHat, Landmark, Zap, Mail, Lock, ArrowLeft } from 'lucide-react';

type LoginMode = 'select' | 'demo' | 'production';

const cardTransition = {
  initial: { opacity: 0, y: 20, scale: 0.97, filter: 'blur(6px)' },
  animate: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -10, scale: 0.98, filter: 'blur(4px)' },
  transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
};

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

  /* ─── Background (shared across modes) ──────────────────────────────── */
  const Background = ({ plus = false }: { plus?: boolean }) => (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Base gradient */}
      <div className="absolute inset-0" style={{
        background: plus
          ? 'radial-gradient(ellipse at 30% 20%, rgba(0,184,173,0.08) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(59,130,246,0.05) 0%, transparent 60%), hsl(210, 20%, 98%)'
          : 'radial-gradient(ellipse at 30% 20%, rgba(0,212,200,0.06) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(59,130,246,0.04) 0%, transparent 60%), hsl(220, 30%, 4%)'
      }} />
      {/* Subtle grid */}
      {!plus && (
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
      )}
      {/* Aurora glow */}
      {!plus && (
        <motion.div
          className="absolute top-[-20%] left-[20%] w-[60%] h-[60%] rounded-full opacity-[0.03]"
          style={{ background: 'radial-gradient(circle, rgba(0,212,200,1) 0%, transparent 70%)' }}
          animate={{ x: [0, 30, -20, 0], y: [0, -20, 10, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        />
      )}
    </div>
  );

  /* ─── Login card shell ──────────────────────────────────────────────── */
  const CardShell = ({ children, plus = false }: { children: React.ReactNode; plus?: boolean }) => (
    <div className="min-h-screen flex items-center justify-center relative">
      <Background plus={plus} />
      <AnimatePresence mode="wait">
        <motion.div
          key={loginMode + mode}
          {...cardTransition}
          className="relative w-[480px] max-w-[95vw] rounded-2xl p-12"
          style={{
            background: plus ? 'white' : 'hsl(222, 25%, 7%)',
            border: `1px solid ${plus ? 'hsl(214, 32%, 91%)' : 'hsl(222, 30%, 18%)'}`,
            boxShadow: plus
              ? '0 24px 80px rgba(0,0,0,0.08), 0 0 0 1px hsl(214, 32%, 91%)'
              : '0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px hsl(222, 30%, 18%)',
          }}
        >
          {/* Top accent line */}
          <motion.div
            className="absolute top-0 left-[10%] right-[10%] h-px"
            style={{ background: 'linear-gradient(90deg, transparent, hsl(177, 100%, 41%), transparent)' }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          />
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );

  /* ─── Mode Select ───────────────────────────────────────────────────── */
  if (loginMode === 'select') {
    return (
      <CardShell>
        <div className="text-center mb-8">
          <motion.div
            className="inline-flex items-center gap-2.5"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
              <Zap className="w-5 h-5" />
            </div>
            <span className="text-[22px] font-black tracking-wider text-white">ALPHA SALE PRO</span>
          </motion.div>
          <motion.div
            className="text-[11px] tracking-[3px] uppercase mt-1.5 text-gray-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            SOLAR OPERATIONS PLATFORM
          </motion.div>
        </div>

        <div className="space-y-4">
          {[
            {
              mode: 'production' as LoginMode,
              icon: <Mail className="w-6 h-6 text-primary" />,
              iconBg: 'bg-primary/10',
              label: 'Production Login',
              sub: 'Sign in with your email & password',
              delay: 0.35,
            },
            {
              mode: 'demo' as LoginMode,
              icon: <Lock className="w-6 h-6 text-amber-400" />,
              iconBg: 'bg-amber-500/10',
              label: 'Demo Mode',
              sub: 'Explore with test data (Test001 / ASP26!)',
              delay: 0.45,
            },
          ].map((item) => (
            <motion.button
              key={item.mode}
              onClick={() => setLoginMode(item.mode)}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: item.delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ scale: 1.01, borderColor: 'hsl(177, 100%, 41%)' }}
              whileTap={{ scale: 0.99 }}
              className="w-full p-5 rounded-xl text-left transition-all duration-200 group"
              style={{ background: 'hsl(220, 22%, 11%)', border: '2px solid hsl(222, 30%, 18%)' }}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${item.iconBg} flex items-center justify-center group-hover:scale-105 transition-transform`}>
                  {item.icon}
                </div>
                <div>
                  <div className="text-white font-extrabold text-sm">{item.label}</div>
                  <div className="text-gray-500 text-xs mt-0.5">{item.sub}</div>
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        <motion.div
          className="mt-6 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <a href="/register" className="text-primary text-xs font-bold hover:underline transition-colors">Request Access →</a>
        </motion.div>
      </CardShell>
    );
  }

  /* ─── Production Login ──────────────────────────────────────────────── */
  if (loginMode === 'production') {
    return (
      <CardShell>
        <motion.button
          onClick={() => { setLoginMode('select'); setError(''); }}
          className="flex items-center gap-1.5 text-gray-500 text-xs font-bold mb-6 hover:text-primary transition-colors"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </motion.button>

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
              className="w-full px-4 py-3 rounded-md text-sm outline-none transition-all duration-200 focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
              style={{ background: 'hsl(220, 22%, 11%)', border: '1.5px solid hsl(222, 30%, 18%)', color: 'hsl(214, 32%, 91%)' }}
              placeholder="your@email.com" />
          </div>
          <div className="mb-4">
            <label className="block text-[11px] font-bold tracking-[1.5px] uppercase mb-1.5 text-gray-400">Password</label>
            <input type="password" value={prodPassword} onChange={(e) => setProdPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-md text-sm outline-none transition-all duration-200 focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
              style={{ background: 'hsl(220, 22%, 11%)', border: '1.5px solid hsl(222, 30%, 18%)', color: 'hsl(214, 32%, 91%)' }}
              placeholder="Enter password" />
          </div>
          <motion.button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 mt-2 bg-primary text-primary-foreground text-sm font-black tracking-wider uppercase rounded-md disabled:opacity-50"
            style={{ boxShadow: '0 8px 24px rgba(0,212,200,0.2)' }}
            whileHover={{ y: -1, boxShadow: '0 12px 32px rgba(0,212,200,0.3)' }}
            whileTap={{ y: 0, scale: 0.99 }}
          >
            {isLoading ? 'Signing In...' : 'Sign In →'}
          </motion.button>
        </form>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -5, height: 0 }}
              className="mt-3 text-xs text-center p-2 rounded-md overflow-hidden"
              style={{ color: 'hsl(0, 100%, 65%)', background: 'rgba(255,77,77,0.08)', border: '1px solid rgba(255,77,77,0.2)' }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-4 text-center">
          <a href="/forgot-password" className="text-gray-500 text-xs hover:text-primary transition-colors">Forgot Password?</a>
        </div>
      </CardShell>
    );
  }

  /* ─── Demo Login ────────────────────────────────────────────────────── */
  const isPlus = mode === 'asp_plus';
  return (
    <div className={isPlus ? 'asp-plus' : ''}>
      <CardShell plus={isPlus}>
        <motion.button
          onClick={() => { setLoginMode('select'); setError(''); }}
          className={`flex items-center gap-1.5 text-xs font-bold mb-6 transition-colors ${isPlus ? 'text-gray-400 hover:text-primary' : 'text-gray-500 hover:text-primary'}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </motion.button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
              <Zap className="w-5 h-5" />
            </div>
            <span className={`text-[22px] font-black tracking-wider ${isPlus ? 'text-gray-900' : 'text-white'}`}>
              ALPHA SALE PRO {isPlus && <span className="text-primary">+</span>}
            </span>
          </div>
          <div className={`text-[11px] tracking-[3px] uppercase mt-1.5 ${isPlus ? 'text-gray-400' : 'text-gray-500'}`}>
            {isPlus ? 'DEMO MODE — ASP+' : 'DEMO MODE'}
          </div>
        </div>

        {/* Portal Toggle */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <span className={`text-xs font-bold transition-colors ${mode === 'asp' ? 'text-primary' : 'text-muted-foreground'}`}>ASP</span>
          <motion.button
            onClick={handleModeToggle}
            className="relative w-14 h-7 rounded-full"
            style={{ background: isPlus ? 'hsl(210, 20%, 93%)' : 'hsl(220, 22%, 11%)', border: '2px solid hsl(177, 100%, 41%)' }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              className="absolute top-0.5 w-5 h-5 rounded-full bg-primary"
              animate={{ x: isPlus ? 28 : 2 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </motion.button>
          <span className={`text-xs font-bold transition-colors ${isPlus ? 'text-primary' : 'text-muted-foreground'}`}>ASP+</span>
        </div>

        {/* Role Selection */}
        <div className="flex gap-3 mb-7">
          {roles.map((r, i) => (
            <motion.button
              key={r.value}
              onClick={() => setRole(r.value)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.08, duration: 0.4 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 p-4 rounded-xl text-center transition-all duration-200 relative"
              style={{
                background: role === r.value ? 'rgba(0,212,200,0.1)' : isPlus ? 'hsl(210, 20%, 96%)' : 'hsl(220, 22%, 11%)',
                border: `2px solid ${role === r.value ? 'hsl(177, 100%, 41%)' : isPlus ? 'hsl(214, 32%, 91%)' : 'hsl(222, 30%, 18%)'}`,
                boxShadow: role === r.value ? '0 0 20px rgba(0,212,200,0.15)' : 'none',
              }}
            >
              {role === r.value && (
                <motion.span
                  className="absolute top-2 right-2.5 text-primary text-xs font-black"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500 }}
                >
                  ✓
                </motion.span>
              )}
              <div className="mb-1.5 flex justify-center">{r.icon}</div>
              <div className={`text-[13px] font-extrabold tracking-wide ${isPlus ? 'text-gray-900' : 'text-white'}`}>{r.label}</div>
              <div className={`text-[11px] mt-0.5 ${isPlus ? 'text-gray-400' : 'text-gray-500'}`}>{r.sub}</div>
            </motion.button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleDemoLogin}>
          <div className="mb-4">
            <label className={`block text-[11px] font-bold tracking-[1.5px] uppercase mb-1.5 ${isPlus ? 'text-gray-500' : 'text-gray-400'}`}>Username</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-md text-sm transition-all duration-200 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
              style={{ background: isPlus ? 'hsl(210, 20%, 96%)' : 'hsl(220, 22%, 11%)', border: `1.5px solid ${isPlus ? 'hsl(214, 32%, 91%)' : 'hsl(222, 30%, 18%)'}`, color: isPlus ? 'hsl(222, 47%, 11%)' : 'hsl(214, 32%, 91%)' }}
              placeholder="Enter username" />
          </div>
          <div className="mb-4">
            <label className={`block text-[11px] font-bold tracking-[1.5px] uppercase mb-1.5 ${isPlus ? 'text-gray-500' : 'text-gray-400'}`}>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-md text-sm transition-all duration-200 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
              style={{ background: isPlus ? 'hsl(210, 20%, 96%)' : 'hsl(220, 22%, 11%)', border: `1.5px solid ${isPlus ? 'hsl(214, 32%, 91%)' : 'hsl(222, 30%, 18%)'}`, color: isPlus ? 'hsl(222, 47%, 11%)' : 'hsl(214, 32%, 91%)' }}
              placeholder="Enter password" />
          </div>
          <motion.button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 mt-2 bg-primary text-primary-foreground text-sm font-black tracking-wider uppercase rounded-md disabled:opacity-50"
            style={{ boxShadow: '0 8px 24px rgba(0,212,200,0.2)' }}
            whileHover={{ y: -1, boxShadow: '0 12px 32px rgba(0,212,200,0.3)' }}
            whileTap={{ y: 0, scale: 0.99 }}
          >
            {isLoading ? 'Loading...' : 'Enter Demo →'}
          </motion.button>
        </form>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -5, height: 0 }}
              className="mt-3 text-xs text-center p-2 rounded-md overflow-hidden"
              style={{ color: 'hsl(0, 100%, 65%)', background: 'rgba(255,77,77,0.08)', border: '1px solid rgba(255,77,77,0.2)' }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </CardShell>
    </div>
  );
};

export default Login;
