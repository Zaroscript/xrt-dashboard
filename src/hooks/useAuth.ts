import { useEffect, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth/useAuthStore";
import authService, { type LoginResponse } from "@/services/api/authService";
import type { User } from "@/stores/types";

// List of admin roles that can access admin routes
const ADMIN_ROLES = ["super_admin", "admin", "moderator"];

// Check if user has admin privileges
const hasAdminRole = (role?: string) => {
  return role ? ADMIN_ROLES.includes(role.toLowerCase()) : false;
};

export const useAuth = (requireAuth = true, requireAdmin = false) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();

  // Get auth state from Zustand store
  const {
    isAuthenticated,
    user,
    tokens,
    setAuth,
    logout: logoutFromStore,
    setLoading,
    setError: setAuthError,
  } = useAuthStore();

  // Fetch current user data
  const {
    data: meData,
    error: meError,
    isLoading: isMeLoading,
    refetch: refetchUser,
  } = useQuery<{
    user: User;
    clientProfile?: any;
  }>({
    queryKey: ["me"],
    queryFn: () => authService.getMe(),
    enabled: !!tokens?.accessToken,
    retry: 1,
  });

  // Update auth state when user data is fetched
  useEffect(() => {
    if (meData) {
      // If we are strictly updating user data from getMe, we might not get new tokens.
      // Use existing tokens if available.
      setAuth(meData.user, tokens || { accessToken: "" });
    }
  }, [meData, setAuth]);

  // Handle errors
  useEffect(() => {
    if (meError) {
      console.error("Failed to fetch user:", meError);
      setAuthError("Failed to fetch user data");
    }
  }, [meError, setAuthError]);

  // Memoize loading state
  const isLoading = useMemo(() => isMeLoading, [isMeLoading]);

  // Check if user is authenticated
  const checkAuth = useCallback(async () => {
    if (!tokens?.accessToken) {
      setLoading(false);
      return false;
    }

    try {
      // If we have user data, we're authenticated
      if (meData) {
        return true;
      }

      // If we have an error, we're not authenticated
      if (meError) {
        console.error("Auth check failed:", meError);
        return false;
      }

      // If we don't have user data but have a token, try to fetch it
      const userData = await refetchUser();
      return !!userData.data;
    } finally {
      setLoading(false);
    }
  }, [tokens, meData, meError]);

  // Handle auth state changes
  useEffect(() => {
    const verifyAuth = async () => {
      const isAuth = await checkAuth();
      const isAdmin = hasAdminRole(user?.role);

      // Redirect to login if not authenticated and not already on login page
      if (!isAuth && location.pathname !== "/login") {
        navigate("/login", {
          state: {
            from: location,
            message: "Please log in to continue",
          },
        });
      }

      // Redirect to dashboard if already authenticated and on login page
      if (isAuth && location.pathname === "/login") {
        const from = (location.state as any)?.from?.pathname || "/dashboard";
        navigate(from, { replace: true });
      }
    };

    verifyAuth();
  }, [checkAuth, location, navigate]);

  // Handle logout
  const logout = useCallback(async () => {
    try {
      setLoading(true);
      await authService.logout();
      logoutFromStore();
      queryClient.clear();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
      setAuthError("Failed to log out. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [logoutFromStore, queryClient, setAuthError, setLoading, navigate]);

  // Memoize admin status
  const isAdmin = useMemo(() => hasAdminRole(user?.role), [user?.role]);

  // Handle route protection
  useEffect(() => {
    if (isLoading) return;

    if (requireAuth && !isAuthenticated) {
      // Only redirect if not already on login page
      if (location.pathname !== "/login") {
        navigate("/login", {
          state: { from: location },
          replace: true,
        });
      }
    } else if (requireAdmin && isAuthenticated && !isAdmin) {
      // Redirect to dashboard if user is not an admin but admin access is required
      navigate("/dashboard", { replace: true });
      toast.error("You do not have permission to access this page.");
    }
  }, [
    isAuthenticated,
    isLoading,
    isAdmin,
    requireAuth,
    requireAdmin,
    navigate,
    location,
  ]);

  return {
    isAuthenticated,
    user,
    tokens,
    isAdmin,
    isLoading,
    error: meError
      ? new Error(
          meError instanceof Error ? meError.message : "Authentication error"
        )
      : null,
    logout,
    checkAuth,
    hasAdminRole,
  };
};

export const useAdmin = () => {
  const { user, isAdmin } = useAuth(true);
  return {
    isAdmin,
    hasAdminRole,
  };
};
