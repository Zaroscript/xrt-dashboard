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

interface AssignSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: any;
  onSuccess?: () => void;
}

export function AssignSubscriptionDialog({
  open,
  onOpenChange,
  client,
  onSuccess,
}: AssignSubscriptionDialogProps) {
  console.log("AssignSubscriptionDialog mounted, open =", open);
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

  const [formData, setFormData] = useState({
    planId: "",
    billingCycle: "monthly" as "monthly" | "quarterly" | "annually",
    startDate: format(new Date(), "yyyy-MM-dd"),
    useCustomPrice: false,
    customPrice: 0,
    discount: 0,
    generateInvoice: true,
    customFeatures: [] as string[],
    useCustomFeatures: false,
  });

  const [selectedPlan, setSelectedPlan] = useState<any>(null);

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
          setIsInitialized(true); // Mark as initialized even on error to show error state
          toast({
            title: "Error",
            description: "Failed to load plans. Please try again.",
            variant: "destructive",
          });
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isInitialized]); // Only depend on open and isInitialized to prevent infinite loop

  // Reset initialization state when dialog closes
  useEffect(() => {
    if (!open) {
      setIsInitialized(false);
      setFetchError(null);
    }
  }, [open]);

  // Initialize form data from client subscription if available
  useEffect(() => {
    if (open && client?.subscription && allPlans.length > 0) {
      const sub = client.subscription;
      const currentPlanId = sub.plan?._id || sub.plan;

      setFormData({
        planId: currentPlanId,
        billingCycle: sub.billingCycle || "monthly",
        startDate: sub.startDate
          ? format(new Date(sub.startDate), "yyyy-MM-dd")
          : format(new Date(), "yyyy-MM-dd"),
        useCustomPrice: !!sub.customPrice,
        customPrice: sub.customPrice || 0,
        discount: sub.discount || 0,
        generateInvoice: true,
        customFeatures: sub.plan?.features || [],
        useCustomFeatures: false,
      });
    } else if (open && !client?.subscription) {
      // Reset form if no subscription
      setFormData({
        planId: "",
        billingCycle: "monthly",
        startDate: format(new Date(), "yyyy-MM-dd"),
        useCustomPrice: false,
        customPrice: 0,
        discount: 0,
        generateInvoice: true,
        customFeatures: [],
        useCustomFeatures: false,
      });
    }
  }, [open, client, allPlans.length]);

  useEffect(() => {
    if (formData.planId && allPlans.length > 0) {
      const plan = allPlans.find((p: any) => p._id === formData.planId);
      setSelectedPlan(plan || null);

      if (plan && !client?.subscription) {
        // Only auto-fill if not editing existing subscription (to preserve custom values)
        setFormData((prev) => ({
          ...prev,
          customPrice: prev.useCustomPrice ? prev.customPrice : plan.price || 0,
          customFeatures: plan.features || [],
        }));
      } else if (
        plan &&
        client?.subscription &&
        formData.planId !==
          (client.subscription.plan?._id || client.subscription.plan)
      ) {
        // If changing plan while editing, update defaults
        setFormData((prev) => ({
          ...prev,
          customPrice: prev.useCustomPrice ? prev.customPrice : plan.price || 0,
          customFeatures: plan.features || [],
        }));
      }
    }
  }, [formData.planId, allPlans, formData.useCustomPrice, client]);

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
        description: "Please select a plan.",
        variant: "destructive",
      });
      return;
    }

    if (basePrice <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid price.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      await clientsService.assignSubscription(client._id, {
        planId: formData.planId,
        customPrice: formData.useCustomPrice ? formData.customPrice : undefined,
        discount: formData.discount,
        billingCycle: formData.billingCycle,
        startDate: formData.startDate,
        generateInvoice: formData.generateInvoice,
        customFeatures: formData.useCustomFeatures
          ? formData.customFeatures
          : undefined,
      });

      // Parent component will show success toast
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error assigning subscription:", error);
      toast({
        title: "Error",
        description: "Failed to assign subscription. Please try again.",
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

  // Show error state if fetch failed
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
            <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-center">
              <p className="text-sm text-destructive mb-2">
                {fetchError || plansError || "Failed to load plans"}
              </p>
              <p className="text-xs text-muted-foreground">
                Please check your connection and try again.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleRetry}>Retry</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {client?.subscription
              ? "Update Subscription Plan"
              : "Assign Subscription Plan"}
          </DialogTitle>
          <DialogDescription>
            {client?.subscription ? "Update" : "Assign"} subscription plan for{" "}
            {client.companyName || client.name} with custom pricing options.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="plan">Select Plan *</Label>
            {allPlans.length > 0 ? (
              <Select
                value={formData.planId}
                onValueChange={(value) =>
                  setFormData({ ...formData, planId: value })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                  {allPlans.map((plan: any) => (
                    <SelectItem key={plan._id} value={plan._id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{plan.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {formatCurrency(plan.price)}/month
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                No active plans available.
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="billingCycle">Billing Cycle *</Label>
            <Select
              value={formData.billingCycle}
              onValueChange={(value: any) =>
                setFormData({ ...formData, billingCycle: value })
              }
              required
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
            <Label htmlFor="startDate">Start Date *</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="border rounded-lg p-4 space-y-4 bg-muted/20">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="useCustomPrice"
                className="text-base font-semibold"
              >
                Custom Pricing
              </Label>
              <Checkbox
                id="useCustomPrice"
                checked={formData.useCustomPrice}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    useCustomPrice: checked as boolean,
                    customPrice: checked ? selectedPlan?.price || 0 : 0,
                  })
                }
              />
            </div>

            {formData.useCustomPrice && (
              <div className="space-y-4 pl-4 border-l-2 border-primary">
                <div className="space-y-2">
                  <Label htmlFor="customPrice">Custom Price *</Label>
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
                  <p className="text-xs text-muted-foreground">
                    Original price: {formatCurrency(selectedPlan?.price || 0)}
                  </p>
                </div>
              </div>
            )}

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
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Saving {formatCurrency(discountAmount)}
                </p>
              )}
            </div>
          </div>

          {/* Custom Features Section */}
          <div className="border rounded-lg p-4 space-y-4 bg-muted/20">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="useCustomFeatures"
                className="text-base font-semibold"
              >
                Custom Features
              </Label>
              <Checkbox
                id="useCustomFeatures"
                checked={formData.useCustomFeatures}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    useCustomFeatures: checked as boolean,
                    customFeatures: checked ? selectedPlan?.features || [] : [],
                  })
                }
              />
            </div>

            {formData.useCustomFeatures && selectedPlan && (
              <div className="space-y-2 pl-4 border-l-2 border-primary">
                <Label>Plan Features (editable)</Label>
                <div className="space-y-2">
                  {formData.customFeatures.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={feature}
                        onChange={(e) => {
                          const newFeatures = [
                            ...(formData.customFeatures || []),
                          ];
                          newFeatures[index] = e.target.value;
                          setFormData({
                            ...formData,
                            customFeatures: newFeatures,
                          });
                        }}
                        placeholder="Feature description"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newFeatures = (
                            formData.customFeatures || []
                          ).filter((_, i) => i !== index);
                          setFormData({
                            ...formData,
                            customFeatures: newFeatures,
                          });
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        customFeatures: [
                          ...(formData.customFeatures || []),
                          "",
                        ],
                      });
                    }}
                  >
                    Add Feature
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Original features: {selectedPlan?.features?.length || 0} items
                </p>
              </div>
            )}
          </div>

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
            <Label
              htmlFor="generateInvoice"
              className="font-normal cursor-pointer"
            >
              Auto-generate invoice
            </Label>
          </div>

          {selectedPlan && (
            <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg space-y-3">
              <h4 className="font-semibold text-sm">Pricing Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plan:</span>
                  <span className="font-medium">{selectedPlan.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Billing:</span>
                  <span className="font-medium capitalize">
                    {formData.billingCycle}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Base Price:</span>
                  <span
                    className={
                      formData.useCustomPrice
                        ? "line-through text-muted-foreground"
                        : "font-medium"
                    }
                  >
                    {formatCurrency(selectedPlan.price)}
                  </span>
                </div>
                {formData.useCustomPrice && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Custom Price:</span>
                    <span className="font-medium">
                      {formatCurrency(formData.customPrice)}
                    </span>
                  </div>
                )}
                {formData.discount > 0 && (
                  <>
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({formData.discount}%):</span>
                      <span>-{formatCurrency(discountAmount)}</span>
                    </div>
                    <div className="border-t border-border pt-2" />
                  </>
                )}
                <div className="flex justify-between text-lg font-bold">
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
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !formData.planId}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {client?.subscription ? "Updating..." : "Assigning..."}
                </>
              ) : client?.subscription ? (
                "Update Subscription"
              ) : (
                "Assign Subscription"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
