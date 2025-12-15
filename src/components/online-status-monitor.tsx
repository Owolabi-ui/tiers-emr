'use client';

import { useEffect } from 'react';
import { useToast } from '@/components/toast-provider';

/**
 * Component to monitor online/offline status and show toast notifications
 */
export function OnlineStatusMonitor() {
  const { showOffline, showSuccess } = useToast();

  useEffect(() => {
    console.log('[OnlineStatusMonitor] Mounted and listening for network events');
    
    const handleOffline = () => {
      console.log('[OnlineStatusMonitor] OFFLINE detected');
      showOffline('You are currently offline. Some features may not work.');
    };

    const handleOnline = () => {
      console.log('[OnlineStatusMonitor] ONLINE detected');
      showSuccess('Back Online', 'Your internet connection has been restored.');
    };

    // Listen for online/offline events
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    // Check initial status
    if (!navigator.onLine) {
      console.log('[OnlineStatusMonitor] Initial check: Currently OFFLINE');
      showOffline('You appear to be offline.');
    } else {
      console.log('[OnlineStatusMonitor] Initial check: Currently ONLINE');
    }

    // Cleanup
    return () => {
      console.log('[OnlineStatusMonitor] Unmounting');
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [showOffline, showSuccess]);

  return null; // This component doesn't render anything
}
