import { api, User, UserRole } from './api';

export interface MicrosoftLoginRequest {
  access_token: string;
}

export interface MicrosoftUserResponse {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string | null;
  clinic_id?: string | null;
  is_active: boolean;
  profile?: any;
}

export interface MicrosoftLoginResponse {
  access_token: string;
  refresh_token: string;
  user: MicrosoftUserResponse;
}

export const microsoftAuthApi = {
  /**
   * Authenticate with Microsoft OAuth access token
   */
  login: async (accessToken: string): Promise<MicrosoftLoginResponse> => {
    const response = await api.post<MicrosoftLoginResponse>(
      '/api/v1/auth/microsoft',
      { access_token: accessToken }
    );
    return response.data;
  },
};
