import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MoreHorizontal,
  Phone,
  Mail,
  User as UserIcon,
  Pencil,
  Calendar,
  Clock,
  Crown,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock as ClockIcon,
  Loader2,
  MessageSquare,
  PhoneCall,
  Copy,
  Video,
  FileText,
  Send,
  MailCheck,
  MessageCircle,
  PlusCircle,
  Ban,
  ShieldAlert,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCanModify } from "@/hooks/useRole";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useMemo, useState, useEffect } from "react";
import { clientsService } from "@/services/api/clientsService";
import { useToast } from "@/components/ui/use-toast";
import { Client } from "@/types/client.types";
import { AssignSubscriptionDialog } from "./AssignSubscriptionDialog";
import { AssignServiceDialog } from "./AssignServiceDialog";
import { useClientStore } from "@/store/useClientStore";

// Define the Service interface locally since we don't have the type
export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  isActive: boolean;
}

// Format date to a readable format
const formatDate = (dateString: string, includeTime = false) => {
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  };

  if (includeTime) {
    options.hour = "2-digit";
    options.minute = "2-digit";
  }

  return new Date(dateString).toLocaleDateString("en-US", options);
};

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Calculate days until expiration
const getDaysUntil = (dateString: string) => {
  const today = new Date();
  const targetDate = new Date(dateString);
  const diffTime = targetDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

interface ClientCardProps {
  client: Client;
  onUpdate: (client: Client) => void;
  onDelete?: (clientId: string) => Promise<void>;
  className?: string;
}

const ClientCard: React.FC<ClientCardProps> = ({
  client,
  onUpdate,
  onDelete,
  className,
}) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { setSelectedClient } = useClientStore();
  const canModify = useCanModify();

  // Quick action states
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [isMessaging, setIsMessaging] = useState(false);
  const [isCopyingEmail, setIsCopyingEmail] = useState(false);

  // Update client mutation
  const { mutate: updateClient, isPending: isUpdating } = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Client> }) =>
      clientsService.updateClient(id, data),
    onSuccess: (updatedClient) => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      onUpdate(updatedClient);
      toast({
        title: "Client updated",
        description: "Client information has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating client",
        description:
          error?.response?.data?.message || "Failed to update client",
        variant: "destructive",
      });
    },
  });

  const [isEditingPlan, setIsEditingPlan] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showAssignServiceDialog, setShowAssignServiceDialog] = useState(false);

  // Initialize form values when edit dialog opens
  useEffect(() => {
    if (isEditingPlan) {
      setSelectedPlan(
        typeof client.subscription?.plan === "string"
          ? client.subscription.plan
          : client.subscription?.plan?._id || ""
      );
      setSelectedStatus(client.subscription?.status || "active");
    }
  }, [isEditingPlan, client.subscription]);

  // Mock services - in a real app, this would come from your Redux store or API
  const mockServices: Service[] = [
    {
      id: "1",
      name: "Basic Plan",
      description: "Basic recipe sharing",
      price: 9.99,
      duration: 30,
      isActive: true,
    },
    {
      id: "2",
      name: "Pro Plan",
      description: "Advanced recipe sharing",
      price: 19.99,
      duration: 30,
      isActive: true,
    },
    {
      id: "3",
      name: "Enterprise",
      description: "Full features",
      price: 49.99,
      duration: 30,
      isActive: true,
    },
  ];

  const statusConfig = {
    active: {
      bg: "bg-green-100 dark:bg-green-900/30",
      text: "text-green-800 dark:text-green-400",
      icon: CheckCircle2,
      label: "Active",
    },
    pending: {
      bg: "bg-yellow-100 dark:bg-yellow-900/30",
      text: "text-yellow-800 dark:text-yellow-400",
      icon: ClockIcon,
      label: "Pending",
    },
    inactive: {
      bg: "bg-gray-100 dark:bg-gray-800",
      text: "text-gray-800 dark:text-gray-400",
      icon: XCircle,
      label: "Inactive",
    },
    rejected: {
      bg: "bg-red-100 dark:bg-red-900/30",
      text: "text-red-800 dark:text-red-400",
      icon: AlertCircle,
      label: "Rejected",
    },
    suspended: {
      bg: "bg-orange-100 dark:bg-orange-900/30",
      text: "text-orange-800 dark:text-orange-400",
      icon: Ban,
      label: "Suspended",
    },
    blocked: {
      bg: "bg-gray-800 dark:bg-gray-700",
      text: "text-white dark:text-gray-200",
      icon: ShieldAlert,
      label: "Blocked",
    },
  };

  const planConfig = {
    Basic: {
      gradient: "from-blue-500 to-blue-600",
      bg: "bg-blue-100 dark:bg-blue-900/30",
      text: "text-blue-800 dark:text-blue-300",
    },
    Pro: {
      gradient: "from-purple-500 to-purple-600",
      bg: "bg-purple-100 dark:bg-purple-900/30",
      text: "text-purple-800 dark:text-purple-300",
    },
    Enterprise: {
      gradient: "from-amber-500 to-amber-600",
      bg: "bg-amber-100 dark:bg-amber-900/30",
      text: "text-amber-800 dark:text-amber-300",
    },
    Premium: {
      gradient: "from-rose-500 to-pink-600",
      bg: "bg-rose-100 dark:bg-rose-900/30",
      text: "text-rose-800 dark:text-rose-300",
    },
  };

  const planName =
    typeof client.subscription?.plan === "string"
      ? client.subscription.plan
      : client.subscription?.plan?.name || "Basic";
  const status = ((typeof client.user === "object" && client.user?.status) ||
    client.status ||
    "active") as keyof typeof statusConfig;
  const plan = planConfig[planName as keyof typeof planConfig] || {
    gradient: "from-gray-500 to-gray-600",
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-800 dark:text-gray-300",
  };

  const StatusIcon = statusConfig[status].icon;
  const statusLabel = statusConfig[status].label;

  // Calculate subscription progress
  const subscriptionStatus = useMemo(() => {
    if (!client.subscription) return "inactive";
    if (client.subscription.status === "cancelled") return "cancelled";
    if (new Date(client.subscription.expiresAt) < new Date()) return "expired";
    return "active";
  }, [client.subscription]);

  const subscriptionProgress = useMemo(() => {
    if (!client.subscription?.startDate || !client.subscription?.expiresAt)
      return 0;

    const start = new Date(client.subscription.startDate).getTime();
    const end = new Date(client.subscription.expiresAt).getTime();
    const now = new Date().getTime();

    if (now >= end) return 100;
    if (now <= start) return 0;

    return Math.round(((now - start) / (end - start)) * 100);
  }, [client.subscription]);

  // Get days until expiration
  const daysUntilExpiry = client.subscription?.expiresAt
    ? getDaysUntil(client.subscription.expiresAt)
    : null;

  const handleSavePlan = () => {
    if (!client) return;

    const subscription = client.subscription || {
      plan: selectedPlan || "Basic",
      status: "active" as const,
      amount: 0,
      startDate: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      paymentMethod: "credit_card",
      lastBillingDate: new Date().toISOString(),
      nextBillingDate: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ).toISOString(),
      trialEndsAt: new Date(
        Date.now() + 14 * 24 * 60 * 60 * 1000
      ).toISOString(),
    };

    onUpdate({
      ...client,
      subscription: {
        ...subscription,
        plan: {
          _id: selectedPlan,
          name: selectedPlan,
          price:
            Number(
              (document.getElementById("amount") as HTMLInputElement)?.value
            ) || 0,
          isActive: true,
        },
        status: selectedStatus as
          | "active"
          | "cancelled"
          | "expired"
          | "pending",
        amount:
          Number(
            (document.getElementById("amount") as HTMLInputElement)?.value
          ) || 0,
        expiresAt:
          (document.getElementById("expiresAt") as HTMLInputElement)?.value ||
          subscription.expiresAt,
      },
    });

    setIsEditingPlan(false);
  };

  // Quick action handlers
  const handleQuickAction = async (action: string) => {
    switch (action) {
      case "email":
        setIsSendingEmail(true);
        try {
          const email =
            typeof client.user === "string" ? client.user : client.user?.email;
          if (email) {
            window.location.href = `mailto:${email}`;
          }
        } finally {
          setIsSendingEmail(false);
        }
        break;

      case "call":
        const phone =
          typeof client.user === "object" ? client.user?.phone : null;
        if (!phone) {
          toast({
            title: "No phone number",
            description: "This client doesn't have a phone number on file.",
            variant: "destructive",
          });
          return;
        }
        setIsCalling(true);
        try {
          window.location.href = `tel:${phone}`;
        } finally {
          setIsCalling(false);
        }
        break;

      case "message":
        setIsMessaging(true);
        try {
          // In a real app, this would open a messaging interface
          toast({
            title: "Message prepared",
            description: "Opening messaging app...",
          });
        } finally {
          setIsMessaging(false);
        }
        break;

      case "copy-email":
        setIsCopyingEmail(true);
        try {
          const email =
            typeof client.user === "string" ? client.user : client.user?.email;
          if (email) {
            await navigator.clipboard.writeText(email);
            toast({
              title: "Email copied",
              description: "Client email has been copied to clipboard.",
            });
          }
        } catch (error) {
          console.error("Failed to copy email:", error);
          toast({
            title: "Error",
            description: "Could not copy email to clipboard.",
            variant: "destructive",
          });
        } finally {
          setIsCopyingEmail(false);
        }
        break;

      default:
        break;
    }
  };

  const handleDeleteClick = async () => {
    if (!onDelete) return;

    setIsDeleting(true);
    try {
      await onDelete(client._id);
      toast({
        title: "Client deleted",
        description: "The client has been successfully removed.",
      });
    } catch (error) {
      console.error("Error deleting client:", error);
      toast({
        title: "Error",
        description: "Failed to delete client. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleViewProfile = () => {
    setSelectedClient(client);
    navigate(`/dashboard/clients/${client._id}`);
  };

  const handleAssignSubscription = async (subscription: {
    plan: string;
    status: "active" | "cancelled" | "expired" | "pending";
    startDate: string;
    expiresAt: string;
    amount: number;
  }) => {
    try {
      updateClient({
        id: client._id,
        data: {
          subscription,
        },
      });

      toast({
        title: "Subscription updated",
        description: `${
          typeof client.user === "object" && client.user?.fName
            ? client.user.fName
            : "Client"
        }'s subscription has been updated to ${selectedPlan || "Basic"} plan.`,
      });

      return;
    } catch (error) {
      console.error("Error updating subscription:", error);
      toast({
        title: "Error",
        description: "Failed to update subscription. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={cn("h-full group", className)}
      >
        <Card className="h-full flex flex-col overflow-hidden border border-border/20 shadow-sm hover:shadow-md transition-all duration-300">
          {/* Status indicator bar */}
          <div className={`h-1.5 ${statusConfig[status].bg}`} />

          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div className="flex items-start space-x-3">
                <div className="relative">
                  <Avatar className="h-12 w-12 border-2 border-background group-hover:scale-105 transition-transform">
                    <AvatarImage
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${
                        typeof client.user === "string"
                          ? client.user
                          : client.user?.email || client.companyName
                      }`}
                      alt={client.companyName}
                    />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white font-medium">
                      {client.companyName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  {(typeof client.subscription?.plan === "string"
                    ? client.subscription.plan
                    : client.subscription?.plan?.name) === "Premium" && (
                    <div className="absolute -top-1 -right-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="bg-amber-500 text-white p-1 rounded-full">
                            <Crown className="h-3 w-3" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>Premium Client</TooltipContent>
                      </Tooltip>
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-base">
                      {client.companyName}
                    </h3>
                  </div>
                  <div className="flex items-center mt-1 space-x-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs font-normal flex items-center gap-1",
                        statusConfig[status].bg,
                        statusConfig[status].text
                      )}
                    >
                      <StatusIcon className="h-3 w-3" />
                      {statusLabel}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn("text-xs font-normal", plan.bg, plan.text)}
                    >
                      {planName}
                    </Badge>
                  </div>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">More options</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={handleViewProfile}>
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>View Profile</span>
                  </DropdownMenuItem>
                  {canModify && (
                    <>
                      <DropdownMenuItem
                        onClick={() => setShowAssignDialog(true)}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        <span>Assign & Edit Plan</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setShowAssignServiceDialog(true)}
                      >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        <span>Assign Service</span>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleQuickAction("email")}>
                    <Mail className="mr-2 h-4 w-4" />
                    <span>Send Email</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleQuickAction("call")}
                    disabled={
                      !(typeof client.user === "object" && client.user?.phone)
                    }
                  >
                    <PhoneCall className="mr-2 h-4 w-4" />
                    <span>
                      Call{" "}
                      {typeof client.user === "object" && client.user?.phone
                        ? ""
                        : "(No number)"}
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {canModify && onDelete && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowDeleteConfirm(true);
                      }}
                      className="text-destructive focus:text-destructive focus:bg-destructive/10"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      <span>Delete Client</span>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>

          <CardContent className="flex-1">
            <div className="space-y-4">
              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-2 py-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-full"
                      onClick={() => handleQuickAction("email")}
                      disabled={isSendingEmail}
                    >
                      {isSendingEmail ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Mail className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Send Email</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-full"
                      onClick={() => handleQuickAction("call")}
                      disabled={
                        isCalling ||
                        !(typeof client.user === "object" && client.user?.phone)
                      }
                    >
                      {isCalling ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <PhoneCall className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {typeof client.user === "object" && client.user?.phone
                      ? `Call ${client.user.phone}`
                      : "No phone number"}
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Contact Info */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center flex-1 min-w-0">
                    <Mail className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span
                      className="truncate"
                      title={
                        typeof client.user === "string"
                          ? client.user
                          : client.user?.email
                      }
                    >
                      {typeof client.user === "string"
                        ? client.user
                        : client.user?.email}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 ml-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickAction("copy-email");
                    }}
                    disabled={isCopyingEmail}
                  >
                    {isCopyingEmail ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center flex-1 min-w-0">
                    <Phone className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span
                      className={
                        !(typeof client.user === "object" && client.user?.phone)
                          ? "text-muted-foreground/50"
                          : ""
                      }
                    >
                      {typeof client.user === "object" && client.user?.phone
                        ? client.user.phone
                        : "No phone"}
                    </span>
                  </div>
                  {typeof client.user === "object" && client.user?.phone && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 ml-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickAction("call");
                      }}
                      disabled={isCalling}
                    >
                      {isCalling ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <PhoneCall className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  )}
                </div>
              </div>

              {/* Subscription Progress */}
              {client.subscription?.expiresAt && (
                <div className="space-y-2 pt-2 border-t border-border/50">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Subscription</span>
                    <div className="flex items-center">
                      {daysUntilExpiry !== null && (
                        <span
                          className={cn(
                            "text-xs font-medium mr-2",
                            daysUntilExpiry <= 7
                              ? "text-amber-500"
                              : "text-muted-foreground"
                          )}
                        >
                          {daysUntilExpiry > 0
                            ? `${daysUntilExpiry} ${
                                daysUntilExpiry === 1 ? "day" : "days"
                              } left`
                            : "Expired"}
                        </span>
                      )}
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Progress
                      value={subscriptionProgress}
                      className={cn(
                        "h-1.5 bg-muted [&>div:first-child]:transition-all",
                        subscriptionProgress > 80
                          ? "[&>div:first-child]:bg-red-500"
                          : subscriptionProgress > 50
                          ? "[&>div:first-child]:bg-amber-500"
                          : "[&>div:first-child]:bg-green-500"
                      )}
                    />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {client.subscription.startDate
                          ? formatDate(client.subscription.startDate)
                          : "N/A"}
                      </span>
                      <span>
                        Renews{" "}
                        {client.subscription.expiresAt
                          ? formatDate(client.subscription.expiresAt)
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Last Active */}
              {client.lastActive && (
                <div className="pt-2 border-t border-border/50">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Last Active</span>
                    <div className="flex items-center">
                      <Clock className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
                      <span>{formatDate(client.lastActive, true)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>

          <CardFooter className="p-4 pt-4 border-t bg-muted/5 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handleViewProfile}
            >
              View Profile
            </Button>
            {canModify && (
              <Button
                variant="default"
                size="sm"
                className="flex-1 bg-primary/90 hover:bg-primary"
                onClick={() => setShowAssignDialog(true)}
              >
                <FileText className="h-4 w-4 mr-2" />
                Assign Plan
              </Button>
            )}
          </CardFooter>
        </Card>
      </motion.div>

      {/* Edit Plan Dialog */}
      <Dialog open={isEditingPlan} onOpenChange={setIsEditingPlan}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Client Plan</DialogTitle>
            <DialogDescription>
              Update the subscription plan for {client.companyName}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="plan">Plan</Label>
              <Select
                value={
                  selectedPlan ||
                  (typeof client.subscription?.plan === "string"
                    ? client.subscription.plan
                    : client.subscription?.plan?._id) ||
                  ""
                }
                onValueChange={setSelectedPlan}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                  {mockServices.map((service) => (
                    <SelectItem key={service.id} value={service.name}>
                      {service.name} - {formatCurrency(service.price)}/mo
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={
                  selectedStatus || client.subscription?.status || "active"
                }
                onValueChange={setSelectedStatus}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                defaultValue={client.subscription?.amount || 0}
                min="0"
                step="0.01"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiresAt">Expires At</Label>
              <Input
                id="expiresAt"
                type="date"
                defaultValue={
                  client.subscription?.expiresAt
                    ? new Date(client.subscription.expiresAt)
                        .toISOString()
                        .split("T")[0]
                    : ""
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingPlan(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePlan}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Subscription Dialog */}
      <AssignSubscriptionDialog
        open={showAssignDialog}
        onOpenChange={setShowAssignDialog}
        client={client}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["clients"] });
          toast({
            title: "Success!",
            description: "Plan assigned successfully to client.",
          });
        }}
      />

      {/* Assign Service Dialog */}
      <AssignServiceDialog
        open={showAssignServiceDialog}
        onOpenChange={setShowAssignServiceDialog}
        client={client}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["clients"] });
          toast({
            title: "Success!",
            description: "Service assigned successfully to client.",
          });
        }}
        existingServices={
          client.services?.map((s) => (typeof s === "string" ? s : s._id)) || []
        }
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This will permanently delete {client.companyName}'s account and
              all associated data. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteClick}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Client"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};

export default ClientCard;
