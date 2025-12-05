import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsService } from '@/services/api/clientsService';
import { toast } from '@/components/ui/use-toast';

export interface Client {
  _id: string;
  fname: string;
  lname: string;
  email: string;
  phone?: string;
  company?: string;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  updatedAt: string;
  // Add any additional client properties as needed
}

export const useClientsData = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'revenue' | 'date'>('name');
  const queryClient = useQueryClient();

  // Fetch clients using React Query
  const { data: clientsData, isLoading, error } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsService.getClients(),
  });

  // Normalize clients data to always be an array
  const clients = useMemo(() => {
    if (!clientsData) return [];
    // Handle the response format from clientsService: { status: 'success', data: { clients: [...] } }
    if (clientsData && typeof clientsData === 'object' && 'data' in clientsData) {
      const responseData = clientsData.data as any;
      if (responseData && 'clients' in responseData) {
        return Array.isArray(responseData.clients) ? responseData.clients : [];
      }
    }
    return Array.isArray(clientsData) ? clientsData : [];
  }, [clientsData]);

  // Update client mutation
  const updateClientMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Client> }) =>
      clientsService.updateClient(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({
        title: 'Success',
        description: 'Client updated successfully',
      });
    },
    onError: (error) => {
      console.error('Error updating client:', error);
      toast({
        title: 'Error',
        description: 'Failed to update client. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const filteredClients = useMemo(() => {
    if (!Array.isArray(clients)) return [];
    
    return clients
      .filter(c => {
        if (!c) return false;
        if (!searchTerm) return true;
        
        const searchLower = searchTerm.toLowerCase();
        const fullName = `${c.fname || ''} ${c.lname || ''}`.toLowerCase();
        
        return (
          fullName.includes(searchLower) || 
          (c.email && c.email.toLowerCase().includes(searchLower)) ||
          (c.phone && c.phone.toString().toLowerCase().includes(searchLower)) ||
          (c.company && c.company.toLowerCase().includes(searchLower))
        );
      })
      .sort((a, b) => {
        if (!a || !b) return 0;
        
        switch (sortBy) {
          case 'name':
            return `${a.fname || ''} ${a.lname || ''}`.localeCompare(`${b.fname || ''} ${b.lname || ''}`);
          case 'revenue':
            // Fallback to 0 if revenue data is not available
            return 0;
          case 'date':
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          default:
            return 0;
        }
      });
  }, [clients, searchTerm, sortBy]);

  const totalRevenue = useMemo(() => 
    Array.isArray(clients) 
      ? clients.reduce((sum, c) => sum + (c.status === 'active' ? 1 : 0), 0)
      : 0, 
    [clients]
  );

  const avgClientValue = useMemo(() => {
    if (!Array.isArray(clients) || clients.length === 0) return 0;
    return totalRevenue / clients.length;
  }, [totalRevenue, clients]);
  const handleClientUpdate = (updatedClient: Client) => {
    // Handle client update logic
  };

  // Additional states and handlers for Clients.tsx compatibility
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [pendingUsers, setPendingUsers] = useState([]);
  const [isLoadingPendingUsers, setIsLoadingPendingUsers] = useState(false);

  const isError = !!error;
  
  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const handleSortChange = (value: 'name' | 'revenue' | 'date') => {
    setSortBy(value);
  };

  const handleDeleteClient = async (clientId: string) => {
    setIsDeleting(true);
    try {
      await clientsService.deleteClient(clientId);
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    } catch (error) {
      console.error('Error deleting client:', error);
      setErrorMessage('Failed to delete client');
      setShowError(true);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Export logic here
    } catch (error) {
      console.error('Error exporting clients:', error);
      setErrorMessage('Failed to export clients');
      setShowError(true);
    } finally {
      setIsExporting(false);
    }
  };

  const handleRetry = () => {
    setShowError(false);
    setErrorMessage('');
    queryClient.invalidateQueries({ queryKey: ['clients'] });
  };

  const refetchClients = () => {
    queryClient.invalidateQueries({ queryKey: ['clients'] });
  };

  const onApproveUser = async (userId: string) => {
    try {
      // Approve user logic here
    } catch (error) {
      console.error('Error approving user:', error);
    }
  };

  const onRejectUser = async (userId: string) => {
    try {
      // Reject user logic here
    } catch (error) {
      console.error('Error rejecting user:', error);
    }
  };

  return { 
    // Original properties
    clients, 
    searchTerm, 
    setSearchTerm, 
    sortBy, 
    setSortBy, 
    filteredClients, 
    totalRevenue, 
    avgClientValue,
    handleClientUpdate,
    updateClientMutation,
    
    // Additional properties for Clients.tsx compatibility
    isLoading,
    isError,
    isDeleting,
    isExporting,
    showError,
    errorMessage,
    pendingUsers,
    isLoadingPendingUsers,
    
    // Handlers
    handleSearch,
    handleSortChange,
    handleDeleteClient,
    handleExport,
    handleRetry,
    refetchClients,
    onApproveUser,
    onRejectUser,
    onClientUpdate: handleClientUpdate,
  };
};

export default useClientsData;

