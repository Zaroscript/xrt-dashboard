import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Filter, 
  Calendar,
  User,
  CreditCard,
  Package,
  FileText,
  ChevronDown,
  Search,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { clientsService } from '@/services/api/clientsService';
import { toast } from 'react-hot-toast';

interface ActivityLogEntry {
  _id: string;
  actionType: string;
  description: string;
  performedBy: {
    _id: string;
    name: string;
    email: string;
  };
  metadata?: Record<string, any>;
  createdAt: string;
}

interface ClientActivityLogsProps {
  clientId: string;
}

const ACTION_TYPE_OPTIONS = [
  { value: 'all', label: 'All Activities' },
  { value: 'subscription_assigned', label: 'Subscription Assigned' },
  { value: 'subscription_renewed', label: 'Subscription Renewed' },
  { value: 'subscription_cancelled', label: 'Subscription Cancelled' },
  { value: 'service_assigned', label: 'Service Assigned' },
  { value: 'service_updated', label: 'Service Updated' },
  { value: 'service_removed', label: 'Service Removed' },
  { value: 'client_updated', label: 'Client Updated' },
  { value: 'invoice_generated', label: 'Invoice Generated' },
];

const getActionIcon = (actionType: string) => {
  if (actionType.includes('subscription')) return CreditCard;
  if (actionType.includes('service')) return Package;
  if (actionType.includes('invoice')) return FileText;
  if (actionType.includes('client')) return User;
  return Activity;
};

const getActionColor = (actionType: string) => {
  if (actionType.includes('assigned')) return 'text-green-400';
  if (actionType.includes('renewed')) return 'text-blue-400';
  if (actionType.includes('cancelled')) return 'text-red-400';
  if (actionType.includes('updated')) return 'text-yellow-400';
  if (actionType.includes('removed')) return 'text-orange-400';
  if (actionType.includes('invoice')) return 'text-purple-400';
  return 'text-gray-400';
};

export const ClientActivityLogs: React.FC<ClientActivityLogsProps> = ({ clientId }) => {
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  
  // Filters
  const [actionType, setActionType] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [performedBy, setPerformedBy] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const filters: any = { page, limit: 10 };
      
      if (actionType && actionType !== 'all') {
        filters.actionType = actionType;
      }
      if (startDate) {
        filters.startDate = startDate;
      }
      if (endDate) {
        filters.endDate = endDate;
      }
      if (performedBy) {
        filters.performedBy = performedBy;
      }

      const response = await clientsService.getClientActivityLogs(clientId, filters);
      
      setLogs(response.data.logs);
      setTotalPages(response.data.pagination.totalPages);
      setTotalLogs(response.data.pagination.total);
    } catch (error: any) {
      console.error('Error fetching activity logs:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch activity logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [clientId, page, actionType, startDate, endDate, performedBy]);

  const handleResetFilters = () => {
    setActionType('all');
    setStartDate('');
    setEndDate('');
    setPerformedBy('');
    setPage(1);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Activity className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Activity Logs</h3>
            <p className="text-sm text-gray-400">
              {totalLogs} {totalLogs === 1 ? 'entry' : 'entries'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-800 
                     border border-gray-700 rounded-lg transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filters
            <ChevronDown 
              className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} 
            />
          </button>
          
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="p-2 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 
                     rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-gray-800/30 border border-gray-700 rounded-lg space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Action Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Action Type
                  </label>
                  <select
                    value={actionType}
                    onChange={(e) => {
                      setActionType(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700 
                             rounded-lg text-white focus:outline-none focus:ring-2 
                             focus:ring-blue-500"
                  >
                    {ACTION_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Start Date Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700 
                             rounded-lg text-white focus:outline-none focus:ring-2 
                             focus:ring-blue-500"
                  />
                </div>

                {/* End Date Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700 
                             rounded-lg text-white focus:outline-none focus:ring-2 
                             focus:ring-blue-500"
                  />
                </div>

                {/* Performed By Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Performed By
                  </label>
                  <input
                    type="text"
                    value={performedBy}
                    onChange={(e) => {
                      setPerformedBy(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Admin name or email"
                    className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700 
                             rounded-lg text-white placeholder-gray-500 focus:outline-none 
                             focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <button
                onClick={handleResetFilters}
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Activity Logs List */}
      <div className="space-y-3">
        {loading && logs.length === 0 ? (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 text-gray-500 animate-spin mx-auto mb-3" />
            <p className="text-gray-400">Loading activity logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No activity logs found</p>
            {(actionType !== 'all' || startDate || endDate || performedBy) && (
              <button
                onClick={handleResetFilters}
                className="mt-2 text-sm text-blue-400 hover:text-blue-300"
              >
                Clear filters to see all logs
              </button>
            )}
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {logs.map((log, index) => {
              const Icon = getActionIcon(log.actionType);
              const colorClass = getActionColor(log.actionType);

              return (
                <motion.div
                  key={log._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 bg-gray-800/30 border border-gray-700 rounded-lg 
                           hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2 bg-gray-900/50 rounded-lg ${colorClass}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <p className="text-white font-medium">{log.description}</p>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {log.performedBy.name}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(log.createdAt)}
                            </span>
                          </div>
                        </div>
                        
                        <span className="px-2 py-1 bg-gray-900/50 rounded text-xs text-gray-400 
                                     whitespace-nowrap">
                          {log.actionType.replace(/_/g, ' ')}
                        </span>
                      </div>
                      
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <div className="mt-3 p-3 bg-gray-900/30 rounded-lg">
                          <p className="text-xs text-gray-400 mb-2">Additional Details:</p>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            {Object.entries(log.metadata).map(([key, value]) => (
                              <div key={key}>
                                <span className="text-gray-500">{key}: </span>
                                <span className="text-gray-300">
                                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-700">
          <p className="text-sm text-gray-400">
            Page {page} of {totalPages}
          </p>
          
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="px-4 py-2 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 
                       rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
              className="px-4 py-2 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 
                       rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
