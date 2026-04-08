'use client';

import { Suspense, useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, FileText, Info, Loader2, Shield, Users } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';
import { useAuthStore } from '@/lib/auth-store';

const backgroundImages = [
  '/images/people-office-work-day.jpg',
  '/images/shutterstock_2005604723-1024x683.jpg',
  '/images/istockphoto-1008739058-612x612.jpg',
  '/images/Namnlos-design.png',
];

const features = [
  {
    icon: Shield,
    title: 'Secure & Compliant',
    description: 'Role-based access control with full audit trail',
  },
  {
    icon: Users,
    title: 'Patient Management',
    description: 'Comprehensive patient records and biometric verification',
  },
  {
    icon: FileText,
    title: 'Clinical Workflows',
    description: 'HTS, PrEP, PEP, ART, and mental health modules',
  },
];

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, error, clearError, isLoading } = useAuthStore();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
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

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % backgroundImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearError();

    const ok = await login({ email, password });
    if (ok) {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {backgroundImages.map((src, index) => (
        <Image
          key={src}
          src={src}
          alt="Healthcare professionals"
          fill
          className={`object-cover transition-opacity duration-1000 ${
            index === currentImageIndex ? 'opacity-100' : 'opacity-0'
          }`}
          priority={index === 0}
        />
      ))}

      <div className="absolute inset-0 bg-black/70" />

      <div className="relative z-10 min-h-screen flex items-center">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col lg:flex-row items-center lg:items-stretch gap-12 lg:gap-16">
            <div className="w-full max-w-md">
              <div className="bg-white rounded-2xl shadow-2xl p-8 sm:p-10">
                <div className="flex justify-center mb-6">
                  <BrandLogo size="lg" />
                </div>

                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
                  <p className="mt-2 text-sm text-gray-600">Sign in with your email and password</p>
                </div>

                {sessionExpired && (
                  <div className="mb-6 rounded-lg bg-amber-50 border-2 border-amber-300 p-4 shadow-md">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-amber-900">Session Expired</p>
                        <p className="text-sm text-amber-800 mt-1">
                          Your session expired for security reasons. Please sign in again.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-red-800">Sign in failed</p>
                        <p className="text-sm text-red-700 mt-1">{error}</p>
                      </div>
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
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#065f46]/40 focus:border-[#065f46]"
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
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#065f46]/40 focus:border-[#065f46]"
                      placeholder="Enter password"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#065f46] px-4 py-3 text-sm font-medium text-white hover:bg-[#064e3b] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                    {isLoading ? 'Signing in...' : 'Sign in'}
                  </button>
                </form>
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-center text-white lg:pl-8">
              <div className="max-w-lg">
                <h2 className="text-3xl sm:text-4xl font-bold mb-4">DEMO-EMR</h2>
                <p className="text-lg text-white/80 mb-10">
                  A modern and secure electronic medical record system for clinic workflows and reporting.
                </p>

                <div className="space-y-6">
                  {features.map((feature) => (
                    <div key={feature.title} className="flex items-start gap-4">
                      <div className="flex-shrink-0 p-2 rounded-lg bg-white/10 backdrop-blur-sm">
                        <feature.icon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{feature.title}</h3>
                        <p className="text-sm text-white/70">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="mt-10 text-sm text-white/60">Powered by DEMO-EMR • Secure Clinical Platform</p>
              </div>
            </div>
          </div>
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

