import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import {
  TransactionEndpointListSchema,
  TransactionEndpointApiModelSchema,
  type CreateTransactionEndpointApiModel,
  type UpdateTransactionEndpointApiModel,
  type DeleteTransactionEndpointApiModel,
} from '@/api/schemas/transaction-endpoint';

export function useTransactionEndpoints() {
  return useQuery({
    queryKey: ['transaction-endpoints'],
    queryFn: ({ signal }) =>
      apiClient<unknown>('/api/transaction-endpoints/list', 'GET', { signal }),
    select: (data) => TransactionEndpointListSchema.parse(data),
  });
}

export function useCreateTransactionEndpoint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateTransactionEndpointApiModel) => {
      const data = await apiClient<unknown>('/api/transaction-endpoints', 'POST', { body });
      return TransactionEndpointApiModelSchema.parse(data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['transaction-endpoints'] });
    },
  });
}

export function useUpdateTransactionEndpoint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: UpdateTransactionEndpointApiModel) => {
      const data = await apiClient<unknown>('/api/transaction-endpoints', 'PUT', { body });
      return TransactionEndpointApiModelSchema.parse(data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['transaction-endpoints'] });
    },
  });
}

export function useDeleteTransactionEndpoint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: DeleteTransactionEndpointApiModel) =>
      apiClient<unknown>('/api/transaction-endpoints', 'DELETE', { body }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['transaction-endpoints'] });
    },
  });
}
