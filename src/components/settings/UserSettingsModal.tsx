import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Settings, Sun, CheckCircle, AlertCircle, Loader2, User, Phone, Mail } from 'lucide-react';
import { toast } from 'sonner';

interface UserSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UserSettingsModal = ({ open, onOpenChange }: UserSettingsModalProps) => {
  const { user } = useAuth();
  const [auroraEmail, setAuroraEmail] = useState('');
  const [savedAuroraEmail, setSavedAuroraEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && user && !user.isDemo) {
      loadProfile();
    }
  }, [open, user]);

  const loadProfile = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('aurora_email, phone')
      .eq('user_id', user.id)
      .maybeSingle();
    if (data) {
      setAuroraEmail(data.aurora_email || '');
      setSavedAuroraEmail(data.aurora_email || '');
      setPhone(data.phone || '');
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ aurora_email: auroraEmail.trim() || null, phone: phone.trim() || null })
      .eq('user_id', user.id);
    if (error) {
      toast.error('Failed to save settings');
    } else {
      setSavedAuroraEmail(auroraEmail.trim());
      toast.success('Settings saved');
    }
    setSaving(false);
  };

  const isAuroraLinked = !!savedAuroraEmail;

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-[hsl(210,20%,8%)] border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white font-black flex items-center gap-2">
            <Settings className="w-4 h-4" /> Account Settings
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-5">
            {/* Profile Info */}
            <div className="space-y-3">
              <div className="text-[10px] text-white/30 font-bold tracking-wider uppercase">Profile</div>
              <div className="flex items-center gap-3 p-3 bg-white/[0.04] rounded-lg">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">{user.name}</div>
                  <div className="text-xs text-white/40">{user.email}</div>
                </div>
              </div>
              <div>
                <label className="text-[10px] text-white/40 font-bold tracking-wider uppercase block mb-1">Phone</label>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-white/30" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                    className="flex-1 px-3 py-2 bg-white/[0.04] border border-white/10 rounded-lg text-sm text-white outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Aurora Solar Connection */}
            <div className="space-y-3">
              <div className="text-[10px] text-white/30 font-bold tracking-wider uppercase">Aurora Solar Integration</div>
              <div className={`p-3 rounded-lg border ${isAuroraLinked ? 'bg-[hsl(150,60%,50%)]/5 border-[hsl(150,60%,50%)]/20' : 'bg-white/[0.04] border-white/10'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Sun className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold text-white">Aurora Solar Account</span>
                  {isAuroraLinked ? (
                    <span className="ml-auto flex items-center gap-1 text-[10px] text-[hsl(150,60%,50%)] font-bold">
                      <CheckCircle className="w-3 h-3" /> Linked
                    </span>
                  ) : (
                    <span className="ml-auto flex items-center gap-1 text-[10px] text-white/30 font-bold">
                      <AlertCircle className="w-3 h-3" /> Not Linked
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-white/40 mb-2">
                  Link your Aurora Solar email to enable one-click project sync. Your Aurora projects will auto-populate system design, pricing, and equipment data.
                </p>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-white/30" />
                  <input
                    type="email"
                    value={auroraEmail}
                    onChange={(e) => setAuroraEmail(e.target.value)}
                    placeholder="your-aurora@email.com"
                    className="flex-1 px-3 py-2 bg-white/[0.04] border border-white/10 rounded-lg text-sm text-white outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* SOP Protocol Info */}
            <div className="p-3 bg-white/[0.03] rounded-lg border border-white/[0.06]">
              <div className="text-[10px] text-white/30 font-bold tracking-wider uppercase mb-2">Aurora Sync SOP</div>
              <ol className="text-[11px] text-white/50 space-y-1 list-decimal list-inside">
                <li>Link your Aurora email above</li>
                <li>Create a project in the Sell tab</li>
                <li>Click <strong className="text-primary">"Sync from Aurora"</strong> to pull system data</li>
                <li>Review &amp; Convert to Sale</li>
                <li>Complete Welcome Call, Site Survey, then Submit</li>
              </ol>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-bold text-sm hover:bg-primary/90 disabled:opacity-50 transition-all active:scale-[0.97] flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Save Settings
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UserSettingsModal;
