import { apiClient } from './apiClient';
import { Service } from '@/types/service.types';

export const servicesApi = {
  // Get all services
  getServices: async (): Promise<Service[]> => {
    try {
      console.log('Fetching services...');
      const response = await apiClient.get('/services');
      return response.data.data?.services || response.data.data || response.data;
    } catch (error) {
      console.error('Error in getServices:', error);
      throw error;
    }
  },

  // Get a single service by ID
  getService: async (id: string): Promise<Service> => {
    try {
      console.log(`Fetching service ${id}...`);
      const response = await apiClient.get(`/services/${id}`);
      return response.data.data?.service || response.data.data || response.data;
    } catch (error) {
      console.error(`Error fetching service ${id}:`, error);
      throw error;
    }
  },

  // Create a new service
  createService: async (serviceData: Omit<Service, '_id' | 'createdAt' | 'updatedAt'>): Promise<Service> => {
    try {
      console.log('Creating new service...');
      const response = await apiClient.post('/admin/services', serviceData);
      return response.data.data?.service || response.data.data || response.data;
    } catch (error) {
      console.error('Error creating service:', error);
      throw error;
    }
  },

  // Update an existing service
  updateService: async (id: string, updates: Partial<Service>): Promise<Service> => {
    try {
      console.log(`Updating service ${id}...`);
      const response = await apiClient.patch(`/admin/services/${id}`, updates);
      return response.data.data?.service || response.data.data || response.data;
    } catch (error) {
      console.error(`Error updating service ${id}:`, error);
      throw error;
    }
  },

  // Delete a service
  deleteService: async (id: string): Promise<void> => {
    try {
      console.log(`Deleting service ${id}...`);
      await apiClient.delete(`/admin/services/${id}`);
    } catch (error) {
      console.error(`Error deleting service ${id}:`, error);
      throw error;
    }
  },

  // Toggle service status
  toggleServiceStatus: async (id: string): Promise<Service> => {
    try {
      console.log(`Toggling status for service ${id}...`);
      const response = await apiClient.patch(`/admin/services/${id}/toggle-status`);
      return response.data.data?.service || response.data.data || response.data;
    } catch (error) {
      console.error(`Error toggling status for service ${id}:`, error);
      throw error;
    }
  },
};

export default servicesApi;

