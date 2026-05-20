import { useTransactionStore } from '@/store/useTransactionStore';
import type { Transaction } from '@/features/transactions/types';

interface UseTransactionsReturn {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  fetchTransactions: () => Promise<void>;
  deleteTransaction: (id: string) => Promise<string>;
  undoDelete: (id: string) => void;
}

export function useTransactions(): UseTransactionsReturn {
  const transactions = useTransactionStore((state) => state.transactions);
  const isLoading = useTransactionStore((state) => state.isLoading);
  const error = useTransactionStore((state) => state.error);
  const optimisticDeleted = useTransactionStore((state) => state.optimisticDeleted);
  const fetchTransactions = useTransactionStore((state) => state.fetchTransactions);
  const deleteTransaction = useTransactionStore((state) => state.deleteTransaction);
  const undoDelete = useTransactionStore((state) => state.undoDelete);

  const filteredTransactions = transactions.filter(
    (tx) => !optimisticDeleted.has(tx.id)
  );

  return {
    transactions: filteredTransactions,
    isLoading,
    error,
    fetchTransactions,
    deleteTransaction,
    undoDelete,
  };
}
