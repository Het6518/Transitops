import { useQuery } from '@tanstack/react-query';
import { dashboardService, DashboardSummary } from '../services/dashboardService';

export function useDashboard() {
  const query = useQuery<DashboardSummary>({
    queryKey: ['dashboard', 'summary'],
    queryFn: dashboardService.getSummary,
    refetchInterval: 30_000, // auto-refresh every 30 seconds
    staleTime: 10_000,
  });

  return {
    dashboardData: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isFetching: query.isFetching,
  };
}
