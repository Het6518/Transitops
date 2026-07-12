import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fleetService, GetVehiclesParams, Vehicle } from '../services/fleetService';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/axios';

export function useVehicles(params: GetVehiclesParams) {
  return useQuery({
    queryKey: ['vehicles', 'list', params],
    queryFn: () => fleetService.getVehicles(params),
    placeholderData: (prev) => prev,
  });
}

export function useVehicle(id: string | null) {
  return useQuery({
    queryKey: ['vehicles', 'detail', id],
    queryFn: () => fleetService.getVehicleById(id!),
    enabled: !!id,
  });
}

export function useCreateVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: fleetService.createVehicle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Vehicle registered successfully');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useUpdateVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>> }) =>
      fleetService.updateVehicle(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles', 'detail', data.id] });
      toast.success('Vehicle updated successfully');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useDeleteVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: fleetService.deleteVehicle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Vehicle deleted successfully');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
