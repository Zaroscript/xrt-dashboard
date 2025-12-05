import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User } from "lucide-react";
import { useSubscribersStore } from "@/stores/subscribers/useSubscribersStore";
import { useClientsStore } from "@/stores/clients/useClientsStore";
import { usePlansStore } from "@/stores/plans/usePlansStore";
import { Subscriber } from "@/stores/types";
import { Client } from "@/stores/types";
import type { Plan } from "@/types/plan";
import { useEffect } from "react";

const subscriberFormSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  planId: z.string().min(1, "Plan is required"),
  notes: z.string().optional(),
});

type SubscriberFormValues = z.infer<typeof subscriberFormSchema>;

interface AddSubscriberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubscriberAdded?: (subscriber: Subscriber) => void;
}

export function AddSubscriberDialog({
  open,
  onOpenChange,
  onSubscriberAdded,
}: AddSubscriberDialogProps) {
  const { createSubscriber, subscribers, fetchSubscribers } = useSubscribersStore();
  const { clients, fetchClients } = useClientsStore();
  const { plans, fetchPlans } = usePlansStore();
  const [step, setStep] = useState<
    "select-client" | "configure-subscription"
  >("select-client");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchClients();
      fetchPlans();
      fetchSubscribers();
      setStep("select-client");
      setSelectedClient(null);
      form.reset();
    }
  }, [open, fetchClients, fetchPlans, fetchSubscribers]);

  const form = useForm<SubscriberFormValues>({
    resolver: zodResolver(subscriberFormSchema),
    defaultValues: {
      userId: "",
      planId: "",
      notes: "",
    },
  });

  // Helper function to check if client already has a subscription
  const hasExistingSubscription = (clientId: string): boolean => {
    // Check if client has subscription in client data
    const client = clients.find((c) => c._id === clientId);
    if (client?.subscription) {
      return true;
    }
    
    // Also check if there's a subscriber record for this client's user
    const userId = typeof client?.user === "string" ? client.user : client?.user?._id;
    if (userId) {
      return subscribers.some((subscriber) => 
        typeof subscriber.user === "string" 
          ? subscriber.user === userId 
          : subscriber.user._id === userId
      );
    }
    
    return false;
  };

  const handleClientSelect = (clientId: string) => {
    const client = clients.find((c) => c._id === clientId);
    if (client) {
      setSelectedClient(client);
      const userId =
        typeof client.user === "string" ? client.user : client.user._id;
      form.setValue("userId", userId);

      // Pre-fill plan if available
      if (client.currentPlan) {
        const planId =
          typeof client.currentPlan === "string"
            ? client.currentPlan
            : client.currentPlan._id;
        form.setValue("planId", planId);
      }

      // Move to next step
      setStep("configure-subscription");
    }
  };

  
  const onSubmit = async (data: SubscriberFormValues) => {
    setLoading(true);
    try {
      const subscriberData = {
        userId: data.userId,
        planId: data.planId,
        notes: data.notes || "",
      };

      const newSubscriber = await createSubscriber(subscriberData);
      onSubscriberAdded?.(newSubscriber);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to create subscriber:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Subscriber</DialogTitle>
          <DialogDescription>
            {step === "select-client" &&
              "Select an existing client to create a subscription for."}
            {step === "configure-subscription" &&
              "Configure subscription details."}
          </DialogDescription>
        </DialogHeader>

        {step === "select-client" && (
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Select Client</Label>
              <Select onValueChange={handleClientSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Search for a client..." />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => {
                    const hasSubscription = hasExistingSubscription(client._id);
                    return (
                      <SelectItem 
                        key={client._id} 
                        value={client._id}
                        disabled={hasSubscription}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span>
                            {client.companyName} (
                            {typeof client.user === "object"
                              ? client.user.email
                              : "No email"}
                            )
                          </span>
                          {hasSubscription && (
                            <span className="text-xs text-muted-foreground ml-2">
                              Already subscribed
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        
        {step === "configure-subscription" && (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {selectedClient && (
              <div className="p-3 bg-muted rounded-md mb-4">
                <p className="text-sm font-medium">Selected Client:</p>
                <p className="text-sm text-muted-foreground">
                  {selectedClient.companyName}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="planId">Select Plan</Label>
              <Select
                onValueChange={(value) => form.setValue("planId", value)}
                defaultValue={form.getValues("planId")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan._id} value={plan._id}>
                      {plan.name} - ${plan.price}/{plan.billingCycle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.planId && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.planId.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                {...form.register("notes")}
                placeholder="Add any notes..."
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("select-client")}
              >
                Back
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Subscriber"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
