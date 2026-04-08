import { useState, useRef, useEffect } from 'react';
import { useDataSource } from '@/contexts/DataSourceProvider';
import { useAuth } from '@/contexts/AuthContext';
import { MessageSquare, Send, User, Users, Wrench, DollarSign, Search, ChevronRight, Shield } from 'lucide-react';

/**
 * Communication Hub — built from live project messages
 * 
 * Shows all message threads across projects. Each "conversation" is a project
 * that has messages attached. Falls back to an empty state with guidance.
 */
const Communication = () => {
  const store = useDataSource();
  const { user } = useAuth();
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [inputVal, setInputVal] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const projects = store.projects || [];

  // Gather conversations: projects that have messages
  const conversations = projects.map(p => {
    const messages = (p as any).messages || [];
    const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;
    return { project: p, messages, lastMsg };
  }).sort((a, b) => {
    // Projects with messages first, then by recency
    if (a.messages.length > 0 && b.messages.length === 0) return -1;
    if (b.messages.length > 0 && a.messages.length === 0) return 1;
    return 0;
  });

  const filtered = searchQuery.trim()
    ? conversations.filter(c =>
        c.project.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.project.id.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : conversations;

  const activeConvo = selectedProject
    ? conversations.find(c => c.project.id === selectedProject)
    : filtered[0] || null;

  const activeMessages = activeConvo?.messages || [];

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages.length]);

  const handleSend = () => {
    if (!inputVal.trim() || !activeConvo) return;
    store.addProjectMessage(activeConvo.project.id, {
      sender: user?.name || 'Ops',
      role: 'ops',
      text: inputVal.trim(),
      time: 'Now',
    });
    setInputVal('');
  };

  const getRoleIcon = (role?: string) => {
    if (role === 'installer') return <Wrench className="w-3 h-3" />;
    if (role === 'financier') return <DollarSign className="w-3 h-3" />;
    if (role === 'ops') return <Shield className="w-3 h-3" />;
    return <User className="w-3 h-3" />;
  };

  const getRoleColor = (role?: string) => {
    if (role === 'installer') return 'text-amber-400';
    if (role === 'financier') return 'text-emerald-400';
    if (role === 'ops') return 'text-cyan-400';
    return 'text-blue-400';
  };

  return (
    <div className="animate-fade-in-up" style={{ height: 'calc(100vh - 180px)' }}>
      <h2 className="text-lg font-black text-white mb-4 flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-primary" /> Communication Hub
      </h2>

      {conversations.length === 0 ? (
        <div className="flex items-center justify-center h-[calc(100%-40px)]">
          <div className="text-center">
            <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-sm font-bold text-white mb-1">No conversations yet</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              Messages will appear here as team members communicate on active projects through their portals.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-[280px_1fr] gap-4 h-[calc(100%-40px)]">
          {/* Contact List */}
          <div className="bg-bg2 border border-border rounded-xl overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-border">
              <div className="text-xs font-extrabold text-foreground tracking-wider uppercase mb-2 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-primary" /> Project Threads
              </div>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search projects..."
                  className="w-full pl-8 pr-3 py-1.5 bg-bg3 border border-border rounded-lg text-xs text-foreground outline-none focus:border-primary/40 transition-colors"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filtered.map(c => {
                const isActive = activeConvo?.project.id === c.project.id;
                return (
                  <div
                    key={c.project.id}
                    onClick={() => setSelectedProject(c.project.id)}
                    className={`px-4 py-3.5 border-b border-border cursor-pointer transition-all ${
                      isActive ? 'bg-primary/5 border-l-[3px] border-l-primary' : 'hover:bg-bg3'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[13px] font-bold text-white truncate">{c.project.customerName}</span>
                      {c.messages.length > 0 && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary font-bold shrink-0 ml-1">
                          {c.messages.length}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] text-muted-foreground font-mono">{c.project.id.slice(0, 8)}</span>
                      <span className="text-[10px] text-muted-foreground">M{c.project.currentMilestone + 1}/{c.project.totalMilestones}</span>
                    </div>
                    {c.lastMsg ? (
                      <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                        <span className="font-semibold">{c.lastMsg.sender}:</span> {c.lastMsg.text}
                      </div>
                    ) : (
                      <div className="text-[11px] text-muted-foreground/50 italic">No messages</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chat Area */}
          <div className="bg-bg2 border border-border rounded-xl flex flex-col overflow-hidden">
            {activeConvo ? (
              <>
                <div className="px-5 py-4 border-b border-border flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-extrabold text-white">{activeConvo.project.customerName}</div>
                    <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <span className="font-mono">{activeConvo.project.id.slice(0, 8)}</span>
                      <ChevronRight className="w-3 h-3" />
                      <span>M{activeConvo.project.currentMilestone + 1} of {activeConvo.project.totalMilestones}</span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 px-5 py-4 overflow-y-auto flex flex-col gap-3">
                  {activeMessages.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center">
                        <MessageSquare className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground">No messages on this project yet. Start the conversation below.</p>
                      </div>
                    </div>
                  ) : (
                    activeMessages.map((m: any, i: number) => {
                      const isOps = m.role === 'ops';
                      return (
                        <div key={i} className={`flex gap-2.5 max-w-[80%] ${isOps ? 'self-end flex-row-reverse' : ''}`}>
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 border ${
                            isOps ? 'bg-primary/15 border-primary/30' : 'bg-bg4 border-border'
                          }`}>
                            <span className={getRoleColor(m.role)}>{getRoleIcon(m.role)}</span>
                          </div>
                          <div>
                            <div className={`text-[9px] mb-0.5 ${isOps ? 'text-right' : ''} ${getRoleColor(m.role)} font-bold`}>
                              {m.sender} <span className="text-muted-foreground font-normal">· {m.role}</span>
                            </div>
                            <div className={`px-3.5 py-2.5 rounded-xl text-[13px] leading-relaxed ${
                              isOps ? 'bg-primary text-primary-foreground font-semibold rounded-br-sm' : 'bg-bg3 text-foreground border border-border rounded-bl-sm'
                            }`}>
                              {m.text}
                            </div>
                            <div className={`text-[10px] text-muted-foreground mt-1 ${isOps ? 'text-right pr-1' : 'pl-1'}`}>{m.time}</div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="px-4 py-3.5 border-t border-border flex gap-2.5 items-center">
                  <input
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Type a message..."
                    className="flex-1 px-3.5 py-2.5 bg-bg3 border border-border rounded-lg text-sm text-foreground outline-none focus:border-primary"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!inputVal.trim()}
                    className="px-4 py-2.5 bg-primary text-primary-foreground text-sm font-extrabold rounded-lg hover:bg-teal2 transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" /> Send
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-xs text-muted-foreground">Select a project to view messages</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Communication;
