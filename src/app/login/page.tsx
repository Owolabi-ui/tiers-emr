'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, Info, Loader2 } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';
import { useAuthStore } from '@/lib/auth-store';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, error, clearError, isLoading } = useAuthStore();
  const [sessionExpired, setSessionExpired] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    const sessionExpiredParam = searchParams.get('session_expired') === 'true';
    const sessionExpiredStorage = sessionStorage.getItem('session_expired') === 'true';
    if (sessionExpiredParam || sessionExpiredStorage) {
      setSessionExpired(true);
      sessionStorage.removeItem('session_expired');
      const timeout = setTimeout(() => setSessionExpired(false), 8000);
      return () => clearTimeout(timeout);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearError();
    const ok = await login({ email, password });
    if (ok) router.push('/dashboard');
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#065f46] flex-col items-center justify-center p-12 text-white">
        <BrandLogo size="lg" inverted />
        <p className="mt-6 text-lg text-white/70 text-center max-w-xs leading-relaxed">
          A modern, secure electronic medical record system for clinic workflows and reporting.
        </p>
        <div className="mt-12 space-y-4 text-sm text-white/50 text-center">
          <p>Role-based access control</p>
          <p>HTS · PrEP · PEP · ART · Lab · Pharmacy</p>
          <p>Program reporting & analytics</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-50 px-6 py-12">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="flex justify-center mb-8 lg:hidden">
            <BrandLogo size="lg" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-1">Sign in</h1>
          <p className="text-sm text-gray-500 mb-8">Enter your credentials to continue</p>

          {sessionExpired && (
            <div className="mb-5 rounded-lg bg-amber-50 border border-amber-300 p-4">
              <div className="flex items-start gap-3">
                <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-sm text-amber-800">Your session expired. Please sign in again.</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-5 rounded-lg bg-red-50 border border-red-200 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#065f46]/30 focus:border-[#065f46]"
                placeholder="name@clinic.org"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#065f46]/30 focus:border-[#065f46]"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#065f46] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#064e3b] disabled:opacity-60 disabled:cursor-not-allowed transition-colors mt-2"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="mt-8 text-xs text-gray-400 text-center">DEMO-EMR · Secure Clinical Platform</p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <Loader2 className="h-8 w-8 animate-spin text-[#065f46]" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
