import type { Transaction, TransactionType } from './types';
import type { TransactionEndpoint } from '@/types';

type Wallet = TransactionEndpoint;
type Category = TransactionEndpoint;

export function getTransactionType(
  sourceId: string | null,
  destinationId: string | null,
  wallets: Wallet[],
  categories: Category[]
): TransactionType | null {
  const isSourceWallet = sourceId !== null;
  const isDestCategory = destinationId !== null
    && categories.some(c => c.id === destinationId);
  const isDestWallet = destinationId !== null
    && wallets.some(w => w.id === destinationId);

  if (!isSourceWallet && isDestWallet) return 'income';
  if (isSourceWallet && isDestCategory) return 'expense';
  if (isSourceWallet && isDestWallet) return 'transfer';
  if (isSourceWallet && !destinationId) return 'balance_decrease';
  return null;
}

export function formatTransactionDescription(
  transaction: Transaction,
  wallets: Wallet[],
  categories: Category[]
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
