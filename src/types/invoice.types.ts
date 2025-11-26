export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
  amount?: number;
}

export interface InvoiceClient {
  _id: string;
  companyName: string;
  email: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
}

export interface InvoiceUser {
  _id: string;
  fName: string;
  lName: string;
  email: string;
  phone?: string;
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export interface Invoice {
  _id: string;
  invoiceNumber: string;
  client: string | InvoiceClient;
  user: string | InvoiceUser;
  items: InvoiceItem[];
  issueDate: string | Date;
  dueDate: string | Date;
  subtotal: number;
  tax: number;
  total: number;
  status: InvoiceStatus;
  notes?: string;
  terms?: string;
  paidAt?: string | Date;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  
  // For UI purposes
  id?: string;
  userName?: string;
  userEmail?: string;
  amount?: number;
  description?: string;
  userId?: string;
}

export interface InvoiceFormData extends Omit<Partial<Invoice>, 'items' | 'client' | 'user'> {
  items: Array<Partial<InvoiceItem>>;
  client: string;
  user: string;
}
