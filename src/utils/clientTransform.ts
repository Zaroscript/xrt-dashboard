import { Client as ApiClient } from '../services/api/clientsService';
import { Client as AppClient, ClientStatus } from '../types/client.types';

export const mapApiClientToClient = (apiClient: ApiClient): AppClient => {
  // Create a properly typed address object with all required fields
  const address = {
    street: apiClient.address?.street || '',
    city: apiClient.address?.city || '',
    state: apiClient.address?.state || '',
    zipCode: apiClient.address?.zipCode || apiClient.address?.postalCode || '',
    postalCode: apiClient.address?.postalCode || apiClient.address?.zipCode || '',
    country: apiClient.address?.country || ''
  };

  return {
    // Core client information
    _id: apiClient._id,
    
    // User information
    user: typeof apiClient.user === 'string' ? {
      _id: apiClient.user,
      fName: '',
      lName: '',
      email: '',
      phone: ''
    } : {
      _id: apiClient.user._id,
      fName: apiClient.user.fName,
      lName: apiClient.user.lName,
      email: apiClient.user.email,
      phone: apiClient.user.phone || ''
    },
    
    // Business information
    companyName: apiClient.companyName || '',
    name: typeof apiClient.user === 'string' ? apiClient.user : `${apiClient.user.fName} ${apiClient.user.lName}`,
    email: typeof apiClient.user === 'string' ? '' : apiClient.user.email,
    phone: typeof apiClient.user === 'string' ? '' : (apiClient.user.phone || ''),
    phoneNumber: typeof apiClient.user === 'string' ? '' : (apiClient.user.phone || ''),
    company: apiClient.companyName || '',
    website: apiClient.oldWebsite || '',
    address,
    isClient: true,
    isActive: true,
    status: 'active' as ClientStatus,
    lastActive: new Date().toISOString(),
    createdAt: new Date(apiClient.createdAt || Date.now()).toISOString(),
    updatedAt: new Date(apiClient.updatedAt || Date.now()).toISOString(),
    revenue: 0,
    currentPlan: apiClient.subscription?.plan || '',
    services: [],
    businessLocation: apiClient.businessLocation || '',
    // Map subscription data if available
    ...(apiClient.subscription && {
      subscription: {
        plan: apiClient.subscription.plan,
        status: apiClient.subscription.status as 'active' | 'cancelled' | 'expired' | 'pending',
        startDate: apiClient.subscription.startDate || '',
        expiresAt: apiClient.subscription.expiresAt || '',
        amount: apiClient.subscription.amount || 0,
        paymentMethod: apiClient.subscription.paymentMethod || '',
        lastBillingDate: apiClient.subscription.lastBillingDate || '',
        nextBillingDate: apiClient.subscription.nextBillingDate || '',
        trialEndsAt: apiClient.subscription.trialEndsAt || '',
      },
    }),
  };
};
