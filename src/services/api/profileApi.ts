import { apiClient } from './apiClient';

export const profileApi = {
  updateProfile: async (data: { fName?: string; lName?: string; email?: string }) => {
    const response = await apiClient.patch('/auth/update-details', data);
    return response.data.data.user;
  },

  updatePassword: async (data: { currentPassword: string; newPassword: string }) => {
    const response = await apiClient.patch('/auth/update-password', data);
    return response.data;
  }
};
