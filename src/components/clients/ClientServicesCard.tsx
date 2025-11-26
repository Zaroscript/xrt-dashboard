import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  Plus,
  Edit,
  Trash2,
  Calendar,
  DollarSign,
  Percent,
  Tag,
  Info,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { clientsService } from "@/services/api/clientsService";
import { useToast } from "@/components/ui/use-toast";

interface ServiceData {
  _id: string;
  service:
    | {
        _id: string;
        name: string;
        description?: string;
        price: number;
      }
    | string; // Can be either populated object or just ID string
  customPrice?: number;
  discount?: number;
  isRecurring?: boolean;
  startDate: string;
  endDate?: string;
  notes?: string;
  status: string;
}

interface ClientServicesCardProps {
  clientId: string;
  services: ServiceData[];
  onUpdate?: () => void;
  onAddService?: () => void;
}

interface EditServiceDialogProps {
  service: ServiceData;
  onClose: () => void;
  onUpdate: () => void;
  clientId: string;
}

// Helper functions to safely handle service data
const isServicePopulated = (
  service: ServiceData["service"]
): service is {
  _id: string;
  name: string;
  description?: string;
  price: number;
} => {
  return typeof service === "object" && service !== null && "price" in service;
};

const getServicePrice = (service: ServiceData): number => {
  if (isServicePopulated(service.service)) {
    return service.service.price;
  }
  return service.customPrice || 0;
};

const getServiceName = (service: ServiceData): string => {
  if (isServicePopulated(service.service)) {
    return service.service.name;
  }
  return "Unknown Service";
};

const getServiceId = (service: ServiceData): string => {
  if (isServicePopulated(service.service)) {
    return service.service._id;
  }
  return typeof service.service === "string" ? service.service : "";
};

