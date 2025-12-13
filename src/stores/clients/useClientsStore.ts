import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Client } from "../types";
import { STORE_VERSIONS } from "../types";
import { apiClient } from "../../services/api/apiClient";
import { useSubscribersStore } from "../subscribers/useSubscribersStore";

// Re-export Client type for convenience
export type { Client } from "../types";

interface ClientsState {
  clients: Client[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
  activeOnly: boolean;
  selectedClient: Client | null;
  recentClients: Client[];
}

interface ClientsActions {
  // State management
  setClients: (clients: Client[]) => void;
  addClient: (client: Client) => void;
  updateClient: (id: string, updates: Partial<Client>) => void;
  removeClient: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setSearchTerm: (term: string) => void;
  setActiveOnly: (activeOnly: boolean) => void;
  setSelectedClient: (client: Client | null) => void;
  addRecentClient: (client: Client) => void;
  removeRecentClient: (clientId: string) => void;

  // API actions
  fetchClients: (filters?: {
    status?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    page?: number;
    limit?: number;
    pending?: boolean;
  }) => Promise<void>;
  fetchClient: (id: string) => Promise<Client>;
  createClient: (
    clientData: Omit<Client, "_id" | "createdAt" | "updatedAt">
  ) => Promise<Client>;
  updateClientApi: (id: string, updates: Partial<Client>) => Promise<Client>;
  deleteClient: (id: string) => Promise<void>;

  // Service management for clients
  addServiceToClient: (clientId: string, serviceId: string) => Promise<void>;
  removeServiceFromClient: (
    clientId: string,
    serviceId: string
  ) => Promise<void>;
  updateClientServices: (clientId: string, services: string[]) => void;

  // Plan management for clients
  assignPlanToClient: (clientId: string, planId: string) => Promise<void>;
  removePlanFromClient: (clientId: string) => Promise<void>;

  // Utility actions
  toggleClientStatus: (id: string) => Promise<void>;

  // Computed getters
  getClientById: (id: string) => Client | undefined;
  getClientByUserId: (userId: string) => Client | undefined;
  getActiveClients: () => Client[];
  getFilteredClients: () => Client[];
}

export type ClientsStore = ClientsState & ClientsActions;

export const useClientsStore = create<ClientsStore>()(
  persist(
    (set, get) => ({
      // Initial state
      clients: [],
      loading: false,
      error: null,
      searchTerm: "",
      activeOnly: false,
      selectedClient: null,
      recentClients: [],

      // State management actions
      setClients: (clients) => set({ clients }),

      addClient: (client) =>
        set((state) => ({
          clients: [...(state.clients || []), client],
        })),

      updateClient: (id, updates) =>
        set((state) => ({
          clients: (state.clients || []).map((client) =>
            client._id === id ? { ...client, ...updates } : client
          ),
        })),

      removeClient: (id) =>
        set((state) => ({
          clients: (state.clients || []).filter((client) => client._id !== id),
        })),

      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
      setSearchTerm: (searchTerm) => set({ searchTerm }),
      setActiveOnly: (activeOnly) => set({ activeOnly }),
      setSelectedClient: (selectedClient) => {
        if (selectedClient) {
          // Add to recent clients if not already present
          const exists = get().recentClients.some(
            (c) => c._id === selectedClient._id
          );
          if (!exists) {
            set((state) => ({
              recentClients: [selectedClient, ...state.recentClients].slice(
                0,
                5
              ), // Keep only 5 most recent
            }));
          }
        }
        set({ selectedClient });
      },

      addRecentClient: (client) => {
        set((state) => ({
          recentClients: [
            client,
            ...state.recentClients.filter((c) => c._id !== client._id),
          ].slice(0, 5),
        }));
      },

      removeRecentClient: (clientId) => {
        set((state) => ({
          recentClients: state.recentClients.filter((c) => c._id !== clientId),
        }));
      },

      // API actions
      fetchClients: async (filters?: {
        status?: string;
        search?: string;
        sortBy?: string;
        sortOrder?: "asc" | "desc";
        page?: number;
        limit?: number;
        pending?: boolean;
      }) => {
        set({ loading: true, error: null });
        try {
          // Import clientsService dynamically to avoid circular dependency
          const { clientsService } = await import(
            "../../services/api/clientsService"
          );

          const result = await clientsService.getClients(filters);

          set({ clients: result.clients, loading: false });
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Failed to fetch clients",
            loading: false,
          });
        }
      },

      fetchClient: async (id: string) => {
        try {
          const response = await apiClient.get(`/clients/${id}`);
          const data = response.data.data || response.data;
          const clientData = data.client || data;

          // Merge subscription data if available (this contains the real-time status)
          if (data.subscription) {
            clientData.subscription = data.subscription;
          }

          if (clientData.services?.[0]) {
          }
          return clientData;
        } catch (error) {
          console.error("fetchClient error:", error);
          set({
            error:
              error instanceof Error ? error.message : "Failed to fetch client",
          });
          throw error;
        }
      },

      createClient: async (clientData) => {
        set({ loading: true, error: null });
        try {
          const response = await apiClient.post("/clients", clientData);
          const newClient = response.data.data || response.data;
          set((state) => ({
            clients: [...(state.clients || []), newClient],
            loading: false,
          }));
          return newClient;
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Failed to create client",
            loading: false,
          });
          throw error;
        }
      },

