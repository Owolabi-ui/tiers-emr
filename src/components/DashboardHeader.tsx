'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore, getRoleDisplayName } from '@/lib/auth-store';
import {
  notificationsApi,
  Notification,
  formatNotificationTime,
} from '@/lib/notifications';
import { useNotifications } from '@/hooks/useNotifications';
import {
  Menu,
  Bell,
  ChevronDown,
  LogOut,
  Settings,
  Calendar,
  FlaskConical,
  Pill,
  ArrowRightLeft,
  Cog,
  MessageSquare,
  AlertTriangle,
  Clock,
  Check,
  CheckCheck,
  Trash2,
  Loader2,
} from 'lucide-react';

interface DashboardHeaderProps {
  onMobileMenuOpen?: () => void;
}

// Get icon for notification type
function getNotificationIcon(type: string) {
  switch (type) {
    case 'APPOINTMENT': return <Calendar className="h-4 w-4" />;
    case 'LAB_RESULT': return <FlaskConical className="h-4 w-4" />;
    case 'PRESCRIPTION': return <Pill className="h-4 w-4" />;
    case 'TRANSFER': return <ArrowRightLeft className="h-4 w-4" />;
    case 'SYSTEM': return <Cog className="h-4 w-4" />;
    case 'MESSAGE': return <MessageSquare className="h-4 w-4" />;
    case 'ALERT': return <AlertTriangle className="h-4 w-4" />;
    case 'REMINDER': return <Clock className="h-4 w-4" />;
    default: return <Bell className="h-4 w-4" />;
  }
}

// Get color class for notification priority
function getPriorityColor(priority: string) {
  switch (priority) {
    case 'LOW': return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
    case 'NORMAL': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
    case 'HIGH': return 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400';
    case 'URGENT': return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400';
    default: return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
  }
}

export default function DashboardHeader({ onMobileMenuOpen }: DashboardHeaderProps) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Real-time notifications via WebSocket
  const { isConnected } = useNotifications({
    onNewNotification: (notification) => {
      // Add to top of list
      setNotifications(prev => [notification, ...prev.slice(0, 9)]);
      
      // Increment unread count
      setUnreadCount(prev => prev + 1);

      // TODO: Show toast notification (requires useToast hook setup)
      // For now, just log the notification
      console.log('[DashboardHeader] Toast notification:', {
        title: notification.title,
        message: notification.message,
        priority: notification.priority,
      });

      console.log('[DashboardHeader] New notification received:', notification.title);
    },

    onUnreadCountChange: (count) => {
      setUnreadCount(count);
      console.log('[DashboardHeader] Unread count updated:', count);
    },

    onMarkedRead: (notificationId) => {
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      console.log('[DashboardHeader] Notification marked as read:', notificationId);
    },

    onDeleted: (notificationId) => {
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      console.log('[DashboardHeader] Notification deleted:', notificationId);
    },

    autoReconnect: true,
    reconnectDelay: 3000,
  });

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationsApi.getNotifications({ limit: 10 });
      setNotifications(response.notifications);
      setUnreadCount(response.unread_count);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch initial unread count on mount
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const count = await notificationsApi.getUnreadCount();
        setUnreadCount(count);
      } catch (error) {
        // Silently fail - user might not have notifications yet
        console.log('[DashboardHeader] Could not fetch unread count:', error);
      }
    };
    fetchUnreadCount();
  }, []);

  // Fetch full notifications when dropdown opens
  useEffect(() => {
    if (notificationsOpen && notifications.length === 0) {
      fetchNotifications();
    }
  }, [notificationsOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationsApi.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await notificationsApi.delete(notificationId);
      const deletedNotification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      if (deletedNotification && !deletedNotification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      handleMarkAsRead(notification.id);
    }
    if (notification.link) {
      router.push(notification.link);
      setNotificationsOpen(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-gray-800">
        <div className="flex h-16 items-center gap-4 px-4 sm:px-6 lg:px-8">
          {/* Mobile menu button */}
          <button
            onClick={onMobileMenuOpen}
            className="lg:hidden p-2 -ml-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Welcome message and date */}
          <div className="flex-1">
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Welcome back, {user?.full_name?.split(' ')[0] || 'User'}
              </p>
              <p className="text-xs text-gray-500">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications dropdown */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-lg bg-white dark:bg-neutral-900 border border-gray-200 dark:border-gray-700 shadow-lg z-50">
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      Notifications
                    </h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-xs text-[#5b21b6] hover:text-[#4c1d95] font-medium flex items-center gap-1"
                      >
                        <CheckCheck className="h-3 w-3" />
                        Mark all read
                      </button>
                    )}
                  </div>

                  {/* Notifications list */}
                  <div className="max-h-96 overflow-y-auto">
                    {loading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-[#5b21b6]" />
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="py-8 text-center">
                        <Bell className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No notifications</p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`px-4 py-3 border-b border-gray-50 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer ${
                            !notification.is_read ? 'bg-purple-50/50 dark:bg-purple-900/10' : ''
                          }`}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="flex gap-3">
                            <div className={`flex-shrink-0 p-2 rounded-lg ${getPriorityColor(notification.priority)}`}>
                              {getNotificationIcon(notification.notification_type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className={`text-sm ${!notification.is_read ? 'font-semibold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
                                  {notification.title}
                                </p>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  {!notification.is_read && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleMarkAsRead(notification.id);
                                      }}
                                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                                      title="Mark as read"
                                    >
                                      <Check className="h-3 w-3 text-gray-400" />
                                    </button>
                                  )}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteNotification(notification.id);
                                    }}
                                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                                    title="Delete"
                                  >
                                    <Trash2 className="h-3 w-3 text-gray-400" />
                                  </button>
                                </div>
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {formatNotificationTime(notification.created_at)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Footer */}
                  {notifications.length > 0 && (
                    <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800">
                      <Link
                        href="/dashboard/notifications"
                        className="text-xs text-[#5b21b6] hover:text-[#4c1d95] font-medium"
                        onClick={() => setNotificationsOpen(false)}
                      >
                        View all notifications
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Messages */}
            <Link
              href="/dashboard/messages"
              className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              title="Messages"
            >
              <MessageSquare className="h-5 w-5" />
            </Link>

            {/* Profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <div className="h-8 w-8 rounded-full bg-[#5b21b6] flex items-center justify-center text-white text-sm font-medium">
                  {user?.full_name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user?.full_name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user?.role ? getRoleDisplayName(user.role) : ''}
                  </p>
                </div>
                <ChevronDown className="hidden sm:block h-4 w-4 text-gray-400" />
              </button>

              {/* Dropdown menu */}
              {profileOpen && (
                <>
                  <div
                    className="fixed inset-0"
                    onClick={() => setProfileOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 rounded-lg bg-white dark:bg-neutral-900 border border-gray-200 dark:border-gray-700 shadow-lg z-20">
                    <div className="p-3 border-b border-gray-100 dark:border-gray-800">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {user?.full_name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user?.email}
                      </p>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          router.push('/dashboard/settings');
                        }}
                        className="flex items-center gap-3 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        <Settings className="h-4 w-4" />
                        Settings
                      </button>
                    </div>
                    <div className="border-t border-gray-100 dark:border-gray-800 py-1">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
