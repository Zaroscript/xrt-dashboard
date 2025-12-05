import { useAuthStore } from '@/stores/auth/useAuthStore';

/**
 * Check if the current user is a super admin
 * @returns true if user has super admin powers
 */
export const useIsSuperAdmin = (): boolean => {
  const { user } = useAuthStore();
  return user?.role === 'super_admin';
};

/**
 * Check if the current user can modify stuff
 * Only super admins can modify data, moderators can't
 * @returns true if user can make changes
 */
export const useCanModify = (): boolean => {
  return useIsSuperAdmin();
};
