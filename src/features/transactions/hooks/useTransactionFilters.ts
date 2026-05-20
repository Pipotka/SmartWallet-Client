import { useState, useMemo, useCallback } from 'react';
import type { Transaction, TransactionType } from '@/features/transactions/types';
import { TRANSACTION_TYPE_LABELS } from '@/features/transactions/types';
import { useWalletStore } from '@/store/useWalletStore';

interface UseTransactionFiltersReturn {
  selectedType: TransactionType | null;
  setSelectedType: (type: TransactionType | null) => void;
  selectedEndpointId: string | null;
  setSelectedEndpointId: (id: string | null) => void;
  filteredTransactions: Transaction[];
  availableTypes: { value: string | null; label: string }[];
  availableEndpoints: { value: string | null; label: string }[];
}

export function useTransactionFilters(
  transactions: Transaction[]
): UseTransactionFiltersReturn {
  const [selectedType, setSelectedTypeState] = useState<TransactionType | null>(null);
  const [selectedEndpointId, setSelectedEndpointIdState] = useState<string | null>(null);

  const endpoints = useWalletStore((state) => state.endpoints);

  const setSelectedType = useCallback((type: TransactionType | null) => {
    setSelectedTypeState(type);
  }, []);

  const setSelectedEndpointId = useCallback((id: string | null) => {
    setSelectedEndpointIdState(id);
  }, []);

  const availableTypes = useMemo(() => {
    const types = Object.entries(TRANSACTION_TYPE_LABELS).map(([value, label]) => ({
      value,
      label,
    }));
    return [{ value: null, label: 'Все' }, ...types];
  }, []);

  const availableEndpoints = useMemo(() => {
    const endpointOptions = endpoints.map((ep) => ({
      value: ep.id,
      label: ep.name,
    }));
    return [{ value: null, label: 'Все' }, ...endpointOptions];
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
