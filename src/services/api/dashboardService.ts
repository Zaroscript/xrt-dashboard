import { apiClient } from './apiClient';

export interface DashboardStats {
  totalUsers: number;
  totalClients: number;
  totalRevenue: number;
  totalTickets: number;
}

export interface RevenueData {
  month: string;
  revenue: number;
  users: number;
}

export interface TicketsData {
  week: string;
  open: number;
  resolved: number;
}

export interface UsersGrowthData {
  month: string;
  users: number;
  clients: number;
}

export interface Activity {
  id: string;
  action: string;
  timestamp: string;
  userId: string;
  details?: string;
}

// Default data for when endpoints are not available
const defaultStats: DashboardStats = {
  totalUsers: 0,
  totalClients: 0,
  totalRevenue: 0,
  totalTickets: 0,
};

const defaultRevenueData: RevenueData[] = [];
const defaultTicketsData: TicketsData[] = [];
const defaultUsersGrowthData: UsersGrowthData[] = [];
const defaultActivities: Activity[] = [];

export const dashboardService = {
  // Get dashboard statistics
  getDashboardStats: async (): Promise<DashboardStats> => {
    try {
      const response = await apiClient.get('/dashboard/stats');
      const data = response.data?.data || response.data;
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid dashboard stats response format');
      }
      return data;
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      throw new Error(`Dashboard stats unavailable: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  // Get monthly revenue data
  getMonthlyRevenue: async (): Promise<RevenueData[]> => {
    try {
      const response = await apiClient.get('/admin/dashboard/monthly-revenue');
      const data = response.data?.data || response.data;
      if (!Array.isArray(data)) {
        throw new Error('Invalid revenue data response format');
      }
      return data;
    } catch (error) {
      console.error('Failed to fetch monthly revenue:', error);
      throw new Error(`Revenue data unavailable: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  // Get tickets statistics
  getTicketsStats: async (): Promise<TicketsData[]> => {
    try {
      const response = await apiClient.get('/admin/dashboard/tickets-stats');
      const data = response.data?.data || response.data;
      if (!Array.isArray(data)) {
        throw new Error('Invalid tickets data response format');
      }
      return data;
    } catch (error) {
      console.error('Failed to fetch tickets stats:', error);
      throw new Error(`Tickets data unavailable: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  // Get users growth data
  getUsersGrowth: async (): Promise<UsersGrowthData[]> => {
    try {
      const response = await apiClient.get('/admin/dashboard/users-growth');
      const data = response.data?.data || response.data;
      if (!Array.isArray(data)) {
        throw new Error('Invalid users growth data response format');
      }
      return data;
    } catch (error) {
      console.error('Failed to fetch users growth:', error);
      throw new Error(`Users growth data unavailable: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  // Get recent activities
  getRecentActivities: async (): Promise<Activity[]> => {
    try {
      const response = await apiClient.get('/dashboard/activities');
      const data = response.data?.data?.activities || response.data?.data || response.data;
      if (!Array.isArray(data)) {
        throw new Error('Invalid activities data response format');
      }
      return data;
    } catch (error) {
      console.error('Failed to fetch recent activities:', error);
      throw new Error(`Activities data unavailable: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
  
  // Get all dashboard data in a single request
  getAllDashboardData: async () => {
    try {
      const [
        stats,
        revenue,
        tickets,
        usersGrowth,
        activities,
        clients
      ] = await Promise.all([
        apiClient.get<{ data: DashboardStats }>('/dashboard/stats').then(res => {
          const data = res.data?.data || res.data;
          if (!data || typeof data !== 'object') {
            throw new Error('Invalid dashboard stats response format');
          }
          return data;
        }),
        apiClient.get('/admin/dashboard/monthly-revenue').then(res => {
          const data = res.data?.data || res.data;
          if (!Array.isArray(data)) {
            throw new Error('Invalid revenue data response format');
          }
          return data;
        }),
        apiClient.get('/admin/dashboard/tickets-stats').then(res => {
          const data = res.data?.data || res.data;
          if (!Array.isArray(data)) {
            throw new Error('Invalid tickets data response format');
          }
          return data;
        }),
        apiClient.get('/admin/dashboard/users-growth').then(res => {
          const data = res.data?.data || res.data;
          if (!Array.isArray(data)) {
            throw new Error('Invalid users growth data response format');
          }
          return data;
        }),
        apiClient.get('/dashboard/activities').then(res => {
          const data = res.data?.data?.activities || res.data?.data || res.data;
          if (!Array.isArray(data)) {
            throw new Error('Invalid activities data response format');
          }
          return data;
        }),
        apiClient.get('/clients').then(res => {
          const data = res.data?.data?.clients || res.data?.data || res.data;
          if (!Array.isArray(data)) {
            throw new Error('Invalid clients data response format');
          }
          return data;
        })
      ]);
      
      return {
        stats,
        revenue,
        tickets,
        usersGrowth,
        activities,
        clients
      };
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw new Error(`Dashboard data unavailable: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};

export default dashboardService;
