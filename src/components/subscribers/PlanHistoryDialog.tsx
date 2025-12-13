import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Subscriber } from "@/stores/types";
import {
  Calendar,
  DollarSign,
  FileText,
  TrendingUp,
  Trash2,
} from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useSubscribersStore } from "@/stores/subscribers/useSubscribersStore";
import { useState } from "react";
import { toast } from "sonner";

interface PlanHistoryDialogProps {
  subscriber: Subscriber | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PlanHistoryDialog({
  subscriber,
  open,
  onOpenChange,
}: PlanHistoryDialogProps) {
  const { clearPlanHistory } = useSubscribersStore();
  const [isClearing, setIsClearing] = useState(false);

  if (!subscriber) return null;

  // Combine current plan and history
  const allPlans = [
    ...(subscriber.plan ? [{ ...subscriber.plan, isCurrent: true }] : []),
    ...(subscriber.planHistory || []).map((plan) => ({
      ...plan,
      isCurrent: false,
    })),
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "expired":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "canceled":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400";
      case "pending_approval":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "rejected":
        return "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  const formatDate = (date: string | null | undefined) => {
    if (!date) return "N/A";
    try {
      return format(new Date(date), "MMM d, yyyy");
    } catch {
      return "Invalid date";
    }
  };

  const getPlanName = (plan: any) => {
    // Check if plan.plan is an object with name
    if (typeof plan.plan === "object" && plan.plan?.name) {
      return plan.plan.name;
    }
    // Fallback if plan name is directly on the object (legacy or flattened)
    if (plan.name) {
      return plan.name;
    }
    return "Unknown Plan";
  };

  const handleClearHistory = async () => {
    if (!subscriber._id) return;

    try {
      setIsClearing(true);
      await clearPlanHistory(subscriber._id);
      toast.success("Plan history cleared successfully");
    } catch (error) {
      toast.error("Failed to clear plan history");
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
        <DialogHeader>
          <div className="flex items-center justify-between pr-8">
            <div>
              <DialogTitle>Plan History</DialogTitle>
              <DialogDescription>
                View subscription plan history for{" "}
                {typeof subscriber.user === "object"
                  ? `${subscriber.user.fName} ${subscriber.user.lName}`
                  : "User"}
              </DialogDescription>
            </div>
            {subscriber.planHistory && subscriber.planHistory.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearHistory}
                disabled={isClearing}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear History
              </Button>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            {allPlans.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No plan history available</p>
              </div>
            ) : (
              allPlans.map((plan, index) => (
                <Card
                  key={index}
                  className={`border ${
                    plan.isCurrent
                      ? "border-primary/50 bg-primary/5"
                      : "border-border/40"
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-base">
                          {getPlanName(plan)}
                        </h4>
                        {plan.isCurrent && (
                          <Badge
                            variant="outline"
                            className="bg-primary/10 text-primary border-primary/20"
                          >
                            Current
                          </Badge>
                        )}
                      </div>
                      <Badge
                        variant="outline"
                        className={getStatusColor(plan.status)}
                      >
                        {plan.status.replace("_", " ")}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>Start Date</span>
                        </div>
                        <p className="text-sm font-medium">
                          {formatDate(plan.startDate)}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>End Date</span>
                        </div>
                        <p className="text-sm font-medium">
                          {formatDate(plan.endDate)}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <DollarSign className="h-3 w-3" />
                          <span>Price</span>
                        </div>
                        <p className="text-sm font-medium">
                          {plan.price ? formatCurrency(plan.price) : "N/A"}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <TrendingUp className="h-3 w-3" />
                          <span>Billing Cycle</span>
                        </div>
                        <p className="text-sm font-medium capitalize">
                          {plan.billingCycle || "N/A"}
                        </p>
                      </div>
                    </div>

                    {plan.notes &&
                      plan.notes.toLowerCase() !== "cancelled by user" && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs text-muted-foreground mb-1">
                            Notes:
                          </p>
                          <p className="text-sm">{plan.notes}</p>
                        </div>
                      )}

                    {plan.approvalStatus && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-muted-foreground mb-1">
                          Approval Status:
                        </p>
                        <p className="text-sm">
                          {plan.status === "pending_approval"
                            ? "Pending approval"
                            : plan.approvalStatus?.approved
                            ? `Approved on ${formatDate(
                                plan.approvalStatus.approvedAt
                              )}`
                            : "Approved"}
                        </p>
                        {plan.approvalStatus.notes && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {plan.approvalStatus.notes}
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
