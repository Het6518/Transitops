import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '../services/settingsService';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/axios';

export function useSettingsUsers() {
  return useQuery({
    queryKey: ['settings', 'users'],
    queryFn: settingsApi.getUsers,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: settingsApi.createUser,
    onSuccess: () => {
      toast.success('User created successfully');
      qc.invalidateQueries({ queryKey: ['settings', 'users'] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof settingsApi.updateUser>[1] }) =>
      settingsApi.updateUser(id, data),
    onSuccess: () => {
      toast.success('User updated successfully');
      qc.invalidateQueries({ queryKey: ['settings', 'users'] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: settingsApi.deleteUser,
    onSuccess: () => {
      toast.success('User deleted successfully');
      qc.invalidateQueries({ queryKey: ['settings', 'users'] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useSettingsRoles() {
  return useQuery({
    queryKey: ['settings', 'roles'],
    queryFn: settingsApi.getRoles,
  });
}

export function useSettingsPermissions() {
  return useQuery({
    queryKey: ['settings', 'permissions'],
    queryFn: settingsApi.getPermissions,
  });
}

export function useUpdateRolePermissions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ roleId, permissionIds }: { roleId: string; permissionIds: string[] }) =>
      settingsApi.updateRolePermissions(roleId, permissionIds),
    onSuccess: () => {
      toast.success('Role permissions updated successfully');
      qc.invalidateQueries({ queryKey: ['settings', 'roles'] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useSettingsAuditLogs(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['settings', 'audit', page, limit],
    queryFn: () => settingsApi.getAuditLogs(page, limit),
  });
}
