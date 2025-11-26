export interface Plan {
  _id: string;
  name: string;
  description?: string;
  price: number;
  monthlyPrice?: number | null;
  yearlyPrice?: number | null;
  billingCycle: 'monthly' | 'yearly';
  features: string[];
  duration?: number;
  isActive: boolean;
  isFeatured?: boolean;
  yearlySavings?: number;
  discount?: {
    type: 'percentage' | 'fixed';
    value: number;
    isActive: boolean;
    startDate?: Date;
    endDate?: Date;
    code?: string;
  };
  calculatedMonthlyPrice?: number;
  calculatedYearlyPrice?: number;
  discountedPrice?: number;
  currentPrice?: number;
  createdAt?: string;
  updatedAt?: string;
  isCustom?: boolean;
  badge?: {
    text: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
  };
  maxUsers?: number;
  maxProjects?: number;
  maxStorage?: number;
  supportLevel?: 'basic' | 'priority' | 'dedicated';
  customFeatures?: Record<string, any>;
}

export type PlanStatus = 'active' | 'inactive' | 'all';

export interface PlanFilter {
  status: PlanStatus;
  search: string;
  sortBy: 'name' | 'price' | 'createdAt';
  sortOrder: 'asc' | 'desc';
}

export interface PlanRequest {
  _id: string;
  client: {
    _id: string;
    email: string;
    fName: string;
    lName: string;
    fullName: string;
    companyName: string;
    phone: string;
  };
  plan: {
    _id: string;
    name: string;
    price: number;
  };
  status: 'pending' | 'approved' | 'rejected';
  adminNote?: string;
  createdAt: string;
}
