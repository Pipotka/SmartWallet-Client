import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CurrencyTooltip } from './CurrencyTooltip';
import { TransactionType } from '@/api/schemas/common';

describe('CurrencyTooltip', () => {
  it('renders full format without title for amounts below threshold', () => {
    render(<CurrencyTooltip amount={500000} />);
    const el = screen.getByText(/500/);
    expect(el).toBeInTheDocument();
    expect(el.textContent).toMatch(/500/);
    expect(el).not.toHaveAttribute('title');
  });

  it('renders short format with title for amounts at threshold', () => {
    render(<CurrencyTooltip amount={1000000} />);
    const el = screen.getByText(/1\.000M\s*₽/);
    expect(el).toBeInTheDocument();
    expect(el).toHaveAttribute('title');
    const title = el.getAttribute('title')!;
    expect(title).toMatch(/1/);
    expect(title).toContain('₽');
  });

  it('renders short format with title for amounts above threshold', () => {
    render(<CurrencyTooltip amount={1234567} />);
    const el = screen.getByText(/1\.235M\s*₽/);
    expect(el).toBeInTheDocument();
    expect(el).toHaveAttribute('title');
  });

  it('renders with positive sign for Income type above threshold', () => {
    render(<CurrencyTooltip amount={1234567} type={TransactionType.Income} />);
    const el = screen.getByText(/\+1\.235M\s*₽/);
    expect(el).toBeInTheDocument();
    const title = el.getAttribute('title')!;
    expect(title).toMatch(/^\+/);
  });

  it('renders with minus sign for Expense type above threshold', () => {
    render(<CurrencyTooltip amount={1234567} type={TransactionType.Expense} />);
    const el = screen.getByText(/\u22121\.235M\s*₽/);
    expect(el).toBeInTheDocument();
    const title = el.getAttribute('title')!;
    expect(title).toMatch(/^\u2212/);
  });

  it('renders full format with sign for Expense type below threshold', () => {
    render(<CurrencyTooltip amount={5000} type={TransactionType.Expense} />);
    const el = screen.getByText(/\u2212/);
    expect(el).toBeInTheDocument();
    expect(el).not.toHaveAttribute('title');
  });

  it('renders full format without sign when type is not provided and amount is below threshold', () => {
    render(<CurrencyTooltip amount={5000} />);
    const el = screen.getByText(/5/);
    expect(el).toBeInTheDocument();
    expect(el).not.toHaveAttribute('title');
  });
});