      updateClientApi: async (id, updates) => {
        set({ loading: true, error: null });
        try {
          const response = await apiClient.patch(`/clients/${id}`, updates);

          // Handle different response formats
          const updatedClient =
            response.data.data?.client ||
            response.data.client ||
            response.data.data ||
            response.data;
          const subscriber =
            response.data.data?.subscriber || response.data.subscriber;

          // If response contains the full updated client object
          if (updatedClient && typeof updatedClient === "object") {
            if (subscriber) {
              // Update subscriber store
              const { updateSubscriber, addSubscriber } =
                useSubscribersStore.getState();
              if (subscriber._id) {
                updateSubscriber(subscriber._id, subscriber);
              } else {
                addSubscriber(subscriber);
              }
            }
            get().updateClient(id, updatedClient);
          } else {
            // If response doesn't contain the client, just refetch all clients
            await get().fetchClients();
          }

          set({ loading: false });
          return updatedClient;
        } catch (error) {
          console.error("Update client error:", error);
          set({
            error:
              error instanceof Error
                ? error.message
                : "Failed to update client",
            loading: false,
          });
          throw error;
        }
      },

      deleteClient: async (id) => {
        set({ loading: true, error: null });
        try {
          // Get the client before deletion to find associated subscriber
          const client = get().clients.find((c) => c._id === id);

          // Delete the client from the API
          await apiClient.delete(`/clients/${id}`);

          // Remove client from store
          get().removeClient(id);

          // Also remove the associated subscriber if exists
          if (client && client.user) {
            const userId =
              typeof client.user === "string" ? client.user : client.user._id;
            const { subscribers, removeSubscriber } =
              useSubscribersStore.getState();

            // Find subscriber with matching user ID
            const subscriberToRemove = subscribers.find((sub) => {
              const subUserId =
                typeof sub.user === "string" ? sub.user : sub.user._id;
              return subUserId === userId;
            });

            // Remove subscriber if found
            if (subscriberToRemove) {
              removeSubscriber(subscriberToRemove._id);
            }
          }

          set({ loading: false });
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Failed to delete client",
            loading: false,
          });
          throw error;
        }
      },

      // Service management for clients
      addServiceToClient: async (clientId, serviceId) => {
        const client = get().clients.find((c) => c._id === clientId);
        if (client) {
          const updatedServices = [...(client.services as string[]), serviceId];
          await get().updateClientApi(clientId, { services: updatedServices });
        }
      },

      removeServiceFromClient: async (clientId, serviceId) => {
        const client = get().clients.find((c) => c._id === clientId);
        if (client) {
          const updatedServices = (client.services as string[]).filter(
            (id) => id !== serviceId
          );
          await get().updateClientApi(clientId, { services: updatedServices });
        }
      },

      updateClientServices: (clientId, services) => {
        get().updateClient(clientId, { services });
      },

      // Plan management for clients
      assignPlanToClient: async (clientId, planId) => {
        await get().updateClientApi(clientId, { currentPlan: planId });
      },

      removePlanFromClient: async (clientId) => {
        await get().updateClientApi(clientId, { currentPlan: undefined });
      },

      // Utility actions
      toggleClientStatus: async (id) => {
        const { clients } = get();
        const clientsArray = Array.isArray(clients) ? clients : [];
        const client = clientsArray.find((c) => c._id === id);
        if (client) {
          await get().updateClientApi(id, { isActive: !client.isActive });
        }
      },

      // Computed getters
      getClientById: (id: string) => {
        const { clients } = get();
        // Ensure clients is always an array
        const clientsArray = Array.isArray(clients) ? clients : [];
        return clientsArray.find((client) => client._id === id);
      },

      getClientByUserId: (userId: string) => {
        const { clients } = get();
        // Ensure clients is always an array
        const clientsArray = Array.isArray(clients) ? clients : [];
        return clientsArray.find((client) =>
          typeof client.user === "string"
            ? client.user === userId
            : client.user._id === userId
        );
      },

      getActiveClients: () => {
        const { clients } = get();
        // Ensure clients is always an array
        const clientsArray = Array.isArray(clients) ? clients : [];
        return clientsArray.filter((client) => client.isActive);
      },

      getFilteredClients: () => {
        const { clients, searchTerm, activeOnly } = get();
        // Ensure clients is always an array
        const clientsArray = Array.isArray(clients) ? clients : [];
        return clientsArray.filter((client) => {
          const matchesSearch =
            client.companyName
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            client.businessLocation?.city
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            client.businessLocation?.state
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            (typeof client.user === "object" &&
              client.user?.email &&
              client.user.email
                .toLowerCase()
                .includes(searchTerm.toLowerCase()));
          // Default to true if isActive is undefined (for backward compatibility)
          const matchesActive = !activeOnly || client.isActive !== false;
          return matchesSearch && matchesActive;
        });
      },
    }),
    {
      name: "clients-store",
      version: STORE_VERSIONS.CLIENTS,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        clients: state.clients,
        searchTerm: state.searchTerm,
        activeOnly: state.activeOnly,
        recentClients: state.recentClients,
      }),
    }
  )
);
