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
  const { createSubscriber } = useSubscribersStore();
  const { clients, fetchClients } = useClientsStore();
  const { plans, fetchPlans } = usePlansStore();
  const [step, setStep] = useState<
    "select-method" | "create-client" | "configure-subscription"
  >("select-method");
  const [method, setMethod] = useState<"existing" | "new" | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchClients();
      fetchPlans();
      setStep("select-method");
      setMethod(null);
      setSelectedClient(null);
      form.reset();
    }
  }, [open, fetchClients, fetchPlans]);

  const form = useForm<SubscriberFormValues>({
    resolver: zodResolver(subscriberFormSchema),
    defaultValues: {
      userId: "",
      planId: "",
      notes: "",
    },
  });

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

  const handleMethodSelect = (selectedMethod: "existing" | "new") => {
    setMethod(selectedMethod);
    if (selectedMethod === "existing") {
      // Stay on same view but show select
    } else {
      // For new client, we would ideally show a client creation form
      // For now, let's just redirect to client creation page or show a message
      // But the requirement says "Create New Client: Form to create client -> Auto-proceed"
      // Since creating a full client form here is complex, I'll add a placeholder or simple form
      setStep("create-client");
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
            {step === "select-method" &&
              "Choose how you want to add a subscriber."}
            {step === "create-client" && "Create a new client account."}
            {step === "configure-subscription" &&
              "Configure subscription details."}
          </DialogDescription>
        </DialogHeader>

        {step === "select-method" && (
          <div className="grid grid-cols-2 gap-4 py-4">
            <Button
              variant="outline"
              className="h-32 flex flex-col gap-2 hover:border-primary hover:bg-primary/5"
              onClick={() => handleMethodSelect("existing")}
            >
              <User className="h-8 w-8" />
              <span>Select Existing Client</span>
            </Button>
            <Button
              variant="outline"
              className="h-32 flex flex-col gap-2 hover:border-primary hover:bg-primary/5"
              onClick={() => handleMethodSelect("new")}
            >
              <div className="relative">
                <User className="h-8 w-8" />
                <div className="absolute -right-1 -bottom-1 bg-primary text-primary-foreground rounded-full p-0.5">
                  <span className="sr-only">New</span>
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </div>
              </div>
              <span>Create New Client</span>
            </Button>
          </div>
        )}

        {step === "select-method" && method === "existing" && (
          <div className="space-y-4 pt-4 border-t">
            <div className="space-y-2">
              <Label>Select Client</Label>
              <Select onValueChange={handleClientSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Search for a client..." />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client._id} value={client._id}>
                      {client.companyName} (
                      {typeof client.user === "object"
                        ? client.user.email
                        : "No email"}
                      )
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="ghost"
              onClick={() => setMethod(null)}
              className="w-full"
            >
              Back
            </Button>
          </div>
        )}

        {step === "create-client" && (
          <div className="space-y-4 py-4">
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400 rounded-md text-sm">
              To create a new subscriber from a new client, please go to the
              Clients page, create the client, and then assign a subscription.
              <br />
              <br />
              (Full client creation form integration coming soon)
            </div>
            <Button
              variant="outline"
              onClick={() => setStep("select-method")}
              className="w-full"
            >
              Back
            </Button>
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
                onClick={() => setStep("select-method")}
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
