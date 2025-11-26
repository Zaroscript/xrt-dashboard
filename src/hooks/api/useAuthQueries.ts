import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/services/api/authService';
import { useAuthStore } from '@/stores/auth/useAuthStore';

export const useLogin = () => {
  const queryClient = useQueryClient();
  const { setAuth } = useAuthStore();

  return useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      setAuth(data.data.user, data.data.tokens);
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
};

export const useRegister = () => {
  const queryClient = useQueryClient();
  const { setAuth } = useAuthStore();

  return useMutation({
    mutationFn: authService.login, // Using login for now since register doesn't exist
    onSuccess: (data: any) => {
      setAuth(data.data.user, data.data.tokens);
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  const { logout } = useAuthStore();

  return useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      logout();
      queryClient.clear();
    },
  });
};

export const useGetMe = () => {
  const { tokens, setAuth } = useAuthStore();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      if (!tokens?.accessToken) {
        throw new Error('No access token');
      }
      const data = await authService.getMe();
      if (data) {
        setAuth(data.user, data.tokens);
      }
      return data;
    },
    enabled: !!tokens?.accessToken,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useRefreshToken = () => {
  const { tokens, setAuth } = useAuthStore();

  return useMutation({
    mutationFn: () => {
      if (!tokens?.refreshToken) {
        throw new Error('No refresh token');
      }
      return authService.refreshToken(tokens.refreshToken);
    },
    onSuccess: (data) => {
      setAuth(useAuthStore.getState().user, data);
    },
  });
};

// Password reset functions not implemented yet
// export const useRequestPasswordReset = () => {
//   return useMutation({
//     mutationFn: authService.requestPasswordReset,
//   });
// };

// export const useResetPassword = () => {
//   return useMutation({
//     mutationFn: ({ token, password }: { token: string; password: string }) =>
//       authService.resetPassword(token, password),
//   });
// };
