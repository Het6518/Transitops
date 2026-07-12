import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tripsService, GetTripsParams, Trip } from '../services/tripsService';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/axios';

export function useTrips(params: GetTripsParams) {
  return useQuery({
    queryKey: ['trips', 'list', params],
    queryFn: () => tripsService.getTrips(params),
    placeholderData: (prev) => prev,
  });
}

export function useTrip(id: string | null) {
  return useQuery({
    queryKey: ['trips', 'detail', id],
    queryFn: () => tripsService.getTripById(id!),
    enabled: !!id,
  });
}

export function useTripStatistics() {
  return useQuery({
    queryKey: ['trips', 'statistics'],
    queryFn: tripsService.getStatistics,
    staleTime: 15000,
  });
}

export function useCreateTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tripsService.createTrip,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      toast.success('Trip draft logged successfully');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useDispatchTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tripsService.dispatchTrip,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['trips', 'detail', data.id] });
      toast.success('Trip successfully dispatched!');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useCompleteTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, actualDistance }: { id: string; actualDistance?: number }) =>
      tripsService.completeTrip(id, actualDistance),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['trips', 'detail', data.id] });
      toast.success('Trip logged as completed!');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useCancelTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tripsService.cancelTrip,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['trips', 'detail', data.id] });
      toast.success('Trip successfully cancelled');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useDeleteTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tripsService.deleteTrip,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      toast.success('Trip deleted successfully');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
