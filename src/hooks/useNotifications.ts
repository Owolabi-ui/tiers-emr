// Real-time notifications hook using WebSocket
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import type { Notification, NotificationType, NotificationPriority } from '@/lib/notifications';

export interface WebSocketMessage {
  type: 'notification' | 'unread_count' | 'marked_read' | 'deleted' | 'pong';
  data?: any;
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
  const reconnectTimeoutRef = useRef<any>(undefined);
  const pingIntervalRef = useRef<any>(undefined);
  const notificationRefs = useRef<{ [key: string]: Notification }>({});

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
        const systemNotif = new Notification(notification.title, {
          body: notification.message,
          tag: notification.id, // Prevents duplicate notifications with same ID
          badge: '/notification-badge.png', // Optional badge icon
          icon: '/notification-icon.png', // Optional notification icon
        });

        // Focus window and trigger callback when user clicks notification
        systemNotif.onclick = () => {
          window.focus();
          if (notification.link) {
            // Navigate to the link if available
            window.location.href = notification.link;
          }
          systemNotif.close();
        };

        // Store reference for cleanup
        notificationRefs.current[notification.id] = notification;

        console.log('[Notifications] System notification shown:', notification.title);
      } catch (error) {
        console.error('[Notifications] Failed to show system notification:', error);
      }
    },
    [enableSystemNotifications, notificationPermission]
  );

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    if (isConnecting) {
      return; // Already connecting
    }

    setIsConnecting(true);

    try {
      // Get the API base URL from environment or construct it
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
      const wsProtocol = apiUrl.includes('https') ? 'wss' : 'ws';
      const baseHost = apiUrl
        .replace(/^https?:\/\//, '') // Remove protocol
        .replace(/\/$/, ''); // Remove trailing slash

      const wsUrl = `${wsProtocol}://${baseHost}/ws/notifications`;

      console.log('[Notifications] Connecting to WebSocket:', wsUrl);

      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('[Notifications] WebSocket connected');
        setIsConnected(true);
        setIsConnecting(false);

        // Clear any pending reconnect timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }

        // Set up ping interval to keep connection alive
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            // Send ping message (server will respond with pong)
            // This keeps the connection alive and detects dead connections
          }
        }, 30000); // Every 30 seconds
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('[Notifications] Message received:', message.type);

          switch (message.type) {
            case 'notification':
              if (message.data) {
                // Show system notification if enabled and permitted
                showSystemNotification(message.data);
                // Call the UI notification callback
                if (onNewNotification) {
                  onNewNotification(message.data);
                }
              }
              break;

            case 'unread_count':
              if (onUnreadCountChange && typeof message.data === 'number') {
                onUnreadCountChange(message.data);
              }
              break;

            case 'marked_read':
              if (onMarkedRead && message.data?.notification_id) {
                onMarkedRead(message.data.notification_id);
              }
              break;

            case 'deleted':
              if (onDeleted && message.data?.notification_id) {
                onDeleted(message.data.notification_id);
              }
              break;

            case 'pong':
              // Server responded to our ping, connection is alive
              console.log('[Notifications] Pong received');
              break;

            default:
              console.warn('[Notifications] Unknown message type:', message.type);
          }
        } catch (error) {
          console.error('[Notifications] Error parsing message:', error);
        }
      };

      ws.onerror = (event) => {
        console.error('[Notifications] WebSocket error:', event);
        setIsConnected(false);
      };

      ws.onclose = () => {
        console.log('[Notifications] WebSocket disconnected');
        setIsConnected(false);
        setIsConnecting(false);

        // Clear ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
        }

        // Attempt to reconnect if enabled
        if (autoReconnect) {
          console.log(`[Notifications] Reconnecting in ${reconnectDelay}ms...`);
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectDelay);
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('[Notifications] Failed to connect:', error);
      setIsConnecting(false);

      // Retry connection if enabled
      if (autoReconnect) {
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, reconnectDelay);
      }
    }
  }, [autoReconnect, reconnectDelay, onNewNotification, onUnreadCountChange, onMarkedRead, onDeleted]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Reconnect if connection is lost and autoReconnect is enabled
  useEffect(() => {
    if (!isConnected && !isConnecting && autoReconnect) {
      const timer = setTimeout(() => {
        connect();
      }, reconnectDelay);

      return () => clearTimeout(timer);
    }
  }, [isConnected, isConnecting, autoReconnect, reconnectDelay, connect]);

  return {
    isConnected,
    isConnecting,
    connect,
    disconnect,
  };
}
