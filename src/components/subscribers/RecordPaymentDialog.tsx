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
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { apiClient } from "@/services/api/apiClient";

const paymentFormSchema = z.object({
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  paymentDate: z.date(),
  paymentMethod: z.string().min(1, "Payment method is required"),
  transactionId: z.string().min(1, "Transaction ID is required"),
  notes: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

interface RecordPaymentDialogProps {
  subscriberId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function RecordPaymentDialog({
  subscriberId,
  open,
  onOpenChange,
  onSuccess,
}: RecordPaymentDialogProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      amount: 0,
      paymentDate: new Date(),
      paymentMethod: "",
      transactionId: "",
      notes: "",
    },
  });

  const onSubmit = async (data: PaymentFormValues) => {
    if (!subscriberId) return;

    setLoading(true);
    try {
      await apiClient.post(`/subscribers/${subscriberId}/payments`, {
        amount: data.amount,
        paymentDate: data.paymentDate,
        paymentMethod: data.paymentMethod,
        transactionId: data.transactionId,
        notes: data.notes,
      });

      toast({
        title: "Payment Recorded",
        description: "Payment has been recorded successfully.",
      });

      onSuccess?.();
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error("Failed to record payment:", error);
      toast({
        title: "Error",
        description: "Failed to record payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Record a payment for this subscription.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                {...form.register("amount", { valueAsNumber: true })}
                placeholder="0.00"
              />
              {form.formState.errors.amount && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.amount.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Payment Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full pl-3 text-left font-normal",
                      !form.watch("paymentDate") && "text-muted-foreground"
                    )}
                  >
                    {form.watch("paymentDate") ? (
                      format(form.watch("paymentDate"), "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.watch("paymentDate")}
                    onSelect={(date) => form.setValue("paymentDate", date!)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Payment Method</Label>
            <Select
              onValueChange={(value) => form.setValue("paymentMethod", value)}
              defaultValue={form.getValues("paymentMethod")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="credit_card">Credit Card</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="paypal">PayPal</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="check">Check</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.paymentMethod && (
              <p className="text-sm text-destructive">
                {form.formState.errors.paymentMethod.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="transactionId">Transaction ID</Label>
            <Input
              id="transactionId"
              {...form.register("transactionId")}
              placeholder="Enter transaction ID"
            />
            {form.formState.errors.transactionId && (
              <p className="text-sm text-destructive">
                {form.formState.errors.transactionId.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              {...form.register("notes")}
              placeholder="Add any notes about this payment..."
              rows={3}
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
              {loading ? "Recording..." : "Record Payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
