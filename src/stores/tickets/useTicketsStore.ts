import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Ticket } from '../types';
import { STORE_VERSIONS } from '../types';

interface TicketsState {
  tickets: Ticket[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
  statusFilter: 'all' | 'open' | 'in_progress' | 'resolved' | 'closed';
  priorityFilter: 'all' | 'low' | 'medium' | 'high' | 'urgent';
  categoryFilter: 'all' | 'technical' | 'billing' | 'feature_request' | 'bug_report' | 'other';
  selectedTicket: Ticket | null;
}

interface TicketsActions {
  // State management
  setTickets: (tickets: Ticket[]) => void;
  addTicket: (ticket: Ticket) => void;
  updateTicket: (id: string, updates: Partial<Ticket>) => void;
  removeTicket: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setSearchTerm: (term: string) => void;
  setStatusFilter: (filter: 'all' | 'open' | 'in_progress' | 'resolved' | 'closed') => void;
  setPriorityFilter: (filter: 'all' | 'low' | 'medium' | 'high' | 'urgent') => void;
  setCategoryFilter: (filter: 'all' | 'technical' | 'billing' | 'feature_request' | 'bug_report' | 'other') => void;
  setSelectedTicket: (ticket: Ticket | null) => void;
  
  // API actions
  fetchTickets: () => Promise<void>;
  fetchTicket: (id: string) => Promise<Ticket>;
  createTicket: (ticketData: Omit<Ticket, '_id' | 'responses' | 'createdAt' | 'updatedAt'>) => Promise<Ticket>;
  updateTicketApi: (id: string, updates: Partial<Ticket>) => Promise<Ticket>;
  deleteTicket: (id: string) => Promise<void>;
  
  // Ticket operations
  updateStatus: (id: string, status: 'open' | 'in_progress' | 'resolved' | 'closed') => Promise<void>;
  updatePriority: (id: string, priority: 'low' | 'medium' | 'high' | 'urgent') => Promise<void>;
  assignToUser: (id: string, userId: string) => Promise<void>;
  addResponse: (id: string, response: { message: string; user: string; isAdmin?: boolean }) => Promise<void>;
  closeTicket: (id: string) => Promise<void>;
  reopenTicket: (id: string) => Promise<void>;
  
  // Utility actions
  getTicketsByUser: (userId: string) => Ticket[];
  getTicketsByStatus: (status: 'open' | 'in_progress' | 'resolved' | 'closed') => Ticket[];
  getTicketsByPriority: (priority: 'low' | 'medium' | 'high' | 'urgent') => Ticket[];
  getTicketsByCategory: (category: 'technical' | 'billing' | 'feature_request' | 'bug_report' | 'other') => Ticket[];
  getOpenTickets: () => Ticket[];
  getUnassignedTickets: () => Ticket[];
  getTicketStats: () => {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
    urgent: number;
  };
  
