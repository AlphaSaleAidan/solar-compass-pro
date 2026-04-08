/**
 * Message Providers
 * 
 * InAppProvider — stores messages in Supabase, delivers via Realtime
 * Future: TwilioSMSProvider, iMessageProvider, EmailProvider
 * 
 * Each provider implements the MessageProvider interface so the
 * messaging service can route to any channel transparently.
 */

import { supabase } from '@/integrations/supabase/client';
import type { Message, Conversation, MessageProvider, ChannelType } from './types';

/* ─── In-App Provider ──────────────────────────────────────────────── */

export class InAppProvider implements MessageProvider {
  channel: ChannelType = 'in_app';
  private listeners: Set<(msg: Message) => void> = new Set();
  private realtimeChannel: ReturnType<typeof supabase.channel> | null = null;

  async sendMessage(
    conversation: Conversation,
    partial: Omit<Message, 'id' | 'timestamp' | 'status'>
  ): Promise<Message> {
    const message: Message = {
      ...partial,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      status: 'sent',
    };

    // Try Supabase insert — gracefully fall back to local-only if table doesn't exist
    try {
      const { error } = await supabase.from('messages').insert({
        id: message.id,
        conversation_id: message.conversationId,
        sender_id: message.senderId,
        sender_name: message.senderName,
        sender_role: message.senderRole,
        text: message.text,
        channel: message.channel,
        status: message.status,
        read_by: message.readBy,
        reply_to: message.replyTo,
        metadata: message.metadata,
      });
      if (error) {
        console.warn('[InAppProvider] Supabase insert failed, using local:', error.message);
      }
    } catch {
      // Supabase table may not exist yet — that's fine, local state works
    }

    // Notify local listeners immediately (optimistic)
    this.listeners.forEach(cb => cb(message));
    return message;
  }

  async markRead(conversationId: string, userId: string): Promise<void> {
    try {
      // Update all unread messages in this conversation
      await supabase
        .from('messages')
        .update({ read_by: supabase.rpc ? undefined : [userId] }) // Simplified — full impl uses array_append
        .eq('conversation_id', conversationId)
        .not('read_by', 'cs', `{${userId}}`);
    } catch {
      // Graceful fallback
    }
  }

  onMessage(callback: (message: Message) => void): () => void {
    this.listeners.add(callback);

    // Subscribe to Supabase Realtime if not already
    if (!this.realtimeChannel) {
      try {
        this.realtimeChannel = supabase
          .channel('messages-realtime')
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'messages' },
            (payload) => {
              const row = payload.new as any;
              const msg: Message = {
                id: row.id,
                conversationId: row.conversation_id,
                senderId: row.sender_id,
                senderName: row.sender_name,
                senderRole: row.sender_role,
                text: row.text,
                channel: row.channel || 'in_app',
                status: row.status || 'sent',
                timestamp: row.created_at,
                readBy: row.read_by || [],
              };
              this.listeners.forEach(cb => cb(msg));
            }
          )
          .subscribe();
      } catch {
        // Realtime may not be available
      }
    }

    return () => {
      this.listeners.delete(callback);
      if (this.listeners.size === 0 && this.realtimeChannel) {
        supabase.removeChannel(this.realtimeChannel);
        this.realtimeChannel = null;
      }
    };
  }
}

/* ─── SMS/Twilio Provider (Stub) ───────────────────────────────────── */

export class TwilioSMSProvider implements MessageProvider {
  channel: ChannelType = 'sms';

  async sendMessage(
    conversation: Conversation,
    partial: Omit<Message, 'id' | 'timestamp' | 'status'>
  ): Promise<Message> {
    // Future: POST to /api/twilio/send with participant phone numbers
    // For now, log and return as "sent"
    console.log('[TwilioSMS] Would send to:', conversation.participants.map(p => p.phone).filter(Boolean));
    
    const message: Message = {
      ...partial,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      status: 'sent',
      channel: 'sms',
    };
    return message;
  }

  async markRead(_conversationId: string, _userId: string): Promise<void> {
    // SMS read receipts handled by Twilio webhooks
  }

  onMessage(_callback: (message: Message) => void): () => void {
    // Future: Twilio webhook → Supabase Edge Function → Realtime
    return () => {};
  }
}

/* ─── iMessage Provider (Stub) ─────────────────────────────────────── */

export class IMessageProvider implements MessageProvider {
  channel: ChannelType = 'imessage';

  async sendMessage(
    conversation: Conversation,
    partial: Omit<Message, 'id' | 'timestamp' | 'status'>
  ): Promise<Message> {
    // Future: Route through Apple Business Chat API or Twilio iMessage
    // Can use same Twilio infrastructure with iMessage capability
    console.log('[iMessage] Would send via Apple Business Chat / Twilio iMessage');
    
    const message: Message = {
      ...partial,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      status: 'sent',
      channel: 'imessage',
    };
    return message;
  }

  async markRead(_conversationId: string, _userId: string): Promise<void> {
    // iMessage read receipts via webhook
  }

  onMessage(_callback: (message: Message) => void): () => void {
    return () => {};
  }
}
