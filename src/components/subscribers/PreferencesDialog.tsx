import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { useSubscribersStore } from "@/stores/subscribers/useSubscribersStore";
import { Subscriber } from "@/stores/types";
import { Bell, Mail, Megaphone } from "lucide-react";

interface PreferencesFormValues {
  emailNotifications: boolean;
  invoiceEmails: boolean;
  marketingEmails: boolean;
}

interface PreferencesDialogProps {
  subscriber: Subscriber | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function PreferencesDialog({
  subscriber,
  open,
  onOpenChange,
  onSuccess,
}: PreferencesDialogProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { updatePreferences } = useSubscribersStore();

  const form = useForm<PreferencesFormValues>({
    defaultValues: {
      emailNotifications: true,
      invoiceEmails: true,
      marketingEmails: false,
    },
  });

  useEffect(() => {
    if (subscriber && open) {
      form.reset({
        emailNotifications: subscriber.preferences?.emailNotifications ?? true,
        invoiceEmails: subscriber.preferences?.invoiceEmails ?? true,
        marketingEmails: subscriber.preferences?.marketingEmails ?? false,
      });
    }
  }, [subscriber, open, form]);

  const onSubmit = async (data: PreferencesFormValues) => {
    if (!subscriber) return;

    setLoading(true);
    try {
      await updatePreferences(subscriber._id, {
        emailNotifications: data.emailNotifications,
        invoiceEmails: data.invoiceEmails,
        marketingEmails: data.marketingEmails,
      });

      toast({
        title: "Preferences Updated",
        description: "Notification preferences have been updated successfully.",
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update preferences:", error);
      toast({
        title: "Error",
        description: "Failed to update preferences. Please try again.",
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
          <DialogTitle>Notification Preferences</DialogTitle>
          <DialogDescription>
            Manage notification and email preferences for this subscriber.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
              <div className="flex items-start space-x-3">
                <Bell className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="space-y-0.5 flex-1">
                  <Label
                    htmlFor="emailNotifications"
                    className="text-base font-medium cursor-pointer"
                  >
                    Email Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive general email notifications about account activity
                  </p>
                </div>
              </div>
              <Switch
                id="emailNotifications"
                checked={form.watch("emailNotifications")}
                onCheckedChange={(checked) =>
                  form.setValue("emailNotifications", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
              <div className="flex items-start space-x-3">
                <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="space-y-0.5 flex-1">
                  <Label
                    htmlFor="invoiceEmails"
                    className="text-base font-medium cursor-pointer"
                  >
                    Invoice Emails
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive emails when new invoices are generated
                  </p>
                </div>
              </div>
              <Switch
                id="invoiceEmails"
                checked={form.watch("invoiceEmails")}
                onCheckedChange={(checked) =>
                  form.setValue("invoiceEmails", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
              <div className="flex items-start space-x-3">
                <Megaphone className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="space-y-0.5 flex-1">
                  <Label
                    htmlFor="marketingEmails"
                    className="text-base font-medium cursor-pointer"
                  >
                    Marketing Emails
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive promotional emails and updates about new features
                  </p>
                </div>
              </div>
              <Switch
                id="marketingEmails"
                checked={form.watch("marketingEmails")}
                onCheckedChange={(checked) =>
                  form.setValue("marketingEmails", checked)
                }
              />
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
              {loading ? "Saving..." : "Save Preferences"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
