import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Invoice } from '../types';
import { STORE_VERSIONS } from '../types';
import { apiClient } from '@/services/api/apiClient';

interface InvoicesState {
  invoices: Invoice[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
  statusFilter: 'all' | 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  dateFilter: {
    startDate?: Date;
    endDate?: Date;
  };
  selectedInvoice: Invoice | null;
}

interface InvoicesActions {
  // State management
  setInvoices: (invoices: Invoice[]) => void;
  addInvoice: (invoice: Invoice) => void;
  updateInvoice: (id: string, updates: Partial<Invoice>) => void;
  removeInvoice: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setSearchTerm: (term: string) => void;
  setStatusFilter: (filter: 'all' | 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled') => void;
  setDateFilter: (filter: { startDate?: Date; endDate?: Date }) => void;
  setSelectedInvoice: (invoice: Invoice | null) => void;
  
  // API actions
  fetchInvoices: () => Promise<void>;
  fetchInvoice: (id: string) => Promise<Invoice>;
  createInvoice: (invoiceData: Omit<Invoice, '_id' | 'invoiceNumber' | 'createdAt' | 'updatedAt'>) => Promise<Invoice>;
  updateInvoiceApi: (id: string, updates: Partial<Invoice>) => Promise<Invoice>;
  deleteInvoice: (id: string) => Promise<void>;
  
  // Invoice operations
  sendInvoice: (id: string) => Promise<void>;
  markAsPaid: (id: string) => Promise<void>;
  markAsOverdue: (id: string) => Promise<void>;
  cancelInvoice: (id: string) => Promise<void>;
  
  // Utility actions
  getOverdueInvoices: () => Invoice[];
  getUnpaidInvoices: () => Invoice[];
  getInvoicesByClient: (clientId: string) => Invoice[];
  getInvoicesByDateRange: (startDate: Date, endDate: Date) => Invoice[];
  calculateTotalRevenue: () => number;
  calculateOutstandingAmount: () => number;
  
  // Computed getters
  getInvoiceById: (id: string) => Invoice | undefined;
  getFilteredInvoices: () => Invoice[];
}

export type InvoicesStore = InvoicesState & InvoicesActions;

export const useInvoicesStore = create<InvoicesStore>()(
  persist(
    (set, get) => ({
      // Initial state
      invoices: [],
      loading: false,
      error: null,
      searchTerm: '',
      statusFilter: 'all',
      dateFilter: {},
      selectedInvoice: null,

      // State management actions
      setInvoices: (invoices) => set({ invoices }),
      
      addInvoice: (invoice) => 
        set((state) => ({ 
          invoices: [...state.invoices, invoice] 
        })),

      updateInvoice: (id, updates) =>
        set((state) => ({
          invoices: state.invoices.map((invoice) =>
            invoice._id === id ? { ...invoice, ...updates } : invoice
          ),
        })),

      removeInvoice: (id) =>
        set((state) => ({
          invoices: state.invoices.filter((invoice) => invoice._id !== id),
        })),

      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
      setSearchTerm: (searchTerm) => set({ searchTerm }),
      setStatusFilter: (statusFilter) => set({ statusFilter }),
      setDateFilter: (dateFilter) => set({ dateFilter }),
      setSelectedInvoice: (selectedInvoice) => set({ selectedInvoice }),

      // API actions
      fetchInvoices: async () => {
        set({ loading: true, error: null });
        try {
          const response = await apiClient.get('/invoices');
          const data = response.data;
          set({ invoices: data, loading: false });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to fetch invoices', loading: false });
        }
      },

      fetchInvoice: async (id: string) => {
        try {
          const response = await apiClient.get(`/invoices/${id}`);
          return response.data;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to fetch invoice' });
          throw error;
        }
      },

      createInvoice: async (invoiceData) => {
        set({ loading: true, error: null });
        try {
          const response = await apiClient.post('/invoices', invoiceData);
          const newInvoice = response.data;
          set((state) => ({ invoices: [...state.invoices, newInvoice], loading: false }));
          return newInvoice;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to create invoice', loading: false });
          throw error;
        }
      },

      updateInvoiceApi: async (id, updates) => {
        set({ loading: true, error: null });
        try {
          const response = await apiClient.put(`/invoices/${id}`, updates);
          const updatedInvoice = response.data;
          get().updateInvoice(id, updatedInvoice);
          set({ loading: false });
          return updatedInvoice;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to update invoice', loading: false });
          throw error;
        }
      },

      deleteInvoice: async (id) => {
        set({ loading: true, error: null });
        try {
          await apiClient.delete(`/invoices/${id}`);
          get().removeInvoice(id);
          set({ loading: false });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to delete invoice', loading: false });
          throw error;
        }
      },

      // Invoice operations
      sendInvoice: async (id) => {
        await get().updateInvoiceApi(id, { status: 'sent' });
      },

      markAsPaid: async (id) => {
        await get().updateInvoiceApi(id, { status: 'paid' });
      },

      markAsOverdue: async (id) => {
        await get().updateInvoiceApi(id, { status: 'overdue' });
      },

      cancelInvoice: async (id) => {
        await get().updateInvoiceApi(id, { status: 'cancelled' });
      },

      // Utility actions
      getOverdueInvoices: () => {
        const now = new Date();
        return get().invoices.filter(invoice => 
          invoice.status === 'sent' && 
          new Date(invoice.dueDate) < now
        );
      },

      getUnpaidInvoices: () => {
        return get().invoices.filter(invoice => 
          ['draft', 'sent', 'overdue'].includes(invoice.status)
        );
      },

      getInvoicesByClient: (clientId: string) => {
        return get().invoices.filter(invoice => 
          typeof invoice.client === 'string' ? invoice.client === clientId : invoice.client._id === clientId
        );
      },

      getInvoicesByDateRange: (startDate: Date, endDate: Date) => {
        return get().invoices.filter(invoice => {
          const issueDate = new Date(invoice.issueDate);
          return issueDate >= startDate && issueDate <= endDate;
        });
      },

      calculateTotalRevenue: () => {
        return get().invoices
          .filter(invoice => invoice.status === 'paid')
          .reduce((total, invoice) => total + invoice.total, 0);
      },

      calculateOutstandingAmount: () => {
        return get().invoices
          .filter(invoice => ['sent', 'overdue'].includes(invoice.status))
          .reduce((total, invoice) => total + invoice.total, 0);
      },

      // Computed getters
      getInvoiceById: (id: string) => {
        return get().invoices.find(invoice => invoice._id === id);
      },

      getFilteredInvoices: () => {
        const { invoices, searchTerm, statusFilter, dateFilter } = get();
        return invoices.filter(invoice => {
          const matchesSearch = searchTerm === '' || 
            invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (typeof invoice.client === 'string' ? invoice.client : invoice.client.companyName)
              .toLowerCase().includes(searchTerm.toLowerCase());
          
          const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
          
          const matchesDate = (!dateFilter.startDate || new Date(invoice.issueDate) >= dateFilter.startDate) &&
                            (!dateFilter.endDate || new Date(invoice.issueDate) <= dateFilter.endDate);
          
          return matchesSearch && matchesStatus && matchesDate;
        });
      },
    }),
    {
      name: 'invoices-store',
      version: STORE_VERSIONS.INVOICES,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        invoices: state.invoices,
        searchTerm: state.searchTerm,
        statusFilter: state.statusFilter,
        dateFilter: state.dateFilter,
      }),
    }
  )
);
