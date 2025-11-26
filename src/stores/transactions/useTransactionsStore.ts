import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Transaction } from '../types';
import { STORE_VERSIONS } from '../types';

interface TransactionsState {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
  statusFilter: 'all' | 'pending' | 'succeeded' | 'failed' | 'refunded' | 'disputed';
  dateFilter: {
    startDate?: Date;
    endDate?: Date;
  };
  selectedTransaction: Transaction | null;
}

interface TransactionsActions {
  // State management
  setTransactions: (transactions: Transaction[]) => void;
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  removeTransaction: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setSearchTerm: (term: string) => void;
  setStatusFilter: (filter: 'all' | 'pending' | 'succeeded' | 'failed' | 'refunded' | 'disputed') => void;
  setDateFilter: (filter: { startDate?: Date; endDate?: Date }) => void;
  setSelectedTransaction: (transaction: Transaction | null) => void;
  
  // API actions
  fetchTransactions: () => Promise<void>;
  fetchTransaction: (id: string) => Promise<Transaction>;
  createTransaction: (transactionData: Omit<Transaction, '_id' | 'invoiceId' | 'createdAt' | 'updatedAt'>) => Promise<Transaction>;
  updateTransactionApi: (id: string, updates: Partial<Transaction>) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<void>;
  
  // Transaction operations
  refundTransaction: (id: string, amount?: number, reason?: string) => Promise<void>;
  markAsSucceeded: (id: string) => Promise<void>;
  markAsFailed: (id: string) => Promise<void>;
  disputeTransaction: (id: string) => Promise<void>;
  
  // Utility actions
  getTransactionsByClient: (clientId: string) => Transaction[];
  getTransactionsBySubscription: (subscriptionId: string) => Transaction[];
  getTransactionsByDateRange: (startDate: Date, endDate: Date) => Transaction[];
  getFailedTransactions: () => Transaction[];
  getRefundedTransactions: () => Transaction[];
  calculateTotalRevenue: () => number;
  calculateTotalRefunds: () => number;
  calculateNetRevenue: () => number;
  
  // Computed getters
  getTransactionById: (id: string) => Transaction | undefined;
  getFilteredTransactions: () => Transaction[];
}

export type TransactionsStore = TransactionsState & TransactionsActions;

