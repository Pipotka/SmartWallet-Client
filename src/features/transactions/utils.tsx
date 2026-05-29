import type { Transaction } from './types';
import type { TransactionEndpoint } from '@/types';
import type { ReactNode } from 'react';
import { TransactionType } from '@/api/schemas/common';

export function getTransactionType(
  sourceAccountId: string | null,
  destinationAccountId: string | null,
  wallets: TransactionEndpoint[],
  categories: TransactionEndpoint[]
): number | null {
  const isSourceWallet = sourceAccountId !== null;
  const isDestCategory = categories.some(c => c.id === destinationAccountId);
  const isDestWallet = wallets.some(w => w.id === destinationAccountId);

  if (!isSourceWallet && isDestWallet) return TransactionType.Income;
  if (isSourceWallet && isDestCategory) return TransactionType.Expense;
  if (isSourceWallet && isDestWallet) return TransactionType.Transfer;
  if (isSourceWallet && !destinationAccountId) return TransactionType.AdjustmentDecrease;
  return null;
}

export function formatTransactionDescription(
  transaction: Transaction,
  wallets: TransactionEndpoint[],
  categories: TransactionEndpoint[]
): string {
  const sourceName = transaction.sourceAccountId
    ? wallets.find(w => w.id === transaction.sourceAccountId)?.name ?? 'Неизвестно'
    : '—';
  const destName = transaction.destinationAccountId
    ? (wallets.find(w => w.id === transaction.destinationAccountId)?.name
      ?? categories.find(c => c.id === transaction.destinationAccountId)?.name
      ?? 'Неизвестно')
    : '—';
  return `${sourceName} → ${destName}`;
}

export function formatTransactionTitle(
  transaction: Transaction,
  wallets: TransactionEndpoint[],
  categories: TransactionEndpoint[]
): ReactNode {
  const sourceName = transaction.sourceAccountId
    ? wallets.find(w => w.id === transaction.sourceAccountId)?.name ?? 'Неизвестно'
    : null;
  const destName = transaction.destinationAccountId
    ? (wallets.find(w => w.id === transaction.destinationAccountId)?.name
      ?? categories.find(c => c.id === transaction.destinationAccountId)?.name
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
  type: number
): string {
  const formatted = amount.toLocaleString('ru-RU');
  switch (type) {
    case TransactionType.AdjustmentIncrease:
    case TransactionType.Income:
      return `+${formatted} ₽`;
    case TransactionType.Expense:
    case TransactionType.AdjustmentDecrease:
      return `−${formatted} ₽`;
    case TransactionType.Transfer:
      return `${formatted} ₽`;
    default:
      return `${formatted} ₽`;
  }
}

export function validateTransaction(
  sourceAccountId: string | null,
  destinationAccountId: string | null,
  amount: string,
  _wallets: { id: string }[],
  categories: { id: string }[]
): { source?: string; destination?: string; amount?: string } {
  const errors: { source?: string; destination?: string; amount?: string } = {};

  if (destinationAccountId && categories.find(c => c.id === destinationAccountId) && !sourceAccountId) {
    errors.source = 'Выберите источник';
  }

  if (!destinationAccountId) {
    errors.destination = 'Выберите назначение';
  }

  if (!amount) {
    errors.amount = 'Введите сумму';
  } else if (Number(amount) <= 0) {
    errors.amount = 'Сумма должна быть больше 0';
  }

  if (sourceAccountId && destinationAccountId && sourceAccountId === destinationAccountId) {
    errors.destination = 'Источник и назначение не могут совпадать';
  }

  return errors;
}
