import { apiClient } from './apiClient';
import type { Plan } from '@/types/plan';

export const plansService = {
  // Get all plans for admin (includes inactive plans)
  getPlans: async (): Promise<Plan[]> => {
    const response = await apiClient.get('/admin/plans');
    return response.data.data?.plans || response.data || [];
  },

  // Get all plans for public (only active plans)
  getPublicPlans: async (): Promise<Plan[]> => {
    const response = await apiClient.get('/plans');
    return response.data.data?.plans || response.data || [];
  },

  // Get a single plan by ID
  getPlan: async (id: string): Promise<Plan> => {
    const response = await apiClient.get(`/plans/${id}`);
    return response.data.data?.plan || response.data;
  },

  // Create a new plan (admin only)
  createPlan: async (planData: Omit<Plan, '_id'>): Promise<Plan> => {
    const response = await apiClient.post('/admin/plans', planData);
    return response.data.data?.plan || response.data;
  },

  // Update a plan (admin only)
  updatePlan: async (id: string, planData: Partial<Plan>): Promise<Plan> => {
    const response = await apiClient.patch(`/admin/plans/${id}`, planData);
    const updatedPlan = response.data.data?.plan || response.data;
    return updatedPlan;
  },

  // Delete a plan (admin only)
  deletePlan: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/plans/${id}`);
  },

  // Toggle plan status (admin only)
  togglePlanStatus: async (id: string): Promise<Plan> => {
    const response = await apiClient.patch(`/admin/plans/${id}/toggle-status`);
    return response.data.data?.plan || response.data;
  },

  // Get featured plans
  getFeaturedPlans: async (): Promise<Plan[]> => {
    const response = await apiClient.get('/plans/featured');
    return response.data.data?.plans || response.data || [];
  }
};

export default plansService;
