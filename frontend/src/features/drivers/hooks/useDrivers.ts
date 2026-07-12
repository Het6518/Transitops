import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { driversService, GetDriversParams, Driver, UpdateDriverInput, CreateDriverInput } from '../services/driversService';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/axios';

const QUERY_KEY = 'drivers';

export function useDrivers(params: GetDriversParams) {
  return useQuery({
    queryKey: [QUERY_KEY, 'list', params],
    queryFn: () => driversService.getDrivers(params),
    placeholderData: (prev) => prev,
  });
}

export function useDriver(id: string | null) {
  return useQuery({
    queryKey: [QUERY_KEY, 'detail', id],
    queryFn: () => driversService.getDriverById(id!),
    enabled: !!id,
  });
}

export function useAvailableDrivers() {
  return useQuery({
    queryKey: [QUERY_KEY, 'available'],
    queryFn: driversService.getAvailableDrivers,
  });
}

export function useDriverStatistics() {
  return useQuery({
    queryKey: [QUERY_KEY, 'statistics'],
    queryFn: driversService.getStatistics,
    staleTime: 30_000,
  });
}

export function useCreateDriver() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDriverInput) => driversService.createDriver(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Driver registered successfully');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateDriver() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDriverInput }) =>
      driversService.updateDriver(id, data),
    onSuccess: (driver) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.setQueryData([QUERY_KEY, 'detail', driver.id], driver);
      toast.success('Driver updated successfully');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteDriver() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => driversService.deleteDriver(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Driver removed successfully');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
