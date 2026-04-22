import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useDataSource } from '@/contexts/DataSourceProvider';
import { MessageSquare, Send, Loader2, Users } from 'lucide-react';

// Demo fallback data
const DEMO_CHANNELS = [
  { name: 'Jordan Mills', avatar: '👤', role: 'Sales Rep', status: 'online', time: '9:50 AM', preview: '3 new leads ready to submit', projectId: 'demo-0' },
  { name: 'Caitlin Fox', avatar: '👤', role: 'Sales Rep', status: 'away', time: 'Yesterday', preview: 'Backend pay question on ASP-2025', projectId: 'demo-1' },
  { name: 'Samantha Cole', avatar: '👤', role: 'Sales Rep', status: 'online', time: 'Tuesday', preview: 'Deal cancelled — White hold', projectId: 'demo-2' },
  { name: 'SunTech Installations', avatar: '🔧', role: 'Installer', status: 'online', time: '10:22 AM', preview: 'Crew on site by 8am tomorrow', projectId: 'demo-3' },
  { name: 'Pro Solar TX', avatar: '⚡', role: 'Installer', status: 'online', time: 'Yesterday', preview: 'Permit for Williams came through', projectId: 'demo-4' },
];

const DEMO_MESSAGES: Record<string, { mine: boolean; text: string; time: string }[]> = {
  'demo-0': [
    { mine: false, text: "Good morning — I've got 3 qualified leads ready to submit this week. All pre-credit checked, utility bills verified.", time: '9:30 AM' },
    { mine: true, text: "Make sure all three have the 80% true offset confirmed before submitting. We can't have any undersized deals.", time: '9:40 AM' },
    { mine: false, text: "All confirmed at 85%+ offset. SOW is locked on each. Submitting through the portal today.", time: '9:50 AM' },
  ],
  'demo-1': [
    { mine: false, text: "Hey — quick question on my backend commission for Robert Chen (ASP-2025). When does the next milestone pay trigger?", time: 'Yesterday 1:20 PM' },
    { mine: true, text: "Your M5 commission releases when the utility inspection is confirmed. We've verified it's in progress.", time: 'Yesterday 1:45 PM' },
  ],
  'demo-3': [
    { mine: false, text: "Good morning! Confirming crew deployment for ASP-2029 (Mendoza). We're all set for March 20th.", time: '9:15 AM' },
    { mine: true, text: "Great — make sure the Duracell 20kW arrives on site by 7:30am. Confirm materials receipt.", time: '9:22 AM' },
    { mine: false, text: "Confirmed. Materials already staged. Driver confirmed 7:15am drop.", time: '9:30 AM' },
    { mine: true, text: "M3 will be released within 48hrs once we confirm install is scheduled. You're on track.", time: '9:45 AM' },
    { mine: false, text: "We'll have crew on site by 8am tomorrow. Looking forward to hitting that speed bonus!", time: '10:22 AM' },
  ],
};

interface MessageItem {
  id: string;
  text: string;
  mine: boolean;
  senderName: string;
  senderRole: string;
  time: string;
  createdAt: string;
}

interface ChannelItem {
  projectId: string;
  name: string;
  avatar: string;
  role: string;
  status: string;
  time: string;
  preview: string;
}

