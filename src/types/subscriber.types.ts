export interface PaymentHistoryItem {
  amount: number;
  date: string;
  transactionId: string;
  status: "pending" | "completed" | "failed" | "refunded";
  paymentMethod: string;
  invoiceUrl?: string;
}

export interface BillingAddress {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export interface ContactPerson {
  name?: string;
  email?: string;
  phone?: string;
}

export interface BillingInfo {
  companyName?: string;
  taxId?: string;
  address?: BillingAddress;
  contactPerson?: ContactPerson;
}

export interface Preferences {
  emailNotifications?: boolean;
  invoiceEmails?: boolean;
  marketingEmails?: boolean;
}

export interface ApprovalStatus {
  approved: boolean;
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
}

export interface PaymentDetails {
  paymentDate?: string;
  paymentMethod?: string;
  transactionId?: string;
  notes?: string;
}

export interface Invoice {
  invoiceNumber?: string;
  amount?: number;
  issueDate?: string;
  dueDate?: string;
  status?: "pending" | "paid" | "overdue" | "cancelled";
  paymentDetails?: PaymentDetails;
}

export interface Plan {
  _id?: string;
  plan:
    | string
    | {
        _id: string;
        name: string;
        price: number;
      };
  startDate?: string | null;
  endDate?: string | null;
  status:
    | "pending_approval"
    | "active"
    | "expired"
    | "cancelled"
    | "rejected"
    | "suspended";
  approvalStatus?: ApprovalStatus;
  invoice?: Invoice;
  billingCycle: "monthly" | "yearly";
  price: number;
  features?: string[];
  customPrice?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  _id: string;
  name?: string;
  fName?: string;
  lName?: string;
  phone?: string;
  email: string;
  role?: string;
  avatar?: string;
  initials?: string;
  isActive?: boolean;
  isApproved?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Subscriber {
  _id: string;
  user: string | User;
  plan: Plan;
  isActive: boolean;
  notes?: string;
  status:
    | "active"
    | "inactive"
    | "suspended"
    | "cancelled"
    | "pending_approval"
    | "expired"
    | "rejected";
  planHistory?: Plan[];
  paymentHistory?: PaymentHistoryItem[];
  billingInfo?: BillingInfo;
  preferences?: Preferences;
  suspensionReason?: string;
  suspendedAt?: string;
  cancellationReason?: string;
  cancelledAt?: string;
  paymentMethod?: any;
  createdAt?: string;
  updatedAt?: string;
}
