'use client';

import { useState, useEffect } from 'react';
import { requestsApi } from '@/services/api/requestsApi';
import type { Request } from '@/types/request.types';
import { toast } from 'react-hot-toast';
import { RequestCard } from '@/components/requests/RequestCard';
import { RequestDetailsModal } from '@/components/requests/RequestDetailsModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Filter } from 'lucide-react';

export default function RequestsPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const filterParam = filter === 'all' ? undefined : filter;
      const response = await requestsApi.getAllRequests({ status: filterParam as any });
      setRequests(response.data);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleViewRequest = (request: Request) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
  };

  const handleApprove = async (id: string, notes?: string) => {
    try {
      await requestsApi.approveRequest(id, notes);
      toast.success('Request approved successfully');
      fetchRequests();
    } catch (error: any) {
      console.error('Error approving request:', error);
      toast.error(error.response?.data?.message || 'Failed to approve request');
    }
  };

  const handleReject = async (id: string, notes: string) => {
    try {
      await requestsApi.rejectRequest(id, notes);
      toast.success('Request rejected');
      fetchRequests();
    } catch (error: any) {
      console.error('Error rejecting request:', error);
      toast.error(error.response?.data?.message || 'Failed to reject request');
    }
  };

  const handleUpdate = async (id: string, data: { adminNotes?: string }) => {
    try {
      await requestsApi.updateRequest(id, data);
      toast.success('Request updated successfully');
      fetchRequests();
    } catch (error: any) {
      console.error('Error updating request:', error);
      toast.error(error.response?.data?.message || 'Failed to update request');
    }
  };

  const handleQuickApprove = async (id: string) => {
    if (!confirm('Are you sure you want to approve this request?')) return;
    await handleApprove(id);
  };

  const handleQuickReject = async (id: string) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;
    await handleReject(id, reason);
  };

  const filteredRequests = requests.filter(request => {
    const searchLower = searchTerm.toLowerCase();
    return (
      request.client.companyName.toLowerCase().includes(searchLower) ||
      request.user.fName.toLowerCase().includes(searchLower) ||
      request.user.lName.toLowerCase().includes(searchLower) ||
      request.requestedItem?.name?.toLowerCase().includes(searchLower) ||
      request.notes?.toLowerCase().includes(searchLower)
    );
  });

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const rejectedCount = requests.filter(r => r.status === 'rejected').length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Client Requests</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage service and plan change requests from clients
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Search by company, client name, or requested item..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs/Filters */}
      <Tabs value={filter} onValueChange={(value: any) => setFilter(value)} className="mb-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending" className="relative">
            Pending
            {pendingCount > 0 && (
              <span className="ml-2 bg-yellow-500 text-white text-xs rounded-full px-2 py-0.5">
                {pendingCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved" className="relative">
            Approved
            {approvedCount > 0 && (
              <span className="ml-2 bg-green-500 text-white text-xs rounded-full px-2 py-0.5">
                {approvedCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="rejected" className="relative">
            Rejected
            {rejectedCount > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                {rejectedCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="all">All Requests</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Requests Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100"></div>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
          <Filter className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
            No requests found
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {searchTerm
              ? 'Try adjusting your search terms'
              : `No ${filter === 'all' ? '' : filter} requests at this time`}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredRequests.map((request) => (
            <RequestCard
              key={request._id}
              request={request}
              onView={handleViewRequest}
              onApprove={handleQuickApprove}
              onReject={handleQuickReject}
            />
          ))}
        </div>
      )}

      {/* Details Modal */}
      <RequestDetailsModal
        request={selectedRequest}
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedRequest(null);
        }}
        onApprove={handleApprove}
        onReject={handleReject}
        onUpdate={handleUpdate}
      />
    </div>
  );
}
