import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Calendar,
  TrendingUp,
  Percent,
  DollarSign,
  CheckCircle2,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { usePlansStore } from "@/stores/plans/usePlansStore";
import { clientsService } from "@/services/api/clientsService";
import { format } from "date-fns";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

interface ChangePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  currentSubscription: {
    _id: string;
    plan:
      | {
          _id: string;
          name: string;
          price: number;
          features?: string[];
        }
      | string;
    customPrice?: number;
    discount?: number;
    billingCycle: string;
    startDate: string;
    expiresAt?: string;
  };
  onSuccess?: () => void;
}

export function ChangePlanDialog({
  open,
  onOpenChange,
  clientId,
  currentSubscription,
  onSuccess,
}: ChangePlanDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const {
    plans = [],
    fetchPlans,
    loading: plansLoading,
    error: plansError,
  } = usePlansStore();
  const [isInitialized, setIsInitialized] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const allPlans = useMemo(
    () =>
      Array.isArray(plans)
        ? plans.filter((plan: any) => plan?.isActive !== false)
        : [],
    [plans]
  );

  const currentPlan =
    typeof currentSubscription.plan === "object"
      ? currentSubscription.plan
      : null;
  const currentPlanId =
    typeof currentSubscription.plan === "object"
      ? currentSubscription.plan._id
      : currentSubscription.plan;

  const [formData, setFormData] = useState({
    planId: currentPlanId,
    billingCycle: currentSubscription.billingCycle,
    useCustomPrice: currentSubscription.customPrice !== undefined,
    customPrice: currentSubscription.customPrice || currentPlan?.price || 0,
    discount: currentSubscription.discount || 0,
    generateInvoice: false,
    customFeatures: [] as string[],
    useCustomFeatures: false,
  });

  const [selectedPlan, setSelectedPlan] = useState<any>(
    allPlans.find((p: any) => p._id === currentPlanId) || null
  );

  useEffect(() => {
    if (open && !isInitialized) {
      setFetchError(null);
      fetchPlans()
        .then(() => {
          setIsInitialized(true);
        })
        .catch((error) => {
          console.error("Error fetching plans:", error);
          setFetchError(error?.message || "Failed to load plans");
          setIsInitialized(true);
          toast({
            title: "Error",
            description: "Failed to load plans. Please try again.",
            variant: "destructive",
          });
        });
    }
  }, [open, isInitialized, fetchPlans, toast]);

  // Reset initialization state when dialog closes
  useEffect(() => {
    if (!open) {
      setIsInitialized(false);
      setFetchError(null);
      // Reset form to current subscription values
      const plan =
        typeof currentSubscription.plan === "object"
          ? currentSubscription.plan
          : null;
      const planId =
        typeof currentSubscription.plan === "object"
          ? currentSubscription.plan._id
          : currentSubscription.plan;

      setFormData({
        planId: planId,
        billingCycle: currentSubscription.billingCycle,
        useCustomPrice: currentSubscription.customPrice !== undefined,
        customPrice: currentSubscription.customPrice || plan?.price || 0,
        discount: currentSubscription.discount || 0,
        generateInvoice: false,
        customFeatures: [],
        useCustomFeatures: false,
      });
      setSelectedPlan(allPlans.find((p: any) => p._id === planId) || null);
    }
  }, [open, currentSubscription, allPlans]);

  // Update selected plan when planId changes
  useEffect(() => {
    if (formData.planId && allPlans.length > 0) {
      const plan = allPlans.find((p: any) => p._id === formData.planId);
      if (plan) {
        setSelectedPlan(plan);
        // Reset custom price to new plan's price if not using custom price
        if (!formData.useCustomPrice) {
          setFormData((prev) => ({
            ...prev,
            customPrice: plan.price,
          }));
        }
      }
    }
  }, [formData.planId, allPlans, formData.useCustomPrice]);

  const handlePlanChange = (planId: string) => {
    setFormData((prev) => ({ ...prev, planId }));
  };

  const handleFeatureToggle = (feature: string) => {
    setFormData((prev) => {
      const features = prev.customFeatures.includes(feature)
        ? prev.customFeatures.filter((f) => f !== feature)
        : [...prev.customFeatures, feature];
      return { ...prev, customFeatures: features };
    });
  };

  const basePrice = formData.useCustomPrice
    ? formData.customPrice
    : selectedPlan?.price || 0;
  const discountAmount = (basePrice * formData.discount) / 100;
  const finalPrice = basePrice - discountAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.planId) {
      toast({
        title: "Error",
        description: "Please select a plan",
        variant: "destructive",
      });
      return;
    }

    if (formData.useCustomPrice && formData.customPrice <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid price",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      const payload: any = {
        planId: formData.planId,
        billingCycle: formData.billingCycle,
        startDate: format(new Date(), "yyyy-MM-dd"),
        generateInvoice: formData.generateInvoice,
      };

      // Only include customPrice if useCustomPrice is true
      if (formData.useCustomPrice) {
        payload.customPrice = formData.customPrice;
      }

      // Only include discount if it's greater than 0
      if (formData.discount > 0) {
        payload.discount = formData.discount;
      }

      // Only include customFeatures if useCustomFeatures is true and features are selected
      if (formData.useCustomFeatures && formData.customFeatures.length > 0) {
        payload.customFeatures = formData.customFeatures;
      }

      
      await clientsService.assignSubscription(clientId, payload);

      toast({
        title: "Success",
        description: "Plan changed successfully",
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error("Error changing plan:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);

      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to change plan. Please try again.";

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setIsInitialized(false);
    setFetchError(null);
  };

  if (plansLoading || (!isInitialized && !fetchError)) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Loading Plans...</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm text-muted-foreground">
              {plansLoading ? "Loading plans..." : "Initializing..."}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (fetchError || plansError) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Error Loading Plans</DialogTitle>
            <DialogDescription>
              We encountered an issue while loading the available plans.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <p className="text-sm text-destructive">
              {fetchError || plansError}
            </p>
            <Button onClick={handleRetry} variant="outline">
              <Loader2 className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Change Plan</DialogTitle>
          <DialogDescription>
            Change the subscription plan for this client. You can customize the
            price, discount, and features for this specific client.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current Plan Info */}
          {currentPlan && (
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <h4 className="font-semibold text-sm">Current Plan</h4>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Plan:</span>
                <span className="font-medium">{currentPlan.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Price:</span>
                <span className="font-medium">
                  {formatCurrency(
                    currentSubscription.customPrice || currentPlan.price
                  )}
                </span>
              </div>
              {currentSubscription.discount &&
                currentSubscription.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount:</span>
                    <span className="font-medium text-green-600">
                      {currentSubscription.discount}%
                    </span>
                  </div>
                )}
            </div>
          )}

          {/* Plan Selection */}
          <div className="space-y-2">
            <Label htmlFor="plan">Select New Plan</Label>
            <Select value={formData.planId} onValueChange={handlePlanChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a plan" />
              </SelectTrigger>
              <SelectContent>
                {allPlans.map((plan: any) => (
                  <SelectItem key={plan._id} value={plan._id}>
                    {plan.name} - {formatCurrency(plan.price)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedPlan && (
              <p className="text-xs text-muted-foreground">
                {selectedPlan.description || "No description available"}
              </p>
            )}
          </div>

          {/* Billing Cycle */}
          <div className="space-y-2">
            <Label htmlFor="billingCycle">Billing Cycle</Label>
            <Select
              value={formData.billingCycle}
              onValueChange={(value) =>
                setFormData({ ...formData, billingCycle: value as any })
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

          {/* Custom Price */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="useCustomPrice"
                checked={formData.useCustomPrice}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    useCustomPrice: checked as boolean,
                    customPrice: checked
                      ? formData.customPrice
                      : selectedPlan?.price || 0,
                  })
                }
              />
              <Label htmlFor="useCustomPrice" className="cursor-pointer">
                Use Custom Price
              </Label>
            </div>
            {formData.useCustomPrice && (
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
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
            )}
          </div>

          {/* Discount */}
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
                Saving {formatCurrency(discountAmount)}
              </p>
            )}
          </div>

          {/* Custom Features */}
          {selectedPlan && selectedPlan.features && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="useCustomFeatures"
                  checked={formData.useCustomFeatures}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      useCustomFeatures: checked as boolean,
                    })
                  }
                />
                <Label htmlFor="useCustomFeatures" className="cursor-pointer">
                  Customize Features
                </Label>
              </div>
              {formData.useCustomFeatures && (
                <div className="space-y-2 p-4 bg-muted/50 rounded-lg max-h-48 overflow-y-auto">
                  {selectedPlan.features.map(
                    (feature: string, index: number) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Checkbox
                          id={`feature-${index}`}
                          checked={formData.customFeatures.includes(feature)}
                          onCheckedChange={() => handleFeatureToggle(feature)}
                        />
                        <Label
                          htmlFor={`feature-${index}`}
                          className="cursor-pointer flex-1"
                        >
                          {feature}
                        </Label>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          )}

          {/* Generate Invoice */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="generateInvoice"
              checked={formData.generateInvoice}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  generateInvoice: checked as boolean,
                })
              }
            />
            <Label htmlFor="generateInvoice" className="cursor-pointer">
              Generate invoice for this plan change
            </Label>
          </div>

          {/* Pricing Summary */}
          <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg space-y-2">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Pricing Summary
            </h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Base Price:</span>
                <span className="font-medium">{formatCurrency(basePrice)}</span>
              </div>
              {formData.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount ({formData.discount}%):</span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t border-border pt-2">
                <span>Final Price:</span>
                <span className="text-primary">
                  {formatCurrency(finalPrice)}
                </span>
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
                  Changing Plan...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Change Plan
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
