import { apiClient } from './api/apiClient';

export interface Client {
  _id: string;
  companyName: string;
  email: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
}

export const getClients = async (): Promise<Client[]> => {
  try {
    const response = await apiClient.get('/clients');
    return response.data?.data?.clients || response.data || [];
  } catch (error) {
    console.error('Error fetching clients:', error);
    throw error;
  }
};

export const getClient = async (id: string): Promise<Client> => {
  try {
    const response = await apiClient.get(`/clients/${id}`);
    return response.data?.data?.client || response.data;
  } catch (error) {
    console.error(`Error fetching client ${id}:`, error);
    throw error;
  }
};
