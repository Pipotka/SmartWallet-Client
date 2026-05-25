import { useState, useMemo, useCallback } from 'react';
import { getTransactionType, validateTransaction } from '@/features/transactions/utils';
import { useTransactionEndpoints } from '@/api/queries/transaction-endpoint';

interface UseTransactionFormReturn {
  sourceAccountId: string | null;
  setSourceAccountId: (id: string | null) => void;
  destinationAccountId: string | null;
  setDestinationAccountId: (id: string | null) => void;
  amount: string;
  setAmount: (value: string) => void;
  availableSources: { value: string | null; label: string; isSpecial?: boolean }[];
  availableDestinations: { value: string; label: string }[];
  predictedType: number | null;
  isValid: boolean;
  errors: { source?: string; destination?: string; amount?: string };
  markTouched: (field: 'source' | 'destination' | 'amount') => void;
  markAllTouched: () => void;
}

export function useTransactionForm(): UseTransactionFormReturn {
  const [sourceAccountId, setSourceAccountId] = useState<string | null>(null);
  const [destinationAccountId, setDestinationAccountId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [touched, setTouched] = useState<{
    source: boolean;
    destination: boolean;
    amount: boolean;
  }>({ source: false, destination: false, amount: false });

  const { data: endpoints = [] } = useTransactionEndpoints();
  const wallets = useMemo(() => endpoints.filter(e => e.isStorage), [endpoints]);
  const categories = useMemo(() => endpoints.filter(e => !e.isStorage), [endpoints]);

  const availableSources = useMemo(() => {
    const walletOptions = wallets.map((w) => ({
      value: w.id,
      label: w.name ?? '',
    }));
    return [
      { value: null, label: 'Без источника', isSpecial: true },
      ...walletOptions,
    ];
  }, [wallets]);

  const availableDestinations = useMemo(() => {
    if (sourceAccountId === null) {
      return wallets.map((w) => ({
        value: w.id,
        label: w.name ?? '',
      }));
    }

    const categoryOptions = categories.map((c) => ({
      value: c.id,
      label: c.name ?? '',
    }));
    const walletOptions = wallets.map((w) => ({
      value: w.id,
      label: w.name ?? '',
    }));
    return [...categoryOptions, ...walletOptions];
  }, [sourceAccountId, wallets, categories]);

  const predictedType = useMemo(() => {
    return getTransactionType(sourceAccountId, destinationAccountId, wallets, categories);
  }, [sourceAccountId, destinationAccountId, wallets, categories]);

  const errors = useMemo(() => {
    const allErrors = validateTransaction(sourceAccountId, destinationAccountId, amount, wallets, categories);
    const visibleErrors: typeof allErrors = {};
    if (touched.source && allErrors.source) visibleErrors.source = allErrors.source;
    if (touched.destination && allErrors.destination) visibleErrors.destination = allErrors.destination;
    if (touched.amount && allErrors.amount) visibleErrors.amount = allErrors.amount;
    return visibleErrors;
  }, [sourceAccountId, destinationAccountId, amount, wallets, categories, touched]);

  const isValid = Object.values(errors).every((err) => !err);

  const markTouched = useCallback((field: 'source' | 'destination' | 'amount') => {
    setTouched(prev => ({ ...prev, [field]: true }));
  }, []);

  const markAllTouched = useCallback(() => {
    setTouched({ source: true, destination: true, amount: true });
  }, []);

  const handleSetSourceAccountId = useCallback((id: string | null) => {
    setSourceAccountId(id);
    setDestinationAccountId(null);
  }, []);

  return {
    sourceAccountId,
    setSourceAccountId: handleSetSourceAccountId,
    destinationAccountId,
    setDestinationAccountId,
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
