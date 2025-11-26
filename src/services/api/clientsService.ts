import { apiClient } from "./apiClient";
import type {
  Client as ClientType,
  UserRef,
  ServiceRef,
  PlanRef,
  Address,
} from "@/types/client.types";

export type Client = ClientType;

// Helper function to transform API client data to match the Client type
const transformClientData = (data: any): Client | null => {
  if (!data) {
    console.error("No data provided to transform");
    return null;
  }

  // Helper function to safely get user property
  const getUserProp = (prop: string) => {
    if (data.user && typeof data.user === "object") {
      return (data.user as any)[prop];
    }
    return (data as any)[prop];
  };

  // Get user ID from various possible locations
  const userId =
    (data.user && typeof data.user === "object" ? data.user._id : null) ||
    (typeof data.user === "string" ? data.user : null) ||
    data.userId ||
    data._id;

  // Create user reference with proper type safety
  const user: UserRef = {
    _id: userId || "",
    email: getUserProp("email") || "",
    fName: getUserProp("fName") || "",
    lName: getUserProp("lName") || "",
    phone: getUserProp("phone") || "",
    role: getUserProp("role") || "client",
    isActive:
      getUserProp("isActive") !== undefined ? getUserProp("isActive") : true,
    avatar: getUserProp("avatar"),
  };

  // Handle address - get address from data or user object
  const getAddress = (type: string) => {
    const addr = data.address || {};
    const userAddr =
      (data.user && typeof data.user === "object" ? data.user.address : {}) ||
      {};
    return {
      street: addr.street || userAddr.street || "",
      city: addr.city || userAddr.city || "",
      state: addr.state || userAddr.state || "",
      country: addr.country || userAddr.country || "",
      zipCode:
        addr.zipCode ||
        addr.postalCode ||
        userAddr.zipCode ||
        userAddr.postalCode ||
        "",
      postalCode:
        addr.postalCode ||
        addr.zipCode ||
        userAddr.postalCode ||
        userAddr.zipCode ||
        "",
    };
  };

  const address = getAddress("address");

  // Generate display name - prefer client name, then user name, then company name
  const displayName =
    data.name ||
    `${user.fName || ""} ${user.lName || ""}`.trim() ||
    data.companyName ||
    "Unnamed Client";

  // Merge user and client data, with client data taking precedence
  const client: Client = {
    // Spread client data first (overwrites any user data)
    ...data,
    // Then add user data for missing fields
    _id: data._id || userId || "",
    user: userId, // Store just the user ID as reference

    // Merge contact information (prefer client data, fall back to user data)
    email: data.email || user.email || "",
    phone: data.phone || user.phone || "",

    // Add display name
    name: displayName,

    // Handle address
    address,

    // Handle services
    services: data.services || [],

    // Handle current plan
    currentPlan: data.currentPlan || null,

    // Handle subscription
    subscription: data.subscription || null,

    // Add any additional client-specific fields
    taxId: data.taxId || "",
    isActive: data.isActive !== undefined ? data.isActive : true,
  };

  return client;
};

