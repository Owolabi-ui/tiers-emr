'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useAuthStore } from '@/lib/auth-store';
import { Loader2, AlertCircle, Shield, Users, FileText, Activity, Info } from 'lucide-react';
import { PublicClientApplication } from '@azure/msal-browser';
import { msalConfig, loginRequest } from '@/lib/msalConfig';
import { microsoftAuthApi } from '@/lib/microsoftAuth';
import { getErrorMessage } from '@/lib/api';

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
    icon: Activity,
    title: 'Clinical Workflows',
    description: 'HTS, PrEP, PEP, ART, and mental health modules',
  },
  {
    icon: FileText,
    title: 'Program Reporting',
    description: 'PEPFAR-ready reports and analytics dashboards',
  },
];

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { error, clearError, setUser } = useAuthStore();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [msalInstance, setMsalInstance] = useState<PublicClientApplication | null>(null);
  const [microsoftLoading, setMicrosoftLoading] = useState(false);

  useEffect(() => {
    const initializeMsal = async () => {
      try {
        if (!window.crypto || !window.crypto.subtle) {
          return;
        }
        const msalApp = new PublicClientApplication(msalConfig);
        await msalApp.initialize();
        setMsalInstance(msalApp);
      } catch {
        setMsalInstance(null);
      }
    };
    initializeMsal();
  }, []);

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

  const handleMicrosoftLogin = async () => {
    if (!msalInstance) return;
    setMicrosoftLoading(true);
    clearError();

    try {
      const loginResponse = await msalInstance.loginPopup(loginRequest);
      const response = await microsoftAuthApi.login(loginResponse.accessToken);

      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('refresh_token', response.refresh_token);

      setUser({
        id: response.user.id,
        email: response.user.email,
        full_name: response.user.full_name,
        role: response.user.role,
        is_active: response.user.is_active,
        clinic_id: response.user.clinic_id,
        phone: response.user.phone,
      });

      router.push('/dashboard');
    } catch (err) {
      const message = getErrorMessage(err);
      alert(message || 'Microsoft login failed. Please try again.');
    } finally {
      setMicrosoftLoading(false);
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
                  <Image src="/images/TIERs-Logo-good.png" alt="TIERs Logo" width={72} height={72} priority />
                </div>

                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
                  <p className="mt-2 text-sm text-gray-600">Sign in with your organization Microsoft account</p>
                </div>

                {sessionExpired && (
                  <div className="mb-6 rounded-lg bg-amber-50 border-2 border-amber-300 p-4 shadow-md">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-amber-900">Session Expired</p>
                        <p className="text-sm text-amber-800 mt-1">
                          Your session has expired for security reasons. Please sign in again.
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

                <button
                  type="button"
                  onClick={handleMicrosoftLogin}
                  disabled={microsoftLoading || !msalInstance}
                  title={!msalInstance ? 'Microsoft sign-in requires HTTPS.' : ''}
                  className="w-full flex items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {microsoftLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <svg className="h-5 w-5" viewBox="0 0 21 21" fill="none">
                      <path d="M10 0H0v10h10V0z" fill="#F25022" />
                      <path d="M21 0H11v10h10V0z" fill="#7FBA00" />
                      <path d="M10 11H0v10h10V11z" fill="#00A4EF" />
                      <path d="M21 11H11v10h10V11z" fill="#FFB900" />
                    </svg>
                  )}
                  {microsoftLoading ? 'Signing in...' : 'Sign in with Microsoft'}
                </button>

                <p className="mt-3 text-xs text-gray-500 text-center">
                  Password login is disabled. Contact your administrator if your account is not yet provisioned.
                </p>
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-center text-white lg:pl-8">
              <div className="max-w-lg">
                <h2 className="text-3xl sm:text-4xl font-bold mb-4">TIERs Electronic Medical Records</h2>
                <p className="text-lg text-white/80 mb-10">
                  A modern, secure EMR system purpose-built for inclusive, high-quality healthcare delivery.
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

                <p className="mt-10 text-sm text-white/60">Powered by TIERs &bull; Secure &bull; HIPAA Compliant</p>
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
          <Loader2 className="h-8 w-8 animate-spin text-[#5b21b6]" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
