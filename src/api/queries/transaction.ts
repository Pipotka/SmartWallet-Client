import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import {
  TransactionListSchema,
  TransactionApiModelSchema,
  type CreateTransactionApiModel,
  type DeleteTransactionApiModel,
} from '@/api/schemas/transaction';

export function useTransactions() {
  return useQuery({
    queryKey: ['transactions'],
    queryFn: ({ signal }) =>
      apiClient<unknown>('/api/transactions/list', 'GET', { signal }),
    select: (data) => TransactionListSchema.parse(data),
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateTransactionApiModel) => {
      const data = await apiClient<unknown>('/api/transactions', 'POST', { body });
      return TransactionApiModelSchema.parse(data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['transactions'] });
      void queryClient.invalidateQueries({ queryKey: ['transaction-endpoints'] });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: DeleteTransactionApiModel) =>
      apiClient<unknown>('/api/transactions', 'DELETE', { body }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['transactions'] });
      void queryClient.invalidateQueries({ queryKey: ['transaction-endpoints'] });
    },
  });
}
