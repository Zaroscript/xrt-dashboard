import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { adminService } from '@/services/api/adminService';

export interface Moderator {
  _id: string;
  fName: string;
  lName: string;
  email: string;
  createdAt: string;
  plainPassword?: string;
}

interface SettingsStore {
  // Moderators
  moderators: Moderator[];
  isLoadingModerators: boolean;
  moderatorError: string | null;
  
  // Actions
  fetchModerators: () => Promise<void>;
  addModerator: (data: { name: string; email: string; password?: string }) => Promise<boolean>;
  updateModerator: (id: string, data: { name?: string; email?: string; password?: string }) => Promise<boolean>;
  removeModerator: (id: string) => Promise<boolean>;
  

}

const useSettingsStore = create<SettingsStore>()(
  devtools(
    (set, get) => ({
      // Initial State
      moderators: [],
      isLoadingModerators: false,
      moderatorError: null,
      theme: 'system',

      // Actions
      fetchModerators: async () => {
        set({ isLoadingModerators: true, moderatorError: null });
        try {
          const moderators = await adminService.getModerators();
          console.log('Fetched moderators:', moderators);
          console.log('First moderator plainPassword:', moderators[0]?.plainPassword);
          set({ moderators, isLoadingModerators: false });
        } catch (error: any) {
          console.error('Failed to fetch moderators:', error);
          set({ 
            isLoadingModerators: false, 
            moderatorError: error.response?.data?.message || 'Failed to fetch moderators' 
          });
        }
      },

      addModerator: async (data) => {
        set({ isLoadingModerators: true, moderatorError: null });
        try {
          const newModerator = await adminService.createModerator(data);
          set((state) => ({
            moderators: [...state.moderators, newModerator],
            isLoadingModerators: false
          }));
          return true;
        } catch (error: any) {
          console.error('Failed to add moderator:', error);
          set({ 
            isLoadingModerators: false, 
            moderatorError: error.response?.data?.message || 'Failed to add moderator' 
          });
          return false;
        }
      },

      updateModerator: async (id, data) => {
        set({ isLoadingModerators: true, moderatorError: null });
        try {
          const updatedModerator = await adminService.updateModerator(id, data);
          set(state => ({
            moderators: state.moderators.map(mod => mod._id === id ? updatedModerator : mod),
            isLoadingModerators: false
          }));
          return true;
        } catch (error: any) {
          console.error('Failed to update moderator:', error);
          set({ 
            isLoadingModerators: false, 
            moderatorError: error.response?.data?.message || 'Failed to update moderator' 
          });
          return false;
        }
      },

      removeModerator: async (id) => {
        set({ isLoadingModerators: true, moderatorError: null });
        try {
          await adminService.deleteModerator(id);
          set((state) => ({
            moderators: state.moderators.filter((m) => m._id !== id),
            isLoadingModerators: false
          }));
          return true;
        } catch (error: any) {
          console.error('Failed to remove moderator:', error);
          set({ 
            isLoadingModerators: false, 
            moderatorError: error.response?.data?.message || 'Failed to remove moderator' 
          });
          return false;
        }
      },

      // Theme is now handled by next-themes
    }),
    { name: 'SettingsStore' }
  )
);

export default useSettingsStore;
