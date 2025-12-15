'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle2, AlertCircle, Info, WifiOff, AlertTriangle } from 'lucide-react';
import { ApiErrorHandler } from './api-error-handler';
import { OnlineStatusMonitor } from './online-status-monitor';

type ToastType = 'success' | 'error' | 'warning' | 'info' | 'offline';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (toast: Omit<Toast, 'id'>) => void;
  showSuccess: (title: string, message?: string) => void;
  showError: (title: string, message?: string) => void;
  showWarning: (title: string, message?: string) => void;
  showInfo: (title: string, message?: string) => void;
  showOffline: (message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (toast: Omit<Toast, 'id'>) => {
      const id = Math.random().toString(36).substring(7);
      const newToast = { ...toast, id };
      console.log('[ToastProvider] Showing toast:', newToast);
      setToasts((prev) => [...prev, newToast]);

      // Auto-remove after duration (default 5 seconds)
      setTimeout(() => {
        removeToast(id);
      }, toast.duration || 5000);
    },
    [removeToast]
  );

  const showSuccess = useCallback(
    (title: string, message?: string) => {
      showToast({ type: 'success', title, message, duration: 4000 });
    },
    [showToast]
  );

  const showError = useCallback(
    (title: string, message?: string) => {
      showToast({ type: 'error', title, message, duration: 6000 });
    },
    [showToast]
  );

  const showWarning = useCallback(
    (title: string, message?: string) => {
      showToast({ type: 'warning', title, message, duration: 5000 });
    },
    [showToast]
  );

  const showInfo = useCallback(
    (title: string, message?: string) => {
      showToast({ type: 'info', title, message, duration: 4000 });
    },
    [showToast]
  );

  const showOffline = useCallback(
    (message?: string) => {
      showToast({
        type: 'offline',
        title: 'No Internet Connection',
        message: message || 'Please check your network and try again.',
        duration: 7000,
      });
    },
    [showToast]
  );

  const getToastStyles = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50 dark:bg-green-900/20',
          border: 'border-green-200 dark:border-green-800',
          icon: <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />,
          titleColor: 'text-green-900 dark:text-green-100',
          messageColor: 'text-green-800 dark:text-green-200',
        };
      case 'error':
        return {
          bg: 'bg-red-50 dark:bg-red-900/20',
          border: 'border-red-200 dark:border-red-800',
          icon: <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />,
          titleColor: 'text-red-900 dark:text-red-100',
          messageColor: 'text-red-800 dark:text-red-200',
        };
      case 'warning':
        return {
          bg: 'bg-amber-50 dark:bg-amber-900/20',
          border: 'border-amber-200 dark:border-amber-800',
          icon: <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />,
          titleColor: 'text-amber-900 dark:text-amber-100',
          messageColor: 'text-amber-800 dark:text-amber-200',
        };
      case 'offline':
        return {
          bg: 'bg-orange-50 dark:bg-orange-900/20',
          border: 'border-orange-200 dark:border-orange-800',
          icon: <WifiOff className="h-5 w-5 text-orange-600 dark:text-orange-400" />,
          titleColor: 'text-orange-900 dark:text-orange-100',
          messageColor: 'text-orange-800 dark:text-orange-200',
        };
      case 'info':
      default:
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          border: 'border-blue-200 dark:border-blue-800',
          icon: <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
          titleColor: 'text-blue-900 dark:text-blue-100',
          messageColor: 'text-blue-800 dark:text-blue-200',
        };
    }
  };

  return (
    <ToastContext.Provider
      value={{
        showToast,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        showOffline,
      }}
    >
      <ApiErrorHandler />
      <OnlineStatusMonitor />
      {children}

      {/* Toast container */}
      <div className="fixed bottom-0 right-0 z-50 p-4 space-y-3 max-w-md w-full pointer-events-none">
        {toasts.map((toast) => {
          const styles = getToastStyles(toast.type);
          return (
            <div
              key={toast.id}
              className={`${styles.bg} ${styles.border} border rounded-lg shadow-lg p-4 animate-slide-in pointer-events-auto`}
            >
              <div className="flex items-start gap-3">
                <div className="shrink-0 mt-0.5">{styles.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${styles.titleColor}`}>
                    {toast.title}
                  </p>
                  {toast.message && (
                    <p className={`text-sm mt-1 ${styles.messageColor}`}>
                      {toast.message}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => removeToast(toast.id)}
                  className={`shrink-0 p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${styles.titleColor}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
