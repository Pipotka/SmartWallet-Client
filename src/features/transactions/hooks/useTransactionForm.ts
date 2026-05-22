import { useState, useMemo, useCallback } from 'react';
import type { TransactionType } from '@/features/transactions/types';
import { getTransactionType, validateTransaction } from '@/features/transactions/utils';
import { useWalletStore } from '@/store/useWalletStore';

interface UseTransactionFormReturn {
  sourceId: string | null;
  setSourceId: (id: string | null) => void;
  destinationId: string | null;
  setDestinationId: (id: string | null) => void;
  amount: string;
  setAmount: (value: string) => void;
  availableSources: { value: string | null; label: string; isSpecial?: boolean }[];
  availableDestinations: { value: string; label: string }[];
  predictedType: TransactionType | null;
  isValid: boolean;
  errors: { source?: string; destination?: string; amount?: string };
  markTouched: (field: 'source' | 'destination' | 'amount') => void;
  markAllTouched: () => void;
}

export function useTransactionForm(): UseTransactionFormReturn {
  const [sourceId, setSourceId] = useState<string | null>(null);
  const [destinationId, setDestinationId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [touched, setTouched] = useState<{
    source: boolean;
    destination: boolean;
    amount: boolean;
  }>({ source: false, destination: false, amount: false });

  const endpoints = useWalletStore((s) => s.endpoints);
  const wallets = useMemo(() => endpoints.filter(e => e.isStorage), [endpoints]);
  const categories = useMemo(() => endpoints.filter(e => !e.isStorage), [endpoints]);

  const availableSources = useMemo(() => {
    const walletOptions = wallets.map((w) => ({
      value: w.id,
      label: w.name,
    }));
    return [
      { value: null, label: 'Без источника', isSpecial: true },
      ...walletOptions,
    ];
  }, [wallets]);

  const availableDestinations = useMemo(() => {
    if (sourceId === null) {
      return wallets.map((w) => ({
        value: w.id,
        label: w.name,
      }));
    }

    const categoryOptions = categories.map((c) => ({
      value: c.id,
      label: c.name,
    }));
    const walletOptions = wallets.map((w) => ({
      value: w.id,
      label: w.name,
    }));
    return [...categoryOptions, ...walletOptions];
  }, [sourceId, wallets, categories]);

  const predictedType = useMemo(() => {
    return getTransactionType(sourceId, destinationId, wallets, categories);
  }, [sourceId, destinationId, wallets, categories]);

  const errors = useMemo(() => {
    const allErrors = validateTransaction(sourceId, destinationId, amount, wallets, categories);
    const visibleErrors: typeof allErrors = {};
    if (touched.source && allErrors.source) visibleErrors.source = allErrors.source;
    if (touched.destination && allErrors.destination) visibleErrors.destination = allErrors.destination;
    if (touched.amount && allErrors.amount) visibleErrors.amount = allErrors.amount;
    return visibleErrors;
  }, [sourceId, destinationId, amount, wallets, categories, touched]);

  const isValid = Object.values(errors).every((err) => !err);

  const markTouched = useCallback((field: 'source' | 'destination' | 'amount') => {
    setTouched(prev => ({ ...prev, [field]: true }));
  }, []);

  const markAllTouched = useCallback(() => {
    setTouched({ source: true, destination: true, amount: true });
  }, []);

  const handleSetSourceId = useCallback((id: string | null) => {
    setSourceId(id);
    setDestinationId(null);
  }, []);

  return {
    sourceId,
    setSourceId: handleSetSourceId,
    destinationId,
    setDestinationId,
    amount,
    setAmount,
    availableSources,
    availableDestinations,
    predictedType,
    isValid,
    errors,
    markTouched,
    markAllTouched,
  };
}
