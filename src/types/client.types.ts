export type ClientStatus =
  | "active"
  | "inactive"
  | "pending"
  | "blocked"
  | "rejected"
  | "suspended";

export interface UserRef {
  _id: string;
  email: string;
  fName: string;
  lName: string;
  phone?: string;
  role?: string;
  isActive?: boolean;
  avatar?: string;
  plainPassword?: string;
  status?: string;
}

export interface ServiceRef {
  _id: string;
  name: string;
  description?: string;
  price?: number;
  duration?: number;
  isActive?: boolean;
}

export interface PlanRef {
  _id: string;
  name: string;
  price: number;
  description?: string;
  features?: string[];
  isActive?: boolean;
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  zipCode?: string;
}

export interface Client {
  _id: string;
  user: UserRef | string;
  companyName: string;
  businessLocation: Address;
  oldWebsite?: string;
  taxId?: string;
  notes?: string;
  isActive: boolean;
  isClient: boolean;
  lastActive: string;
  revenue: number;
  createdAt: string;
  updatedAt: string;
  services?: Array<ServiceRef | string>;
  currentPlan?: PlanRef | string;
  subscription?: {
    plan: PlanRef | string;
    status: "active" | "cancelled" | "expired" | "pending";
    amount: number;
    startDate: string;
    expiresAt: string;
    billingCycle?: "monthly" | "yearly";
    lastBillingDate?: string;
    nextBillingDate?: string;
    trialEndsAt?: string;
  };
  status?: string;
  email?: string;
  name?: string;
  phone?: string;
}

export interface StatItem {
  label: string;
  value: string | number;
  icon: any;
  color: string;
  description: string;
}
