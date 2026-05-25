import type { ApiTransactionType } from '@/api/schemas/common';

export type TransactionType = ApiTransactionType;

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  [0]: 'Перевод',
  [1]: 'Траты',
  [2]: 'Уменьшение баланса',
  [3]: 'Увеличение баланса',
  [4]: 'Пополнение',
  [5]: 'Тест',
};

export const TRANSACTION_TYPE_COLORS: Record<TransactionType, string> = {
  [0]: '#64748b',
  [1]: '#ef4444',
  [2]: '#ef4444',
  [3]: '#10b981',
  [4]: '#10b981',
  [5]: '#64748b',
};

export interface Transaction {
  id: string;
  sourceAccountId: string | null;
  destinationAccountId: string | null;
  amount: number;
  type: TransactionType;
  madeAt: string;
}

export interface CreateTransactionDTO {
  sourceAccountId: string | null;
  destinationAccountId: string | null;
  amount: number;
}
