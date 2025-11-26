import { useUser as useAuthUser, useIsAuthenticated, useAuthLoading } from '@/stores';

export const useUser = () => {
  const user = useAuthUser();
  const isAuthenticated = useIsAuthenticated();
  const isLoading = useAuthLoading();

  return {
    user,
    isAuthenticated,
    isLoading,
    isAdmin: user?.role === 'admin',
    isModerator: user?.role === 'moderator',
    isClient: user?.role === 'client',
  };
};
