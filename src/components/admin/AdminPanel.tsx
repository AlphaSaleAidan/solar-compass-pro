import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserPlus, CheckCircle, XCircle, Clock, Mail, Shield, Building2, Phone,
  Users, Send, RefreshCw, ChevronDown, ChevronUp, AlertTriangle, Copy, ExternalLink,
} from 'lucide-react';

type AppRole = 'sales_rep' | 'backend_ops' | 'installer' | 'financier' | 'master_admin';

interface RegistrationRequest {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  entity_name: string | null;
  requested_role: AppRole;
  notes: string | null;
  status: string;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

interface Invitation {
  id: string;
  email: string;
  role: AppRole;
  token: string;
  invited_by: string;
  organization_id: string | null;
  created_at: string;
  accepted_at: string | null;
}

const ROLE_LABELS: Record<string, string> = {
  sales_rep: 'Sales Rep',
  backend_ops: 'Backend Ops',
  installer: 'Installer',
  financier: 'Financier',
  master_admin: 'Master Admin',
  master: 'Master Admin',
};

const ROLE_COLORS: Record<string, string> = {
  sales_rep: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  backend_ops: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  installer: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  financier: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  master_admin: 'bg-red-500/20 text-red-400 border-red-500/30',
  master: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const AdminPanel = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'requests' | 'invite' | 'users'>('requests');
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null);

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<AppRole>('sales_rep');
  const [inviteEntityName, setInviteEntityName] = useState('');
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [inviteError, setInviteError] = useState('');

