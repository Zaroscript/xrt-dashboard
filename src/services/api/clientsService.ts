import { apiClient } from "./apiClient";
import type {
  Client as ClientType,
  UserRef,
  ServiceRef,
  PlanRef,
  Address,
} from "@/types/client.types";

export type Client = ClientType;

// Make the API data look like what our app expects
const transformClientData = (data: any): Client | null => {
  if (!data) {
    console.error("No data provided to transform");
    return null;
  }

  // Get user data safely, no matter how it's structured
  const getUserProp = (prop: string) => {
    if (data.user && typeof data.user === "object") {
      return (data.user as any)[prop];
    }
    return (data as any)[prop];
  };

  // Find the user ID - it could be hiding in different places
  const userId =
    (data.user && typeof data.user === "object" ? data.user._id : null) ||
    (typeof data.user === "string" ? data.user : null) ||
    data.userId ||
    data._id;

  // Build a proper user object we can use
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
    status: getUserProp("status"),
    isApproved: getUserProp("isApproved"),
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

  // Preserve the populated user object if it exists, otherwise use the constructed user
  const finalUser =
    data.user && typeof data.user === "object" && data.user._id
      ? (data.user as UserRef) // Keep the populated user object from backend
      : user; // Use the constructed user as fallback

  // Merge user and client data, with client data taking precedence
  const client: Client = {
    // Spread client data first (overwrites any user data)
    ...data,
    // Then add user data for missing fields
    _id: data._id || userId || "",
    user: finalUser, // Keep the populated user object with all properties

    // Ensure companyName is set
    companyName: data.companyName || displayName,

    // Merge contact information (prefer client data, fall back to user data)
    email: data.email || finalUser.email || "",
    phone: data.phone || finalUser.phone || "",

    // Add display name
    name: displayName,

    // Handle address - use businessLocation if available
    address: data.businessLocation
      ? {
          street: data.businessLocation.address || "",
          city: data.businessLocation.city || "",
          state: data.businessLocation.state || "",
          zipCode: data.businessLocation.zipCode || "",
          country: data.businessLocation.country || "USA",
        }
      : address,

    // Handle services
    services: data.services || [],

    // Handle current plan
    currentPlan: data.currentPlan || null,

    // Handle subscription
    subscription: data.subscription || null,

    // Add any additional client-specific fields
    taxId: data.taxId || "",
    isActive: data.isActive !== undefined ? data.isActive : true,

    // Ensure businessLocation is preserved
    businessLocation: data.businessLocation || undefined,
  };

  return client;
};

export const clientsService = {
  // Get all clients with optional filtering
  getClients: async (filters?: {
    status?: string;
    search?: string;
    tier?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    page?: number;
    limit?: number;
    pending?: boolean;
  }): Promise<{
    clients: Client[];
    total: number;
    page: number;
    totalPages: number;
  }> => {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (filters?.status) params.append("status", filters.status);
      if (filters?.search) params.append("search", filters.search);
      if (filters?.tier) params.append("tier", filters.tier);
      if (filters?.sortBy) params.append("sortBy", filters.sortBy);
      if (filters?.sortOrder) params.append("sortOrder", filters.sortOrder);
      if (filters?.page) params.append("page", filters.page.toString());
      if (filters?.limit) params.append("limit", filters.limit.toString());
      if (filters?.pending !== undefined)
        params.append("pending", filters.pending.toString());

      const queryString = params.toString();
      const url = queryString ? `/clients?${queryString}` : "/clients";

      const response = await apiClient.get(url);

      // Handle the server response format
      if (!response.data) {
        console.error("No data in response");
        return { clients: [], total: 0, page: 1, totalPages: 0 };
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
        return { clients: [], total: 0, page: 1, totalPages: 0 };
      }

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

      // Extract pagination info from response
      const total =
        response.data.total ||
        response.data.data?.total ||
        transformedClients.length;
      const page = response.data.page || response.data.data?.page || 1;
      const totalPages =
        response.data.totalPages || response.data.data?.totalPages || 1;

      return {
        clients: transformedClients,
        total,
        page,
        totalPages,
      };
    } catch (error) {
      console.error("Error fetching clients:", error);
      throw error;
    }
  },

  // Get client stats
  getStats: async () => {
    try {
      const response = await apiClient.get("/clients/stats");
      return response.data.data;
    } catch (error) {
      console.error("Error fetching client stats:", error);
      throw error;
    }
  },

  // Get a single client by ID
  getClient: async (id: string): Promise<Client> => {
    try {
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

      const response = await apiClient.patch(`/clients/${id}`, payload);

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

  // Reject client
  rejectClient: async (id: string, reason?: string): Promise<Client> => {
    try {
      const response = await apiClient.patch(`/clients/${id}/reject`, {
        reason,
      });

      // Handle the standard server response format: { status: 'success', data: { client: {...} } }
      const clientDataToTransform =
        response.data.data?.client || response.data.data;

      if (!clientDataToTransform) {
        console.error("No client data in response:", response.data);
        throw new Error("No client data received from server");
      }

      return transformClientData(clientDataToTransform);
    } catch (error) {
      console.error(`Error rejecting client ${id}:`, error);
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
      const response = await apiClient.get(`/clients/${clientId}/activities`);

      if (!response.data) {
        console.error("No activities data in response");
        return [];
      }

      // Handle the server response format
      const activities =
        response.data.data?.activities || response.data.activities || [];

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
      endDate?: string;
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
    } catch (error: any) {
      console.error(
        `[clientsService] Error assigning subscription to client ${clientId}:`,
        error
      );
      console.error(`[clientsService] Error response:`, error.response?.data);
      console.error(`[clientsService] Error status:`, error.response?.status);
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
