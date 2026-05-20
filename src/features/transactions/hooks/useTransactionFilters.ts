import { useState, useMemo } from 'react';
import type { Transaction, TransactionType } from '@/features/transactions/types';
import { TRANSACTION_TYPE_LABELS } from '@/features/transactions/types';
import { useWalletStore } from '@/store/useWalletStore';

interface UseTransactionFiltersReturn {
  selectedType: TransactionType | null;
  setSelectedType: (type: TransactionType | null) => void;
  selectedEndpointId: string | null;
  setSelectedEndpointId: (id: string | null) => void;
  filteredTransactions: Transaction[];
  availableTypes: { value: string; label: string }[];
  availableEndpoints: { value: string; label: string }[];
}

export function useTransactionFilters(
  transactions: Transaction[]
): UseTransactionFiltersReturn {
  const [selectedType, setSelectedType] = useState<TransactionType | null>(null);
  const [selectedEndpointId, setSelectedEndpointId] = useState<string | null>(null);

  const endpoints = useWalletStore((state) => state.endpoints);

  const availableTypes = useMemo(() => {
    const types = Object.entries(TRANSACTION_TYPE_LABELS).map(([value, label]) => ({
      value,
      label,
    }));
    return [{ value: '', label: 'Все' }, ...types];
  }, []);

  const availableEndpoints = useMemo(() => {
    const endpointOptions = endpoints.map((ep) => ({
      value: ep.id,
      label: ep.name,
    }));
    return [{ value: '', label: 'Все' }, ...endpointOptions];
  }, [endpoints]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (selectedType !== null && tx.type !== selectedType) {
        return false;
      }
      if (
        selectedEndpointId !== null &&
        tx.sourceId !== selectedEndpointId &&
        tx.destinationId !== selectedEndpointId
      ) {
        return false;
      }
      return true;
    });
  }, [transactions, selectedType, selectedEndpointId]);

  return {
    selectedType,
    setSelectedType,
    selectedEndpointId,
    setSelectedEndpointId,
    filteredTransactions,
    availableTypes,
    availableEndpoints,
  };
}
