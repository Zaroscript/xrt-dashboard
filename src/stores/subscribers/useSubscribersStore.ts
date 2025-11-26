import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Subscriber } from "../types";
import { apiClient } from "@/services/api/apiClient";

interface SubscribersState {
  subscribers: Subscriber[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
  statusFilter: "all" | Subscriber["status"];
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
  syncSubscribers: () => Promise<void>;

  // Utility actions
  getSubscribersByUser: (userId: string) => Subscriber[];
  getSubscribersBySubscription: (subscriptionId: string) => Subscriber[];
  getActiveSubscribers: () => Subscriber[];
  getInactiveSubscribers: () => Subscriber[];
  getCancelledSubscribers: () => Subscriber[];
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
          const newSubscriber = response.data.data;
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
          console.log("[UPDATE] Updating subscriber:", id, "with:", updates);
          const response = await apiClient.patch(`/subscribers/${id}`, updates);
          console.log("[UPDATE] Response data:", response.data);
          const updatedSubscriber =
            response.data.data.subscriber || response.data.data;
          console.log("[UPDATE] Updated subscriber:", updatedSubscriber);
          console.log(
            "[UPDATE] Has _id?",
            !!updatedSubscriber._id,
            updatedSubscriber._id
          );
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
          console.error("[UPDATE] Error:", error);
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
        set({ error: null });
        try {
          await apiClient.delete(`/subscribers/${id}`);
          set((state) => ({
            subscribers: state.subscribers.filter((sub) => sub._id !== id),
            selectedSubscriber:
              state.selectedSubscriber?._id === id
                ? null
                : state.selectedSubscriber,
          }));
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Failed to delete subscriber",
          });
          throw error;
        }
      },

      // Subscriber operations
      activateSubscriber: async (id) => {
        await get().updateSubscriberApi(id, { status: "active" });
      },

      deactivateSubscriber: async (id) => {
        await get().updateSubscriberApi(id, { status: "inactive" });
      },

      suspendSubscriber: async (id, reason) => {
        try {
          // Use the generic update endpoint since the specific suspend endpoint might not exist
          // or we can use the updateSubscriberApi helper
          await get().updateSubscriberApi(id, {
            status: "suspended",
            notes: reason, // Assuming notes field is used for reason, or we need to add suspensionReason to type
          });
        } catch (error) {
          console.error("Error suspending subscription:", error);
          throw error;
        }
      },

      cancelSubscription: async (id, reason) => {
        await get().updateSubscriberApi(id, {
          status: "cancelled",
          cancellationReason: reason,
        });
      },

      updatePaymentMethod: async (id, paymentMethod) => {
        await get().updateSubscriberApi(id, { paymentMethod });
      },

      updateBillingInfo: async (id, billingInfo) => {
        await get().updateSubscriberApi(id, { billingInfo });
      },

      updatePreferences: async (id, preferences) => {
        await get().updateSubscriberApi(id, { preferences });
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
        return get().subscribers.filter((subscriber) =>
          typeof subscriber.plan === "string"
            ? subscriber.plan === subscriptionId
            : subscriber.plan?._id === subscriptionId
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

      getCancelledSubscribers: () => {
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
          const matchesSearch =
            searchTerm === "" ||
            (typeof subscriber.user === "string"
              ? subscriber.user
              : subscriber.user.email
            )
              .toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            (subscriber.billingInfo?.contactPerson?.email &&
              subscriber.billingInfo.contactPerson.email
                .toLowerCase()
                .includes(searchTerm.toLowerCase()));

          const matchesStatus =
            statusFilter === "all" || subscriber.status === statusFilter;

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
