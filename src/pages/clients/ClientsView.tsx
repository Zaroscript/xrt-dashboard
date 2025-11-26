import { RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FullPageLoader } from "@/components/ui/loading-spinner";
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
import { ClientFilters, ClientTier } from "@/components/clients/ClientFilters";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { useCanModify } from "@/hooks/useRole";

export const ClientsView = () => {
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
  const [tierFilter, setTierFilter] = useState<ClientTier | "all">("all");
  const [sortConfig, setSortConfig] = useState<{
    key: "name" | "revenue" | "createdAt";
    direction: "asc" | "desc";
  }>({ key: "name", direction: "asc" });

  // Computed state
  const filteredClients = getFilteredClients();

  // Initialize data
  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Error handling with toast
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error || "Failed to load clients. Please try again.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // Ensure clients is always an array
  const safeClients = Array.isArray(filteredClients) ? filteredClients : [];

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
    [deleteClient, toast]
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
    [updateClient, toast]
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
  }, [safeClients, toast]);

  // Handle retry
  const handleRetry = useCallback(() => {
    clearError();
    fetchClients();
  }, [clearError, fetchClients]);

  if (loading && !safeClients.length) {
    return <FullPageLoader />;
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

  // Filter clients based on status and tier
  const displayedClients = safeClients
    .filter((client) => {
      // Status dropdown filtering
      // Handle different status sources: client.status, user.status, or derive from isActive
      let clientStatus = "inactive";
      if (client.status) {
        clientStatus = client.status;
      } else if (typeof client.user === "object" && client.user?.status) {
        clientStatus = client.user.status;
      } else if (client.isActive) {
        clientStatus = "active";
      }

      const matchesStatus =
        statusFilter === "all" || clientStatus === statusFilter;

      // Tier dropdown filtering - check plan name more intelligently
      let matchesTier = tierFilter === "all";

      if (
        !matchesTier &&
        client.currentPlan &&
        typeof client.currentPlan === "object"
      ) {
        const planName = client.currentPlan.name?.toLowerCase() || "";
        const tierLower = tierFilter.toLowerCase();

        // Check if plan name contains the tier OR if it's an exact match
        matchesTier = planName.includes(tierLower) || planName === tierLower;

        // Also handle cases where tier might be in a different format
        // e.g., "Basic Plan" should match "basic"
        if (!matchesTier && tierFilter !== "all") {
          matchesTier =
            planName.startsWith(tierLower) || planName.endsWith(tierLower);
        }
      }

      return matchesStatus && matchesTier;
    })
    .sort((a, b) => {
      // Sorting
      let aValue: any;
      let bValue: any;

      if (sortConfig.key === "revenue") {
        aValue = a.revenue || 0;
        bValue = b.revenue || 0;
      } else if (sortConfig.key === "createdAt") {
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
      } else {
        // Sort by name
        aValue =
          typeof a.user === "object"
            ? `${a.user.fName} ${a.user.lName}`.toLowerCase()
            : (a.companyName || "").toLowerCase();
        bValue =
          typeof b.user === "object"
            ? `${b.user.fName} ${b.user.lName}`.toLowerCase()
            : (b.companyName || "").toLowerCase();
      }

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

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
            total: safeClients.length,
            revenue: safeClients.reduce((sum, client) => {
              return (
                sum +
                (client.currentPlan && typeof client.currentPlan === "object"
                  ? client.currentPlan.price || 0
                  : 0)
              );
            }, 0),
            avgValue:
              safeClients.length > 0
                ? safeClients.reduce((sum, client) => {
                    return (
                      sum +
                      (client.currentPlan &&
                      typeof client.currentPlan === "object"
                        ? client.currentPlan.price || 0
                        : 0)
                    );
                  }, 0) / safeClients.length
                : 0,
            satisfaction:
              safeClients.length > 0
                ? `${Math.min(
                    100,
                    Math.max(80, 100 - (safeClients.length % 20))
                  )}%`
                : "0%",
          }}
        />
      </motion.div>

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
          tier={tierFilter}
          onTierChange={setTierFilter}
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
    </div>
  );
};
