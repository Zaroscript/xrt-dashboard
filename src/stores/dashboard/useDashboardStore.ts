import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface DashboardState {
  stats: any; 
  recentActivities: any[]; 
  isLoading: boolean;
  error: string | null;
  setStats: (stats: any) => void;
  setRecentActivities: (activities: any[]) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useDashboardStore = create<DashboardState>()(
  devtools(
    persist(
      (set) => ({
        stats: null,
        recentActivities: [],
        isLoading: false,
        error: null,
        setStats: (stats) => set({ stats }),
        setRecentActivities: (recentActivities) => set({ recentActivities }),
        setLoading: (isLoading) => set({ isLoading }),
        setError: (error) => set({ error }),
        reset: () => 
          set({
            stats: null,
            recentActivities: [],
            isLoading: false,
            error: null,
          }),
      }),
      {
        name: 'dashboard-storage',
      }
    )
  )
);
