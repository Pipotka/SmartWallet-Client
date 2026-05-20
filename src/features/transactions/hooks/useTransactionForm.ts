import { useState, useMemo } from 'react';
import type { TransactionType } from '@/features/transactions/types';
import { getTransactionType } from '@/features/transactions/utils';
import { useWalletStore, getWallets, getCategories } from '@/store/useWalletStore';

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
}

function validate(
  sourceId: string | null,
  destinationId: string | null,
  amount: string,
  wallets: { id: string }[],
  categories: { id: string }[]
): { source?: string; destination?: string; amount?: string } {
  const errors: { source?: string; destination?: string; amount?: string } = {};

  if (destinationId && categories.find(c => c.id === destinationId) && !sourceId) {
    errors.source = 'Выберите источник';
  }

  if (!destinationId) {
    errors.destination = 'Выберите назначение';
  }

  if (!amount) {
    errors.amount = 'Введите сумму';
  } else if (Number(amount) <= 0) {
    errors.amount = 'Сумма должна быть больше 0';
  }

  if (sourceId && destinationId && sourceId === destinationId) {
    errors.destination = 'Источник и назначение не могут совпадать';
  }

  return errors;
}

export function useTransactionForm(): UseTransactionFormReturn {
  const [sourceId, setSourceId] = useState<string | null>(null);
  const [destinationId, setDestinationId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');

  const endpoints = useWalletStore((state) => state.endpoints);

  const wallets = useMemo(() => getWallets(), [endpoints]);
  const categories = useMemo(() => getCategories(), [endpoints]);

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
    return validate(sourceId, destinationId, amount, wallets, categories);
  }, [sourceId, destinationId, amount, wallets, categories]);

  const isValid = useMemo(() => {
    return Object.values(errors).every((err) => !err);
  }, [errors]);

  const handleSetSourceId = (id: string | null) => {
    setSourceId(id);
    setDestinationId(null);
  };

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
  };
}
