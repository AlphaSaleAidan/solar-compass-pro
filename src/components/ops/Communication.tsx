import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle, XCircle, Loader2, UserPlus, Bell } from 'lucide-react';

const CHANNELS = [
  { name: 'Jordan Mills', avatar: '👤', role: 'Sales Rep', status: 'online', time: '9:50 AM', preview: '3 new leads ready to submit' },
  { name: 'Caitlin Fox', avatar: '👤', role: 'Sales Rep', status: 'away', time: 'Yesterday', preview: 'Backend pay question on ASP-2025' },
  { name: 'Samantha Cole', avatar: '👤', role: 'Sales Rep', status: 'online', time: 'Tuesday', preview: 'Deal cancelled — White hold' },
  { name: 'SunTech Installations', avatar: '🔧', role: 'Installer', status: 'online', time: '10:22 AM', preview: 'Crew on site by 8am tomorrow' },
  { name: 'Pro Solar TX', avatar: '⚡', role: 'Installer', status: 'online', time: 'Yesterday', preview: 'Permit for Williams came through' },
];

const MESSAGES: Record<number, { mine: boolean; text: string; time: string }[]> = {
  0: [
    { mine: false, text: "Good morning — I've got 3 qualified leads ready to submit this week. All pre-credit checked, utility bills verified.", time: '9:30 AM' },
    { mine: true, text: "Make sure all three have the 80% true offset confirmed before submitting. We can't have any undersized deals.", time: '9:40 AM' },
    { mine: false, text: "All confirmed at 85%+ offset. SOW is locked on each. Submitting through the portal today.", time: '9:50 AM' },
  ],
  1: [
    { mine: false, text: "Hey — quick question on my backend commission for Robert Chen (ASP-2025). When does the next milestone pay trigger?", time: 'Yesterday 1:20 PM' },
    { mine: true, text: "Your M5 commission releases when the utility inspection is confirmed. We've verified it's in progress.", time: 'Yesterday 1:45 PM' },
  ],
  3: [
    { mine: false, text: "Good morning! Confirming crew deployment for ASP-2029 (Mendoza). We're all set for March 20th.", time: '9:15 AM' },
    { mine: true, text: "Great — make sure the Duracell 20kW arrives on site by 7:30am. Confirm materials receipt.", time: '9:22 AM' },
    { mine: false, text: "Confirmed. Materials already staged. Driver confirmed 7:15am drop.", time: '9:30 AM' },
    { mine: true, text: "M3 will be released within 48hrs once we confirm install is scheduled. You're on track.", time: '9:45 AM' },
    { mine: false, text: "We'll have crew on site by 8am tomorrow. Looking forward to hitting that speed bonus!", time: '10:22 AM' },
  ],
};

interface RegistrationRequest {
  id: string;
  full_name: string;
  entity_name: string | null;
  phone: string;
  email: string;
  requested_role: string;
  status: string;
  created_at: string;
}

const ROLE_LABELS: Record<string, string> = {
  sales_rep: 'Sales Rep',
  installer: 'Installer',
  financier: 'Financier',
  backend_ops: 'Backend Ops',
};

