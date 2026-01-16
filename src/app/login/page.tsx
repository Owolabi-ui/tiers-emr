'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/lib/auth-store';
import { Eye, EyeOff, Loader2, AlertCircle, Shield, Users, FileText, Activity, Info } from 'lucide-react';
import { PublicClientApplication } from '@azure/msal-browser';
import { msalConfig, loginRequest } from '@/lib/msalConfig';
import { microsoftAuthApi } from '@/lib/microsoftAuth';

// Background images for carousel (excluding logo)
const backgroundImages = [
  '/images/people-office-work-day.jpg',
  '/images/shutterstock_2005604723-1024x683.jpg',
  '/images/istockphoto-1008739058-612x612.jpg',
  '/images/Namnlos-design.png',
];

// Validation schema
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

// Features to display on the right side
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
  const { login, isLoading, error, clearError, setUser } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [msalInstance, setMsalInstance] = useState<PublicClientApplication | null>(null);
  const [microsoftLoading, setMicrosoftLoading] = useState(false);

  // Initialize MSAL
  useEffect(() => {
    const initializeMsal = async () => {
      try {
        // Check if crypto is available (required for MSAL)
        if (!window.crypto || !window.crypto.subtle) {
          console.warn('Crypto API not available. MSAL will be disabled.');
          return;
        }
        const msalApp = new PublicClientApplication(msalConfig);
        await msalApp.initialize();
        setMsalInstance(msalApp);
      } catch (error) {
        console.error('Failed to initialize MSAL:', error);
        // Continue without MSAL - user can use email/password instead
      }
    };
    initializeMsal();
  }, []);

  // Check if redirected due to session expiration
  useEffect(() => {
    // Check both URL param and sessionStorage
    const sessionExpiredParam = searchParams.get('session_expired') === 'true';
    const sessionExpiredStorage = sessionStorage.getItem('session_expired') === 'true';
    
    if (sessionExpiredParam || sessionExpiredStorage) {
      setSessionExpired(true);
      // Clear sessionStorage flag
      sessionStorage.removeItem('session_expired');
      // Clear the message after 8 seconds
      const timeout = setTimeout(() => setSessionExpired(false), 8000);
      return () => clearTimeout(timeout);
    }
  }, [searchParams]);

  // Auto-rotate background images every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % backgroundImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    clearError();
    const success = await login(data);
    if (success) {
      router.push('/dashboard');
    }
  };

  const handleMicrosoftLogin = async () => {
    if (!msalInstance) {
      console.error('MSAL not initialized');
      return;
    }

    setMicrosoftLoading(true);
    clearError();

    try {
      // Trigger popup login
      const loginResponse = await msalInstance.loginPopup(loginRequest);
      
      console.log('[Microsoft Login] Login response:', loginResponse);
      console.log('[Microsoft Login] Access token:', loginResponse.accessToken.substring(0, 50) + '...');
      
      // Get access token
      const accessToken = loginResponse.accessToken;

      // Send token to backend
      console.log('[Microsoft Login] Sending token to backend...');
      const response = await microsoftAuthApi.login(accessToken);
      
      console.log('[Microsoft Login] Backend response:', response);

      // Store tokens and user info
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('refresh_token', response.refresh_token);
      
      // Convert to User type and store
      setUser({
        id: response.user.id,
        email: response.user.email,
        full_name: response.user.full_name,
        role: response.user.role,
        is_active: response.user.is_active,
        clinic_id: response.user.clinic_id,
        phone: response.user.phone,
      });

      console.log('[Microsoft Login] Success! Redirecting to dashboard...');
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error: any) {
      console.error('[Microsoft Login] Error:', error);
      console.error('[Microsoft Login] Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      
      // Handle specific error cases
      if (error.errorCode === 'popup_window_error') {
        alert('Please allow popups for this site to use Microsoft login');
      } else if (error.errorCode === 'user_cancelled') {
        // User cancelled login, no need to show error
      } else if (error.response?.status === 401) {
        alert('Microsoft authentication failed. The token may be invalid. Please ensure your account is pre-registered by an administrator.');
      } else if (error.response?.status === 500) {
        alert('Server error occurred. This may be a temporary database connection issue. Please try again.');
      } else {
        alert(error.response?.data?.message || error.message || 'Microsoft login failed. Please try again.');
      }
    } finally {
      setMicrosoftLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background images with crossfade */}
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

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/70" />

      {/* Content container */}
      <div className="relative z-10 min-h-screen flex items-center">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col lg:flex-row items-center lg:items-stretch gap-12 lg:gap-16">

            {/* Left side - White login card */}
            <div className="w-full max-w-md">
              <div className="bg-white rounded-2xl shadow-2xl p-8 sm:p-10">
                {/* Logo */}
                <div className="flex justify-center mb-6">
                  <Image
                    src="/images/TIERs-Logo-good.png"
                    alt="TIERs Logo"
                    width={72}
                    height={72}
                    priority
                  />
                </div>

                {/* Header */}
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold text-gray-900">
                    Welcome back
                  </h1>
                  <p className="mt-2 text-sm text-gray-600">
                    Sign in to your TIERs EMR account
                  </p>
                </div>

                {/* Session expired message */}
                {sessionExpired && (
                  <div className="mb-6 rounded-lg bg-amber-50 border-2 border-amber-300 p-4 shadow-md">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-amber-900">
                          Session Expired
                        </p>
                        <p className="text-sm text-amber-800 mt-1">
                          Your session has expired for security reasons. Please log in again to continue.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Error message */}
                {error && (
                  <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-red-800">
                          Login failed
                        </p>
                        <p className="text-sm text-red-700 mt-1">
                          {error}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Login form */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  {/* Email field */}
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-1.5"
                    >
                      Email address
                    </label>
                    <input
                      {...register('email')}
                      id="email"
                      type="email"
                      autoComplete="email"
                      className={`block w-full rounded-lg border px-4 py-3 text-sm transition-colors
                        ${
                          errors.email
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                            : 'border-gray-300 focus:border-[#5b21b6] focus:ring-[#5b21b6]'
                        }
                        bg-gray-50 text-gray-900 placeholder-gray-400
                        focus:outline-none focus:ring-2 focus:ring-offset-0 focus:bg-white`}
                      placeholder="you@example.com"
                    />
                    {errors.email && (
                      <p className="mt-1.5 text-sm text-red-600">
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  {/* Password field */}
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-700 mb-1.5"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <input
                        {...register('password')}
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        className={`block w-full rounded-lg border px-4 py-3 pr-12 text-sm transition-colors
                          ${
                            errors.password
                              ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                              : 'border-gray-300 focus:border-[#5b21b6] focus:ring-[#5b21b6]'
                          }
                          bg-gray-50 text-gray-900 placeholder-gray-400
                          focus:outline-none focus:ring-2 focus:ring-offset-0 focus:bg-white`}
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="mt-1.5 text-sm text-red-600">
                        {errors.password.message}
                      </p>
                    )}
                  </div>

                  {/* Forgot password link */}
                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="text-sm text-[#5b21b6] hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>

                  {/* Submit button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#5b21b6] px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-[#4c1d95] focus:outline-none focus:ring-2 focus:ring-[#5b21b6] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      'Sign in'
                    )}
                  </button>
                </form>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-white px-4 text-gray-500">
                      Or continue with
                    </span>
                  </div>
                </div>

                {/* Microsoft OAuth button */}
                <button
                  type="button"
                  onClick={handleMicrosoftLogin}
                  disabled={microsoftLoading || !msalInstance}
                  title={!msalInstance ? 'Microsoft sign-in requires HTTPS. Use ngrok or configure HTTPS for network access.' : ''}
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

                {!msalInstance && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                    <p className="font-semibold mb-1">ℹ️ Microsoft sign-in disabled</p>
                    <p>
                      The app is running on HTTP. Microsoft authentication requires HTTPS. 
                      Use <code className="bg-amber-100 px-1 rounded">ngrok</code> to create an HTTPS tunnel, 
                      or configure HTTPS on your network. See HTTPS_SETUP_FOR_NETWORK.md for instructions.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right side - Features text on overlay */}
            <div className="flex-1 flex flex-col justify-center text-white lg:pl-8">
              <div className="max-w-lg">
                <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                  TIERs Electronic Medical Records
                </h2>
                <p className="text-lg text-white/80 mb-10">
                  A modern, secure EMR system purpose-built for inclusive, high-quality healthcare delivery.
                </p>

                {/* Feature list */}
                <div className="space-y-6">
                  {features.map((feature) => (
                    <div key={feature.title} className="flex items-start gap-4">
                      <div className="flex-shrink-0 p-2 rounded-lg bg-white/10 backdrop-blur-sm">
                        <feature.icon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">
                          {feature.title}
                        </h3>
                        <p className="text-sm text-white/70">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer text */}
                <p className="mt-10 text-sm text-white/60">
                  Powered by TIERs &bull; Secure &bull; HIPAA Compliant
                </p>
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
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-[#5b21b6]" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}