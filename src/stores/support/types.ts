export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  details?: string;
}

export interface UserAddress {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

export interface Invoice {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  description: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  dueDate: string;
  createdAt: string;
  paidAt?: string;
  items?: InvoiceItem[];
  subtotal?: number;
  taxAmount?: number;
  discountAmount?: number;
  userAddress?: UserAddress;
  notes?: string;
}

export interface SupportState {
  invoices: Invoice[];
  selectedInvoiceId: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface SupportActions {
  setInvoices: (invoices: Invoice[]) => void;
  addInvoice: (invoice: Invoice) => void;
  updateInvoice: (id: string, updates: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
  setSelectedInvoice: (id: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export type SupportStore = SupportState & SupportActions;

export const initialSupportState: SupportState = {
  invoices: [],
  selectedInvoiceId: null,
  isLoading: false,
  error: null,
};
