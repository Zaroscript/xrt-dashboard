import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth/useAuthStore";
import { adminService } from "@/services/api/adminService";
import {
  dashboardService,
  DashboardStats,
} from "@/services/api/dashboardService";

export const useDashboardLogic = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === "super_admin" || user?.role === "moderator";

  // Define default stats
  const defaultStats: DashboardStats = {
    totalUsers: 0,
    activeUsers: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    activePlans: 0,
    pendingTickets: 0,
    portfolioProjects: 0,
    totalClients: 0,
    totalTickets: 0,
    mostSubscribedPlans: [],
  };

  // Fetch dashboard stats
  const {
    data: stats = defaultStats,
    isLoading: isLoadingStats,
    error: statsError,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: dashboardService.getStats,
  });

  // Fetch recent activities
  const {
    data: recentActivities = [],
    isLoading: isLoadingActivities,
    refetch: refetchActivities,
  } = useQuery({
    queryKey: ["recentActivities"],
    queryFn: dashboardService.getRecentActivities,
  });

  // Fetch revenue data
  const {
    data: revenueChartData = [],
    isLoading: isLoadingRevenue,
    refetch: refetchRevenue,
  } = useQuery({
    queryKey: ["revenueData"],
    queryFn: dashboardService.getRevenueData,
  });

  // Fetch user growth data
  const {
    data: usersGrowthData = [],
    isLoading: isLoadingUsersGrowth,
    refetch: refetchUsersGrowth,
  } = useQuery({
    queryKey: ["usersGrowthData"],
    queryFn: dashboardService.getUsersGrowth,
  });

  // Fetch pending users (Admin only)
  const {
    data: pendingUsers = [],
    isLoading: isLoadingUsers,
    refetch: refetchPendingUsers,
  } = useQuery({
    queryKey: ["pendingUsers"],
    queryFn: adminService.getPendingUsers,
    enabled: isAdmin,
  });

  // Fetch pending service requests (Admin only)
  const {
    data: pendingServiceRequests = [],
    isLoading: isLoadingServiceRequests,
    refetch: refetchPendingServiceRequests,
  } = useQuery({
    queryKey: ["pendingServiceRequests"],
    queryFn: adminService.getPendingServiceRequests,
    enabled: isAdmin,
  });

  // Fetch pending plan requests (Admin only)
  const {
    data: pendingPlanRequests = [],
    isLoading: isLoadingPlanRequests,
    refetch: refetchPendingPlanRequests,
  } = useQuery({
    queryKey: ["pendingPlanRequests"],
    queryFn: adminService.getPendingPlanRequests,
    enabled: isAdmin,
  });

  // Export state
  const [exportOpen, setExportOpen] = useState(false);

  // Handle user approval
  const handleApproveUser = useCallback(
    async (userId: string) => {
      try {
        await adminService.approveUser(userId);

        // Refresh the pending data
        await Promise.all([
          refetchPendingUsers(),
          refetchPendingServiceRequests(),
          refetchPendingPlanRequests(),
          refetchStats(), // Also refresh stats as active users might change
        ]);

        return { success: true };
      } catch (err) {
        console.error("Approve error:", err);
        return {
          success: false,
          error: err instanceof Error ? err.message : "Failed to approve user",
        };
      }
    },
    [
      refetchPendingUsers,
      refetchPendingServiceRequests,
      refetchPendingPlanRequests,
      refetchStats,
    ]
  );

  // Handle user rejection
  const handleRejectUser = useCallback(
    async (userId: string) => {
      try {
        await adminService.rejectUser(userId);

        // Refresh the pending users list
        await refetchPendingUsers();

        return { success: true };
      } catch (err) {
        console.error("Reject error:", err);
        return {
          success: false,
          error: err instanceof Error ? err.message : "Failed to reject user",
        };
      }
    },
    [refetchPendingUsers]
  );

  // Loading state
  const isLoading =
    isLoadingStats ||
    isLoadingActivities ||
    isLoadingRevenue ||
    isLoadingUsersGrowth ||
    (isAdmin &&
      (isLoadingUsers || isLoadingServiceRequests || isLoadingPlanRequests));

  const error = statsError;

  // Refetch all data
  const refetch = () => {
    refetchStats();
    refetchActivities();
    refetchRevenue();
    refetchUsersGrowth();
    if (isAdmin) {
      refetchPendingUsers();
      refetchPendingServiceRequests();
      refetchPendingPlanRequests();
    }
  };

  return {
    // Data
    stats,
    recentActivities,
    revenueChartData,
    usersGrowthData,
    pendingUsers,
    pendingServiceRequests,
    pendingPlanRequests,
    isAdmin,
    isLoading,
    error,

    // State
    exportOpen,
    setExportOpen,

    // Handlers
    handleApproveUser,
    handleRejectUser,
    refetch,
  };
};
