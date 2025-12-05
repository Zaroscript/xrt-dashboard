import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth/useAuthStore";
import { dashboardService } from "@/services/api/dashboardService";
import { AxiosError } from "axios";

export interface Activity {
  id: string;
  action: string;
  timestamp: string;
  userId: string;
  details?: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalClients: number;
  totalRevenue: number;
  totalTickets: number;
  activeUsers?: number;
  activePlans?: number;
  pendingTickets?: number;
  activeClients?: number;
  trialClients?: number;
  premiumClients?: number;
}

export interface RevenueData {
  month: string;
  revenue: number;
  users: number;
}

export interface UsersGrowthData {
  month: string;
  users: number;
  clients: number;
}

interface Client {
  id: string;
  name: string;
  email: string;
  // Add other client properties as needed
}

interface DashboardData {
  stats: DashboardStats;
  revenue: RevenueData[];
  usersGrowth: UsersGrowthData[];
  activities: Activity[];
  clients: Client[];
}

interface UseDashboardOptions {
  includeAdminData?: boolean;
}

// No default data generation needed

export const useDashboard = ({
  includeAdminData = false,
}: UseDashboardOptions = {}) => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === "super_admin" || user?.role === "moderator";

  // Fetch all dashboard data in a single query
  const defaultData: DashboardData = {
    stats: {
      totalUsers: 0,
      totalClients: 0,
      totalRevenue: 0,
      totalTickets: 0,
    },
    revenue: [],
    usersGrowth: [],
    activities: [],
    clients: [],
  };

  const {
    data: dashboardData = defaultData,
    isLoading,
    error,
    refetch,
  } = useQuery<DashboardData, AxiosError>({
    queryKey: ["dashboard", "all"],
    queryFn: async () => {
      try {
        const data = await dashboardService.getAllDashboardData();
        return data as DashboardData;
      } catch (error) {
        if (error instanceof AxiosError) {
          console.error("API Error:", error.response?.data || error.message);
          throw new Error(
            error.response?.data?.message ||
              "Failed to fetch dashboard data. Please try again."
          );
        }
        throw error;
      }
    },
    enabled: !!user, // Changed from user?.token to just user
    refetchOnWindowFocus: false,
    retry: 1,
    staleTime: 5000, // 5 seconds
    refetchInterval: 5000, // Poll every 5 seconds
  });

  // Destructure the data directly from the API response
  // No default values - we want to use only what comes from the API
  const {
    stats,
    revenue = [],
    usersGrowth = [],
    activities = [],
    clients = [],
  } = dashboardData || {};

  // Format data for charts with optional chaining to prevent undefined errors
  const chartData = {
    revenue: {
      labels: revenue?.map((item) => item.month) ?? [],
      datasets: [
        {
          label: "Revenue",
          data: revenue?.map((item) => item.revenue) ?? [],
          borderColor: "#7c3aed",
          backgroundColor: "rgba(124, 58, 237, 0.1)",
          tension: 0.3,
          yAxisID: "y",
        },
        {
          label: "Users",
          data: revenue?.map((item) => item.users * 100) ?? [],
          borderColor: "#10b981",
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          tension: 0.3,
          yAxisID: "y1",
        },
      ],
    },

    usersGrowth: {
      labels: usersGrowth?.map((item) => item.month) ?? [],
      datasets: [
        {
          label: "New Users",
          data: usersGrowth?.map((item) => item.users) ?? [],
          borderColor: "#3b82f6",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          tension: 0.3,
        },
        {
          label: "New Clients",
          data: usersGrowth?.map((item) => item.clients) ?? [],
          borderColor: "#8b5cf6",
          backgroundColor: "rgba(139, 92, 246, 0.1)",
          tension: 0.3,
        },
      ],
    },
  };

  return {
    // Core data
    stats,
    revenue,
    usersGrowth,
    activities,
    clients,

    // Formatted chart data
    chartData,

    // Loading and error states
    isLoading,
    error,

    // Refresh function
    refetch,

    // User info
    isAdmin,
    user,
  };
};

export default useDashboard;
