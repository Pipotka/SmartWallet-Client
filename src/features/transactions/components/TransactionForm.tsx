import { useCallback, useMemo } from 'react';
import styles from './TransactionForm.module.css';
import type { CreateTransactionDTO } from '@/features/transactions/types';
import { useTransactionForm } from '@/features/transactions/hooks/useTransactionForm';
import { useWalletStore } from '@/store/useWalletStore';
import { Select } from '@/components/Select/Select';
import { InputField } from '@/components/InputField/InputField';
import { Button, SaveIcon, CloseIcon } from '@/components/Button/Button';

interface TransactionFormProps {
  onSubmit: (dto: CreateTransactionDTO) => void;
  onCancel: () => void;
}

export function TransactionForm({ onSubmit, onCancel }: TransactionFormProps) {
  const form = useTransactionForm();
  const endpoints = useWalletStore((s) => s.endpoints);
  const wallets = useMemo(() => endpoints.filter((e) => e.isStorage), [endpoints]);
  const categories = useMemo(() => endpoints.filter((e) => !e.isStorage), [endpoints]);

  const selectedCategory = form.destinationId
    ? categories.find((c) => c.id === form.destinationId)
    : null;

  const remaining = selectedCategory
    ? selectedCategory.limitation - selectedCategory.value
    : 0;

  const showBadge = selectedCategory && selectedCategory.limitation > 0;

  const selectedSource = form.sourceId
    ? wallets.find((w) => w.id === form.sourceId)
    : null;
  const sourceRemaining = selectedSource && selectedSource.limitation > 0
    ? selectedSource.limitation - selectedSource.value
    : null;
  const showSourceBadge = sourceRemaining !== null;

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (form.isValid) {
        onSubmit({
          sourceId: form.sourceId,
          destinationId: form.destinationId,
          amount: Number(form.amount),
        });
      }
    },
    [form.sourceId, form.destinationId, form.amount, form.isValid, onSubmit]
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
          value={form.sourceId ?? ''}
          onChange={(value) => {
            form.markTouched('source');
            form.setSourceId(value || null);
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
          value={form.destinationId ?? ''}
          onChange={(value) => {
            form.markTouched('destination');
            form.setDestinationId(value || null);
          }}
          placeholder="Выберите назначение"
          rightBadge={showBadge ? <>До лимита: {remaining} ₽</> : undefined}
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
