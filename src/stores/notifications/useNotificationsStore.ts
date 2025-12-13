import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { STORE_VERSIONS } from "../types";

export interface Notification {
  id: string;
  title: string;
  description: string;
  read: boolean;
  createdAt: string;
  type?: "info" | "success" | "warning" | "error";
}

interface NotificationsState {
  notifications: Notification[];
}

interface NotificationsActions {
  addNotification: (
    notification: Omit<Notification, "id" | "createdAt" | "read">
  ) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

export const useNotificationsStore = create<
  NotificationsState & NotificationsActions
>()(
  persist(
    (set) => ({
      notifications: [],
      addNotification: (notification) =>
        set((state) => ({
          notifications: [
            {
              ...notification,
              id: Math.random().toString(36).substring(7),
              createdAt: new Date().toISOString(),
              read: false,
            },
            ...state.notifications,
          ],
        })),
      markAsRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),
      markAllAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        })),
      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),
      clearAll: () => set({ notifications: [] }),
    }),
    {
      name: "notifications-store",
      version: 1,
      storage: createJSONStorage(() => localStorage),
    }
  )
);
