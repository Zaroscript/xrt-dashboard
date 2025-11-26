import { useState, useEffect } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Mail,
  Phone,
  Building2,
  Globe,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { adminService, PendingUser } from "@/services/api/adminService";
import { RejectUserDialog } from "./RejectUserDialog";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LoadingSpinner } from "../ui/loading-spinner";

interface PendingUsersListProps {
  onUpdate?: () => void;
}

export function PendingUsersList({ onUpdate }: PendingUsersListProps) {
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchPendingUsers = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getPendingUsers();
      setUsers(data);
    } catch (error) {
      console.error("Failed to fetch pending users:", error);
      toast.error("Failed to load pending users");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const handleApprove = async () => {
    if (!selectedUser) return;

    setIsProcessing(true);
    try {
      await adminService.approveUser(selectedUser._id);
      toast.success(`Approved ${selectedUser.fName} ${selectedUser.lName}`);
      setUsers(users.filter((u) => u._id !== selectedUser._id));
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Failed to approve user:", error);
      toast.error("Failed to approve user");
    } finally {
      setIsProcessing(false);
      setShowApproveDialog(false);
      setSelectedUser(null);
    }
  };

  const handleReject = async (reason: string) => {
    if (!selectedUser) return;

    setIsProcessing(true);
    try {
      await adminService.rejectUser(selectedUser._id);
      toast.success(`Rejected ${selectedUser.fName} ${selectedUser.lName}`);
      setUsers(users.filter((u) => u._id !== selectedUser._id));
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Failed to reject user:", error);
      toast.error("Failed to reject user");
    } finally {
      setIsProcessing(false);
      setShowRejectDialog(false);
      setSelectedUser(null);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20">
        <LoadingSpinner />
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-card">
        <div className="flex justify-center mb-4">
          <div className="p-3 rounded-full bg-muted">
            <Clock className="h-6 w-6 text-muted-foreground" />
          </div>
        </div>
        <h3 className="text-lg font-medium">No Pending Registrations</h3>
        <p className="text-muted-foreground mt-1">
          All client registrations have been processed.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3">
        {users.map((user) => (
          <Card
            key={user._id}
            className="overflow-hidden border-l-4 border-l-primary-500 shadow-sm hover:shadow-md transition-shadow"
          >
            <CardHeader className="pb-3 bg-muted/30">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border bg-background">
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {user.fName?.[0]}
                      {user.lName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base font-semibold">
                      {user.fName} {user.lName}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1 text-xs">
                      <Clock className="h-3 w-3" />
                      Registered {new Date(user.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="bg-primary/10 text-primary border-primary"
                >
                  Pending
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4 pb-3 grid gap-3 text-sm">
              <div className="grid gap-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span className="truncate">{user.email}</span>
                </div>
                {user.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4 shrink-0" />
                    <span>{user.phone}</span>
                  </div>
                )}
                {user.companyName && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="h-4 w-4 shrink-0" />
                    <span className="font-medium text-foreground">
                      {user.companyName}
                    </span>
                  </div>
                )}
                {user.oldWebsite && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Globe className="h-4 w-4 shrink-0" />
                    <a
                      href={
                        user.oldWebsite.startsWith("http")
                          ? user.oldWebsite
                          : `https://${user.oldWebsite}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline truncate"
                    >
                      {user.oldWebsite}
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="bg-muted/30 p-3 flex justify-end gap-2 border-t">
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-primary-200"
                onClick={() => {
                  setSelectedUser(user);
                  setShowRejectDialog(true);
                }}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Reject
              </Button>
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white shadow-sm"
                onClick={() => {
                  setSelectedUser(user);
                  setShowApproveDialog(true);
                }}
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Approve
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Approve Confirmation Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Client Registration?</AlertDialogTitle>
            <AlertDialogDescription>
              This will create a client account for{" "}
              <strong>
                {selectedUser?.fName} {selectedUser?.lName}
              </strong>{" "}
              and send them an approval email. They will be able to log in and
              access the dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleApprove();
              }}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? "Approving..." : "Approve Client"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <RejectUserDialog
        open={showRejectDialog}
        onOpenChange={setShowRejectDialog}
        onConfirm={handleReject}
        userName={
          selectedUser ? `${selectedUser.fName} ${selectedUser.lName}` : ""
        }
        isProcessing={isProcessing}
      />
    </>
  );
}
