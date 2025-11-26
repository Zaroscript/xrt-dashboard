import { useAuthStore } from '@/stores/auth/useAuthStore';

/**
 * Hook to check if the current user is a super admin
 * @returns boolean - true if user is 'super_admin', false otherwise
 */
export const useIsSuperAdmin = (): boolean => {
  const { user } = useAuthStore();
  return user?.role === 'super_admin';
};

/**
 * Hook to check if the current user has permission to modify data
 * @returns boolean - true if user is 'super_admin', false if 'moderator' or other
 */
export const useCanModify = (): boolean => {
  return useIsSuperAdmin();
};
