import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTransactionStore } from '@/store/useTransactionStore';
import { Header } from '@/components/Header/Header';
import { BottomNav } from '@/components/BottomNav/BottomNav';
import { TransactionForm } from '@/features/transactions/components/TransactionForm';
import type { CreateTransactionDTO } from '@/features/transactions/types';
import styles from './TransactionAddPage.module.css';

export function TransactionAddPage() {
  const navigate = useNavigate();
  const createTransaction = useTransactionStore((s) => s.createTransaction);

  const handleSubmit = useCallback(
    async (dto: CreateTransactionDTO) => {
      await createTransaction(dto);
      navigate('/transactions');
    },
    [createTransaction, navigate]
  );

  const handleCancel = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  return (
    <div className={styles.page}>
      <Header />

      <main className={styles.content}>
        <h1 className={styles.title}>Добавление транзакции</h1>

        <TransactionForm onSubmit={handleSubmit} onCancel={handleCancel} />

        <hr className={styles.separator} />
      </main>

      <BottomNav />
    </div>
  );
}
