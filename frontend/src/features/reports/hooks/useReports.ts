import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '../services/reportsService';

export function useReportsOverview() {
  return useQuery({
    queryKey: ['reports', 'overview'],
    queryFn: reportsApi.getOverview,
  });
}

export function useReportsFleet() {
  return useQuery({
    queryKey: ['reports', 'fleet'],
    queryFn: reportsApi.getFleet,
  });
}

export function useReportsExpenses() {
  return useQuery({
    queryKey: ['reports', 'expenses'],
    queryFn: reportsApi.getExpenses,
  });
}

export function useReportsFuel() {
  return useQuery({
    queryKey: ['reports', 'fuel'],
    queryFn: reportsApi.getFuel,
  });
}

export function useReportsDrivers() {
  return useQuery({
    queryKey: ['reports', 'drivers'],
    queryFn: reportsApi.getDrivers,
  });
}

export function useReportsTrips() {
  return useQuery({
    queryKey: ['reports', 'trips'],
    queryFn: reportsApi.getTrips,
  });
}
