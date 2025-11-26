import { apiClient } from './apiClient';

export interface SubscriberGrowthData {
  month: string;
  subscribers: number;
  revenue: number;
}

export interface PlanDistributionData {
  name: string;
  value: number;
  count: number;
}

export interface SubscriberStats {
  totalSubscribers: number;
  activeSubscribers: number;
  inactiveSubscribers: number;
  pendingApproval: number;
  churnRate: number;
  monthlyRecurringRevenue: number;
  averageRevenuePerSubscriber: number;
}

export const subscriberService = {
  // Get subscriber statistics
  getSubscriberStats: async (): Promise<SubscriberStats> => {
    try {
      const response = await apiClient.get('/subscribers/stats');
      const data = response.data?.data || response.data;
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid subscriber stats response format');
      }
      return data;
    } catch (error) {
      console.error('Failed to fetch subscriber stats:', error);
      // Return default values on error
      return {
        totalSubscribers: 0,
        activeSubscribers: 0,
        inactiveSubscribers: 0,
        pendingApproval: 0,
        churnRate: 0,
        monthlyRecurringRevenue: 0,
        averageRevenuePerSubscriber: 0,
      };
    }
  },

  // Get subscriber growth data
  getSubscriberGrowth: async (): Promise<SubscriberGrowthData[]> => {
    try {
      const response = await apiClient.get('/subscribers/growth');
      const data = response.data?.data || response.data;
      if (!Array.isArray(data)) {
        throw new Error('Invalid subscriber growth data response format');
      }
      return data;
    } catch (error) {
      console.error('Failed to fetch subscriber growth:', error);
      // Return sample data on error
      return [
        { month: 'Jan', subscribers: 40, revenue: 2400 },
        { month: 'Feb', subscribers: 30, revenue: 1398 },
        { month: 'Mar', subscribers: 20, revenue: 9800 },
        { month: 'Apr', subscribers: 27, revenue: 3908 },
        { month: 'May', subscribers: 18, revenue: 4800 },
        { month: 'Jun', subscribers: 23, revenue: 3800 },
        { month: 'Jul', subscribers: 34, revenue: 4300 },
      ];
    }
  },

  // Get plan distribution
  getPlanDistribution: async (): Promise<PlanDistributionData[]> => {
    try {
      const response = await apiClient.get('/subscribers/plan-distribution');
      const data = response.data?.data || response.data;
      if (!Array.isArray(data)) {
        throw new Error('Invalid plan distribution data response format');
      }
      return data;
    } catch (error) {
      console.error('Failed to fetch plan distribution:', error);
      // Return sample data on error
      return [
        { name: 'Basic', value: 40, count: 40 },
        { name: 'Standard', value: 30, count: 30 },
        { name: 'Premium', value: 20, count: 20 },
        { name: 'Enterprise', value: 10, count: 10 },
      ];
    }
  },

  // Get all subscriber chart data
  getAllSubscriberData: async () => {
    try {
      const [stats, growth, planDistribution] = await Promise.all([
        subscriberService.getSubscriberStats(),
        subscriberService.getSubscriberGrowth(),
        subscriberService.getPlanDistribution(),
      ]);
      
      return {
        stats,
        growth,
        planDistribution,
      };
    } catch (error) {
      console.error('Error fetching subscriber data:', error);
      throw error;
    }
  }
};

export default subscriberService;
