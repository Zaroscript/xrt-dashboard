import { AssignedService } from "@/types/service.types";

// These functions help us work with service data safely, avoiding errors when data might be missing
export const isServicePopulated = (
  service: AssignedService["service"]
): service is {
  _id: string;
  name: string;
  description?: string;
  basePrice: number;
} => {
  return typeof service === "object" && service !== null && "name" in service;
};

export const getServicePrice = (service: AssignedService): number => {
  if (isServicePopulated(service.service)) {
    return service.service.basePrice;
  }
  return service.customPrice || 0;
};

export const getServiceName = (service: AssignedService): string => {
  if (isServicePopulated(service.service)) {
    return service.service?.name;
  }
  return "Unknown Service";
};

export const getServiceId = (service: AssignedService): string => {
  if (isServicePopulated(service.service)) {
    return service.service._id;
  }
  return typeof service.service === "string" ? service.service : "";
};

export const calculateFinalPrice = (service: AssignedService) => {
  const basePrice = service.customPrice || getServicePrice(service);
  const discount = service.discount || 0;
  const discountAmount = (basePrice * discount) / 100;
  return basePrice - discountAmount;
};

export const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case "active":
      return "text-green-400 bg-green-400/10";
    case "inactive":
      return "text-gray-400 bg-gray-400/10";
    case "suspended":
      return "text-red-400 bg-red-400/10";
    default:
      return "text-yellow-400 bg-yellow-400/10";
  }
};

// Get the display name for a feature or process item, with a nice fallback
export const getItemDisplayText = (
  item: string | { title?: string; description?: string },
  index: number
): string => {
  if (typeof item === "string") return item;
  return item.title || item.description || `Item ${index + 1}`;
};
