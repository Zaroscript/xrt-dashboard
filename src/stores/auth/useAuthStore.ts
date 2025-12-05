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
  login: (
    email: string,
    password: string
  ) => Promise<{ user: User; tokens: Tokens }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setHydrated: (state: boolean) => void;
  syncAuthState: () => void;
}

type AuthStore = AuthState & AuthActions;

// Where we start from
const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  tokens: null,
  loading: true,
  error: null,
  _hasHydrated: false,
};

// Make sure we don't spam auth checks
const isCheckingAuth = false;
let isRehydrating = false;

// Prevent multiple logout tries at once
let isLoggingOut = false;

// Check if a token is still valid
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
            return;
          }

          const isAuthenticated = !!user && !!tokens?.accessToken;
          set({
            user,
            tokens,
            isAuthenticated,
            error: null,
          });
          // Debug: Check what's in localStorage after setting auth
          setTimeout(() => {
            const stored = localStorage.getItem("auth-storage");
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
                accessToken: response.data.accessToken,
              },
            };

            set({
              isAuthenticated: true,
              user: authData.user,
              tokens: authData.tokens,
              loading: false,
              error: null,
            });

            return authData;
          } catch (error: any) {
            set({
              isAuthenticated: false,
              user: null,
              tokens: null,
              loading: false,
              error: error.response?.data?.message || "Login failed",
            });
            throw error;
          }
        },

        logout: async () => {
          // Prevent multiple simultaneous logout attempts
          if (isLoggingOut) {
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


          if (!tokens?.accessToken) {
            return;
          }

          if (isTokenExpired(tokens.accessToken)) {
            await get().logout();
            return;
          }

          try {
            const userResponse = await authService.getMe();
            get().setAuth(userResponse.user, {
              accessToken: tokens.accessToken,
            });
          } catch (error) {
            console.error(
              "Auth check failed - invalid token, logging out:",
              error
            );
            await get().logout();
          }
        },

        syncAuthState: () => {
          const { isAuthenticated, user, tokens, _hasHydrated } = get();
          const shouldBeAuthenticated = !!(user && tokens?.accessToken);


          // Only sync if there's a mismatch and we're not in the middle of loading
          if (
            isAuthenticated !== shouldBeAuthenticated &&
            !get().loading &&
            _hasHydrated
          ) {
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

          if (isRehydrating) {
            return;
          }

          isRehydrating = true;

          try {
            checkAuthStorage();

            if (!state) {
              state.setLoading(false);
              state.setHydrated(true);
              return;
            }

            if (state._hasHydrated) {
              return;
            }

            state.setLoading(true);

            // Set initial auth state based on stored data
            const hasTokens = !!state.tokens?.accessToken;
            const hasUser = !!state.user;
            if (hasTokens && hasUser) {
              state.isAuthenticated = true;
            } else {
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