const Communication = () => {
  const { user } = useAuth();
  const isDemo = user?.isDemo;
  const store = useDataSource();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [inputVal, setInputVal] = useState('');
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Build channel list from projects
  const channels: ChannelItem[] = isDemo
    ? DEMO_CHANNELS
    : store.projects.map(p => ({
        projectId: p.id,
        name: p.customerName || `Project ${p.id.slice(0, 6)}`,
        avatar: '📋',
        role: p.stage || 'Active',
        status: 'online',
        time: '',
        preview: p.systemSize || '',
      }));

  // Auto-select first project
  useEffect(() => {
    if (!selectedProjectId && channels.length > 0) {
      setSelectedProjectId(channels[0].projectId);
    }
  }, [channels.length, selectedProjectId]);

  // Fetch messages for selected project
  const fetchMessages = useCallback(async () => {
    if (!selectedProjectId || isDemo) return;
    setLoading(true);
    const { data } = await supabase
      .from('project_messages')
      .select('*')
      .eq('project_id', selectedProjectId)
      .order('created_at', { ascending: true });

    if (data) {
      setMessages(data.map(m => ({
        id: m.id,
        text: m.message,
        mine: m.sender_id === user?.id,
        senderName: m.sender_name,
        senderRole: m.sender_role,
        time: new Date(m.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        createdAt: m.created_at,
      })));
    }
    setLoading(false);
  }, [selectedProjectId, isDemo, user?.id]);

  useEffect(() => {
    fetchMessages();

    if (isDemo || !selectedProjectId) return;
    const channel = supabase
      .channel(`comm-messages-${selectedProjectId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'project_messages', filter: `project_id=eq.${selectedProjectId}` }, (payload) => {
        const m = payload.new as any;
        setMessages(prev => [...prev, {
          id: m.id,
          text: m.message,
          mine: m.sender_id === user?.id,
          senderName: m.sender_name,
          senderRole: m.sender_role,
          time: new Date(m.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
          createdAt: m.created_at,
        }]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchMessages, selectedProjectId, isDemo, user?.id]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputVal.trim() || !selectedProjectId) return;
    const text = inputVal.trim();
    setInputVal('');

    if (isDemo) {
      // Demo mode: local only
      setMessages(prev => [...prev, {
        id: `local-${Date.now()}`,
        text,
        mine: true,
        senderName: 'You',
        senderRole: 'backend_ops',
        time: 'Now',
        createdAt: new Date().toISOString(),
      }]);
      return;
    }

    setSending(true);
    const roleName = user?.role || 'backend_ops';
    const userName = user?.name || 'Unknown';
    await supabase.from('project_messages').insert({
      project_id: selectedProjectId,
      message: text,
      sender_id: user?.id || null,
      sender_name: userName,
      sender_role: roleName,
    });
    setSending(false);
  };

  // Compute display data
  const selectedChannel = channels.find(c => c.projectId === selectedProjectId) || channels[0];
  const demoMsgs = isDemo && selectedProjectId ? (DEMO_MESSAGES[selectedProjectId] || []).map((m, i) => ({
    id: `demo-${i}`,
    text: m.text,
    mine: m.mine,
    senderName: m.mine ? 'You' : (selectedChannel?.name || 'Unknown'),
    senderRole: m.mine ? 'backend_ops' : (selectedChannel?.role || ''),
    time: m.time,
    createdAt: '',
  })) : [];
  const displayMessages = isDemo ? demoMsgs : messages;

  return (
    <div className="animate-fade-in-up" style={{ height: 'calc(100vh - 180px)' }}>
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-lg font-black text-white">💬 Communication Hub</h2>
        {!isDemo && (
          <span className="ml-2 text-[10px] text-muted-foreground font-medium bg-primary/10 px-2 py-0.5 rounded-full">
            🔴 LIVE
          </span>
        )}
      </div>
      <div className="grid grid-cols-[280px_1fr] gap-4 h-[calc(100%-40px)]">
        {/* Contact List */}
        <div className="bg-bg2 border border-border rounded-xl overflow-y-auto">
          <div className="px-4 py-3 border-b border-border text-xs font-extrabold text-foreground tracking-wider uppercase flex items-center gap-2">
            <Users className="w-3.5 h-3.5" /> {isDemo ? 'Conversations' : `Projects (${channels.length})`}
          </div>
          {channels.length === 0 && !isDemo && (
            <div className="px-4 py-8 text-center text-muted-foreground">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">No projects yet</p>
            </div>
          )}
          {channels.map((c) => (
            <div
              key={c.projectId}
              onClick={() => setSelectedProjectId(c.projectId)}
              className={`px-4 py-3.5 border-b border-border cursor-pointer transition-all ${
                selectedProjectId === c.projectId ? 'bg-primary/5 border-l-[3px] border-l-primary' : 'hover:bg-bg3'
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="text-[13px] font-bold text-white">{c.avatar} {c.name}</span>
                <span className="text-[10px] text-muted-foreground">{c.time}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">{c.role}</span>
              </div>
              <div className="text-[11px] text-muted-foreground truncate mt-0.5">{c.preview}</div>
            </div>
          ))}
        </div>

        {/* Chat Area */}
        <div className="bg-bg2 border border-border rounded-xl flex flex-col overflow-hidden">
          {selectedChannel ? (
            <>
              <div className="px-5 py-4 border-b border-border flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-bg4 border border-border flex items-center justify-center text-lg">
                  {selectedChannel.avatar}
                </div>
                <div>
                  <div className="text-[15px] font-extrabold text-white">{selectedChannel.name}</div>
                  <div className="text-[11px] text-muted-foreground">{selectedChannel.role}</div>
                </div>
              </div>
              <div className="flex-1 px-5 py-4 overflow-y-auto flex flex-col gap-3">
                {loading && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                )}
                {!loading && displayMessages.length === 0 && (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-xs">No messages yet — start the conversation</p>
                    </div>
                  </div>
                )}
                {displayMessages.map((m) => (
                  <div key={m.id} className={`flex gap-2.5 max-w-[80%] ${m.mine ? 'self-end flex-row-reverse' : ''}`}>
                    <div className="w-7 h-7 rounded-full bg-bg4 flex items-center justify-center text-xs shrink-0">
                      {m.mine ? '👤' : selectedChannel.avatar}
                    </div>
                    <div>
                      {!m.mine && (
                        <div className="text-[10px] text-muted-foreground font-bold mb-0.5 pl-1">{m.senderName} · {m.senderRole}</div>
                      )}
                      <div className={`px-3.5 py-2.5 rounded-xl text-[13px] leading-relaxed ${
                        m.mine ? 'bg-primary text-primary-foreground font-semibold rounded-br-sm' : 'bg-bg3 text-foreground border border-border rounded-bl-sm'
                      }`}>
                        {m.text}
                      </div>
                      <div className={`text-[10px] text-muted-foreground mt-1 ${m.mine ? 'text-right pr-1' : 'pl-1'}`}>{m.time}</div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <div className="px-4 py-3.5 border-t border-border flex gap-2.5 items-center">
                <input
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder="Type a message..."
                  className="flex-1 px-3.5 py-2.5 bg-bg3 border border-border rounded-lg text-sm text-foreground outline-none focus:border-primary"
                />
                <button
                  onClick={handleSend}
                  disabled={sending || !inputVal.trim()}
                  className="px-4 py-2.5 bg-primary text-primary-foreground text-sm font-extrabold rounded-lg hover:bg-teal2 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Send
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <p className="text-sm">Select a conversation to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Communication;
