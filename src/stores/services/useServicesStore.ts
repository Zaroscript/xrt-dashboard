import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Service } from '@/types/service.types';
import { STORE_VERSIONS } from '@/stores/types';
import { servicesApi } from '@/services/api/servicesApi';

interface ServicesState {
  services: Service[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
  activeOnly: boolean;
}

interface ServicesActions {
  // State management
  setServices: (services: Service[]) => void;
  addService: (service: Service) => void;
  updateService: (id: string, updates: Partial<Service>) => void;
  removeService: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setSearchTerm: (term: string) => void;
  setActiveOnly: (activeOnly: boolean) => void;
  
  // API actions
  fetchServices: () => Promise<void>;
  fetchService: (id: string) => Promise<Service>;
  createService: (serviceData: Omit<Service, '_id' | 'createdAt' | 'updatedAt'>) => Promise<Service>;
  updateServiceApi: (id: string, updates: Partial<Service>) => Promise<Service>;
  deleteService: (id: string) => Promise<void>;
  
  // Utility actions
  toggleServiceStatus: (id: string) => Promise<Service>;
  applyDiscount: (id: string, discount: { amount: number; isActive: boolean; startDate?: Date; endDate?: Date; code?: string }) => Promise<void>;
  removeDiscount: (id: string) => Promise<void>;
}

export type ServicesStore = ServicesState & ServicesActions;

export const useServicesStore = create<ServicesStore>()(
  persist(
    (set, get) => ({
      // Initial state
      services: [],
      loading: false,
      error: null,
      searchTerm: '',
      activeOnly: true,

      // State management actions
      setServices: (services) => set({ services }),
      
      addService: (service) => 
        set((state) => ({ 
          services: [...state.services, service] 
        })),

      updateService: (id, updates) =>
        set((state) => ({
          services: state.services.map((service) =>
            service._id === id ? { ...service, ...updates } : service
          ),
        })),

      removeService: (id) =>
        set((state) => ({
          services: state.services.filter((service) => service._id !== id),
        })),

      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
      setSearchTerm: (searchTerm) => set({ searchTerm }),
      setActiveOnly: (activeOnly) => set({ activeOnly }),

      // API actions
      fetchServices: async () => {
        set({ loading: true, error: null });
        try {
          const data = await servicesApi.getServices();
          set({ services: data, loading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch services',
            loading: false,
            services: []
          });
        }
      },

      fetchService: async (id: string) => {
        try {
          return await servicesApi.getService(id);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to fetch service';
          set({ error: errorMessage });
          throw new Error(errorMessage);
        }
      },

      createService: async (serviceData) => {
        try {
          const newService = await servicesApi.createService(serviceData);
          set((state) => ({
            services: [...state.services, newService],
          }));
          return newService;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to create service';
          set({ error: errorMessage });
          throw new Error(errorMessage);
        }
      },

      updateServiceApi: async (id, updates) => {
        try {
          const updatedService = await servicesApi.updateService(id, updates);
          set((state) => ({
            services: state.services.map((s) =>
              s._id === id ? { ...s, ...updatedService } : s
            ),
          }));
          return updatedService;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to update service';
          set({ error: errorMessage });
          throw new Error(errorMessage);
        }
      },

      deleteService: async (id) => {
        try {
          await servicesApi.deleteService(id);
          set((state) => ({
            services: state.services.filter((s) => s._id !== id),
          }));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to delete service';
          set({ error: errorMessage });
          throw new Error(errorMessage);
        }
      },

      // Utility actions
      toggleServiceStatus: async (id) => {
        try {
          const updatedService = await servicesApi.toggleServiceStatus(id);
          set((state) => ({
            services: state.services.map((s) =>
              s._id === id ? { ...s, ...updatedService } : s
            ),
          }));
          return updatedService;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to toggle service status';
          set({ error: errorMessage });
          throw new Error(errorMessage);
        }
      },

      applyDiscount: async (id, discount) => {
        await get().updateServiceApi(id, { discount });
      },

      removeDiscount: async (id) => {
        await get().updateServiceApi(id, { 
          discount: { amount: 0, isActive: false }
        });
      },
    }),
    {
      name: 'services-store',
      version: STORE_VERSIONS.SERVICES,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        services: state.services,
        searchTerm: state.searchTerm,
        activeOnly: state.activeOnly,
      }),
    }
  )
);