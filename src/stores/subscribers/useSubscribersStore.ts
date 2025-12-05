import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Subscriber } from "../types";
import { apiClient } from "@/services/api/apiClient";

interface SubscribersState {
  subscribers: Subscriber[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
  statusFilter:
    | "all"
    | "active"
    | "inactive"
    | "cancelled"
    | "suspended"
    | "pending_approval"
    | "expired"
    | "rejected"
    | "pending";
  selectedSubscriber: Subscriber | null;
}

interface SubscribersActions {
  // State management
  setSubscribers: (subscribers: Subscriber[]) => void;
  addSubscriber: (subscriber: Subscriber) => void;
  updateSubscriber: (id: string, updates: Partial<Subscriber>) => void;
  removeSubscriber: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setSearchTerm: (term: string) => void;
  setStatusFilter: (
    filter:
      | "all"
      | "active"
      | "inactive"
      | "cancelled"
      | "suspended"
      | "pending_approval"
      | "expired"
      | "rejected"
  ) => void;
  setSelectedSubscriber: (subscriber: Subscriber | null) => void;

  // API actions
  fetchSubscribers: () => Promise<void>;
  fetchSubscriber: (id: string) => Promise<void>;
  createSubscriber: (subscriberData: {
    userId: string;
    planId: string;
    notes?: string;
  }) => Promise<Subscriber>;
  updateSubscriberApi: (
    id: string,
    updates: Partial<Subscriber>
  ) => Promise<Subscriber>;
  deleteSubscriber: (id: string) => Promise<void>;

  // Subscriber operations
  activateSubscriber: (id: string) => Promise<void>;
  deactivateSubscriber: (id: string) => Promise<void>;
  suspendSubscriber: (id: string, reason?: string) => Promise<void>;
  cancelSubscription: (id: string, reason?: string) => Promise<void>;
  updatePaymentMethod: (id: string, paymentMethod: any) => Promise<void>;
  updateBillingInfo: (id: string, billingInfo: any) => Promise<void>;
  updatePreferences: (id: string, preferences: any) => Promise<void>;
  approveSubscriber: (id: string, data?: any) => Promise<void>;
  rejectSubscriber: (id: string, reason: string) => Promise<void>;
  clearPlanHistory: (id: string) => Promise<void>;
  syncSubscribers: () => Promise<void>;

  // Utility actions
  getSubscribersByUser: (userId: string) => Subscriber[];
  getSubscribersBySubscription: (subscriptionId: string) => Subscriber[];
  getActiveSubscribers: () => Subscriber[];
  getInactiveSubscribers: () => Subscriber[];
  getCanceledSubscribers: () => Subscriber[];
  getSuspendedSubscribers: () => Subscriber[];
  getSubscriberStats: () => {
    total: number;
    active: number;
    inactive: number;
    cancelled: number;
    suspended: number;
  };

  // Computed getters
  getSubscriberById: (id: string) => Subscriber | undefined;
  getFilteredSubscribers: () => Subscriber[];
}

export type SubscribersStore = SubscribersState & SubscribersActions;

export const useSubscribersStore = create<SubscribersStore>()(
  persist(
    (set, get) => ({
      // Initial state
      subscribers: [],
      loading: false,
      error: null,
      searchTerm: "",
      statusFilter: "all",
      selectedSubscriber: null,

      // State management actions
      setSubscribers: (subscribers) =>
        set({ subscribers: Array.isArray(subscribers) ? subscribers : [] }),

      addSubscriber: (subscriber) =>
        set((state) => ({
          subscribers: [...state.subscribers, subscriber],
        })),

      updateSubscriber: (id, updates) =>
        set((state) => ({
          subscribers: state.subscribers.map((subscriber) =>
            subscriber._id === id ? { ...subscriber, ...updates } : subscriber
          ),
        })),

      removeSubscriber: (id) =>
        set((state) => ({
          subscribers: state.subscribers.filter(
            (subscriber) => subscriber._id !== id
          ),
        })),

      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
      setSearchTerm: (searchTerm) => set({ searchTerm }),
      setStatusFilter: (statusFilter) => set({ statusFilter }),
      setSelectedSubscriber: (selectedSubscriber) =>
        set({ selectedSubscriber }),

      // API actions
      fetchSubscribers: async () => {
        set({ loading: true, error: null });
        try {
          const response = await apiClient.get("/subscribers");
          set({
            subscribers: response.data.data.subscribers || response.data.data,
            loading: false,
          });
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Failed to fetch subscribers",
            loading: false,
          });
        }
      },

      fetchSubscriber: async (id: string) => {
        set({ loading: true, error: null });
        try {
          const response = await apiClient.get(`/subscribers/${id}`);
          set({ selectedSubscriber: response.data.data, loading: false });
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Failed to fetch subscriber",
            loading: false,
          });
        }
      },

