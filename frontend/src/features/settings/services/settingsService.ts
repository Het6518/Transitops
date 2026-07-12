import api from '@/lib/axios';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  phone: string | null;
  timezone: string;
  roleId: string | null;
  createdAt: string;
  roleRelation?: {
    id: string;
    name: string;
    description: string | null;
  } | null;
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
  rolePermissions: {
    permission: {
      id: string;
      name: string;
      displayName: string;
      module: string;
    }
  }[];
}

export interface Permission {
  id: string;
  name: string;
  displayName: string;
  module: string;
}

export interface AuditLog {
  id: string;
  action: string;
  module: string;
  entityId: string | null;
  entityType: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const settingsApi = {
  getUsers: async () => {
    const { data } = await api.get('/users');
    return data.data as User[];
  },

  createUser: async (payload: Partial<User> & { password?: string }) => {
    const { data } = await api.post('/users', payload);
    return data.data as User;
  },

  updateUser: async (id: string, payload: Partial<User> & { password?: string }) => {
    const { data } = await api.put(`/users/${id}`, payload);
    return data.data as User;
  },

  deleteUser: async (id: string) => {
    await api.delete(`/users/${id}`);
    return true;
  },

  getRoles: async () => {
    const { data } = await api.get('/roles');
    return data.data as Role[];
  },

  getPermissions: async () => {
    const { data } = await api.get('/roles/permissions');
    return data.data as Permission[];
  },

  updateRolePermissions: async (roleId: string, permissionIds: string[]) => {
    await api.put(`/roles/${roleId}/permissions`, { permissionIds });
    return true;
  },

  getAuditLogs: async (page = 1, limit = 20) => {
    const { data } = await api.get(`/audit?page=${page}&limit=${limit}`);
    return data as PaginatedResponse<AuditLog>;
  }
};
