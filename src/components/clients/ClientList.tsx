import { useState, useMemo, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { clientsService } from "@/services/api/clientsService";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";

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

// Utility function to transform client data from store type to ClientCard type
export function transformClientForList(client: Client): Client {
  const user =
    typeof client.user === "string" || !client.user
      ? {
          _id: typeof client.user === "string" ? client.user : "unknown",
          email: "",
          fName: "Unknown",
          lName: "User",
          phone: "",
        }
      : client.user;

  // Get status from user or default to 'inactive'
  const status = (user as any)?.status || "inactive";

  // Create the transformed client
  const transformed: Client = {
    _id: client._id,
    user: user as UserRef,
    isClient: true,
    companyName: client.companyName,
    businessLocation: client.businessLocation,
    oldWebsite: client.oldWebsite,
    taxId: client.taxId,
    notes: client.notes,
    isActive: client.isActive,
    services: client.services,
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
        : "basic",
    createdAt: client.createdAt,
    updatedAt: client.updatedAt,
    lastActive: client.updatedAt,
    revenue: 0,
    name: `${user.fName || ""} ${user.lName || ""}`.trim() || "Unnamed Client",
    email: user.email || "",
    phone: user.phone || "",
    status,
    subscription: {
      plan: client.currentPlan
        ? typeof client.currentPlan === "string"
          ? client.currentPlan
          : "basic"
        : "basic",
      status: client.isActive ? ("active" as const) : ("cancelled" as const),
      amount: 0,
      startDate: client.createdAt,
      expiresAt: client.isActive
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        : client.createdAt,
      lastBillingDate: client.createdAt,
      nextBillingDate: client.isActive
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        : null,
      trialEndsAt: null,
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
    return clients.map((client: any) => transformClientForList(client));
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
            // Loading skeleton
            Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-64 bg-gray-100 rounded-lg animate-pulse"
              />
            ))
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
