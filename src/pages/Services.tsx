import React, { useState, useEffect } from "react";
import {
  Plus,
  Loader2,
  Edit,
  Trash2,
  Search,
  ArrowUpDown,
  List,
  Grid,
  Calendar,
  Filter,
  X,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useToast } from "@/components/ui/use-toast";
import { useServicesStore } from "@/stores/services/useServicesStore";
import { useServiceRequestsStore } from "@/stores/service-requests/useServiceRequestsStore";
import { EditRequestDialog } from "@/components/requests/EditRequestDialog";
import { requestsApi } from "@/services/api/requestsApi";
import { Service, ServiceFormData } from "@/types/service.types";
import { useCanModify } from "@/hooks/useRole";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { format } from "date-fns";
import { ServiceFormDialog } from "@/components/services/ServiceFormDialog";

export default function Services() {
  const {
    services,
    loading,
    fetchServices,
    createService,
    deleteService,
    fetchService,
    updateServiceApi,
    toggleServiceStatus,
  } = useServicesStore();

  const {
    serviceRequests,
    fetchServiceRequests,
    approveRequest,
    rejectRequest,
  } = useServiceRequestsStore();

  const { toast } = useToast();
  const canModify = useCanModify();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all"); // Changed from activeOnly to statusFilter
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({
    min: 0,
    max: 10000,
  });
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: "",
    end: "",
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentServiceId, setCurrentServiceId] = useState<string | null>(null);

  // State for edit request dialog
  const [isEditRequestDialogOpen, setIsEditRequestDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Service;
    direction: "asc" | "desc";
  }>({
    key: "name",
    direction: "asc",
  });

  // Form data state for the dialog
  const [formData, setFormData] = useState<ServiceFormData | undefined>(
    undefined
  );

  useEffect(() => {
    fetchServices();
    fetchServiceRequests();
  }, [fetchServices, fetchServiceRequests]);

  const handleSubmit = async (data: ServiceFormData) => {
    setIsSubmitting(true);

    let serviceData: any;
    try {
      serviceData = {
        ...data,
        features: data.features.map((feature) =>
          typeof feature === "string" ? feature : feature.title
        ),
        process: data.process.map((process) =>
          typeof process === "string" ? process : process.title
        ),
        isActive: data.status === "active",
        discount: {
          amount: data.discount.amount,
          isActive: data.discount.isActive,
          startDate: data.discount.startDate,
          endDate: data.discount.endDate,
          code: data.discount.code,
        },
        basePrice: data.basePrice,
      };

      // Remove fields that are calculated server-side
      delete (serviceData as any).currentPrice;
      delete (serviceData as any).discountedPrice;
      delete (serviceData as any).status;

      // Remove any undefined values that might cause issues
      Object.keys(serviceData).forEach(
        (key) =>
          serviceData[key as keyof typeof serviceData] === undefined &&
          delete serviceData[key as keyof typeof serviceData]
      );

      if (isEditing && currentServiceId) {
        await updateServiceApi(currentServiceId, serviceData);
        toast({
          title: "Success",
          description: "Service updated successfully",
        });
      } else {
        await createService(serviceData);
        toast({
          title: "Success",
          description: "Service created successfully",
        });
      }

      setIsOpen(false);
      resetForm();
    } catch (error: any) {
      console.error("Error saving service:", error);
      toast({
        title: "Error",
        description:
          error?.response?.data?.message ||
          (error instanceof Error ? error.message : "Failed to save service"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData(undefined);
    setIsEditing(false);
    setCurrentServiceId(null);
  };

  const handleEditService = async (service: Service) => {
    try {
      setIsSubmitting(true);
      const serviceDetails = await fetchService(service._id);

      // Transform the service data to match the form structure
      const newFormData: ServiceFormData = {
        ...serviceDetails,
        status: serviceDetails.isActive ? "active" : "inactive",
        discount: {
          ...serviceDetails.discount,
          isActive: serviceDetails.discount?.isActive || false,
        },
        features: serviceDetails.features || [],
        process: serviceDetails.process || [],
      };

      setFormData(newFormData);
      setCurrentServiceId(serviceDetails._id);
      setIsEditing(true);
      setIsOpen(true);
    } catch (error) {
      console.error("Error fetching service:", error);
      toast({
        title: "Error",
        description: "Failed to load service details",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;

    try {
      await deleteService(deleteId);
      toast({
        title: "Success",
        description: "Service deleted successfully",
      });
      await fetchServices(); // Refresh the list after delete
    } catch (error) {
      console.error("Error deleting service:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete service",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setDeleteId(null);
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await toggleServiceStatus(id);
      toast({
        title: "Success",
        description: "Service status updated successfully",
      });
    } catch (error) {
      console.error("Error toggling service status:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to toggle service status",
        variant: "destructive",
      });
    }
  };

  // Sort services
  const sortedAndFilteredServices = React.useMemo(() => {
    // Get unique categories
    const categories = Array.isArray(services)
      ? [...new Set(services.map((s) => s.category).filter(Boolean))]
      : [];

    // Filter services
    const filtered = Array.isArray(services)
      ? services.filter((service) => {
          const matchesSearch =
            searchTerm === "" ||
            service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            service.description
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            service.category?.toLowerCase().includes(searchTerm.toLowerCase());

          const matchesStatus =
            statusFilter === "all" ||
            (statusFilter === "active" && service.isActive) ||
            (statusFilter === "inactive" && !service.isActive);

          const matchesCategory =
            selectedCategory === "all" || service.category === selectedCategory;

          const matchesPrice =
            service.basePrice >= priceRange.min &&
            service.basePrice <= priceRange.max;

          const matchesDate =
            (!dateRange.start ||
              new Date(service.createdAt) >= new Date(dateRange.start)) &&
            (!dateRange.end ||
              new Date(service.createdAt) <= new Date(dateRange.end));

          return (
            matchesSearch &&
            matchesStatus &&
            matchesCategory &&
            matchesPrice &&
            matchesDate
          );
        })
      : [];

    // Sort services
    return [...filtered].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [
    services,
    searchTerm,
    statusFilter,
    selectedCategory,
    priceRange,
    dateRange,
    sortConfig,
  ]);

  // Get unique categories for filter dropdown
  const categories = React.useMemo(() => {
    if (!Array.isArray(services)) return [];
    return [...new Set(services.map((s) => s.category).filter(Boolean))].sort();
  }, [services]);

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setSelectedCategory("all");
    setPriceRange({ min: 0, max: 10000 });
    setDateRange({ start: "", end: "" });
    setCurrentPage(1);
  };

  // Check if any filters are active
  const hasActiveFilters = React.useMemo(() => {
    return (
      searchTerm !== "" ||
      statusFilter !== "all" ||
      selectedCategory !== "all" ||
      priceRange.min > 0 ||
      priceRange.max < 10000 ||
      dateRange.start !== "" ||
      dateRange.end !== ""
    );
  }, [searchTerm, statusFilter, selectedCategory, priceRange, dateRange]);

  // Pagination
  const totalPages = Math.ceil(sortedAndFilteredServices.length / itemsPerPage);
  const currentServices = sortedAndFilteredServices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (key: keyof Service) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const SortableHeader = ({
    columnKey,
    children,
  }: {
    columnKey: keyof Service;
    children: React.ReactNode;
  }) => (
    <TableHead
      className="cursor-pointer hover:bg-accent/50"
      onClick={() => handleSort(columnKey)}
    >
      <div className="flex items-center">
        {children}
        <ArrowUpDown className="ml-2 h-4 w-4" />
        {sortConfig.key === columnKey && (
          <span className="ml-1 text-xs">
            {sortConfig.direction === "asc" ? "↑" : "↓"}
          </span>
        )}
      </div>
    </TableHead>
  );

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-500">Active</Badge>
    ) : (
      <Badge variant="outline">Inactive</Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Services</h1>
            <p className="text-muted-foreground">
              Manage your services and pricing plans
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === "table" ? "outline" : "ghost"}
              size="icon"
              onClick={() => setViewMode("table")}
              title="Table view"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "grid" ? "outline" : "ghost"}
              size="icon"
              onClick={() => setViewMode("grid")}
              title="Grid view"
            >
              <Grid className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ServiceFormDialog
          open={isOpen}
          onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) resetForm();
          }}
          initialData={formData}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search services by name, description, or category..."
                  className="pl-10 w-full md:max-w-md bg-background border-border/50 transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="border-border/50 hover:bg-accent/50 transition-colors duration-200"
              >
                <Filter className="h-4 w-4 mr-2" />
                Advanced Filters
                {hasActiveFilters && (
                  <span className="ml-2 h-2 w-2 bg-primary rounded-full" />
                )}
              </Button>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              )}
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[140px] border-border/50">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => {
                  setItemsPerPage(Number(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[100px] border-border/50">
                  <SelectValue placeholder="Per page" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              {canModify && (
                <Button
                  onClick={() => {
                    resetForm();
                    setIsOpen(true);
                  }}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground transition-colors duration-200"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Service
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="px-6 pb-4">
            <div className="p-4 bg-muted/30 border border-border/50 rounded-lg space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3  gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">
                    Category
                  </Label>
                  <Select
                    value={selectedCategory}
                    onValueChange={(value) => {
                      setSelectedCategory(value);
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="border-border/50">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">
                    Min Price
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={priceRange.min}
                    onChange={(e) => {
                      setPriceRange((prev) => ({
                        ...prev,
                        min: Number(e.target.value) || 0,
                      }));
                      setCurrentPage(1);
                    }}
                    placeholder="0"
                    className="bg-background border-border/50 transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">
                    Max Price
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={priceRange.max}
                    onChange={(e) => {
                      setPriceRange((prev) => ({
                        ...prev,
                        max: Number(e.target.value) || 10000,
                      }));
                      setCurrentPage(1);
                    }}
                    placeholder="10000"
                    className="bg-background border-border/50 transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">
                    Date Range
                  </Label>
                  <div className="flex space-x-2">
                    <Input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => {
                        setDateRange((prev) => ({
                          ...prev,
                          start: e.target.value,
                        }));
                        setCurrentPage(1);
                      }}
                      className="bg-background border-border/50 transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
                    />
                    <Input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => {
                        setDateRange((prev) => ({
                          ...prev,
                          end: e.target.value,
                        }));
                        setCurrentPage(1);
                      }}
                      className="bg-background border-border/50 transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <LoadingSpinner />
            </div>
          ) : sortedAndFilteredServices.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground mb-4">
                {hasActiveFilters
                  ? "No services match your filters."
                  : "No services found. Create your first service to get started."}
              </p>
              <Button
                onClick={() => {
                  if (hasActiveFilters) {
                    clearAllFilters();
                  } else {
                    resetForm();
                    setIsOpen(true);
                  }
                }}
                className="mt-2"
              >
                {hasActiveFilters ? (
                  <>
                    <X className="mr-2 h-4 w-4" />
                    Clear Filters
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Service
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {viewMode === "table" ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <SortableHeader columnKey="name">Name</SortableHeader>
                      <SortableHeader columnKey="category">
                        Category
                      </SortableHeader>
                      <SortableHeader columnKey="basePrice">
                        Price
                      </SortableHeader>
                      <SortableHeader columnKey="isActive">
                        Status
                      </SortableHeader>
                      <TableHead>Created</TableHead>
                      {canModify && (
                        <TableHead className="text-right">Actions</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentServices.map((service) => (
                      <TableRow key={service._id}>
                        <TableCell className="font-medium">
                          {service.name}
                          {service.description && (
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {service.description}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{service.category}</Badge>
                        </TableCell>
                        <TableCell>${service.basePrice.toFixed(2)}</TableCell>
                        <TableCell>
                          <div
                            className="cursor-pointer"
                            onClick={() =>
                              canModify && handleToggleStatus(service._id)
                            }
                          >
                            {getStatusBadge(service.isActive)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {format(new Date(service.createdAt), "MMM d, yyyy")}
                        </TableCell>
                        {canModify && (
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditService(service)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteClick(service._id)}
                                className="text-destructive hover:text-destructive/90"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                  {currentServices.map((service) => (
                    <Card key={service._id} className="flex flex-col">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-xl">
                              {service.name}
                            </CardTitle>
                            <CardDescription className="mt-1">
                              {service.category}
                            </CardDescription>
                          </div>
                          <div
                            className="cursor-pointer"
                            onClick={() =>
                              canModify && handleToggleStatus(service._id)
                            }
                          >
                            {getStatusBadge(service.isActive)}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="flex-1">
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                          {service.description}
                        </p>
                        <div className="text-2xl font-bold">
                          ${service.basePrice.toFixed(2)}
                        </div>
                        {service.features && service.features.length > 0 && (
                          <div className="mt-4">
                            <p className="text-xs font-medium text-muted-foreground mb-2">
                              Includes:
                            </p>
                            <ul className="text-xs space-y-1">
                              {service.features
                                .slice(0, 3)
                                .map((feature, i) => (
                                  <li key={i} className="flex items-center">
                                    <span className="mr-2">•</span>
                                    {typeof feature === "string"
                                      ? feature
                                      : "Feature"}
                                  </li>
                                ))}
                              {service.features.length > 3 && (
                                <li className="text-muted-foreground pl-3">
                                  +{service.features.length - 3} more
                                </li>
                              )}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                      {canModify && (
                        <CardFooter className="flex justify-end space-x-2 border-t pt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditService(service)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteClick(service._id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </Button>
                        </CardFooter>
                      )}
                    </Card>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing{" "}
                    <span className="font-medium">
                      {(currentPage - 1) * itemsPerPage + 1}
                    </span>{" "}
                    to{" "}
                    <span className="font-medium">
                      {Math.min(
                        currentPage * itemsPerPage,
                        sortedAndFilteredServices.length
                      )}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium">
                      {sortedAndFilteredServices.length}
                    </span>{" "}
                    services
                  </div>
                  <Pagination className="m-0">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() =>
                            setCurrentPage((prev) => Math.max(prev - 1, 1))
                          }
                          className={
                            currentPage === 1
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>
                      {Array.from(
                        { length: Math.min(5, totalPages) },
                        (_, i) => {
                          // Show first, last, and pages around current page
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }

                          return (
                            <PaginationItem key={pageNum}>
                              <PaginationLink
                                onClick={() => setCurrentPage(pageNum)}
                                isActive={currentPage === pageNum}
                                className="cursor-pointer"
                              >
                                {pageNum}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        }
                      )}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() =>
                            setCurrentPage((prev) =>
                              Math.min(prev + 1, totalPages)
                            )
                          }
                          className={
                            currentPage === totalPages
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Service Requests Section */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-bold">Service Requests</h2>
          <p className="text-sm text-muted-foreground">
            Review and manage client service requests
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : serviceRequests.length > 0 ? (
            <div className="space-y-4">
              {serviceRequests.map((request: any) => (
                <Card key={request._id} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">
                            {request.service?.name ||
                              request.requestedItem?.name ||
                              "Unknown Service"}
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
                          {request.client?.companyName ||
                            (request.user?.fName && request.user?.lName
                              ? `${request.user.fName} ${request.user.lName}`
                              : null) ||
                            request.user?.email ||
                            request.client?.user?.email ||
                            "Unknown Client"}
                        </p>
                        {request.notes && (
                          <p className="text-sm mt-2">
                            <span className="font-medium">Note:</span>{" "}
                            {request.notes}
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
                              onClick={() => {
                                setSelectedRequest(request);
                                setIsEditRequestDialogOpen(true);
                              }}
                              className="gap-2"
                            >
                              <Edit className="h-4 w-4" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                try {
                                  await approveRequest(request._id);
                                  toast({
                                    title: "Success",
                                    description:
                                      "Service request approved successfully",
                                  });
                                  await fetchServiceRequests();
                                } catch (error) {
                                  toast({
                                    title: "Error",
                                    description: "Failed to approve request",
                                    variant: "destructive",
                                  });
                                }
                              }}
                              className="gap-2"
                            >
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                try {
                                  await rejectRequest(
                                    request._id,
                                    "Rejected by admin"
                                  );
                                  toast({
                                    title: "Success",
                                    description: "Service request rejected",
                                  });
                                  await fetchServiceRequests();
                                } catch (error) {
                                  toast({
                                    title: "Error",
                                    description: "Failed to reject request",
                                    variant: "destructive",
                                  });
                                }
                              }}
                              className="gap-2"
                            >
                              Reject
                            </Button>
                          </>
                        ) : (
                          <div className="flex items-center px-3 py-2 text-sm">
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
              <h3 className="text-lg font-medium mb-2">No Service Requests</h3>
              <p className="text-muted-foreground text-center max-w-md">
                You don't have any service requests at the moment.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              service and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteId(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EditRequestDialog
        request={selectedRequest}
        isOpen={isEditRequestDialogOpen}
        onClose={() => {
          setIsEditRequestDialogOpen(false);
          setSelectedRequest(null);
        }}
        onSave={async (id, data) => {
          try {
            await requestsApi.updateRequest(id, data);
            toast({
              title: "Success",
              description: "Request updated successfully",
            });
            await fetchServiceRequests();
          } catch (error: any) {
            toast({
              title: "Error",
              description:
                error.response?.data?.message || "Failed to update request",
              variant: "destructive",
            });
            throw error;
          }
        }}
        services={services}
      />
    </div>
  );
}
