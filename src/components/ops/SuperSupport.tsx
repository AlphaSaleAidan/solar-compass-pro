import { useState } from 'react';
import { useDataSource } from '@/contexts/DataSourceProvider';
import { Shield, Send, AlertTriangle, CheckCircle, Clock, ChevronDown, User, Zap } from 'lucide-react';

const SuperSupport = () => {
  const store = useProjectStore();
  const { tickets, projects } = store;
  const [selectedTicket, setSelectedTicket] = useState<string | null>(tickets[0]?.id || null);
  const [inputVal, setInputVal] = useState('');
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newProjectId, setNewProjectId] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('high');

  const ticket = tickets.find(t => t.id === selectedTicket);

  const handleSend = () => {
    if (!inputVal.trim() || !selectedTicket) return;
    store.addTicketMessage(selectedTicket, { sender: 'Admin Ops', role: 'ops', text: inputVal, time: 'Now' });
    setInputVal('');
  };

  const handleCreateTicket = () => {
    if (!newSubject.trim() || !newProjectId) return;
    store.createTicket({
      projectId: newProjectId,
      subject: newSubject,
      priority: newPriority,
      status: 'open',
      createdAt: new Date().toISOString().split('T')[0],
      createdBy: 'Admin Ops',
      createdByRole: 'ops',
      messages: [{ sender: 'Admin Ops', role: 'ops', text: newSubject, time: 'Now' }],
    });
    setShowNewTicket(false);
    setNewSubject('');
  };

  const handleResolve = (ticketId: string) => {
    store.resolveTicket(ticketId);
  };

  const priorityColors: Record<string, string> = {
    low: 'bg-[hsl(var(--blue))]/10 text-[hsl(var(--blue))] border-[hsl(var(--blue))]/25',
    medium: 'bg-[hsl(var(--yellow))]/10 text-[hsl(var(--yellow))] border-[hsl(var(--yellow))]/25',
    high: 'bg-[hsl(var(--red))]/10 text-[hsl(var(--red))] border-[hsl(var(--red))]/25',
    critical: 'bg-[hsl(var(--red))]/20 text-[hsl(var(--red))] border-[hsl(var(--red))]/40',
  };

  const statusIcons: Record<string, JSX.Element> = {
    open: <AlertTriangle className="w-3 h-3 text-[hsl(var(--yellow))]" />,
    in_progress: <Clock className="w-3 h-3 text-[hsl(var(--blue))]" />,
    resolved: <CheckCircle className="w-3 h-3 text-[hsl(var(--green))]" />,
  };

  return (
    <div className="animate-fade-in-up" style={{ height: 'calc(100vh - 180px)' }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-black text-foreground flex items-center gap-2">
          <Shield className="w-5 h-5 text-[hsl(var(--red))]" />
          ASP Super Support Escalation
        </h2>
        <button
          onClick={() => setShowNewTicket(true)}
          className="px-3 py-1.5 bg-[hsl(var(--red))]/15 border border-[hsl(var(--red))]/30 rounded-lg text-xs font-bold text-[hsl(var(--red))] hover:bg-[hsl(var(--red))]/25 transition-all active:scale-95 flex items-center gap-1.5"
        >
          <AlertTriangle className="w-3.5 h-3.5" /> Escalate New Issue
        </button>
      </div>

      <div className="grid grid-cols-[320px_1fr] gap-4 h-[calc(100%-50px)]">
        {/* Ticket List */}
        <div className="bg-[hsl(var(--bg2))] border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-[hsl(var(--bg3))] border-b border-border text-xs font-extrabold text-foreground tracking-wider uppercase flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" /> Escalation Tickets ({tickets.length})
          </div>
          <div className="overflow-y-auto max-h-[calc(100%-44px)]">
            {tickets.map(t => (
              <div
                key={t.id}
                onClick={() => setSelectedTicket(t.id)}
                className={`px-4 py-3.5 border-b border-border cursor-pointer transition-all ${
                  selectedTicket === t.id ? 'bg-primary/5 border-l-[3px] border-l-primary' : 'hover:bg-[hsl(var(--bg3))]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-foreground truncate max-w-[180px]">{t.subject}</span>
                  {statusIcons[t.status]}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">{t.projectId}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase border ${priorityColors[t.priority]}`}>
                    {t.priority}
                  </span>
                  {t.createdByRole !== 'ops' && (
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase bg-[hsl(var(--blue))]/10 text-[hsl(var(--blue))] border border-[hsl(var(--blue))]/25">
                      {t.createdByRole}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="bg-[hsl(var(--bg2))] border border-border rounded-xl flex flex-col overflow-hidden">
          {ticket ? (
            <>
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <div>
                  <div className="text-[15px] font-extrabold text-foreground">{ticket.subject}</div>
                  <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                    {ticket.projectId} · {projects.find(p => p.id === ticket.projectId)?.customerName || 'Unknown'}
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase border ${priorityColors[ticket.priority]}`}>
                      {ticket.priority}
                    </span>
                    <span className="text-[9px] text-muted-foreground">by {ticket.createdBy}</span>
                  </div>
                </div>
                {ticket.status !== 'resolved' && (
                  <button
                    onClick={() => handleResolve(ticket.id)}
                    className="px-3 py-1.5 bg-[hsl(var(--green))]/15 border border-[hsl(var(--green))]/30 rounded-md text-xs font-bold text-[hsl(var(--green))] hover:bg-[hsl(var(--green))]/25 transition-all active:scale-95 flex items-center gap-1"
                  >
                    <CheckCircle className="w-3 h-3" /> Resolve
                  </button>
                )}
              </div>
              <div className="flex-1 px-5 py-4 overflow-y-auto flex flex-col gap-3">
                {ticket.messages.map((m, i) => (
                  <div key={i} className={`flex gap-2.5 max-w-[80%] ${m.role === 'ops' ? 'self-end flex-row-reverse' : ''}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 ${
                      m.role === 'support' ? 'bg-[hsl(var(--red))]/15' : m.role === 'installer' ? 'bg-[hsl(var(--blue))]/15' : m.role === 'financier' ? 'bg-[hsl(var(--yellow))]/15' : 'bg-[hsl(var(--bg4))]'
                    }`}>
                      {m.role === 'support' ? <Shield className="w-3.5 h-3.5 text-[hsl(var(--red))]" /> : <User className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <div className={`px-3.5 py-2.5 rounded-xl text-[13px] leading-relaxed ${
                        m.role === 'ops' ? 'bg-primary text-primary-foreground font-semibold rounded-br-sm' : 'bg-[hsl(var(--bg3))] text-foreground border border-border rounded-bl-sm'
                      }`}>
                        {m.text}
                      </div>
                      <div className={`text-[10px] text-muted-foreground mt-1 ${m.role === 'ops' ? 'text-right pr-1' : 'pl-1'}`}>
                        {m.sender} · {m.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {ticket.status !== 'resolved' && (
                <div className="px-4 py-3.5 border-t border-border flex gap-2.5 items-center">
                  <input
                    value={inputVal}
                    onChange={e => setInputVal(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    placeholder="Type escalation message..."
                    className="flex-1 px-3.5 py-2.5 bg-[hsl(var(--bg3))] border border-border rounded-lg text-sm text-foreground outline-none focus:border-primary"
                  />
                  <button onClick={handleSend} className="px-4 py-2.5 bg-primary text-primary-foreground text-sm font-extrabold rounded-lg hover:opacity-90 transition-all active:scale-95 flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5" /> Send
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Shield className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Select a ticket to view the escalation thread</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Ticket Modal */}
      {showNewTicket && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center" onClick={() => setShowNewTicket(false)}>
          <div className="bg-[hsl(var(--bg2))] border border-border rounded-xl p-6 w-[440px] animate-scale-in" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-black text-foreground mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[hsl(var(--red))]" />
              Escalate to Super Support
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase block mb-1">Project</label>
                <select
                  value={newProjectId}
                  onChange={e => setNewProjectId(e.target.value)}
                  className="w-full px-3 py-2 bg-[hsl(var(--bg3))] border border-border rounded-md text-sm text-foreground outline-none focus:border-primary"
                >
                  <option value="">Select project...</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.id} — {p.customerName}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase block mb-1">Priority</label>
                <select
                  value={newPriority}
                  onChange={e => setNewPriority(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[hsl(var(--bg3))] border border-border rounded-md text-sm text-foreground outline-none focus:border-primary"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase block mb-1">Subject</label>
                <textarea
                  value={newSubject}
                  onChange={e => setNewSubject(e.target.value)}
                  placeholder="Describe the issue requiring escalation..."
                  rows={3}
                  className="w-full px-3 py-2.5 bg-[hsl(var(--bg3))] border border-border rounded-lg text-sm text-foreground outline-none focus:border-primary resize-none"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button onClick={() => setShowNewTicket(false)} className="px-4 py-2 bg-[hsl(var(--bg3))] border border-border rounded-lg text-xs font-bold text-muted-foreground hover:text-foreground transition-all">
                Cancel
              </button>
              <button onClick={handleCreateTicket} className="px-4 py-2 bg-[hsl(var(--red))]/15 border border-[hsl(var(--red))]/30 rounded-lg text-xs font-bold text-[hsl(var(--red))] hover:bg-[hsl(var(--red))]/25 transition-all active:scale-95 flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5" /> Submit Escalation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperSupport;