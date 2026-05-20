export type TransactionType = 'expense' | 'transfer' | 'income' | 'balance_decrease';

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  expense: 'Траты',
  transfer: 'Перевод',
  income: 'Увеличение баланса',
  balance_decrease: 'Уменьшение баланса',
};

export const TRANSACTION_TYPE_COLORS: Record<TransactionType, string> = {
  expense: '#ef4444',
  transfer: '#64748b',
  income: '#10b981',
  balance_decrease: '#ef4444',
};

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