const EditServiceDialog: React.FC<EditServiceDialogProps> = ({
  service,
  onClose,
  onUpdate,
  clientId,
}) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const servicePrice = getServicePrice(service);
  const [formData, setFormData] = useState({
    customPrice: service.customPrice || servicePrice,
    discount: service.discount || 0,
    isRecurring: service.isRecurring || false,
    startDate: service.startDate.split("T")[0],
    endDate: service.endDate ? service.endDate.split("T")[0] : "",
    notes: service.notes || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      const serviceId = getServiceId(service);
      await clientsService.updateService(clientId, serviceId, {
        customPrice: formData.customPrice,
        discount: formData.discount,
        isRecurring: formData.isRecurring,
        startDate: formData.startDate,
        endDate: formData.endDate || undefined,
        notes: formData.notes,
      });

      toast({
        title: "Success",
        description: "Service updated successfully",
      });
      onUpdate();
      onClose();
    } catch (error: any) {
      console.error("Error updating service:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to update service",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const basePrice = formData.customPrice;
  const discountAmount = (basePrice * formData.discount) / 100;
  const finalPrice = basePrice - discountAmount;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto"
      >
        <h3 className="text-xl font-semibold text-white mb-4">Edit Service</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Service
            </label>
            <div className="px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-400">
              {getServiceName(service)}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Custom Price
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.customPrice}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      customPrice: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full pl-10 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg 
                           text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Base price: ${servicePrice.toFixed(2)}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Discount (%)
              </label>
              <div className="relative">
                <Percent className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.discount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      discount: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full pl-10 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg 
                           text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg 
                         text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                End Date (Optional)
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg 
                         text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isRecurring}
                onChange={(e) =>
                  setFormData({ ...formData, isRecurring: e.target.checked })
                }
                className="w-4 h-4 bg-gray-800 border-gray-700 rounded"
              />
              Recurring Service
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={3}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg 
                       text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add any notes..."
            />
          </div>

          <div className="p-4 bg-gray-800/50 rounded-lg space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Base Price</span>
              <span className="text-white">${basePrice.toFixed(2)}</span>
            </div>
            {formData.discount > 0 && (
              <div className="flex justify-between text-green-400">
                <span>Discount ({formData.discount}%)</span>
                <span>-${discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-gray-700 font-medium">
              <span className="text-white">Final Price</span>
              <span className="text-white">${finalPrice.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white 
                       rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white 
                       rounded-lg transition-colors disabled:opacity-50 flex items-center 
                       justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Service"
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export const ClientServicesCard: React.FC<ClientServicesCardProps> = ({
  clientId,
  services,
  onUpdate,
  onAddService,
}) => {
  const { toast } = useToast();
  const [editingService, setEditingService] = useState<ServiceData | null>(
    null
  );
  const [deletingServiceId, setDeletingServiceId] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(false);

  const calculateFinalPrice = (service: ServiceData) => {
    const basePrice = service.customPrice || getServicePrice(service);
    const discount = service.discount || 0;
    const discountAmount = (basePrice * discount) / 100;
    return basePrice - discountAmount;
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "text-green-400 bg-green-400/10";
      case "inactive":
        return "text-gray-400 bg-gray-400/10";
      case "suspended":
        return "text-red-400 bg-red-400/10";
      default:
        return "text-yellow-400 bg-yellow-400/10";
    }
  };

  const handleRemoveService = async (serviceId: string) => {
    try {
      setLoading(true);
      await clientsService.removeService(clientId, serviceId);

      toast({
        title: "Success",
        description: "Service removed successfully",
      });

      onUpdate?.();
      setDeletingServiceId(null);
    } catch (error: any) {
      console.error("Error removing service:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to remove service",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card className="glass-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Assigned Services
            </div>
            {services.length > 0 && (
              <span className="text-sm text-muted-foreground font-normal">
                {services.length}{" "}
                {services.length === 1 ? "service" : "services"}
              </span>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {onAddService && services.length > 0 && (
            <Button
              onClick={onAddService}
              variant="outline"
              className="w-full border-primary/20 hover:border-primary/40 hover:bg-primary/5"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Service
            </Button>
          )}

          {/* Services List */}
          {services.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">No services assigned</p>
              {onAddService && (
                <Button
                  onClick={onAddService}
                  variant="outline"
                  className="border-primary/20 hover:border-primary/40 hover:bg-primary/5"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Service
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {services.map((service, index) => {
                  const finalPrice = calculateFinalPrice(service);
                  const hasCustomPrice = service.customPrice !== undefined;
                  const hasDiscount = service.discount && service.discount > 0;

                  return (
                    <motion.div
                      key={service._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 bg-muted/30 border border-border/50 rounded-lg hover:bg-muted/50 
                             hover:border-border transition-all duration-200"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">
                              {getServiceName(service)}
                            </h4>
                            <Badge
                              variant={
                                service.status === "active"
                                  ? "default"
                                  : "secondary"
                              }
                              className="text-xs"
                            >
                              {service.status}
                            </Badge>
                            {service.isRecurring && (
                              <Badge
                                variant="outline"
                                className="text-xs border-primary/30 text-primary"
                              >
                                Recurring
                              </Badge>
                            )}
                          </div>

                          {isServicePopulated(service.service) &&
                            service.service.description && (
                              <p className="text-sm text-muted-foreground mb-3">
                                {service.service.description}
                              </p>
                            )}

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="space-y-2">
                              {hasCustomPrice &&
                                isServicePopulated(service.service) && (
                                  <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground flex items-center gap-1">
                                      <Tag className="w-3 h-3" />
                                      Base Price
                                    </span>
                                    <span className="text-muted-foreground/60 line-through">
                                      ${service.service.price.toFixed(2)}
                                    </span>
                                  </div>
                                )}

                              {hasCustomPrice && (
                                <div className="flex items-center justify-between">
                                  <span className="text-muted-foreground">
                                    Custom Price
                                  </span>
                                  <span className="font-medium">
                                    ${(service.customPrice || 0).toFixed(2)}
                                  </span>
                                </div>
                              )}

                              {hasDiscount && (
                                <div className="flex items-center justify-between">
                                  <span className="text-muted-foreground flex items-center gap-1">
                                    <Percent className="w-3 h-3" />
                                    Discount
                                  </span>
                                  <span className="text-green-500">
                                    {service.discount}% off
                                  </span>
                                </div>
                              )}

                              <div className="flex items-center justify-between pt-2 border-t border-border">
                                <span className="font-medium flex items-center gap-1">
                                  <DollarSign className="w-3 h-3" />
                                  Final Price
                                </span>
                                <span className="font-bold text-primary">
                                  ${finalPrice.toFixed(2)}
                                </span>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  Start
                                </span>
                                <span className="font-medium">
                                  {new Date(
                                    service.startDate
                                  ).toLocaleDateString()}
                                </span>
                              </div>

                              {service.endDate && (
                                <div className="flex items-center justify-between">
                                  <span className="text-muted-foreground flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    End
                                  </span>
                                  <span className="font-medium">
                                    {new Date(
                                      service.endDate
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                              )}

                              {service.notes && (
                                <div className="pt-2 border-t border-border">
                                  <span className="text-muted-foreground text-xs">
                                    Notes:
                                  </span>
                                  <p className="text-muted-foreground/80 text-xs mt-1">
                                    {service.notes}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingService(service)}
                            className="text-primary hover:text-primary/80 hover:bg-primary/10"
                            title="Edit service"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setDeletingServiceId(getServiceId(service))
                            }
                            className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                            title="Remove service"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Service Dialog */}
      {editingService && (
        <EditServiceDialog
          service={editingService}
          clientId={clientId}
          onClose={() => setEditingService(null)}
          onUpdate={() => {
            onUpdate?.();
            setEditingService(null);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deletingServiceId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border rounded-lg p-6 max-w-md w-full shadow-lg"
          >
            <h3 className="text-xl font-semibold mb-4">Remove Service</h3>

            <p className="text-muted-foreground mb-6">
              Are you sure you want to remove this service? This action cannot
              be undone.
            </p>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setDeletingServiceId(null)}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleRemoveService(deletingServiceId)}
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Removing...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove Service
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};
