import { RefreshCw, CheckCircle2, XCircle, Clock, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ClientStats } from "@/components/clients/ClientStats";
import { ClientHeader } from "@/components/clients/ClientHeader";
import { ClientList } from "@/components/clients/ClientList";
import { ClientEmptyState } from "@/components/clients/ClientEmptyState";
import { EditClientModal } from "@/components/clients/EditClientModal";
import { AddClientDialog } from "@/components/clients/AddClientDialog";
import { useClientsStore } from "@/stores";
import { useAuthStore } from "@/stores/auth/useAuthStore";
import { useCallback, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Client, UserRef, ClientStatus } from "@/types/client.types";
import { ClientFilters } from "@/components/clients/ClientFilters";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { useCanModify } from "@/hooks/useRole";

const Clients = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const canModify = useCanModify();
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);

  // Auth store
  const { isAuthenticated, user, tokens } = useAuthStore();

  // Client store
  const {
    clients,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    fetchClients,
    deleteClient,
    updateClient,
    clearError,
    getFilteredClients,
  } = useClientsStore();

  // Local state
  const [isExporting, setIsExporting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ClientStatus | "all">("all");
  const [sortConfig, setSortConfig] = useState<{
    key: "name" | "revenue" | "createdAt";
    direction: "asc" | "desc";
  }>({ key: "name", direction: "asc" });
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  const [approvingClientId, setApprovingClientId] = useState<string | null>(
    null
  );
  const [rejectingClientId, setRejectingClientId] = useState<string | null>(
    null
  );
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [selectedClientForReject, setSelectedClientForReject] =
    useState<Client | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [clientStats, setClientStats] = useState({
    total: 0,
    active: 0,
    revenueThisMonth: 0,
    avgClientValue: 0,
    satisfaction: "0%",
  });

  // Fetch client stats on mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { clientsService } = await import(
          "@/services/api/clientsService"
        );
        const stats = await clientsService.getStats();
        setClientStats(stats);
      } catch (error) {
        console.error("Error fetching client stats:", error);
      }
    };
    fetchStats();
  }, []);

  // Computed state - use clients from store directly since filtering is server-side
  const safeClients = Array.isArray(clients) ? clients : [];

  // Fetch clients with filters when filters change
  useEffect(() => {
    const filters: any = {
      status: statusFilter !== "all" ? statusFilter : undefined,
      search: searchTerm || undefined,
      sortBy: sortConfig.key === "name" ? "companyName" : sortConfig.key,
      sortOrder: sortConfig.direction,
      pending: showPendingOnly || statusFilter === "pending",
    };

    // Remove undefined values
    Object.keys(filters).forEach(
      (key) => filters[key] === undefined && delete filters[key]
    );

    fetchClients(filters);
  }, [
    statusFilter,
    sortConfig,
    searchTerm,
    showPendingOnly,
    fetchClients,
  ]);

  // Error handling with toast
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error || "Failed to load clients. Please try again.",
        variant: "destructive",
      });
    }
  }, [error]);

  // Separate pending clients - only calculate when not filtering by pending
  const pendingClients =
    statusFilter !== "pending"
      ? safeClients.filter((client) => {
          const user = typeof client.user === "object" ? client.user : null;
          return (
            !client.isActive || (user && (user as any).isApproved === false)
          );
        })
      : [];

  // State for edit modal
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Handle successful edit
  const handleEditSuccess = useCallback(() => {
    setIsEditModalOpen(false);
    setEditingClient(null);
  }, []);

  // Handle delete client
  const handleDeleteClient = useCallback(
    async (clientId: string) => {
      try {
        await deleteClient(clientId);
        toast({
          title: "Success",
          description: "Client deleted successfully",
        });
      } catch (error: any) {
        toast({
          title: "Error",
          description: error?.message || "Failed to delete client",
          variant: "destructive",
        });
      }
    },
    [deleteClient]
  );

  // Handle edit client - open the modal
  const handleEditClient = useCallback((client: Client) => {
    setEditingClient(client as unknown as Client);
    setIsEditModalOpen(true);
  }, []);

  // Handle client update from ClientCard
  const handleClientUpdate = useCallback(
    (updatedClient: any) => {
      // Convert ClientCardType back to StoreClient for the store
      const user =
        typeof updatedClient.user === "string"
          ? {
              _id: updatedClient.user,
              email: "",
              fName: "Unknown",
              lName: "User",
              phone: "",
            }
          : updatedClient.user;

      const storeClient: Client = {
        _id: updatedClient._id,
        user: user as UserRef,
        companyName: updatedClient.companyName,
        businessLocation: updatedClient.address
          ? {
              street: updatedClient.address.street || "",
              city: updatedClient.address.city || "",
              state: updatedClient.address.state || "",
              zipCode: updatedClient.address.zipCode || "",
              country: updatedClient.address.country || "USA",
            }
          : {
              street: "",
              city: "",
              state: "",
              zipCode: "",
              country: "USA",
            },
        currentPlan: updatedClient.currentPlan,
        services: updatedClient.services || [],
        isActive: updatedClient.isActive,
        createdAt: updatedClient.createdAt,
        updatedAt: updatedClient.updatedAt,
        isClient: updatedClient.isClient,
        lastActive: updatedClient.lastActive,
        revenue: updatedClient.revenue,
        status: updatedClient.status || "active",
      };

      updateClient(storeClient._id, storeClient);
      toast({
        title: "Success",
        description: "Client updated successfully",
      });
    },
    [updateClient]
  );

  // Handle approve client
  const handleApproveClient = useCallback(
    async (clientId: string) => {
      setApprovingClientId(clientId);
      try {
        const { clientsService } = await import(
          "@/services/api/clientsService"
        );
        await clientsService.approveClient(clientId);
        toast({
          title: "Success",
          description: "Client approved successfully",
        });
        // Refetch clients with current filters
        const filters: any = {
          status: statusFilter !== "all" ? statusFilter : undefined,
          search: searchTerm || undefined,
          sortBy: sortConfig.key === "name" ? "companyName" : sortConfig.key,
          sortOrder: sortConfig.direction,
        };
        Object.keys(filters).forEach(
          (key) => filters[key] === undefined && delete filters[key]
        );
        await fetchClients(filters);
      } catch (error: any) {
        console.error("Error approving client:", error);
        toast({
          title: "Error",
          description:
            error?.response?.data?.message ||
            error?.message ||
            "Failed to approve client. Please try again.",
          variant: "destructive",
        });
      } finally {
        setApprovingClientId(null);
      }
    },
    [fetchClients, statusFilter, sortConfig, searchTerm]
  );

  // Handle reject client confirmation
  const handleRejectClick = useCallback((client: Client) => {
    setSelectedClientForReject(client);
    setShowRejectDialog(true);
  }, []);

  // Handle reject client
  const handleRejectClient = useCallback(
    async (clientId: string, reason?: string) => {
      setRejectingClientId(clientId);
      try {
        const { clientsService } = await import(
          "@/services/api/clientsService"
        );
        await clientsService.rejectClient(clientId, reason);
        toast({
          title: "Success",
          description: "Client rejected successfully",
        });
        // Refetch clients with current filters
        const filters: any = {
          status: statusFilter !== "all" ? statusFilter : undefined,
          search: searchTerm || undefined,
          sortBy: sortConfig.key === "name" ? "companyName" : sortConfig.key,
          sortOrder: sortConfig.direction,
        };
        Object.keys(filters).forEach(
          (key) => filters[key] === undefined && delete filters[key]
        );
        await fetchClients(filters);
        // Close dialog and reset state
        setShowRejectDialog(false);
        setSelectedClientForReject(null);
        setRejectReason("");
      } catch (error: any) {
        console.error("Error rejecting client:", error);
        toast({
          title: "Error",
          description:
            error?.response?.data?.message ||
            error?.message ||
            "Failed to reject client. Please try again.",
          variant: "destructive",
        });
      } finally {
        setRejectingClientId(null);
      }
    },
    [fetchClients, statusFilter, sortConfig, searchTerm]
  );

  // Handle add client
  const handleAddClient = useCallback(() => {
    setIsAddClientModalOpen(true);
  }, []);

  // Handle client added successfully
  const handleClientAdded = useCallback(() => {
    setIsAddClientModalOpen(false);
    fetchClients();
  }, [fetchClients]);

  // Handle export
  const handleExport = useCallback(() => {
    setIsExporting(true);
    try {
      const csvContent = [
        ["Name", "Email", "Company", "Status", "Created At"],
        ...safeClients.map((client) => [
          typeof client.user === "object"
            ? `${client.user.fName} ${client.user.lName}`
            : "Unknown",
          typeof client.user === "object" ? client.user.email : "Unknown",
          client.companyName || "",
          client.isActive ? "Active" : "Inactive",
          client.createdAt,
        ]),
      ]
        .map((row) => row.join(","))
        .join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `clients-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Clients exported successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export clients",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  }, [safeClients]);

  // Handle retry
  const handleRetry = useCallback(() => {
    clearError();
    fetchClients();
  }, [clearError, fetchClients]);

  if (loading && !safeClients.length) {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Loading clients..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="flex flex-col gap-4">
            <span>{error}</span>
            <Button
              onClick={handleRetry}
              variant="outline"
              className="w-fit"
              disabled={loading}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              {loading ? "Retrying..." : "Retry"}
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Use clients directly since filtering is done server-side
  const displayedClients = safeClients;

  return (
    <div className="container mx-auto p-4 space-y-6">
      <ClientHeader
        onAddClient={canModify ? handleAddClient : undefined}
        onExport={handleExport}
        isExporting={isExporting}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <ClientStats
          values={{
            total: clientStats.total,
            revenue: clientStats.revenueThisMonth,
            avgValue: clientStats.avgClientValue,
            satisfaction: clientStats.satisfaction,
            active: clientStats.active,
          }}
        />
      </motion.div>

      {/* Pending Clients Section */}
      {pendingClients.length > 0 && statusFilter !== "pending" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  <CardTitle className="text-lg">
                    Pending Client Approvals
                  </CardTitle>
                  <Badge
                    variant="secondary"
                    className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                  >
                    {pendingClients.length}
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStatusFilter("pending")}
                >
                  View All Pending
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingClients.slice(0, 3).map((client) => {
                  const user =
                    typeof client.user === "object" ? client.user : null;
                  const isPending =
                    !client.isActive || (user && user.isApproved === false);

                  return (
                    <Card key={client._id} className="border-amber-200">
                      <CardContent className="pt-4">
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-semibold">
                              {client.companyName}
                            </h4>
                            {user && (
                              <p className="text-sm text-muted-foreground">
                                {user.fName} {user.lName} • {user.email}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className="border-amber-500 text-amber-700 dark:text-amber-400"
                            >
                              Pending Approval
                            </Badge>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={() => handleApproveClient(client._id)}
                              disabled={
                                approvingClientId === client._id ||
                                rejectingClientId === client._id
                              }
                            >
                              {approvingClientId === client._id ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Approving...
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Approve
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="flex-1"
                              onClick={() => handleRejectClick(client)}
                              disabled={
                                approvingClientId === client._id ||
                                rejectingClientId === client._id
                              }
                            >
                              {rejectingClientId === client._id ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Rejecting...
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Reject
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <motion.div
        className="space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <ClientFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          sortBy={
            sortConfig.key === "name"
              ? "name"
              : sortConfig.key === "revenue"
              ? "revenue"
              : "date"
          }
          onSortChange={(value) => {
            if (value === "name")
              setSortConfig({ key: "name", direction: "asc" });
            if (value === "revenue")
              setSortConfig({ key: "revenue", direction: "desc" });
            if (value === "date")
              setSortConfig({ key: "createdAt", direction: "desc" });
          }}
          status={statusFilter}
          onStatusChange={setStatusFilter}
        />

        <AnimatePresence mode="wait">
          {displayedClients.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <ClientEmptyState
                searchTerm={searchTerm}
                onAddClient={handleAddClient}
              />
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <ClientList
                clients={displayedClients}
                onEdit={canModify ? handleEditClient : undefined}
                onDelete={
                  canModify
                    ? (client: any) => handleDeleteClient(client._id)
                    : undefined
                }
                onUpdate={canModify ? handleClientUpdate : undefined}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Edit Client Modal */}
      {editingClient && (
        <EditClientModal
          client={editingClient}
          services={[]}
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Add Client Dialog */}
      <AddClientDialog
        open={isAddClientModalOpen}
        onOpenChange={setIsAddClientModalOpen}
        onClientAdded={handleClientAdded}
      />

      {/* Reject Client Confirmation Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Client Registration</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject this client? This will deactivate
              their account and they will not be able to access the system.
              {selectedClientForReject && (
                <div className="mt-2 p-2 bg-muted rounded">
                  <p className="font-medium">
                    {selectedClientForReject.companyName}
                  </p>
                  {typeof selectedClientForReject.user === "object" &&
                    selectedClientForReject.user && (
                      <p className="text-sm text-muted-foreground">
                        {selectedClientForReject.user.fName}{" "}
                        {selectedClientForReject.user.lName} •{" "}
                        {selectedClientForReject.user.email}
                      </p>
                    )}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reject-reason">Rejection Reason (Optional)</Label>
              <Textarea
                id="reject-reason"
                placeholder="Enter a reason for rejection..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowRejectDialog(false);
                setSelectedClientForReject(null);
                setRejectReason("");
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedClientForReject) {
                  handleRejectClient(
                    selectedClientForReject._id,
                    rejectReason || undefined
                  );
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={rejectingClientId !== null}
            >
              {rejectingClientId ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Rejecting...
                </>
              ) : (
                "Reject Client"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Clients;
