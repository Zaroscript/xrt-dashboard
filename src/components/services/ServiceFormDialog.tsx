import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, Trash2 } from "lucide-react";
import {
  ServiceFormData,
  FeatureItem,
  ProcessItem,
} from "@/types/service.types";
import { getItemDisplayText } from "@/utils/serviceUtils";

interface ServiceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: ServiceFormData;
  onSubmit: (data: ServiceFormData) => Promise<void>;
  isSubmitting: boolean;
}

const defaultFormData: ServiceFormData = {
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
};

export const ServiceFormDialog: React.FC<ServiceFormDialogProps> = ({
  open,
  onOpenChange,
  initialData,
  onSubmit,
  isSubmitting,
}) => {
  const [formData, setFormData] = useState<ServiceFormData>(defaultFormData);
  const [newIncludedItem, setNewIncludedItem] = useState<{
    title: string;
    description: string;
  }>({ title: "", description: "" });
  const [newProcessItem, setNewProcessItem] = useState<{
    title: string;
    description: string;
  }>({ title: "", description: "" });

  useEffect(() => {
    if (open) {
      if (initialData) {
        setFormData(initialData);
      } else {
        setFormData(defaultFormData);
      }
    }
  }, [open, initialData]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const isEditing = !!initialData?._id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col border-border/50 shadow-lg">
        <DialogHeader className="flex-shrink-0 space-y-3">
          <DialogTitle className="text-2xl font-bold text-foreground">
            {isEditing ? "Edit Service" : "Create New Service"}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Fill in the service details below. All fields are required unless
            marked as optional.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="space-y-6 py-2 overflow-y-auto pr-2 -mr-2">
            {/* Basic Information Section */}
            <div className="space-y-4 p-4 bg-muted/20 border border-border/30 rounded-lg">
              <div className="space-y-2">
                <h3 className="font-medium text-foreground">Basic Information</h3>
                <p className="text-sm text-muted-foreground">
                  Enter the basic details of your service.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-foreground">Service Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., Web Development"
                    required
                    disabled={isSubmitting}
                    className="bg-background transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm font-medium text-foreground">Category *</Label>
                  <Input
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    placeholder="e.g., Web Development, Design"
                    required
                    disabled={isSubmitting}
                    className="bg-background transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="basePrice" className="text-sm font-medium text-foreground">Price ($) *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      $
                    </span>
                    <Input
                      id="basePrice"
                      name="basePrice"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.basePrice}
                      onChange={handleChange}
                      placeholder="0.00"
                      required
                      disabled={isSubmitting}
                      className="pl-8 bg-background transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-medium text-foreground">Status *</Label>
                  <div className="flex items-center space-x-3">
                    <Switch
                      id="status"
                      checked={formData.status === "active"}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          status: checked ? "active" : "inactive",
                        })
                      }
                      disabled={isSubmitting}
                    />
                    <Label 
                      htmlFor="status" 
                      className="text-sm font-medium cursor-pointer text-foreground"
                    >
                      {formData.status === "active" ? "Active" : "Inactive"}
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Active services will be visible to clients and available for assignment.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium text-foreground">Description *</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe the service in detail. What makes it special? What problems does it solve?"
                  rows={3}
                  required
                  disabled={isSubmitting}
                  className="bg-background transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary/50 resize-none placeholder:text-muted-foreground/60"
                />
                <p className="text-xs text-muted-foreground">
                  A clear description helps clients understand your service
                  better.
                </p>
              </div>
            </div>

            {/* What's Included Section */}
            <div className="space-y-4 p-4 bg-muted/20 border border-border/30 rounded-lg">
              <div className="space-y-2">
                <h3 className="font-medium text-foreground">What's Included</h3>
                <p className="text-sm text-muted-foreground">
                  List all features and benefits included in this service.
                </p>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <Label className="text-xs font-medium text-foreground">Feature Title</Label>
                    <Input
                      placeholder="e.g., Responsive Design"
                      value={newIncludedItem.title}
                      onChange={(e) =>
                        setNewIncludedItem((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      className="bg-background transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-1">
                    <Label className="text-xs font-medium text-foreground">Description (Optional)</Label>
                    <Input
                      placeholder="e.g., Mobile-friendly design that works on all devices"
                      value={newIncludedItem.description}
                      onChange={(e) =>
                        setNewIncludedItem((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => e.key === "Enter" && addIncludedItem()}
                      className="bg-background transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      size="sm"
                      onClick={addIncludedItem}
                      disabled={!newIncludedItem.title.trim()}
                      className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground transition-colors duration-200"
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
                            {typeof item !== "string" && item.description && (
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
            <div className="space-y-4 p-4 bg-muted/20 border border-border/30 rounded-lg">
              <div className="space-y-2">
                <h3 className="font-medium text-foreground">Our Process</h3>
                <p className="text-sm text-muted-foreground">
                  Outline the steps involved in delivering this service.
                </p>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <Label className="text-xs font-medium text-foreground">Step Title</Label>
                    <Input
                      placeholder="e.g., Initial Consultation"
                      value={newProcessItem.title}
                      onChange={(e) =>
                        setNewProcessItem((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      className="bg-background transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-1">
                    <Label className="text-xs font-medium text-foreground">Description (Optional)</Label>
                    <Input
                      placeholder="e.g., 30-minute call to discuss requirements"
                      value={newProcessItem.description}
                      onChange={(e) =>
                        setNewProcessItem((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => e.key === "Enter" && addProcessItem()}
                      className="bg-background transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      size="sm"
                      onClick={addProcessItem}
                      disabled={!newProcessItem.title.trim()}
                      className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground transition-colors duration-200"
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
                            {typeof step === "object" && step.description && (
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

          <DialogFooter className="flex-shrink-0 pt-4 border-t border-border mt-4 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-border hover:bg-accent/50 hover:text-accent-foreground transition-colors duration-200"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90 text-primary-foreground transition-colors duration-200"
            >
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
  );
};
