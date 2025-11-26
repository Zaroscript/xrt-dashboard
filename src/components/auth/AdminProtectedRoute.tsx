import { Navigate, useLocation } from 'react-router-dom';
import { FullPageLoader } from '../ui/loading-spinner';
import { useAuthStore } from '../../stores/auth/useAuthStore';
import { useEffect, useState, useMemo } from 'react';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated, user, loading, _hasHydrated, tokens, logout } = useAuthStore();

  console.log('=== AdminProtectedRoute Render ===');
  console.log('Current URL:', location.pathname);
  console.log('Auth state:', {
    isAuthenticated,
    _hasHydrated,
    loading,
    hasTokens: !!tokens?.accessToken,
    isAdmin: user && ['super_admin', 'moderator'].includes(user.role),
    userRole: user?.role
  });

  // List of admin roles
  const isAdmin = useMemo(() => 
    user && ['super_admin', 'moderator'].includes(user.role),
    [user]
  );

  // Add a debounce state to prevent rapid redirects
  const [redirectDebounce, setRedirectDebounce] = useState<string | null>(null);
  
  // Add a state to track if we have a stable auth state
  const [hasStableState, setHasStableState] = useState(false);
  
  // Add a timeout to force stable state after a delay
  const [stableStateTimeout, setStableStateTimeout] = useState<NodeJS.Timeout | null>(null);

  // Check if we have a stable auth state (not in transition)
  useEffect(() => {
    const isStable = _hasHydrated && !loading;
    if (isStable !== hasStableState) {
      console.log('Stable state changed:', { from: hasStableState, to: isStable });
      
      // Clear any existing timeout
      if (stableStateTimeout) {
        clearTimeout(stableStateTimeout);
        setStableStateTimeout(null);
      }
      
      setHasStableState(isStable);
      
      // If we're not stable, set a timeout to force it
      if (!isStable && _hasHydrated) {
        console.log('Setting timeout to force stable state');
        const timer = setTimeout(() => {
          console.log('Forcing stable state after timeout');
          setHasStableState(true);
        }, 1000); // 1 second timeout
        setStableStateTimeout(timer);
      }
    }
  }, [_hasHydrated, loading, hasStableState, stableStateTimeout]);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (stableStateTimeout) {
        clearTimeout(stableStateTimeout);
      }
    };
  }, [stableStateTimeout]);

  // Memoize the redirect decision to prevent flickering
  const shouldRedirect = useMemo(() => {
    console.log('--- shouldRedirect evaluation ---');
    const state = {
      _hasHydrated,
      loading,
      hasTokens: !!tokens?.accessToken,
      isAuthenticated,
      isAdmin,
      hasStableState
    };
    console.log('State:', state);
    
    // If not hydrated yet, don't decide
    if (!_hasHydrated) {
      console.log('Decision: Not hydrated yet -> null');
      return null;
    }
    
    // If loading, don't decide
    if (loading) {
      console.log('Decision: Still loading -> null');
      return null;
    }
    
    // Only make decisions if we have a stable state
    if (!hasStableState) {
      console.log('Decision: No stable state yet -> null');
      return null;
    }
    
    // If not authenticated and no tokens, redirect to login
    if (!isAuthenticated && !tokens?.accessToken) {
      console.log('Decision: Not authenticated, no tokens -> redirect to login');
      return 'login';
    }
    
    // If authenticated but no tokens, this is an inconsistent state - logout
    if (isAuthenticated && !tokens?.accessToken) {
      console.log('Decision: Inconsistent state - authenticated but no tokens -> logout and redirect to login');
      logout();
      return 'login';
    }
    
    // If has tokens but not authenticated, this is also inconsistent - logout
    if (!isAuthenticated && tokens?.accessToken) {
      console.log('Decision: Inconsistent state - have tokens but not authenticated -> logout and redirect to login');
      logout();
      return 'login';
    }
    
    // If authenticated but not admin, redirect to unauthorized
    if (isAuthenticated && !isAdmin) {
      console.log('Decision: Authenticated but not admin -> redirect to unauthorized');
      return 'unauthorized';
    }
    
    // Otherwise, allow access
    console.log('Decision: All checks passed -> allow access');
    return null;
  }, [_hasHydrated, loading, tokens, isAuthenticated, isAdmin, hasStableState]);

  // Debounce redirect decisions to prevent rapid changes
  useEffect(() => {
    console.log('--- Debounce effect ---');
    console.log('shouldRedirect:', shouldRedirect);
    console.log('redirectDebounce:', redirectDebounce);
    
    // Don't redirect if we're still loading or don't have stable state
    if (loading || !hasStableState) {
      console.log('Skipping redirect - still loading or no stable state');
      return;
    }
    
    if (shouldRedirect && shouldRedirect !== redirectDebounce) {
      console.log('Setting up debounce timer for redirect:', shouldRedirect);
      const timer = setTimeout(() => {
        // Double check we're not loading and have stable state before redirecting
        if (!loading && hasStableState) {
          console.log('Debounce timer fired, setting redirect to:', shouldRedirect);
          setRedirectDebounce(shouldRedirect);
        } else {
          console.log('Debounce timer fired but still loading or no stable state, skipping redirect');
        }
      }, 300); // Increased debounce time to 300ms
      
      return () => {
        console.log('Clearing debounce timer');
        clearTimeout(timer);
      };
    } else if (!shouldRedirect && redirectDebounce) {
      console.log('Clearing redirect debounce');
      setRedirectDebounce(null);
    }
  }, [shouldRedirect, redirectDebounce, loading, hasStableState]);

  // Show loader while checking auth state OR while rehydrating
  if (loading || !_hasHydrated) {
    console.log('--- RENDER DECISION: LOADER ---');
    console.log('AdminProtectedRoute: Showing loader because:', {
      loading,
      notHydrated: !_hasHydrated
    });
    return <FullPageLoader />;
  }

  console.log('--- RENDER DECISION ---');
  console.log('Checking redirectDebounce:', redirectDebounce);
  
  // Handle redirects based on the memoized decision
  if (redirectDebounce === 'login') {
    console.log('--- RENDER DECISION: REDIRECT TO LOGIN ---');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (redirectDebounce === 'unauthorized') {
    console.log('--- RENDER DECISION: REDIRECT TO UNAUTHORIZED ---');
    return <Navigate to="/unauthorized" replace />;
  }

  // Render children if all checks pass (shouldRedirect is null)
  console.log('--- RENDER DECISION: RENDERING CHILDREN ---');
  return <>{children}</>;
};

export default AdminProtectedRoute;
