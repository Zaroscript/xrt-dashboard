import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Project } from '../types';
import { STORE_VERSIONS } from '../types';

interface ProjectsState {
  projects: Project[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
  statusFilter: 'all' | 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priorityFilter: 'all' | 'low' | 'medium' | 'high' | 'urgent';
  selectedProject: Project | null;
}

interface ProjectsActions {
  // State management
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  removeProject: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setSearchTerm: (term: string) => void;
  setStatusFilter: (filter: 'all' | 'pending' | 'in_progress' | 'completed' | 'cancelled') => void;
  setPriorityFilter: (filter: 'all' | 'low' | 'medium' | 'high' | 'urgent') => void;
  setSelectedProject: (project: Project | null) => void;
  
  // API actions
  fetchProjects: () => Promise<void>;
  fetchProject: (id: string) => Promise<Project>;
  createProject: (projectData: Omit<Project, '_id' | 'createdAt' | 'updatedAt'>) => Promise<Project>;
  updateProjectApi: (id: string, updates: Partial<Project>) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
  
  // Project operations
  updateStatus: (id: string, status: 'pending' | 'in_progress' | 'completed' | 'cancelled') => Promise<void>;
  updatePriority: (id: string, priority: 'low' | 'medium' | 'high' | 'urgent') => Promise<void>;
  assignTeam: (id: string, teamMembers: string[]) => Promise<void>;
  updateProgress: (id: string, progress: number) => Promise<void>;
  addMilestone: (id: string, milestone: any) => Promise<void>;
  updateBudget: (id: string, budget: number) => Promise<void>;
  completeProject: (id: string) => Promise<void>;
  cancelProject: (id: string, reason?: string) => Promise<void>;
  
  // Utility actions
  getProjectsByUser: (userId: string) => Project[];
  getProjectsByStatus: (status: 'pending' | 'in_progress' | 'completed' | 'cancelled') => Project[];
  getProjectsByCategory: (category: string) => Project[];
  getActiveProjects: () => Project[];
  getCompletedProjects: () => Project[];
  getFeaturedProjects: () => Project[];
  getProjectStats: () => {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    cancelled: number;
    featured: number;
  };
  
