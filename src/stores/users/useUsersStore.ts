import { create } from "zustand";
import { User } from "../types";

interface UsersState {
  users: User[];
  loading: boolean;
  filter: "all" | "pending" | "active" | "blocked" | "rejected";
  error: string | null;
}

interface UsersActions {
  setUsers: (users: User[]) => void;
  updateUser: (user: Partial<User> & { _id: string }) => void;
  updateClientServices: (userId: string, services: any[]) => void;
  setLoading: (loading: boolean) => void;
  setFilter: (filter: UsersState["filter"]) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export type UsersStore = UsersState & UsersActions;

export const useUsersStore = create<UsersStore>((set, get) => ({
  users: [],
  loading: false,
  filter: "all",
  error: null,

  setUsers: (users) => set({ users }),

  updateUser: (updatedUser) =>
    set((state) => ({
      users: state.users.map((user) =>
        user._id === updatedUser._id
          ? ({ ...user, ...updatedUser } as User)
          : user
      ),
    })),

  updateClientServices: (userId, services) =>
    set((state) => ({
      users: state.users.map((user) =>
        user._id === userId ? { ...user, services } : user
      ),
    })),

  setLoading: (loading) => set({ loading }),

  setFilter: (filter) => set({ filter }),

  setError: (error) => set({ error }),

  clearError: () => set({ error: null }),
}));
