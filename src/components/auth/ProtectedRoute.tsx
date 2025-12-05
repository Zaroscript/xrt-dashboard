import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useMemo, useCallback, useState } from 'react';
import { FullPageLoader } from '../ui/loading-spinner';
import { useAuthStore } from '../../stores/auth/useAuthStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[];
  requiredPermissions?: string[];
}

const ProtectedRoute = ({ 
  children, 
  roles = ['super_admin', 'admin', 'moderator'],
  requiredPermissions = []
}: ProtectedRouteProps) => {
  const location = useLocation();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
  // Get auth state from Zustand store including rehydration status
  const { isAuthenticated, loading: isLoading, user, _hasHydrated } = useAuthStore();

  // Check if user has required role
  const hasRequiredRole = useMemo(() => {
    if (!user?.role) return false;
    return roles.length === 0 || roles.includes(user.role);
  }, [user?.role, roles]);

  // Check if user has required permissions
  const hasRequiredPermissions = useMemo(() => {
    if (requiredPermissions.length === 0) return true;
    if (!user || !user.permissions) return false;
    return requiredPermissions.some(permission => user.permissions.includes(permission));
  }, [user, requiredPermissions]);

  // Determine if we should show loading or redirect
  const shouldShowLoader = !_hasHydrated || isLoading || isCheckingAuth;
  const shouldRedirectToLogin = _hasHydrated && !isLoading && !isCheckingAuth && !isAuthenticated;
  const shouldRedirectToUnauthorized = _hasHydrated && !isLoading && !isCheckingAuth && isAuthenticated && (!hasRequiredRole || !hasRequiredPermissions);

  // Render content based on auth state
  const getContent = () => {
    if (shouldShowLoader) {
      return <FullPageLoader />;
    }
    
    if (shouldRedirectToLogin) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
    
    if (shouldRedirectToUnauthorized) {
      return <Navigate to="/unauthorized" replace />;
    }
    
    return <>{children}</>;
  };

  // Wait for hydration and initial auth check
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsCheckingAuth(false);
    }, 300); // Slightly longer delay to ensure hydration completes
    
    return () => clearTimeout(timer);
  }, []);

  // Additional check for hydration completion
  useEffect(() => {
    if (_hasHydrated && !isLoading) {
      setIsCheckingAuth(false);
    }
  }, [_hasHydrated, isLoading]);

  // Debug logging
  useEffect(() => {
    // Debug auth state
  }, [isAuthenticated, isLoading, isCheckingAuth, user, hasRequiredRole, hasRequiredPermissions, location.pathname, _hasHydrated]);

  return getContent();
};

export default ProtectedRoute;
