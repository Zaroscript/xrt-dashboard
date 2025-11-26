import { useState, useEffect } from "react";
import {
  Trash2,
  RefreshCcw,
  Clock,
  Mail,
  Phone,
  Building2,
  Globe,
  AlertTriangle,
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

interface RemovedUsersListProps {
  onUpdate?: () => void;
}

export function RemovedUsersList({ onUpdate }: RemovedUsersListProps) {
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchRemovedUsers = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getRemovedUsers();
      setUsers(data);
    } catch (error) {
      console.error("Failed to fetch removed users:", error);
      toast.error("Failed to load removed users");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRemovedUsers();
  }, []);

  const handleRestore = async () => {
    if (!selectedUser) return;

    setIsProcessing(true);
    try {
      // Restore to active status
      await adminService.updateUserStatus(selectedUser._id, "active");
      toast.success(`Restored ${selectedUser.fName} ${selectedUser.lName}`);
      setUsers(users.filter((u) => u._id !== selectedUser._id));
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Failed to restore user:", error);
      toast.error("Failed to restore user");
    } finally {
      setIsProcessing(false);
      setShowRestoreDialog(false);
      setSelectedUser(null);
    }
  };

  const handleDeletePermanently = async () => {
    if (!selectedUser) return;

    setIsProcessing(true);
    try {
      await adminService.deleteUserPermanently(selectedUser._id);
      toast.success(
        `Permanently deleted ${selectedUser.fName} ${selectedUser.lName}`
      );
      setUsers(users.filter((u) => u._id !== selectedUser._id));
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Failed to delete user:", error);
      toast.error("Failed to delete user");
    } finally {
      setIsProcessing(false);
      setShowDeleteDialog(false);
      setSelectedUser(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-card">
        <div className="flex justify-center mb-4">
          <div className="p-3 rounded-full bg-muted">
            <Trash2 className="h-6 w-6 text-muted-foreground" />
          </div>
        </div>
        <h3 className="text-lg font-medium">No Removed Users</h3>
        <p className="text-muted-foreground mt-1">
          There are no users in the removed list.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
        {users.map((user) => (
          <Card
            key={user._id}
            className="overflow-hidden border-l-4 border-l-red-500 shadow-sm hover:shadow-md transition-shadow opacity-90 hover:opacity-100"
          >
            <CardHeader className="pb-3 bg-muted/30">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border bg-background grayscale">
                    <AvatarFallback className="bg-muted text-muted-foreground font-medium">
                      {user.fName?.[0]}
                      {user.lName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base font-semibold text-muted-foreground">
                      {user.fName} {user.lName}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1 text-xs">
                      <Clock className="h-3 w-3" />
                      Removed {new Date(user.updatedAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="bg-red-500/10 text-red-600 border-red-200"
                >
                  Removed
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4 pb-3 grid gap-3 text-sm grayscale-[0.5]">
              <div className="grid gap-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span className="truncate">{user.email}</span>
                </div>
                {user.companyName && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="h-4 w-4 shrink-0" />
                    <span className="font-medium">{user.companyName}</span>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="bg-muted/30 p-3 flex justify-end gap-2 border-t">
              <Button
                variant="outline"
                size="sm"
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                onClick={() => {
                  setSelectedUser(user);
                  setShowRestoreDialog(true);
                }}
              >
                <RefreshCcw className="h-4 w-4 mr-1" />
                Restore
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="shadow-sm"
                onClick={() => {
                  setSelectedUser(user);
                  setShowDeleteDialog(true);
                }}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete Forever
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore User?</AlertDialogTitle>
            <AlertDialogDescription>
              This will restore{" "}
              <strong>
                {selectedUser?.fName} {selectedUser?.lName}
              </strong>{" "}
              to active status. They will be able to log in again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleRestore();
              }}
              disabled={isProcessing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isProcessing ? "Restoring..." : "Restore User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Permanent Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Permanently Delete User?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete{" "}
              <strong>
                {selectedUser?.fName} {selectedUser?.lName}
              </strong>{" "}
              and all associated data (client profile, subscriptions, etc.) from
              the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeletePermanently();
              }}
              disabled={isProcessing}
              className="bg-red-600 hover:bg-red-700"
            >
              {isProcessing ? "Deleting..." : "Delete Permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
