import { useQuery } from '@tanstack/react-query';
import { clientsService } from '../services/api/clientsService';

export interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  status?: 'success' | 'pending' | 'failed';
}

export const useClientActivities = (clientId: string) => {
  return useQuery<ActivityItem[]>({
    queryKey: ['clientActivities', clientId],
    queryFn: () => clientsService.getClientActivities(clientId),
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
};
