/**
 * MessageCenter — Full in-app messaging experience
 * 
 * Slide-out panel accessible from every portal via the floating message button.
 * Designed for future iMessage concierge integration — channel abstraction
 * means swapping to Twilio/iMessage only requires registering a new provider.
 * 
 * Layout: Sidebar (conversations) | Main (active chat)
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Send, X, Search, Users, User, Shield, DollarSign,
  Wrench, ChevronRight, Phone, Wifi, WifiOff, Hash, Bot,
  Paperclip, Smile, MoreVertical, Check, CheckCheck, Clock,
  ArrowLeft, Plus, Star, BellOff, Bell,
} from 'lucide-react';
import { MessagingService } from '@/lib/messaging';
import type { Conversation, Message, ChannelType } from '@/lib/messaging/types';
import { useAuth } from '@/contexts/AuthContext';

/* ─── Role styling ─────────────────────────────────────────────────── */
const ROLE_CONFIG: Record<string, { icon: typeof User; color: string; bg: string; label: string }> = {
  sales_rep:    { icon: Star,      color: 'text-blue-400',    bg: 'bg-blue-400/10',    label: 'Sales' },
  backend_ops:  { icon: Shield,    color: 'text-cyan-400',    bg: 'bg-cyan-400/10',    label: 'Ops' },
  installer:    { icon: Wrench,    color: 'text-amber-400',   bg: 'bg-amber-400/10',   label: 'Installer' },
  financier:    { icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-400/10', label: 'Finance' },
  system:       { icon: Bot,       color: 'text-primary',     bg: 'bg-primary/10',     label: 'System' },
  admin:        { icon: Shield,    color: 'text-purple-400',  bg: 'bg-purple-400/10',  label: 'Admin' },
};

const getRole = (role: string) => ROLE_CONFIG[role] || ROLE_CONFIG.system;

/* ─── Channel badge ─────────────────────────────────────────────────── */
const ChannelBadge = ({ channel }: { channel: ChannelType }) => {
  const config = {
    in_app: { label: 'In-App', icon: MessageSquare, color: 'text-primary' },
    sms: { label: 'SMS', icon: Phone, color: 'text-green-400' },
    imessage: { label: 'iMessage', icon: MessageSquare, color: 'text-blue-400' },
    email: { label: 'Email', icon: Hash, color: 'text-amber-400' },
  }[channel];
  const Icon = config.icon;
  return (
    <span className={`flex items-center gap-1 text-[9px] ${config.color} font-bold`}>
      <Icon className="w-2.5 h-2.5" /> {config.label}
    </span>
  );
};

/* ─── Time formatting ────────────────────────────────────────────────── */
function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h`;
  
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d`;
  
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatTimeFull(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

/* ─── Status icon ────────────────────────────────────────────────────── */
const StatusIcon = ({ status }: { status: string }) => {
  if (status === 'read') return <CheckCheck className="w-3 h-3 text-primary" />;
  if (status === 'delivered') return <CheckCheck className="w-3 h-3 text-gray-500" />;
  if (status === 'sent') return <Check className="w-3 h-3 text-gray-500" />;
  if (status === 'sending') return <Clock className="w-3 h-3 text-gray-600 animate-pulse" />;
  return null;
};

/* ─── Main Component ─────────────────────────────────────────────────── */
export default function MessageCenter({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user, profile } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const userId = user?.id || 'admin';
  const userName = profile?.full_name || user?.email?.split('@')[0] || 'User';
  const userRole = profile?.role || 'admin';

  // Initialize demo data & subscribe
  useEffect(() => {
    MessagingService.seedDemoData(userId, userName, userRole);
    
    const updateConversations = () => {
      setConversations(MessagingService.getConversationsForUser(userId));
    };
    
    updateConversations();
    const unsub = MessagingService.subscribe(updateConversations);
    return unsub;
  }, [userId, userName, userRole]);

  // Update messages when active conversation changes
  useEffect(() => {
    if (activeConvoId) {
      setMessages(MessagingService.getMessages(activeConvoId));
      MessagingService.markConversationRead(activeConvoId, userId);
    }
  }, [activeConvoId, userId, conversations]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Focus input when opening a conversation
  useEffect(() => {
    if (activeConvoId && isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [activeConvoId, isOpen]);

  const handleSend = useCallback(async () => {
    if (!inputVal.trim() || !activeConvoId) return;
    
    await MessagingService.sendMessage({
      conversationId: activeConvoId,
      senderId: userId,
      senderName: userName,
      senderRole: userRole,
      text: inputVal.trim(),
    });
    
    setInputVal('');
    setMessages(MessagingService.getMessages(activeConvoId));
  }, [inputVal, activeConvoId, userId, userName, userRole]);

  const activeConvo = activeConvoId ? conversations.find(c => c.id === activeConvoId) : null;

  const filteredConversations = searchQuery.trim()
    ? conversations.filter(c =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.subtitle?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : conversations;

  const totalUnread = conversations.reduce((s, c) => s + c.unreadCount, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-[720px] z-[61] bg-[hsl(222,25%,6%)] border-l border-white/10 flex flex-col shadow-2xl shadow-black/50"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                {activeConvo && !showSidebar && (
                  <button
                    onClick={() => { setActiveConvoId(null); setShowSidebar(true); }}
                    className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4 text-white/60" />
                  </button>
                )}
                <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center">
                  <MessageSquare className="w-4.5 h-4.5 text-primary" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Messages</h2>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-white/40">
                      {totalUnread > 0 ? `${totalUnread} unread` : 'All caught up'}
                    </span>
                    <ChannelBadge channel="in_app" />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button className="p-2 rounded-lg hover:bg-white/5 transition-colors" title="New conversation">
                  <Plus className="w-4 h-4 text-white/40" />
                </button>
                <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 transition-colors">
                  <X className="w-4 h-4 text-white/40" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 flex overflow-hidden">
              {/* Sidebar */}
              <AnimatePresence mode="wait">
                {(showSidebar || !activeConvo) && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: activeConvo ? 260 : '100%' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="flex flex-col border-r border-white/[0.06] overflow-hidden shrink-0"
                  >
                    {/* Search */}
                    <div className="px-3 py-3 border-b border-white/[0.04]">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-white/30 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          placeholder="Search conversations..."
                          className="w-full pl-8 pr-3 py-2 bg-white/[0.04] border border-white/[0.06] rounded-lg text-xs text-white placeholder:text-white/25 outline-none focus:border-primary/30 transition-colors"
                        />
                      </div>
                    </div>

                    {/* Conversation list */}
                    <div className="flex-1 overflow-y-auto">
                      {filteredConversations.length === 0 ? (
                        <div className="p-6 text-center">
                          <MessageSquare className="w-8 h-8 text-white/10 mx-auto mb-2" />
                          <p className="text-xs text-white/30">No conversations yet</p>
                        </div>
                      ) : (
                        filteredConversations.map(convo => {
                          const isActive = activeConvoId === convo.id;
                          const otherParticipant = convo.participants.find(p => p.userId !== userId);
                          const roleConfig = getRole(otherParticipant?.role || convo.type === 'system' ? 'system' : 'admin');
                          const RoleIcon = roleConfig.icon;

                          return (
                            <button
                              key={convo.id}
                              onClick={() => {
                                setActiveConvoId(convo.id);
                                if (window.innerWidth < 640) setShowSidebar(false);
                              }}
                              className={`w-full text-left px-3.5 py-3.5 border-b border-white/[0.03] transition-all ${
                                isActive
                                  ? 'bg-primary/[0.06] border-l-2 border-l-primary'
                                  : 'hover:bg-white/[0.03] border-l-2 border-l-transparent'
                              }`}
                            >
                              <div className="flex gap-3">
                                {/* Avatar */}
                                <div className={`w-10 h-10 rounded-xl ${roleConfig.bg} flex items-center justify-center shrink-0 relative`}>
                                  {convo.type === 'group' ? (
                                    <Users className={`w-4.5 h-4.5 ${roleConfig.color}`} />
                                  ) : (
                                    <RoleIcon className={`w-4.5 h-4.5 ${roleConfig.color}`} />
                                  )}
                                  {otherParticipant?.online && (
                                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-[hsl(222,25%,6%)]" />
                                  )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-0.5">
                                    <span className="text-[13px] font-bold text-white truncate">{convo.title}</span>
                                    {convo.lastMessage && (
                                      <span className="text-[10px] text-white/25 shrink-0 ml-2">
                                        {formatTime(convo.lastMessage.timestamp)}
                                      </span>
                                    )}
                                  </div>
                                  {convo.subtitle && (
                                    <p className="text-[10px] text-white/30 mb-0.5">{convo.subtitle}</p>
                                  )}
                                  {convo.lastMessage && (
                                    <div className="flex items-center gap-1.5">
                                      <p className="text-[11px] text-white/35 truncate flex-1">
                                        {convo.lastMessage.senderId === userId ? 'You: ' : ''}
                                        {convo.lastMessage.text}
                                      </p>
                                      {convo.unreadCount > 0 && (
                                        <span className="min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-primary text-black text-[9px] font-black shrink-0">
                                          {convo.unreadCount}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>

                    {/* Footer — channel info */}
                    <div className="px-3 py-2.5 border-t border-white/[0.04] flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[9px] text-white/20">
                        <Wifi className="w-3 h-3" />
                        <span>In-App Messaging</span>
                      </div>
                      <span className="text-[9px] text-white/15">iMessage coming soon</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Chat Area */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {activeConvo ? (
                  <>
                    {/* Chat header */}
                    <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-3">
                      {(() => {
                        const other = activeConvo.participants.find(p => p.userId !== userId);
                        const rc = getRole(other?.role || 'system');
                        const RIcon = rc.icon;
                        return (
                          <>
                            <div className={`w-9 h-9 rounded-xl ${rc.bg} flex items-center justify-center relative`}>
                              {activeConvo.type === 'group' ? (
                                <Users className={`w-4 h-4 ${rc.color}`} />
                              ) : (
                                <RIcon className={`w-4 h-4 ${rc.color}`} />
                              )}
                              {other?.online && (
                                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-[hsl(222,25%,6%)]" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-bold text-white">{activeConvo.title}</div>
                              <div className="text-[10px] text-white/30 flex items-center gap-2">
                                <span>{activeConvo.subtitle || `${activeConvo.participants.length} participants`}</span>
                                {other?.online && <span className="text-green-400 font-bold">Online</span>}
                                <ChannelBadge channel={activeConvo.preferredChannel} />
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              {other?.phone && (
                                <button className="p-2 rounded-lg hover:bg-white/5 transition-colors" title="Switch to SMS/iMessage">
                                  <Phone className="w-4 h-4 text-white/30" />
                                </button>
                              )}
                              <button className="p-2 rounded-lg hover:bg-white/5 transition-colors">
                                <MoreVertical className="w-4 h-4 text-white/30" />
                              </button>
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                      {messages.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center h-full">
                          <div className="text-center">
                            <MessageSquare className="w-10 h-10 text-white/10 mx-auto mb-3" />
                            <p className="text-sm text-white/25 font-bold mb-1">Start the conversation</p>
                            <p className="text-xs text-white/15">Messages sent here are instant and secure.</p>
                          </div>
                        </div>
                      ) : (
                        messages.map((msg, i) => {
                          const isMe = msg.senderId === userId;
                          const isSystem = msg.senderRole === 'system';
                          const rc = getRole(msg.senderRole);
                          const showAvatar = i === 0 || messages[i - 1]?.senderId !== msg.senderId;

                          if (isSystem) {
                            return (
                              <div key={msg.id} className={`flex gap-3 max-w-[85%] ${showAvatar ? '' : 'ml-11'}`}>
                                {showAvatar && (
                                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                    <Bot className="w-4 h-4 text-primary" />
                                  </div>
                                )}
                                <div>
                                  {showAvatar && (
                                    <div className="text-[10px] text-primary font-bold mb-1">ASP Concierge</div>
                                  )}
                                  <div className="px-3.5 py-2.5 rounded-xl rounded-bl-sm bg-primary/[0.08] border border-primary/10 text-[13px] text-white/80 leading-relaxed">
                                    {msg.text}
                                  </div>
                                  <div className="text-[9px] text-white/20 mt-1 pl-1">{formatTimeFull(msg.timestamp)}</div>
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div key={msg.id} className={`flex gap-2.5 max-w-[80%] ${isMe ? 'self-end flex-row-reverse ml-auto' : ''}`}>
                              {!isMe && showAvatar && (
                                <div className={`w-8 h-8 rounded-lg ${rc.bg} flex items-center justify-center shrink-0`}>
                                  <rc.icon className={`w-3.5 h-3.5 ${rc.color}`} />
                                </div>
                              )}
                              {!isMe && !showAvatar && <div className="w-8" />}
                              <div className={isMe ? 'text-right' : ''}>
                                {showAvatar && !isMe && (
                                  <div className={`text-[10px] ${rc.color} font-bold mb-1`}>
                                    {msg.senderName} <span className="text-white/20 font-normal">· {rc.label}</span>
                                  </div>
                                )}
                                <div className={`px-3.5 py-2.5 rounded-xl text-[13px] leading-relaxed ${
                                  isMe
                                    ? 'bg-primary text-primary-foreground font-medium rounded-br-sm'
                                    : 'bg-white/[0.04] border border-white/[0.06] text-white/80 rounded-bl-sm'
                                }`}>
                                  {msg.text}
                                </div>
                                <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end pr-1' : 'pl-1'}`}>
                                  <span className="text-[9px] text-white/20">{formatTimeFull(msg.timestamp)}</span>
                                  {isMe && <StatusIcon status={msg.status} />}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="px-4 py-3 border-t border-white/[0.06]">
                      <div className="flex gap-2 items-end">
                        <button className="p-2.5 rounded-lg hover:bg-white/5 transition-colors shrink-0">
                          <Paperclip className="w-4 h-4 text-white/30" />
                        </button>
                        <div className="flex-1 relative">
                          <input
                            ref={inputRef}
                            value={inputVal}
                            onChange={e => setInputVal(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                              }
                            }}
                            placeholder="Type a message..."
                            className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-white/25 outline-none focus:border-primary/30 transition-colors"
                          />
                        </div>
                        <button
                          onClick={handleSend}
                          disabled={!inputVal.trim()}
                          className="p-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/80 transition-all active:scale-95 disabled:opacity-20 disabled:pointer-events-none shrink-0"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between mt-2 px-1">
                        <div className="flex items-center gap-1.5 text-[9px] text-white/15">
                          <Wifi className="w-2.5 h-2.5" />
                          <span>Sending via In-App</span>
                          <span className="text-white/10">·</span>
                          <span className="text-white/10">iMessage integration coming soon</span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <MessageSquare className="w-7 h-7 text-primary/40" />
                      </div>
                      <h3 className="text-sm font-bold text-white/40 mb-1">Select a conversation</h3>
                      <p className="text-xs text-white/20 max-w-[200px]">
                        Pick a conversation from the sidebar to start messaging.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
