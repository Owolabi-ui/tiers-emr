// User Management API Client
import { api } from './api';

// ============================================================================
// TYPES
// ============================================================================

export type UserRole =
  | 'Admin'
  | 'Doctor'
  | 'Nurse'
  | 'Pharmacist'
  | 'LabTech'
  | 'Psychologist'
  | 'Receptionist'
  | 'ProgramAssociate';

export interface UserProfile {
  user_id: string;
  license_number: string | null;
  specialization: string | null;
  department: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  phone: string | null;
  clinic_id: string | null;
  is_active: boolean;
  profile: UserProfile | null;
}

export interface UserListResponse {
  users: User[];
  total: number;
}

export interface CreateUserRequest {
  email: string;
  role: UserRole;
  full_name: string;
  phone?: string | null;
  department?: string | null;
}

export interface UpdateUserRequest {
  role?: UserRole;
  full_name?: string;
  phone?: string | null;
  is_active?: boolean;
  department?: string | null;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

export const usersApi = {
  /**
   * Get all users (admin only)
   */
  list: async (activeOnly: boolean = false): Promise<UserListResponse> => {
    const params = activeOnly ? '?active_only=true' : '';
    const response = await api.get<UserListResponse>(`/api/v1/admin/users${params}`);
    return response.data;
  },

  /**
   * Get single user by ID (admin only)
   */
  get: async (userId: string): Promise<User> => {
    const response = await api.get<User>(`/api/v1/admin/users/${userId}`);
    return response.data;
  },

  /**
   * Create new user (admin only)
   */
  create: async (data: CreateUserRequest): Promise<User> => {
    const response = await api.post<User>('/api/v1/admin/users', data);
    return response.data;
  },

  /**
   * Update user (admin only)
   */
  update: async (userId: string, data: UpdateUserRequest): Promise<User> => {
    const response = await api.put<User>(`/api/v1/admin/users/${userId}`, data);
    return response.data;
  },

  /**
   * Deactivate user (admin only)
   */
  deactivate: async (userId: string): Promise<{ message: string }> => {
    const response = await api.put<{ message: string }>(`/api/v1/admin/users/${userId}/deactivate`, {});
    return response.data;
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export const getRoleDisplayName = (role: UserRole): string => {
  const roleNames: Record<UserRole, string> = {
    Admin: 'Administrator',
    Doctor: 'Doctor',
    Nurse: 'Nurse',
    Pharmacist: 'Pharmacist',
    LabTech: 'Lab Scientist',
    Psychologist: 'Psychologist',
    Receptionist: 'Receptionist',
    ProgramAssociate: 'Program Associate',
  };
  return roleNames[role] || role;
};

export const getRoleColor = (role: UserRole): string => {
  const roleColors: Record<UserRole, string> = {
    Admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    Doctor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    Nurse: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    Pharmacist: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    LabTech: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
    Psychologist: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400',
    Receptionist: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    ProgramAssociate: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  };
  return roleColors[role] || 'bg-gray-100 text-gray-800';
};
