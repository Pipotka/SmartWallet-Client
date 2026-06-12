import { TransactionType } from '@/api/schemas/common';

const THRESHOLD = 1_000_000;

const SUFFIXES: [number, string][] = [
  [12, 'T'],
  [9, 'B'],
  [6, 'M'],
];

function formatShortValue(value: number): string {
  const absValue = Math.abs(value);
  let suffix = '';
  let divisor = 1;

  for (const [power, s] of SUFFIXES) {
    const d = Math.pow(10, power);
    if (absValue >= d) {
      divisor = d;
      suffix = s;
      break;
    }
  }

  const scaled = absValue / divisor;
  const formatted = scaled.toFixed(3);
  const sign = value < 0 ? '-' : '';
  return `${sign}${formatted}${suffix}`;
}

export function formatCurrency(amount: number): string {
  const formatted = amount.toLocaleString('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return `${formatted}\u00A0₽`;
}

export function formatCurrencyShort(amount: number): string {
  if (Math.abs(amount) < THRESHOLD) {
    return formatCurrency(amount);
  }
  return `${formatShortValue(amount)}\u00A0₽`;
}

export function formatCurrencyWithSign(amount: number, type: number): string {
  const shortFormatted = formatCurrencyShort(Math.abs(amount));

  switch (type) {
    case TransactionType.AdjustmentIncrease:
    case TransactionType.Income:
      return `+${shortFormatted}`;
    case TransactionType.Expense:
    case TransactionType.AdjustmentDecrease:
      return `\u2212${shortFormatted}`;
    case TransactionType.Transfer:
      return shortFormatted;
    default:
      return shortFormatted;
  }
}

export function formatPercent(
  value: number,
  options: { alwaysShowSign?: boolean } = {},
): string {
  const { alwaysShowSign = true } = options;
  const formatted = Math.abs(value).toLocaleString('ru-RU', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

  const sign =
    value < 0
      ? '\u2212'
      : value > 0 && alwaysShowSign
        ? '+'
        : '';

  return `${sign}${formatted}\u00A0%`;
}
