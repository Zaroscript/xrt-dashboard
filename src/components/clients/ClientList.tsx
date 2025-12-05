import { useState, useMemo, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { clientsService } from "@/services/api/clientsService";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

import ClientCard from "./ClientCard";

// Import the Client type from client.types for consistency with ClientCard
import type { Client, UserRef } from "@/types/client.types";
import type { ClientStatus } from "@/types/client.types";

// Define tier types for the UI
type ClientTier = "basic" | "premium" | "enterprise" | "vip";

// Type guard to check if user is a UserRef
function isUserRef(user: any): user is UserRef {
  return user && typeof user === "object" && "_id" in user;
}

// Convert store client data into what our ClientCard component expects
export function transformClientForList(client: Client): Client {
  // Keep the user object if we have it, otherwise create one
  const user: UserRef =
    typeof client.user === "object" && client.user !== null && client.user._id
      ? client.user as UserRef  // Use the populated user object as-is
      : typeof client.user === "string"
      ? {
          // If user is just a string ID, create a minimal user object
          _id: client.user,
          email: client.email || "",
          fName: "",
          lName: "",
          phone: client.phone || "",
        }
      : {
          // Fallback if user is missing
          _id: "unknown",
          email: client.email || "",
          fName: "Unknown",
          lName: "User",
          phone: client.phone || "",
        };

  // Figure out the client's status based on various properties
  // Priority: isApproved check > user.status > client.status > isActive check
  const getStatus = (): string => {
    // Priority 1: Check isApproved FIRST (if false, user is pending)
    if ((user as any)?.isApproved === false) {
      return "pending";
    }
    
    // Priority 2: Check user status
    if ((user as any)?.status) {
      const userStatus = (user as any).status.toLowerCase();
      if (userStatus === "pending") {
        return "pending";
      }
      if (["active", "inactive", "suspended", "blocked"].includes(userStatus)) {
        return userStatus;
      }
    }
    
    // Priority 3: Check client.status
    if (client.status) {
      const clientStatus = client.status.toLowerCase();
      if (clientStatus === "pending") {
        return "pending";
      }
      if (["active", "inactive", "suspended", "blocked"].includes(clientStatus)) {
        return clientStatus;
      }
    }
    
    // Priority 4: Check isActive
    if (client.isActive === false) {
      return "inactive";
    }
    
    if ((user as any)?.isActive === false) {
      return "inactive";
    }
    
    // Only default to active if user is approved AND active
    if ((user as any)?.isApproved === true && (client.isActive === true || client.isActive === undefined)) {
      return "active";
    }
    
    // If we can't determine, default to pending (safer default for new registrations)
    return "pending";
  };
  
  const status = getStatus();

  // Create the transformed client - preserve all original data
  const transformed: Client = {
    ...client, // Spread all original client properties first
    _id: client._id,
    user: user, // Use the preserved/constructed user object
    isClient: client.isClient !== undefined ? client.isClient : true,
    companyName: client.companyName || "",
    businessLocation: client.businessLocation || {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "USA",
    },
    isActive: client.isActive !== undefined ? client.isActive : true,
    currentPlan:
      typeof client.currentPlan === "string"
        ? client.currentPlan
        : client.currentPlan
        ? {
            _id: client.currentPlan._id,
            name: client.currentPlan.name,
            price: client.currentPlan.price,
            description: client.currentPlan.description,
            features: client.currentPlan.features,
            isActive: client.currentPlan.isActive,
          }
        : undefined,
    createdAt: client.createdAt || new Date().toISOString(),
    updatedAt: client.updatedAt || new Date().toISOString(),
    lastActive: client.lastActive || client.updatedAt || new Date().toISOString(),
    revenue: client.revenue || 0,
    name: client.name || `${user.fName || ""} ${user.lName || ""}`.trim() || client.companyName || "Unnamed Client",
    email: client.email || user.email || "",
    phone: client.phone || user.phone || "",
    status,
    subscription: client.subscription || {
      plan: client.currentPlan
        ? typeof client.currentPlan === "string"
          ? client.currentPlan
          : client.currentPlan
        : "basic",
      status: client.isActive ? ("active" as const) : ("cancelled" as const),
      amount: 0,
      startDate: client.createdAt || new Date().toISOString(),
      expiresAt: client.isActive
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        : client.createdAt || new Date().toISOString(),
      lastBillingDate: client.createdAt || new Date().toISOString(),
      nextBillingDate: client.isActive
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        : undefined,
      trialEndsAt: undefined,
    },
  };

  return transformed;
}

interface ClientListProps {
  clients?: Client[];
  onSelect?: (client: Client) => void;
  onEdit?: (client: Client) => void;
  onDelete?: (client: Client) => void;
  onView?: (client: Client) => void;
  isLoading?: boolean;
  enableFetch?: boolean;
  onUpdate?: (client: Client) => void;
}

export function ClientList({
  clients: externalClients,
  onEdit,
  onDelete,
  onView,
  isLoading: externalIsLoading,
  enableFetch = false,
  onUpdate,
}: Omit<ClientListProps, "onSelect">) {
  const { toast } = useToast();

  // Fetch clients if enableFetch is true and no external clients provided
  const {
    data: fetchedClients = [],
    isLoading: isFetching,
    error,
  } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      try {
        const data = await clientsService.getClients();
        return data || [];
      } catch (err) {
        console.error("Error fetching clients:", err);
        toast({
          title: "Error",
          description: "Failed to load clients. Please try again.",
          variant: "destructive",
        });
        return [];
      }
    },
    enabled: enableFetch && !externalClients,
  });

  // Use external clients if provided, otherwise use fetched clients
  const clients = externalClients || fetchedClients;
  const isLoading = externalIsLoading || (enableFetch && isFetching);

  // Log any errors
  useEffect(() => {
    if (error) {
      console.error("Error in ClientList:", error);
    }
  }, [error]);

  // Transform clients data for the list view
  const transformedClients = useMemo(() => {
    // Handle both paginated response and direct array cases
    const clientsArray = Array.isArray(clients) ? clients : clients?.clients || [];
    return clientsArray.map((client: any) => transformClientForList(client));
  }, [clients]);

  // Handle client updates from ClientCard
  const handleViewClient = useCallback(
    (client: Client) => {
      if (onView) {
        onView(client);
      }
    },
    [onView]
  );

  // Handle client updates from ClientCard
  const handleClientUpdate = useCallback(
    (updatedClient: Client) => {
      if (onUpdate) {
        onUpdate(updatedClient);
      }
    },
    [onUpdate]
  );

  // Handle client delete from ClientCard
  const handleClientDelete = async (clientId: string) => {
    if (onDelete) {
      // Find the client in our transformed list
      const clientToDelete = transformedClients.find((c) => c._id === clientId);
      if (clientToDelete) {
        await onDelete(clientToDelete);
      }
    }
  };

  // Transform clients back to ClientCard's expected Client type
  const clientsForCard = useMemo(() => {
    return transformedClients.map((client) => {
      const cardClient: Client = {
        _id: client._id,
        user: client.user,
        companyName: client.companyName,
        businessLocation: client.businessLocation,
        oldWebsite: client.oldWebsite,
        taxId: client.taxId,
        notes: client.notes,
        isActive: client.isActive,
        isClient: client.isClient || true,
        lastActive: client.lastActive || client.updatedAt,
        revenue: client.revenue || 0,
        createdAt: client.createdAt,
        updatedAt: client.updatedAt,
        services: client.services || [],
        currentPlan: client.currentPlan,
      };
      return cardClient;
    });
  }, [transformedClients]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9; // Grid layout 3x3

  // Calculate pagination
  const totalPages = Math.ceil(transformedClients.length / itemsPerPage);
  const paginatedClients = transformedClients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-6">
      {/* Client List using ClientCard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <div className="col-span-full flex items-center justify-center py-12">
              <LoadingSpinner size="md" text="Loading clients..." />
            </div>
          ) : paginatedClients.length > 0 ? (
            paginatedClients.map((client) => {
              // Find the corresponding base client for ClientCard
              const baseClient = clientsForCard.find(
                (c) => c._id === client._id
              );
              if (!baseClient) return null;

              return (
                <motion.div
                  key={client._id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  className="relative"
                >
                  <ClientCard
                    client={baseClient}
                    onUpdate={handleClientUpdate}
                    onDelete={handleClientDelete}
                    className="h-full"
                  />
                </motion.div>
              );
            })
          ) : (
            <div className="col-span-full py-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted/50 border border-border/50">
                <User className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="mt-2 text-sm font-medium text-foreground">
                No clients found
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Get started by adding a new client.
              </p>
              <div className="mt-6">
                <Button>
                  <User className="-ml-1 mr-2 h-5 w-5" />
                  Add Client
                </Button>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Pagination Controls */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 mt-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <div className="flex items-center space-x-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(page)}
                className="w-8 h-8 p-0"
              >
                {page}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

export default ClientList;
