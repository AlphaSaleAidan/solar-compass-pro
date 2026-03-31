import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Zap, Loader2, CheckCircle, ArrowLeft, Crosshair, HardHat, Landmark } from 'lucide-react';
import { Link } from 'react-router-dom';

type RequestRole = 'sales_rep' | 'installer' | 'financier';

const ROLES: { value: RequestRole; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: 'sales_rep', label: 'Sales Rep', icon: <Crosshair className="w-5 h-5" />, desc: 'Sell solar projects' },
  { value: 'installer', label: 'Installer', icon: <HardHat className="w-5 h-5" />, desc: 'Install solar systems' },
  { value: 'financier', label: 'Financier', icon: <Landmark className="w-5 h-5" />, desc: 'Finance solar projects' },
];

const Register = () => {
  const [fullName, setFullName] = useState('');
  const [entityName, setEntityName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<RequestRole>('sales_rep');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const { error: insertError } = await supabase
      .from('registration_requests')
      .insert({
        full_name: fullName,
        entity_name: entityName || null,
        phone,
        email,
        requested_role: role,
        status: 'pending',
      });

    if (insertError) {
      setError(insertError.message);
    } else {
      setSubmitted(true);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-8" style={{
      background: 'radial-gradient(ellipse at 30% 20%, rgba(0,212,200,0.06) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(59,130,246,0.04) 0%, transparent 60%), hsl(220, 30%, 4%)',
    }}>
      <div className="w-[520px] max-w-[95vw] rounded-2xl p-10 relative animate-scale-in" style={{
        background: 'hsl(222, 25%, 7%)',
        border: '1px solid hsl(222, 30%, 18%)',
        boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
      }}>
        <div className="absolute top-0 left-[10%] right-[10%] h-px" style={{ background: 'linear-gradient(90deg, transparent, hsl(177, 100%, 41%), transparent)' }} />

        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2.5">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
              <Zap className="w-5 h-5" />
            </div>
            <span className="text-[22px] font-black tracking-wider text-white">ALPHA SALE PRO</span>
          </div>
          <div className="text-[11px] tracking-[3px] uppercase mt-1.5 text-gray-500">REQUEST ACCESS</div>
        </div>

        {submitted ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-asp-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-asp-green" />
            </div>
            <h2 className="text-lg font-black text-white mb-2">Request Submitted!</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Your registration request has been sent to our team. We'll review it and set up your account shortly.
            </p>
            <Link to="/login" className="text-primary text-sm font-bold hover:underline inline-flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
            </Link>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Role Selection */}
              <div>
                <label className="block text-[11px] font-bold tracking-[1.5px] uppercase mb-2 text-gray-400">I am a...</label>
                <div className="grid grid-cols-3 gap-2">
                  {ROLES.map((r) => (
                    <button key={r.value} type="button" onClick={() => setRole(r.value)}
                      className={`p-3 rounded-lg border text-center transition-all ${
                        role === r.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-bg3 text-muted-foreground hover:border-border2'
                      }`}>
                      <div className="flex justify-center mb-1.5">{r.icon}</div>
                      <div className="text-xs font-bold">{r.label}</div>
                      <div className="text-[10px] opacity-70">{r.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold tracking-[1.5px] uppercase mb-1.5 text-gray-400">Full Name *</label>
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 rounded-md text-sm outline-none"
                  style={{ background: 'hsl(220, 22%, 11%)', border: '1.5px solid hsl(222, 30%, 18%)', color: 'hsl(214, 32%, 91%)' }}
                  placeholder="Your full name" required />
              </div>

              <div>
                <label className="block text-[11px] font-bold tracking-[1.5px] uppercase mb-1.5 text-gray-400">
                  {role === 'sales_rep' ? 'Company (Optional)' : 'Company / Entity Name *'}
                </label>
                <input type="text" value={entityName} onChange={(e) => setEntityName(e.target.value)}
                  className="w-full px-4 py-3 rounded-md text-sm outline-none"
                  style={{ background: 'hsl(220, 22%, 11%)', border: '1.5px solid hsl(222, 30%, 18%)', color: 'hsl(214, 32%, 91%)' }}
                  placeholder="Company or entity name"
                  required={role !== 'sales_rep'} />
              </div>

              <div>
                <label className="block text-[11px] font-bold tracking-[1.5px] uppercase mb-1.5 text-gray-400">Phone Number *</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-md text-sm outline-none"
                  style={{ background: 'hsl(220, 22%, 11%)', border: '1.5px solid hsl(222, 30%, 18%)', color: 'hsl(214, 32%, 91%)' }}
                  placeholder="(555) 123-4567" required />
              </div>

              <div>
                <label className="block text-[11px] font-bold tracking-[1.5px] uppercase mb-1.5 text-gray-400">Email *</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-md text-sm outline-none"
                  style={{ background: 'hsl(220, 22%, 11%)', border: '1.5px solid hsl(222, 30%, 18%)', color: 'hsl(214, 32%, 91%)' }}
                  placeholder="your@email.com" required />
              </div>

              <button type="submit" disabled={isLoading}
                className="w-full py-3.5 mt-2 bg-primary text-primary-foreground text-sm font-black tracking-wider uppercase rounded-md transition-all hover:-translate-y-px disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ boxShadow: '0 8px 24px rgba(0,212,200,0.2)' }}>
                {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : 'Request Access →'}
              </button>
            </form>

            {error && (
              <div className="mt-3 text-xs text-center p-2 rounded-md" style={{ color: 'hsl(0, 100%, 65%)', background: 'rgba(255,77,77,0.08)', border: '1px solid rgba(255,77,77,0.2)' }}>
                {error}
              </div>
            )}

            <div className="mt-4 text-center">
              <Link to="/login" className="text-primary text-xs font-bold hover:underline inline-flex items-center gap-1">
                <ArrowLeft className="w-3 h-3" /> Already have an account? Sign In
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Register;
