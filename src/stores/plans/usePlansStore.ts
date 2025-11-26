import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { apiClient } from "@/services/api/apiClient";
import type { Plan, PlanRequest } from "@/types/plan";
import { STORE_VERSIONS } from "@/stores/types";

interface PlansState {
  plans: Plan[];
  planRequests: PlanRequest[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
  activeOnly: boolean;
  billingFilter: "monthly" | "yearly" | "all";
}

interface PlansActions {
  // State management
  setPlans: (plans: Plan[]) => void;
  addPlan: (plan: Plan) => void;
  updatePlan: (id: string, updates: Partial<Plan>) => void;
  removePlan: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setSearchTerm: (term: string) => void;
  setActiveOnly: (activeOnly: boolean) => void;
  setBillingFilter: (filter: "monthly" | "yearly" | "all") => void;

  // API actions
  fetchPlans: () => Promise<void>;
  fetchPlan: (id: string) => Promise<Plan>;
  createPlan: (
    planData: Omit<Plan, "_id" | "createdAt" | "updatedAt">
  ) => Promise<Plan>;
  updatePlanApi: (id: string, updates: Partial<Plan>) => Promise<Plan>;
  deletePlan: (id: string) => Promise<void>;

  // Plan Requests
  fetchPlanRequests: () => Promise<void>;
  respondToPlanRequest: (
    id: string,
    status: "approved" | "rejected",
    adminNote?: string
  ) => Promise<void>;

  // Utility actions
  togglePlanStatus: (id: string) => Promise<void>;
  applyDiscount: (
    id: string,
    discount: {
      type: "percentage" | "fixed";
      value: number;
      isActive: boolean;
      startDate?: Date;
      endDate?: Date;
      code?: string;
    }
  ) => Promise<void>;
  removeDiscount: (id: string) => Promise<void>;
  changeBillingCycle: (
    id: string,
    cycle: "monthly" | "yearly"
  ) => Promise<void>;
  subscribeClient: (data: {
    clientId: string;
    planId: string;
    billingCycle: string;
    customPrice?: number;
    startDate?: Date;
  }) => Promise<void>;

