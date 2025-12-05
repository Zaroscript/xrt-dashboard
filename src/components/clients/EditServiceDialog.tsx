import React, { useState } from "react";
import { motion } from "framer-motion";
import { DollarSign, Percent, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { clientsService } from "@/services/api/clientsService";
import { AssignedService } from "@/types/service.types";
import {
  getServicePrice,
  getServiceName,
  getServiceId,
} from "@/utils/serviceUtils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

interface EditServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: AssignedService;
  onUpdate: () => void;
  clientId: string;
}

export const EditServiceDialog: React.FC<EditServiceDialogProps> = ({
  open,
  onOpenChange,
  service,
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
      onOpenChange(false);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl border-border/50 shadow-lg">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-xl font-semibold text-foreground">Edit Service</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Update service details and pricing for {getServiceName(service)}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Service</Label>
            <div className="px-3 py-2 bg-muted/50 border border-border/50 rounded-lg text-muted-foreground">
              {getServiceName(service)}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customPrice" className="text-sm font-medium text-foreground">Custom Price</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                <Input
                  id="customPrice"
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
                  className="pl-10 bg-background transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Base price: ${servicePrice.toFixed(2)}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="discount" className="text-sm font-medium text-foreground">Discount (%)</Label>
              <div className="relative">
                <Percent className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                <Input
                  id="discount"
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
                  className="pl-10 bg-background transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-sm font-medium text-foreground">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                className="bg-background transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate" className="text-sm font-medium text-foreground">End Date (Optional)</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
                className="bg-background transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isRecurring"
              checked={formData.isRecurring}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isRecurring: checked as boolean })
              }
            />
            <Label
              htmlFor="isRecurring"
              className="font-normal cursor-pointer text-foreground"
            >
              Recurring Service
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium text-foreground">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={3}
              className="bg-background transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary/50 placeholder:text-muted-foreground/60 resize-none"
              placeholder="Add any notes..."
            />
          </div>

          <div className="p-4 bg-muted/30 border border-border/50 rounded-lg space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Base Price</span>
              <span className="font-medium text-foreground">${basePrice.toFixed(2)}</span>
            </div>
            {formData.discount > 0 && (
              <div className="flex justify-between text-green-600 dark:text-green-400">
                <span>Discount ({formData.discount}%)</span>
                <span>-${discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-border font-medium">
              <span className="text-foreground">Final Price</span>
              <span className="text-primary font-semibold">${finalPrice.toFixed(2)}</span>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="border-border hover:bg-accent/50 hover:text-accent-foreground transition-colors duration-200"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-primary hover:bg-primary/90 text-primary-foreground transition-colors duration-200"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Service"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
