import { useState } from "react";
import { useSubscribersStore } from "@/stores/subscribers/useSubscribersStore";
import { motion, AnimatePresence } from "framer-motion";
import { AxiosError } from "axios";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  User,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  MoreVertical,
  Edit,
  Trash2,
  Pause,
  Play,
  Loader2,
  AlertTriangle,
  ExternalLink,
  Copy,
  Mail as MailIcon,
  Phone as PhoneIcon,
  Calendar as CalendarIcon,
  CreditCard as CreditCardIcon,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Info,
  Pencil,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency } from "@/lib/currency";
import {
  formatDistanceToNow,
  format,
  isAfter,
  isBefore,
  differenceInDays,
} from "date-fns";
import { cn } from "@/lib/utils";
import { Subscriber } from "@/stores/types";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface SubscriberCardProps {
  subscriber: Subscriber;
  onUpdate?: (subscriber: Subscriber) => void;
  onDelete?: (id: string) => void;
  onStatusChange?: (
    id: string,
    status:
      | "pending_approval"
      | "active"
      | "expired"
      | "cancelled"
      | "rejected"
      | "suspended"
  ) => void;
  className?: string;
}

const SubscriberCard = ({
  subscriber,
  onUpdate,
  onDelete,
  onStatusChange,
  className,
}: SubscriberCardProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [isSuspending, setIsSuspending] = useState(false);
  const { toast } = useToast();

  // Get plan details with proper type safety
  const getPlanDetails = () => {
    if (!subscriber.plan)
      return { name: "No plan", billingCycle: "monthly", price: 0 };

    // If plan.plan is an object, use it directly
    if (
      typeof subscriber.plan.plan === "object" &&
      subscriber.plan.plan !== null
    ) {
      return {
        name: subscriber.plan.plan.name || "Unnamed Plan",
        billingCycle:
          "billingCycle" in subscriber.plan.plan
            ? String(subscriber.plan.plan.billingCycle)
            : "monthly",
        price:
          "price" in subscriber.plan.plan
            ? Number(subscriber.plan.plan.price) || 0
            : 0,
      };
    }

    // If plan.plan is a string (ID), use the plan properties directly from subscriber.plan
    const planData = subscriber.plan as any; // Temporary type assertion
    return {
      name: "Plan (ID: " + subscriber.plan.plan + ")",
      billingCycle: planData.billingCycle || "monthly",
      price: planData.amount || planData.price || 0,
    };
  };

  const planDetails = getPlanDetails();

  // Format date helper function
  const formatDate = (
    date: Date | string | undefined,
    withRelative = false
  ) => {
    if (!date) return withRelative ? "N/A" : "Not set";

    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) return "Invalid date";

      if (withRelative) {
        const now = new Date();
        const diffInDays = differenceInDays(dateObj, now);

        if (diffInDays === 0) return "Today";
        if (diffInDays === 1) return "Tomorrow";
        if (diffInDays === -1) return "Yesterday";
        if (diffInDays > 0 && diffInDays <= 7) return `In ${diffInDays} days`;
        if (diffInDays < 0 && diffInDays >= -7)
          return `${Math.abs(diffInDays)} days ago`;

        return dateObj.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      }

      return format(dateObj, "MMM d, yyyy");
    } catch {
      return withRelative ? "N/A" : "Invalid date";
    }
  };

  // Helper function to safely get user name
  const getUserName = (): string => {
    if (!subscriber.user) return "Unknown User";
    if (typeof subscriber.user === "string") return "User";
    return subscriber.user.fName || "User";
  };

  // Handle copy to clipboard
  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: message,
      duration: 2000,
    });
  };

  // Handle delete action
  const handleDelete = async () => {
    if (!onDelete) return;
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!onDelete) return;

    const userName = getUserName();
    setIsDeleting(true);
    try {
      await onDelete(subscriber._id);
      toast({
        title: "Subscription deleted",
        description: `${userName}'s subscription has been removed.`,
        variant: "default",
      });
    } catch (error) {
      console.error("Error deleting subscription:", error);
      toast({
        title: "Error",
        description: "Failed to delete subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  // Get actions from store
  const {
    suspendSubscriber,
    approveSubscriber,
    rejectSubscriber,
    activateSubscriber,
    cancelSubscription,
  } = useSubscribersStore();

  // Handle status change
  const handleStatusChange = async (
    newStatus:
      | "pending_approval"
      | "active"
      | "expired"
      | "cancelled"
      | "rejected"
      | "suspended",
    reason: string = ""
  ) => {
    // If suspending, show the dialog instead of immediately changing status
    if (newStatus === "suspended") {
      setShowSuspendDialog(true);
      return;
    }

    setIsLoading(true);
    try {
      if (newStatus === "active") {
        if (subscriber.status === "pending_approval") {
          await approveSubscriber(subscriber._id);
        } else {
          await activateSubscriber(subscriber._id);
        }
      } else if (newStatus === "cancelled") {
        await cancelSubscription(subscriber._id, reason);
      } else if (newStatus === "rejected") {
        await rejectSubscriber(subscriber._id, reason);
      } else if (onStatusChange) {
        // Fallback to prop for other statuses if any
        await onStatusChange(subscriber._id, newStatus);
      }

      toast({
        title: "Status updated",
        description: `Subscription status changed to ${newStatus}.`,
        variant: "default",
      });

      // Notify parent if needed
      if (onStatusChange) {
        // We already called the API, but maybe parent needs to know?
        // Actually, store update should trigger re-render.
        // But let's keep the prop call if it was just for notification,
        // but here onStatusChange was performing the action in the old code.
        // So we don't need to call it again if we used the store action.
      }
    } catch (error) {
      console.error("Error updating status:", error);
      const errorMessage =
        error instanceof AxiosError
          ? error.response?.data?.message ||
            "Failed to update subscription status. Please try again."
          : error instanceof Error
          ? error.message
          : "An unknown error occurred";

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle suspend confirmation
  const handleConfirmSuspend = async () => {
    setIsSuspending(true);
    try {
      await suspendSubscriber(subscriber._id, suspendReason);

      setShowSuspendDialog(false);
      setSuspendReason("");

      toast({
        title: "Subscription Suspended",
        description: "The subscription has been suspended successfully.",
        variant: "default",
      });
    } catch (error) {
      console.error("Error suspending subscription:", error);
      const errorMessage =
        error instanceof AxiosError
          ? error.response?.data?.message ||
            "Failed to suspend subscription. Please try again."
          : error instanceof Error
          ? error.message
          : "An unknown error occurred";

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSuspending(false);
    }
  };

  // Handle edit action
  const handleEdit = () => {
    // If there's an onUpdate prop, we'll use that to handle the edit
    // Otherwise, we can implement a default edit behavior here
    if (onUpdate) {
      onUpdate(subscriber);
    } else {
      // Default edit behavior if no onUpdate handler is provided
      console.log("Edit subscriber:", subscriber);
      toast({
        title: "Edit Mode",
        description: "Edit functionality would open a form here",
        variant: "default",
      });
    }
  };

  // Extract user information with fallbacks
  const user =
    typeof subscriber.user === "string" || !subscriber.user
      ? {
          _id:
            typeof subscriber.user === "string" ? subscriber.user : "unknown",
          email: "unknown@example.com",
          fName: "Unknown",
          lName: "User",
          phone: "N/A",
          avatar: undefined,
          createdAt: new Date().toISOString(),
        }
      : {
          ...subscriber.user,
          avatar: subscriber.user.avatar || undefined,
          phone: subscriber.user.phone || "N/A",
        };

  // Extract plan information with fallbacks
  const plan =
    typeof subscriber.plan?.plan === "string"
      ? {
          _id: "unknown-plan",
          name: "Unknown Plan",
          price: 0,
          billingCycle: "monthly",
          description: "Plan information not available",
          features: [],
          isActive: true,
        }
      : subscriber.plan?.plan || {
          _id: "no-plan",
          name: "No Plan",
          price: 0,
          billingCycle: "monthly",
          description: "No active subscription",
          features: [],
          isActive: false,
        };

  // Get subscription status with fallback
  const status = subscriber.plan?.status || "inactive";

  // Get plan details which handles all the different cases for getting the price
  const selectedPlanDetails = getPlanDetails();
  const amount = selectedPlanDetails.price;

  // Calculate subscription progress if end date is available
  const subscriptionProgress = (() => {
    if (!subscriber.plan?.startDate || !subscriber.plan?.endDate) return null;

    const start = new Date(subscriber.plan.startDate).getTime();
    const end = new Date(subscriber.plan.endDate).getTime();
    const now = new Date().getTime();

    if (now >= end) return 100;
    if (now <= start) return 0;

    const total = end - start;
    const elapsed = now - start;
    return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
  })();

  // Status badge configuration with more detailed information
  const getStatusConfig = (status: string) => {
    const baseConfig = {
      color: "bg-gray-100 text-gray-800 border-gray-200",
      icon: Info,
      label: status.charAt(0).toUpperCase() + status.slice(1).replace("_", " "),
      description: "Subscription status",
      action: null as string | null,
    };

    const statusConfigs = {
      active: {
        color:
          "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
        icon: CheckCircle,
        description: "Subscription is active and in good standing",
        action: "Suspend",
      },
      pending_approval: {
        color:
          "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800",
        icon: Clock,
        description: "Awaiting approval or payment",
        action: "Approve",
      },
      expired: {
        color:
          "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
        icon: XCircle,
        description: "Subscription has expired",
        action: "Renew",
      },
      cancelled: {
        color:
          "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700",
        icon: XCircle,
        description: "Subscription has been cancelled",
        action: "Reactivate",
      },
      rejected: {
        color:
          "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
        icon: X,
        description: "Subscription was rejected",
        action: "Review",
      },
      suspended: {
        color:
          "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800",
        icon: AlertTriangle,
        description: "Subscription is suspended",
        action: "Reactivate",
      },
    };

    return {
      ...baseConfig,
      ...(statusConfigs[status as keyof typeof statusConfigs] || {}),
    };
  };

  const statusConfig = getStatusConfig(status);
  const StatusIcon = statusConfig.icon;

  // Determine available actions based on current status
  const availableActions = [
    ...(status === "active"
      ? [
          { label: "Suspend", value: "suspended" as const, icon: Pause },
          { label: "Cancel", value: "cancelled" as const, icon: XCircle },
        ]
      : (["suspended", "cancelled", "expired", "rejected"] as const).includes(
          status as any
        )
      ? [{ label: "Reactivate", value: "active" as const, icon: Play }]
      : status === "pending_approval"
      ? [
          { label: "Approve", value: "active" as const, icon: Check },
          { label: "Reject", value: "rejected" as const, icon: X },
        ]
      : []),
    { label: "Edit", value: "edit", icon: Edit },
    { label: "Delete", value: "delete", icon: Trash2, destructive: true },
  ];

  // Handle action selection from dropdown
  const handleAction = async (action: string) => {
    if (action === "edit" && onUpdate) {
      onUpdate(subscriber);
      return;
    }

    if (action === "delete" && onDelete) {
      setShowDeleteDialog(true);
      return;
    }

    // Handle status changes
    if (
      [
        "active",
        "cancelled",
        "pending_approval",
        "expired",
        "rejected",
      ].includes(action) &&
      onStatusChange
    ) {
      await handleStatusChange(action as any);
    } else if (action === "suspended") {
      // For suspend, we show the dialog instead of directly changing status
      setShowSuspendDialog(true);
    }
  };

  // Format date range for subscription period
  const formatDateRange = (
    startDate?: Date | string,
    endDate?: Date | string
  ) => {
    if (!startDate || !endDate) return "N/A";

    const start = new Date(startDate);
    const end = new Date(endDate);

    const formatOptions: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
      ...(start.getFullYear() !== end.getFullYear() && { year: "numeric" }),
    };

    const startStr = start.toLocaleDateString("en-US", formatOptions);
    const endStr = end.toLocaleDateString("en-US", formatOptions);

    return `${startStr} - ${endStr}`;
  };

  // Get subscription duration in days
  const getSubscriptionDuration = (
    startDate?: Date | string,
    endDate?: Date | string
  ) => {
    if (!startDate || !endDate) return "N/A";

    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    return `${days} day${days !== 1 ? "s" : ""}`;
  };

  // Handle copy to clipboard
  const handleCopy = (text: string, type: string) => {
    copyToClipboard(text, `${type} copied to clipboard`);
  };

  // Toggle card expansion
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800";
      case "suspended":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800";
      case "pending_approval":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800";
      case "expired":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700";
    }
  };

  const getPlanColor = (planName?: string) => {
    if (!planName) return "from-gray-500 to-gray-600";
    const planColors: Record<string, string> = {
      basic: "from-blue-500 to-blue-600",
      standard: "from-purple-500 to-purple-600",
      premium: "from-amber-500 to-amber-600",
      pro: "from-emerald-500 to-emerald-600",
      enterprise: "from-violet-500 to-violet-600",
    };
    return planColors[planName.toLowerCase()] || "from-gray-500 to-gray-600";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="h-full"
    >
      <Card className="h-full flex flex-col overflow-hidden border border-border/40 hover:border-primary/30 transition-all duration-300 group hover:shadow-lg dark:hover:shadow-primary/10">
        <div className="relative">
          <div
            className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${getPlanColor(
              plan?.name
            )}`}
          />
          <CardHeader className="pb-3 pt-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/90 to-primary/70 flex items-center justify-center text-white font-bold text-xl shadow-md">
                    {user.fName?.[0]?.toUpperCase() || "U"}
                  </div>
                  <span
                    className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${
                      status === "active"
                        ? "bg-green-500"
                        : status === "suspended" ||
                          status === "pending_approval"
                        ? "bg-yellow-500"
                        : status === "inactive" ||
                          status === "cancelled" ||
                          status === "expired" ||
                          status === "rejected"
                        ? "bg-red-500"
                        : "bg-gray-400"
                    }`}
                  ></span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                    {user.fName} {user.lName}
                  </h3>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Badge
                  variant="outline"
                  className={`${getStatusVariant(
                    status
                  )} text-xs font-medium mr-2 px-2 py-1 rounded-full border`}
                >
                  <StatusIcon className="w-3 h-3 mr-1.5" />
                  {statusConfig.label}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">More options</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    {/* Edit Action */}
                    <DropdownMenuItem
                      onClick={() => handleAction("edit")}
                      disabled={isLoading || isDeleting}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Details
                    </DropdownMenuItem>

                    {/* Status-Specific Actions */}
                    {status === "pending_approval" && (
                      <>
                        <DropdownMenuItem
                          onClick={() => handleAction("active")}
                          disabled={isLoading || isDeleting}
                        >
                          <Check className="mr-2 h-4 w-4 text-green-600" />
                          Approve Subscription
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleAction("rejected")}
                          disabled={isLoading || isDeleting}
                          className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                        >
                          <X className="mr-2 h-4 w-4" />
                          Reject Request
                        </DropdownMenuItem>
                      </>
                    )}

                    {status === "active" && (
                      <>
                        <DropdownMenuItem
                          onClick={() => handleAction("suspended")}
                          disabled={isLoading || isDeleting}
                        >
                          <Pause className="mr-2 h-4 w-4 text-amber-500" />
                          Suspend Subscription
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleAction("cancelled")}
                          disabled={isLoading || isDeleting}
                          className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Cancel Subscription
                        </DropdownMenuItem>
                      </>
                    )}

                    {(status === "suspended" ||
                      status === "cancelled" ||
                      status === "expired" ||
                      status === "rejected") && (
                      <DropdownMenuItem
                        onClick={() => handleAction("active")}
                        disabled={isLoading || isDeleting}
                      >
                        <Play className="mr-2 h-4 w-4 text-green-600" />
                        Reactivate
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator />

                    {/* Delete Action */}
                    <DropdownMenuItem
                      onClick={() => handleAction("delete")}
                      disabled={isDeleting || isLoading}
                      className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                    >
                      {isDeleting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="mr-2 h-4 w-4" />
                      )}
                      Delete Subscription
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Plan Information */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Current Plan
                </p>
                <p className="font-semibold">{planDetails.name}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-muted-foreground">
                  Amount
                </p>
                <p className="font-semibold text-primary">
                  {planDetails.price
                    ? formatCurrency(planDetails.price)
                    : "N/A"}
                </p>
                <p className="text-xs text-muted-foreground">
                  /{planDetails.billingCycle}
                </p>
              </div>
            </div>

            {/* Subscription Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Start Date
                </p>
                <p className="text-sm">
                  {subscriber.plan?.startDate
                    ? formatDate(subscriber.plan.startDate)
                    : "Not set"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  End Date
                </p>
                <p className="text-sm">
                  {subscriber.plan?.endDate
                    ? formatDate(subscriber.plan.endDate)
                    : "Not set"}
                </p>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">{user.email}</span>
              </div>
              {user.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{user.phone}</span>
                </div>
              )}
              {/* Subscription Expiration */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center">
                  <Clock className="w-3.5 h-3.5 mr-2 opacity-70" />
                  Expires
                </span>
                {!subscriber.plan?.endDate ? (
                  <span className="text-muted-foreground">Not set</span>
                ) : (
                  <span
                    className={`font-medium ${
                      new Date(subscriber.plan.endDate) < new Date()
                        ? "text-destructive"
                        : ""
                    }`}
                  >
                    <Tooltip>
                      <TooltipTrigger>
                        {formatDate(subscriber.plan.endDate)}
                      </TooltipTrigger>
                      <TooltipContent>
                        {formatDistanceToNow(
                          new Date(subscriber.plan.endDate),
                          { addSuffix: true }
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </span>
                )}
              </div>
            </div>

            {/* Notes */}
            {subscriber.notes && (
              <div className="pt-2 border-t border-border/50">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Notes
                </p>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {subscriber.notes}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            {(onStatusChange || onUpdate) && (
              <div className="flex gap-2 pt-5 mt-4 border-t border-border/50">
                {onStatusChange && (
                  <Button
                    variant={
                      subscriber.status === "active" ? "outline" : "default"
                    }
                    size="sm"
                    className="flex-1 gap-1.5"
                    onClick={() =>
                      handleAction(
                        subscriber.status === "active" ? "suspended" : "active"
                      )
                    }
                    disabled={isLoading || isDeleting}
                  >
                    {isLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : subscriber.status === "active" ? (
                      <Pause className="h-3.5 w-3.5" />
                    ) : (
                      <Play className="h-3.5 w-3.5" />
                    )}
                    {subscriber.status === "active" ? "Suspend" : "Activate"}
                  </Button>
                )}

                {onUpdate && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1.5"
                    onClick={() => handleAction("edit")}
                    disabled={isLoading || isDeleting}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </div>
      </Card>

      {/* Suspend Confirmation Dialog */}
      <AlertDialog
        open={showSuspendDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowSuspendDialog(false);
            setSuspendReason("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspend Subscription</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to suspend this subscription? Please provide
              a reason for suspension.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="suspendReason">Reason for Suspension</Label>
              <Textarea
                id="suspendReason"
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="Enter the reason for suspension..."
                className="min-h-[100px]"
                disabled={isSuspending}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowSuspendDialog(false);
                setSuspendReason("");
              }}
              disabled={isSuspending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmSuspend}
              disabled={!suspendReason.trim() || isSuspending}
            >
              {isSuspending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Suspending...
                </>
              ) : (
                "Confirm Suspend"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Subscription</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {getUserName()}'s subscription?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};

export default SubscriberCard;
