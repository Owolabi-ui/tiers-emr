// Real-time notifications hook using WebSocket
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import type { Notification } from '@/lib/notifications';

export interface WebSocketMessage {
  type: 'notification' | 'unread_count' | 'marked_read' | 'deleted' | 'pong';
  data?: Notification | number | { notification_id: string };
}

export interface UseNotificationsOptions {
  onNewNotification?: (notification: Notification) => void;
  onUnreadCountChange?: (count: number) => void;
  onMarkedRead?: (notificationId: string) => void;
  onDeleted?: (notificationId: string) => void;
  autoReconnect?: boolean;
  reconnectDelay?: number;
  enableSystemNotifications?: boolean;
}

// Helper to get auth token from localStorage
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const {
    onNewNotification,
    onUnreadCountChange,
    onMarkedRead,
    onDeleted,
    autoReconnect = true,
    reconnectDelay = 3000,
    enableSystemNotifications = true,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 10;

  // Store callbacks in refs to avoid reconnection on callback change
  const callbacksRef = useRef({
    onNewNotification,
    onUnreadCountChange,
    onMarkedRead,
    onDeleted,
  });

  // Update callbacks ref when they change
  useEffect(() => {
    callbacksRef.current = {
      onNewNotification,
      onUnreadCountChange,
      onMarkedRead,
      onDeleted,
    };
  }, [onNewNotification, onUnreadCountChange, onMarkedRead, onDeleted]);

  // Request notification permission on mount
  useEffect(() => {
    if (!enableSystemNotifications || typeof window === 'undefined') {
      return;
    }

    if (!('Notification' in window)) {
      console.log('[Notifications] Browser does not support Notification API');
      setNotificationPermission('denied');
      return;
    }

    const permission = Notification.permission;
    setNotificationPermission(permission);

    // Request permission if default
    if (permission === 'default') {
      Notification.requestPermission().then((newPermission) => {
        setNotificationPermission(newPermission);
        console.log('[Notifications] Permission request result:', newPermission);
      });
    }
  }, [enableSystemNotifications]);

  // Show system notification
  const showSystemNotification = useCallback(
    (notification: Notification) => {
      if (!enableSystemNotifications || notificationPermission !== 'granted') {
        return;
      }

      if (typeof window === 'undefined' || !('Notification' in window)) {
        return;
      }

      try {
        const systemNotif = new window.Notification(notification.title, {
          body: notification.message,
          tag: notification.id, // Prevents duplicate notifications with same ID
          icon: '/favicon.ico', // Use app favicon as notification icon
        });

        // Focus window and trigger callback when user clicks notification
        systemNotif.onclick = () => {
          window.focus();
          if (notification.link) {
            window.location.href = notification.link;
          }
          systemNotif.close();
        };

        // Auto-close after 5 seconds
        setTimeout(() => {
          systemNotif.close();
        }, 5000);

        console.log('[Notifications] System notification shown:', notification.title);
      } catch (error) {
        console.error('[Notifications] Failed to show system notification:', error);
      }
    },
    [enableSystemNotifications, notificationPermission]
  );

  const connect = useCallback(() => {
    // Don't connect if already connected or connecting
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    if (isConnecting) {
      return;
    }

    // Get auth token - required for WebSocket connection
    const token = getAuthToken();
    if (!token) {
      console.log('[Notifications] No auth token available, skipping WebSocket connection');
      return;
    }

    // Check max reconnect attempts
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.warn('[Notifications] Max reconnect attempts reached, stopping reconnection');
      return;
    }

    setIsConnecting(true);

    try {
      // Get the API base URL from environment or construct it
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';

      if (!apiUrl) {
        console.error('[Notifications] NEXT_PUBLIC_API_BASE_URL not configured');
        setIsConnecting(false);
        return;
      }

      const wsProtocol = apiUrl.startsWith('https') ? 'wss' : 'ws';
      const baseHost = apiUrl
        .replace(/^https?:\/\//, '') // Remove protocol
        .replace(/\/$/, ''); // Remove trailing slash

      // Pass auth token as query parameter for WebSocket authentication
      const wsUrl = `${wsProtocol}://${baseHost}/ws/notifications?token=${encodeURIComponent(token)}`;

      console.log('[Notifications] Connecting to WebSocket...');

      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('[Notifications] WebSocket connected');
        setIsConnected(true);
        setIsConnecting(false);
        reconnectAttemptsRef.current = 0; // Reset reconnect attempts on successful connection

        // Clear any pending reconnect timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }

        // Set up ping interval to keep connection alive
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            // Send ping message to keep connection alive
            try {
              ws.send(JSON.stringify({ type: 'ping' }));
            } catch (e) {
              console.error('[Notifications] Failed to send ping:', e);
            }
          }
        }, 30000); // Every 30 seconds
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);

          // Handle different message types based on the structure
          // Backend sends: { "Notification": {...} } or { "UnreadCount": 5 } etc.
          const messageType = Object.keys(message)[0]?.toLowerCase();
          const messageData = Object.values(message)[0];

          switch (messageType) {
            case 'notification':
              if (messageData && typeof messageData === 'object') {
                const notification = messageData as Notification;
                showSystemNotification(notification);
                callbacksRef.current.onNewNotification?.(notification);
              }
              break;

            case 'unread_count':
            case 'unreadcount':
              if (typeof messageData === 'number') {
                callbacksRef.current.onUnreadCountChange?.(messageData);
              }
              break;

            case 'marked_read':
            case 'markedread':
              if (messageData && typeof messageData === 'object' && 'notification_id' in messageData) {
                callbacksRef.current.onMarkedRead?.((messageData as { notification_id: string }).notification_id);
              }
              break;

            case 'deleted':
              if (messageData && typeof messageData === 'object' && 'notification_id' in messageData) {
                callbacksRef.current.onDeleted?.((messageData as { notification_id: string }).notification_id);
              }
              break;

            case 'pong':
              // Server responded to our ping, connection is alive
              break;

            default:
              // Also handle flat message format: { type: "notification", data: {...} }
              if ('type' in message && 'data' in message) {
                const flatMessage = message as { type: string; data: unknown };
                switch (flatMessage.type) {
                  case 'notification':
                    if (flatMessage.data) {
                      const notification = flatMessage.data as Notification;
                      showSystemNotification(notification);
                      callbacksRef.current.onNewNotification?.(notification);
                    }
                    break;
                  case 'unread_count':
                    if (typeof flatMessage.data === 'number') {
                      callbacksRef.current.onUnreadCountChange?.(flatMessage.data);
                    }
                    break;
                  case 'marked_read':
                    if (flatMessage.data && typeof flatMessage.data === 'object' && 'notification_id' in flatMessage.data) {
                      callbacksRef.current.onMarkedRead?.((flatMessage.data as { notification_id: string }).notification_id);
                    }
                    break;
                  case 'deleted':
                    if (flatMessage.data && typeof flatMessage.data === 'object' && 'notification_id' in flatMessage.data) {
                      callbacksRef.current.onDeleted?.((flatMessage.data as { notification_id: string }).notification_id);
                    }
                    break;
                  case 'pong':
                    break;
                  default:
                    console.warn('[Notifications] Unknown message type:', flatMessage.type);
                }
              }
          }
        } catch (error) {
          console.error('[Notifications] Error parsing message:', error);
        }
      };

      ws.onerror = (event) => {
        console.error('[Notifications] WebSocket error:', event);
        setIsConnected(false);
      };

      ws.onclose = (event) => {
        console.log('[Notifications] WebSocket disconnected, code:', event.code, 'reason:', event.reason);
        setIsConnected(false);
        setIsConnecting(false);

        // Clear ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        // Don't reconnect if closed intentionally (code 1000) or auth failed (code 4001)
        if (event.code === 1000 || event.code === 4001) {
          console.log('[Notifications] WebSocket closed intentionally, not reconnecting');
          return;
        }

        // Attempt to reconnect if enabled
        if (autoReconnect) {
          reconnectAttemptsRef.current += 1;
          const delay = Math.min(reconnectDelay * Math.pow(1.5, reconnectAttemptsRef.current - 1), 30000); // Exponential backoff, max 30s
          console.log(`[Notifications] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`);

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('[Notifications] Failed to connect:', error);
      setIsConnecting(false);

      // Retry connection if enabled
      if (autoReconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
        reconnectAttemptsRef.current += 1;
        const delay = Math.min(reconnectDelay * Math.pow(1.5, reconnectAttemptsRef.current - 1), 30000);
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, delay);
      }
    }
  }, [autoReconnect, reconnectDelay, showSystemNotification, isConnecting]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnected'); // Close with normal closure code
      wsRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
    reconnectAttemptsRef.current = 0;
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    // Small delay to ensure auth token is available
    const timer = setTimeout(() => {
      const token = getAuthToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';

      console.log('[Notifications] Init check - Token:', token ? 'present' : 'missing', 'API URL:', apiUrl || 'not configured');

      if (token && apiUrl) {
        connect();
      } else if (!token) {
        console.log('[Notifications] Skipping WebSocket - no auth token');
      } else if (!apiUrl) {
        console.log('[Notifications] Skipping WebSocket - NEXT_PUBLIC_API_BASE_URL not configured');
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      disconnect();
    };
  }, []); // Empty deps - only run on mount/unmount

  // Reconnect when token becomes available (e.g., after login)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'access_token') {
        if (e.newValue && !isConnected && !isConnecting) {
          console.log('[Notifications] Token available, connecting...');
          reconnectAttemptsRef.current = 0;
          connect();
        } else if (!e.newValue && isConnected) {
          console.log('[Notifications] Token removed, disconnecting...');
          disconnect();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [isConnected, isConnecting, connect, disconnect]);

  return {
    isConnected,
    isConnecting,
    connect,
    disconnect,
  };
}
