'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, checkAuth, isLoading } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      console.log('[ProtectedRoute] Verifying auth for:', pathname);
      console.log('[ProtectedRoute] Current state:', { isAuthenticated, user: user?.email });
      
      // If already authenticated in store, skip verification
      if (isAuthenticated && user) {
        console.log('[ProtectedRoute] Already authenticated, skipping check');
        setIsChecking(false);
        return;
      }

      console.log('[ProtectedRoute] Not authenticated in store, checking...');
      // Check auth (will try to recover from localStorage)
      const isValid = await checkAuth();
      console.log('[ProtectedRoute] Check auth result:', isValid);

      if (!isValid) {
        // Redirect to login with return URL
        const returnUrl = encodeURIComponent(pathname);
        console.log('[ProtectedRoute] Not valid, redirecting to login');
        router.push(`/login?returnUrl=${returnUrl}`);
      }

      setIsChecking(false);
    };

    verifyAuth();
  }, []); // Only run once on mount

  // Show loading while checking auth
  if (isChecking || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-neutral-950">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#5b21b6] mx-auto" />
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Verifying authentication...
          </p>
        </div>
      </div>
    );
  }

  // Check role if specified
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-neutral-950">
        <div className="text-center max-w-md p-8">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="h-8 w-8 text-red-600 dark:text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You don&apos;t have permission to access this page. Please contact your administrator if you believe this is an error.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="inline-flex items-center rounded-lg bg-[#5b21b6] px-4 py-2 text-sm font-medium text-white hover:bg-[#4c1d95] transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Not authenticated - will redirect (handled by useEffect)
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-neutral-950">
        <Loader2 className="h-8 w-8 animate-spin text-[#5b21b6]" />
      </div>
    );
  }

  return <>{children}</>;
}
