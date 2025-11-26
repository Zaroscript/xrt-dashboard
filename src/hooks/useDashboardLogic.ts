import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth/useAuthStore';
import type { Stats } from '../utils/exportUtils';
import { adminService } from '@/services/api/adminService';

export const useDashboardLogic = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'super_admin' || user?.role === 'moderator';

  // Define default stats that match the Stats interface
  const defaultStats: Stats = {
    totalUsers: 0,
    activeUsers: 0,
    totalRevenue: 0,
    activeSubscriptions: 0,
    pendingTickets: 0,
    portfolioProjects: 0
  };

  // Fetch pending users
  const {
    data: pendingUsers = [],
    isLoading: isLoadingUsers,
    refetch: refetchPendingUsers,
  } = useQuery({
    queryKey: ['pendingUsers'],
    queryFn: adminService.getPendingUsers,
    enabled: isAdmin,
  });

  // Fetch pending service requests
  const {
    data: pendingServiceRequests = [],
    isLoading: isLoadingServiceRequests,
    refetch: refetchPendingServiceRequests,
  } = useQuery({
    queryKey: ['pendingServiceRequests'],
    queryFn: adminService.getPendingServiceRequests,
    enabled: isAdmin,
  });

  // Fetch pending plan requests
  const {
    data: pendingPlanRequests = [],
    isLoading: isLoadingPlanRequests,
    refetch: refetchPendingPlanRequests,
  } = useQuery({
    queryKey: ['pendingPlanRequests'],
    queryFn: adminService.getPendingPlanRequests,
    enabled: isAdmin,
  });

  // Fetch dashboard data (placeholder)
  const localStats = defaultStats;
  const recentActivities: any[] = [];
  const loading = false;
  
  // Admin dashboard data (placeholder)
  const adminStats = defaultStats;
  const revenueChartData: any[] = [];
  const isLoadingAdminData = false;

  // Export state
  const [exportOpen, setExportOpen] = useState(false);

  // Handle user approval
  const handleApproveUser = useCallback(async (userId: string) => {
    try {
      await adminService.approveUser(userId);
      
      // Refresh the pending data
      await Promise.all([
        refetchPendingUsers(),
        refetchPendingServiceRequests(),
        refetchPendingPlanRequests()
      ]);
      
      return { success: true };
    } catch (err) {
      console.error('Approve error:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to approve user' 
      };
    }
  }, [refetchPendingUsers, refetchPendingServiceRequests, refetchPendingPlanRequests]);

  // Handle user rejection
  const handleRejectUser = useCallback(async (userId: string) => {
    try {
      await adminService.rejectUser(userId);
      
      // Refresh the pending users list
      await refetchPendingUsers();
      
      return { success: true };
    } catch (err) {
      console.error('Reject error:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to reject user' 
      };
    }
  }, [refetchPendingUsers]);

  // Loading state
  const isLoading = loading || (isAdmin && (
    isLoadingAdminData ||
    isLoadingUsers ||
    isLoadingServiceRequests ||
    isLoadingPlanRequests
  ));

  // Ensure stats always has all required fields with default values
  const stats: Stats = { ...defaultStats, ...(localStats || adminStats) };

  return {
    // Data
    stats,
    recentActivities,
    revenueChartData,
    pendingUsers,
    pendingServiceRequests,
    pendingPlanRequests,
    isAdmin,
    isLoading,
    isLoadingAdminData,
    
    // State
    exportOpen,
    setExportOpen,
    
    // Handlers
    handleApproveUser,
    handleRejectUser,
  };
};