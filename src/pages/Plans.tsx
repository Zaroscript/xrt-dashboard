import { useState, useEffect, useMemo, useCallback } from "react";
import {
  CreditCard,
  Plus,
  Zap,
  Loader2,
  AlertTriangle,
  RefreshCw,
  RotateCw,
  AlertCircle,
  X,
  Check,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Filter,
  Search,
  Trash2,
  FileText,
  Calendar,
  Edit,
  Info,
  Power,
} from "lucide-react";

// UI Components
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

// Dialog and Card Components
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// API and Data
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { plansService } from "@/services/api/plansService";
import { adminService } from "@/services/api/adminService";
import PlanForm, { type PlanFormValues } from "@/components/plans/PlanForm";
import { DeletePlanDialog } from "@/components/plans/DeletePlanDialog";
import { useCanModify } from "@/hooks/useRole";
import { usePlansStore } from "@/stores/plans/usePlansStore";
import { EditRequestDialog } from "@/components/requests/EditRequestDialog";
import { requestsApi } from "@/services/api/requestsApi";

// Types
import type { Plan, PlanStatus, PlanFilter } from "@/types/plan";

interface ApiResponse<T> {
  status: string;
  results: number;
  data: {
    plans: T[];
  };
}

const Plans = () => {
  const canModify = useCanModify();
  const queryClient = useQueryClient();

  const {
    plans,
    planRequests,
    loading: isLoadingStore,
    error: storeError,
    fetchPlans,
    fetchPlanRequests,
    respondToPlanRequest,
    deletePlan: deletePlanStore,
    togglePlanStatus: togglePlanStatusStore,
  } = usePlansStore();

  // State for delete confirmation dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // State for edit request dialog
  const [isEditRequestDialogOpen, setIsEditRequestDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  // Handle delete plan with confirmation
  const confirmDeletePlan = (planId: string) => {
    setPlanToDelete(planId);
    setIsDeleteDialogOpen(true);
  };

  // Handle delete plan action
  const handleDeletePlan = async () => {
    if (!planToDelete) return;

    try {
      setIsDeleting(true);
      await deletePlanStore(planToDelete);

      toast({
        title: "Success",
        description: "Plan deleted successfully",
      });

      // Close the dialog and reset state
      setIsDeleteDialogOpen(false);
      setPlanToDelete(null);
    } catch (error) {
      console.error("Error deleting plan:", error);
      toast({
        title: "Error",
        description: "Failed to delete plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle toggle plan status
  const handleTogglePlanStatus = async (planId: string) => {
    try {
      await togglePlanStatusStore(planId);
      toast({
        title: "Success",
        description: "Plan status updated successfully",
      });
    } catch (error) {
      console.error("Error toggling plan status:", error);
      toast({
        title: "Error",
        description: "Failed to update plan status. Please try again.",
        variant: "destructive",
      });
    }
  };

  // State for filters
  const [filters, setFilters] = useState<PlanFilter>({
    status: "all",
    search: "",
    sortBy: "displayOrder",
    sortOrder: "asc",
  });

  // State for dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  // Fetch data on component mount
  useEffect(() => {
    fetchPlans();
    fetchPlanRequests();
  }, [fetchPlans, fetchPlanRequests]);

  // Handle approve/reject request
  const handleRequestAction = async (
    requestId: string,
    action: "approved" | "rejected"
  ) => {
    try {
      await respondToPlanRequest(requestId, action);

      toast({
        title: "Success",
        description: `Request ${
          action === "approved" ? "approved" : "rejected"
        } successfully`,
      });
    } catch (error) {
      console.error(
        `Error ${action === "approved" ? "approving" : "rejecting"} request:`,
        error
      );
      toast({
        title: "Error",
        description: `Failed to ${
          action === "approved" ? "approve" : "reject"
        } request. Please try again.`,
        variant: "destructive",
      });
    }
  };

  // Handle edit request
  const handleEditRequest = (request: any) => {
    setSelectedRequest(request);
    setIsEditRequestDialogOpen(true);
  };

  const handleSaveRequest = async (
    id: string,
    data: { notes?: string; adminNotes?: string; requestedItemId?: string }
  ) => {
    try {
      await requestsApi.updateRequest(id, data);
      toast({
        title: "Success",
        description: "Request updated successfully",
      });
      await fetchPlanRequests();
    } catch (error: any) {
      console.error("Error updating request:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to update request",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Filter and sort plans
  const filteredPlans = useMemo(() => {
    let filtered = [...plans];

    // Filter by status
    if (filters.status !== "all") {
      filtered = filtered.filter((plan) =>
        filters.status === "active" ? plan.isActive : !plan.isActive
      );
    }

    // Filter by search
    if (filters.search) {
      filtered = filtered.filter(
        (plan) =>
          plan.name.toLowerCase().includes(filters.search.toLowerCase()) ||
          plan.description?.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (filters.sortBy) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "price":
          aValue = a.price;
          bValue = b.price;
          break;
        case "createdAt":
          aValue = new Date(a.updatedAt || a.createdAt || 0);
          bValue = new Date(b.updatedAt || b.createdAt || 0);
          break;
        case "displayOrder":
          aValue = a.displayOrder || 0;
          bValue = b.displayOrder || 0;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (filters.sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [plans, filters]);

  // Mutations for CRUD operations

  // Create plan mutation
  const createPlanMutation = useMutation({
    mutationFn: (data: Omit<Plan, "_id">) => plansService.createPlan(data),
    onSuccess: () => {
      fetchPlans(); // Refresh store
      toast({
        title: "Success",
        description: "Plan created successfully",
      });
    },
    onError: (error: any) => {
      console.error("Error creating plan:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create plan",
        variant: "destructive",
      });
    },
  });

  // Update plan mutation
  const updatePlanMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Plan> }) => {
      return plansService.updatePlan(id, data);
    },
    onSuccess: (response) => {
      fetchPlans(); // Refresh store
      toast({
        title: "Success",
        description: "Plan updated successfully",
      });
    },
    onError: (error: any) => {
      console.error("Error updating plan:", error);
      console.error("Error response:", error.response);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update plan",
        variant: "destructive",
      });
    },
  });

  // Submit handler for create/update plan
  const handleSubmit = async (data: PlanFormValues) => {
    // Calculate prices
    const monthlyPrice = data.monthlyPrice || data.price || 0;
    const yearlyPrice = data.yearlyPrice || monthlyPrice * 12;

    // Calculate discounted prices
    let discountedMonthlyPrice = monthlyPrice;
    let discountedYearlyPrice = yearlyPrice;

    if (data.discount && data.discount.value > 0) {
      if (data.discount.type === "percentage") {
        // Percentage discount: apply to both monthly and yearly
        discountedMonthlyPrice = monthlyPrice * (1 - data.discount.value / 100);
        discountedYearlyPrice = yearlyPrice * (1 - data.discount.value / 100);
      } else {
        // Fixed discount: apply full discount to yearly, divide by 12 for monthly
        discountedYearlyPrice = Math.max(0, yearlyPrice - data.discount.value);
        discountedMonthlyPrice = Math.max(
          0,
          monthlyPrice - data.discount.value / 12
        );
      }
    }

    try {
      if (data._id) {
        await updatePlanMutation.mutateAsync({
          id: data._id,
          data: {
            name: data.name || "",
            description: data.description || "",
            price: data.price || 0,
            monthlyPrice: monthlyPrice,
            yearlyPrice: yearlyPrice,
            features: data.features || [],
            duration: data.duration || 1,
            isActive: data.isActive ?? true,
            isCustom: data.isCustom ?? false,
            displayOrder: data.displayOrder || 0,
            calculatedMonthlyPrice: monthlyPrice,
            calculatedYearlyPrice: yearlyPrice,
            billingCycle: data.duration === 12 ? "yearly" : "monthly",
            discountedPrice: discountedMonthlyPrice,
            updatedAt: new Date().toISOString(),
            discount:
              data.discount && data.discount.value > 0
                ? {
                    type: data.discount.type || "percentage",
                    value: data.discount.value,
                    startDate: data.discount.startDate
                      ? new Date(data.discount.startDate)
                      : undefined,
                    endDate: data.discount.endDate
                      ? new Date(data.discount.endDate)
                      : undefined,
                    isActive: true,
                  }
                : undefined,
            badge: data.badge?.text
              ? data.badge
              : { text: null, variant: "default" },
          },
        });
      } else {
        await createPlanMutation.mutateAsync({
          name: data.name || "",
          description: data.description || "",
          price: data.price || 0,
          monthlyPrice: monthlyPrice,
          yearlyPrice: yearlyPrice,
          duration: data.duration || 1,
          features: data.features || [],
          isActive: data.isActive ?? true,
          isCustom: data.isCustom ?? false,
          displayOrder: data.displayOrder || 0,
          calculatedMonthlyPrice: monthlyPrice,
          calculatedYearlyPrice: yearlyPrice,
          billingCycle: data.duration === 12 ? "yearly" : "monthly",
          discountedPrice: discountedMonthlyPrice,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          discount:
            data.discount && data.discount.value > 0
              ? {
                  type: data.discount.type || "percentage",
                  value: data.discount.value,
                  startDate: data.discount.startDate
                    ? new Date(data.discount.startDate)
                    : undefined,
                  endDate: data.discount.endDate
                    ? new Date(data.discount.endDate)
                    : undefined,
                  isActive: true,
                }
              : undefined,
          badge: data.badge?.text
            ? data.badge
            : { text: null, variant: "default" },
        });
      }
      setIsDialogOpen(false);
      setSelectedPlan(null);
    } catch (error) {
      console.error("Error saving plan:", error);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    try {
      await fetchPlans();
      await fetchPlanRequests();
      toast({
        title: "Success",
        description: "Data refreshed successfully",
      });
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast({
        title: "Error",
        description: "Failed to refresh data",
        variant: "destructive",
      });
    }
  };

  // Handle filter changes
  const handleFilterChange = (updates: Partial<PlanFilter>) => {
    setFilters((prev) => ({
      ...prev,
      ...updates,
    }));
  };

  // Toggle sort order
  const toggleSortOrder = (field: PlanFilter["sortBy"]) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: field,
      sortOrder:
        prev.sortBy === field && prev.sortOrder === "asc" ? "desc" : "asc",
    }));
  };

  // Get sort icon
  const getSortIcon = (field: PlanFilter["sortBy"]) => {
    if (filters.sortBy !== field)
      return <ChevronUp className="h-4 w-4 opacity-0" />;
    return filters.sortOrder === "asc" ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    );
  };

  // Handle add discount
  const handleAddDiscount = (plan: Plan) => {
    setSelectedPlan({
      ...plan,
      discount: {
        type: "percentage",
        value: 10,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Plans Management</h1>
        {canModify && (
          <div className="flex gap-2">
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add New Plan
            </Button>
          </div>
        )}
      </div>

      {/* Plan Requests Section */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold">Plan Requests</h2>
            <p className="text-sm text-muted-foreground">
              Manage plan requests from clients
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchPlanRequests()}
            disabled={isLoadingStore}
          >
            {isLoadingStore ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </>
            )}
          </Button>
        </div>

        {isLoadingStore && planRequests.length === 0 ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : storeError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{storeError}</AlertDescription>
          </Alert>
        ) : planRequests.length > 0 ? (
          <div className="space-y-4">
            {planRequests.map((request) => (
              <Card key={request._id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">
                          {request.plan?.name || "Unknown Plan"}
                        </h3>
                        <Badge
                          variant={
                            request.status === "approved"
                              ? "default"
                              : request.status === "rejected"
                              ? "destructive"
                              : "outline"
                          }
                        >
                          {request.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Requested by:{" "}
                        {(request.client?.fName && request.client?.lName
                          ? `${request.client.fName} ${request.client.lName}`
                          : null) ||
                          request.client?.email ||
                          request.client?.companyName ||
                          "Unknown Client"}
                      </p>
                      <p className="text-sm mt-2">
                        <span className="font-medium">Price:</span> $
                        {request.plan?.price || 0}
                      </p>
                      {request.adminNote && (
                        <p className="text-sm mt-2">
                          <span className="font-medium">Note:</span>{" "}
                          {request.adminNote}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        Requested on:{" "}
                        {format(new Date(request.createdAt), "PPpp")}
                      </p>
                    </div>

                    <div className="flex flex-shrink-0 gap-2 mt-4 md:mt-0">
                      {request.status === "pending" && canModify ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditRequest(request)}
                            className="gap-2"
                          >
                            <Edit className="h-4 w-4" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleRequestAction(request._id, "approved")
                            }
                            className="gap-2"
                          >
                            <Check className="h-4 w-4" />
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleRequestAction(request._id, "rejected")
                            }
                            className="gap-2"
                          >
                            <X className="h-4 w-4" />
                            Reject
                          </Button>
                        </>
                      ) : (
                        <div className="flex items-center px-3 py-2 text-sm">
                          {request.status === "approved" ? (
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          ) : (
                            <XCircle className="h-4 w-4 text-destructive mr-2" />
                          )}
                          {request.status.charAt(0).toUpperCase() +
                            request.status.slice(1)}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg bg-muted/30">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Plan Requests</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              You don't have any plan requests at the moment. Check back later
              for new requests.
            </p>
            <Button variant="outline" onClick={() => fetchPlanRequests()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        )}
      </section>

      {/* Plans Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold">All Plans</h2>
            <p className="text-sm text-muted-foreground">
              Manage your subscription plans
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search plans..."
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, search: e.target.value }))
                }
                className="pl-10 w-64"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  {filters.status === "all"
                    ? "All Status"
                    : filters.status.charAt(0).toUpperCase() +
                      filters.status.slice(1)}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, status: "all" }))
                  }
                >
                  All Status
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, status: "active" }))
                  }
                >
                  Active
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, status: "inactive" }))
                  }
                >
                  Inactive
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {isLoadingStore ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <Card key={index}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4 mb-4" />
                  <Skeleton className="h-8 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : storeError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load plans. Please try again.
              <Button
                variant="outline"
                size="sm"
                className="ml-2"
                onClick={() =>
                  queryClient.invalidateQueries({ queryKey: ["plans"] })
                }
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        ) : filteredPlans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg bg-muted/30">
            <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {filters.search || filters.status !== "all"
                ? "No Plans Found"
                : "No Plans Yet"}
            </h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              {filters.search || filters.status !== "all"
                ? "Try adjusting your search or filter criteria."
                : "Get started by creating your first subscription plan."}
            </p>
            {canModify && (
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Plan
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlans.map((plan) => (
              <Card
                key={plan._id}
                className={cn(
                  "relative overflow-hidden transition-all duration-200 hover:shadow-lg",
                  !plan.isActive && "opacity-75"
                )}
              >
                {plan.isFeatured && (
                  <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 px-3 py-1 text-xs font-semibold rounded-bl-lg">
                    Featured
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl flex items-center gap-2">
                        {plan.name}
                      </CardTitle>
                      {plan.badge?.text && (
                        <Badge variant={plan.badge.variant || "default"} className="mr-1">
                          {plan.badge.text}
                        </Badge>
                      )}
                      {plan.isCustom && (
                        <Badge variant="secondary" className="mr-1">
                          Custom Plan
                        </Badge>
                      )}
                      <CardDescription className="mt-2">
                        {plan.description}
                      </CardDescription>
                    </div>
                    <Badge variant={plan.isActive ? "default" : "secondary"}>
                      {plan.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Always show both monthly and yearly prices */}
                  <div className="space-y-3">
                    {/* Monthly Price */}
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <span className="text-sm font-medium text-muted-foreground">
                        Monthly
                      </span>
                      <div className="flex items-baseline gap-2">
                        {plan.discount &&
                          plan.discount.value > 0 &&
                          plan.discount.isActive && (
                            <span className="text-sm text-muted-foreground line-through">
                              ${Math.round(plan.monthlyPrice || plan.price)}
                            </span>
                          )}
                        <span className="text-xl font-bold">
                          $
                          {Math.round(
                            plan.discount &&
                              plan.discount.value > 0 &&
                              plan.discount.isActive
                              ? plan.discount.type === "percentage"
                                ? (plan.monthlyPrice || plan.price) *
                                  (1 - plan.discount.value / 100)
                                : Math.max(
                                    0,
                                    (plan.monthlyPrice || plan.price) -
                                      plan.discount.value / 12
                                  )
                              : plan.monthlyPrice || plan.price
                          )}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          /mo
                        </span>
                      </div>
                    </div>

                    {/* Yearly Price */}
                    <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">
                          Yearly
                        </span>
                        {(() => {
                          const monthlyTotal =
                            (plan.monthlyPrice || plan.price) * 12;
                          const yearlyPrice = plan.yearlyPrice || monthlyTotal;
                          const savings = Math.round(
                            ((monthlyTotal - yearlyPrice) / monthlyTotal) * 100
                          );
                          return savings > 0 ? (
                            <Badge
                              variant="secondary"
                              className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            >
                              Save {savings}%
                            </Badge>
                          ) : null;
                        })()}
                      </div>
                      <div className="flex items-baseline gap-2">
                        {plan.discount &&
                          plan.discount.value > 0 &&
                          plan.discount.isActive && (
                            <span className="text-sm text-muted-foreground line-through">
                              $
                              {Math.round(
                                plan.yearlyPrice ||
                                  (plan.monthlyPrice || plan.price) * 12
                              )}
                            </span>
                          )}
                        <span className="text-xl font-bold text-primary">
                          $
                          {Math.round(
                            plan.discount &&
                              plan.discount.value > 0 &&
                              plan.discount.isActive
                              ? plan.discount.type === "percentage"
                                ? (plan.yearlyPrice ||
                                    (plan.monthlyPrice || plan.price) * 12) *
                                  (1 - plan.discount.value / 100)
                                : Math.max(
                                    0,
                                    (plan.yearlyPrice ||
                                      (plan.monthlyPrice || plan.price) * 12) -
                                      plan.discount.value
                                  )
                              : plan.yearlyPrice ||
                                  (plan.monthlyPrice || plan.price) * 12
                          )}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          /yr
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Discount Badge - Improved Styling */}
                  {plan.discount &&
                    plan.discount.value > 0 &&
                    plan.discount.isActive && (
                      <div className="relative overflow-hidden bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg p-4">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                        <div className="relative flex items-center gap-3">
                          <div className="p-2 bg-white/20 rounded-full">
                            <Zap className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-bold text-lg">
                              {plan.discount.type === "percentage"
                                ? `${plan.discount.value}% OFF`
                                : `$${Math.round(plan.discount.value)} OFF`}
                            </p>
                            {plan.discount.endDate && (
                              <p className="text-xs text-white/80">
                                Ends{" "}
                                {format(
                                  new Date(plan.discount.endDate),
                                  "MMM dd, yyyy"
                                )}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                  <div className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
                {canModify && (
                  <CardFooter className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setSelectedPlan(plan);
                        setIsDialogOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant={plan.isActive ? "default" : "secondary"}
                      size="sm"
                      onClick={() => handleTogglePlanStatus(plan._id)}
                      disabled={isLoadingStore}
                      className={
                        plan.isActive
                          ? "hover:bg-green-600"
                          : "hover:bg-orange-600"
                      }
                    >
                      {isLoadingStore ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Power className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => confirmDeletePlan(plan._id)}
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </CardFooter>
                )}
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Delete Confirmation Dialog */}
      <DeletePlanDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeletePlan}
        planName={
          planToDelete
            ? plans.find((p) => p._id === planToDelete)?.name
            : undefined
        }
        isDeleting={isDeleting}
      />

      {/* Edit Request Dialog */}
      <EditRequestDialog
        request={selectedRequest}
        isOpen={isEditRequestDialogOpen}
        onClose={() => {
          setIsEditRequestDialogOpen(false);
          setSelectedRequest(null);
        }}
        onSave={handleSaveRequest}
        plans={plans}
      />

      {/* Enhanced Plan Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-full ${
                  selectedPlan
                    ? "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                    : "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400"
                }`}
              >
                {selectedPlan ? (
                  <Edit className="h-5 w-5" />
                ) : (
                  <Plus className="h-5 w-5" />
                )}
              </div>
              <div className="flex-1">
                <DialogTitle className="text-xl">
                  {selectedPlan ? "Edit Plan" : "Create New Plan"}
                </DialogTitle>
                <DialogDescription className="text-sm mt-1">
                  {selectedPlan
                    ? `Update the "${selectedPlan.name}" plan details below.`
                    : "Fill out the form below to create a new subscription plan."}
                </DialogDescription>
              </div>
            </div>
            {selectedPlan && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Created:{" "}
                {format(
                  new Date(selectedPlan.createdAt || Date.now()),
                  "MMM d, yyyy"
                )}
              </div>
            )}
          </DialogHeader>

          <div className="border-t pt-6">
            <PlanForm
              plan={selectedPlan}
              onSubmit={handleSubmit}
              onCancel={() => {
                setIsDialogOpen(false);
                setSelectedPlan(null);
              }}
              isSubmitting={
                createPlanMutation.isPending || updatePlanMutation.isPending
              }
            />
          </div>

          <DialogFooter className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {selectedPlan ? (
                <span className="flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  Plan ID: {selectedPlan._id?.slice(-8)}
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  All fields marked with * are required
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setSelectedPlan(null);
                }}
                disabled={
                  createPlanMutation.isPending || updatePlanMutation.isPending
                }
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="plan-form"
                disabled={
                  createPlanMutation.isPending || updatePlanMutation.isPending
                }
                className={
                  selectedPlan
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-green-600 hover:bg-green-700"
                }
              >
                {createPlanMutation.isPending ||
                updatePlanMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {selectedPlan ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  <>
                    {selectedPlan ? (
                      <>
                        <Edit className="mr-2 h-4 w-4" /> Update Plan
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" /> Create Plan
                      </>
                    )}
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Plans;
