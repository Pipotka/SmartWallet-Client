import { useCallback } from 'react';
import styles from './TransactionForm.module.css';
import type { CreateTransactionDTO } from '@/features/transactions/types';
import { useTransactionForm } from '@/features/transactions/hooks/useTransactionForm';
import { useWalletStore } from '@/store/useWalletStore';
import { Select } from '@/components/Select/Select';
import { InputField } from '@/components/InputField/InputField';
import { Button, SaveIcon, CloseIcon } from '@/components/Button/Button';
import { CategoryLimitBadge } from './CategoryLimitBadge';

interface TransactionFormProps {
  onSubmit: (dto: CreateTransactionDTO) => void;
  onCancel: () => void;
}

export function TransactionForm({ onSubmit, onCancel }: TransactionFormProps) {
  const form = useTransactionForm();
  const endpoints = useWalletStore((state) => state.endpoints);
  const categories = endpoints.filter((e) => !e.isStorage);

  const selectedCategory = form.destinationId
    ? categories.find((c) => c.id === form.destinationId)
    : null;

  const remaining = selectedCategory
    ? selectedCategory.limitation - selectedCategory.value
    : 0;

  const showBadge = selectedCategory && selectedCategory.limitation > 0;

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
          onChange={(value) => form.setSourceId(value || null)}
          placeholder="Нет источника"
        />

        <div className={styles.destinationRow}>
          <div className={styles.destinationSelect}>
            <Select
              label="Назначение"
              options={form.availableDestinations.map((d) => ({
                value: d.value,
                label: d.label,
              }))}
              value={form.destinationId ?? ''}
              onChange={(value) => form.setDestinationId(value || null)}
              placeholder="Выберите назначение"
            />
            {form.errors.destination && (
              <span className={styles.errorText}>{form.errors.destination}</span>
            )}
          </div>
          {showBadge && (
            <CategoryLimitBadge remaining={remaining} />
          )}
        </div>

        <InputField
          label="Сумма"
          value={form.amount}
          onChange={form.setAmount}
          type="number"
          error={!!form.errors.amount}
          errorText={form.errors.amount}
        />

        <div className={styles.buttonRow}>
          <Button
            variant="primary"
            icon={<SaveIcon />}
            onClick={handleSubmit}
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
