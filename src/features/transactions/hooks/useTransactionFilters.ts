import { useState, useMemo, useCallback } from 'react';
import type { Transaction } from '@/features/transactions/types';
import { TRANSACTION_TYPE_LABELS } from '@/features/transactions/types';
import { useTransactionEndpoints } from '@/api/queries/transaction-endpoint';
import { TransactionType } from '@/api/schemas/common';

export interface UseTransactionFiltersReturn {
  selectedType: number | null;
  setSelectedType: (type: number | null) => void;
  selectedEndpointId: string | null;
  setSelectedEndpointId: (id: string | null) => void;
  filteredTransactions: Transaction[];
  availableTypes: { value: string | null; label: string }[];
  availableEndpoints: { value: string | null; label: string }[];
}

export function useTransactionFilters(
  transactions: Transaction[]
): UseTransactionFiltersReturn {
  const [selectedType, setSelectedTypeState] = useState<number | null>(null);
  const [selectedEndpointId, setSelectedEndpointIdState] = useState<string | null>(null);

  const { data: endpoints = [] } = useTransactionEndpoints();

  const setSelectedType = useCallback((type: number | null) => {
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
    const walletsOnlyTypes: number[] = [
      TransactionType.Transfer,
      TransactionType.AdjustmentIncrease,
      TransactionType.Income,
    ];
    const isWalletsOnly = selectedType !== null && walletsOnlyTypes.includes(selectedType);

    const filteredEndpoints = isWalletsOnly
      ? endpoints.filter((ep) => ep.isStorage)
      : endpoints;

    const endpointOptions = filteredEndpoints.map((ep) => ({
      value: ep.id,
      label: ep.name ?? '',
    }));
    return [{ value: null, label: 'Все' }, ...endpointOptions];
  }, [endpoints, selectedType]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (selectedType !== null && tx.type !== selectedType) {
        return false;
      }
      if (
        selectedEndpointId !== null &&
        tx.sourceAccountId !== selectedEndpointId &&
        tx.destinationAccountId !== selectedEndpointId
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
