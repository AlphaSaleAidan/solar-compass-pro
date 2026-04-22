/**
 * Messaging System Types
 * 
 * Designed with provider abstraction for future iMessage/Twilio integration.
 * Channel types: 'in_app' | 'sms' | 'imessage' | 'email'
 */

export type ChannelType = 'in_app' | 'sms' | 'imessage' | 'email';
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
export type ConversationType = 'direct' | 'project' | 'group' | 'system';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  senderAvatar?: string;
  text: string;
  channel: ChannelType;       // Which channel this was sent on
  status: MessageStatus;
  timestamp: string;          // ISO 8601
  readBy: string[];           // User IDs who have read this
  replyTo?: string;           // Reply to message ID
  attachments?: MessageAttachment[];
  metadata?: Record<string, unknown>;
}

export interface MessageAttachment {
  id: string;
  type: 'image' | 'document' | 'link';
  name: string;
  url: string;
  thumbnailUrl?: string;
  size?: number;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  title: string;              // Display name
  subtitle?: string;          // e.g., project ID, role
  participants: Participant[];
  lastMessage?: Message;
  unreadCount: number;
  projectId?: string;         // Link to project if type === 'project'
  createdAt: string;
  updatedAt: string;
  pinned?: boolean;
  muted?: boolean;
  channels: ChannelType[];    // Which channels are active for this convo
  preferredChannel: ChannelType; // Default send channel
}

export interface Participant {
  userId: string;
  name: string;
  role: string;
  avatar?: string;
  online?: boolean;
  lastSeen?: string;
  phone?: string;             // For SMS/iMessage routing
  email?: string;             // For email routing
  channelPreference?: ChannelType; // User's preferred channel
}

// Provider interface — implement for each channel
export interface MessageProvider {
  channel: ChannelType;
  sendMessage(conversation: Conversation, message: Omit<Message, 'id' | 'timestamp' | 'status'>): Promise<Message>;
  markRead(conversationId: string, userId: string): Promise<void>;
  onMessage(callback: (message: Message) => void): () => void;
}

// Notification preferences per user
export interface NotificationPreferences {
  userId: string;
  inApp: boolean;
  sms: boolean;
  imessage: boolean;
  email: boolean;
  quietHoursStart?: string;   // e.g., "22:00"
  quietHoursEnd?: string;     // e.g., "07:00"
  mutedConversations: string[];
}