export const useTransactionsStore = create<TransactionsStore>()(
  persist(
    (set, get) => ({
      // Initial state
      transactions: [],
      loading: false,
      error: null,
      searchTerm: '',
      statusFilter: 'all',
      dateFilter: {},
      selectedTransaction: null,

      // State management actions
      setTransactions: (transactions) => set({ transactions }),
      
      addTransaction: (transaction) => 
        set((state) => ({ 
          transactions: [...state.transactions, transaction] 
        })),

      updateTransaction: (id, updates) =>
        set((state) => ({
          transactions: state.transactions.map((transaction) =>
            transaction._id === id ? { ...transaction, ...updates } : transaction
          ),
        })),

      removeTransaction: (id) =>
        set((state) => ({
          transactions: state.transactions.filter((transaction) => transaction._id !== id),
        })),

      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
      setSearchTerm: (searchTerm) => set({ searchTerm }),
      setStatusFilter: (statusFilter) => set({ statusFilter }),
      setDateFilter: (dateFilter) => set({ dateFilter }),
      setSelectedTransaction: (selectedTransaction) => set({ selectedTransaction }),

      // API actions
      fetchTransactions: async () => {
        set({ loading: true, error: null });
        try {
          const response = await fetch('/api/transactions');
          if (!response.ok) throw new Error('Failed to fetch transactions');
          const data = await response.json();
          set({ transactions: data, loading: false });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to fetch transactions', loading: false });
        }
      },

      fetchTransaction: async (id: string) => {
        try {
          const response = await fetch(`/api/transactions/${id}`);
          if (!response.ok) throw new Error('Failed to fetch transaction');
          return await response.json();
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to fetch transaction' });
          throw error;
        }
      },

      createTransaction: async (transactionData) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch('/api/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(transactionData),
          });
          if (!response.ok) throw new Error('Failed to create transaction');
          const newTransaction = await response.json();
          set((state) => ({ transactions: [...state.transactions, newTransaction], loading: false }));
          return newTransaction;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to create transaction', loading: false });
          throw error;
        }
      },

      updateTransactionApi: async (id, updates) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch(`/api/transactions/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
          });
          if (!response.ok) throw new Error('Failed to update transaction');
          const updatedTransaction = await response.json();
          get().updateTransaction(id, updatedTransaction);
          set({ loading: false });
          return updatedTransaction;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to update transaction', loading: false });
          throw error;
        }
      },

      deleteTransaction: async (id) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch(`/api/transactions/${id}`, {
            method: 'DELETE',
          });
          if (!response.ok) throw new Error('Failed to delete transaction');
          get().removeTransaction(id);
          set({ loading: false });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to delete transaction', loading: false });
          throw error;
        }
      },

      // Transaction operations
      refundTransaction: async (id, amount, reason) => {
        const transaction = get().transactions.find(t => t._id === id);
        if (transaction && transaction.status === 'succeeded') {
          const refundAmount = amount || transaction.amount;
          await get().updateTransactionApi(id, {
            status: 'refunded',
            refundedAmount: refundAmount,
            refundReason: reason,
          });
        }
      },

      markAsSucceeded: async (id) => {
        await get().updateTransactionApi(id, { status: 'succeeded' });
      },

      markAsFailed: async (id) => {
        await get().updateTransactionApi(id, { status: 'failed' });
      },

      disputeTransaction: async (id) => {
        await get().updateTransactionApi(id, { status: 'disputed' });
      },

      // Utility actions
      getTransactionsByClient: (clientId: string) => {
        return get().transactions.filter(transaction => 
          typeof transaction.client === 'string' ? transaction.client === clientId : transaction.client._id === clientId
        );
      },

      getTransactionsBySubscription: (subscriptionId: string) => {
        return get().transactions.filter(transaction => 
          typeof transaction.subscription === 'string' ? transaction.subscription === subscriptionId : transaction.subscription._id === subscriptionId
        );
      },

      getTransactionsByDateRange: (startDate: Date, endDate: Date) => {
        return get().transactions.filter(transaction => {
          const transactionDate = new Date(transaction.createdAt);
          return transactionDate >= startDate && transactionDate <= endDate;
        });
      },

      getFailedTransactions: () => {
        return get().transactions.filter(transaction => transaction.status === 'failed');
      },

      getRefundedTransactions: () => {
        return get().transactions.filter(transaction => transaction.status === 'refunded');
      },

      calculateTotalRevenue: () => {
        return get().transactions
          .filter(transaction => transaction.status === 'succeeded')
          .reduce((total, transaction) => total + transaction.amount, 0);
      },

      calculateTotalRefunds: () => {
        return get().transactions
          .filter(transaction => transaction.status === 'refunded')
          .reduce((total, transaction) => total + (transaction.refundedAmount || 0), 0);
      },

      calculateNetRevenue: () => {
        return get().calculateTotalRevenue() - get().calculateTotalRefunds();
      },

      // Computed getters
      getTransactionById: (id: string) => {
        return get().transactions.find(transaction => transaction._id === id);
      },

      getFilteredTransactions: () => {
        const { transactions, searchTerm, statusFilter, dateFilter } = get();
        return transactions.filter(transaction => {
          const matchesSearch = searchTerm === '' || 
            transaction.invoiceId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            transaction.paymentIntentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (typeof transaction.client === 'string' ? transaction.client : transaction.client.companyName)
              .toLowerCase().includes(searchTerm.toLowerCase());
          
          const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
          
          const matchesDate = (!dateFilter.startDate || new Date(transaction.createdAt) >= dateFilter.startDate) &&
                            (!dateFilter.endDate || new Date(transaction.createdAt) <= dateFilter.endDate);
          
          return matchesSearch && matchesStatus && matchesDate;
        });
      },
    }),
    {
      name: 'transactions-store',
      version: STORE_VERSIONS.TRANSACTIONS,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        transactions: state.transactions,
        searchTerm: state.searchTerm,
        statusFilter: state.statusFilter,
        dateFilter: state.dateFilter,
      }),
    }
  )
);
