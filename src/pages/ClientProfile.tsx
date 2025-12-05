import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useClientsStore, type Client } from "@/stores/clients/useClientsStore";
import { usePlansStore } from "@/stores/plans/usePlansStore";
import { ClientInfoCard } from "@/components/clients/profile/ClientInfoCard";
import { SubscriptionCard } from "@/components/clients/profile/SubscriptionCard";
import { NotesCard } from "@/components/clients/profile/NotesCard";
import { RecentActivity } from "@/components/clients/profile/RecentActivity";
import { ClientMetrics } from "@/components/clients/profile/ClientMetrics";
import { DeleteClientDialog } from "@/components/clients/profile/DeleteClientDialog";
import { ClientProfileHeader } from "@/components/clients/profile/ClientProfileHeader";
import { AssignSubscriptionDialog } from "@/components/clients/AssignSubscriptionDialog";
import { AssignServiceDialog } from "@/components/clients/AssignServiceDialog";
import { ClientServicesCard } from "@/components/clients/ClientServicesCard";
import { ClientProfileSkeleton } from "@/components/clients/profile/ClientProfileSkeleton";
import { ResetPasswordDialog } from "@/components/clients/ResetPasswordDialog";
import { ClientInvoicesCard } from "@/components/clients/profile/ClientInvoicesCard";

