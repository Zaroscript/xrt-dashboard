import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Users as UsersIcon,
  Download,
  Clock,
  UserX,
  UserCheck as UserCheckIcon,
  Ban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUsersStore } from "@/stores/users/useUsersStore";
import type { User } from "@/stores/types";
import { UserStatus } from "@/components/users/types";
import UserCard from "@/components/users/UserCard";
import { useUsersData } from "@/hooks/useUsersData";
import { CSVLink } from "react-csv";
import AddUserModal from "@/components/users/AddUserModal";

// Type for export data
interface ExportUser {
  id: string;
  name: string;
  email: string;
  status: string;
  role: string;
  createdAt: string;
  lastActive: string;
}

// Helper to derive status from User object
const getUserStatus = (user: User): string => {
  if (!user.isActive) return "blocked";
  if (!user.isApproved) return "pending";
  return "active";
};

// Separate UserList component for better organization
function UserList({
  users,
  onUpdate,
  emptyMessage = "No users found",
}: {
  users: User[];
  onUpdate: (user: User) => void;
  emptyMessage?: string;
}) {
  if (users.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {users.map((user) => (
        <UserCard key={user._id} user={user} onUpdate={onUpdate} />
      ))}
    </div>
  );
}

export default function Users() {
  const { users } = useUsersStore();
  const { filteredUsers, stats, handleUserUpdate } = useUsersData();
  const [activeTab, setActiveTab] = useState<UserStatus | "all">("all");

  // Filter users based on active tab and search term
  const filteredAndSortedUsers = useMemo(() => {
    let result = [...filteredUsers];

    if (activeTab !== "all") {
      result = result.filter((user) => getUserStatus(user) === activeTab);
    }

    return result.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [filteredUsers, activeTab]);

  // Prepare export data
  const exportUsers: ExportUser[] = filteredAndSortedUsers.map((user) => ({
    id: user._id,
    name: `${user.fName} ${user.lName}`,
    email: user.email,
    status: getUserStatus(user),
    role: user.role || "N/A",
    createdAt: user.createdAt
      ? new Date(user.createdAt).toLocaleDateString()
      : "N/A",
    lastActive: user.updatedAt
      ? new Date(user.updatedAt).toLocaleString()
      : "N/A",
  }));
  const exportHeaders = [
    "ID",
    "Name",
    "Email",
    "Status",
    "Role",
    "Created At",
    "Last Active",
  ] as const;

  // Handle user update with potential rejection reason
  const handleUserUpdateWithReason = async (user: User) => {
    try {
      await handleUserUpdate(user);
    } catch (error) {
      console.error("Failed to update user:", error);
    }
  };

  // Render the component
  return (
    <div className="container mx-auto py-6 px-4 relative">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Users</h1>
            <p className="text-muted-foreground">
              Manage your users and their permissions
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <CSVLink
              data={exportUsers}
              filename={`users-export-${new Date()
                .toISOString()
                .slice(0, 10)}.csv`}
              headers={exportHeaders.map((header) => ({
                label: header,
                key: header,
              }))}
            >
              <Button variant="outline" className="glass-card">
                <Download className="w-4 h-4 mr-2" />
                Export Users
              </Button>
            </CSVLink>
            <AddUserModal />
          </div>
        </div>

        {/* Status Tabs */}
        <Tabs
          defaultValue="all"
          className="w-full"
          onValueChange={(value) => setActiveTab(value as UserStatus | "all")}
        >
          <TabsList className="grid w-full grid-cols-5 h-auto p-1 bg-muted/20">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <UsersIcon className="h-4 w-4" />
              All
              <Badge variant="secondary" className="ml-1">
                {stats.total}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending
              <Badge variant="secondary">{stats.pending}</Badge>
            </TabsTrigger>
            <TabsTrigger value="active" className="flex items-center gap-2">
              <UserCheckIcon className="h-4 w-4" />
              Active
              <Badge variant="secondary">{stats.active}</Badge>
            </TabsTrigger>
            <TabsTrigger value="blocked" className="flex items-center gap-2">
              <Ban className="h-4 w-4" />
              Blocked
              <Badge variant="secondary">{stats.blocked}</Badge>
            </TabsTrigger>
            <TabsTrigger value="rejected" className="flex items-center gap-2">
              <UserX className="h-4 w-4" />
              Rejected
              <Badge variant="secondary">
                {users.filter((u) => getUserStatus(u) === "rejected").length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <UserList
              users={filteredAndSortedUsers}
              onUpdate={handleUserUpdateWithReason}
              emptyMessage="No users found"
            />
          </TabsContent>
          <TabsContent value="pending" className="mt-6">
            <UserList
              users={filteredAndSortedUsers.filter(
                (u) => getUserStatus(u) === "pending"
              )}
              onUpdate={handleUserUpdateWithReason}
              emptyMessage="No pending users found"
            />
          </TabsContent>
          <TabsContent value="active" className="mt-6">
            <UserList
              users={filteredAndSortedUsers.filter(
                (u) => getUserStatus(u) === "active"
              )}
              onUpdate={handleUserUpdateWithReason}
              emptyMessage="No active users found"
            />
          </TabsContent>
          <TabsContent value="blocked" className="mt-6">
            <UserList
              users={filteredAndSortedUsers.filter(
                (u) => getUserStatus(u) === "blocked"
              )}
              onUpdate={handleUserUpdateWithReason}
              emptyMessage="No blocked users found"
            />
          </TabsContent>
          <TabsContent value="rejected" className="mt-6">
            <UserList
              users={filteredAndSortedUsers.filter(
                (u) => getUserStatus(u) === "rejected"
              )}
              onUpdate={handleUserUpdateWithReason}
              emptyMessage="No rejected users found"
            />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
