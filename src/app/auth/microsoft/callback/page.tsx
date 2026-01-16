'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function MicrosoftAuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // MSAL handles the redirect automatically
    // This page is just for the redirect URI
    // User will be redirected back to login page after MSAL processes the response
    const timer = setTimeout(() => {
      router.push('/login');
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
      <div className="text-center text-white">
        <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Completing Microsoft sign in...</h2>
        <p className="text-purple-200">Please wait while we authenticate your account</p>
      </div>
    </div>
  );
}
