import { Client as ApiClient } from "../services/api/clientsService";
import { Client as AppClient, ClientStatus } from "../types/client.types";

export const mapApiClientToClient = (apiClient: ApiClient): AppClient => {
  // Build a complete address object, filling in any missing pieces
  const address = {
    street: apiClient.businessLocation?.street || "",
    city: apiClient.businessLocation?.city || "",
    state: apiClient.businessLocation?.state || "",
    zipCode:
      apiClient.businessLocation?.zipCode ||
      apiClient.businessLocation?.postalCode ||
      "",
    postalCode:
      apiClient.businessLocation?.postalCode ||
      apiClient.businessLocation?.zipCode ||
      "",
    country: apiClient.businessLocation?.country || "",
  };

  return {
    // The essential client details
    _id: apiClient._id,

    // The user's personal information
    user:
      typeof apiClient.user === "string"
        ? {
            _id: apiClient.user,
            fName: "",
            lName: "",
            email: "",
            phone: "",
          }
        : {
            _id: apiClient.user._id,
            fName: apiClient.user.fName,
            lName: apiClient.user.lName,
            email: apiClient.user.email,
            phone: apiClient.user.phone || "",
          },

    // Company-related details
    companyName: apiClient.companyName || "",
    name:
      typeof apiClient.user === "string"
        ? apiClient.user
        : `${apiClient.user.fName} ${apiClient.user.lName}`,
    email: typeof apiClient.user === "string" ? "" : apiClient.user.email,
    phone: typeof apiClient.user === "string" ? "" : apiClient.user.phone || "",
    oldWebsite: apiClient.oldWebsite || "",
    isClient: true,
    isActive: true,
    status: "active" as ClientStatus,
    lastActive: new Date().toISOString(),
    createdAt: new Date(apiClient.createdAt || Date.now()).toISOString(),
    updatedAt: new Date(apiClient.updatedAt || Date.now()).toISOString(),
    revenue: 0,
    currentPlan: apiClient.subscription?.plan || "",
    services: [],
    businessLocation: apiClient.businessLocation || {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      postalCode: "",
      country: "",
    },
    // Include subscription info if the client has one
    ...(apiClient.subscription && {
      subscription: {
        plan: apiClient.subscription.plan,
        status: apiClient.subscription.status as
          | "active"
          | "canceled"
          | "expired"
          | "pending",
        startDate: apiClient.subscription.startDate || "",
        expiresAt: apiClient.subscription.expiresAt || "",
        amount: apiClient.subscription.amount || 0,
        lastBillingDate: apiClient.subscription.lastBillingDate || "",
        nextBillingDate: apiClient.subscription.nextBillingDate || "",
        trialEndsAt: apiClient.subscription.trialEndsAt || "",
      },
    }),
  };
};
