import type { User } from '@/stores';
import { apiClient } from './apiClient';

export interface Tokens {
  accessToken: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  status: string;
  data: {
    user: User;
    accessToken: string;
    refreshToken?: string;
  };
}

export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
    return response.data;
  },

  getMe: async (): Promise<{ user: User; clientProfile?: any }> => {
    const response = await apiClient.get<{ status: string; data: { user: User; clientProfile?: any } }>('/auth/me');
    return response.data.data;
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear auth state even if the API call fails
      localStorage.removeItem('auth-storage');
    }
  }
};

export default authService;
