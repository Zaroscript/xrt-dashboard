import { apiClient } from "./apiClient";
import type {
  Request,
  RequestFilters,
  RequestsResponse,
} from "@/types/request.types";

export const requestsApi = {
  async getAllRequests(filters?: RequestFilters): Promise<RequestsResponse> {
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    if (filters?.type) params.append("type", filters.type);
    if (filters?.page) params.append("page", filters.page.toString());
    if (filters?.limit) params.append("limit", filters.limit.toString());

    const response = await apiClient.get<RequestsResponse>(
      `/requests?${params.toString()}`
    );
    return response.data;
  },

  async getRequest(id: string): Promise<Request> {
    const response = await apiClient.get<{ status: string; data: Request }>(
      `/requests/${id}`
    );
    return response.data.data;
  },

  async approveRequest(id: string, adminNotes?: string): Promise<Request> {
    const response = await apiClient.patch<{ status: string; data: Request }>(
      `/requests/${id}/approve`,
      { adminNotes }
    );
    return response.data.data;
  },

  async rejectRequest(id: string, adminNotes: string): Promise<Request> {
    const response = await apiClient.patch<{ status: string; data: Request }>(
      `/requests/${id}/reject`,
      { adminNotes }
    );
    return response.data.data;
  },

  async updateRequest(
    id: string,
    data: { notes?: string; adminNotes?: string; requestedItemId?: string }
  ): Promise<Request> {
    const response = await apiClient.patch<{ status: string; data: Request }>(
      `/requests/${id}`,
      data
    );
    return response.data.data;
  },
};
