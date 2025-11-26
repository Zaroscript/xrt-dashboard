import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { SupportStore } from './types';
import { initialSupportState } from './types';

const useSupportStore = create<SupportStore>()(
  devtools(
    (set) => ({
      ...initialSupportState,

      setInvoices: (invoices) => set({ invoices }),

      addInvoice: (invoice) =>
        set((state) => ({
          invoices: [...state.invoices, invoice],
        })),

      updateInvoice: (id, updates) =>
        set((state) => ({
          invoices: state.invoices.map((invoice) =>
            invoice.id === id ? { ...invoice, ...updates } : invoice
          ),
        })),

      deleteInvoice: (id) =>
        set((state) => ({
          invoices: state.invoices.filter((invoice) => invoice.id !== id),
          selectedInvoiceId: state.selectedInvoiceId === id ? null : state.selectedInvoiceId,
        })),

      setSelectedInvoice: (id) => set({ selectedInvoiceId: id }),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      clearError: () => set({ error: null }),
    }),
    { name: 'SupportStore' }
  )
);

// Selectors
export const useInvoices = () => useSupportStore((state) => state.invoices);
export const useSelectedInvoice = () =>
  useSupportStore((state) =>
    state.selectedInvoiceId
      ? state.invoices.find((i) => i.id === state.selectedInvoiceId) || null
      : null
  );
export const useIsLoading = () => useSupportStore((state) => state.isLoading);
export const useSupportError = () => useSupportStore((state) => state.error);

export default useSupportStore;
