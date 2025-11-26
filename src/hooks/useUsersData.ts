import { useEffect, useMemo, useState } from 'react';
import { useUsersStore } from '@/stores/users/useUsersStore';
import type { User } from '@/stores/types';

export const useUsersData = () => {
  const { users, setUsers, updateUser, loading, setLoading } = useUsersStore();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      const mockUsers: User[] = [
        {
          id: '1',
          email: 'sarah@restaurant.com',
          name: 'Sarah Wilson',
          firstName: 'Sarah',
          lastName: 'Wilson',
          phoneNumber: '+1234567890',
          businessLocation: 'New York, NY',
          status: 'pending',
          createdAt: '2024-01-15T10:30:00Z',
          lastActive: '2024-01-20T14:20:00Z',
          isClient: false
        },
        {
          id: '2',
          email: 'mike@bistro.com',
          name: 'Mike Johnson',
          firstName: 'Mike',
          lastName: 'Johnson',
          phoneNumber: '+1987654321',
          businessLocation: 'Los Angeles, CA',
          status: 'active',
          subscription: {
            plan: 'Premium',
            status: 'active',
            expiresAt: '2024-12-15T00:00:00Z',
            amount: 99
          },
          createdAt: '2023-11-10T09:15:00Z',
          lastActive: '2024-01-20T16:45:00Z',
          isClient: true
        },
        {
          id: '3',
          email: 'emily@foodblog.com',
          name: 'Emily Davis',
          firstName: 'Emily',
          lastName: 'Davis',
          phoneNumber: '+1122334455',
          businessLocation: 'Chicago, IL',
          status: 'active',
          subscription: {
            plan: 'Basic',
            status: 'active',
            expiresAt: '2024-08-10T00:00:00Z',
            amount: 49
          },
          createdAt: '2023-12-05T11:20:00Z',
          lastActive: '2024-01-19T12:30:00Z',
          isClient: false
        },
        {
          id: '4',
          email: 'blocked@user.com',
          name: 'Blocked User',
          firstName: 'Blocked',
          lastName: 'User',
          phoneNumber: '+1555666777',
          businessLocation: 'Nowhere, NA',
          status: 'blocked',
          createdAt: '2024-01-01T08:00:00Z',
          lastActive: '2024-01-10T10:15:00Z',
          isClient: false
        },
      ];
      setUsers(mockUsers);
    }, 500);
    return () => clearTimeout(timer);
  }, [setUsers]);

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // Only show non-client users in the users list
      if (user.isClient) return false;
      
      const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filter === 'all' || user.status === filter;
      return matchesSearch && matchesFilter;
    });
  }, [users, filter, searchTerm]);

  const stats = useMemo(() => {
    const nonClientUsers = users.filter(user => !user.isClient);
    return {
      total: nonClientUsers.length,
      pending: nonClientUsers.filter(u => u.status === 'pending').length,
      active: nonClientUsers.filter(u => u.status === 'active').length,
      blocked: nonClientUsers.filter(u => u.status === 'blocked').length,
    };
  }, [users]);

  const handleUserUpdate = (updatedUser: User) => updateUser(updatedUser);

  return { users, loading, searchTerm, setSearchTerm, filteredUsers, stats, handleUserUpdate };
};

export default useUsersData;

