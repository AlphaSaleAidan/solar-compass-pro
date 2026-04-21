import { Link } from 'react-router-dom';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Zap, ArrowLeft } from 'lucide-react';
import type { UserRole } from '@/contexts/AuthContext';

const Register = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [entityName, setEntityName] = useState('');
  const [requestedRole, setRequestedRole] = useState<UserRole>('sales_rep');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

    const { error: insertError } = await supabase
      .from('registration_requests')
      .insert({
        full_name: fullName,
        email,
        phone,
        entity_name: entityName || null,
        requested_role: requestedRole,
        notes: notes || null,
        invited_by: '00000000-0000-0000-0000-000000000000', // placeholder
      });

    if (insertError) {
      setError(insertError.message);
    } else {
      setSubmitted(true);
    }
    setIsLoading(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'radial-gradient(ellipse at 30% 20%, rgba(0,212,200,0.06) 0%, transparent 60%), hsl(220, 30%, 4%)' }}>
        <div className="w-[480px] max-w-[95vw] rounded-2xl p-12 text-center"
          style={{ background: 'hsl(222, 25%, 7%)', border: '1px solid hsl(222, 30%, 18%)' }}>
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-black text-white mb-2">Request Submitted</h2>
          <p className="text-gray-400 text-sm mb-6">Your registration request has been submitted. An admin will review and approve your access.</p>
          <Link to="/" className="text-primary text-sm font-bold hover:underline">← Back to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: 'radial-gradient(ellipse at 30% 20%, rgba(0,212,200,0.06) 0%, transparent 60%), hsl(220, 30%, 4%)' }}>
      <div className="w-[520px] max-w-[95vw] rounded-2xl p-10 relative"
        style={{ background: 'hsl(222, 25%, 7%)', border: '1px solid hsl(222, 30%, 18%)', boxShadow: '0 24px 80px rgba(0,0,0,0.7)' }}>
        <div className="absolute top-0 left-[10%] right-[10%] h-px" style={{ background: 'linear-gradient(90deg, transparent, hsl(177, 100%, 41%), transparent)' }} />

        <Link to="/" className="flex items-center gap-1.5 text-gray-500 text-xs font-bold mb-6 hover:text-primary transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
        </Link>

        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2.5">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
              <Zap className="w-5 h-5" />
            </div>
            <span className="text-[22px] font-black tracking-wider text-white">REQUEST ACCESS</span>
          </div>
          <div className="text-[11px] tracking-[3px] uppercase mt-1.5 text-gray-500">ALPHA SALE PRO</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold tracking-[1.5px] uppercase mb-1.5 text-gray-400">Full Name</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} required
              className="w-full px-4 py-3 rounded-md text-sm outline-none"
              style={{ background: 'hsl(220, 22%, 11%)', border: '1.5px solid hsl(222, 30%, 18%)', color: 'hsl(214, 32%, 91%)' }}
              placeholder="John Doe" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold tracking-[1.5px] uppercase mb-1.5 text-gray-400">Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required
                className="w-full px-4 py-3 rounded-md text-sm outline-none"
                style={{ background: 'hsl(220, 22%, 11%)', border: '1.5px solid hsl(222, 30%, 18%)', color: 'hsl(214, 32%, 91%)' }}
                placeholder="you@email.com" />
            </div>
            <div>
              <label className="block text-[11px] font-bold tracking-[1.5px] uppercase mb-1.5 text-gray-400">Phone</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} required
                className="w-full px-4 py-3 rounded-md text-sm outline-none"
                style={{ background: 'hsl(220, 22%, 11%)', border: '1.5px solid hsl(222, 30%, 18%)', color: 'hsl(214, 32%, 91%)' }}
                placeholder="(555) 555-0000" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold tracking-[1.5px] uppercase mb-1.5 text-gray-400">Role</label>
            <div className="flex gap-2">
              {roleOptions.map(r => (
                <button key={r.value} type="button" onClick={() => setRequestedRole(r.value)}
                  className="flex-1 py-2.5 rounded-lg text-xs font-bold transition-all"
                  style={{
                    background: requestedRole === r.value ? 'rgba(0,212,200,0.1)' : 'hsl(220, 22%, 11%)',
                    border: `2px solid ${requestedRole === r.value ? 'hsl(177, 100%, 41%)' : 'hsl(222, 30%, 18%)'}`,
                    color: requestedRole === r.value ? 'hsl(177, 100%, 41%)' : 'hsl(214, 32%, 70%)',
                  }}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {selectedRoleOption?.needsEntity && (
            <div>
              <label className="block text-[11px] font-bold tracking-[1.5px] uppercase mb-1.5 text-gray-400">Company Name</label>
              <input value={entityName} onChange={(e) => setEntityName(e.target.value)}
                className="w-full px-4 py-3 rounded-md text-sm outline-none"
                style={{ background: 'hsl(220, 22%, 11%)', border: '1.5px solid hsl(222, 30%, 18%)', color: 'hsl(214, 32%, 91%)' }}
                placeholder="Your company name" />
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold tracking-[1.5px] uppercase mb-1.5 text-gray-400">Additional Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              className="w-full px-4 py-3 rounded-md text-sm outline-none resize-none"
              style={{ background: 'hsl(220, 22%, 11%)', border: '1.5px solid hsl(222, 30%, 18%)', color: 'hsl(214, 32%, 91%)' }}
              placeholder="Any additional information..." />
          </div>

          <button type="submit" disabled={isLoading}
            className="w-full py-3.5 bg-primary text-primary-foreground text-sm font-black tracking-wider uppercase rounded-md transition-all duration-200 hover:-translate-y-px active:translate-y-0 disabled:opacity-50"
            style={{ boxShadow: '0 8px 24px rgba(0,212,200,0.2)' }}>
            {isLoading ? 'Submitting...' : 'Submit Request →'}
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
  );
};

export default Register;
