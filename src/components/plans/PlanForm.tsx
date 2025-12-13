import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, X, Info, CheckSquare, Tag, Award } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Plan } from "@/types/plan";

const planFormSchema = z.object({
  _id: z.string().optional(),
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  description: z
    .string()
    .min(10, { message: "Description must be at least 10 characters." }),
  price: z.coerce
    .number()
    .min(0, { message: "Price must be a positive number." }),
  monthlyPrice: z.coerce.number().nullable().optional(),
  yearlyPrice: z.coerce.number().nullable().optional(),
  duration: z.coerce.number().refine((val) => val === 1 || val === 12, {
    message: "Duration must be 1 (monthly) or 12 (yearly)",
  }),
  features: z
    .array(z.string().min(1, { message: "Feature cannot be empty." }))
    .min(1, { message: "At least one feature is required." }),
  isActive: z.boolean().default(true),
  displayOrder: z.coerce.number().default(0),
  isCustom: z.boolean().default(false),
  discount: z
    .object({
      type: z.enum(["percentage", "fixed"]),
      value: z.coerce
        .number()
        .min(0, { message: "Discount value must be positive." }),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    })
    .optional(),
  badge: z
    .object({
      text: z.string().min(1, { message: "Badge text is required." }),
      variant: z
        .enum([
          "default",
          "secondary",
          "destructive",
          "outline",
          "success",
          "warning",
          "info",
          "premium",
          "new",
          "limited",
        ])
        .default("default"),
    })
    .optional(),
});

export type PlanFormValues = z.infer<typeof planFormSchema>;

interface PlanFormProps {
  plan?: Plan;
  onSubmit: (data: PlanFormValues) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  isSubmitting?: boolean;
}

