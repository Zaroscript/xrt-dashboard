import { useState, useCallback } from 'react';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';
import type { User } from '@/store/slices/usersSlice';

export const useExportClients = () => {
  const [isExporting, setIsExporting] = useState(false);

  const exportToCSV = useCallback(async (clients: User[]) => {
    try {
      setIsExporting(true);
      
      // Prepare CSV content
      const headers = [
        'Name',
        'Email',
        'Phone',
        'Company',
        'Title',
        'Status',
        'Monthly Revenue ($)',
        'Join Date',
        'Last Active'
      ];

      const csvContent = [
        headers.join(','),
        ...clients.map(client => [
          `"${client.name?.replace(/"/g, '""') || ''}"`,
          `"${client.email || ''}"`,
          `"${client.phoneNumber || ''}"`,
          `"${client.company || ''}"`,
          `"${client.title || ''}"`,
          `"${client.status || ''}"`,
          `"${client.revenue?.toFixed(2) || '0.00'}"`,
          `"${new Date(client.joinDate || client.createdAt).toLocaleDateString()}"`,
          `"${new Date(client.lastActive).toLocaleString()}"`
        ].join(','))
      ].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, `clients_export_${new Date().toISOString().split('T')[0]}.csv`);
      
      toast.success('Clients exported successfully!');
      return true;
    } catch (error) {
      console.error('Error exporting clients:', error);
      toast.error('Failed to export clients. Please try again.');
      return false;
    } finally {
      setIsExporting(false);
    }
  }, []);

  return { isExporting, exportToCSV };
};
