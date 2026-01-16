import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi, User, LoginRequest, LoginResponse, getErrorMessage } from './api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginRequest) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,

      login: async (credentials: LoginRequest) => {
        set({ isLoading: true, error: null });
        try {
          const response: LoginResponse = await authApi.login(credentials);

          console.log('[Auth Store] Login successful, user:', response.user);
          console.log('[Auth Store] Token:', response.access_token.substring(0, 20) + '...');

          // Store token in localStorage for API interceptor
          if (typeof window !== 'undefined') {
            localStorage.setItem('access_token', response.access_token);
            localStorage.setItem('user', JSON.stringify(response.user));
            console.log('[Auth Store] Saved to localStorage');
          }

          set({
            user: response.user,
            token: response.access_token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          return true;
        } catch (error) {
          const message = getErrorMessage(error);
          console.error('[Auth Store] Login failed:', message);
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: message,
          });
          return false;
        }
      },

      logout: () => {
        // Clear localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
        }

        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      checkAuth: async () => {
        const state = get();

        // If no token, not authenticated
        if (!state.token) {
          // Try to recover from localStorage
          if (typeof window !== 'undefined') {
            const storedToken = localStorage.getItem('access_token');
            const storedUser = localStorage.getItem('user');

            if (storedToken && storedUser) {
              try {
                const user = JSON.parse(storedUser) as User;
                set({
                  token: storedToken,
                  user,
                  isAuthenticated: true,
                });
                return true;
              } catch {
                // Invalid stored data, clear it
                localStorage.removeItem('access_token');
                localStorage.removeItem('user');
              }
            }
          }
          return false;
        }

        // Validate token with backend
        set({ isLoading: true });
        try {
          const user = await authApi.getMe();
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
          return true;
        } catch {
          // Token invalid, clear auth state
          get().logout();
          set({ isLoading: false });
          return false;
        }
      },

      clearError: () => set({ error: null }),

      setLoading: (loading: boolean) => set({ isLoading: loading }),

      setUser: (user: User) => {
        console.log('[Auth Store] Setting user:', user);
        
        // Store user in localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(user));
        }

        set({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Helper hook for checking if user has required role
export function useHasRole(allowedRoles: string[]): boolean {
  const user = useAuthStore((state) => state.user);
  if (!user) return false;
  return allowedRoles.includes(user.role);
}

// Helper to get role display name
export function getRoleDisplayName(role: string): string {
  const roleNames: Record<string, string> = {
    Admin: 'Administrator',
    Doctor: 'Doctor',
    Nurse: 'Nurse',
    Pharmacist: 'Pharmacist',
    LabTech: 'Laboratory Technician',
    Receptionist: 'Receptionist',
  };
  return roleNames[role] || role;
}
