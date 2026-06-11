import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import {
  TransactionListSchema,
  TransactionPagedResultSchema,
  TransactionApiModelSchema,
  type CreateTransactionApiModel,
  type DeleteTransactionApiModel,
} from '@/api/schemas/transaction';

const TRANSACTIONS_PAGE_SIZE = 20;

export interface TransactionsFilterParams {
  type?: number;
  accountId?: string;
}

export function useTransactionsInfinite(params: TransactionsFilterParams = {}) {
  return useInfiniteQuery({
    queryKey: ['transactions', params],
    queryFn: ({ signal, pageParam }) => {
      const searchParams = new URLSearchParams();
      searchParams.set('Page', String(pageParam));
      searchParams.set('PageSize', String(TRANSACTIONS_PAGE_SIZE));
      if (params.type !== undefined) {
        searchParams.set('Type', String(params.type));
      }
      if (params.accountId !== undefined) {
        searchParams.set('AccountId', params.accountId);
      }
      const url = `/api/transactions?${searchParams.toString()}`;
      return apiClient<unknown>(url, 'GET', { signal });
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage: unknown) => {
      const parsed = TransactionPagedResultSchema.parse(lastPage);
      if (parsed.page < parsed.totalPages) {
        return parsed.page + 1;
      }
      return undefined;
    },
    select: (data) => ({
      pages: data.pages.map((page) => TransactionPagedResultSchema.parse(page)),
      pageParams: data.pageParams,
    }),
  });
}

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
