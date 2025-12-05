import { Navigate, useLocation } from "react-router-dom";
import { FullPageLoader } from "../ui/loading-spinner";
import { useAuthStore } from "../../stores/auth/useAuthStore";
import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({
  children,
}) => {
  const location = useLocation();
  const { isAuthenticated, user, loading, _hasHydrated, tokens, logout } =
    useAuthStore();

  
  // List of admin roles
  const isAdmin = useMemo(
    () => user && ["super_admin", "moderator"].includes(user.role),
    [user]
  );

  // Add a debounce state to prevent rapid redirects
  const [redirectDebounce, setRedirectDebounce] = useState<string | null>(null);

  // Add a state to track if we have a stable auth state
  const [hasStableState, setHasStableState] = useState(false);

  // Add a state to track if unauthorized toast has been shown
  const [unauthorizedToastShown, setUnauthorizedToastShown] = useState(false);

  // Add a timeout to force stable state after a delay
  const [stableStateTimeout, setStableStateTimeout] =
    useState<NodeJS.Timeout | null>(null);

  // Check if we have a stable auth state (not in transition)
  useEffect(() => {
    const isStable = _hasHydrated && !loading;
    if (isStable !== hasStableState) {
      setHasStableState(isStable);

      // If we're not stable, set a timeout to force it
      if (!isStable && _hasHydrated) {
        const timer = setTimeout(() => {
          setHasStableState(true);
        }, 1000); // 1 second timeout
        setStableStateTimeout(timer);
      }
    }

    // Reset unauthorized toast state when user changes
    if (user) {
      setUnauthorizedToastShown(false);
    }
  }, [_hasHydrated, loading, hasStableState, stableStateTimeout, user]);

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
    const state = {
      _hasHydrated,
      loading,
      hasTokens: !!tokens?.accessToken,
      isAuthenticated,
      isAdmin,
      hasStableState,
    };

    // If not hydrated yet, don't decide
    if (!_hasHydrated) {
      return null;
    }

    // If loading, don't decide
    if (loading) {
      return null;
    }

    // Only make decisions if we have a stable state
    if (!hasStableState) {
      return null;
    }

    // If not authenticated and no tokens, redirect to login
    if (!isAuthenticated && !tokens?.accessToken) {
      return "login";
    }

    // If authenticated but no tokens, this is an inconsistent state - logout
    if (isAuthenticated && !tokens?.accessToken) {
      logout();
      return "login";
    }

    // If has tokens but not authenticated, this is also inconsistent - logout
    if (!isAuthenticated && tokens?.accessToken) {
      logout();
      return "login";
    }

    // If authenticated but not admin, redirect to unauthorized
    if (isAuthenticated && !isAdmin) {
      // Show toast notification for unauthorized access
      if (!unauthorizedToastShown) {
        toast.error("Access denied: You don't have permission to access the dashboard.");
        setUnauthorizedToastShown(true);
      }
      return "unauthorized";
    }

    // Otherwise, allow access
    return null;
  }, [_hasHydrated, loading, tokens, isAuthenticated, isAdmin, hasStableState]);

  // Debounce redirect decisions to prevent rapid changes
  useEffect(() => {
    // Don't redirect if we're still loading or don't have stable state
    if (loading || !hasStableState) {
      return;
    }

    if (shouldRedirect && shouldRedirect !== redirectDebounce) {
      const timer = setTimeout(() => {
        // Double check we're not loading and have stable state before redirecting
        if (!loading && hasStableState) {
          setRedirectDebounce(shouldRedirect);
        }
      }, 300); // Increased debounce time to 300ms

      return () => {
        clearTimeout(timer);
      };
    } else if (!shouldRedirect && redirectDebounce) {
      setRedirectDebounce(null);
    }
  }, [shouldRedirect, redirectDebounce, loading, hasStableState]);

  // Show loader while checking auth state OR while rehydrating
  if (loading || !_hasHydrated) {
    return <FullPageLoader />;
  }

  // Handle redirects based on the memoized decision
  if (redirectDebounce === "login") {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (redirectDebounce === "unauthorized") {
    return <Navigate to="/unauthorized" replace />;
  }

  // Render children if all checks pass (shouldRedirect is null)
  return <>{children}</>;
};

export default AdminProtectedRoute;
