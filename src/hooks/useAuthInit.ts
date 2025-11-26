import { useEffect, useRef } from 'react';
import { useAuthStore } from '../stores/auth/useAuthStore';

/**
 * Hook to initialize authentication on app startup
 * Ensures auth state is properly hydrated before rendering protected routes
 */
export const useAuthInit = () => {
  const { _hasHydrated, loading, checkAuth, isAuthenticated, tokens } = useAuthStore();
  const hasCheckedAuth = useRef(false);

  console.log('=== useAuthInit RENDER ===');
  console.log('useAuthInit state:', { _hasHydrated, loading, isAuthenticated, hasTokens: !!tokens?.accessToken });

  useEffect(() => {
    console.log('--- useAuthInit EFFECT ---');
    console.log('useAuthInit effect triggered:', { _hasHydrated, loading, isAuthenticated, hasTokens: !!tokens?.accessToken, hasCheckedAuth: hasCheckedAuth.current });
    
    // Only check auth if:
    // - hydration is complete
    // - we're not already loading
    // - we don't have any auth state at all (edge case)
    // - we haven't already checked auth
    if (_hasHydrated && !loading && !isAuthenticated && !tokens?.accessToken && !hasCheckedAuth.current) {
      console.log('No auth state, triggering checkAuth');
      hasCheckedAuth.current = true;
      // Add a small delay to prevent race conditions
      const timer = setTimeout(() => {
        console.log('Timer fired, calling checkAuth');
        checkAuth();
      }, 100);
      
      return () => {
        console.log('Clearing checkAuth timer');
        clearTimeout(timer);
      };
    } else {
      console.log('Skipping checkAuth - conditions not met');
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
  console.log('useAuthInit: isReady =', isReady);

  return {
    isReady,
    isAuthenticated,
    _hasHydrated,
    loading
  };
};

export default useAuthInit;
