import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';

interface Service {
  _id: string;
  name: string;
  description: string;
  basePrice: number;
  features: string[];
  isActive: boolean;
}

export function useServices() {
  const { toast } = useToast();
  
  const fetchServices = async (): Promise<Service[]> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/v1/services', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          // Handle unauthorized
          throw new Error('Session expired. Please log in again.');
        }
        throw new Error(`Failed to fetch services: ${response.statusText}`);
      }
      
      const data = await response.json();
      return Array.isArray(data.data) ? data.data : [];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load services';
      console.error('Error fetching services:', error);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return [];
    }
  };

  const { data: services = [], isLoading, error } = useQuery<Service[]>({
    queryKey: ['services'],
    queryFn: fetchServices,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  return {
    services: Array.isArray(services) ? services : [],
    loading: isLoading,
    error,
  };
}
