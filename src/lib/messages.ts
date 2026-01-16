// Messages API Client
import { api } from './api';

export interface Message {
  id: string;
  message_type: 'SYSTEM' | 'USER';
  priority: 'Low' | 'Normal' | 'High' | 'Urgent';
  sender_id: string | null;
  sender_name: string | null;
  recipient_id: string;
  subject: string;
  message_body: string;
  related_type: string | null;
  related_id: string | null;
  parent_message_id: string | null;
  thread_id: string | null;
  is_read: boolean;
  read_at: string | null;
  is_archived: boolean;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MessageStats {
  total_messages: number;
  unread_messages: number;
  system_messages: number;
  user_messages: number;
}

export interface InboxResponse {
  messages: Message[];
  total: number;
  unread_count: number;
}

export interface SentMessagesResponse {
  messages: Message[];
  total: number;
}

export interface MessageThreadResponse {
  thread_id: string;
  messages: Message[];
  total: number;
}

export interface StaffUser {
  id: string;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
}

export interface SendMessageRequest {
  recipient_id: string;
  subject: string;
  message_body: string;
  priority?: 'Low' | 'Normal' | 'High' | 'Urgent';
}

export interface ReplyMessageRequest {
  message_body: string;
}

export interface MarkReadRequest {
  message_ids: string[];
}

export const messagesApi = {
  // Get inbox messages
  async getInbox(): Promise<InboxResponse> {
    const response = await api.get('/api/v1/messages/inbox');
    return response.data;
  },

  // Get sent messages
  async getSent(): Promise<SentMessagesResponse> {
    const response = await api.get('/api/v1/messages/sent');
    return response.data;
  },

  // Get message thread
  async getThread(threadId: string): Promise<MessageThreadResponse> {
    const response = await api.get(`/api/v1/messages/thread/${threadId}`);
    return response.data;
  },

  // Get message statistics
  async getStats(): Promise<MessageStats> {
    const response = await api.get('/api/v1/messages/stats');
    return response.data;
  },

  // Get staff users list
  async getStaffUsers(): Promise<StaffUser[]> {
    const response = await api.get('/api/v1/messages/staff-users');
    return response.data;
  },

  // Send new message
  async send(data: SendMessageRequest): Promise<Message> {
    const response = await api.post('/api/v1/messages/send', data);
    return response.data;
  },

  // Reply to message
  async reply(messageId: string, data: ReplyMessageRequest): Promise<Message> {
    const response = await api.post(`/api/v1/messages/${messageId}/reply`, data);
    return response.data;
  },

  // Mark messages as read
  async markRead(messageIds: string[]): Promise<void> {
    await api.put('/api/v1/messages/mark-read', { message_ids: messageIds });
  },

  // Archive messages
  async archive(messageIds: string[]): Promise<void> {
    await api.put('/api/v1/messages/archive', { message_ids: messageIds });
  },
};
