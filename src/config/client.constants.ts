import { Users, DollarSign, BarChart, Star } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export type ClientStatKey = 'total' | 'revenue' | 'avgValue' | 'satisfaction';

export interface ClientStat {
  label: string;
  valueKey: ClientStatKey;
  icon: LucideIcon;
  color: string;
  format: (value: any) => string | number;
}

export const CLIENT_STATS: ClientStat[] = [
  {
    label: 'Total Clients',
    valueKey: 'total',
    icon: Users,
    color: 'bg-blue-500/10 text-blue-500',
    format: (value: number) => value || 0
  },
  {
    label: 'Total Revenue',
    valueKey: 'revenue',
    icon: DollarSign,
    color: 'bg-green-500/10 text-green-500',
    format: (value: number) => {
      if (!value) return '$0';
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
      }).format(value);
    }
  },
  {
    label: 'Avg. Value',
    valueKey: 'avgValue',
    icon: BarChart,
    color: 'bg-purple-500/10 text-purple-500',
    format: (value: number) => {
      if (!value) return '$0';
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
      }).format(value);
    }
  },
  {
    label: 'Satisfaction',
    valueKey: 'satisfaction',
    icon: Star,
    color: 'bg-yellow-500/10 text-yellow-500',
    format: (value: string) => value || 'N/A'
  }
];
