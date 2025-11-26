export interface Request {
  _id: string;
  client: {
    _id: string;
    companyName: string;
  };
  user: {
    _id: string;
    email: string;
    fName: string;
    lName: string;
  };
  type: 'service' | 'plan_change';
  requestedItem: any;
  itemModel: 'Service' | 'Plan';
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  notes?: string;
  adminNotes?: string;
  processedBy?: {
    _id: string;
    fName: string;
    lName: string;
    email: string;
  };
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RequestFilters {
  status?: Request['status'];
  type?: Request['type'];
  page?: number;
  limit?: number;
}

export interface RequestsResponse {
  status: string;
  results: number;
  total: number;
  page: number;
  totalPages: number;
  data: Request[];
}
