import { useQuery } from '@tanstack/react-query';
import { subscriberService, SubscriberStats, SubscriberGrowthData, PlanDistributionData } from '@/services/api/subscriberService';

interface SubscriberData {
  stats: SubscriberStats;
  growth: SubscriberGrowthData[];
  planDistribution: PlanDistributionData[];
}

export const useSubscriberData = () => {
  const {
    data: subscriberData,
    isLoading,
    error,
    refetch,
  } = useQuery<SubscriberData>({
    queryKey: ['subscriberData'],
    queryFn: async () => {
      const data = await subscriberService.getAllSubscriberData();
      return data;
    },
    refetchOnWindowFocus: false,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    stats: subscriberData?.stats,
    growth: subscriberData?.growth || [],
    planDistribution: subscriberData?.planDistribution || [],
    isLoading,
    error,
    refetch,
  };
};

export default useSubscriberData;
