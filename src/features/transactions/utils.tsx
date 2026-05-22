import type { Transaction, TransactionType } from './types';
import type { TransactionEndpoint } from '@/types';
import type { ReactNode } from 'react';

export function getTransactionType(
  sourceId: string | null,
  destinationId: string | null,
  wallets: TransactionEndpoint[],
  categories: TransactionEndpoint[]
): TransactionType | null {
  const isSourceWallet = sourceId !== null;
  const isDestCategory = categories.some(c => c.id === destinationId);
  const isDestWallet = wallets.some(w => w.id === destinationId);

  if (!isSourceWallet && isDestWallet) return 'income';
  if (isSourceWallet && isDestCategory) return 'expense';
  if (isSourceWallet && isDestWallet) return 'transfer';
  if (isSourceWallet && !destinationId) return 'balance_decrease';
  // !isSourceWallet && isDestCategory is invalid: a category can never be a source
  return null;
}

export function formatTransactionDescription(
  transaction: Transaction,
  wallets: TransactionEndpoint[],
  categories: TransactionEndpoint[]
): string {
  const sourceName = transaction.sourceId
    ? wallets.find(w => w.id === transaction.sourceId)?.name ?? 'Неизвестно'
    : '—';
  const destName = transaction.destinationId
    ? (wallets.find(w => w.id === transaction.destinationId)?.name
      ?? categories.find(c => c.id === transaction.destinationId)?.name
      ?? 'Неизвестно')
    : '—';
  return `${sourceName} → ${destName}`;
}

export function formatTransactionTitle(
  transaction: Transaction,
  wallets: TransactionEndpoint[],
  categories: TransactionEndpoint[]
): ReactNode {
  const sourceName = transaction.sourceId
    ? wallets.find(w => w.id === transaction.sourceId)?.name ?? 'Неизвестно'
    : null;
  const destName = transaction.destinationId
    ? (wallets.find(w => w.id === transaction.destinationId)?.name
      ?? categories.find(c => c.id === transaction.destinationId)?.name
      ?? 'Неизвестно')
    : null;

  if (sourceName && destName) {
    return <>Из <strong>{sourceName}</strong> в <strong>{destName}</strong></>;
  }
  if (destName) {
    return <>В <strong>{destName}</strong></>;
  }
  if (sourceName) {
    return <>Из <strong>{sourceName}</strong></>;
  }
  return '—';
}

export function formatAmountWithSign(
  amount: number,
  type: TransactionType
): string {
  const formatted = amount.toLocaleString('ru-RU');
  switch (type) {
    case 'income':
      return `+${formatted} ₽`;
    case 'expense':
    case 'balance_decrease':
      return `−${formatted} ₽`;
    case 'transfer':
      return `${formatted} ₽`;
    default:
      return `${formatted} ₽`;
  }
}

export function validateTransaction(
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