      createSubscriber: async (subscriberData: {
        userId: string;
        planId: string;
        notes?: string;
      }) => {
        set({ error: null });
        try {
          const response = await apiClient.post("/subscribers", subscriberData);
          // The API sends back the new subscriber in a nested structure
          const newSubscriber =
            response.data.data.subscriber || response.data.data;
          set((state) => ({
            subscribers: [...state.subscribers, newSubscriber],
          }));
          return newSubscriber;
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Failed to create subscriber",
          });
          throw error;
        }
      },

      updateSubscriberApi: async (id: string, updates: Partial<Subscriber>) => {
        set({ error: null });
        try {
          const response = await apiClient.patch(`/subscribers/${id}`, updates);
          // The API sends back the updated subscriber in a nested structure
          const updatedSubscriber =
            response.data.data.subscriber || response.data.data;

          set((state) => ({
            subscribers: state.subscribers.map((sub) =>
              sub._id === id ? updatedSubscriber : sub
            ),
            selectedSubscriber:
              state.selectedSubscriber?._id === id
                ? updatedSubscriber
                : state.selectedSubscriber,
          }));
          return updatedSubscriber;
        } catch (error) {
          console.error("Failed to update subscriber:", error);
          set({
            error:
              error instanceof Error
                ? error.message
                : "Failed to update subscriber",
          });
          throw error;
        }
      },

      deleteSubscriber: async (id: string) => {
        set({ loading: true, error: null });
        try {
          await apiClient.delete(`/subscribers/${id}`);
          get().removeSubscriber(id);
          set({ loading: false });
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Failed to delete subscriber",
            loading: false,
          });
          throw error;
        }
      },

      // Subscriber operations
      activateSubscriber: async (id) => {
        try {
          await get().updateSubscriberApi(id, {
            status: "active",
            isActive: true,
          });
        } catch (error) {
          console.error("Error activating subscriber:", error);
          throw error;
        }
      },

      deactivateSubscriber: async (id) => {
        try {
          await get().updateSubscriberApi(id, {
            status: "inactive",
            isActive: false,
          });
        } catch (error) {
          console.error("Error deactivating subscriber:", error);
          throw error;
        }
      },

      suspendSubscriber: async (id, reason) => {
        try {
          const updateData: Partial<Subscriber> = {
            status: "suspended",
            ...(reason && { suspensionReason: reason }),
          };
          await get().updateSubscriberApi(id, updateData);
        } catch (error) {
          console.error("Error suspending subscriber:", error);
          throw error;
        }
      },

      cancelSubscription: async (id, reason) => {
        try {
          const updateData: Partial<Subscriber> = {
            status: "cancelled",
            isActive: false,
            ...(reason && { cancellationReason: reason }),
          };

          // Also need to update the plan status
          const subscriber = get().subscribers.find((s) => s._id === id);
          if (subscriber?.plan) {
            const planId =
              typeof subscriber.plan.plan === "string"
                ? subscriber.plan.plan
                : subscriber.plan.plan._id;

            updateData.plan = {
              ...subscriber.plan,
              plan: planId,
              status: "cancelled",
              notes: reason || subscriber.plan.notes,
            };
          }

          await get().updateSubscriberApi(id, updateData);
        } catch (error) {
          console.error("Failed to cancel subscription:", error);
          throw error;
        }
      },

      updatePaymentMethod: async (id, paymentMethod) => {
        try {
          await get().updateSubscriberApi(id, { paymentMethod });
        } catch (error) {
          console.error("Error updating payment method:", error);
          throw error;
        }
      },

      updateBillingInfo: async (id, billingInfo) => {
        try {
          await get().updateSubscriberApi(id, { billingInfo });
        } catch (error) {
          console.error("Error updating billing info:", error);
          throw error;
        }
      },

      updatePreferences: async (id, preferences) => {
        try {
          await get().updateSubscriberApi(id, { preferences });
        } catch (error) {
          console.error("Error updating preferences:", error);
          throw error;
        }
      },

      approveSubscriber: async (id, data) => {
        try {
          const response = await apiClient.post(
            `/subscribers/${id}/approve`,
            data
          );
          const updatedSubscriber = response.data.data.subscriber;

          set((state) => ({
            subscribers: state.subscribers.map((sub) =>
              sub._id === id ? updatedSubscriber : sub
            ),
            selectedSubscriber:
              state.selectedSubscriber?._id === id
                ? updatedSubscriber
                : state.selectedSubscriber,
          }));
        } catch (error) {
          console.error("Error approving subscriber:", error);
          throw error;
        }
      },

      rejectSubscriber: async (id, reason) => {
        try {
          const response = await apiClient.post(`/subscribers/${id}/reject`, {
            reason,
          });
          const updatedSubscriber = response.data.data.subscriber;

          set((state) => ({
            subscribers: state.subscribers.map((sub) =>
              sub._id === id ? updatedSubscriber : sub
            ),
            selectedSubscriber:
              state.selectedSubscriber?._id === id
                ? updatedSubscriber
                : state.selectedSubscriber,
          }));
        } catch (error) {
          console.error("Error rejecting subscriber:", error);
          throw error;
        }
      },

      clearPlanHistory: async (id) => {
        try {
          const response = await apiClient.delete(`/subscribers/${id}/history`);
          const updatedSubscriber = response.data.data.subscriber;

          set((state) => ({
            subscribers: state.subscribers.map((sub) =>
              sub._id === id ? updatedSubscriber : sub
            ),
            selectedSubscriber:
              state.selectedSubscriber?._id === id
                ? updatedSubscriber
                : state.selectedSubscriber,
          }));
        } catch (error) {
          console.error("Error clearing plan history:", error);
          throw error;
        }
      },

      syncSubscribers: async () => {
        set({ loading: true, error: null });
        try {
          await apiClient.post("/subscribers/sync");
          // Refresh subscribers after sync
          await get().fetchSubscribers();
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Failed to sync subscribers",
            loading: false,
          });
          throw error;
        }
      },

      // Utility actions
      getSubscribersByUser: (userId: string) => {
        return get().subscribers.filter((subscriber) =>
          typeof subscriber.user === "string"
            ? subscriber.user === userId
            : subscriber.user._id === userId
        );
      },

      getSubscribersBySubscription: (subscriptionId: string) => {
        return get().subscribers.filter(
          (subscriber) => subscriber.plan.plan === subscriptionId
        );
      },

      getActiveSubscribers: () => {
        return get().subscribers.filter(
          (subscriber) => subscriber.status === "active"
        );
      },

      getInactiveSubscribers: () => {
        return get().subscribers.filter(
          (subscriber) => subscriber.status === "inactive"
        );
      },

      getCanceledSubscribers: () => {
        return get().subscribers.filter(
          (subscriber) => subscriber.status === "cancelled"
        );
      },

      getSuspendedSubscribers: () => {
        return get().subscribers.filter(
          (subscriber) => subscriber.status === "suspended"
        );
      },

      getSubscriberStats: () => {
        const subscribers = get().subscribers;
        return {
          total: subscribers.length,
          active: subscribers.filter((s) => s.status === "active").length,
          inactive: subscribers.filter((s) => s.status === "inactive").length,
          cancelled: subscribers.filter((s) => s.status === "cancelled").length,
          suspended: subscribers.filter((s) => s.status === "suspended").length,
          pending_approval: subscribers.filter(
            (s) => s.status === "pending_approval"
          ).length,
          expired: subscribers.filter((s) => s.status === "expired").length,
          rejected: subscribers.filter((s) => s.status === "rejected").length,
        };
      },

      // Computed getters
      getSubscriberById: (id: string) => {
        return get().subscribers.find((subscriber) => subscriber._id === id);
      },

      getFilteredSubscribers: () => {
        const { subscribers, searchTerm, statusFilter } = get();
        return subscribers.filter((subscriber) => {
          const user =
            typeof subscriber.user === "object" ? subscriber.user : null;
          const matchesSearch =
            !searchTerm ||
            user?.fName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user?.lName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user?.email?.toLowerCase().includes(searchTerm.toLowerCase());

          const matchesStatus =
            statusFilter === "all" ||
            (statusFilter === "pending" &&
              subscriber.status === "pending_approval") ||
            subscriber.status === statusFilter;

          return matchesSearch && matchesStatus;
        });
      },
    }),
    {
      name: "subscribers-store",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        subscribers: state.subscribers,
        searchTerm: state.searchTerm,
        statusFilter: state.statusFilter,
      }),
    }
  )
);
