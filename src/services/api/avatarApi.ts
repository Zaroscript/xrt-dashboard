import { apiClient } from './apiClient';

// Upload avatar for current user
export const uploadMyAvatar = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('avatar', file);

  const response = await apiClient.post('/auth/me/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });

  return response.data.data.avatar;
};

// Upload avatar for a specific user (admin only)
export const uploadUserAvatar = async (userId: string, file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('avatar', file);

  const response = await apiClient.post(`/auth/users/${userId}/avatar`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });

  return response.data.data.avatar;
};

// Delete avatar for current user
export const deleteMyAvatar = async (): Promise<void> => {
  await apiClient.delete('/auth/me/avatar');
};

// Delete avatar for a specific user (admin only)
export const deleteUserAvatar = async (userId: string): Promise<void> => {
  await apiClient.delete(`/auth/users/${userId}/avatar`);
};