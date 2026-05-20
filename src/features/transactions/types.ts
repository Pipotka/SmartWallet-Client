export type TransactionType = 'expense' | 'transfer' | 'income' | 'balance_decrease';

export const TRANSACTION_TYPE_LABELS = {
  expense: 'Траты',
  transfer: 'Перевод',
  income: 'Увеличение баланса',
  balance_decrease: 'Уменьшение баланса',
} as const;

export const TRANSACTION_TYPE_COLORS = {
  expense: '#ef4444',
  transfer: '#64748b',
  income: '#10b981',
  balance_decrease: '#ef4444',
} as const;

export interface Transaction {
  id: string;
  sourceId: string | null;
  destinationId: string | null;
  amount: number;
  type: TransactionType;
  date: string;
}

export interface CreateTransactionDTO {
  sourceId: string | null;
  destinationId: string | null;
  amount: number;
}
