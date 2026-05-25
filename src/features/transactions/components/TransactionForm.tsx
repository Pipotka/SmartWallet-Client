import { useCallback, useMemo } from 'react';
import styles from './TransactionForm.module.css';
import type { CreateTransactionDTO } from '@/features/transactions/types';
import { useTransactionForm } from '@/features/transactions/hooks/useTransactionForm';
import { validateTransaction } from '@/features/transactions/utils';
import { useTransactionEndpoints } from '@/api/queries/transaction-endpoint';
import { Select } from '@/components/Select/Select';
import { InputField } from '@/components/InputField/InputField';
import { Button, SaveIcon, CloseIcon } from '@/components/Button/Button';

interface TransactionFormProps {
  onSubmit: (dto: CreateTransactionDTO) => void;
  onCancel: () => void;
}

export function TransactionForm({ onSubmit, onCancel }: TransactionFormProps) {
  const form = useTransactionForm();
  const { data: endpoints = [] } = useTransactionEndpoints();
  const wallets = useMemo(() => endpoints.filter((e) => e.isStorage), [endpoints]);
  const categories = useMemo(() => endpoints.filter((e) => !e.isStorage), [endpoints]);

  const selectedCategory = form.destinationAccountId
    ? categories.find((c) => c.id === form.destinationAccountId)
    : null;

  const selectedDestinationWallet = form.destinationAccountId
    ? wallets.find((w) => w.id === form.destinationAccountId)
    : null;

  const destRemaining = selectedCategory && selectedCategory.limitation !== null && selectedCategory.limitation > 0
    ? selectedCategory.limitation - selectedCategory.value
    : selectedDestinationWallet && selectedDestinationWallet.limitation !== null && selectedDestinationWallet.limitation > 0
      ? selectedDestinationWallet.limitation - selectedDestinationWallet.value
      : null;

  const showBadge = destRemaining !== null;

  const selectedSource = form.sourceAccountId
    ? wallets.find((w) => w.id === form.sourceAccountId)
    : null;
  const sourceRemaining = selectedSource && selectedSource.limitation !== null && selectedSource.limitation > 0
    ? selectedSource.limitation - selectedSource.value
    : null;
  const showSourceBadge = sourceRemaining !== null;

  const { sourceAccountId, destinationAccountId, amount, markAllTouched } = form;

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      markAllTouched();

      const allErrors = validateTransaction(
        sourceAccountId,
        destinationAccountId,
        amount,
        wallets,
        categories
      );
      const hasErrors = Object.values(allErrors).some((err) => err);

      if (!hasErrors) {
        onSubmit({
          sourceAccountId: sourceAccountId,
          destinationAccountId: destinationAccountId,
          amount: Number(amount),
        });
      }
    },
    [sourceAccountId, destinationAccountId, amount, wallets, categories, onSubmit, markAllTouched]
  );

  return (
    <div className={styles.formContainer}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <Select
          label="Источник"
          options={form.availableSources.map((s) => ({
            value: s.value ?? '',
            label: s.label,
          }))}
          value={form.sourceAccountId ?? ''}
          onChange={(value) => {
            form.markTouched('source');
            form.setSourceAccountId(value || null);
          }}
          placeholder="Выберите источник"
          rightBadge={showSourceBadge ? <>До лимита: {sourceRemaining} ₽</> : undefined}
        />

        <Select
          label="Назначение"
          options={form.availableDestinations.map((d) => ({
            value: d.value,
            label: d.label,
          }))}
          value={form.destinationAccountId ?? ''}
          onChange={(value) => {
            form.markTouched('destination');
            form.setDestinationAccountId(value || null);
          }}
          placeholder="Выберите назначение"
          rightBadge={showBadge ? <>До лимита: {destRemaining} ₽</> : undefined}
        />
        {form.errors.destination && (
          <span className={styles.errorText}>{form.errors.destination}</span>
        )}

        <InputField
          label="Сумма"
          value={form.amount}
          onChange={(value) => {
            form.markTouched('amount');
            form.setAmount(value);
          }}
          onBlur={() => form.markTouched('amount')}
          type="number"
          error={!!form.errors.amount}
          errorText={form.errors.amount}
        />

        <div className={styles.buttonRow}>
          <Button
            variant="primary"
            icon={<SaveIcon />}
            disabled={!form.isValid}
            type="submit"
          >
            Сохранить
          </Button>
          <Button
            variant="neutral"
            icon={<CloseIcon />}
            onClick={onCancel}
          >
            Отмена
          </Button>
        </div>
      </form>
    </div>
  );
}