  // Computed getters
  getTicketById: (id: string) => Ticket | undefined;
  getFilteredTickets: () => Ticket[];
}

export type TicketsStore = TicketsState & TicketsActions;

export const useTicketsStore = create<TicketsStore>()(
  persist(
    (set, get) => ({
      // Initial state
      tickets: [],
      loading: false,
      error: null,
      searchTerm: '',
      statusFilter: 'all',
      priorityFilter: 'all',
      categoryFilter: 'all',
      selectedTicket: null,

      // State management actions
      setTickets: (tickets) => set({ tickets }),
      
      addTicket: (ticket) => 
        set((state) => ({ 
          tickets: [...state.tickets, ticket] 
        })),

      updateTicket: (id, updates) =>
        set((state) => ({
          tickets: state.tickets.map((ticket) =>
            ticket._id === id ? { ...ticket, ...updates } : ticket
          ),
        })),

      removeTicket: (id) =>
        set((state) => ({
          tickets: state.tickets.filter((ticket) => ticket._id !== id),
        })),

      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
      setSearchTerm: (searchTerm) => set({ searchTerm }),
      setStatusFilter: (statusFilter) => set({ statusFilter }),
      setPriorityFilter: (priorityFilter) => set({ priorityFilter }),
      setCategoryFilter: (categoryFilter) => set({ categoryFilter }),
      setSelectedTicket: (selectedTicket) => set({ selectedTicket }),

      // API actions
      fetchTickets: async () => {
        set({ loading: true, error: null });
        try {
          const response = await fetch('/api/tickets');
          if (!response.ok) throw new Error('Failed to fetch tickets');
          const data = await response.json();
          set({ tickets: data, loading: false });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to fetch tickets', loading: false });
        }
      },

      fetchTicket: async (id: string) => {
        try {
          const response = await fetch(`/api/tickets/${id}`);
          if (!response.ok) throw new Error('Failed to fetch ticket');
          return await response.json();
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to fetch ticket' });
          throw error;
        }
      },

      createTicket: async (ticketData) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch('/api/tickets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ticketData),
          });
          if (!response.ok) throw new Error('Failed to create ticket');
          const newTicket = await response.json();
          set((state) => ({ tickets: [...state.tickets, newTicket], loading: false }));
          return newTicket;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to create ticket', loading: false });
          throw error;
        }
      },

      updateTicketApi: async (id, updates) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch(`/api/tickets/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
          });
          if (!response.ok) throw new Error('Failed to update ticket');
          const updatedTicket = await response.json();
          get().updateTicket(id, updatedTicket);
          set({ loading: false });
          return updatedTicket;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to update ticket', loading: false });
          throw error;
        }
      },

      deleteTicket: async (id) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch(`/api/tickets/${id}`, {
            method: 'DELETE',
          });
          if (!response.ok) throw new Error('Failed to delete ticket');
          get().removeTicket(id);
          set({ loading: false });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to delete ticket', loading: false });
          throw error;
        }
      },

      // Ticket operations
      updateStatus: async (id, status) => {
        await get().updateTicketApi(id, { status });
      },

      updatePriority: async (id, priority) => {
        await get().updateTicketApi(id, { priority });
      },

      assignToUser: async (id, userId) => {
        // Note: assignedTo field not in Ticket interface - would need to be added to backend model
      },

      addResponse: async (id, response) => {
        const ticket = get().tickets.find(t => t._id === id);
        if (ticket) {
          const updatedResponses = [...(ticket.responses || []), { 
            message: response.message, 
            user: response.user, 
            isAdmin: response.isAdmin || false, 
            createdAt: new Date() 
          }];
          await get().updateTicketApi(id, { responses: updatedResponses });
        }
      },

      closeTicket: async (id) => {
        await get().updateTicketApi(id, { status: 'closed', isActive: false });
      },

      reopenTicket: async (id) => {
        await get().updateTicketApi(id, { status: 'open', isActive: true });
      },

      // Utility actions
      getTicketsByUser: (userId: string) => {
        return get().tickets.filter(ticket => 
          (typeof ticket.user === 'string' ? ticket.user === userId : ticket.user._id === userId)
        );
      },

      getTicketsByStatus: (status: 'open' | 'in_progress' | 'resolved' | 'closed') => {
        return get().tickets.filter(ticket => ticket.status === status);
      },

      getTicketsByPriority: (priority: 'low' | 'medium' | 'high' | 'urgent') => {
        return get().tickets.filter(ticket => ticket.priority === priority);
      },

      getTicketsByCategory: (category: 'technical' | 'billing' | 'feature_request' | 'bug_report' | 'other') => {
        return get().tickets.filter(ticket => ticket.category === category);
      },

      getOpenTickets: () => {
        return get().tickets.filter(ticket => ticket.status === 'open');
      },

      getUnassignedTickets: () => {
        // Note: assignedTo field not in Ticket interface - returning all tickets for now
        return get().tickets;
      },

      getTicketStats: () => {
        const tickets = get().tickets;
        return {
          total: tickets.length,
          open: tickets.filter(t => t.status === 'open').length,
          inProgress: tickets.filter(t => t.status === 'in_progress').length,
          resolved: tickets.filter(t => t.status === 'resolved').length,
          closed: tickets.filter(t => t.status === 'closed').length,
          urgent: tickets.filter(t => t.priority === 'urgent').length,
        };
      },

      // Computed getters
      getTicketById: (id: string) => {
        return get().tickets.find(ticket => ticket._id === id);
      },

      getFilteredTickets: () => {
        const { tickets, searchTerm, statusFilter, priorityFilter, categoryFilter } = get();
        return tickets.filter(ticket => {
          const matchesSearch = searchTerm === '' || 
            ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.message.toLowerCase().includes(searchTerm.toLowerCase());
          
          const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
          const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
          const matchesCategory = categoryFilter === 'all' || ticket.category === categoryFilter;
          
          return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
        });
      },
    }),
    {
      name: 'tickets-store',
      version: STORE_VERSIONS.TICKETS,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        tickets: state.tickets,
        searchTerm: state.searchTerm,
        statusFilter: state.statusFilter,
        priorityFilter: state.priorityFilter,
        categoryFilter: state.categoryFilter,
      }),
    }
  )
);
