import { useMemo } from 'react';
import { useTransactions as useTransactionsQuery, useDeleteTransaction } from '@/api/queries/transaction';
import { useTransactionStore } from '@/store/useTransactionStore';
import type { Transaction } from '@/features/transactions/types';

interface UseTransactionsReturn {
  transactions: Transaction[];
  isLoading: boolean;
  error: Error | null;
  deleteTransaction: (id: string) => Promise<void>;
  undoDelete: (id: string) => void;
}

export function useTransactions(): UseTransactionsReturn {
  const { data: transactions = [], isLoading, error } = useTransactionsQuery();
  const deleteMutation = useDeleteTransaction();
  const optimisticDeleted = useTransactionStore((state) => state.optimisticDeleted);
  const undoDelete = useTransactionStore((state) => state.undoDelete);

  const filteredTransactions = useMemo(
    () => transactions.filter((tx) => !optimisticDeleted.has(tx.id)),
    [transactions, optimisticDeleted]
  );

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync({ id });
  };

  return {
    transactions: filteredTransactions,
    isLoading,
    error,
    deleteTransaction: handleDelete,
    undoDelete,
  };
}
