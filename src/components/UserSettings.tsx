import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { X, Loader2, Camera, Save, Eye, EyeOff } from 'lucide-react';

interface UserSettingsProps {
  open: boolean;
  onClose: () => void;
}

const UserSettings = ({ open, onClose }: UserSettingsProps) => {
  const { user } = useAuth();
  const [tab, setTab] = useState<'profile' | 'bank'>('profile');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  // Profile fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Bank fields
  const [bankName, setBankName] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountType, setAccountType] = useState('checking');
  const [showAccount, setShowAccount] = useState(false);

  useEffect(() => {
    if (open && user) {
      loadProfile();
    }
  }, [open, user]);

  const loadProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    if (data) {
      setFullName(data.full_name || '');
      setPhone(data.phone || '');
      setEmail(data.email || '');
      setAvatarUrl(data.avatar_url || '');
      setBankName((data as any).bank_name || '');
      setRoutingNumber((data as any).bank_routing_number || '');
      setAccountNumber((data as any).bank_account_number || '');
      setAccountType((data as any).bank_account_type || 'checking');
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const ext = file.name.split('.').pop();
    const path = `avatars/${user.id}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from('project-files')
      .upload(path, file, { upsert: true });

    if (uploadErr) {
      setMessage('Upload failed: ' + uploadErr.message);
      return;
    }

    const { data: urlData } = supabase.storage.from('project-files').getPublicUrl(path);
    setAvatarUrl(urlData.publicUrl);
    await supabase.from('profiles').update({ avatar_url: urlData.publicUrl }).eq('user_id', user.id);
    setMessage('Photo updated!');
  };

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      full_name: fullName,
      phone,
      email,
    }).eq('user_id', user.id);
    setSaving(false);
    setMessage(error ? 'Error: ' + error.message : 'Profile saved!');
  };

  const saveBank = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      bank_name: bankName,
      bank_routing_number: routingNumber,
      bank_account_number: accountNumber,
      bank_account_type: accountType,
    } as any).eq('user_id', user.id);
    setSaving(false);
    setMessage(error ? 'Error: ' + error.message : 'Bank details saved!');
  };

  if (!open) return null;

  const isPlus = user?.portalMode === 'asp_plus';
  const bg = isPlus ? 'bg-white' : 'bg-bg2';
  const textMain = isPlus ? 'text-gray-900' : 'text-white';
  const textSub = isPlus ? 'text-gray-500' : 'text-muted-foreground';
  const inputStyle = {
    background: isPlus ? 'hsl(210, 20%, 96%)' : 'hsl(220, 22%, 11%)',
    border: `1.5px solid ${isPlus ? 'hsl(214, 32%, 91%)' : 'hsl(222, 30%, 18%)'}`,
    color: isPlus ? 'hsl(222, 47%, 11%)' : 'hsl(214, 32%, 91%)',
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className={`w-[500px] max-w-[95vw] max-h-[90vh] overflow-y-auto rounded-2xl p-8 ${bg} border border-border shadow-2xl animate-scale-in`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-lg font-black ${textMain}`}>Account Settings</h2>
          <button onClick={onClose} className={`p-1 rounded-md hover:bg-bg3 ${textSub}`}><X className="w-5 h-5" /></button>
        </div>

        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-bg4 border-2 border-border overflow-hidden flex items-center justify-center">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className={`text-2xl font-black ${textSub}`}>{fullName?.[0] || '?'}</span>
              )}
            </div>
            <button onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
              <Camera className="w-3.5 h-3.5" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>
          <div>
            <div className={`text-sm font-bold ${textMain}`}>{fullName || 'Your Name'}</div>
            <div className={`text-xs ${textSub}`}>{email}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 p-1 bg-bg3 rounded-lg">
          {(['profile', 'bank'] as const).map((t) => (
            <button key={t} onClick={() => { setTab(t); setMessage(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${
                tab === t ? 'bg-primary text-primary-foreground' : `${textSub} hover:bg-bg4`
              }`}>
              {t === 'profile' ? '👤 Profile' : '🏦 Bank Details'}
            </button>
          ))}
        </div>

        {tab === 'profile' ? (
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold tracking-[1.5px] uppercase mb-1 text-gray-400">Full Name</label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-md text-sm outline-none" style={inputStyle} />
            </div>
            <div>
              <label className="block text-[11px] font-bold tracking-[1.5px] uppercase mb-1 text-gray-400">Phone</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2.5 rounded-md text-sm outline-none" style={inputStyle} placeholder="(555) 123-4567" />
            </div>
            <div>
              <label className="block text-[11px] font-bold tracking-[1.5px] uppercase mb-1 text-gray-400">Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-md text-sm outline-none" style={inputStyle} />
            </div>
            <button onClick={saveProfile} disabled={saving}
              className="w-full py-3 bg-primary text-primary-foreground text-sm font-bold rounded-md flex items-center justify-center gap-2 hover:-translate-y-px transition-all">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Profile
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold tracking-[1.5px] uppercase mb-1 text-gray-400">Bank Name</label>
              <input value={bankName} onChange={(e) => setBankName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-md text-sm outline-none" style={inputStyle} placeholder="Chase, Wells Fargo, etc." />
            </div>
            <div>
              <label className="block text-[11px] font-bold tracking-[1.5px] uppercase mb-1 text-gray-400">Routing Number</label>
              <input value={routingNumber} onChange={(e) => setRoutingNumber(e.target.value)}
                className="w-full px-4 py-2.5 rounded-md text-sm outline-none" style={inputStyle} placeholder="9 digits" maxLength={9} />
            </div>
            <div>
              <label className="block text-[11px] font-bold tracking-[1.5px] uppercase mb-1 text-gray-400">Account Number</label>
              <div className="relative">
                <input type={showAccount ? 'text' : 'password'} value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-md text-sm outline-none pr-10" style={inputStyle} placeholder="Account number" />
                <button type="button" onClick={() => setShowAccount(!showAccount)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showAccount ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold tracking-[1.5px] uppercase mb-1 text-gray-400">Account Type</label>
              <div className="flex gap-2">
                {['checking', 'savings'].map((t) => (
                  <button key={t} type="button" onClick={() => setAccountType(t)}
                    className={`flex-1 py-2.5 rounded-md text-sm font-bold border transition-all ${
                      accountType === t ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-bg3 text-muted-foreground'
                    }`}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={saveBank} disabled={saving}
              className="w-full py-3 bg-primary text-primary-foreground text-sm font-bold rounded-md flex items-center justify-center gap-2 hover:-translate-y-px transition-all">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Bank Details
            </button>
          </div>
        )}

        {message && (
          <div className={`mt-3 text-xs text-center p-2 rounded-md ${
            message.startsWith('Error') ? 'text-red-400 bg-red-500/10 border border-red-500/20' : 'text-asp-green bg-asp-green/10 border border-asp-green/20'
          }`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserSettings;
