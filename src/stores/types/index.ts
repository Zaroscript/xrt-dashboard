// Common store types and interfaces
import type {
  UserRef,
  Address,
  ServiceRef,
  PlanRef,
} from "@/types/client.types";
import type { Plan } from "@/types/plan";

// Re-export UserRef for use in components
export type { UserRef };

export interface User {
  _id: string;
  email: string;
  password?: string;
  fName: string;
  lName: string;
  companyName: string;
  phone: string;
  oldWebsite?: string;
  role: "super_admin" | "moderator" | "client" | "subscriber";
  isApproved: boolean;
  isActive: boolean;
  refreshTokens: Array<{ token: string; createdAt: Date }>;
  createdAt: string;
  updatedAt: string;
  permissions?: string[];
  avatar?: string;
  initials?: string;
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
  services?: Array<ServiceRef | string>;
  currentPlan?: PlanRef | string;
  subscription?: {
    plan: PlanRef | string;
    status: "active" | "cancelled" | "expired" | "pending";
    amount: number;
    startDate: string;
    expiresAt: string;
    billingCycle?: "monthly" | "yearly";
  };
  createdAt: string;
  updatedAt: string;
  fullAddress?: string;
  isClient?: boolean;
  lastActive?: string;
  revenue?: number;
  status?: string;
}

export interface Service {
  _id: string;
  name: string;
  description: string;
  category?: string;
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
  currentPrice?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  _id: string;
  client: Client | string;
  service: Service | string;
  plan: Plan | string;
  startDate: Date;
  endDate: Date;
  status: "active" | "canceled" | "expired" | "pending";
  autoRenew: boolean;
  price: number;
  billingCycle: "monthly" | "quarterly" | "annually";
  nextBillingDate: Date;
  paymentMethod: string;
  transactions: Array<Transaction | string>;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  durationInDays?: number;
  isActive?: boolean;
}

export interface Transaction {
  _id: string;
  subscription: Subscription | string;
  client: Client | string;
  amount: number;
  currency: string;
  paymentMethod: string;
  paymentIntentId: string;
  status: "pending" | "succeeded" | "failed" | "refunded" | "disputed";
  description?: string;
  billingPeriod?: {
    start: Date;
    end: Date;
  };
  metadata: Map<string, string>;
  receiptUrl?: string;
  invoiceId?: string;
  refundedAmount: number;
  refundReason?: string;
  createdAt: string;
  updatedAt: string;
  netAmount?: number;
  ageInDays?: number;
}

export interface Invoice {
  _id: string;
  invoiceNumber: string;
  client: Client | string;
  user: User | string;
  issueDate: Date;
  dueDate: Date;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  notes?: string;
  terms?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Ticket {
  _id: string;
  title: string;
  message: string;
  user: User | string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  category?: string;
  responses: Array<{
    message: string;
    user: User | string;
    isAdmin: boolean;
    createdAt: Date;
  }>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  _id: string;
  title: string;
  description: string;
  user: User | string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  category?: string;
  images: string[];
  technologies: string[];
  startDate?: Date;
  endDate?: Date;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceRequest {
  _id: string;
  client: User | string;
  service: Service | string;
  customPrice?: number;
  status: "pending" | "approved" | "rejected" | "modified";
  adminNote?: string;
  requestedAt: Date;
  respondedAt?: Date;
  createdAt: string;
  updatedAt: string;
}

export interface PlanRequest {
  _id: string;
  client: User | string;
  plan: Plan | string;
  status: "pending" | "approved" | "rejected";
  adminNote?: string;
  requestedAt: Date;
  respondedAt?: Date;
  createdAt: string;
  updatedAt: string;
}

export interface Subscriber {
  _id: string;
  user: User | string;
  plan: {
    _id: string;
    plan: Plan | string;
    startDate?: Date;
    endDate?: Date;
    status:
      | "pending_approval"
      | "active"
      | "expired"
      | "cancelled"
      | "rejected"
      | "suspended";
    approvalStatus: {
      approved: boolean;
      approvedBy?: User | string;
      approvedAt?: Date;
      notes?: string;
    };
    invoice?: {
      invoiceNumber?: string;
      amount?: number;
      issueDate?: Date;
      dueDate?: Date;
      status?: string;
    };
  };
  billingCycle?: string;
  price?: number;
  features?: any[];
  notes?: string;
  status:
    | "active"
    | "inactive"
    | "suspended"
    | "pending_approval"
    | "expired"
    | "cancelled"
    | "rejected"
    | "pending";
  suspensionReason?: string;
  cancellationReason?: string;
  paymentMethod?: string;
  subscriptionHistory: any[];
  paymentHistory: Array<{
    amount: number;
    date: Date;
    transactionId?: string;
    status: "pending" | "completed" | "failed" | "refunded";
    paymentMethod?: string;
    invoiceUrl?: string;
  }>;
  billingInfo: {
    companyName?: string;
    taxId?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      country?: string;
      postalCode?: string;
    };
    contactPerson?: {
      name?: string;
      email?: string;
      phone?: string;
    };
  };
  preferences: {
    emailNotifications?: boolean;
    invoiceEmails?: boolean;
    marketingEmails?: boolean;
  };
  createdAt: string;
  updatedAt: string;
  isSubscriptionActive?: boolean;
}

export interface Tokens {
  accessToken: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// Utility types for store actions
type StoreActions<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? T[K] : never;
};

// Store versioning
export const STORE_VERSIONS = {
  AUTH: 1,
  USERS: 1,
  CLIENTS: 1,
  SERVICES: 1,
  PLANS: 1,
  SUBSCRIPTIONS: 1,
  TRANSACTIONS: 1,
  INVOICES: 1,
  TICKETS: 1,
  PROJECTS: 1,
  SERVICE_REQUESTS: 1,
  PLAN_REQUESTS: 1,
  SUBSCRIBERS: 1,
  SETTINGS: 1,
  UI: 1,
} as const;
