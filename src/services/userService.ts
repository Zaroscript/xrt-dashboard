import { apiClient } from './api/apiClient';

export interface User {
  _id: string;
  fName: string;
  lName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  companyName?: string;
}

// Get all users (admin/moderators only for invoice assignment)
export const getUsers = async (): Promise<User[]> => {
  try {
    // Try to get admin users/moderators first
    try {
      const response = await apiClient.get('/admin/users/moderators');
      return response.data?.data?.moderators || response.data || [];
    } catch (adminError) {
      // Fallback: try getting current user if admin endpoint fails
      console.warn('Could not fetch admin users, using fallback');
      const response = await apiClient.get('/auth/me');
      const currentUser = response.data?.data?.user || response.data;
      return currentUser ? [currentUser] : [];
    }
  } catch (error) {
    console.error('Error fetching users:', error);
    return []; // Return empty array instead of throwing
  }
};

export const getUser = async (id: string): Promise<User> => {
  try {
    const response = await apiClient.get(`/users/${id}`);
    return response.data?.data?.user || response.data;
  } catch (error) {
    console.error(`Error fetching user ${id}:`, error);
    throw error;
  }
};

