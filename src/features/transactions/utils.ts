import type { Transaction, TransactionType } from './types';
import type { TransactionEndpoint } from '@/types';

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
