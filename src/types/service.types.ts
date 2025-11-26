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