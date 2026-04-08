/**
 * MessagingService — Central orchestrator for all messaging channels
 * 
 * Handles:
 * - Multi-channel message routing (in-app, SMS, iMessage, email)
 * - Conversation management
 * - Dual notification delivery
 * - Message persistence & sync
 * 
 * Architecture designed for easy iMessage/Twilio integration:
 * 1. Register providers for each channel
 * 2. Messages route through preferred channel
 * 3. Notifications can fan out to multiple channels simultaneously
 */

import type {
  Message, Conversation, MessageProvider, ChannelType,
  ConversationType, Participant, NotificationPreferences,
} from './types';
import { InAppProvider } from './providers';

class MessagingServiceClass {
  private providers = new Map<ChannelType, MessageProvider>();
  private conversations = new Map<string, Conversation>();
  private messages = new Map<string, Message[]>(); // conversationId → messages
  private listeners = new Set<() => void>();
  private messageListeners = new Set<(msg: Message) => void>();

  constructor() {
    // Register the in-app provider by default
    this.registerProvider(new InAppProvider());
  }

  /* ─── Provider Management ──────────────────────────────────────── */

  registerProvider(provider: MessageProvider): void {
    this.providers.set(provider.channel, provider);
    
    // Subscribe to incoming messages from this provider
    provider.onMessage((msg) => {
      this.handleIncomingMessage(msg);
    });
  }

  getProvider(channel: ChannelType): MessageProvider | undefined {
    return this.providers.get(channel);
  }

  /* ─── Conversation Management ──────────────────────────────────── */

