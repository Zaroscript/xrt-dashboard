import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { PlanRequest } from '../types';
import { STORE_VERSIONS } from '../types';

interface PlanRequestsState {
  planRequests: PlanRequest[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
  statusFilter: 'all' | 'pending' | 'approved' | 'rejected';
  selectedPlanRequest: PlanRequest | null;
}

interface PlanRequestsActions {
  // State management
  setPlanRequests: (planRequests: PlanRequest[]) => void;
  addPlanRequest: (planRequest: PlanRequest) => void;
  updatePlanRequest: (id: string, updates: Partial<PlanRequest>) => void;
  removePlanRequest: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setSearchTerm: (term: string) => void;
  setStatusFilter: (filter: 'all' | 'pending' | 'approved' | 'rejected') => void;
  setSelectedPlanRequest: (planRequest: PlanRequest | null) => void;
  
  // API actions
  fetchPlanRequests: () => Promise<void>;
  fetchPlanRequest: (id: string) => Promise<PlanRequest>;
  createPlanRequest: (requestData: Omit<PlanRequest, '_id' | 'createdAt' | 'updatedAt'>) => Promise<PlanRequest>;
  updatePlanRequestApi: (id: string, updates: Partial<PlanRequest>) => Promise<PlanRequest>;
  deletePlanRequest: (id: string) => Promise<void>;
  
  // Plan request operations
  approveRequest: (id: string) => Promise<void>;
  rejectRequest: (id: string, reason?: string) => Promise<void>;
  updateAdminNote: (id: string, note: string) => Promise<void>;
  
  // Utility actions
  getPlanRequestsByClient: (clientId: string) => PlanRequest[];
  getPlanRequestsByPlan: (planId: string) => PlanRequest[];
  getPendingRequests: () => PlanRequest[];
  getApprovedRequests: () => PlanRequest[];
  getRequestStats: () => {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  
  // Computed getters
  getPlanRequestById: (id: string) => PlanRequest | undefined;
  getFilteredPlanRequests: () => PlanRequest[];
}

export type PlanRequestsStore = PlanRequestsState & PlanRequestsActions;

export const usePlanRequestsStore = create<PlanRequestsStore>()(
  persist(
    (set, get) => ({
      // Initial state
      planRequests: [],
      loading: false,
      error: null,
      searchTerm: '',
      statusFilter: 'all',
      selectedPlanRequest: null,

      // State management actions
      setPlanRequests: (planRequests) => set({ planRequests }),
      
      addPlanRequest: (planRequest) => 
        set((state) => ({ 
          planRequests: [...state.planRequests, planRequest] 
        })),

      updatePlanRequest: (id, updates) =>
        set((state) => ({
          planRequests: state.planRequests.map((request) =>
            request._id === id ? { ...request, ...updates } : request
          ),
        })),

      removePlanRequest: (id) =>
        set((state) => ({
          planRequests: state.planRequests.filter((request) => request._id !== id),
        })),

      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
      setSearchTerm: (searchTerm) => set({ searchTerm }),
      setStatusFilter: (statusFilter) => set({ statusFilter }),
      setSelectedPlanRequest: (selectedPlanRequest) => set({ selectedPlanRequest }),

      // API actions
      fetchPlanRequests: async () => {
        set({ loading: true, error: null });
        try {
          const response = await fetch('/api/plan-requests');
          if (!response.ok) throw new Error('Failed to fetch plan requests');
          const data = await response.json();
          set({ planRequests: data, loading: false });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to fetch plan requests', loading: false });
        }
      },

      fetchPlanRequest: async (id: string) => {
        try {
          const response = await fetch(`/api/plan-requests/${id}`);
          if (!response.ok) throw new Error('Failed to fetch plan request');
          return await response.json();
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to fetch plan request' });
          throw error;
        }
      },

      createPlanRequest: async (requestData) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch('/api/plan-requests', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData),
          });
          if (!response.ok) throw new Error('Failed to create plan request');
          const newRequest = await response.json();
          set((state) => ({ planRequests: [...state.planRequests, newRequest], loading: false }));
          return newRequest;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to create plan request', loading: false });
          throw error;
        }
      },

      updatePlanRequestApi: async (id, updates) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch(`/api/plan-requests/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
          });
          if (!response.ok) throw new Error('Failed to update plan request');
          const updatedRequest = await response.json();
          get().updatePlanRequest(id, updatedRequest);
          set({ loading: false });
          return updatedRequest;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to update plan request', loading: false });
          throw error;
        }
      },

      deletePlanRequest: async (id) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch(`/api/plan-requests/${id}`, {
            method: 'DELETE',
          });
          if (!response.ok) throw new Error('Failed to delete plan request');
          get().removePlanRequest(id);
          set({ loading: false });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to delete plan request', loading: false });
          throw error;
        }
      },

      // Plan request operations
      approveRequest: async (id) => {
        await get().updatePlanRequestApi(id, { status: 'approved' });
      },

      rejectRequest: async (id, reason) => {
        await get().updatePlanRequestApi(id, { status: 'rejected', adminNote: reason });
      },

      updateAdminNote: async (id, note) => {
        await get().updatePlanRequestApi(id, { adminNote: note });
      },

      // Utility actions
      getPlanRequestsByClient: (clientId: string) => {
        return get().planRequests.filter(request => 
          (typeof request.client === 'string' ? request.client === clientId : request.client._id === clientId)
        );
      },

      getPlanRequestsByPlan: (planId: string) => {
        return get().planRequests.filter(request => 
          (typeof request.plan === 'string' ? request.plan === planId : request.plan._id === planId)
        );
      },

      getPendingRequests: () => {
        return get().planRequests.filter(request => request.status === 'pending');
      },

      getApprovedRequests: () => {
        return get().planRequests.filter(request => request.status === 'approved');
      },

      getRequestStats: () => {
        const requests = get().planRequests;
        return {
          total: requests.length,
          pending: requests.filter(r => r.status === 'pending').length,
          approved: requests.filter(r => r.status === 'approved').length,
          rejected: requests.filter(r => r.status === 'rejected').length,
        };
      },

      // Computed getters
      getPlanRequestById: (id: string) => {
        return get().planRequests.find(request => request._id === id);
      },

      getFilteredPlanRequests: () => {
        const { planRequests, searchTerm, statusFilter } = get();
        return planRequests.filter(request => {
          const matchesSearch = searchTerm === '' || 
            (typeof request.client === 'string' ? request.client : request.client.companyName)
              .toLowerCase().includes(searchTerm.toLowerCase()) ||
            (typeof request.plan === 'string' ? request.plan : request.plan.name)
              .toLowerCase().includes(searchTerm.toLowerCase());
          
          const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
          
          return matchesSearch && matchesStatus;
        });
      },
    }),
    {
      name: 'plan-requests-store',
      version: STORE_VERSIONS.PLAN_REQUESTS,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        planRequests: state.planRequests,
        searchTerm: state.searchTerm,
        statusFilter: state.statusFilter,
      }),
    }
  )
);
