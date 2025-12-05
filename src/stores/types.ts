export * from "../types/subscriber.types";
export * from "../types/request.types";
export * from "../types/client.types";

export const STORE_VERSIONS = {
  CLIENTS: 1,
  INVOICES: 2, // Incremented to clear old cached state with invalid structure
  PLANS: 1,
  SERVICES: 1,
  USERS: 1,
  AUTH: 1,
  SUBSCRIBERS: 1,
  SERVICE_REQUESTS: 1,
};