// Define form schema
const clientFormSchema = z.object({
  fName: z.string().min(1, { message: "First name is required" }),
  lName: z.string().min(1, { message: "Last name is required" }),
  email: z.string().email({ message: "Please enter a valid email" }),
  phone: z.string().optional(),
  companyName: z.string().min(1, { message: "Company name is required" }),
  taxId: z.string().optional(),
  businessLocation: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      postalCode: z.string().optional(),
      zipCode: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
  website: z
    .string()
    .url({ message: "Please enter a valid URL" })
    .or(z.literal(""))
    .optional(),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
  currentPlan: z.string().optional(),
  subscription: z
    .object({
      plan: z.string().optional(),
      status: z
        .enum(["active", "cancelled", "expired", "pending"] as const)
        .optional(),
      expiresAt: z.string().optional(),
      amount: z.number().optional(),
      startDate: z.string().optional(),
    })
    .optional(),
  revenue: z.number().optional(),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

export default function ClientProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  // Zustand stores
  const {
    fetchClient,
    deleteClient,
    updateClientApi,
    assignPlanToClient,
    loading: isLoadingClient,
    error: clientError,
    getClientById,
  } = useClientsStore();

  const {
    fetchPlans,
    plans: subscriptionPlans,
    loading: isLoadingPlans,
  } = usePlansStore();

  // Check if this is a new client
  const isNewClient = id === "new";

  // Handle ID validation and navigation
  useEffect(() => {
    if (!id) {
      toast({
        title: "Error",
        description: "Client ID is missing from the URL.",
        variant: "destructive",
      });
      navigate("/dashboard/clients");
    }
  }, [id, navigate, toast]);

  // Form setup
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      fName: "",
      lName: "",
      email: "",
      phone: "",
      companyName: "",
      taxId: "",
      businessLocation: {
        street: "",
        city: "",
        state: "",
        postalCode: "",
        zipCode: "",
        country: "",
      },
      website: "",
      notes: "",
      isActive: true,
      currentPlan: "",
      subscription: {
        plan: "",
        status: "active",
        expiresAt: "",
        amount: 0,
        startDate: "",
      },
      revenue: 0,
    },
  });

  // State for edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [client, setClient] = useState<Client | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAssignServiceOpen, setIsAssignServiceOpen] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [isLocalLoading, setIsLocalLoading] = useState(true); // Track local loading state

  // Fetch client data
  useEffect(() => {
    if (!isNewClient && id) {
      const loadClient = async () => {
        setIsLocalLoading(true);
        try {
          const clientData = await fetchClient(id as string);
          setClient(clientData);
        } catch (error) {
          console.error("Failed to fetch client:", error);
        } finally {
          setIsLocalLoading(false);
        }
      };
      loadClient();
    } else {
      setIsLocalLoading(false);
    }
  }, [id, isNewClient, fetchClient]);

  // Fetch plans data

  // Handle client not found
  useEffect(() => {
    if (clientError) {
      if (clientError.includes("404") || clientError.includes("not found")) {
        toast({
          title: "Client Not Found",
          description: "The requested client does not exist.",
          variant: "destructive",
        });
        navigate("/dashboard/clients");
      }
    }
  }, [clientError, navigate, toast]);

  // Set form values when client data is loaded
  useEffect(() => {
    if (client && !isEditing) {
      const clientData = client as any;
      const userData =
        typeof clientData.user === "object" ? clientData.user : null;

      form.reset({
        fName: userData?.fName || "",
        lName: userData?.lName || "",
        email: userData?.email || "",
        phone: userData?.phone || "",
        companyName: clientData.companyName || "",
        taxId: clientData.taxId || "",
        businessLocation: {
          street: clientData.businessLocation?.street || "",
          city: clientData.businessLocation?.city || "",
          state: clientData.businessLocation?.state || "",
          postalCode: clientData.businessLocation?.postalCode || "",
          zipCode: clientData.businessLocation?.zipCode || "",
          country: clientData.businessLocation?.country || "",
        },
        website: clientData.oldWebsite || "",
        notes: clientData.notes || "",
        isActive: clientData.isActive ?? true,
        currentPlan:
          typeof clientData.currentPlan === "string"
            ? clientData.currentPlan
            : clientData.currentPlan?.name || "",
        subscription: clientData.subscription
          ? {
              plan:
                typeof clientData.subscription.plan === "string"
                  ? clientData.subscription.plan
                  : clientData.subscription.plan?.name || "",
              status: clientData.subscription.status || "active",
              expiresAt: clientData.subscription.expiresAt || "",
              amount: clientData.subscription.amount || 0,
              startDate: clientData.subscription.startDate || "",
            }
          : undefined,
        revenue: clientData.revenue || 0,
      });
    }
  }, [client, isEditing, form]);

  // Handle delete client
  const handleDeleteClient = async () => {
    if (!id) return;

    setIsDeleting(true);
    try {
      await deleteClient(id as string);
      toast({
        title: "Client Deleted",
        description: "The client has been successfully deleted.",
      });
      navigate("/dashboard/clients");
    } catch (error: any) {
      console.error("Delete client error:", error);
      toast({
        title: "Error",
        description: "Failed to delete client. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Transform form data to match Client type requirements
  const transformFormDataToClient = (
    data: ClientFormValues
  ): Partial<Client> => {
    const transformed: Partial<Client> = {
      companyName: data.companyName,
      businessLocation: data.businessLocation,
      taxId: data.taxId,
      notes: data.notes,
      isActive: data.isActive,
      revenue: data.revenue,
      oldWebsite: data.website,
    };

    // Only include subscription if it has valid data
    if (data.subscription && data.subscription.plan) {
      transformed.subscription = {
        plan: data.subscription.plan,
        status: data.subscription.status as
          | "active"
          | "cancelled"
          | "expired"
          | "pending",
        amount: data.subscription.amount,
        startDate: data.subscription.startDate,
        expiresAt: data.subscription.expiresAt,
      };
    }

    return transformed;
  };

  // Handle form submission
  const onSubmit = async (data: ClientFormValues) => {
    if (isNewClient) {
      // Handle new client creation
    } else {
      // Handle client update
      const transformedData = transformFormDataToClient(data);

      setIsUpdating(true);
      try {
        await updateClientApi(id as string, transformedData);
        toast({
          title: "Client Updated",
          description: "The client information has been successfully updated.",
        });
        setIsEditing(false);
        // Refetch client data to get updated state
        const updatedClient = await fetchClient(id as string);
        setClient(updatedClient);
      } catch (error: any) {
        console.error("Update client error:", error);
        toast({
          title: "Error",
          description: "Failed to update client. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsUpdating(false);
      }
    }
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    if (isEditing) {
      // Reset form to original values
      form.reset();
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  };

  // Handle plan change
  const handlePlanChange = async (planId: string, customPrice?: number) => {
    if (!planId || !id) return;

    try {
      setIsChangingPlan(true);

      // Use the new subscribeClient endpoint from PlansStore
      const { subscribeClient } = usePlansStore.getState();

      await subscribeClient({
        clientId: id as string,
        planId: planId,
        billingCycle: "monthly", // Default, can be made configurable
        customPrice,
      });

      // Refetch client data
      const updatedClient = await fetchClient(id as string);
      setClient(updatedClient);

      toast({
        title: "Subscription Created",
        description: customPrice
          ? `Client subscribed with custom price $${customPrice}. Invoice generated.`
          : "Subscription plan has been successfully assigned. Invoice generated.",
      });

      setIsChangingPlan(false);
      setSelectedPlan("");
    } catch (error: any) {
      console.error("Plan change error:", error);
      toast({
        title: "Error",
        description: "Failed to change plan. Please try again.",
        variant: "destructive",
      });
      setIsChangingPlan(false);
      throw error;
    }
  };

  // Handle save notes
  const handleSaveNotes = async (notes: string) => {
    if (!id) return;

    setIsSavingNotes(true);
    try {
      await updateClientApi(id as string, { notes });
      // Refetch client data
      const updatedClient = await fetchClient(id as string);
      setClient(updatedClient);

      toast({
        title: "Notes Updated",
        description: "Client notes have been successfully saved.",
      });
    } catch (error: any) {
      console.error("Save notes error:", error);
      toast({
        title: "Error",
        description: "Failed to save notes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Loading state - show skeleton while fetching data
  if (isLocalLoading || isLoadingClient || (isLoadingPlans && !isNewClient)) {
    return <ClientProfileSkeleton />;
  }

  // Error state - only show after loading is complete
  if (!isLocalLoading && !isLoadingClient && clientError) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Error Loading Client
          </h2>
          <p className="text-gray-600 mb-4">
            Failed to load client information. Please try again.
          </p>
          <Button onClick={() => fetchClient(id as string)}>Retry</Button>
        </div>
      </div>
    );
  }

  // No client data - only show after loading is complete and no error
  if (!isLocalLoading && !isLoadingClient && !client && !isNewClient) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Client Not Found
          </h2>
          <p className="text-gray-600 mb-4">
            The requested client does not exist.
          </p>
          <Button onClick={() => navigate("/dashboard/clients")}>
            Back to Clients
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6 animate-in fade-in duration-500">
      {/* Delete Dialog */}
      <DeleteClientDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteClient}
        isDeleting={isDeleting}
      />

      <ClientProfileHeader
        onDelete={() => setIsDeleteDialogOpen(true)}
        isDeleting={isDeleting}
      />

      {client && (
        <div className="space-y-4 md:space-y-6">
          <ClientInfoCard
            client={client}
            onEdit={toggleEditMode}
            isEditing={isEditing}
            isLoading={isUpdating}
            form={form}
            onSave={form.handleSubmit(onSubmit)}
            onCancel={toggleEditMode}
            onResetPassword={() => setIsResetPasswordOpen(true)}
          />

          <NotesCard
            notes={client.notes || ""}
            onSave={handleSaveNotes}
            isSaving={isSavingNotes}
          />
        </div>
      )}

      {/* Full Width Subscription Section */}
      {client && (
        <SubscriptionCard
          clientId={id as string}
          subscription={client.subscription}
          client={client}
          onUpdate={async () => {
            if (id) {
              const updatedClient = await fetchClient(id as string);
              setClient(updatedClient);
            }
          }}
        />
      )}

      {/* Full Width Services Section */}
      {client && (
        <ClientServicesCard
          clientId={id as string}
          services={client.services || []}
          onUpdate={async () => {
            const updatedClient = await fetchClient(id as string);
            setClient(updatedClient);
          }}
          onAddService={() => setIsAssignServiceOpen(true)}
        />
      )}

      {client && (
        <div className="space-y-6">
          <ClientMetrics client={client} />
          <ClientInvoicesCard clientId={id as string} />
          <RecentActivity clientId={id as string} />
        </div>
      )}

      {client && (
        <>
          {/* AssignSubscriptionDialog is now handled by SubscriptionCard component */}
          {/* Removed duplicate dialog - SubscriptionCard handles it internally */}

          <AssignServiceDialog
            open={isAssignServiceOpen}
            onOpenChange={setIsAssignServiceOpen}
            client={client}
            onSuccess={async () => {
              if (id) {
                const updatedClient = await fetchClient(id as string);
                setClient(updatedClient);
                toast({
                  title: "Success",
                  description: "Service assigned successfully",
                });
              }
            }}
          />
        </>
      )}

      <ResetPasswordDialog
        open={isResetPasswordOpen}
        onOpenChange={setIsResetPasswordOpen}
        clientId={id as string}
        clientName={
          (client?.user && typeof client.user === "object" && client.user?.fName && client.user?.lName
            ? `${client.user.fName} ${client.user.lName}`
            : null) ||
          client?.companyName ||
          "Client"
        }
        onSuccess={async () => {
          if (id) {
            const updatedClient = await fetchClient(id as string);
            setClient(updatedClient);
          }
        }}
      />
    </div>
  );
}
