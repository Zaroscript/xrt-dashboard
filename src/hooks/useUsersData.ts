import { useEffect, useMemo, useState } from "react";
import { useUsersStore } from "@/stores/users/useUsersStore";
import type { User } from "@/stores/types";

export const useUsersData = () => {
  const { users, setUsers, updateUser, loading, setLoading, filter } =
    useUsersStore();
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      const mockUsers: User[] = [
        {
          _id: "1",
          email: "sarah@restaurant.com",
          fName: "Sarah",
          lName: "Wilson",
          phone: "+1234567890",
          companyName: "Italian Bistro",
          role: "client",
          isActive: false, // status: pending equivalent
          isApproved: false,
          createdAt: "2024-01-15T10:30:00Z",
          updatedAt: "2024-01-20T14:20:00Z",
          refreshTokens: [],
        },
        {
          _id: "2",
          email: "mike@bistro.com",
          fName: "Mike",
          lName: "Johnson",
          phone: "+1987654321",
          companyName: "Spice Palace",
          role: "client",
          isActive: true, // status: active
          isApproved: true,
          createdAt: "2023-11-10T09:15:00Z",
          updatedAt: "2024-01-20T16:45:00Z",
          refreshTokens: [],
        },
        {
          _id: "3",
          email: "emily@foodblog.com",
          fName: "Emily",
          lName: "Davis",
          phone: "+1122334455",
          companyName: "Green Harvest",
          role: "subscriber",
          isActive: true,
          isApproved: true,
          createdAt: "2023-12-05T11:20:00Z",
          updatedAt: "2024-01-19T12:30:00Z",
          refreshTokens: [],
        },
        {
          _id: "4",
          email: "blocked@user.com",
          fName: "Blocked",
          lName: "User",
          phone: "+1555666777",
          companyName: "Blocked Corp",
          role: "subscriber",
          isActive: false, // status: blocked equivalent
          isApproved: true,
          createdAt: "2024-01-01T08:00:00Z",
          updatedAt: "2024-01-10T10:15:00Z",
          refreshTokens: [],
        },
      ];
      setUsers(mockUsers);
    }, 500);
    return () => clearTimeout(timer);
  }, [setUsers]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // Only show non-client users in the users list
      if (user.role === "client") return false;

      const fullName = `${user.fName} ${user.lName}`;
      const matchesSearch =
        fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());

      // Map isActive/isApproved to status for filtering
      let status = "active";
      if (!user.isActive) status = "blocked"; // Simplification
      if (!user.isApproved) status = "pending";

      const matchesFilter = filter === "all" || status === filter;
      return matchesSearch && matchesFilter;
    });
  }, [users, filter, searchTerm]);

  const stats = useMemo(() => {
    const nonClientUsers = users.filter((user) => user.role !== "client");
    return {
      total: nonClientUsers.length,
      pending: nonClientUsers.filter((u) => !u.isApproved).length,
      active: nonClientUsers.filter((u) => u.isActive && u.isApproved).length,
      blocked: nonClientUsers.filter((u) => !u.isActive).length,
    };
  }, [users]);

  const handleUserUpdate = (updatedUser: User) => updateUser(updatedUser);

  return {
    users,
    loading,
    searchTerm,
    setSearchTerm,
    filteredUsers,
    stats,
    handleUserUpdate,
  };
};

export default useUsersData;
