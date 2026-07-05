import { create } from 'zustand';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  employeeId: string;
  role: 'Admin' | 'Super Admin';
  status: 'Active' | 'Inactive';
  lastLogin: string;
  organizationId?: string;
  organizationName?: string;
}

export interface Organization {
  id: string;
  name: string;
  code: string;
  domain: string;
  adminEmail: string;
  status: 'Active' | 'Inactive';
  plan: 'Enterprise' | 'Pro' | 'Basic';
  studentsCount: number;
  createdAt: string;
}

interface SuperAdminState {
  admins: AdminUser[];
  organizations: Organization[];
  isLoading: boolean;

  fetchAdmins: () => Promise<void>;
  addAdmin: (admin: Omit<AdminUser, 'id' | 'lastLogin'>) => Promise<void>;
  updateAdmin: (id: string, admin: Partial<AdminUser>) => Promise<void>;
  deleteAdmin: (id: string) => Promise<void>;

  fetchOrganizations: () => Promise<void>;
  addOrganization: (org: Omit<Organization, 'id' | 'createdAt' | 'studentsCount'>) => Promise<void>;
  updateOrganization: (id: string, org: Partial<Organization>) => Promise<void>;
  deleteOrganization: (id: string) => Promise<void>;
}

export const useSuperAdminStore = create<SuperAdminState>()((set, get) => ({
  admins: [],
  organizations: [],
  isLoading: false,

  // Admins
  fetchAdmins: async () => {
    set({ isLoading: true });
    const { data } = await api.get('/admins');
    set({ admins: data, isLoading: false });
  },
  addAdmin: async (adminData) => {
    set({ isLoading: true });
    try {
      const payload = { ...adminData, frontendUrl: window.location.origin };
      const { data } = await api.post('/admins', payload);
      set((state) => ({ admins: [data, ...state.admins], isLoading: false }));
      toast.success('Admin Added Successfully');
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
  updateAdmin: async (id, data) => {
    set({ isLoading: true });
    try {
      const { data: updated } = await api.patch(`/admins/${id}`, data);
      set((state) => ({
        admins: state.admins.map((a) => (a.id === id ? updated : a)),
        isLoading: false,
      }));
      toast.success('Admin Updated Successfully');
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
  deleteAdmin: async (id) => {
    set({ isLoading: true });
    await api.delete(`/admins/${id}`);
    set((state) => ({
      admins: state.admins.filter((a) => a.id !== id),
      isLoading: false,
    }));
    toast.success('Admin Deleted Successfully');
  },

  // Organizations
  fetchOrganizations: async () => {
    set({ isLoading: true });
    const { data } = await api.get('/organizations');
    set({ organizations: data, isLoading: false });
  },
  addOrganization: async (orgData) => {
    set({ isLoading: true });
    try {
      const payload = { ...orgData, frontendUrl: window.location.origin };
      const { data } = await api.post('/organizations', payload);
      set((state) => ({ organizations: [data, ...state.organizations], isLoading: false }));
      toast.success('Organization Added Successfully');
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
  updateOrganization: async (id, data) => {
    set({ isLoading: true });
    const { data: updated } = await api.patch(`/organizations/${id}`, data);
    set((state) => ({
      organizations: state.organizations.map((o) => (o.id === id ? updated : o)),
      isLoading: false,
    }));
    toast.success('Organization Updated Successfully');
  },
  deleteOrganization: async (id) => {
    set({ isLoading: true });
    await api.delete(`/organizations/${id}`);
    set((state) => ({
      organizations: state.organizations.filter((o) => o.id !== id),
      isLoading: false,
    }));
    toast.success('Organization Deleted Successfully');
  },
}));
