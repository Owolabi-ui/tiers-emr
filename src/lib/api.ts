import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { UserRole } from './users';
export type { UserRole } from './users';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

function isExpectedMissingResource(status?: number, url?: string): boolean {
  if (status !== 404 || !url) return false;
  return /\/api\/v1\/psychology\/patients\/[^/]+\/(phq9|gad7|audit-c)\/latest$/.test(url);
}

// Request interceptor - add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from localStorage (client-side only)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      console.log(`[API] Request to ${config.url}`);
      console.log('[API] localStorage keys:', Object.keys(localStorage));
      console.log('[API] Token from localStorage:', token ? token.substring(0, 30) + '...' : 'NULL');
      
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log(`[API] ✓ Token attached to request`);
      } else {
        console.warn(`[API] ✗ NO TOKEN - Request will fail with 401`);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    const status = error.response?.status;
    const url = error.config?.url;
    if (!isExpectedMissingResource(status, url)) {
      console.error('[API] Response error:', {
        status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url,
      });
    }
    
    // Handle 401 - unauthorized (token invalid/expired)
    if (status === 401) {
      console.warn('[API] 401 Unauthorized - Token expired or invalid.');
      console.warn('[API] TEMPORARILY NOT LOGGING OUT FOR DEBUGGING');
      
      // TEMPORARILY DISABLED FOR DEBUGGING
      // if (typeof window !== 'undefined') {
      //   localStorage.removeItem('access_token');
      //   localStorage.removeItem('user');
      //   // Set session expired flag in sessionStorage for login page to detect
      //   sessionStorage.setItem('session_expired', 'true');
      //   // Only redirect if not already on login page
      //   if (!window.location.pathname.includes('/login')) {
      //     window.location.href = '/login?session_expired=true';
      //   }
      // }
    }
    
    // Other errors are now handled by ApiErrorHandler component with toast notifications
    // Don't clear token or redirect, just let the error propagate
    // so the UI can display an appropriate error message
    return Promise.reject(error);
  }
);

// API Error Response type (matches backend ErrorResponse)
export interface ApiErrorResponse {
  error: string;
  error_code?: string;
  field?: string;
  fields?: Record<string, string>;
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at?: string;
  clinic_id?: string | null;
  phone?: string | null;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  role: UserRole;
}

// Auth API functions
export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/api/v1/auth/login', data);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<User> => {
    const response = await api.post<User>('/api/v1/auth/register', data);
    return response.data;
  },

  getMe: async (): Promise<User> => {
    const response = await api.get<User>('/api/v1/auth/me');
    return response.data;
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get<User>('/api/v1/auth/profile');
    return response.data;
  },
};

// Helper to extract error message from API error
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const apiError = error.response?.data as ApiErrorResponse | undefined;
    if (apiError?.error) {
      return apiError.error;
    }
    if (error.message) {
      return error.message;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

// Helper to get error code
export function getErrorCode(error: unknown): string | undefined {
  if (axios.isAxiosError(error)) {
    const apiError = error.response?.data as ApiErrorResponse | undefined;
    return apiError?.error_code;
  }
  return undefined;
}

export default api;
