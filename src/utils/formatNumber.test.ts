import { describe, it, expect } from 'vitest';
import { formatCurrency, formatCurrencyShort, formatCurrencyWithSign, formatPercent } from './formatNumber';
import { TransactionType } from '@/api/schemas/common';

describe('formatCurrency', () => {
  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('0\u00A0₽');
  });

  it('formats small number', () => {
    expect(formatCurrency(500)).toBe('500\u00A0₽');
  });

  it('formats thousands with locale separators', () => {
    const result = formatCurrency(1234);
    // toLocaleString('ru-RU') uses space as thousands separator
    expect(result).toMatch(/^1\s234\u00A0₽$/);
  });

  it('formats with up to 2 decimal places', () => {
    const result = formatCurrency(1234.56);
    expect(result).toMatch(/^1\s234,56\u00A0₽$/);
  });

  it('formats with no trailing zeros in decimals', () => {
    const result = formatCurrency(1234.5);
    expect(result).toMatch(/^1\s234,5\u00A0₽$/);
  });

  it('formats large number with full separators', () => {
    const result = formatCurrency(1234567);
    expect(result).toMatch(/^1\s234\s567\u00A0₽$/);
  });

  it('formats negative number', () => {
    const result = formatCurrency(-500);
    expect(result).toMatch(/^-500\u00A0₽$/);
  });
});

describe('formatCurrencyShort', () => {
  it('returns full format for amounts below threshold', () => {
    const result = formatCurrencyShort(500000);
    expect(result).toMatch(/^500\s000\u00A0₽$/);
  });

  it('returns full format for exactly 999999', () => {
    const result = formatCurrencyShort(999999);
    expect(result).toMatch(/^999\s999\u00A0₽$/);
  });

  it('abbreviates exactly 1 million', () => {
    expect(formatCurrencyShort(1000000)).toBe('1.000M\u00A0₽');
  });

  it('abbreviates 1.234567 million with 3 decimal places', () => {
    expect(formatCurrencyShort(1234567)).toBe('1.235M\u00A0₽');
  });

  it('abbreviates 5 billion', () => {
    expect(formatCurrencyShort(5000000000)).toBe('5.000B\u00A0₽');
  });

  it('abbreviates 1.2 trillion', () => {
    expect(formatCurrencyShort(1200000000000)).toBe('1.200T\u00A0₽');
  });

  it('abbreviates negative million', () => {
    expect(formatCurrencyShort(-1234567)).toBe('\u22121.235M\u00A0₽');
  });
});

describe('formatCurrencyWithSign', () => {
  it('formats income with + sign', () => {
    const result = formatCurrencyWithSign(5000, TransactionType.Income);
    expect(result).toMatch(/^\+5\s000\u00A0₽$/);
  });

  it('formats adjustment increase with + sign', () => {
    const result = formatCurrencyWithSign(5000, TransactionType.AdjustmentIncrease);
    expect(result).toMatch(/^\+5\s000\u00A0₽$/);
  });

  it('formats expense with minus sign', () => {
    const result = formatCurrencyWithSign(5000, TransactionType.Expense);
    expect(result).toMatch(/^\u22125\s000\u00A0₽$/);
  });

  it('formats adjustment decrease with minus sign', () => {
    const result = formatCurrencyWithSign(5000, TransactionType.AdjustmentDecrease);
    expect(result).toMatch(/^\u22125\s000\u00A0₽$/);
  });

  it('formats transfer with no sign', () => {
    const result = formatCurrencyWithSign(5000, TransactionType.Transfer);
    expect(result).toMatch(/^5\s000\u00A0₽$/);
  });

  it('formats income million with + sign and abbreviation', () => {
    expect(formatCurrencyWithSign(1234567, TransactionType.Income)).toBe('+1.235M\u00A0₽');
  });

  it('formats expense million with minus sign and abbreviation', () => {
    expect(formatCurrencyWithSign(1234567, TransactionType.Expense)).toBe('\u22121.235M\u00A0₽');
  });

  it('formats transfer million with no sign and abbreviation', () => {
    expect(formatCurrencyWithSign(1234567, TransactionType.Transfer)).toBe('1.235M\u00A0₽');
  });

  it('formats negative amount using sign from type, not amount', () => {
    const result = formatCurrencyWithSign(-5000, TransactionType.Income);
    expect(result).toMatch(/^\+5\s000\u00A0₽$/);
  });

  it('formats ForTest type with no sign (default branch)', () => {
    expect(formatCurrencyWithSign(5, TransactionType.ForTest)).toBe('5\u00A0₽');
  });
});

describe('formatPercent', () => {
  it('formats positive value with + sign by default', () => {
    expect(formatPercent(12.3)).toBe('+12,3\u00A0%');
  });

  it('formats negative value with minus sign', () => {
    expect(formatPercent(-5.6)).toBe('\u22125,6\u00A0%');
  });

  it('formats zero without sign when alwaysShowSign is false', () => {
    expect(formatPercent(0, { alwaysShowSign: false })).toBe('0,0\u00A0%');
  });

  it('formats zero without sign by default', () => {
    expect(formatPercent(0)).toBe('0,0\u00A0%');
  });

  it('formats positive value without sign when alwaysShowSign is false', () => {
    expect(formatPercent(12.3, { alwaysShowSign: false })).toBe('12,3\u00A0%');
  });

  it('formats negative value with minus sign when alwaysShowSign is false', () => {
    expect(formatPercent(-5.6, { alwaysShowSign: false })).toBe('\u22125,6\u00A0%');
  });
});
