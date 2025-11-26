import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  CreditCard,
  Calendar,
  DollarSign,
  RefreshCw,
  XCircle,
  Info,
  Percent,
  Tag,
  Clock,
  AlertCircle,
} from "lucide-react";
import { clientsService } from "@/services/api/clientsService";
import { useToast } from "@/components/ui/use-toast";
import { UpdateSubscriptionDialog } from "@/components/clients/UpdateSubscriptionDialog";

interface SubscriptionData {
  _id: string;
  plan: {
    _id: string;
    name: string;
    price: number;
    features?: string[];
  };
  status: string;
  billingCycle: string;
  customPrice?: number;
  discount?: number;
  startDate: string;
  endDate: string;
}

interface SubscriptionCardProps {
  clientId: string;
  subscription: SubscriptionData | null;
  onUpdate?: () => void;
  onChangePlan?: () => void;
}

export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
  clientId,
  subscription,
  onUpdate,
  onChangePlan,
}) => {
  const [showRenewDialog, setShowRenewDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [renewMonths, setRenewMonths] = useState<number>(1);
  const { toast } = useToast();

  const handleRenew = async () => {
    if (!subscription) return;

    try {
      setLoading(true);
      await clientsService.renewSubscription(clientId, renewMonths);

      toast({
        title: "Success",
        description: "Subscription renewed successfully",
      });
      setShowRenewDialog(false);
      onUpdate?.();
    } catch (error: any) {
      console.error("Error renewing subscription:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to renew subscription",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!subscription) return;

    try {
      setLoading(true);
      await clientsService.cancelSubscription(clientId);

      toast({
        title: "Success",
        description: "Subscription cancelled successfully",
      });
      setShowCancelDialog(false);
      onUpdate?.();
    } catch (error: any) {
      console.error("Error cancelling subscription:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to cancel subscription",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateFinalPrice = () => {
    if (!subscription) return 0;

    const basePrice = subscription.customPrice || subscription.plan.price;
    const discount = subscription.discount || 0;
    const discountAmount = (basePrice * discount) / 100;

    return basePrice - discountAmount;
  };

  const calculateDaysRemaining = () => {
    if (!subscription) return 0;
    const now = new Date();
    const end = new Date(subscription.endDate);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const calculateNextBillingDate = () => {
    if (!subscription) return null;
    const start = new Date(subscription.startDate);
    const now = new Date();

    let cycleMonths = 1;
    if (subscription.billingCycle === "quarterly") cycleMonths = 3;
    if (subscription.billingCycle === "annually") cycleMonths = 12;

    const nextBilling = new Date(start);
    while (nextBilling < now) {
      nextBilling.setMonth(nextBilling.getMonth() + cycleMonths);
    }

    return nextBilling;
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "text-green-400 bg-green-400/10";
      case "cancelled":
        return "text-red-400 bg-red-400/10";
      case "expired":
        return "text-gray-400 bg-gray-400/10";
      default:
        return "text-yellow-400 bg-yellow-400/10";
    }
  };

  const getDaysRemainingColor = (days: number) => {
    if (days < 0) return "text-red-400";
    if (days < 7) return "text-orange-400";
    if (days < 30) return "text-yellow-400";
    return "text-green-400";
  };

  if (!subscription) {
    return (
      <div className="p-6 bg-card border rounded-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-muted/50 rounded-lg">
            <CreditCard className="w-5 h-5 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-white">Subscription</h3>
        </div>

        <div className="text-center py-8">
          <Info className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 mb-4">No active subscription</p>

          {onChangePlan && (
            <button
              type="button"
              onClick={onChangePlan}
              className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground 
                       rounded-lg transition-colors font-medium inline-flex items-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              Assign Plan
            </button>
          )}
        </div>
      </div>
    );
  }

  const finalPrice = calculateFinalPrice();
  const hasCustomPrice = subscription.customPrice !== undefined;
  const hasDiscount = subscription.discount && subscription.discount > 0;
  const daysRemaining = calculateDaysRemaining();
  const nextBillingDate = calculateNextBillingDate();
  const planFeatures = subscription.plan.features || [];

  return (
    <>
      <div className="p-6 bg-card border rounded-lg space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <CreditCard className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold">Subscription</h3>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
              subscription.status
            )}`}
          >
            {subscription.status}
          </span>
        </div>

        {/* Plan Details */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Plan</span>
            <span className="text-white font-medium">
              {subscription.plan.name}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-400">Billing Cycle</span>
            <span className="text-white capitalize">
              {subscription.billingCycle}
            </span>
          </div>

          {/* Pricing Information */}
          <div className="pt-3 border-t border-gray-700 space-y-2">
            {hasCustomPrice && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  Base Price
                </span>
                <span className="text-gray-500 line-through">
                  ${subscription.plan.price.toFixed(2)}
                </span>
              </div>
            )}

            {hasCustomPrice && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Custom Price</span>
                <span className="text-white font-medium">
                  ${subscription.customPrice?.toFixed(2)}
                </span>
              </div>
            )}

            {hasDiscount && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Percent className="w-3 h-3" />
                  Discount
                </span>
                <span className="text-green-400">
                  {subscription.discount}% off
                </span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-gray-700">
              <span className="text-white font-medium flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                Final Price
              </span>
              <span className="text-xl font-bold text-white">
                ${finalPrice.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Date Information */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Start Date
            </span>
            <span className="text-white">
              {new Date(subscription.startDate).toLocaleDateString()}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              End Date
            </span>
            <div className="flex flex-col items-end">
              <span className="font-medium">
                {new Date(subscription.endDate).toLocaleDateString()}
              </span>
              {subscription.status === "active" && (
                <span
                  className={`text-xs ${getDaysRemainingColor(daysRemaining)}`}
                >
                  {daysRemaining < 0
                    ? "Expired"
                    : daysRemaining === 0
                    ? "Expires today"
                    : `${daysRemaining} days remaining`}
                </span>
              )}
            </div>
          </div>

          {/* Next Billing Date */}
          {subscription.status === "active" && nextBillingDate && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Next Billing
              </span>
              <span className="text-white">
                {nextBillingDate.toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        {/* Plan Features */}
        {planFeatures.length > 0 && (
          <div className="pt-3 border-t border-border">
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              Plan Features
            </h4>
            <ul className="space-y-1">
              {planFeatures.slice(0, 5).map((feature, index) => (
                <li
                  key={index}
                  className="text-xs text-foreground/80 flex items-start gap-2"
                >
                  <span className="text-blue-400 mt-0.5">•</span>
                  <span>{feature}</span>
                </li>
              ))}
              {planFeatures.length > 5 && (
                <li className="text-xs text-muted-foreground italic">
                  +{planFeatures.length - 5} more features
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Renewal Alert */}
        {subscription.status === "active" &&
          daysRemaining >= 0 &&
          daysRemaining <= 7 && (
            <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-orange-400 font-medium">
                  Renewal Required Soon
                </p>
                <p className="text-xs text-orange-300/80">
                  This subscription expires in {daysRemaining} day
                  {daysRemaining !== 1 ? "s" : ""}.
                </p>
              </div>
            </div>
          )}
      </div>

      {/* Action Buttons */}
      {subscription.status === "active" && (
        <div className="pt-4 space-y-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowRenewDialog(true)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 
                         bg-primary/10 hover:bg-primary/20 text-primary 
                         border border-primary/30 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Renew
            </button>

            <button
              type="button"
              onClick={() => setShowCancelDialog(true)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 
                         bg-destructive/10 hover:bg-destructive/20 text-destructive 
                         border border-destructive/30 rounded-lg transition-colors"
            >
              <XCircle className="w-4 h-4" />
              Cancel
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowUpdateDialog(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 
                       bg-accent/10 hover:bg-accent/20 text-accent-foreground dark:text-white
                       border border-accent/30 rounded-lg transition-colors"
          >
            <DollarSign className="w-4 h-4" />
            Edit Details
          </button>

          {/* Change Plan Button - For changing to a different plan */}
          {onChangePlan && (
            <button
              type="button"
              onClick={onChangePlan}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 
                         bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 
                         border border-blue-500/30 rounded-lg transition-colors font-medium"
            >
              <CreditCard className="w-4 h-4" />
              Change Plan
            </button>
          )}
        </div>
      )}

      {/* Change Plan Button - For clients without active subscription */}
      {(!subscription || subscription.status !== "active") && onChangePlan && (
        <div className="pt-4">
          <button
            type="button"
            onClick={onChangePlan}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 
                       bg-primary hover:bg-primary/90 text-primary-foreground 
                       border border-primary/30 rounded-lg transition-colors font-medium"
          >
            <CreditCard className="w-4 h-4" />
            Assign Plan
          </button>
        </div>
      )}

      {/* Renew Dialog */}
      {showRenewDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border rounded-lg p-6 max-w-md w-full shadow-lg"
          >
            <h3 className="text-xl font-semibold mb-4">Renew Subscription</h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Number of Months
                </label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={renewMonths}
                  onChange={(e) =>
                    setRenewMonths(parseInt(e.target.value) || 1)
                  }
                  className="w-full px-3 py-2 bg-background border rounded-lg 
                           focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="p-4 bg-muted/50 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Price per month</span>
                  <span className="font-medium">${finalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Duration</span>
                  <span className="text-white">{renewMonths} month(s)</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-border font-medium">
                  <span className="text-white">Total</span>
                  <span className="text-white">
                    ${(finalPrice * renewMonths).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowRenewDialog(false)}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-secondary hover:bg-secondary/80 
                         rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRenew}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground 
                         rounded-lg transition-colors disabled:opacity-50 flex items-center 
                         justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Renewing...
                  </>
                ) : (
                  "Confirm Renewal"
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Cancel Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border rounded-lg p-6 max-w-md w-full shadow-lg"
          >
            <h3 className="text-xl font-semibold mb-4">Cancel Subscription</h3>

            <p className="text-muted-foreground mb-6">
              Are you sure you want to cancel this subscription? This action
              cannot be undone. The subscription will remain active until the
              end date.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelDialog(false)}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-secondary hover:bg-secondary/80 
                         rounded-lg transition-colors disabled:opacity-50"
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancel}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground 
                         rounded-lg transition-colors disabled:opacity-50 flex items-center 
                         justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    Cancel Subscription
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Update Subscription Dialog */}
      {subscription && (
        <UpdateSubscriptionDialog
          open={showUpdateDialog}
          onOpenChange={setShowUpdateDialog}
          clientId={clientId}
          subscription={subscription}
          onSuccess={onUpdate}
        />
      )}
    </>
  );
};