  // Computed getters
  getProjectById: (id: string) => Project | undefined;
  getFilteredProjects: () => Project[];
}

export type ProjectsStore = ProjectsState & ProjectsActions;

export const useProjectsStore = create<ProjectsStore>()(
  persist(
    (set, get) => ({
      // Initial state
      projects: [],
      loading: false,
      error: null,
      searchTerm: '',
      statusFilter: 'all',
      priorityFilter: 'all',
      selectedProject: null,

      // State management actions
      setProjects: (projects) => set({ projects }),
      
      addProject: (project) => 
        set((state) => ({ 
          projects: [...state.projects, project] 
        })),

      updateProject: (id, updates) =>
        set((state) => ({
          projects: state.projects.map((project) =>
            project._id === id ? { ...project, ...updates } : project
          ),
        })),

      removeProject: (id) =>
        set((state) => ({
          projects: state.projects.filter((project) => project._id !== id),
        })),

      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
      setSearchTerm: (searchTerm) => set({ searchTerm }),
      setStatusFilter: (statusFilter) => set({ statusFilter }),
      setPriorityFilter: (priorityFilter) => set({ priorityFilter }),
      setSelectedProject: (selectedProject) => set({ selectedProject }),

      // API actions
      fetchProjects: async () => {
        set({ loading: true, error: null });
        try {
          const response = await fetch('/api/projects');
          if (!response.ok) throw new Error('Failed to fetch projects');
          const data = await response.json();
          set({ projects: data, loading: false });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to fetch projects', loading: false });
        }
      },

      fetchProject: async (id: string) => {
        try {
          const response = await fetch(`/api/projects/${id}`);
          if (!response.ok) throw new Error('Failed to fetch project');
          return await response.json();
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to fetch project' });
          throw error;
        }
      },

      createProject: async (projectData) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch('/api/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(projectData),
          });
          if (!response.ok) throw new Error('Failed to create project');
          const newProject = await response.json();
          set((state) => ({ projects: [...state.projects, newProject], loading: false }));
          return newProject;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to create project', loading: false });
          throw error;
        }
      },

      updateProjectApi: async (id, updates) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch(`/api/projects/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
          });
          if (!response.ok) throw new Error('Failed to update project');
          const updatedProject = await response.json();
          get().updateProject(id, updatedProject);
          set({ loading: false });
          return updatedProject;
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to update project', loading: false });
          throw error;
        }
      },

      deleteProject: async (id) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch(`/api/projects/${id}`, {
            method: 'DELETE',
          });
          if (!response.ok) throw new Error('Failed to delete project');
          get().removeProject(id);
          set({ loading: false });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to delete project', loading: false });
          throw error;
        }
      },

      // Project operations
      updateStatus: async (id, status) => {
        await get().updateProjectApi(id, { status });
      },

      updatePriority: async (id, priority) => {
        // Note: priority field not in Project interface - would need backend model update
        console.log('updatePriority functionality requires backend model update');
      },

      assignTeam: async (id, teamMembers) => {
        // Note: team field not in Project interface - would need backend model update
        console.log('assignTeam functionality requires backend model update');
      },

      updateProgress: async (id, progress) => {
        // Note: progress field not in Project interface - would need backend model update
        console.log('updateProgress functionality requires backend model update');
      },

      addMilestone: async (id, milestone) => {
        // Note: milestones field not in Project interface - would need backend model update
        console.log('addMilestone functionality requires backend model update');
      },

      updateBudget: async (id, budget) => {
        // Note: budget field not in Project interface - would need backend model update
        console.log('updateBudget functionality requires backend model update');
      },

      completeProject: async (id) => {
        await get().updateProjectApi(id, { status: 'completed' });
      },

      cancelProject: async (id, reason) => {
        // Note: cancellationReason field not in Project interface - would need backend model update
        await get().updateProjectApi(id, { status: 'cancelled' });
      },

      // Utility actions
      getProjectsByUser: (userId: string) => {
        return get().projects.filter(project => 
          (typeof project.user === 'string' ? project.user === userId : project.user._id === userId)
        );
      },

      getProjectsByStatus: (status: 'pending' | 'in_progress' | 'completed' | 'cancelled') => {
        return get().projects.filter(project => project.status === status);
      },

      getProjectsByCategory: (category: string) => {
        return get().projects.filter(project => project.category === category);
      },

      getActiveProjects: () => {
        return get().projects.filter(project => 
          ['pending', 'in_progress'].includes(project.status)
        );
      },

      getCompletedProjects: () => {
        return get().projects.filter(project => project.status === 'completed');
      },

      getFeaturedProjects: () => {
        return get().projects.filter(project => project.isFeatured);
      },

      getProjectStats: () => {
        const projects = get().projects;
        return {
          total: projects.length,
          pending: projects.filter(p => p.status === 'pending').length,
          inProgress: projects.filter(p => p.status === 'in_progress').length,
          completed: projects.filter(p => p.status === 'completed').length,
          cancelled: projects.filter(p => p.status === 'cancelled').length,
          featured: projects.filter(p => p.isFeatured).length,
        };
      },

      // Computed getters
      getProjectById: (id: string) => {
        return get().projects.find(project => project._id === id);
      },

      getFilteredProjects: () => {
        const { projects, searchTerm, statusFilter, priorityFilter } = get();
        return projects.filter(project => {
          const matchesSearch = searchTerm === '' || 
            project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (typeof project.user === 'string' ? project.user : project.user.email)
              .toLowerCase().includes(searchTerm.toLowerCase());
          
          const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
          const matchesPriority = priorityFilter === 'all' || true; // priority field not in Project interface
          
          return matchesSearch && matchesStatus && matchesPriority;
        });
      },
    }),
    {
      name: 'projects-store',
      version: STORE_VERSIONS.PROJECTS,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        projects: state.projects,
        searchTerm: state.searchTerm,
        statusFilter: state.statusFilter,
        priorityFilter: state.priorityFilter,
      }),
    }
  )
);
