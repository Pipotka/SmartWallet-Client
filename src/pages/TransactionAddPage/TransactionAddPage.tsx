import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateTransaction } from '@/api/queries/transaction';
import { parseApiError } from '@/api/parseApiError';
import { Header } from '@/components/Header/Header';
import { TransactionForm } from '@/features/transactions/components/TransactionForm';
import { useToastStore } from '@/store/useToastStore';
import type { CreateTransactionDTO } from '@/features/transactions/types';
import styles from './TransactionAddPage.module.css';

const FIELD_MAP: Record<string, string> = {
  SourceAccountId: 'source',
  DestinationAccountId: 'destination',
  Amount: 'amount',
};

export function TransactionAddPage() {
  const navigate = useNavigate();
  const createMutation = useCreateTransaction();
  const showError = useToastStore((s) => s.showError);
  const [serverErrors, setServerErrors] = useState<{ source?: string; destination?: string; amount?: string }>({});

  const handleSubmit = useCallback(
    async (dto: CreateTransactionDTO) => {
      try {
        await createMutation.mutateAsync(dto);
        navigate('/transactions');
      } catch (error) {
        const { fieldErrors, generalErrors } = parseApiError(error);
        const mappedErrors: { source?: string; destination?: string; amount?: string } = {};
        for (const [serverField, errorMessage] of Object.entries(fieldErrors)) {
          const formField = FIELD_MAP[serverField] ?? serverField;
          if (formField === 'source' || formField === 'destination' || formField === 'amount') {
            mappedErrors[formField as 'source' | 'destination' | 'amount'] = errorMessage;
          }
        }
        setServerErrors(mappedErrors);
        if (generalErrors.length > 0) {
          generalErrors.forEach((msg) => showError(msg));
        } else if (Object.keys(mappedErrors).length === 0) {
          showError('Произошла ошибка');
        }
      }
    },
    [createMutation, navigate, showError],
  );

  const handleCancel = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handleClearServerError = useCallback(() => {
    setServerErrors({});
  }, []);

  return (
    <div className={styles.page}>
      <Header />

      <main className={styles.content}>
        <div className={styles.formWrapper}>
          <h1 className={styles.title}>Добавление транзакции</h1>

          <TransactionForm onSubmit={handleSubmit} onCancel={handleCancel} serverErrors={serverErrors} onClearServerError={handleClearServerError} />

          <hr className={styles.separator} />
        </div>
      </main>
    </div>
  );
}
