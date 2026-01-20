// Notifications API Client
import { api } from './api';

export type NotificationType =
  | 'APPOINTMENT'
  | 'LAB_RESULT'
  | 'PRESCRIPTION'
  | 'TRANSFER'
  | 'SYSTEM'
  | 'MESSAGE'
  | 'ALERT'
  | 'REMINDER';

export type NotificationPriority =
  | 'LOW'
  | 'NORMAL'
  | 'HIGH'
  | 'URGENT';

export interface Notification {
  id: string;
  user_id: string;
  notification_type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  is_read: boolean;
  read_at: string | null;
  link: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  expires_at: string | null;
}

export interface NotificationListResponse {
  notifications: Notification[];
  total: number;
  unread_count: number;
}

export interface NotificationQueryParams {
  is_read?: boolean;
  notification_type?: NotificationType;
  limit?: number;
  offset?: number;
}

export interface CreateNotificationRequest {
  user_id: string;
  notification_type: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  link?: string;
  metadata?: Record<string, any>;
  expires_at?: string;
}

export interface CreateBroadcastNotificationRequest {
  notification_type: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  link?: string;
  metadata?: Record<string, any>;
  expires_at?: string;
  target_roles?: string[];
}

export const notificationsApi = {
  // Get notifications for current user
  async getNotifications(params: NotificationQueryParams = {}): Promise<NotificationListResponse> {
    const queryParams = new URLSearchParams();
    if (params.is_read !== undefined) queryParams.append('is_read', String(params.is_read));
    if (params.notification_type) queryParams.append('notification_type', params.notification_type);
    if (params.limit) queryParams.append('limit', String(params.limit));
    if (params.offset) queryParams.append('offset', String(params.offset));

    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const response = await api.get(`/api/v1/notifications${query}`);
    return response.data;
  },

  // Get unread count
  async getUnreadCount(): Promise<number> {
    const response = await api.get('/api/v1/notifications/unread-count');
    return response.data.unread_count;
  },

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<Notification> {
    const response = await api.put(`/api/v1/notifications/${notificationId}/read`);
    return response.data;
  },

  // Mark all notifications as read
  async markAllAsRead(): Promise<number> {
    const response = await api.put('/api/v1/notifications/mark-all-read');
    return response.data.marked_read;
  },

  // Delete a notification
  async delete(notificationId: string): Promise<void> {
    await api.delete(`/api/v1/notifications/${notificationId}`);
  },

  // Delete all read notifications
  async deleteAllRead(): Promise<number> {
    const response = await api.delete('/api/v1/notifications/delete-read');
    return response.data.deleted;
  },

  // Create notification (admin only)
  async create(data: CreateNotificationRequest): Promise<Notification> {
    const response = await api.post('/api/v1/notifications', data);
    return response.data;
  },

  // Broadcast notification (admin only)
  async broadcast(data: CreateBroadcastNotificationRequest): Promise<number> {
    const response = await api.post('/api/v1/notifications/broadcast', data);
    return response.data.notifications_sent;
  },
};

// Utility functions
export function getNotificationIcon(type: NotificationType): string {
  switch (type) {
    case 'APPOINTMENT': return 'calendar';
    case 'LAB_RESULT': return 'flask';
    case 'PRESCRIPTION': return 'pill';
    case 'TRANSFER': return 'arrow-right-left';
    case 'SYSTEM': return 'settings';
    case 'MESSAGE': return 'message-square';
    case 'ALERT': return 'alert-triangle';
    case 'REMINDER': return 'clock';
    default: return 'bell';
  }
}

export function getNotificationColor(priority: NotificationPriority): string {
  switch (priority) {
    case 'LOW': return 'text-gray-500';
    case 'NORMAL': return 'text-blue-500';
    case 'HIGH': return 'text-orange-500';
    case 'URGENT': return 'text-red-500';
    default: return 'text-gray-500';
  }
}

export function formatNotificationTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
