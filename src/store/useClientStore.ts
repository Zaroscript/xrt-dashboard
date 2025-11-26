import { create } from 'zustand';
import { Client } from '@/types/client.types';

interface ClientStore {
  selectedClient: Client | null;
  setSelectedClient: (client: Client | null) => void;
  recentClients: Client[];
  addRecentClient: (client: Client) => void;
  removeRecentClient: (clientId: string) => void;
}

export const useClientStore = create<ClientStore>((set, get) => ({
  selectedClient: null,
  recentClients: [],
  
  setSelectedClient: (client) => {
    if (client) {
      // Add to recent clients if not already present
      const exists = get().recentClients.some(c => c._id === client._id);
      if (!exists) {
        set(state => ({
          recentClients: [client, ...state.recentClients].slice(0, 5) // Keep only 5 most recent
        }));
      }
    }
    set({ selectedClient: client });
  },
  
  addRecentClient: (client) => {
    set(state => ({
      recentClients: [client, ...state.recentClients.filter(c => c._id !== client._id)].slice(0, 5)
    }));
  },
  
  removeRecentClient: (clientId) => {
    set(state => ({
      recentClients: state.recentClients.filter(c => c._id !== clientId)
    }));
  },
}));
