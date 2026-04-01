import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Settings, Sun, CheckCircle, AlertCircle, Loader2, User, Phone, Mail, Camera, Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

interface UserSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAvatarChange?: (url: string | null) => void;
}

const UserSettingsModal = ({ open, onOpenChange, onAvatarChange }: UserSettingsModalProps) => {
  const { user } = useAuth();
  const [auroraEmail, setAuroraEmail] = useState('');
  const [savedAuroraEmail, setSavedAuroraEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

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
      .select('aurora_email, phone, avatar_url')
      .eq('user_id', user.id)
      .maybeSingle();
    if (data) {
      setAuroraEmail(data.aurora_email || '');
      setSavedAuroraEmail(data.aurora_email || '');
      setPhone(data.phone || '');
      setAvatarUrl(data.avatar_url || null);
    }
    setLoading(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }

    setUploading(true);
    const ext = file.name.split('.').pop() || 'png';
    const filePath = `${user.id}/avatar.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadErr) {
      toast.error('Failed to upload avatar');
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    const { error: updateErr } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('user_id', user.id);

    if (updateErr) {
      toast.error('Failed to update profile');
    } else {
      setAvatarUrl(publicUrl);
      onAvatarChange?.(publicUrl);
      toast.success('Avatar updated!');
    }
    setUploading(false);
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

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast.error(error.message || 'Failed to change password');
    } else {
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
    setChangingPassword(false);
  };

  const isAuroraLinked = !!savedAuroraEmail;

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-[hsl(210,20%,8%)] border-white/10 max-h-[85vh] overflow-y-auto">
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
            {/* Profile Info with Avatar */}
            <div className="space-y-3">
              <div className="text-[10px] text-white/30 font-bold tracking-wider uppercase">Profile</div>
              <div className="flex items-center gap-3 p-3 bg-white/[0.04] rounded-lg">
                <div className="relative group">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center border-2 border-white/10">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-7 h-7 text-primary" />
                    )}
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                  >
                    {uploading ? (
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4 text-white" />
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">{user.name}</div>
                  <div className="text-xs text-white/40">{user.email}</div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[10px] text-primary font-bold mt-0.5 hover:underline"
                  >
                    {avatarUrl ? 'Change Photo' : 'Upload Photo'}
                  </button>
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

            {/* Password Change */}
            {!user.isDemo && (
              <div className="space-y-3">
                <div className="text-[10px] text-white/30 font-bold tracking-wider uppercase">Change Password</div>
                <div className="p-3 bg-white/[0.04] rounded-lg border border-white/10 space-y-2">
                  <div className="relative">
                    <input
                      type={showPasswords ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="New password (min 8 chars)"
                      className="w-full px-3 py-2 bg-white/[0.04] border border-white/10 rounded-lg text-sm text-white outline-none focus:border-primary transition-colors pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(!showPasswords)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                    >
                      {showPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full px-3 py-2 bg-white/[0.04] border border-white/10 rounded-lg text-sm text-white outline-none focus:border-primary transition-colors"
                  />
                  <button
                    onClick={handleChangePassword}
                    disabled={changingPassword || !newPassword || !confirmPassword}
                    className="w-full py-2 bg-white/[0.06] border border-white/10 rounded-lg text-xs font-bold text-white/70 hover:bg-white/10 disabled:opacity-30 transition-all active:scale-[0.97] flex items-center justify-center gap-1.5"
                  >
                    {changingPassword ? <Loader2 className="w-3 h-3 animate-spin" /> : <Lock className="w-3 h-3" />}
                    Update Password
                  </button>
                </div>
              </div>
            )}

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
                  Link your Aurora Solar email to enable one-click project sync.
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
