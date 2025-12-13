import axios, {
  AxiosError,
  AxiosHeaders,
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from "axios";
import { useAuthStore } from "../../stores/auth/useAuthStore";
import { authService } from "./authService";
import type { Tokens } from "./authService";
import { toast } from "sonner";

// Flag to prevent multiple simultaneous token refresh attempts
let isRefreshing = false;
let failedQueue: {
  resolve: (token: string) => void;
  reject: (error: any) => void;
}[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

// Base URL configuration - using relative URL to work with Vite proxy
// Base URL configuration
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const baseURL = `${API_URL}/api`;

// Extend InternalAxiosRequestConfig to include _retry flag
interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// Create axios instance with base URL and headers
const apiClient: AxiosInstance = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
  timeout: 10000, // 10 seconds timeout
});

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
  async (config) => {
    const { tokens } = useAuthStore.getState();

    // Skip for public auth endpoints only
    const publicAuthEndpoints = [
      "/auth/login",
      "/auth/register",
      "/auth/forgot-password",
      "/auth/reset-password",
      "/auth/refresh-token",
    ];

    if (
      publicAuthEndpoints.some((endpoint) => config.url?.includes(endpoint))
    ) {
      return config;
    }

    // Add auth token if available
    if (tokens?.accessToken) {
      config.headers.Authorization = `Bearer ${tokens.accessToken}`;
    }

    return config;
  },
  (error) => {
    console.error("Request Error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors and refreshing tokens
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryConfig;

    // Log the error
    if (error.response) {
      console.error(
        `API Error [${
          error.response.status
        }]: ${error.config?.method?.toUpperCase()} ${error.config?.url}`,
        {
          status: error.response.status,
          data: error.response.data,
        }
      );
    } else if (error.request) {
      console.error("API Request Error - No response received:", error.request);
    } else {
      console.error("API Setup Error:", error.message);
    }

    // If error is not a 401 or we've already retried, reject
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Get current auth state
    const { tokens, logout } = useAuthStore.getState();

    // If this is a refresh token request that failed, logout immediately
    if (originalRequest.url?.includes("/auth/refresh")) {
      console.error("Refresh token request failed - logging out");
      const authStore = useAuthStore.getState();
      if (!authStore.isAuthenticated) {
        return Promise.reject(error);
      }
      toast.error("Session expired. Please log in again.");
      authStore.logout();
      return Promise.reject(error);
    }

    // If we're already refreshing, add the request to the queue
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            resolve(apiClient(originalRequest));
          },
          reject: (err: any) => reject(err),
        });
      });
    }

    // Set refresh flag and refresh token
    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Refresh the token using the refresh token from the store
      const { tokens } = useAuthStore.getState();

      if (!tokens?.refreshToken) {
        throw new Error("No refresh token available");
      }

      const response = await apiClient.post<{
        accessToken: string;
        refreshToken: string;
      }>(
        "/auth/refresh-token",
        { refreshToken: tokens.refreshToken },
        {
          withCredentials: true, // Important for sending cookies
        }
      );
      const { accessToken, refreshToken } = response.data;

      // Update the store with new tokens
      useAuthStore
        .getState()
        .setAuth(useAuthStore.getState().user, { accessToken, refreshToken });

      // Update the auth header for the original request
      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      }

      // Process queued requests
      processQueue(null, accessToken);

      // Retry the original request
      return apiClient(originalRequest);
    } catch (refreshError) {
      console.error("=== API CLIENT REFRESH FAILED ===");
      console.error("Refresh error:", refreshError);
      console.error("Original request that failed:", originalRequest.url);
      // If refresh fails, immediately logout for security
      console.error("Token refresh failed - logging out immediately");
      processQueue(refreshError, null);
      const authStore = useAuthStore.getState();
      // Check if already logged out to prevent infinite loops
      if (!authStore.isAuthenticated) {
        return Promise.reject(refreshError);
      }
      toast.error("Session expired. Please log in again.");
      authStore.logout();

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export { apiClient };
