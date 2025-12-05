export interface Service {
  _id: string;
  name: string;
  description: string;
  category: string;
  features: string[];
  process: string[];
  basePrice: number;
  isActive: boolean;
  discount: {
    amount: number;
    isActive: boolean;
    startDate?: Date;
    endDate?: Date;
    code?: string;
  };
  discountedPrice: number;
  currentPrice: number;
  createdAt: string;
  updatedAt: string;
}

export interface AssignedService {
  _id: string;
  service:
    | {
        _id: string;
        name: string;
        description?: string;
        basePrice: number;
      }
    | string; // Sometimes we just have the ID, other times the whole object
  customPrice?: number;
  discount?: number;
  isRecurring?: boolean;
  startDate: string;
  endDate?: string;
  notes?: string;
  status: string;
}

// Types for features and process steps
export interface FeatureItem {
  id?: string;
  title: string;
  description?: string;
}

export interface ProcessItem {
  id?: string;
  title: string;
  description?: string;
}

// Form data that matches what our UI expects and what the API accepts
export interface ServiceFormData {
  _id?: string;
  name: string;
  description: string;
  category: string;
  basePrice: number;
  status: "active" | "inactive";
  features: (string | FeatureItem)[];
  process: (string | ProcessItem)[];
  discount: {
    amount: number;
    isActive: boolean;
    startDate?: Date;
    endDate?: Date;
    code?: string;
  };
  discountedPrice: number;
  currentPrice?: number;
}
