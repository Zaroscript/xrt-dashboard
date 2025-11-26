import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useSubscribersStore } from "@/stores/subscribers/useSubscribersStore";
import { usePlansStore } from "@/stores/plans/usePlansStore";
import { Subscriber } from "@/stores/types";
import { CalendarIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

const editSubscriberSchema = z.object({
  status: z.enum([
    "active",
    "inactive",
    "suspended",
    "cancelled",
    "pending_approval",
    "expired",
    "rejected",
  ]),
  planId: z.string().optional(),
  notes: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

type EditSubscriberFormValues = z.infer<typeof editSubscriberSchema>;

interface EditSubscriberDialogProps {
  subscriber: Subscriber | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditSubscriberDialog({
  subscriber,
  open,
  onOpenChange,
  onSuccess,
}: EditSubscriberDialogProps) {
  const { updateSubscriberApi } = useSubscribersStore();
  const { plans, fetchPlans } = usePlansStore();
  const [loading, setLoading] = useState(false);

  const form = useForm<EditSubscriberFormValues>({
    resolver: zodResolver(editSubscriberSchema),
    defaultValues: {
      status: "active",
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      fetchPlans();
    }
  }, [open, fetchPlans]);

  useEffect(() => {
    if (subscriber && open) {
      const currentPlanId =
        typeof subscriber.plan?.plan === "string"
          ? subscriber.plan.plan
          : subscriber.plan?.plan?._id;

      form.reset({
        status: subscriber.status as any,
        planId: currentPlanId,
        notes: subscriber.notes || "",
        startDate: subscriber.plan?.startDate
          ? new Date(subscriber.plan.startDate)
          : undefined,
        endDate: subscriber.plan?.endDate
          ? new Date(subscriber.plan.endDate)
          : undefined,
      });
    }
  }, [subscriber, open, form]);

  const onSubmit = async (data: EditSubscriberFormValues) => {
    if (!subscriber) return;

    setLoading(true);
    try {
      const updates: any = {
        status: data.status,
        notes: data.notes,
      };

      // Only update plan-related fields if they are part of the subscription object in the backend
      // We might need to adjust this based on how the backend handles updates
      if (data.planId || data.startDate || data.endDate) {
        updates.plan = {
          ...subscriber.plan, // Keep existing fields
          ...(data.planId && { plan: data.planId }),
          ...(data.startDate && { startDate: data.startDate }),
          ...(data.endDate && { endDate: data.endDate }),
        };
      }

      await updateSubscriberApi(subscriber._id, updates);
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update subscriber:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!subscriber) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Subscriber</DialogTitle>
          <DialogDescription>
            Update subscription details for{" "}
            {typeof subscriber.user === "object"
              ? `${subscriber.user.fName} ${subscriber.user.lName}`
              : "User"}
            .
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                onValueChange={(value) => form.setValue("status", value as any)}
                defaultValue={form.getValues("status")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="pending_approval">
                    Pending Approval
                  </SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="planId">Plan</Label>
              <Select
                onValueChange={(value) => form.setValue("planId", value)}
                defaultValue={form.getValues("planId")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan._id} value={plan._id}>
                      {plan.name} (${plan.price})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 flex flex-col">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full pl-3 text-left font-normal",
                      !form.watch("startDate") && "text-muted-foreground"
                    )}
                  >
                    {form.watch("startDate") ? (
                      format(form.watch("startDate")!, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.watch("startDate")}
                    onSelect={(date) => form.setValue("startDate", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2 flex flex-col">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full pl-3 text-left font-normal",
                      !form.watch("endDate") && "text-muted-foreground"
                    )}
                  >
                    {form.watch("endDate") ? (
                      format(form.watch("endDate")!, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.watch("endDate")}
                    onSelect={(date) => form.setValue("endDate", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...form.register("notes")}
              placeholder="Add any notes..."
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
