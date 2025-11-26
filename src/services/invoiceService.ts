import { apiClient } from './api/apiClient';
import type { Invoice } from "@/types/invoice.types";

export const getInvoices = async (filters: {
  status?: string;
  client?: string;
  startDate?: string;
  endDate?: string;
} = {}) => {
  const queryParams = new URLSearchParams();
  
  if (filters.status) queryParams.append('status', filters.status);
  if (filters.client) queryParams.append('client', filters.client);
  if (filters.startDate) queryParams.append('startDate', filters.startDate);
  if (filters.endDate) queryParams.append('endDate', filters.endDate);
  
  const queryString = queryParams.toString();
  const url = `/invoices${queryString ? `?${queryString}` : ''}`;
  
  const response = await apiClient.get(url);
  return response.data?.data?.invoices || response.data || [];
};

export const getInvoiceById = async (id: string) => {
  const response = await apiClient.get(`/invoices/${id}`);
  return response.data?.data?.invoice || response.data;
};

export const createInvoice = async (invoiceData: Partial<Invoice>) => {
  const response = await apiClient.post('/invoices', invoiceData);
  return response.data?.data?.invoice || response.data;
};

export const updateInvoice = async (id: string, invoiceData: Partial<Invoice>) => {
  const response = await apiClient.patch(`/invoices/${id}`, invoiceData);
  return response.data?.data?.invoice || response.data;
};

export const deleteInvoice = async (id: string) => {
  const response = await apiClient.delete(`/invoices/${id}`);
  return response.data;
};

export const sendInvoice = async (id: string) => {
  const response = await apiClient.post(`/invoices/${id}/send`);
  return response.data?.data?.invoice || response.data;
};

export const downloadInvoice = async (id: string) => {
  const response = await apiClient.get(`/invoices/${id}/download`, {
    responseType: 'blob',
  });
  return response.data;
};

