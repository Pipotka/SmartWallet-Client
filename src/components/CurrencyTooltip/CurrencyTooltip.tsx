import {
  formatCurrency,
  formatCurrencyShort,
  formatCurrencyWithSign,
} from '@/utils/formatNumber';
import {
  TransactionType,
  type ApiTransactionType,
} from '@/api/schemas/common';

const THRESHOLD = 1_000_000;

interface CurrencyTooltipProps {
  amount: number;
  type?: ApiTransactionType;
}

export function CurrencyTooltip({ amount, type }: CurrencyTooltipProps) {
  const isShort = Math.abs(amount) >= THRESHOLD;

  if (type !== undefined) {
    const display = formatCurrencyWithSign(amount, type);
    if (isShort) {
      const isPositive =
        type === TransactionType.AdjustmentIncrease ||
        type === TransactionType.Income;
      const isNegative =
        type === TransactionType.Expense ||
        type === TransactionType.AdjustmentDecrease;
      const sign = isPositive ? '+' : isNegative ? '\u2212' : '';
      const title = `${sign}${formatCurrency(Math.abs(amount))}`;
      return <span title={title}>{display}</span>;
    }
    return <span>{display}</span>;
  }

  const display = formatCurrencyShort(amount);
  if (isShort) {
    return <span title={formatCurrency(amount)}>{display}</span>;
  }
  return <span>{display}</span>;
}
