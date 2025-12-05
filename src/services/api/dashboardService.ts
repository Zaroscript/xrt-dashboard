import { apiClient } from "./apiClient";

export interface DashboardStats {
  totalUsers: number;
  totalClients: number;
  totalRevenue: number;
  monthlyRevenue: number;
  totalTickets: number;
  activeUsers: number;
  activePlans: number;
  pendingTickets: number;
  portfolioProjects: number;
  mostSubscribedPlans: {
    name: string;
    price: number;
    count: number;
    monthlyRevenue: number;
  }[];
}

export interface Activity {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  user: string;
}

export interface TicketStat {
  week: string;
  open: number;
  resolved: number;
  total: number;
}

export interface UserGrowthData {
  month: string;
  subscribers: number;
  clients: number;
}

export interface RevenueData {
  month: string;
  revenue: number;
  clients: number;
}

export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await apiClient.get("/dashboard/stats");
    return response.data.data;
  },

  getRecentActivities: async (): Promise<Activity[]> => {
    const response = await apiClient.get("/dashboard/activities");
    return response.data.data;
  },

  getTicketsStats: async (): Promise<TicketStat[]> => {
    const response = await apiClient.get("/dashboard/tickets");
    return response.data;
  },

  getUsersGrowth: async (): Promise<UserGrowthData[]> => {
    const response = await apiClient.get("/dashboard/users-growth");
    return response.data;
  },

  getRevenueData: async (): Promise<RevenueData[]> => {
    const response = await apiClient.get("/dashboard/revenue");
    return response.data;
  },
};
