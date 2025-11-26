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
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useServicesStore } from "@/stores/services/useServicesStore";
import { useServiceRequestsStore } from "@/stores/service-requests/useServiceRequestsStore";
import { Service } from "@/types/service.types";
import { useCanModify } from "@/hooks/useRole";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { format } from "date-fns";

// Define types for feature and process items
interface FeatureItem {
  id?: string;
  title: string;
  description?: string;
}

interface ProcessItem {
  id?: string;
  title: string;
  description?: string;
}

// Define the form data type that matches our UI and Service type
interface ServiceFormData {
  _id?: string;
  name: string;
  description: string;
  category: string;
  basePrice: number;
  status: "active" | "inactive";
  features: (string | FeatureItem)[];
  process: (string | ProcessItem)[];
  discount: {
    amount: number;
    isActive: boolean;
    startDate?: Date;
    endDate?: Date;
    code?: string;
  };
  discountedPrice: number;
  currentPrice?: number;
}

// Helper function to get display text from a feature or process item
const getItemDisplayText = (
  item: string | { title?: string; description?: string },
  index: number
): string => {
  if (typeof item === "string") return item;
  return item.title || item.description || `Item ${index + 1}`;
};

export default function Services() {
  // Get services and related state from the store
  const services = useServicesStore((state) => state.services) || [];
  const loading = useServicesStore((state) => state.loading);
  const error = useServicesStore((state) => state.error);
  const searchTerm = useServicesStore((state) => state.searchTerm);
  const activeOnly = useServicesStore((state) => state.activeOnly);

  // Get store actions
  const fetchServices = useServicesStore((state) => state.fetchServices);
  const fetchService = useServicesStore((state) => state.fetchService);
  const createService = useServicesStore((state) => state.createService);
  const updateServiceApi = useServicesStore((state) => state.updateServiceApi);
  const deleteService = useServicesStore((state) => state.deleteService);
  const toggleServiceStatus = useServicesStore(
    (state) => state.toggleServiceStatus
  );
  const setSearchTerm = useServicesStore((state) => state.setSearchTerm);
  const setActiveOnly = useServicesStore((state) => state.setActiveOnly);

  const { toast } = useToast();
  const canModify = useCanModify();

  // Service Requests
  const serviceRequests = useServiceRequestsStore(
    (state) => state.serviceRequests
  );
  const fetchServiceRequests = useServiceRequestsStore(
    (state) => state.fetchServiceRequests
  );
  const approveRequest = useServiceRequestsStore(
    (state) => state.approveRequest
  );
  const rejectRequest = useServiceRequestsStore((state) => state.rejectRequest);

  // Load services on component mount
  useEffect(() => {
    const loadServices = async () => {
      try {
        await fetchServices();
        await fetchServiceRequests();
      } catch (error) {
        console.error("Failed to load services:", error);
        toast({
          title: "Error",
          description: "Failed to load services. Please try again.",
          variant: "destructive",
        });
      }
    };

    loadServices();
  }, [fetchServices, fetchServiceRequests, toast]);

  // Show error toast when error state changes
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const [filterStatus, setFilterStatus] = useState<string>("");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Service;
    direction: "asc" | "desc";
  }>({
    key: "name",
    direction: "asc",
  });

  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentServiceId, setCurrentServiceId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [formData, setFormData] = useState<ServiceFormData>({
    name: "",
    description: "",
    category: "",
    basePrice: 0,
    status: "active",
    features: [],
    process: [],
    discount: {
      amount: 0,
      isActive: false,
    },
    discountedPrice: 0,
    currentPrice: 0,
  });

  const [newIncludedItem, setNewIncludedItem] = useState({
    title: "",
    description: "",
  });

  const [newProcessItem, setNewProcessItem] = useState({
    title: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (formData.name.length < 3) {
      toast({
        title: "Validation Error",
        description: "Service name must be at least 3 characters long",
        variant: "destructive",
      });
      return;
    }

    if (formData.description.length < 10) {
      toast({
        title: "Validation Error",
        description: "Description must be at least 10 characters long",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    let serviceData: any;
    try {
      serviceData = {
        ...formData,
        features: formData.features.map((feature) =>
          typeof feature === "string" ? feature : feature.title
        ),
        process: formData.process.map((process) =>
          typeof process === "string" ? process : process.title
        ),
        isActive: formData.status === "active",
        discount: {
          amount: formData.discount.amount,
          isActive: formData.discount.isActive,
          startDate: formData.discount.startDate,
          endDate: formData.discount.endDate,
          code: formData.discount.code,
        },
        basePrice: formData.basePrice,
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

      resetForm();
      setIsOpen(false);
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
    setFormData({
      name: "",
      description: "",
      category: "",
      basePrice: 0,
      status: "active",
      features: [],
      process: [],
      discount: {
        amount: 0,
        isActive: false,
      },
      discountedPrice: 0,
      currentPrice: 0,
    });
    setIsEditing(false);
    setCurrentServiceId(null);
  };

  const handleEditService = async (service: Service) => {
    try {
      setIsSubmitting(true);
      const serviceDetails = await fetchService(service._id);
      console.log("Service details from API:", serviceDetails);

      // Transform the service data to match the form structure
      const formData: ServiceFormData = {
        ...serviceDetails,
        status: serviceDetails.isActive ? "active" : "inactive",
        discount: {
          ...serviceDetails.discount,
          isActive: serviceDetails.discount?.isActive || false,
        },
        features: serviceDetails.features || [],
        process: serviceDetails.process || [],
      };

      console.log("Setting form data:", formData);
      setFormData(formData);
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
    } catch (error) {
      console.error("Error toggling service status:", error);
    }
  };

  // Sort services
  const sortedAndFilteredServices = React.useMemo(() => {
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
          const matchesStatus = !activeOnly || service.isActive;
          return matchesSearch && matchesStatus;
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
  }, [services, searchTerm, activeOnly, sortConfig]);

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

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    setFormData((prev) => {
      if (name === "isActive") {
        return {
          ...prev,
          [name]: value === "true" || value === "active",
        };
      }

      if (
        type === "number" ||
        name === "basePrice" ||
        name === "amount" ||
        name === "discountedPrice" ||
        name === "currentPrice"
      ) {
        return {
          ...prev,
          [name]: value === "" ? "" : parseFloat(value),
        };
      }

      return {
        ...prev,
        [name]: value,
      };
    });
  };

  const addIncludedItem = () => {
    if (!newIncludedItem.title.trim()) return;

    setFormData((prev) => ({
      ...prev,
      features: [...prev.features, newIncludedItem.title],
    }));

    setNewIncludedItem({ title: "", description: "" });
  };

  const addProcessItem = () => {
    if (!newProcessItem.title.trim()) return;

    setFormData((prev) => ({
      ...prev,
      process: [...prev.process, newProcessItem.title],
    }));

    setNewProcessItem({ title: "", description: "" });
  };

  const removeIncludedItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  const removeProcessItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      process: prev.process.filter((_, i) => i !== index),
    }));
  };

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
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="text-2xl font-bold">
                Create New Service
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Fill in the service details below. All fields are required
                unless marked as optional.
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={handleSubmit}
              className="flex-1 flex flex-col min-h-0"
            >
              <div className="space-y-6 py-2 overflow-y-auto pr-2 -mr-2">
                {/* Basic Information Section */}
                <div className="space-y-4 p-4 bg-muted/20 rounded-lg">
                  <div className="space-y-2">
                    <h3 className="font-medium">Basic Information</h3>
                    <p className="text-sm text-muted-foreground">
                      Enter the basic details of your service.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Service Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="e.g., Web Development"
                        required
                        disabled={isSubmitting}
                        className="bg-background"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Category *</Label>
                      <Input
                        id="category"
                        value={formData.category}
                        onChange={(e) =>
                          setFormData({ ...formData, category: e.target.value })
                        }
                        placeholder="e.g., Web Development, Design"
                        required
                        disabled={isSubmitting}
                        className="bg-background"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="basePrice">Price ($) *</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          $
                        </span>
                        <Input
                          id="basePrice"
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.basePrice}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              basePrice: Number(e.target.value),
                            })
                          }
                          placeholder="0.00"
                          required
                          disabled={isSubmitting}
                          className="pl-8 bg-background"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Status *</Label>
                      <div className="flex items-center space-x-2">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={formData.status === "active"}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                status: e.target.checked
                                  ? "active"
                                  : "inactive",
                              })
                            }
                            disabled={isSubmitting}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          <span className="ml-3 text-sm font-medium text-gray-900">
                            {formData.status === "active"
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      placeholder="Describe the service in detail. What makes it special? What problems does it solve?"
                      rows={3}
                      required
                      disabled={isSubmitting}
                      className="bg-background"
                    />
                    <p className="text-xs text-muted-foreground">
                      A clear description helps clients understand your service
                      better.
                    </p>
                  </div>
                </div>

                {/* What's Included Section */}
                <div className="space-y-4 p-4 bg-muted/10 rounded-lg">
                  <div className="space-y-2">
                    <h3 className="font-medium">What's Included</h3>
                    <p className="text-sm text-muted-foreground">
                      List all features and benefits included in this service.
                    </p>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                      <div className="sm:col-span-2 space-y-1">
                        <Label className="text-xs">Feature Title</Label>
                        <Input
                          placeholder="e.g., Responsive Design"
                          value={newIncludedItem.title}
                          onChange={(e) =>
                            setNewIncludedItem((prev) => ({
                              ...prev,
                              title: e.target.value,
                            }))
                          }
                          className="bg-background"
                        />
                      </div>
                      <div className="sm:col-span-2 space-y-1">
                        <Label className="text-xs">
                          Description (Optional)
                        </Label>
                        <Input
                          placeholder="e.g., Mobile-friendly design that works on all devices"
                          value={newIncludedItem.description}
                          onChange={(e) =>
                            setNewIncludedItem((prev) => ({
                              ...prev,
                              description: e.target.value,
                            }))
                          }
                          onKeyDown={(e) =>
                            e.key === "Enter" && addIncludedItem()
                          }
                          className="bg-background"
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          type="button"
                          size="sm"
                          onClick={addIncludedItem}
                          disabled={!newIncludedItem.title.trim()}
                          className="w-full sm:w-auto"
                        >
                          Add Feature
                        </Button>
                      </div>
                    </div>

                    {formData.features.length > 0 && (
                      <div className="space-y-2 mt-3">
                        <div className="text-sm font-medium">
                          Included Features ({formData.features.length})
                        </div>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                          {formData.features.map((item, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-2 bg-background rounded-md"
                            >
                              <div>
                                <p className="text-sm font-medium">
                                  {getItemDisplayText(item, index)}
                                </p>
                                {typeof item !== "string" &&
                                  item.description && (
                                    <p className="text-xs text-muted-foreground">
                                      {item.description}
                                    </p>
                                  )}
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeIncludedItem(index)}
                                className="text-destructive hover:text-destructive/80"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Process Steps Section */}
                <div className="space-y-4 p-4 bg-muted/10 rounded-lg">
                  <div className="space-y-2">
                    <h3 className="font-medium">Our Process</h3>
                    <p className="text-sm text-muted-foreground">
                      Outline the steps involved in delivering this service.
                    </p>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                      <div className="sm:col-span-2 space-y-1">
                        <Label className="text-xs">Step Title</Label>
                        <Input
                          placeholder="e.g., Initial Consultation"
                          value={newProcessItem.title}
                          onChange={(e) =>
                            setNewProcessItem((prev) => ({
                              ...prev,
                              title: e.target.value,
                            }))
                          }
                          className="bg-background"
                        />
                      </div>
                      <div className="sm:col-span-2 space-y-1">
                        <Label className="text-xs">
                          Description (Optional)
                        </Label>
                        <Input
                          placeholder="e.g., 30-minute call to discuss requirements"
                          value={newProcessItem.description}
                          onChange={(e) =>
                            setNewProcessItem((prev) => ({
                              ...prev,
                              description: e.target.value,
                            }))
                          }
                          onKeyDown={(e) =>
                            e.key === "Enter" && addProcessItem()
                          }
                          className="bg-background"
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          type="button"
                          size="sm"
                          onClick={addProcessItem}
                          disabled={!newProcessItem.title.trim()}
                          className="w-full sm:w-auto"
                        >
                          Add Step
                        </Button>
                      </div>
                    </div>

                    {formData.process.length > 0 && (
                      <div className="space-y-2 mt-3">
                        <div className="text-sm font-medium">
                          Process Steps ({formData.process.length})
                        </div>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                          {formData.process.map((step, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-2 bg-background rounded-md"
                            >
                              <div>
                                <p className="text-sm font-medium">
                                  {typeof step === "string"
                                    ? step
                                    : step.title ||
                                      step.description ||
                                      `Step ${index + 1}`}
                                </p>
                                {typeof step === "object" &&
                                  step.description && (
                                    <p className="text-xs text-muted-foreground">
                                      {step.description}
                                    </p>
                                  )}
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeProcessItem(index)}
                                className="text-destructive hover:text-destructive/80"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <DialogFooter className="flex-shrink-0 pt-4 border-t mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isEditing ? "Updating..." : "Creating..."}
                    </>
                  ) : isEditing ? (
                    "Update Service"
                  ) : (
                    "Create Service"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search services by name, description, or category..."
                  className="pl-10 w-full md:w-96"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1); // Reset to first page on search
                  }}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Select
                value={activeOnly ? "active" : "all"}
                onValueChange={(value) => {
                  setActiveOnly(value === "active");
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[180px]">
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
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Per page" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 per page</SelectItem>
                  <SelectItem value="10">10 per page</SelectItem>
                  <SelectItem value="20">20 per page</SelectItem>
                  <SelectItem value="50">50 per page</SelectItem>
                </SelectContent>
              </Select>
              {canModify && (
                <Button
                  onClick={() => {
                    setIsOpen(true);
                    resetForm();
                  }}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Service
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <LoadingSpinner />
            </div>
          ) : sortedAndFilteredServices.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground mb-4">
                {searchTerm || activeOnly
                  ? "No services match your filters."
                  : "No services found. Create your first service to get started."}
              </p>
              <Button
                onClick={() => {
                  setSearchTerm("");
                  setFilterStatus("");
                  setActiveOnly(false);
                  resetForm();
                  setIsOpen(true);
                }}
                className="mt-2"
              >
                <Plus className="mr-2 h-4 w-4" />
                {searchTerm || activeOnly
                  ? "Clear filters"
                  : "Add Your First Service"}
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
                      <TableHead>Included</TableHead>
                      <TableHead>Process</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentServices.map((service) => (
                      <TableRow key={service._id}>
                        <TableCell className="font-medium">
                          {service.name}
                        </TableCell>
                        <TableCell>{service.category}</TableCell>
                        <TableCell>
                          ${service.basePrice?.toFixed(2) || "0.00"}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(service.isActive)}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {service.features
                              ?.slice(0, 2)
                              .map((feature, index) => (
                                <div
                                  key={index}
                                  className="text-xs line-clamp-1"
                                >
                                  {getItemDisplayText(feature, index)}
                                </div>
                              ))}
                            {service.features?.length > 2 && (
                              <div className="text-xs text-muted-foreground">
                                +{service.features.length - 2} more
                              </div>
                            )}
                            {(!service.features ||
                              service.features.length === 0) && (
                              <span className="text-xs text-muted-foreground">
                                None
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {service.process?.slice(0, 2).map((step, index) => (
                              <div key={index} className="text-xs line-clamp-1">
                                {getItemDisplayText(step, index)}
                              </div>
                            ))}
                            {service.process?.length > 2 && (
                              <div className="text-xs text-muted-foreground">
                                +{service.process.length - 2} more
                              </div>
                            )}
                            {(!service.process ||
                              service.process.length === 0) && (
                              <span className="text-xs text-muted-foreground">
                                None
                              </span>
                            )}
                          </div>
                        </TableCell>
                        {canModify && (
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditService(service)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteService(service._id)}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
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
                <div className="grid gap-4 p-4 md:grid-cols-2 lg:grid-cols-3">
                  {currentServices.map((service) => (
                    <Card key={service._id} className="overflow-hidden">
                      <div className="p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-lg">
                              {service.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {service.category}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge
                              variant={service.isActive ? "default" : "outline"}
                            >
                              {service.isActive ? "Active" : "Inactive"}
                            </Badge>
                            <div className="font-bold">
                              ${service.basePrice?.toFixed(2) || "0.00"}
                            </div>
                          </div>
                        </div>

                        {service.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {service.description}
                          </p>
                        )}

                        <div className="space-y-2 pt-2">
                          <h4 className="text-sm font-medium">Features</h4>
                          <div className="space-y-1">
                            {service.features
                              ?.slice(0, 3)
                              .map((feature, index) => (
                                <div key={index} className="flex items-start">
                                  <div className="flex-shrink-0 h-5 w-5 text-green-500">
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      viewBox="0 0 20 20"
                                      fill="currentColor"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  </div>
                                  <span className="ml-2 text-sm">
                                    {getItemDisplayText(feature, index)}
                                  </span>
                                </div>
                              ))}
                            {service.features?.length > 3 && (
                              <div className="text-xs text-muted-foreground mt-1">
                                +{service.features.length - 3} more features
                              </div>
                            )}
                            {(!service.features ||
                              service.features.length === 0) && (
                              <p className="text-xs text-muted-foreground">
                                No features added
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="pt-2 flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditService(service)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteService(service._id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
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
              <Loader2 className="h-8 w-8 animate-spin" />
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
                          Requested by: {request.user?.fName}{" "}
                          {request.user?.lName ||
                            request.user?.email ||
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
    </div>
  );
}