  createConversation(params: {
    type: ConversationType;
    title: string;
    subtitle?: string;
    participants: Participant[];
    projectId?: string;
    preferredChannel?: ChannelType;
  }): Conversation {
    const id = `conv-${crypto.randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();
    
    const conversation: Conversation = {
      id,
      type: params.type,
      title: params.title,
      subtitle: params.subtitle,
      participants: params.participants,
      unreadCount: 0,
      projectId: params.projectId,
      createdAt: now,
      updatedAt: now,
      channels: ['in_app'],
      preferredChannel: params.preferredChannel || 'in_app',
    };

    this.conversations.set(id, conversation);
    this.messages.set(id, []);
    this.notify();
    return conversation;
  }

  getConversation(id: string): Conversation | undefined {
    return this.conversations.get(id);
  }

  getAllConversations(): Conversation[] {
    return Array.from(this.conversations.values())
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  getConversationsForUser(userId: string): Conversation[] {
    return this.getAllConversations()
      .filter(c => c.participants.some(p => p.userId === userId));
  }

  getConversationsForProject(projectId: string): Conversation[] {
    return this.getAllConversations()
      .filter(c => c.projectId === projectId);
  }

  /* ─── Message Operations ───────────────────────────────────────── */

  async sendMessage(params: {
    conversationId: string;
    senderId: string;
    senderName: string;
    senderRole: string;
    text: string;
    replyTo?: string;
    channel?: ChannelType;  // Override conversation default
    dualNotify?: boolean;   // Send via both in-app AND external channel
  }): Promise<Message | null> {
    const conversation = this.conversations.get(params.conversationId);
    if (!conversation) {
      console.warn('[MessagingService] Conversation not found:', params.conversationId);
      return null;
    }

    const channel = params.channel || conversation.preferredChannel;
    const provider = this.providers.get(channel);
    
    if (!provider) {
      console.warn('[MessagingService] No provider for channel:', channel);
      // Fall back to in-app
      const fallback = this.providers.get('in_app');
      if (!fallback) return null;
      
      const msg = await fallback.sendMessage(conversation, {
        conversationId: params.conversationId,
        senderId: params.senderId,
        senderName: params.senderName,
        senderRole: params.senderRole,
        text: params.text,
        channel: 'in_app',
        readBy: [params.senderId],
        replyTo: params.replyTo,
      });
      
      this.storeMessage(msg);
      return msg;
    }

    const msg = await provider.sendMessage(conversation, {
      conversationId: params.conversationId,
      senderId: params.senderId,
      senderName: params.senderName,
      senderRole: params.senderRole,
      text: params.text,
      channel,
      readBy: [params.senderId],
      replyTo: params.replyTo,
    });

    this.storeMessage(msg);

    // Dual notification: also send via external channel if requested
    if (params.dualNotify && channel === 'in_app') {
      const externalChannel = this.getExternalChannel(conversation);
      if (externalChannel) {
        const extProvider = this.providers.get(externalChannel);
        if (extProvider) {
          await extProvider.sendMessage(conversation, {
            conversationId: params.conversationId,
            senderId: params.senderId,
            senderName: params.senderName,
            senderRole: params.senderRole,
            text: params.text,
            channel: externalChannel,
            readBy: [params.senderId],
          });
        }
      }
    }

    return msg;
  }

  getMessages(conversationId: string): Message[] {
    return this.messages.get(conversationId) || [];
  }

  async markConversationRead(conversationId: string, userId: string): Promise<void> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return;

    conversation.unreadCount = 0;
    
    // Mark messages as read
    const msgs = this.messages.get(conversationId) || [];
    msgs.forEach(m => {
      if (!m.readBy.includes(userId)) {
        m.readBy.push(userId);
        m.status = 'read';
      }
    });

    // Notify providers
    for (const channel of conversation.channels) {
      const provider = this.providers.get(channel);
      if (provider) {
        await provider.markRead(conversationId, userId);
      }
    }

    this.notify();
  }

  getTotalUnreadCount(userId: string): number {
    return this.getConversationsForUser(userId)
      .reduce((sum, c) => sum + c.unreadCount, 0);
  }

  /* ─── Quick Send (for system messages / cascades) ──────────────── */

  async sendSystemMessage(params: {
    conversationId: string;
    text: string;
    metadata?: Record<string, unknown>;
  }): Promise<Message | null> {
    return this.sendMessage({
      conversationId: params.conversationId,
      senderId: 'system',
      senderName: 'ASP System',
      senderRole: 'system',
      text: params.text,
    });
  }

  /* ─── Subscriptions ────────────────────────────────────────────── */

  subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  onMessage(callback: (msg: Message) => void): () => void {
    this.messageListeners.add(callback);
    return () => this.messageListeners.delete(callback);
  }

  /* ─── Internal ─────────────────────────────────────────────────── */

  private handleIncomingMessage(msg: Message): void {
    // Don't double-store if we already have it
    const existing = this.messages.get(msg.conversationId);
    if (existing?.some(m => m.id === msg.id)) return;

    this.storeMessage(msg);
    this.messageListeners.forEach(cb => cb(msg));
  }

  private storeMessage(msg: Message): void {
    const msgs = this.messages.get(msg.conversationId) || [];
    if (!msgs.some(m => m.id === msg.id)) {
      msgs.push(msg);
      this.messages.set(msg.conversationId, msgs);
    }

    // Update conversation metadata
    const convo = this.conversations.get(msg.conversationId);
    if (convo) {
      convo.lastMessage = msg;
      convo.updatedAt = msg.timestamp;
      // Increment unread for participants who haven't read
      convo.unreadCount = msgs.filter(m => !m.readBy.includes('current')).length;
    }

    this.notify();
  }

  private getExternalChannel(conversation: Conversation): ChannelType | null {
    // Priority: iMessage > SMS > email
    if (conversation.channels.includes('imessage')) return 'imessage';
    if (conversation.channels.includes('sms')) return 'sms';
    if (conversation.channels.includes('email')) return 'email';
    return null;
  }

  private notify(): void {
    this.listeners.forEach(cb => cb());
  }

  /* ─── Seed demo conversations ──────────────────────────────────── */

  seedDemoData(userId: string, userName: string, userRole: string): void {
    if (this.conversations.size > 0) return; // Already seeded

    // System welcome conversation
    const welcome = this.createConversation({
      type: 'system',
      title: 'ASP Concierge',
      subtitle: 'Your personal solar assistant',
      participants: [
        { userId, name: userName, role: userRole },
        { userId: 'system', name: 'ASP Concierge', role: 'system' },
      ],
    });

    const now = new Date();
    const msgs: Omit<Message, 'readBy'>[] = [
      {
        id: 'welcome-1',
        conversationId: welcome.id,
        senderId: 'system',
        senderName: 'ASP Concierge',
        senderRole: 'system',
        text: `Welcome to Alpha Sale Pro, ${userName}! I'm your ASP Concierge — here to help you navigate the platform and keep your deals moving.`,
        channel: 'in_app',
        status: 'delivered',
        timestamp: new Date(now.getTime() - 3600000).toISOString(),
      },
      {
        id: 'welcome-2',
        conversationId: welcome.id,
        senderId: 'system',
        senderName: 'ASP Concierge',
        senderRole: 'system',
        text: 'You can message anyone on your team directly, or I can help with questions about milestones, fund releases, or project status. Just type below!',
        channel: 'in_app',
        status: 'delivered',
        timestamp: new Date(now.getTime() - 3500000).toISOString(),
      },
    ];

    msgs.forEach(m => {
      this.storeMessage({ ...m, readBy: [] });
    });

    // Ops team conversation
    const opsConvo = this.createConversation({
      type: 'group',
      title: 'Backend Operations',
      subtitle: 'QC, milestones & compliance',
      participants: [
        { userId, name: userName, role: userRole },
        { userId: 'ops-1', name: 'Sarah Chen', role: 'backend_ops', online: true },
        { userId: 'ops-2', name: 'Marcus Rivera', role: 'backend_ops' },
      ],
    });

    this.storeMessage({
      id: 'ops-1',
      conversationId: opsConvo.id,
      senderId: 'ops-1',
      senderName: 'Sarah Chen',
      senderRole: 'backend_ops',
      text: 'All QC reviews are current. 3 projects cleared for installer assignment this morning.',
      channel: 'in_app',
      status: 'delivered',
      timestamp: new Date(now.getTime() - 1800000).toISOString(),
      readBy: [],
    });

    // Installer conversation
    const installerConvo = this.createConversation({
      type: 'direct',
      title: 'Jake Morrison',
      subtitle: 'Lead Installer · SunPro Solar',
      participants: [
        { userId, name: userName, role: userRole },
        { userId: 'inst-1', name: 'Jake Morrison', role: 'installer', online: true, phone: '+15551234567' },
      ],
    });

    this.storeMessage({
      id: 'inst-1',
      conversationId: installerConvo.id,
      senderId: 'inst-1',
      senderName: 'Jake Morrison',
      senderRole: 'installer',
      text: 'M3 photos uploaded for the Williams project. Ready for ops verification whenever you get a chance.',
      channel: 'in_app',
      status: 'delivered',
      timestamp: new Date(now.getTime() - 900000).toISOString(),
      readBy: [],
    });

    // Finance conversation
    this.createConversation({
      type: 'direct',
      title: 'Rachel Kim',
      subtitle: 'Financier · Capital Division',
      participants: [
        { userId, name: userName, role: userRole },
        { userId: 'fin-1', name: 'Rachel Kim', role: 'financier' },
      ],
    });

    this.notify();
  }
}

// Singleton
export const MessagingService = new MessagingServiceClass();
