import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expenseApi, GetExpenseParams } from '../services/expenseService';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/axios';

export function useExpenseList(params?: GetExpenseParams) {
  return useQuery({
    queryKey: ['expenses', 'list', params],
    queryFn: () => expenseApi.getAll(params),
  });
}

export function useExpenseStats() {
  return useQuery({
    queryKey: ['expenses', 'stats'],
    queryFn: () => expenseApi.getStats(),
  });
}

export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: expenseApi.create,
    onSuccess: () => {
      toast.success('Expense created');
      qc.invalidateQueries({ queryKey: ['expenses'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useUpdateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      expenseApi.update(id, data),
    onSuccess: () => {
      toast.success('Expense updated');
      qc.invalidateQueries({ queryKey: ['expenses'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: expenseApi.delete,
    onSuccess: () => {
      toast.success('Expense deleted');
      qc.invalidateQueries({ queryKey: ['expenses'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}
