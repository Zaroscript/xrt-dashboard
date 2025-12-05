import { useAuthStore } from '@/stores/auth/useAuthStore';

/**
 * Debug utility to check current authentication state and permissions
 */
export const debugAuthState = () => {
  const authStore = useAuthStore.getState();
  
  console.log('=== AUTH DEBUG INFO ===');
  console.log('User:', authStore.user);
  console.log('Is Authenticated:', authStore.isAuthenticated);
  console.log('User Role:', authStore.user?.role);
  console.log('Tokens:', authStore.tokens ? 'Present' : 'Missing');
  console.log('Access Token:', authStore.tokens?.accessToken ? 'Present' : 'Missing');
  
  if (authStore.tokens?.accessToken) {
    try {
      // Decode JWT to check token contents
      const tokenData = JSON.parse(atob(authStore.tokens.accessToken.split('.')[1]));
      console.log('Token Data:', tokenData);
      console.log('Token Expires:', new Date(tokenData.exp * 1000).toLocaleString());
      console.log('Token Expired:', Date.now() > tokenData.exp * 1000);
    } catch (error) {
      console.error('Error decoding token:', error);
    }
  }
  
  console.log('Can Access Admin:', authStore.user?.role === 'super_admin');
  console.log('===================');
  
  return {
    user: authStore.user,
    isAuthenticated: authStore.isAuthenticated,
    role: authStore.user?.role,
    canAccessAdmin: authStore.user?.role === 'super_admin',
    hasValidToken: !!authStore.tokens?.accessToken
  };
};

/**
 * Check if current user can access admin endpoints
 */
export const canAccessAdmin = () => {
  const authStore = useAuthStore.getState();
  return authStore.user?.role === 'super_admin' && authStore.isAuthenticated;
};
