import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ArrowLeft, CheckCircle, ShieldCheck } from 'lucide-react';
import type { UserRole } from '@/contexts/AuthContext';

const Register = () => {
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('invite');
  const inviteRole = searchParams.get('role') as UserRole | null;
  const inviteEmail = searchParams.get('email');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState(inviteEmail || '');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [entityName, setEntityName] = useState('');
  const [requestedRole, setRequestedRole] = useState<UserRole>(inviteRole || 'sales_rep');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [inviteValid, setInviteValid] = useState<boolean | null>(inviteToken ? null : false);

  // Validate invite token on mount
  useEffect(() => {
    if (!inviteToken) return;
    (async () => {
      const { data } = await supabase
        .from('invitations')
        .select('*')
        .eq('token', inviteToken)
        .is('accepted_at', null)
        .maybeSingle();
      if (data) {
        setInviteValid(true);
        setEmail(data.email);
        setRequestedRole((data.role === 'master_admin' ? 'master' : data.role) as UserRole);
      } else {
        setInviteValid(false);
      }
    })();
  }, [inviteToken]);

  const roleOptions: { value: UserRole; label: string; needsEntity: boolean }[] = [
    { value: 'sales_rep', label: 'Sales Rep', needsEntity: false },
    { value: 'installer', label: 'Installer', needsEntity: true },
    { value: 'financier', label: 'Financier', needsEntity: true },
  ];

  const selectedRoleOption = roleOptions.find(r => r.value === requestedRole);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (inviteToken && inviteValid) {
      // Invited user: create Supabase auth account directly
      if (!password || password.length < 8) {
        setError('Password must be at least 8 characters');
        setIsLoading(false);
        return;
      }
      if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
        setError('Password must include at least one uppercase letter and one number');
        setIsLoading(false);
        return;
      }
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone,
            entity_name: entityName || null,
            role: requestedRole,
          },
        },
      });
      if (signUpError) {
        setError(signUpError.message);
        setIsLoading(false);
        return;
      }
      // Mark invitation as accepted
      await supabase.from('invitations').update({
        accepted_at: new Date().toISOString(),
      }).eq('token', inviteToken);
      // Assign role
      if (signUpData.user) {
        const dbRole = requestedRole === 'master' ? 'master_admin' : requestedRole;
        await supabase.from('user_roles').insert({
          user_id: signUpData.user.id,
          role: dbRole,
        });
        await supabase.from('profiles').upsert({
          id: signUpData.user.id,
          full_name: fullName,
          phone,
        });
      }
      setSubmitted(true);
    } else {
      // Non-invited user: submit registration request for admin approval
      const { error: insertError } = await supabase
        .from('registration_requests')
        .insert({
          full_name: fullName,
          email,
          phone,
          entity_name: entityName || null,
          requested_role: requestedRole,
          notes: notes || null,
          invited_by: '00000000-0000-0000-0000-000000000000',
        });
      if (insertError) {
        setError(insertError.message);
      } else {
        setSubmitted(true);
      }
    }
    setIsLoading(false);
  };

  const inputStyle = {
    background: 'hsl(220, 22%, 11%)',
    border: '1.5px solid hsl(222, 30%, 18%)',
    color: 'hsl(214, 32%, 91%)',
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
        style={{ background: 'radial-gradient(ellipse at 30% 20%, rgba(0,212,200,0.06) 0%, transparent 60%), hsl(220, 30%, 4%)' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-[480px] max-w-[95vw] rounded-2xl p-6 sm:p-12 text-center"
          style={{ background: 'hsl(222, 25%, 7%)', border: '1px solid hsl(222, 30%, 18%)' }}
        >
          <motion.div
            className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 400, damping: 15 }}
          >
            <CheckCircle className="w-8 h-8 text-primary" />
          </motion.div>
          <motion.h2
            className="text-xl font-black text-white mb-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {inviteToken && inviteValid ? 'Account Created!' : 'Request Submitted'}
          </motion.h2>
          <motion.p
            className="text-gray-400 text-sm mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {inviteToken && inviteValid
              ? 'Your account has been created. Check your email to confirm, then log in.'
              : 'Your registration request has been submitted. An admin will review and approve your access.'}
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Link to="/login" className="text-primary text-sm font-bold hover:underline">← Back to Login</Link>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 30% 20%, rgba(0,212,200,0.06) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(59,130,246,0.04) 0%, transparent 60%), hsl(220, 30%, 4%)' }}>
      {/* Subtle grid */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97, filter: 'blur(6px)' }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-[520px] max-w-[95vw] rounded-2xl p-6 sm:p-10"
        style={{ background: 'hsl(222, 25%, 7%)', border: '1px solid hsl(222, 30%, 18%)', boxShadow: '0 24px 80px rgba(0,0,0,0.7)' }}
      >
        <motion.div
          className="absolute top-0 left-[10%] right-[10%] h-px"
          style={{ background: 'linear-gradient(90deg, transparent, hsl(177, 100%, 41%), transparent)' }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
        />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Link to="/login" className="flex items-center gap-1.5 text-gray-500 text-xs font-bold mb-6 hover:text-primary transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
          </Link>
        </motion.div>

        <div className="text-center mb-6">
          <motion.div
            className="inline-flex items-center gap-2.5"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
              <Zap className="w-5 h-5" />
            </div>
            <span className="text-[22px] font-black tracking-wider text-white">
              {inviteToken && inviteValid ? 'CREATE ACCOUNT' : 'REQUEST ACCESS'}
            </span>
          </motion.div>
          <motion.div
            className="text-[11px] tracking-[3px] uppercase mt-1.5 text-gray-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
          >
            ALPHA SALE PRO
          </motion.div>
          {inviteToken && inviteValid && (
            <motion.div
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
              style={{ background: 'rgba(0,212,200,0.1)', border: '1px solid rgba(0,212,200,0.2)', color: 'hsl(177, 100%, 41%)' }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Invited — create your account
            </motion.div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <label className="block text-[11px] font-bold tracking-[1.5px] uppercase mb-1.5 text-gray-400">Full Name</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} required
              className="w-full px-4 py-3 rounded-md text-sm outline-none transition-all duration-200 focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
              style={inputStyle}
              placeholder="John Doe" />
          </motion.div>

          <motion.div className="grid grid-cols-2 gap-3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <div>
              <label className="block text-[11px] font-bold tracking-[1.5px] uppercase mb-1.5 text-gray-400">Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required
                className="w-full px-4 py-3 rounded-md text-sm outline-none transition-all duration-200 focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                style={inputStyle}
                placeholder="you@email.com" />
            </div>
            <div>
              <label className="block text-[11px] font-bold tracking-[1.5px] uppercase mb-1.5 text-gray-400">Phone</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} required
                className="w-full px-4 py-3 rounded-md text-sm outline-none transition-all duration-200 focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                style={inputStyle}
                placeholder="(555) 555-0000" />
            </div>
          </motion.div>

          {inviteToken && inviteValid && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
              <label className="block text-[11px] font-bold tracking-[1.5px] uppercase mb-1.5 text-gray-400">Password</label>
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required
                className="w-full px-4 py-3 rounded-md text-sm outline-none transition-all duration-200 focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                style={inputStyle}
                placeholder="8+ chars, uppercase + number required" />
            </motion.div>
          )}

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <label className="block text-[11px] font-bold tracking-[1.5px] uppercase mb-1.5 text-gray-400">Role</label>
            <div className="flex gap-2">
              {roleOptions.map(r => (
                <motion.button
                  key={r.value}
                  type="button"
                  onClick={() => setRequestedRole(r.value)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 py-2.5 rounded-lg text-xs font-bold transition-all duration-200"
                  style={{
                    background: requestedRole === r.value ? 'rgba(0,212,200,0.1)' : 'hsl(220, 22%, 11%)',
                    border: `2px solid ${requestedRole === r.value ? 'hsl(177, 100%, 41%)' : 'hsl(222, 30%, 18%)'}`,
                    color: requestedRole === r.value ? 'hsl(177, 100%, 41%)' : 'hsl(214, 32%, 70%)',
                    boxShadow: requestedRole === r.value ? '0 0 16px rgba(0,212,200,0.1)' : 'none',
                  }}>
                  {r.label}
                </motion.button>
              ))}
            </div>
          </motion.div>

          <AnimatePresence>
            {selectedRoleOption?.needsEntity && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <label className="block text-[11px] font-bold tracking-[1.5px] uppercase mb-1.5 text-gray-400">Company Name</label>
                <input value={entityName} onChange={(e) => setEntityName(e.target.value)}
                  className="w-full px-4 py-3 rounded-md text-sm outline-none transition-all duration-200 focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                  style={inputStyle}
                  placeholder="Your company name" />
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <label className="block text-[11px] font-bold tracking-[1.5px] uppercase mb-1.5 text-gray-400">Additional Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              className="w-full px-4 py-3 rounded-md text-sm outline-none resize-none transition-all duration-200 focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
              style={inputStyle}
              placeholder="Any additional information..." />
          </motion.div>

          <motion.button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-primary text-primary-foreground text-sm font-black tracking-wider uppercase rounded-md disabled:opacity-50"
            style={{ boxShadow: '0 8px 24px rgba(0,212,200,0.2)' }}
            whileHover={{ y: -1, boxShadow: '0 12px 32px rgba(0,212,200,0.3)' }}
            whileTap={{ y: 0, scale: 0.99 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {isLoading ? 'Submitting...' : (inviteToken && inviteValid ? 'Create Account →' : 'Submit Request →')}
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
      </motion.div>
    </div>
  );
};

export default Register;