  // Action state
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [reqResult, invResult] = await Promise.all([
      supabase.from('registration_requests').select('*').order('created_at', { ascending: false }),
      supabase.from('invitations').select('*').order('created_at', { ascending: false }),
    ]);
    if (reqResult.data) setRequests(reqResult.data as RegistrationRequest[]);
    if (invResult.data) setInvitations(invResult.data as Invitation[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleApprove = async (req: RegistrationRequest) => {
    setActionLoading(req.id);
    try {
      // 1. Create Supabase auth user via invite (sends magic link email)
      // Since we can't create users from client-side, we create an invitation instead
      const token = crypto.randomUUID();
      await supabase.from('invitations').insert({
        email: req.email,
        role: req.requested_role,
        token,
        invited_by: user?.id || '',
      });

      // 2. Mark request as approved
      await supabase.from('registration_requests').update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: user?.id || null,
      }).eq('id', req.id);

      setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'approved' } : r));
    } catch (err) {
      console.error('Approval failed:', err);
    }
    setActionLoading(null);
  };

  const handleReject = async (req: RegistrationRequest) => {
    setActionLoading(req.id);
    await supabase.from('registration_requests').update({
      status: 'rejected',
      reviewed_at: new Date().toISOString(),
      reviewed_by: user?.id || null,
    }).eq('id', req.id);
    setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'rejected' } : r));
    setActionLoading(null);
  };

  const handleSendInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviteSending(true);
    setInviteError('');
    setInviteSuccess('');

    try {
      const token = crypto.randomUUID();
      const { error } = await supabase.from('invitations').insert({
        email: inviteEmail.trim().toLowerCase(),
        role: inviteRole,
        token,
        invited_by: user?.id || '',
      });

      if (error) throw error;

      const inviteLink = `${window.location.origin}/register?invite=${token}&role=${inviteRole}&email=${encodeURIComponent(inviteEmail.trim())}`;
      setInviteSuccess(inviteLink);
      setInviteEmail('');
      setInviteEntityName('');
      fetchData();
    } catch (err: any) {
      setInviteError(err.message || 'Failed to create invitation');
    }
    setInviteSending(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const processedRequests = requests.filter(r => r.status !== 'pending');
  const pendingInvitations = invitations.filter(i => !i.accepted_at);
  const acceptedInvitations = invitations.filter(i => i.accepted_at);

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Admin Panel
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Manage registration requests, invitations, and users</p>
        </div>
        <button onClick={fetchData} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-lg">
        {[
          { id: 'requests' as const, label: 'Requests', icon: Users, count: pendingRequests.length },
          { id: 'invite' as const, label: 'Invite', icon: Send, count: 0 },
          { id: 'users' as const, label: 'Invitations', icon: UserPlus, count: pendingInvitations.length },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.id ? 'bg-primary/20 text-primary shadow-sm' : 'text-muted-foreground hover:text-white hover:bg-white/5'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.count > 0 && (
              <span className="px-1.5 py-0.5 text-xs rounded-full bg-primary/30 text-primary">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Requests Tab */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {/* Pending */}
          {pendingRequests.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" /> Pending Review ({pendingRequests.length})
              </h3>
              <AnimatePresence>
                {pendingRequests.map(req => (
                  <motion.div
                    key={req.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-white/[0.04] border border-white/[0.08] rounded-xl overflow-hidden"
                  >
                    <div
                      className="p-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                      onClick={() => setExpandedRequest(expandedRequest === req.id ? null : req.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                            {req.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-white">{req.full_name}</p>
                            <p className="text-xs text-muted-foreground">{req.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 text-xs rounded-md border ${ROLE_COLORS[req.requested_role] || 'bg-white/10 text-white'}`}>
                            {ROLE_LABELS[req.requested_role] || req.requested_role}
                          </span>
                          {expandedRequest === req.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                        </div>
                      </div>
                    </div>

                    <AnimatePresence>
                      {expandedRequest === req.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 space-y-3 border-t border-white/[0.06] pt-3">
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Phone className="w-3.5 h-3.5" /> {req.phone}
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="w-3.5 h-3.5" /> {formatDate(req.created_at)}
                              </div>
                              {req.entity_name && (
                                <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                                  <Building2 className="w-3.5 h-3.5" /> {req.entity_name}
                                </div>
                              )}
                            </div>
                            {req.notes && (
                              <div className="p-3 bg-white/[0.03] rounded-lg text-sm text-muted-foreground">
                                <p className="text-xs text-white/40 mb-1">Notes:</p>
                                {req.notes}
                              </div>
                            )}
                            <div className="flex gap-2 pt-1">
                              <button
                                onClick={() => handleApprove(req)}
                                disabled={actionLoading === req.id}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/20 transition-colors text-sm font-medium disabled:opacity-50"
                              >
                                <CheckCircle className="w-4 h-4" />
                                {actionLoading === req.id ? 'Processing...' : 'Approve & Invite'}
                              </button>
                              <button
                                onClick={() => handleReject(req)}
                                disabled={actionLoading === req.id}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/20 transition-colors text-sm font-medium disabled:opacity-50"
                              >
                                <XCircle className="w-4 h-4" />
                                Reject
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {pendingRequests.length === 0 && !loading && (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">All caught up</p>
              <p className="text-sm mt-1">No pending registration requests</p>
            </div>
          )}

          {/* Processed */}
          {processedRequests.length > 0 && (
            <div className="space-y-3 mt-6">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Processed ({processedRequests.length})
              </h3>
              {processedRequests.map(req => (
                <div key={req.id} className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${req.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                      {req.status === 'approved' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{req.full_name}</p>
                      <p className="text-xs text-muted-foreground">{req.email} · {ROLE_LABELS[req.requested_role]}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${req.status === 'approved' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {req.status === 'approved' ? 'Approved' : 'Rejected'} · {req.reviewed_at ? formatDate(req.reviewed_at) : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Invite Tab */}
      {activeTab === 'invite' && (
        <div className="space-y-6">
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-6 space-y-4">
            <h3 className="text-base font-medium text-white flex items-center gap-2">
              <Send className="w-4 h-4 text-primary" />
              Send Invitation
            </h3>
            <p className="text-sm text-muted-foreground">
              Generate an invite link for a new team member. They'll use it to register and join the platform.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:border-primary/50 focus:outline-none text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as AppRole)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:border-primary/50 focus:outline-none text-sm appearance-none cursor-pointer"
                >
                  <option value="sales_rep">Sales Rep</option>
                  <option value="backend_ops">Backend Ops</option>
                  <option value="installer">Installer</option>
                  <option value="financier">Financier</option>
                </select>
              </div>

              {['installer', 'financier'].includes(inviteRole) && (
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Company / Entity Name</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={inviteEntityName}
                      onChange={(e) => setInviteEntityName(e.target.value)}
                      placeholder="e.g., SunPower Installs LLC"
                      className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:border-primary/50 focus:outline-none text-sm"
                    />
                  </div>
                </div>
              )}

              <button
                onClick={handleSendInvite}
                disabled={inviteSending || !inviteEmail.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 border border-primary/20 transition-colors text-sm font-medium disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {inviteSending ? 'Creating...' : 'Generate Invite Link'}
              </button>

              {inviteError && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {inviteError}
                </div>
              )}

              {inviteSuccess && (
                <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                  <p className="text-sm text-emerald-400 font-medium flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Invitation created!
                  </p>
                  <p className="text-xs text-muted-foreground">Share this link with the invitee:</p>
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={inviteSuccess}
                      className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white/70 focus:outline-none"
                    />
                    <button
                      onClick={() => copyToClipboard(inviteSuccess)}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
                      title="Copy link"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Invitations Tab */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {pendingInvitations.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Mail className="w-3.5 h-3.5" /> Pending Invitations ({pendingInvitations.length})
              </h3>
              {pendingInvitations.map(inv => {
                const invLink = `${window.location.origin}/register?invite=${inv.token}&role=${inv.role}&email=${encodeURIComponent(inv.email)}`;
                return (
                  <div key={inv.id} className="p-4 bg-white/[0.04] border border-white/[0.08] rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">{inv.email}</p>
                        <p className="text-xs text-muted-foreground">Invited {formatDate(inv.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded-md border ${ROLE_COLORS[inv.role] || 'bg-white/10 text-white'}`}>
                          {ROLE_LABELS[inv.role] || inv.role}
                        </span>
                        <button
                          onClick={() => copyToClipboard(invLink)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
                          title="Copy invite link"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {acceptedInvitations.length > 0 && (
            <div className="space-y-3 mt-6">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Accepted ({acceptedInvitations.length})
              </h3>
              {acceptedInvitations.map(inv => (
                <div key={inv.id} className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <div>
                      <p className="text-sm font-medium text-white">{inv.email}</p>
                      <p className="text-xs text-muted-foreground">Accepted {inv.accepted_at ? formatDate(inv.accepted_at) : ''}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-md border ${ROLE_COLORS[inv.role]}`}>
                    {ROLE_LABELS[inv.role]}
                  </span>
                </div>
              ))}
            </div>
          )}

          {invitations.length === 0 && !loading && (
            <div className="text-center py-12 text-muted-foreground">
              <Mail className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No invitations yet</p>
              <p className="text-sm mt-1">Use the Invite tab to send invitation links</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
