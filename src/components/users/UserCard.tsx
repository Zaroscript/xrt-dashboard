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
  User,
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
import type { User } from "@/store/slices/usersSlice";
import StatusBadge from "./StatusBadge";
import { useState } from "react";
import EditProfile from "./EditProfile";
import SubscriptionForm from "./SubscriptionForm";
import { RejectUserDialog } from "./RejectUserDialog";

export const UserCard: React.FC<{
  user: User;
  onUpdate: (user: User) => void;
}> = ({ user, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isManagingSubscription, setIsManagingSubscription] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Calculate subscription progress
  const subscriptionProgress = useMemo(() => {
    if (!user.subscriptionStart || !user.subscriptionEnd) return 0;
    
    const start = new Date(user.subscriptionStart).getTime();
    const end = new Date(user.subscriptionEnd).getTime();
    const now = new Date().getTime();
    
    if (now >= end) return 100;
    if (now <= start) return 0;
    
    return Math.round(((now - start) / (end - start)) * 100);
  }, [user.subscriptionStart, user.subscriptionEnd]);
  
  // Format date helper
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (e) {
      return 'Invalid date';
    }
  };
  
  // Get subscription status
  const getSubscriptionStatus = () => {
    if (!user.isSubscriber) return 'Not Subscribed';
    if (!user.subscriptionEnd) return 'Active';
    
    const endDate = new Date(user.subscriptionEnd);
    const today = new Date();
    
    if (endDate < today) return 'Expired';
    
    const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return `Expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`;
  };

  const handleStatusChange = async (
    newStatus: User["status"],
    rejectionReason?: string
  ) => {
    await onUpdate({ ...user, status: newStatus, rejectionReason });
  };

  const handlePremiumToggle = async () => {
    await onUpdate({ ...user, isPremium: !user.isPremium });
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
                    src={`https://api.dicebear.com/7.x/avataars/svg?seed=${user.email}`}
                  />
                  <AvatarFallback className="bg-gold-gradient text-primary-foreground text-lg sm:text-xl">
                    {user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg sm:text-xl text-foreground">
                      {user.name}
                    </h3>
                    {user.isClient && (
                      <Crown
                        className="w-4 h-4 sm:w-5 sm:h-5 text-primary"
                        title="Client"
                      />
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {user.email}
                  </p>
                  <div className="flex items-center pt-1 space-x-2">
                    <StatusBadge status={user.status} />
                    {user.isPremium && (
                      <Badge variant="premium" className="text-xs">
                        Premium
                      </Badge>
                    )}
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
                  {user.status === "pending" && (
                    <>
                      <DropdownMenuItem
                        onClick={() => handleStatusChange("active")}
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

                  {user.status === "active" && (
                    <DropdownMenuItem
                      onClick={() => handleStatusChange("blocked")}
                      className="text-red-600 cursor-pointer"
                    >
                      <Ban className="w-4 h-4 mr-2" />
                      Block User
                    </DropdownMenuItem>
                  )}

                  {user.status === "blocked" && (
                    <DropdownMenuItem
                      onClick={() => handleStatusChange("active")}
                      className="text-green-600 cursor-pointer"
                    >
                      <UserCheck className="w-4 h-4 mr-2" />
                      Unblock User
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
                    {user.isClient ? "Manage Subscription" : "Make Client"}
                  </DropdownMenuItem>

                  {user.isClient && (
                    <DropdownMenuItem
                      onClick={handlePremiumToggle}
                      className="cursor-pointer"
                    >
                      <Star className="mr-2 h-4 w-4" />
                      {user.isPremium ? "Remove Premium" : "Make Premium"}
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
                  {user.website && (
                    <div className="flex items-center text-muted-foreground">
                      <Globe className="h-4 w-4 mr-2 flex-shrink-0" />
                      <a 
                        href={user.website.startsWith('http') ? user.website : `https://${user.website}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:text-primary transition-colors truncate"
                        title={user.website}
                      >
                        {user.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}
                  {user.company && (
                    <div className="flex items-center text-muted-foreground">
                      <Briefcase className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{user.company}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Subscription Status */}
              {user.isSubscriber && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium text-muted-foreground flex items-center">
                      <Crown className="h-4 w-4 mr-2 text-amber-500" />
                      Subscription
                    </h4>
                    <Badge variant={subscriptionProgress > 90 ? 'destructive' : 'outline'} className="text-xs">
                      {getSubscriptionStatus()}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Started: {formatDate(user.subscriptionStart)}</span>
                      <span>Ends: {formatDate(user.subscriptionEnd)}</span>
                    </div>
                    <Progress value={subscriptionProgress} className="h-2" />
                  </div>
                </div>
              )}

              {/* Account Details */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Account Details
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Role</span>
                    <span className="font-medium">{user.role || 'User'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Status</span>
                    <StatusBadge status={user.status} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Member Since</span>
                    <span className="font-medium">{formatDate(user.createdAt)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Last Active</span>
                    <span className="font-medium">
                      {user.lastActive ? format(new Date(user.lastActive), 'MMM d, yyyy') : 'N/A'}
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
            <div className="mt-4 sm:mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm border-t border-border/10 pt-4">
              <div className="flex flex-col items-center gap-1 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>Joined:</span>
                <span className="text-foreground font-medium">
                  {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex flex-col items-center gap-1 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Last Active:</span>
                <span className="text-foreground font-medium">
                  {new Date(user.lastActive).toLocaleDateString()}
                </span>
              </div>
            </div>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 pt-4 border-t border-border/10"
                >
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      <span>Phone:</span>
                      <span className="text-foreground font-medium">
                        {user.phoneNumber}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>Location:</span>
                      <span className="text-foreground font-medium">
                        {user.businessLocation}
                      </span>
                    </div>
                    {user.websites && user.websites.length > 0 && (
                      <div className="flex items-start gap-2 text-muted-foreground">
                        <LinkIcon className="w-4 h-4 mt-1" />
                        <span>Websites:</span>
                        <div className="flex flex-col space-y-1">
                          {user.websites.map((site, index) => (
                            <a
                              key={index}
                              href={site}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline font-medium break-all"
                            >
                              {site}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Crown className="w-4 h-4" />
                      <span>Role:</span>
                      <span className="text-foreground font-medium capitalize">
                        {user.role}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-4 text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full"
              >
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-4 h-4" />
                </motion.div>
                <span className="ml-2">
                  {isExpanded ? "Show Less" : "Show More"}
                </span>
              </Button>
            </div>

            {user.rejectionReason && (
              <div className="mt-4 p-3 bg-red-900/10 rounded-lg border border-red-900/20">
                <p className="text-sm text-red-500">
                  <strong className="font-medium">Rejection Reason:</strong>{" "}
                  {user.rejectionReason}
                </p>
              </div>
            )}
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
        user={user}
        open={isRejectDialogOpen}
        onOpenChange={setIsRejectDialogOpen}
        onSuccess={() => setIsRejectDialogOpen(false)}
      />
    </>
  );
};

export default UserCard;
