'use client';

import { useEffect } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/toast-provider';
import { AxiosError } from 'axios';

/**
 * Component to set up API error interceptors with toast notifications
 * Must be rendered within ToastProvider
 */
export function ApiErrorHandler() {
  const { showError, showOffline } = useToast();

  useEffect(() => {
    console.log('[ApiErrorHandler] Setting up error interceptor');
    
    // Store the interceptor ID so we can eject it on unmount
    const interceptorId = api.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        console.log('[ApiErrorHandler] Error intercepted:', error.code, error.message);
        
        // Network error (no response from server)
        if (!error.response) {
          console.log('[ApiErrorHandler] Network error detected');
          if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
            showOffline('Unable to reach the server. Please check your internet connection.');
          } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
            showError('Request Timeout', 'The server is taking too long to respond. Please try again.');
          } else {
            showError('Connection Error', 'Unable to connect to the server. Please try again.');
          }
          return Promise.reject(error);
        }

        // Handle specific status codes
        const status = error.response.status;
        console.log('[ApiErrorHandler] HTTP error status:', status);
        
        // Don't show toast for 401 (session expiration is handled separately)
        if (status === 401) {
          return Promise.reject(error);
        }

        // 403 - Forbidden
        if (status === 403) {
          showError('Access Denied', 'You don\'t have permission to perform this action.');
          return Promise.reject(error);
        }

        // 404 - Not Found
        if (status === 404) {
          // Don't show toast for expected 404s (e.g., no assessment data yet)
          const url = error.config?.url || '';
          
          // Check if this is an expected 404 from assessment/data endpoints
          const isExpected404 = 
            url.includes('/latest') ||     // Latest assessment endpoints
            url.includes('/active') ||     // Active items endpoints
            url.includes('/history') ||    // History endpoints
            url.includes('/phq9') ||       // PHQ-9 assessments
            url.includes('/gad7') ||       // GAD-7 assessments  
            url.includes('/audit-c') ||    // AUDIT-C assessments
            url.includes('/sessions') ||   // Counseling sessions
            url.includes('/goals');        // Therapy goals
          
          console.log('[ApiErrorHandler] 404 for URL:', url, '| Expected 404:', isExpected404);
          
          if (!isExpected404) {
            showError('Not Found', 'The requested resource could not be found.');
          } else {
            console.log('[ApiErrorHandler] Suppressing expected 404 toast');
          }
          return Promise.reject(error);
        }

        // 500 - Internal Server Error
        if (status >= 500) {
          showError('Server Error', 'An unexpected error occurred on the server. Please try again later.');
          return Promise.reject(error);
        }

        // 422 - Validation Error (don't show toast, let forms handle it)
        if (status === 422) {
          return Promise.reject(error);
        }

        // Other 4xx errors
        if (status >= 400 && status < 500) {
          const errorMessage = (error.response.data as any)?.error || 'An error occurred processing your request.';
          showError('Request Failed', errorMessage);
          return Promise.reject(error);
        }

        return Promise.reject(error);
      }
    );

    console.log('[ApiErrorHandler] Interceptor registered with ID:', interceptorId);

    // Cleanup: eject the interceptor when component unmounts
    return () => {
      console.log('[ApiErrorHandler] Ejecting interceptor');
      api.interceptors.response.eject(interceptorId);
    };
  }, [showError, showOffline]);

  return null; // This component doesn't render anything
}
