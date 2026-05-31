import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateTransaction } from '@/api/queries/transaction';
import { parseApiError } from '@/api/parseApiError';
import { Header } from '@/components/Header/Header';
import { TransactionForm } from '@/features/transactions/components/TransactionForm';
import { useToastStore } from '@/store/useToastStore';
import type { CreateTransactionDTO } from '@/features/transactions/types';
import styles from './TransactionAddPage.module.css';

export function TransactionAddPage() {
  const navigate = useNavigate();
  const createMutation = useCreateTransaction();
  const showError = useToastStore((s) => s.showError);

  const handleSubmit = useCallback(
    async (dto: CreateTransactionDTO) => {
      try {
        await createMutation.mutateAsync(dto);
        navigate('/transactions');
      } catch (error) {
        const { generalErrors } = parseApiError(error);
        if (generalErrors.length > 0) {
          generalErrors.forEach((msg) => showError(msg));
        } else {
          showError('Произошла ошибка');
        }
      }
    },
    [createMutation, navigate, showError],
  );

  const handleCancel = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  return (
    <div className={styles.page}>
      <Header />

      <main className={styles.content}>
        <div className={styles.formWrapper}>
          <h1 className={styles.title}>Добавление транзакции</h1>

          <TransactionForm onSubmit={handleSubmit} onCancel={handleCancel} />

          <hr className={styles.separator} />
        </div>
      </main>
    </div>
  );
}