  // Computed getters
  getPlanById: (id: string) => Plan | undefined;
  getActivePlans: () => Plan[];
  getFilteredPlans: () => Plan[];
}

export type PlansStore = PlansState & PlansActions;

export const usePlansStore = create<PlansStore>()(
  persist(
    (set, get) => ({
      // Initial state
      plans: [],
      planRequests: [],
      loading: false,
      error: null,
      searchTerm: "",
      activeOnly: true,
      billingFilter: "all",

      // State management actions
      setPlans: (plans) => set({ plans }),

      addPlan: (plan) =>
        set((state) => ({
          plans: [...state.plans, plan],
        })),

      updatePlan: (id, updates) =>
        set((state) => ({
          plans: state.plans.map((plan) =>
            plan._id === id ? { ...plan, ...updates } : plan
          ),
        })),

      removePlan: (id) =>
        set((state) => ({
          plans: state.plans.filter((plan) => plan._id !== id),
        })),

      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
      setSearchTerm: (searchTerm) => set({ searchTerm }),
      setActiveOnly: (activeOnly) => set({ activeOnly }),
      setBillingFilter: (billingFilter) => set({ billingFilter }),

      // API actions
      fetchPlans: async () => {
        console.trace("fetchPlans called by:");
        set({ loading: true, error: null });
        try {
          const response = await apiClient.get("/plans");
          console.log("Plans API Response:", response);
          // Handle API response structure: {status: "success", data: {plans: [...]}}
          const plans = response.data?.data?.plans || [];
          console.log("Processed plans:", plans);
          set({ plans, loading: false });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Failed to fetch plans";
          console.error("Error fetching plans:", error);
          set({ error: errorMessage, loading: false });
        }
      },

      fetchPlan: async (id: string) => {
        try {
          const response = await apiClient.get(`/plans/${id}`);
          return response.data?.data?.plan || response.data;
        } catch (error) {
          set({
            error:
              error instanceof Error ? error.message : "Failed to fetch plan",
          });
          throw error;
        }
      },

      createPlan: async (planData) => {
        set({ loading: true, error: null });
        try {
          const response = await apiClient.post("/admin/plans", planData);
          const newPlan = response.data?.data?.plan || response.data;
          set((state) => ({
            plans: [...state.plans, newPlan],
            loading: false,
          }));
          return newPlan;
        } catch (error) {
          set({
            error:
              error instanceof Error ? error.message : "Failed to create plan",
            loading: false,
          });
          throw error;
        }
      },

      updatePlanApi: async (id, updates) => {
        set({ loading: true, error: null });
        try {
          const response = await apiClient.patch(`/admin/plans/${id}`, updates);
          const updatedPlan = response.data?.data?.plan || response.data;
          get().updatePlan(id, updatedPlan);
          set({ loading: false });
          return updatedPlan;
        } catch (error) {
          set({
            error:
              error instanceof Error ? error.message : "Failed to update plan",
            loading: false,
          });
          throw error;
        }
      },

      deletePlan: async (id) => {
        set({ loading: true, error: null });
        try {
          await apiClient.delete(`/admin/plans/${id}`);
          get().removePlan(id);
          set({ loading: false });
        } catch (error) {
          set({
            error:
              error instanceof Error ? error.message : "Failed to delete plan",
            loading: false,
          });
          throw error;
        }
      },

      // Plan Requests
      fetchPlanRequests: async () => {
        set({ loading: true, error: null });
        try {
          const response = await apiClient.get("/requests", {
            params: { type: "plan_change", status: "pending" },
          });
          const requests = response.data?.data?.requests || [];
          set({ planRequests: requests, loading: false });
        } catch (error) {
          console.error("Error fetching plan requests:", error);
          set({ error: "Failed to fetch plan requests", loading: false });
        }
      },

      respondToPlanRequest: async (id, status, adminNote) => {
        set({ loading: true, error: null });
        try {
          await apiClient.patch(
            `/requests/${id}/${status === "approved" ? "approve" : "reject"}`,
            { adminNote }
          );
          // Remove from list
          set((state) => ({
            planRequests: state.planRequests.filter((req) => req._id !== id),
            loading: false,
          }));
        } catch (error) {
          console.error("Error responding to plan request:", error);
          set({ error: "Failed to respond to plan request", loading: false });
          throw error;
        }
      },

      // Utility actions
      togglePlanStatus: async (id) => {
        const plan = get().plans.find((p) => p._id === id);
        if (plan) {
          await get().updatePlanApi(id, { isActive: !plan.isActive });
        }
      },

      applyDiscount: async (id, discount) => {
        await get().updatePlanApi(id, { discount });
      },

      removeDiscount: async (id) => {
        await get().updatePlanApi(id, {
          discount: { type: "percentage", value: 0, isActive: false },
        });
      },

      changeBillingCycle: async (id, cycle) => {
        await get().updatePlanApi(id, { billingCycle: cycle });
      },

      subscribeClient: async (data) => {
        set({ loading: true, error: null });
        try {
          await apiClient.post("/subscriptions/admin/subscribe", data);
          set({ loading: false });
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Failed to subscribe client",
            loading: false,
          });
          throw error;
        }
      },

      // Computed getters
      getPlanById: (id: string) => {
        return get().plans.find((plan) => plan._id === id);
      },

      getActivePlans: () => {
        return get().plans.filter((plan) => plan.isActive);
      },

      getFilteredPlans: () => {
        const { plans, searchTerm, activeOnly, billingFilter } = get();
        return plans.filter((plan) => {
          const matchesSearch =
            plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            plan.description?.toLowerCase().includes(searchTerm.toLowerCase());
          const matchesActive = !activeOnly || plan.isActive;
          const matchesBilling =
            billingFilter === "all" || plan.billingCycle === billingFilter;
          return matchesSearch && matchesActive && matchesBilling;
        });
      },
    }),
    {
      name: "plans-store",
      version: STORE_VERSIONS.PLANS,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        plans: state.plans,
        searchTerm: state.searchTerm,
        activeOnly: state.activeOnly,
        billingFilter: state.billingFilter,
      }),
    }
  )
);
