import { motion, AnimatePresence } from "framer-motion";
import {
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Edit,
  Ban,
  UserCheck,
  Crown,
  CreditCard,
  Calendar,
  Clock,
  ChevronDown,
  Phone,
  MapPin,
  Mail,
  Globe,
  User as UserIcon,
  Info,
  Briefcase,
  FileText,
  Link as LinkIcon,
  Star,
  ChevronRight
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { User } from "@/stores/types";
import StatusBadge from "./StatusBadge";
import { getAvatarUrl, getUserInitials } from "@/utils/avatarUtils";
import { useMemo, useState } from "react";
import EditProfile from "./EditProfile";
import SubscriptionForm from "./SubscriptionForm";
import { RejectUserDialog } from "./RejectUserDialog";
import { useSubscribersStore } from "@/stores/index";

export const UserCard: React.FC<{
  user: User;
  onUpdate: (user: User) => void;
}> = ({ user, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isManagingSubscription, setIsManagingSubscription] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Get subscriber store
  const { getSubscribersByUser, createSubscriber, approveSubscriber } = useSubscribersStore();
  
  // Get user's subscription data with error handling
  const userSubscription = useMemo(() => {
    try {
      const subscriptions = getSubscribersByUser(user._id);
      return subscriptions && subscriptions.length > 0 ? subscriptions[0] : null;
    } catch (error) {
      console.error('Error fetching subscriber data:', error);
      return null;
    }
  }, [user._id, getSubscribersByUser]);
  
  // Calculate subscription progress
  const subscriptionProgress = useMemo(() => {
    if (!userSubscription || !userSubscription.plan?.startDate || !userSubscription.plan?.endDate) {
      return 0;
    }
    
    try {
      const start = new Date(userSubscription.plan.startDate);
      const end = new Date(userSubscription.plan.endDate);
      const now = new Date();
      
      // Validate dates
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return 0;
      }
      
      if (now < start) return 0;
      if (now > end) return 100;
      
      const total = end.getTime() - start.getTime();
      const elapsed = now.getTime() - start.getTime();
      
      return Math.round((elapsed / total) * 100);
    } catch (error) {
      console.error('Error calculating subscription progress:', error);
      return 0;
    }
  }, [userSubscription]);
  
  // Make dates look nice
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (e) {
      return 'Invalid date';
    }
  };
  
  // Figure out what the subscription status should show
  const getSubscriptionStatus = () => {
    if (!userSubscription) {
      return 'No subscription';
    }
    
    switch (userSubscription.status) {
      case 'active':
        return userSubscription.plan?.status === 'active' ? 'Active' : 'Pending';
      case 'pending_approval':
        return 'Pending Approval';
      case 'inactive':
        return 'Inactive';
      case 'suspended':
        return 'Suspended';
      case 'cancelled':
        return 'Cancelled';
      case 'expired':
        return 'Expired';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Unknown';
    }
  };
  
  // Check if user is a subscriber
  const isSubscriber = !!userSubscription && userSubscription.status === 'active';

  const handleStatusChange = async (
    newStatus: "approved" | "rejected",
    rejectionReason?: string
  ) => {
    const updatedUser = { 
      ...user, 
      isApproved: newStatus === "approved"
    };
    await onUpdate(updatedUser);
  };

  const handleRejectWithReason = async (reason: string) => {
    await handleStatusChange("rejected", reason);
  };

  const handleUpdate = (updatedUser: User) => {
    onUpdate(updatedUser);
    setIsEditing(false);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{
          scale: 1.02,
          boxShadow: "0px 10px 30px -5px rgba(0, 0, 0, 0.1)",
        }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="h-full"
      >
        <Card className="glass-card-hover h-full flex flex-col rounded-xl overflow-hidden border border-border/20 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardContent className="p-4 sm:p-6 flex flex-col flex-grow">
            <div className="flex flex-col sm:flex-row items-start justify-between">
              <div className="flex items-center space-x-4">
                <Avatar className="h-12 w-12 sm:h-16 sm:w-16 ring-4 ring-primary/10 border-2 border-background">
                  <AvatarImage
                    src={getAvatarUrl(user.avatar)}
                    alt={`${user.fName || ''} ${user.lName || ''}`.trim() || 'User'}
                  />
                  <AvatarFallback className="bg-gold-gradient text-primary-foreground text-lg sm:text-xl">
                    {user.initials || getUserInitials(user.fName, user.lName, user.email)}
                  </AvatarFallback>
                </Avatar>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg sm:text-xl text-foreground">
                      {`${user.fName} ${user.lName}`}
                    </h3>
                    {user.role === "client" && (
                      <Crown
                        className="w-4 h-4 sm:w-5 sm:h-5 text-primary"
                      />
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {user.email}
                  </p>
                  <div className="flex items-center pt-1 space-x-2">
                    <StatusBadge user={user} />
                  </div>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 sm:static"
                  >
                    <MoreHorizontal className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="glass-card w-56">
                  {!user.isApproved && (
                    <>
                      <DropdownMenuItem
                        onClick={() => handleStatusChange("approved")}
                        className="text-green-600 cursor-pointer"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve User
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setIsRejectDialogOpen(true)}
                        className="text-red-600 cursor-pointer"
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject with Reason
                      </DropdownMenuItem>
                    </>
                  )}

                  {user.isApproved && !user.isActive && (
                    <DropdownMenuItem
                      onClick={() => onUpdate({ ...user, isActive: true })}
                      className="text-green-600 cursor-pointer"
                    >
                      <UserCheck className="w-4 h-4 mr-2" />
                      Unblock User
                    </DropdownMenuItem>
                  )}

                  {user.isApproved && user.isActive && (
                    <DropdownMenuItem
                      onClick={() => onUpdate({ ...user, isActive: false })}
                      className="text-red-600 cursor-pointer"
                    >
                      <Ban className="w-4 h-4 mr-2" />
                      Block User
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem
                    onClick={() => setIsEditing(true)}
                    className="cursor-pointer"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => setIsManagingSubscription(true)}
                    className="cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    {isSubscriber ? "Manage Subscription" : "Create Subscription"}
                  </DropdownMenuItem>

                  {isSubscriber && (
                    <DropdownMenuItem
                      onClick={() => {}}
                      className="cursor-pointer"
                    >
                      <Star className="mr-2 h-4 w-4" />
                      Premium Features
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="mt-6 space-y-4">
              {/* Contact Information */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground flex items-center">
                  <Info className="h-4 w-4 mr-2" />
                  Contact Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  {user.phone && (
                    <div className="flex items-center text-muted-foreground">
                      <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{user.phone}</span>
                    </div>
                  )}
                  {user.email && (
                    <div className="flex items-center text-muted-foreground">
                      <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                      <a 
                        href={`mailto:${user.email}`} 
                        className="hover:text-primary transition-colors truncate"
                        title={user.email}
                      >
                        {user.email}
                      </a>
                    </div>
                  )}
                  {user.oldWebsite && (
                    <div className="flex items-center text-muted-foreground">
                      <Globe className="h-4 w-4 mr-2 flex-shrink-0" />
                      <a 
                        href={user.oldWebsite.startsWith('http') ? user.oldWebsite : `https://${user.oldWebsite}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:text-primary transition-colors truncate"
                        title={user.oldWebsite}
                      >
                        {user.oldWebsite.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}
                  {user.companyName && (
                    <div className="flex items-center text-muted-foreground">
                      <Briefcase className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{user.companyName}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Subscription Status */}
              {userSubscription && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium text-muted-foreground flex items-center">
                      <Crown className="h-4 w-4 mr-2 text-amber-500" />
                      Subscription
                    </h4>
                    <Badge variant="outline" className="text-xs">
                      {getSubscriptionStatus()}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {userSubscription.plan?.plan && (
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Plan:</span>
                        <span className="text-foreground font-medium">
                          {typeof userSubscription.plan.plan === 'string' 
                            ? userSubscription.plan.plan 
                            : userSubscription.plan.plan.name || 'Unknown Plan'
                          }
                        </span>
                      </div>
                    )}
                    {userSubscription.plan?.startDate && (
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Started:</span>
                        <span className="text-foreground font-medium">
                          {formatDate(userSubscription.plan.startDate)}
                        </span>
                      </div>
                    )}
                    {userSubscription.plan?.endDate && (
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Expires:</span>
                        <span className="text-foreground font-medium">
                          {formatDate(userSubscription.plan.endDate)}
                        </span>
                      </div>
                    )}
                    {subscriptionProgress > 0 && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Progress:</span>
                          <span className="text-foreground font-medium">{subscriptionProgress}%</span>
                        </div>
                        <Progress value={subscriptionProgress} className="h-2" />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Account Details */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground flex items-center">
                  <UserIcon className="h-4 w-4 mr-2" />
                  Account Details
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Role</span>
                    <span className="font-medium">{user.role || 'User'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Status</span>
                    <span className="font-medium">
                      {user.isApproved ? (user.isActive ? "Active" : "Blocked") : "Pending"}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Member Since</span>
                    <span className="font-medium">{formatDate(user.createdAt)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Last Active</span>
                    <span className="font-medium">
                      {user.updatedAt ? format(new Date(user.updatedAt), 'MMM d, yyyy') : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Expandable Section */}
              <div className="pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-muted-foreground hover:text-foreground"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {isExpanded ? 'Show less' : 'Show more details'}
                  <ChevronRight 
                    className={cn(
                      "ml-2 h-4 w-4 transition-transform",
                      isExpanded ? "rotate-90" : ""
                    )} 
                  />
                </Button>
                
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 space-y-4 pt-2 border-t">
                        {/* Additional User Details */}
                        {user.bio && (
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-1">About</h4>
                            <p className="text-sm">{user.bio}</p>
                          </div>
                        )}
                        
                        {/* Custom Fields Section */}
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">Additional Information</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {user.address && (
                              <div className="flex items-start">
                                <MapPin className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0" />
                                <div>
                                  <p className="text-sm font-medium">Address</p>
                                  <p className="text-sm text-muted-foreground">{user.address}</p>
                                </div>
                              </div>
                            )}
                            {user.notes && (
                              <div className="flex items-start">
                                <FileText className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0" />
                                <div>
                                  <p className="text-sm font-medium">Notes</p>
                                  <p className="text-sm text-muted-foreground">{user.notes}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            
          </CardContent>
        </Card>
      </motion.div>

      <AnimatePresence>
        {isEditing && (
          <EditProfile
            user={user}
            onSuccess={() => setIsEditing(false)}
            onCancel={() => setIsEditing(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isManagingSubscription && (
          <SubscriptionForm
            user={user}
            onSuccess={() => {
              setIsManagingSubscription(false);
            }}
            onCancel={() => setIsManagingSubscription(false)}
          />
        )}
      </AnimatePresence>

      <RejectUserDialog
        open={isRejectDialogOpen}
        onOpenChange={setIsRejectDialogOpen}
        onConfirm={handleRejectWithReason}
        userName={`${user.fName} ${user.lName}`}
      />
    </>
  );
};

export default UserCard;
