import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useSubscribersStore } from "@/stores/subscribers/useSubscribersStore";
import { Subscriber } from "@/stores/types";

const billingInfoSchema = z.object({
  companyName: z.string().optional(),
  taxId: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  contactName: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  contactPhone: z.string().optional(),
});

type BillingInfoFormValues = z.infer<typeof billingInfoSchema>;

interface BillingInfoDialogProps {
  subscriber: Subscriber | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function BillingInfoDialog({
  subscriber,
  open,
  onOpenChange,
  onSuccess,
}: BillingInfoDialogProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { updateBillingInfo } = useSubscribersStore();

  const form = useForm<BillingInfoFormValues>({
    resolver: zodResolver(billingInfoSchema),
    defaultValues: {
      companyName: "",
      taxId: "",
      street: "",
      city: "",
      state: "",
      country: "",
      postalCode: "",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
    },
  });

  useEffect(() => {
    if (subscriber && open) {
      form.reset({
        companyName: subscriber.billingInfo?.companyName || "",
        taxId: subscriber.billingInfo?.taxId || "",
        street: subscriber.billingInfo?.address?.street || "",
        city: subscriber.billingInfo?.address?.city || "",
        state: subscriber.billingInfo?.address?.state || "",
        country: subscriber.billingInfo?.address?.country || "",
        postalCode: subscriber.billingInfo?.address?.postalCode || "",
        contactName: subscriber.billingInfo?.contactPerson?.name || "",
        contactEmail: subscriber.billingInfo?.contactPerson?.email || "",
        contactPhone: subscriber.billingInfo?.contactPerson?.phone || "",
      });
    }
  }, [subscriber, open, form]);

  const onSubmit = async (data: BillingInfoFormValues) => {
    if (!subscriber) return;

    setLoading(true);
    try {
      const billingInfo = {
        companyName: data.companyName,
        taxId: data.taxId,
        address: {
          street: data.street,
          city: data.city,
          state: data.state,
          country: data.country,
          postalCode: data.postalCode,
        },
        contactPerson: {
          name: data.contactName,
          email: data.contactEmail,
          phone: data.contactPhone,
        },
      };

      await updateBillingInfo(subscriber._id, billingInfo);

      toast({
        title: "Billing Info Updated",
        description: "Billing information has been updated successfully.",
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update billing info:", error);
      toast({
        title: "Error",
        description: "Failed to update billing info. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Billing Information</DialogTitle>
          <DialogDescription>
            Update billing and contact information for this subscriber.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  {...form.register("companyName")}
                  placeholder="Company name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxId">Tax ID</Label>
                <Input
                  id="taxId"
                  {...form.register("taxId")}
                  placeholder="Tax ID"
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-3">Address</h4>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="street">Street Address</Label>
                  <Input
                    id="street"
                    {...form.register("street")}
                    placeholder="Street address"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      {...form.register("city")}
                      placeholder="City"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State/Province</Label>
                    <Input
                      id="state"
                      {...form.register("state")}
                      placeholder="State"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      {...form.register("country")}
                      placeholder="Country"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input
                      id="postalCode"
                      {...form.register("postalCode")}
                      placeholder="Postal code"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-3">Contact Person</h4>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="contactName">Name</Label>
                  <Input
                    id="contactName"
                    {...form.register("contactName")}
                    placeholder="Contact person name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Email</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      {...form.register("contactEmail")}
                      placeholder="email@example.com"
                    />
                    {form.formState.errors.contactEmail && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.contactEmail.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">Phone</Label>
                    <Input
                      id="contactPhone"
                      {...form.register("contactPhone")}
                      placeholder="Phone number"
                    />
                  </div>
                </div>
              </div>
            </div>
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
