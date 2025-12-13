import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { ServiceRequest } from "../types";
import { STORE_VERSIONS } from "../types";
import { apiClient } from "@/services/api/apiClient";

interface ServiceRequestsState {
  serviceRequests: ServiceRequest[];
  loading: boolean;
  error: string | null;
}

interface ServiceRequestsActions {
  // State management
  setServiceRequests: (serviceRequests: ServiceRequest[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // API actions
  fetchServiceRequests: () => Promise<void>;
  approveRequest: (id: string, adminNote?: string) => Promise<void>;
  rejectRequest: (id: string, reason?: string) => Promise<void>;
}

export type ServiceRequestsStore = ServiceRequestsState &
  ServiceRequestsActions;

export const useServiceRequestsStore = create<ServiceRequestsStore>()(
  persist(
    (set) => ({
      // Initial state
      serviceRequests: [],
      loading: false,
      error: null,

      // State management actions
      setServiceRequests: (serviceRequests) => set({ serviceRequests }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),

      // API actions
      fetchServiceRequests: async () => {
        set({ loading: true, error: null });
        try {
          const response = await apiClient.get("/requests", {
            params: { type: "service", status: "pending" },
          });
          const requests = response.data?.data?.requests || [];
          set({ serviceRequests: requests, loading: false });
        } catch (error) {
          console.error("Error fetching service requests:", error);
          set({ error: "Failed to fetch service requests", loading: false });
        }
      },

      approveRequest: async (id, adminNote) => {
        set({ loading: true, error: null });
        try {
          await apiClient.patch(`/requests/${id}/approve`, { adminNote });
          set((state) => ({
            serviceRequests: state.serviceRequests.filter(
              (req) => req._id !== id
            ),
            loading: false,
          }));
        } catch (error) {
          console.error("Error approving service request:", error);
          set({ error: "Failed to approve service request", loading: false });
          throw error;
        }
      },

      rejectRequest: async (id, reason) => {
        set({ loading: true, error: null });
        try {
          await apiClient.patch(`/requests/${id}/reject`, {
            adminNotes: reason,
          });
          set((state) => ({
            serviceRequests: state.serviceRequests.filter(
              (req) => req._id !== id
            ),
            loading: false,
          }));
        } catch (error) {
          console.error("Error rejecting service request:", error);
          set({ error: "Failed to reject service request", loading: false });
          throw error;
        }
      },
    }),
    {
      name: "service-requests-store",
      version: STORE_VERSIONS.SERVICE_REQUESTS,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        serviceRequests: state.serviceRequests,
      }),
    }
  )
);
