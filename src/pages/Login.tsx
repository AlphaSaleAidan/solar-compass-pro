import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Mail, Lock, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const { loginWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password');
      return;
    }
    setIsLoading(true);
    const result = await loginWithEmail(email.trim(), password);
    if (!result.success) {
      setError(result.error || 'Invalid credentials');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97, filter: 'blur(6px)' }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-[480px] max-w-[95vw] rounded-2xl p-6 sm:p-12 backdrop-blur-2xl"
        style={{
          background: 'rgba(6,8,18,0.65)',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03), inset 0 1px 0 rgba(255,255,255,0.04)',
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

        {/* Logo & Title */}
        <div className="text-center mb-10">
          <motion.div
            className="inline-flex items-center gap-2.5"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
              <Zap className="w-6 h-6" />
            </div>
            <span className="text-[24px] font-black tracking-wider text-white">ALPHA SALE PRO</span>
          </motion.div>
          <motion.div
            className="text-[11px] tracking-[3px] uppercase mt-2 text-gray-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            SOLAR OPERATIONS PLATFORM
          </motion.div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin}>
          <motion.div
            className="mb-5"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
          >
            <label className="block text-[11px] font-bold tracking-[1.5px] uppercase mb-2 text-gray-400">Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                autoComplete="email"
                className="w-full pl-11 pr-4 py-3 rounded-lg text-sm outline-none transition-all duration-200 focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.08)', color: 'hsl(214, 32%, 91%)' }}
                placeholder="your@email.com"
              />
            </div>
          </motion.div>

          <motion.div
            className="mb-6"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35 }}
          >
            <label className="block text-[11px] font-bold tracking-[1.5px] uppercase mb-2 text-gray-400">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full pl-11 pr-11 py-3 rounded-lg text-sm outline-none transition-all duration-200 focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.08)', color: 'hsl(214, 32%, 91%)' }}
                placeholder="Enter password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </motion.div>

          <motion.button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-primary text-primary-foreground text-sm font-black tracking-wider uppercase rounded-lg disabled:opacity-50 transition-all"
            style={{ boxShadow: '0 8px 24px rgba(0,212,200,0.2)' }}
            whileHover={{ y: -1, boxShadow: '0 12px 32px rgba(0,212,200,0.3)' }}
            whileTap={{ y: 0, scale: 0.99 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <motion.div
                  className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }}
                />
                Signing In...
              </span>
            ) : 'Sign In →'}
          </motion.button>
        </form>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -5, height: 0 }}
              className="mt-4 text-xs text-center p-2.5 rounded-lg overflow-hidden"
              style={{ color: 'hsl(0, 100%, 65%)', background: 'rgba(255,77,77,0.08)', border: '1px solid rgba(255,77,77,0.2)' }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer links */}
        <motion.div
          className="mt-6 flex items-center justify-between"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
        >
          <Link to="/forgot-password" className="text-gray-500 text-xs hover:text-primary transition-colors">Forgot Password?</Link>
          <Link to="/register" className="text-primary text-xs font-bold hover:underline transition-colors">Request Access →</Link>
        </motion.div>

        {/* Version tag */}
        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <span className="text-[10px] text-gray-600 tracking-wider">ASP BETA v2.0</span>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;
