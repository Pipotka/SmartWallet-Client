import { useState, useMemo, useCallback } from 'react';
import { TRANSACTION_TYPE_LABELS } from '@/features/transactions/types';
import { useTransactionEndpoints } from '@/api/queries/transaction-endpoint';
import { TransactionType } from '@/api/schemas/common';
import type { TransactionsFilterParams } from '@/api/queries/transaction';

export interface UseTransactionFiltersReturn {
  selectedType: number | null;
  setSelectedType: (type: number | null) => void;
  selectedEndpointId: string | null;
  setSelectedEndpointId: (id: string | null) => void;
  filterParams: TransactionsFilterParams;
  availableTypes: { value: string | null; label: string }[];
  availableEndpoints: { value: string | null; label: string }[];
}

export function useTransactionFilters(): UseTransactionFiltersReturn {
  const [selectedType, setSelectedTypeState] = useState<number | null>(null);
  const [selectedEndpointId, setSelectedEndpointIdState] = useState<string | null>(null);

  const { data: endpoints = [] } = useTransactionEndpoints();

  const setSelectedType = useCallback((type: number | null) => {
    setSelectedTypeState(type);
  }, []);

  const setSelectedEndpointId = useCallback((id: string | null) => {
    setSelectedEndpointIdState(id);
  }, []);

  const filterParams = useMemo<TransactionsFilterParams>(() => {
    const params: TransactionsFilterParams = {};
    if (selectedType !== null) {
      params.type = selectedType;
    }
    if (selectedEndpointId !== null) {
      params.accountId = selectedEndpointId;
    }
    return params;
  }, [selectedType, selectedEndpointId]);

  const availableTypes = useMemo(() => {
    const excludedTypes = new Set([4, 5]);
    const types = Object.entries(TRANSACTION_TYPE_LABELS)
      .filter(([value]) => !excludedTypes.has(Number(value)))
      .map(([value, label]) => ({
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

  return {
    selectedType,
    setSelectedType,
    selectedEndpointId,
    setSelectedEndpointId,
    filterParams,
    availableTypes,
    availableEndpoints,
  };
}
