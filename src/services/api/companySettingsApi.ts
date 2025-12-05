import { apiClient } from './apiClient';

export interface CompanySettings {
  _id?: string;
  companyName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  email: string;
  phone: string;
  taxId: string;
  website: string;
  logo: string;
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  currency: string;
  createdAt?: string;
  updatedAt?: string;
}

export const companySettingsApi = {
  // Get company settings
  getSettings: async (): Promise<CompanySettings> => {
    const response = await apiClient.get('/admin/company-settings');
    return response.data?.data?.settings || response.data?.settings || response.data;
  },

  // Update company settings
  updateSettings: async (settings: Partial<CompanySettings>): Promise<CompanySettings> => {
    const response = await apiClient.put('/admin/company-settings', settings);
    return response.data?.data?.settings || response.data?.settings || response.data;
  },

  // Upload company logo
  uploadLogo: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('logo', file);

    const response = await apiClient.post('/admin/company-settings/logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return response.data?.data?.logo || response.data?.logo || '';
  },

  // Delete company logo
  deleteLogo: async (): Promise<void> => {
    await apiClient.delete('/admin/company-settings/logo');
  },
};