export const clientsService = {
  // Get all clients
  getClients: async (): Promise<Client[]> => {
    try {
      console.log("Fetching clients from API...");
      // Use the correct endpoint from the backend
      const response = await apiClient.get("/clients");
      console.log("API Response status:", response.status, response.statusText);
      console.log("Response data:", response.data);

      // Handle the server response format
      if (!response.data) {
        console.error("No data in response");
        return [];
      }

      // Handle the standard server response format: { status: 'success', data: { clients: [...] } }
      let clients = [];
      if (response.data.data && Array.isArray(response.data.data.clients)) {
        clients = response.data.data.clients;
      } else if (Array.isArray(response.data.clients)) {
        clients = response.data.clients;
      } else if (Array.isArray(response.data)) {
        clients = response.data;
      } else {
        console.error("Unexpected response format:", response.data);
        return [];
      }

      console.log("Raw clients data:", clients);

      // Transform each client to match our Client type
      const transformedClients = clients
        .map((client: any) => {
          const transformed = transformClientData(client);
          if (!transformed) {
            console.error("Failed to transform client:", client);
            return null;
          }
          return transformed;
        })
        .filter((client: Client | null): client is Client => client !== null);

      console.log("Transformed clients:", transformedClients);
      return transformedClients;
    } catch (error) {
      console.error("Error fetching clients:", error);
      throw error;
    }
  },

  // Get a single client by ID
  getClient: async (id: string): Promise<Client> => {
    try {
      console.log(`Fetching client with ID: ${id}`);
      const response = await apiClient.get(`/clients/${id}`);

      // Handle the standard server response format: { status: 'success', data: { client: {...} } }
      const clientData =
        response.data.data?.client || response.data.data || response.data;

      if (!clientData) {
        throw new Error("No client data received from server");
      }

      const transformedClient = transformClientData(clientData);
      if (!transformedClient) {
        throw new Error("Failed to transform client data");
      }

      return transformedClient;
    } catch (error) {
      console.error(`Error fetching client ${id}:`, error);
      throw error;
    }
  },

  // Create a new client
  createClient: async (
    clientData: Partial<Client>,
    userData?: any,
    email?: string
  ): Promise<Client> => {
    try {
      // Prepare client data
      const payload: any = {
        companyName:
          clientData.companyName || clientData.name || "Unnamed Client",
        businessLocation: clientData.businessLocation || "",
        oldWebsite: clientData.oldWebsite || "",
        taxId: clientData.taxId || "",
        notes: clientData.notes || "",
        services: clientData.services || [],
        isActive:
          clientData.isActive !== undefined ? clientData.isActive : true,
      };

      // Prepare user data
      if (userData) {
        // If we have a full user object, use it
        payload.user = {
          email: userData.email,
          fName: userData.fName || "",
          lName: userData.lName || "",
          phone: userData.phone,
          role: userData.role || "client",
          isActive: userData.isActive !== undefined ? userData.isActive : true,
        };
      } else if (email) {
        // If we only have an email, create a basic user
        payload.user = {
          email: email,
          fName:
            (clientData as any).fName ||
            (clientData as any).name?.split(" ")[0] ||
            "",
          lName:
            (clientData as any).lName ||
            (clientData as any).name?.split(" ").slice(1).join(" ") ||
            "",
          phone: (clientData as any).phone || (clientData as any).phoneNumber,
          role: "client",
          isActive: true,
        };
      }

      // Clean up the payload
      const cleanPayload = Object.entries(payload).reduce(
        (acc, [key, value]) => {
          if (value !== undefined && value !== "") {
            acc[key] = value;
          }
          return acc;
        },
        {} as Record<string, any>
      );

      console.log("Sending client data to API:", cleanPayload);
      const response = await apiClient.post("/clients", cleanPayload);

      if (!response.data) {
        throw new Error("No data received from server");
      }

      // Ensure we have the client data in the response
      const clientResponse = response.data.client || response.data;

      if (!clientResponse) {
        throw new Error("Invalid response format from server");
      }

      return transformClientData(clientResponse);
    } catch (error) {
      console.error("Error creating client:", error);
      throw error;
    }
  },

  // Update a client
  updateClient: async (
    id: string,
    clientData: Partial<Client>
  ): Promise<Client> => {
    try {
      if (!clientData || Object.keys(clientData).length === 0) {
        throw new Error("No data provided for update");
      }

      // Transform the data for the API
      const payload = { ...clientData };

      // If user is an object, use its ID, otherwise use the string as is
      if (payload.user && typeof payload.user === "object") {
        payload.user = (payload.user as UserRef)._id;
      }

      // Ensure companyName is set, fallback to company
      if (!payload.companyName && (payload as any).company) {
        payload.companyName = (payload as any).company;
      }

      // Ensure oldWebsite is set, fallback to website
      if (!payload.oldWebsite && (payload as any).website) {
        payload.oldWebsite = (payload as any).website;
      }

      console.log("Updating client with payload:", payload);
      const response = await apiClient.patch(`/clients/${id}`, payload);
      console.log("Update response:", response.data);

      // Handle the standard server response format: { status: 'success', data: { client: {...} } }
      const clientDataToTransform =
        response.data.data?.client || response.data.data;

      if (!clientDataToTransform) {
        console.error("No client data in response:", response.data);
        throw new Error("No client data received from server");
      }

      return transformClientData(clientDataToTransform);
    } catch (error) {
      console.error(`Error updating client ${id}:`, error);
      throw error;
    }
  },

  // Delete a client
  deleteClient: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/clients/${id}`);
    } catch (error) {
      console.error(`Error deleting client ${id}:`, error);
      throw error;
    }
  },

  // Toggle client active status
  toggleClientStatus: async (id: string): Promise<Client> => {
    try {
      const response = await apiClient.patch(`/clients/${id}/toggle-status`);

      // Handle the standard server response format: { status: 'success', data: { client: {...} } }
      const clientDataToTransform =
        response.data.data?.client || response.data.data;

      if (!clientDataToTransform) {
        console.error("No client data in response:", response.data);
        throw new Error("No client data received from server");
      }

      return transformClientData(clientDataToTransform);
    } catch (error) {
      console.error(`Error toggling status for client ${id}:`, error);
      throw error;
    }
  },

  // Approve client
  approveClient: async (id: string): Promise<Client> => {
    try {
      const response = await apiClient.patch(`/clients/${id}/approve`);

      // Handle the standard server response format: { status: 'success', data: { client: {...} } }
      const clientDataToTransform =
        response.data.data?.client || response.data.data;

      if (!clientDataToTransform) {
        console.error("No client data in response:", response.data);
        throw new Error("No client data received from server");
      }

      return transformClientData(clientDataToTransform);
    } catch (error) {
      console.error(`Error approving client ${id}:`, error);
      throw error;
    }
  },

  // Get client by user ID
  getClientByUser: async (userId: string): Promise<Client> => {
    try {
      const response = await apiClient.get(`/clients/user/${userId}`);

      // Handle the standard server response format: { status: 'success', data: { client: {...} } }
      const clientDataToTransform =
        response.data.data?.client || response.data.data;

      if (!clientDataToTransform) {
        console.error("No client data in response:", response.data);
        throw new Error("No client data received from server");
      }

      return transformClientData(clientDataToTransform);
    } catch (error) {
      console.error("Error fetching client by user ID:", error);
      throw error;
    }
  },

  // Get client's subscriptions
  getClientSubscriptions: async (clientId: string) => {
    try {
      const response = await apiClient.get(
        `/clients/${clientId}/subscriptions`
      );
      return response.data;
    } catch (error) {
      console.error(
        `Error fetching subscriptions for client ${clientId}:`,
        error
      );
      throw error;
    }
  },

  // Update client's subscription
  updateClientSubscription: async (clientId: string, subscriptionData: any) => {
    try {
      // Use the assign endpoint which handles both create and update
      const response = await apiClient.post(
        `/admin/clients/${clientId}/subscription/assign`,
        subscriptionData
      );
      return response.data;
    } catch (error) {
      console.error(
        `Error updating subscription for client ${clientId}:`,
        error
      );
      throw error;
    }
  },

  // Get client activities
  getClientActivities: async (clientId: string) => {
    try {
      console.log(`Fetching activities for client ${clientId}...`);
      const response = await apiClient.get(`/clients/${clientId}/activities`);

      if (!response.data) {
        console.error("No activities data in response");
        return [];
      }

      // Handle the server response format
      const activities =
        response.data.data?.activities || response.data.activities || [];
      console.log("Activities fetched:", activities);

      return activities;
    } catch (error) {
      console.error(`Error fetching activities for client ${clientId}:`, error);
      throw error;
    }
  },

  // === Enhanced Client Management Methods ===

  // Get full client details including subscription, activity logs, and invoices
  getClientFullDetails: async (clientId: string) => {
    try {
      const response = await apiClient.get(
        `/admin/clients/${clientId}/full-details`
      );
      return response.data.data;
    } catch (error) {
      console.error(
        `Error fetching full details for client ${clientId}:`,
        error
      );
      throw error;
    }
  },

  // Get client activity logs with optional filters
  getClientActivityLogs: async (
    clientId: string,
    filters?: {
      actionType?: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
      skip?: number;
    }
  ) => {
    try {
      const params = new URLSearchParams();
      if (filters?.actionType) params.append("actionType", filters.actionType);
      if (filters?.startDate) params.append("startDate", filters.startDate);
      if (filters?.endDate) params.append("endDate", filters.endDate);
      if (filters?.limit) params.append("limit", filters.limit.toString());
      if (filters?.skip) params.append("skip", filters.skip.toString());

      const response = await apiClient.get(
        `/admin/clients/${clientId}/activity-logs?${params.toString()}`
      );
      return response.data.data;
    } catch (error) {
      console.error(
        `Error fetching activity logs for client ${clientId}:`,
        error
      );
      throw error;
    }
  },

  // Assign subscription to client with custom pricing
  assignSubscription: async (
    clientId: string,
    data: {
      planId: string;
      customPrice?: number;
      discount?: number;
      billingCycle: "monthly" | "quarterly" | "annually";
      startDate?: string;
      generateInvoice?: boolean;
      customFeatures?: string[];
    }
  ) => {
    try {
      const response = await apiClient.post(
        `/admin/clients/${clientId}/subscription/assign`,
        data
      );
      return response.data.data;
    } catch (error) {
      console.error(
        `Error assigning subscription to client ${clientId}:`,
        error
      );
      throw error;
    }
  },

  // Renew client subscription
  renewSubscription: async (clientId: string, months: number) => {
    try {
      const response = await apiClient.patch(
        `/admin/clients/${clientId}/subscription/renew`,
        { months }
      );
      return response.data.data;
    } catch (error) {
      console.error(
        `Error renewing subscription for client ${clientId}:`,
        error
      );
      throw error;
    }
  },

  // Cancel client subscription
  cancelSubscription: async (clientId: string, reason?: string) => {
    try {
      const response = await apiClient.delete(
        `/admin/clients/${clientId}/subscription/cancel`,
        { data: { reason } }
      );
      return response.data;
    } catch (error) {
      console.error(
        `Error cancelling subscription for client ${clientId}:`,
        error
      );
      throw error;
    }
  },

  // Assign service to client with custom pricing
  assignService: async (
    clientId: string,
    data: {
      serviceId: string;
      customPrice: number;
      discount?: number;
      isRecurring?: boolean;
      startDate?: string;
      endDate?: string;
      notes?: string;
      customFeatures?: string[];
    }
  ) => {
    try {
      const response = await apiClient.post(
        `/admin/clients/${clientId}/services/assign`,
        data
      );
      return response.data.data;
    } catch (error) {
      console.error(`Error assigning service to client ${clientId}:`, error);
      throw error;
    }
  },

  // Update assigned service
  updateService: async (
    clientId: string,
    serviceId: string,
    data: {
      customPrice?: number;
      discount?: number;
      isRecurring?: boolean;
      startDate?: string;
      endDate?: string;
      notes?: string;
      status?: "active" | "paused" | "completed" | "cancelled";
    }
  ) => {
    try {
      const response = await apiClient.patch(
        `/admin/clients/${clientId}/services/${serviceId}/update`,
        data
      );
      return response.data.data;
    } catch (error) {
      console.error(`Error updating service for client ${clientId}:`, error);
      throw error;
    }
  },

  // Remove service from client
  removeService: async (clientId: string, serviceId: string) => {
    try {
      const response = await apiClient.delete(
        `/admin/clients/${clientId}/services/${serviceId}/remove`
      );
      return response.data;
    } catch (error) {
      console.error(`Error removing service from client ${clientId}:`, error);
      throw error;
    }
  },

  // Reset client password (Admin only)
  resetClientPassword: async (
    clientId: string,
    data: { newPassword?: string; generateRandom?: boolean }
  ) => {
    try {
      const response = await apiClient.post(
        `/admin/clients/${clientId}/reset-password`,
        data
      );
      return response.data;
    } catch (error) {
      console.error(`Error resetting password for client ${clientId}:`, error);
      throw error;
    }
  },
};
