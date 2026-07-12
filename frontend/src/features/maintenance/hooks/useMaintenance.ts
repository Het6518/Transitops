import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { maintenanceApi, GetMaintenanceParams } from '../services/maintenanceService';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/axios';

export function useMaintenanceList(params?: GetMaintenanceParams) {
  return useQuery({
    queryKey: ['maintenance', 'list', params],
    queryFn: () => maintenanceApi.getAll(params),
  });
}

export function useMaintenanceStats() {
  return useQuery({
    queryKey: ['maintenance', 'stats'],
    queryFn: () => maintenanceApi.getStats(),
  });
}

export function useCreateMaintenance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: maintenanceApi.create,
    onSuccess: () => {
      toast.success('Maintenance record created successfully');
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateMaintenance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof maintenanceApi.update>[1] }) =>
      maintenanceApi.update(id, data),
    onSuccess: () => {
      toast.success('Maintenance record updated successfully');
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useCompleteMaintenance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: maintenanceApi.complete,
    onSuccess: () => {
      toast.success('Maintenance marked as completed');
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteMaintenance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: maintenanceApi.delete,
    onSuccess: () => {
      toast.success('Maintenance record deleted');
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
