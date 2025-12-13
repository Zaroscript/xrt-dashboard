import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import type { User } from "@/stores/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useUsersStore,
  useSubscribersStore,
  usePlansStore,
} from "@/stores/index";
import { useToast } from "@/components/ui/use-toast";
import { X } from "lucide-react";
import { format } from "date-fns";
import { Switch } from "@/components/ui/switch";

const subscriptionPlans = [
  { id: "basic", name: "Basic", price: 29.99 },
  { id: "standard", name: "Standard", price: 59.99 },
  { id: "premium", name: "Premium", price: 99.99 },
  { id: "enterprise", name: "Enterprise", price: 199.99 },
];

const formSchema = z
  .object({
    isClient: z.boolean().default(true),
    subscription: z
      .object({
        plan: z.string().min(1, "Please select a plan"),
        status: z.enum(["active", "canceled", "expired"]),
        amount: z.number(),
        expiresAt: z.string(),
      })
      .optional(),
  })
  .refine(
    (data) => !data.isClient || (data.isClient && data.subscription?.plan),
    {
      message: "Subscription plan is required for clients",
      path: ["subscription.plan"],
    }
  );

interface SubscriptionFormProps {
  user: User;
  onSuccess?: () => void;
  onCancel: () => void;
}

export const SubscriptionForm = ({
  user,
  onSuccess,
  onCancel,
}: SubscriptionFormProps) => {
  const { updateUser } = useUsersStore();
  const { createSubscriber, getSubscribersByUser } = useSubscribersStore();
  const { plans } = usePlansStore();
  const { toast } = useToast();

  // Get existing subscription
  const existingSubscription = getSubscribersByUser(user._id)[0];

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      isClient: user.role === "client" || !!existingSubscription,
      subscription: existingSubscription
        ? {
            plan:
              typeof existingSubscription.plan.plan === "string"
                ? existingSubscription.plan.plan
                : existingSubscription.plan.plan?._id || "basic",
            status: (existingSubscription.plan?.status || "active") as any,
            amount: existingSubscription.price || subscriptionPlans[0].price,
            expiresAt: existingSubscription.plan?.endDate
              ? format(
                  new Date(existingSubscription.plan.endDate),
                  "yyyy-MM-dd"
                )
              : format(
                  new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                  "yyyy-MM-dd"
                ),
          }
        : {
            plan: plans[0]?._id || "basic",
            status: "active",
            amount: plans[0]?.price || subscriptionPlans[0].price,
            expiresAt: format(
              new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              "yyyy-MM-dd"
            ),
          },
    },
  });

  const isClient = form.watch("isClient");
  const selectedPlan = form.watch("subscription.plan");

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (values.isClient && values.subscription) {
        // Create or update subscription
        if (!existingSubscription) {
          // Create new subscriber
          await createSubscriber({
            userId: user._id,
            planId: values.subscription.plan,
            notes: "Created via UserCard",
          });
        } else {
          // Update existing subscription using the subscriber store
          const { updateSubscriberApi } = useSubscribersStore.getState();
          await updateSubscriberApi(existingSubscription._id, {
            plan: {
              ...existingSubscription.plan,
              plan: values.subscription.plan,
              status: values.subscription.status as any,
              endDate: new Date(values.subscription.expiresAt),
            },
            status: values.subscription.status as any,
            price: values.subscription.amount,
          });
        }

        // Update user role to client if not already
        if (user.role !== "client") {
          await updateUser({ _id: user._id, role: "client" });
        }
      } else {
        // Remove client status - would need to deactivate subscription
        if (user.role === "client") {
          await updateUser({ _id: user._id, role: "subscriber" });
        }
      }

      toast({
        title: "Subscription updated",
        description: `User's ${
          values.isClient
            ? "subscription has been updated"
            : "client status has been removed"
        }`,
      });

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error updating subscription:", error);
      toast({
        title: "Error",
        description: "Failed to update subscription. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onCancel}
    >
      <motion.div
        className="bg-card rounded-lg shadow-lg w-full max-w-md relative"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-foreground">
              {user.role === "client"
                ? "Update Subscription"
                : "Add Subscription"}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onCancel}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="isClient"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Is Client?</FormLabel>
                      <FormDescription>
                        Enable to manage subscription details
                      </FormDescription>
                    </div>
                    <FormControl>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />

              {isClient && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="subscription.plan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Plan *</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            // Update amount when plan changes
                            const plan =
                              plans.find((p) => p._id === value) ||
                              subscriptionPlans.find((p) => p.id === value);
                            if (plan) {
                              const price = (plan as any).price;
                              form.setValue("subscription.amount", price);
                            }
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a plan" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {plans.length > 0
                              ? plans.map((plan) => (
                                  <SelectItem key={plan._id} value={plan._id}>
                                    {plan.name} (${plan.price}/
                                    {plan.billingCycle})
                                  </SelectItem>
                                ))
                              : subscriptionPlans.map((plan) => (
                                  <SelectItem key={plan.id} value={plan.id}>
                                    {plan.name} (${plan.price}/month)
                                  </SelectItem>
                                ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="subscription.status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="canceled">Canceled</SelectItem>
                            <SelectItem value="expired">Expired</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="subscription.amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                              $
                            </span>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              className="pl-8"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseFloat(e.target.value) || 0)
                              }
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="subscription.expiresAt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expiration Date *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
                <Button type="submit">
                  {isClient ? "Update Subscription" : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SubscriptionForm;
