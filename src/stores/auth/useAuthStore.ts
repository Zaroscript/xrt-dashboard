import { create } from "zustand";
import { persist, createJSONStorage, devtools } from "zustand/middleware";
import { jwtDecode } from "jwt-decode";
import type { User, Tokens } from "../types";
import { authService } from "../../services/api/authService";
import { checkAuthStorage } from "../../utils/authDebug";

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  tokens: Tokens | null;
  loading: boolean;
  error: string | null;
  _hasHydrated: boolean;
}

interface AuthActions {
  setAuth: (user: User | null, tokens: Tokens | null) => void;
  login: (email: string, password: string) => Promise<{ user: User; tokens: Tokens }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setHydrated: (state: boolean) => void;
  syncAuthState: () => void;
}

type AuthStore = AuthState & AuthActions;

// Initial state
const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  tokens: null,
  loading: true,
  error: null,
  _hasHydrated: false,
};

// Global flag to prevent multiple simultaneous auth operations
let isCheckingAuth = false;
let isRehydrating = false;

// Global flag to prevent multiple simultaneous auth operations
// Global flag to prevent multiple simultaneous logout attempts
let isLoggingOut = false;

// Helper function to check if token is expired
const isTokenExpired = (token: string): boolean => {
  try {
    const decoded: any = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
  } catch (error) {
    console.error("Error decoding token:", error);
    return true; // Assume expired if we can't decode
  }
};

// Export the store hook
export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        setAuth: (user, tokens) => {
          const { user: currentUser, tokens: currentTokens } = get();

          // Prevent unnecessary state updates
          if (
            JSON.stringify(currentUser) === JSON.stringify(user) &&
            JSON.stringify(currentTokens) === JSON.stringify(tokens)
          ) {
            console.log("setAuth called with same values, skipping");
            return;
          }

          console.log("setAuth called:", { user: !!user, tokens: !!tokens });
          const isAuthenticated = !!user && !!tokens?.accessToken;
          console.log("Setting isAuthenticated to:", isAuthenticated);
          set({
            user,
            tokens,
            isAuthenticated,
            error: null,
          });
          // Debug: Check what's in localStorage after setting auth
          setTimeout(() => {
            const stored = localStorage.getItem("auth-storage");
            console.log("Auth in localStorage after setAuth:", stored);
          }, 100);
        },

        login: async (email: string, password: string) => {
          set({ loading: true, error: null });
          try {
            const response = await authService.login({ email, password });
            
            // Transform the response to match the expected format
            const authData = {
              user: response.data.user,
              tokens: {
                accessToken: response.data.accessToken
              }
            };
            
            set({ 
              isAuthenticated: true,
              user: authData.user,
              tokens: authData.tokens,
              loading: false,
              error: null
            });
            
            return authData;
          } catch (error: any) {
            set({ 
              isAuthenticated: false,
              user: null,
              tokens: null,
              loading: false,
              error: error.response?.data?.message || "Login failed"
            });
            throw error;
          }
        },

        logout: async () => {
          // Prevent multiple simultaneous logout attempts
          if (isLoggingOut) {
            console.log("Logout already in progress, skipping");
            return;
          }

          isLoggingOut = true;
          const { tokens } = get();

          try {
            // Only call logout API if we have valid tokens
            if (tokens?.accessToken) {
              await authService.logout();
            }
          } catch (error) {
            console.error("Logout error:", error);
          } finally {
            set({
              isAuthenticated: false,
              user: null,
              tokens: null,
              error: null,
            });
            isLoggingOut = false;
          }
        },

        checkAuth: async () => {
          const { tokens, loading, isAuthenticated } = get();

          console.log("--- checkAuth called ---");
          console.log("State:", {
            loading,
            isAuthenticated,
            hasTokens: !!tokens?.accessToken,
          });

          if (!tokens?.accessToken) {
            console.log("No access token available during checkAuth");
            return;
          }

          if (isTokenExpired(tokens.accessToken)) {
            console.log("Access token expired, logging out...");
            await get().logout();
            return;
          }

          try {
            const userResponse = await authService.getMe();
            get().setAuth(userResponse.user, { accessToken: tokens.accessToken });
          } catch (error) {
            console.error("Auth check failed - invalid token, logging out:", error);
            await get().logout();
          }
        },

        syncAuthState: () => {
          const { isAuthenticated, user, tokens, _hasHydrated } = get();
          const shouldBeAuthenticated = !!(user && tokens?.accessToken);

          console.log("syncAuthState called:", {
            isAuthenticated,
            shouldBeAuthenticated,
            hasTokens: !!tokens?.accessToken,
            hasUser: !!user,
            _hasHydrated,
            loading: get().loading,
          });

          // Only sync if there's a mismatch and we're not in the middle of loading
          if (
            isAuthenticated !== shouldBeAuthenticated &&
            !get().loading &&
            _hasHydrated
          ) {
            console.log(
              `Syncing auth state from ${isAuthenticated} to ${shouldBeAuthenticated}`
            );
            set({ isAuthenticated: shouldBeAuthenticated });
          }
        },

        setLoading: (loading) => set({ loading }),
        setError: (error) => set({ error }),
        clearError: () => set({ error: null }),
        setHydrated: (_hasHydrated) => set({ _hasHydrated }),
      }),
      {
        name: "auth-storage",
        storage: createJSONStorage(() => {
          console.log("Creating localStorage storage for auth");
          return localStorage;
        }),
        version: 1,
        partialize: (state) => {
          const partial = {
            user: state.user,
            tokens: state.tokens,
            isAuthenticated: state.isAuthenticated,
          };
          return partial;
        },
        onRehydrateStorage: () => async (state) => {
          console.log("--- onRehydrateStorage called ---");

          if (isRehydrating) {
            console.log("Rehydration already in progress, skipping");
            return;
          }

          isRehydrating = true;

          try {
            console.log("Starting auth rehydration...");
            checkAuthStorage();

            if (!state) {
              console.log("No state found during rehydration");
              state.setLoading(false);
              state.setHydrated(true);
              return;
            }

            if (state._hasHydrated) {
              console.log("Already hydrated, skipping rehydration");
              return;
            }
          
            state.setLoading(true);

            // Set initial auth state based on stored data
            const hasTokens = !!state.tokens?.accessToken;
            const hasUser = !!state.user;
            if (hasTokens && hasUser) {
              state.isAuthenticated = true;
              console.log("Temporarily setting authenticated based on stored data");
            } else {
              console.log("No tokens or user found during rehydration");
              state.setAuth(null, null);
            }

            state.setLoading(false);
            state.setHydrated(true);
            state.syncAuthState();
          } catch (error) {
            console.error("Outer rehydration error:", error);
            if (state) {
              state.setLoading(false);
              state.setHydrated(true);
            }
          } finally {
            isRehydrating = false;
          }
        },
        migrate: (persistedState: any, version) => {
          // Handle migrations between versions if needed
          if (version === 0) {
            // Migrate from version 0 to 1
            return { ...persistedState };
          }
          return persistedState;
        },
      }
    ),
    {
      name: "auth-store",
    }
  )
);

// Export types
export type { AuthStore, AuthState, AuthActions };
