import { apiClient } from "./apiClient";

export interface PendingUser {
  _id: string;
  email: string;
  fName: string;
  lName: string;
  name?: string; // virtual
  companyName?: string;
  oldWebsite?: string;
  phone?: string;
  role: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  updatedAt: string;
}

export interface PendingServiceRequest {
  _id: string;
  userId: string;
  serviceType: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  updatedAt: string;
}

export interface PendingPlanRequest {
  _id: string;
  userId: string;
  planId: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  updatedAt: string;
}

// Default empty arrays for when endpoints are not available
const defaultPendingUsers: PendingUser[] = [];
const defaultPendingServiceRequests: PendingServiceRequest[] = [];
const defaultPendingPlanRequests: PendingPlanRequest[] = [];

export const adminService = {
  // Get pending users
  getPendingUsers: async (): Promise<PendingUser[]> => {
    try {
      const response = await apiClient.get("/admin/users/pending");
      return response.data.data?.users || response.data || defaultPendingUsers;
    } catch (error) {
      console.warn("Using default pending users data due to API error:", error);
      return defaultPendingUsers;
    }
  },

  // Get pending service requests
  getPendingServiceRequests: async (): Promise<PendingServiceRequest[]> => {
    try {
      const response = await apiClient.get("/admin/requests/services/pending");
      return (
        response.data.data?.requests ||
        response.data ||
        defaultPendingServiceRequests
      );
    } catch (error) {
      console.warn(
        "Using default pending service requests data due to API error:",
        error
      );
      return defaultPendingServiceRequests;
    }
  },

  // Get pending plan requests
  getPendingPlanRequests: async (): Promise<PendingPlanRequest[]> => {
    try {
      const response = await apiClient.get("/admin/requests/plans/pending");
      return (
        response.data.data?.requests ||
        response.data ||
        defaultPendingPlanRequests
      );
    } catch (error) {
      console.warn(
        "Using default pending plan requests data due to API error:",
        error
      );
      return defaultPendingPlanRequests;
    }
  },

  // Approve user
  approveUser: async (userId: string): Promise<void> => {
    try {
      await apiClient.patch(`/admin/users/approve/${userId}`);
    } catch (error) {
      console.error("Error approving user:", error);
      throw error;
    }
  },

  // Reject user (Permanent delete or soft delete depending on implementation, here we use the reject endpoint)
  rejectUser: async (userId: string): Promise<void> => {
    try {
      await apiClient.delete(`/admin/users/reject/${userId}`);
    } catch (error) {
      console.error("Error rejecting user:", error);
      throw error;
    }
  },

  // Update user status (block, suspend, activate)
  updateUserStatus: async (
    userId: string,
    status: "active" | "inactive" | "suspended" | "blocked"
  ): Promise<void> => {
    try {
      await apiClient.patch(`/admin/users/status/${userId}`, { status });
    } catch (error) {
      console.error("Error updating user status:", error);
      throw error;
    }
  },

  // Get removed users
  getRemovedUsers: async (): Promise<PendingUser[]> => {
    try {
      const response = await apiClient.get("/admin/users/removed");
      return response.data.data?.users || [];
    } catch (error) {
      console.warn("Error fetching removed users:", error);
      return [];
    }
  },

  // Soft delete user (move to removed)
  softDeleteUser: async (userId: string): Promise<void> => {
    try {
      await apiClient.patch(`/admin/users/soft-delete/${userId}`);
    } catch (error) {
      console.error("Error soft deleting user:", error);
      throw error;
    }
  },

  // Permanently delete user
  deleteUserPermanently: async (userId: string): Promise<void> => {
    try {
      await apiClient.delete(`/admin/users/permanent/${userId}`);
    } catch (error) {
      console.error("Error permanently deleting user:", error);
      throw error;
    }
  },

  // Approve service request
  approveServiceRequest: async (requestId: string): Promise<void> => {
    try {
      await apiClient.patch(`/admin/requests/services/${requestId}`, {
        status: "approved",
      });
    } catch (error) {
      console.error("Error approving service request:", error);
      throw error;
    }
  },

  // Reject service request
  rejectServiceRequest: async (requestId: string): Promise<void> => {
    try {
      await apiClient.patch(`/admin/requests/services/${requestId}`, {
        status: "rejected",
      });
    } catch (error) {
      console.error("Error rejecting service request:", error);
      throw error;
    }
  },

  // Approve plan request
  approvePlanRequest: async (requestId: string): Promise<void> => {
    try {
      await apiClient.patch(`/admin/requests/plans/${requestId}`, {
        status: "approved",
      });
    } catch (error) {
      console.error("Error approving plan request:", error);
      throw error;
    }
  },

  // Reject plan request
  rejectPlanRequest: async (requestId: string): Promise<void> => {
    try {
      await apiClient.patch(`/admin/requests/plans/${requestId}`, {
        status: "rejected",
      });
    } catch (error) {
      console.error("Error rejecting plan request:", error);
      throw error;
    }
  },

  // Moderators
  getModerators: async (): Promise<any[]> => {
    const response = await apiClient.get("/admin/users/moderators");
    return response.data.data.moderators;
  },

  createModerator: async (data: {
    name: string;
    email: string;
    password?: string;
  }): Promise<any> => {
    const response = await apiClient.post("/admin/users/moderator", data);
    return response.data.data.moderator;
  },

  updateModerator: async (
    id: string,
    data: { name?: string; email?: string; password?: string }
  ): Promise<any> => {
    const response = await apiClient.patch(
      `/admin/users/moderator/${id}`,
      data
    );
    return response.data.data.moderator;
  },

  deleteModerator: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/users/moderator/${id}`);
  },
};

export default adminService;