const Communication = () => {
  const { isMaster } = useAuth();
  const [selectedChat, setSelectedChat] = useState(0);
  const [inputVal, setInputVal] = useState('');
  const [localMessages, setLocalMessages] = useState(MESSAGES);
  const [activeSection, setActiveSection] = useState<'chat' | 'registrations'>('chat');

  // Registration requests
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [approving, setApproving] = useState<string | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPasswordFor, setShowPasswordFor] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState('');

  useEffect(() => {
    if (isMaster && activeSection === 'registrations') {
      loadRequests();
    }
  }, [isMaster, activeSection]);

  const loadRequests = async () => {
    setLoadingRequests(true);
    const { data } = await supabase
      .from('registration_requests')
      .select('*')
      .order('created_at', { ascending: false });
    setRequests((data as RegistrationRequest[]) || []);
    setLoadingRequests(false);
  };

  const handleApprove = async (requestId: string) => {
    if (!passwordInput.trim()) return;
    setApproving(requestId);
    setActionMsg('');

    const { data, error } = await supabase.functions.invoke('approve-registration', {
      body: { requestId, password: passwordInput },
    });

    if (error || !data?.success) {
      setActionMsg('Error: ' + (data?.error || error?.message || 'Unknown error'));
    } else {
      setActionMsg(`✅ Account created for ${data.email}`);
      setShowPasswordFor(null);
      setPasswordInput('');
      loadRequests();
    }
    setApproving(null);
  };

  const handleDeny = async (requestId: string) => {
    await supabase
      .from('registration_requests')
      .update({ status: 'denied', reviewed_at: new Date().toISOString() } as any)
      .eq('id', requestId);
    setActionMsg('Request denied.');
    loadRequests();
  };

  const handleSend = () => {
    if (!inputVal.trim()) return;
    setLocalMessages((prev) => ({
      ...prev,
      [selectedChat]: [...(prev[selectedChat] || []), { mine: true, text: inputVal, time: 'Now' }],
    }));
    setInputVal('');
  };

  const msgs = localMessages[selectedChat] || [];
  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="animate-fade-in-up" style={{ height: 'calc(100vh - 180px)' }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-black text-white">💬 Communication Hub</h2>
        {isMaster && (
          <div className="flex gap-1 p-1 bg-bg3 rounded-lg">
            <button onClick={() => setActiveSection('chat')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${activeSection === 'chat' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-bg4'}`}>
              💬 Chat
            </button>
            <button onClick={() => setActiveSection('registrations')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${activeSection === 'registrations' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-bg4'}`}>
              <UserPlus className="w-3.5 h-3.5" />
              Registrations
              {pendingCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-asp-red text-white text-[10px] font-black flex items-center justify-center">{pendingCount}</span>
              )}
            </button>
          </div>
        )}
      </div>

      {activeSection === 'registrations' && isMaster ? (
        <div className="bg-bg2 border border-border rounded-xl p-5 h-[calc(100%-40px)] overflow-y-auto">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-extrabold text-white">Registration Requests</h3>
          </div>

          {loadingRequests ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">No registration requests yet.</div>
          ) : (
            <div className="space-y-3">
              {requests.map((req) => (
                <div key={req.id} className={`p-4 rounded-xl border transition-all ${
                  req.status === 'pending' ? 'bg-bg3 border-primary/20' : 'bg-bg3/50 border-border opacity-60'
                }`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-white">{req.full_name}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/25">
                          {ROLE_LABELS[req.requested_role] || req.requested_role}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          req.status === 'pending' ? 'bg-asp-yellow/10 text-asp-yellow border border-asp-yellow/25'
                          : req.status === 'approved' ? 'bg-asp-green/10 text-asp-green border border-asp-green/25'
                          : 'bg-asp-red/10 text-asp-red border border-asp-red/25'
                        }`}>
                          {req.status.toUpperCase()}
                        </span>
                      </div>
                      {req.entity_name && <div className="text-xs text-muted-foreground mb-0.5">🏢 {req.entity_name}</div>}
                      <div className="text-xs text-muted-foreground">📧 {req.email} · 📞 {req.phone}</div>
                      <div className="text-[10px] text-muted-foreground mt-1">{new Date(req.created_at).toLocaleString()}</div>
                    </div>

                    {req.status === 'pending' && (
                      <div className="flex items-center gap-2 shrink-0">
                        {showPasswordFor === req.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="password"
                              value={passwordInput}
                              onChange={(e) => setPasswordInput(e.target.value)}
                              placeholder="Set password"
                              className="px-3 py-1.5 bg-bg4 border border-border rounded-md text-xs text-foreground outline-none w-32 focus:border-primary"
                            />
                            <button onClick={() => handleApprove(req.id)} disabled={!!approving}
                              className="px-3 py-1.5 bg-asp-green text-white text-xs font-bold rounded-md hover:opacity-90 flex items-center gap-1">
                              {approving === req.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                              Create
                            </button>
                            <button onClick={() => { setShowPasswordFor(null); setPasswordInput(''); }}
                              className="text-muted-foreground hover:text-white text-xs">✕</button>
                          </div>
                        ) : (
                          <>
                            <button onClick={() => setShowPasswordFor(req.id)}
                              className="px-3 py-1.5 bg-asp-green/10 text-asp-green text-xs font-bold rounded-md border border-asp-green/25 hover:bg-asp-green/20 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> Approve
                            </button>
                            <button onClick={() => handleDeny(req.id)}
                              className="px-3 py-1.5 bg-asp-red/10 text-asp-red text-xs font-bold rounded-md border border-asp-red/25 hover:bg-asp-red/20 flex items-center gap-1">
                              <XCircle className="w-3 h-3" /> Deny
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {actionMsg && (
            <div className={`mt-3 text-xs text-center p-2 rounded-md ${
              actionMsg.startsWith('Error') ? 'text-asp-red bg-asp-red/10 border border-asp-red/20' : 'text-asp-green bg-asp-green/10 border border-asp-green/20'
            }`}>
              {actionMsg}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-[280px_1fr] gap-4 h-[calc(100%-40px)]">
          {/* Contact List */}
          <div className="bg-bg2 border border-border rounded-xl overflow-y-auto">
            <div className="px-4 py-3 border-b border-border text-xs font-extrabold text-foreground tracking-wider uppercase">
              💬 Conversations
            </div>
            {CHANNELS.map((c, i) => (
              <div key={i} onClick={() => setSelectedChat(i)}
                className={`px-4 py-3.5 border-b border-border cursor-pointer transition-all ${
                  selectedChat === i ? 'bg-primary/5 border-l-[3px] border-l-primary' : 'hover:bg-bg3'
                }`}>
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[13px] font-bold text-white">{c.avatar} {c.name}</span>
                  <span className="text-[10px] text-muted-foreground">{c.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">{c.role}</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${c.status === 'online' ? 'bg-asp-green' : 'bg-muted-foreground'}`} />
                </div>
                <div className="text-[11px] text-muted-foreground truncate mt-0.5">{c.preview}</div>
              </div>
            ))}
          </div>

          {/* Chat Area */}
          <div className="bg-bg2 border border-border rounded-xl flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-bg4 border border-border flex items-center justify-center text-lg">
                {CHANNELS[selectedChat].avatar}
              </div>
              <div>
                <div className="text-[15px] font-extrabold text-white">{CHANNELS[selectedChat].name}</div>
                <div className="text-[11px] text-asp-green flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-asp-green inline-block" />
                  {CHANNELS[selectedChat].status === 'online' ? 'Online' : 'Away'}
                </div>
              </div>
            </div>
            <div className="flex-1 px-5 py-4 overflow-y-auto flex flex-col gap-3">
              {msgs.map((m, i) => (
                <div key={i} className={`flex gap-2.5 max-w-[80%] ${m.mine ? 'self-end flex-row-reverse' : ''}`}>
                  <div className="w-7 h-7 rounded-full bg-bg4 flex items-center justify-center text-xs shrink-0">
                    {m.mine ? '👤' : CHANNELS[selectedChat].avatar}
                  </div>
                  <div>
                    <div className={`px-3.5 py-2.5 rounded-xl text-[13px] leading-relaxed ${
                      m.mine ? 'bg-primary text-primary-foreground font-semibold rounded-br-sm' : 'bg-bg3 text-foreground border border-border rounded-bl-sm'
                    }`}>
                      {m.text}
                    </div>
                    <div className={`text-[10px] text-muted-foreground mt-1 ${m.mine ? 'text-right pr-1' : 'pl-1'}`}>{m.time}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 py-3.5 border-t border-border flex gap-2.5 items-center">
              <input value={inputVal} onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type a message..."
                className="flex-1 px-3.5 py-2.5 bg-bg3 border border-border rounded-lg text-sm text-foreground outline-none focus:border-primary" />
              <button onClick={handleSend} className="px-4 py-2.5 bg-primary text-primary-foreground text-sm font-extrabold rounded-lg hover:bg-teal2 transition-all active:scale-95">
                Send ➤
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Communication;