export const PlanForm = ({
  plan,
  onSubmit,
  onCancel,
  isLoading = false,
  isSubmitting = false,
}: PlanFormProps) => {
  const [features, setFeatures] = useState<string[]>(plan?.features || []);
  const [featureInput, setFeatureInput] = useState("");
  const [showBadgeFields, setShowBadgeFields] = useState(
    !!(plan?.badge && plan.badge.text)
  );
  const [useCustomPrices, setUseCustomPrices] = useState(
    !!(plan?.monthlyPrice || plan?.yearlyPrice)
  );
  const { toast } = useToast();

  const defaultValues: Partial<PlanFormValues> = {
    _id: plan?._id,
    name: plan?.name || "",
    description: plan?.description || "",
    price: plan?.price || 0,
    monthlyPrice: plan?.monthlyPrice || null,
    yearlyPrice: plan?.yearlyPrice || null,
    duration: (plan?.duration || 1) as 1 | 12,
    features: plan?.features || [],
    displayOrder: plan?.displayOrder || 0,
    isActive: plan?.isActive ?? true,
    isCustom: plan?.isCustom || false,
    discount: plan?.discount
      ? {
          type: plan.discount.type,
          value: plan.discount.value,
          startDate: plan.discount.startDate
            ? new Date(plan.discount.startDate).toISOString().split("T")[0]
            : undefined,
          endDate: plan.discount.endDate
            ? new Date(plan.discount.endDate).toISOString().split("T")[0]
            : undefined,
        }
      : undefined,
    badge: plan?.badge && plan.badge.text ? plan.badge : undefined,
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    control,
    reset,
  } = useForm<PlanFormValues>({
    resolver: zodResolver(planFormSchema),
    defaultValues,
  });

  useEffect(() => {
    if (plan) {
      reset(defaultValues);
      setFeatures(plan.features || []);
      setShowBadgeFields(!!(plan.badge && plan.badge.text));
    }
  }, [plan, reset]);

  const addFeature = () => {
    if (featureInput.trim()) {
      setFeatures([...features, featureInput.trim()]);
      setFeatureInput("");
      setValue("features", [...features, featureInput.trim()]);
    }
  };

  const removeFeature = (index: number) => {
    const newFeatures = features.filter((_, i) => i !== index);
    setFeatures(newFeatures);
    setValue("features", newFeatures);
  };

  const handleFormSubmit = async (data: PlanFormValues) => {
    // If using custom pricing, ensure monthly and yearly prices are set
    if (useCustomPrices) {
      if (!data.monthlyPrice || !data.yearlyPrice) {
        return; // Form validation will catch this
      }
    } else {
      // If not using custom pricing, clear the custom prices
      data.monthlyPrice = null;
      data.yearlyPrice = null;
    }

    // Validate discount against actual price
    if (data.discount && data.discount.value > 0) {
      let actualPrice = 0;

      if (useCustomPrices) {
        // Use the appropriate custom price based on duration
        actualPrice =
          data.duration === 1 ? data.monthlyPrice || 0 : data.yearlyPrice || 0;
      } else {
        // Calculate based on base price and duration
        actualPrice = data.duration === 1 ? data.price * 12 : data.price;
      }

      // Calculate discount amount
      let discountAmount = 0;
      if (data.discount.type === "percentage") {
        discountAmount = (actualPrice * data.discount.value) / 100;
      } else {
        discountAmount = data.discount.value;
      }

      // Check if discount is larger than actual price
      if (discountAmount >= actualPrice) {
        toast({
          title: "Invalid Discount",
          description: `Discount (${
            data.discount.type === "percentage"
              ? `${data.discount.value}%`
              : `$${data.discount.value}`
          }) cannot be equal to or greater than the actual price ($${actualPrice.toFixed(
            2
          )}). Please adjust the discount value.`,
          variant: "destructive",
        });
        return;
      }
    }

    // Explicitly handle discount removal
    const submitData = {
      ...data,
      features: features.filter((f) => f.trim() !== ""),
      // Only include discount if it has a value > 0
      discount:
        data.discount && data.discount.value > 0 ? data.discount : undefined,
      // Only include badge if showBadgeFields is true and text is provided
      badge:
        showBadgeFields && data.badge?.text?.trim()
          ? {
              text: data.badge.text.trim(),
              variant: data.badge.variant || "default",
            }
          : undefined,
    };

    await onSubmit(submitData);
  };

  return (
    <div className="space-y-6">
      <form
        id="plan-form"
        onSubmit={handleSubmit(handleFormSubmit)}
        className="space-y-8"
      >
        {/* Basic Information Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <div className="p-1 rounded bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
              <Info className="h-4 w-4" />
            </div>
            <h3 className="text-lg font-medium">Basic Information</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Plan Name *</Label>
              <div className="space-y-1">
                <Input
                  id="name"
                  placeholder="e.g., Premium"
                  {...register("name")}
                />
                {errors.name?.message && (
                  <p className="text-sm font-medium text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Custom Pricing</Label>
                <Button
                  type="button"
                  variant={useCustomPrices ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setUseCustomPrices(!useCustomPrices);
                    if (!useCustomPrices) {
                      // Clear custom prices when disabling
                      setValue("monthlyPrice", null);
                      setValue("yearlyPrice", null);
                    }
                  }}
                >
                  {useCustomPrices
                    ? "Using Custom Prices"
                    : "Use Custom Prices"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Enable to set custom monthly and yearly prices. Disable to use
                base price calculations.
              </p>
            </div>

            <div className="space-y-2">
              <Label>
                Pricing{" "}
                {!useCustomPrices ? "*" : "(Disabled when using custom prices)"}
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...register("price")}
                    disabled={useCustomPrices}
                    className={useCustomPrices ? "bg-muted opacity-50" : ""}
                  />
                  {errors.price?.message && (
                    <p className="text-sm font-medium text-destructive">
                      {errors.price.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <Select
                    onValueChange={(value: string) =>
                      setValue("duration", parseInt(value) as 1 | 12)
                    }
                    defaultValue={watch("duration")?.toString() || "1"}
                    disabled={useCustomPrices}
                  >
                    <SelectTrigger
                      className={useCustomPrices ? "bg-muted opacity-50" : ""}
                    >
                      <SelectValue placeholder="Select billing duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Monthly</SelectItem>
                      <SelectItem value="12">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.duration?.message && (
                    <p className="text-sm font-medium text-destructive">
                      {errors.duration.message}
                    </p>
                  )}
                </div>
              </div>

              {useCustomPrices && (
                <p className="text-xs text-muted-foreground">
                  Pricing is disabled when using custom pricing. Set monthly and
                  yearly prices below.
                </p>
              )}
              {!useCustomPrices && (
                <p className="text-xs text-muted-foreground">
                  Set the base price and billing duration. Monthly prices will
                  be calculated as (price × 12), yearly as (price).
                </p>
              )}
            </div>

            {useCustomPrices && (
              <div className="col-span-1 md:col-span-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="monthlyPrice">Monthly Price *</Label>
                    <div className="space-y-1">
                      <Input
                        id="monthlyPrice"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...register("monthlyPrice", {
                          valueAsNumber: true,
                          required: useCustomPrices
                            ? "Monthly price is required when using custom pricing"
                            : false,
                        })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Set the monthly price for this plan.
                      </p>
                      {errors.monthlyPrice?.message && (
                        <p className="text-sm font-medium text-destructive">
                          {errors.monthlyPrice.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="yearlyPrice">Yearly Price *</Label>
                    <div className="space-y-1">
                      <Input
                        id="yearlyPrice"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...register("yearlyPrice", {
                          valueAsNumber: true,
                          required: useCustomPrices
                            ? "Yearly price is required when using custom pricing"
                            : false,
                        })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Set the yearly price for this plan.
                      </p>
                      {errors.yearlyPrice?.message && (
                        <p className="text-sm font-medium text-destructive">
                          {errors.yearlyPrice.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="isCustom">Plan Type</Label>
              <Select
                onValueChange={(value: "true" | "false") =>
                  setValue("isCustom", value === "true")
                }
                defaultValue={watch("isCustom") ? "true" : "false"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select plan type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">Standard Plan</SelectItem>
                  <SelectItem value="true">Custom Plan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="isActive">Active Status</Label>
                <Switch
                  id="isActive"
                  checked={watch("isActive")}
                  onCheckedChange={(checked: boolean) =>
                    setValue("isActive", checked)
                  }
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Enable this plan to make it available for new subscriptions.
                Disabled plans won't be shown to users.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayOrder">Display Order</Label>
              <div className="space-y-1">
                <Input
                  id="displayOrder"
                  type="number"
                  placeholder="0"
                  {...register("displayOrder")}
                />
                <p className="text-xs text-muted-foreground">
                  Controls the sorting order of plans (lower numbers appear
                  first).
                </p>
                {errors.displayOrder?.message && (
                  <p className="text-sm font-medium text-destructive">
                    {errors.displayOrder.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <div className="space-y-1">
              <Textarea
                id="description"
                placeholder="Describe the plan features and benefits..."
                className="min-h-[100px]"
                {...register("description")}
              />
              {errors.description && (
                <p className="text-sm font-medium text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <div className="p-1 rounded bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400">
              <CheckSquare className="h-4 w-4" />
            </div>
            <h3 className="text-lg font-medium">Plan Features</h3>
          </div>
          <div className="space-y-4 p-4 border rounded-lg bg-muted/30 dark:bg-muted/20 border-border">
            <div className="flex gap-2">
              <Input
                placeholder="Add a feature (e.g., Unlimited storage)"
                value={featureInput}
                onChange={(e) => setFeatureInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addFeature();
                  }
                }}
              />
              <Button
                type="button"
                onClick={addFeature}
                disabled={!featureInput.trim()}
              >
                Add
              </Button>
            </div>

            <div className="space-y-2">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 bg-background rounded border border-border"
                >
                  <span className="flex-1 text-sm">{feature}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFeature(index)}
                    disabled={features.length <= 1}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {errors.features && (
                <p className="text-sm font-medium text-destructive">
                  {errors.features.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Discount Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <div className="p-1 rounded bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400">
              <Tag className="h-4 w-4" />
            </div>
            <h3 className="text-lg font-medium">Discount (Optional)</h3>
          </div>
          <div className="p-4 border rounded-lg bg-muted/30 dark:bg-muted/20 border-border">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Add a discount to make this plan more attractive
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  const currentDiscount = watch("discount");
                  const hasDiscount =
                    currentDiscount && currentDiscount.value > 0;
                  if (hasDiscount) {
                    // Remove discount by clearing all discount fields
                    setValue("discount.type", "percentage");
                    setValue("discount.value", 0);
                    setValue("discount.startDate", undefined);
                    setValue("discount.endDate", undefined);
                    // Also set the entire discount object to undefined
                    setValue("discount", undefined, { shouldValidate: true });
                  } else {
                    // Add discount with default values (value > 0 so it shows up)
                    setValue("discount", { type: "percentage", value: 1 });
                  }
                }}
              >
                {watch("discount")?.value > 0
                  ? "Remove Discount"
                  : "Add Discount"}
              </Button>
            </div>

            {watch("discount")?.value > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="discount-type">Discount Type</Label>
                  <Select
                    onValueChange={(value: "percentage" | "fixed") =>
                      setValue("discount.type", value)
                    }
                    defaultValue={watch("discount.type")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount-value">
                    {watch("discount.type") === "percentage"
                      ? "Discount Percentage"
                      : "Discount Amount"}
                  </Label>
                  <div className="relative">
                    <Input
                      id="discount-value"
                      type="number"
                      min="0"
                      step={
                        watch("discount.type") === "percentage" ? "1" : "0.01"
                      }
                      placeholder="0"
                      {...register("discount.value", { valueAsNumber: true })}
                      className={
                        watch("discount.type") === "percentage" ? "pr-12" : ""
                      }
                    />
                    {watch("discount.type") === "percentage" && (
                      <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">
                        %
                      </span>
                    )}
                  </div>
                  {errors.discount?.value?.message && (
                    <p className="text-sm font-medium text-destructive">
                      {errors.discount.value.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount-endDate">
                    Valid Until (Optional)
                  </Label>
                  <Input
                    id="discount-endDate"
                    type="date"
                    {...register("discount.endDate")}
                    min={new Date().toISOString().split("T")[0]}
                  />
                  {errors.discount?.endDate?.message && (
                    <p className="text-sm font-medium text-destructive">
                      {errors.discount.endDate.message}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Badge Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <div className="p-1 rounded bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400">
              <Award className="h-4 w-4" />
            </div>
            <h3 className="text-lg font-medium">Badge (Optional)</h3>
          </div>
          <div className="p-4 border rounded-lg bg-muted/30 dark:bg-muted/20 border-border">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Add a badge to highlight this plan
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  const newShowBadge = !showBadgeFields;
                  setShowBadgeFields(newShowBadge);
                  if (newShowBadge) {
                    // Initialize badge with default values
                    setValue("badge", { text: "", variant: "default" });
                  } else {
                    // Clear badge when hiding
                    setValue("badge", undefined);
                  }
                }}
              >
                {showBadgeFields ? "Remove Badge" : "Add Badge"}
              </Button>
            </div>

            {showBadgeFields && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="badge-text">Badge Text *</Label>
                  <Input
                    id="badge-text"
                    placeholder="e.g., Popular, Limited, New"
                    {...register("badge.text")}
                  />
                  {errors.badge?.text?.message && (
                    <p className="text-sm font-medium text-destructive">
                      {errors.badge.text.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="badge-variant">Badge Style</Label>
                  <Select
                    onValueChange={(
                      value:
                        | "default"
                        | "secondary"
                        | "destructive"
                        | "outline"
                        | "success"
                        | "warning"
                        | "info"
                        | "premium"
                        | "new"
                        | "limited"
                    ) => setValue("badge.variant", value)}
                    defaultValue={watch("badge.variant") || "default"}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">
                        <span className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-primary"></span>
                          Default
                        </span>
                      </SelectItem>
                      <SelectItem value="secondary">
                        <span className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-gray-500"></span>
                          Secondary
                        </span>
                      </SelectItem>
                      <SelectItem value="success">
                        <span className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-green-500"></span>
                          Success
                        </span>
                      </SelectItem>
                      <SelectItem value="warning">
                        <span className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                          Warning
                        </span>
                      </SelectItem>
                      <SelectItem value="info">
                        <span className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                          Info
                        </span>
                      </SelectItem>
                      <SelectItem value="premium">
                        <span className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500"></span>
                          Premium ✨
                        </span>
                      </SelectItem>
                      <SelectItem value="new">
                        <span className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-purple-500"></span>
                          New 🆕
                        </span>
                      </SelectItem>
                      <SelectItem value="limited">
                        <span className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                          Limited ⏰
                        </span>
                      </SelectItem>
                      <SelectItem value="destructive">
                        <span className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-red-500"></span>
                          Destructive
                        </span>
                      </SelectItem>
                      <SelectItem value="outline">
                        <span className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full border-2 border-gray-400"></span>
                          Outline
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default PlanForm;
