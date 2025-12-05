import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, DollarSign, Percent, Calendar } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { clientsService } from "@/services/api/clientsService";

interface UpdateSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  subscription: {
    _id: string;
    plan: {
      _id: string;
      name: string;
      price: number;
    };
    customPrice?: number;
    discount?: number;
    billingCycle: string;
    expiresAt: string;
  };
  onSuccess?: () => void;
}

export function UpdateSubscriptionDialog({
  open,
  onOpenChange,
  clientId,
  subscription,
  onSuccess,
}: UpdateSubscriptionDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    customPrice: subscription.customPrice || subscription.plan.price,
    discount: subscription.discount || 0,
    billingCycle: subscription.billingCycle,
    endDate: subscription.expiresAt
      ? new Date(subscription.expiresAt).toISOString().split("T")[0]
      : "",
  });

  const basePrice = formData.customPrice;
  const discountAmount = (basePrice * formData.discount) / 100;
  const finalPrice = basePrice - discountAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsLoading(true);

      // The assign endpoint expects: planId, billingCycle, startDate, customPrice, discount, generateInvoice
      await clientsService.updateClientSubscription(clientId, {
        planId: subscription.plan._id, // Required field
        billingCycle: formData.billingCycle,
        startDate: new Date().toISOString().split("T")[0], // Use current date for updates
        endDate: formData.endDate,
        customPrice:
          formData.customPrice !== subscription.plan.price
            ? formData.customPrice
            : undefined,
        discount: formData.discount > 0 ? formData.discount : 0,
        generateInvoice: false, // Don't generate invoice on update
      });

      toast({
        title: "Success",
        description: "Subscription updated successfully",
      });
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error("Error updating subscription:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to update subscription",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Update Subscription</DialogTitle>
          <DialogDescription>
            Modify subscription details for {subscription.plan.name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Current Plan:</span>
              <span className="font-medium">{subscription.plan.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Base Price:</span>
              <span className="font-medium">
                ${subscription.plan.price.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customPrice">Custom Price</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
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
                className="pl-10"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="discount">Discount (%)</Label>
            <div className="relative">
              <Percent className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="discount"
                type="number"
                min="0"
                max="100"
                step="1"
                value={formData.discount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    discount: parseFloat(e.target.value) || 0,
                  })
                }
                className="pl-10"
                placeholder="0"
              />
            </div>
            {formData.discount > 0 && (
              <p className="text-xs text-green-600">
                Saving ${discountAmount.toFixed(2)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="billingCycle">Billing Cycle</Label>
            <Select
              value={formData.billingCycle}
              onValueChange={(value) =>
                setFormData({ ...formData, billingCycle: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select billing cycle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="annually">Annually</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate">Subscription End Date</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg space-y-2">
            <h4 className="font-semibold text-sm">Updated Pricing Summary</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Price:</span>
                <span className="font-medium">${basePrice.toFixed(2)}</span>
              </div>
              {formData.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount ({formData.discount}%):</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t border-border pt-2">
                <span>Final Price:</span>
                <span className="text-primary">${finalPrice.toFixed(2)}</span>
              </div>
              <p className="text-xs text-muted-foreground text-right">
                per{" "}
                {formData.billingCycle === "monthly"
                  ? "month"
                  : formData.billingCycle === "quarterly"
                  ? "quarter"
                  : "year"}
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Subscription"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
