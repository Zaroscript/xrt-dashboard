import type { User } from "@/stores";
import { apiClient } from "./apiClient";

export interface Tokens {
  accessToken: string;
  refreshToken?: string;
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
    const response = await apiClient.post<LoginResponse>(
      "/auth/login",
      credentials
    );
    return response.data;
  },

  getMe: async (): Promise<{ user: User; clientProfile?: any }> => {
    const response = await apiClient.get<{
      status: string;
      data: { user: User; clientProfile?: any };
    }>("/auth/me");
    return response.data.data;
  },

  logout: async (): Promise<void> => {
    try {
      if (localStorage.getItem("auth-storage")) {
        // Try to decode token to check if we can call logout
        // Or just rely on apiClient interceptors
        await apiClient.post("/auth/logout");
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear auth state even if the API call fails
      localStorage.removeItem("auth-storage");
    }
  },

  refreshToken: async (token: string): Promise<Tokens> => {
    const response = await apiClient.post<{
      status: string;
      data: { accessToken: string; refreshToken?: string };
    }>("/auth/refresh-token", { refreshToken: token });
    return response.data.data;
  },
};

export default authService;
