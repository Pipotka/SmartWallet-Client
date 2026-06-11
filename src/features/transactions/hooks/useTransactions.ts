import { useMemo } from 'react';
import { useTransactionsInfinite, useDeleteTransaction } from '@/api/queries/transaction';
import type { TransactionsFilterParams } from '@/api/queries/transaction';
import { useTransactionStore } from '@/store/useTransactionStore';
import type { Transaction } from '@/features/transactions/types';

interface UseTransactionsReturn {
  transactions: Transaction[];
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isLoading: boolean;
  error: Error | null;
  deleteTransaction: (id: string) => Promise<void>;
  undoDelete: (id: string) => void;
}

export function useTransactions(filterParams: TransactionsFilterParams = {}): UseTransactionsReturn {
  const infiniteQuery = useTransactionsInfinite(filterParams);
  const deleteMutation = useDeleteTransaction();
  const optimisticDeleted = useTransactionStore((state) => state.optimisticDeleted);
  const undoDelete = useTransactionStore((state) => state.undoDelete);

  const transactions = useMemo(() => {
    if (!infiniteQuery.data?.pages) return [];

    const allItems = infiniteQuery.data.pages.flatMap((page) => page.items);
    return allItems.filter((tx) => !optimisticDeleted.has(tx.id));
  }, [infiniteQuery.data, optimisticDeleted]);

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync({ id });
  };

  return {
    transactions,
    fetchNextPage: infiniteQuery.fetchNextPage,
    hasNextPage: infiniteQuery.hasNextPage ?? false,
    isFetchingNextPage: infiniteQuery.isFetchingNextPage,
    isLoading: infiniteQuery.isLoading,
    error: infiniteQuery.error,
    deleteTransaction: handleDelete,
    undoDelete,
  };
}
