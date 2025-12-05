import { useEffect, useRef } from "react";
import { useAuthStore } from "../stores/auth/useAuthStore";

/**
 * Sets up authentication when the app starts
 * Makes sure we know who's logged in before showing protected pages
 */
export const useAuthInit = () => {
  const { _hasHydrated, loading, checkAuth, isAuthenticated, tokens } =
    useAuthStore();
  const hasCheckedAuth = useRef(false);

  useEffect(() => {
    // Only check auth when all these conditions are met:
    // - hydration is complete
    // - we're not already loading
    // - we don't have any auth state at all (edge case)
    // - we haven't already checked auth
    if (
      _hasHydrated &&
      !loading &&
      !isAuthenticated &&
      !tokens?.accessToken &&
      !hasCheckedAuth.current
    ) {
      hasCheckedAuth.current = true;
      // Add a small delay to prevent race conditions
      const timer = setTimeout(() => {
        checkAuth();
      }, 100);

      return () => {
        clearTimeout(timer);
      };
    } else {
      // Skip checkAuth
    }
  }, [_hasHydrated, loading, isAuthenticated, tokens, checkAuth]);

  // Reset the flag when auth state changes to allow re-checking if needed
  useEffect(() => {
    if (isAuthenticated || tokens?.accessToken) {
      hasCheckedAuth.current = false;
    }
  }, [isAuthenticated, tokens]);

  // Consider the app ready if hydration is complete, regardless of loading state
  // This prevents the loading flash issue
  const isReady = _hasHydrated;

  return {
    isReady,
    isAuthenticated,
    _hasHydrated,
    loading,
  };
};

export default useAuthInit;
