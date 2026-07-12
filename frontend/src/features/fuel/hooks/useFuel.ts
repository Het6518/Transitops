import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fuelApi, GetFuelParams } from '../services/fuelService';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/axios';

export function useFuelList(params?: GetFuelParams) {
  return useQuery({
    queryKey: ['fuel', 'list', params],
    queryFn: () => fuelApi.getAll(params),
  });
}

export function useFuelStats() {
  return useQuery({
    queryKey: ['fuel', 'stats'],
    queryFn: () => fuelApi.getStats(),
  });
}

export function useCreateFuelLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fuelApi.create,
    onSuccess: () => {
      toast.success('Fuel log created');
      qc.invalidateQueries({ queryKey: ['fuel'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useUpdateFuelLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      fuelApi.update(id, data),
    onSuccess: () => {
      toast.success('Fuel log updated');
      qc.invalidateQueries({ queryKey: ['fuel'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useDeleteFuelLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fuelApi.delete,
    onSuccess: () => {
      toast.success('Fuel log deleted');
      qc.invalidateQueries({ queryKey: ['fuel'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}
