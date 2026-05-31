import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header/Header';
import { BottomNav } from '@/components/BottomNav/BottomNav';
import { useToastStore } from '@/store/useToastStore';
import { TransactionCard } from '@/features/transactions/components/TransactionCard';
import { TransactionFilters } from '@/features/transactions/components/TransactionFilters';
import { useTransactions } from '@/features/transactions/hooks/useTransactions';
import { useTransactionFilters } from '@/features/transactions/hooks/useTransactionFilters';
import { useTransactionStore } from '@/store/useTransactionStore';
import plusIcon from '@/assets/plus-icon.svg';
import styles from './TransactionPage.module.css';

export function TransactionPage() {
  const { transactions, isLoading, error, deleteTransaction, undoDelete } = useTransactions();
  const markOptimisticDeleted = useTransactionStore((s) => s.markOptimisticDeleted);
  const confirmDeleted = useTransactionStore((s) => s.confirmDeleted);
  const filters = useTransactionFilters(transactions);
  const navigate = useNavigate();

  const showSuccessToast = useToastStore((s) => s.showSuccess);
  const showErrorToast = useToastStore((s) => s.showError);

  const handleDelete = useCallback(
    async (id: string) => {
      const undoId = useToastStore.getState().addToast('Транзакция удалена', 'success', {
        actionLabel: 'Отмена',
        onAction: () => {
          undoDelete(id);
        },
      });

      markOptimisticDeleted(id);
      try {
        await deleteTransaction(id);
        confirmDeleted(id);
      } catch {
        undoDelete(id);
        useToastStore.getState().removeToast(undoId);
        showErrorToast('Ошибка удаления транзакции');
      }
    },
    [deleteTransaction, markOptimisticDeleted, confirmDeleted, undoDelete, showErrorToast],
  );

  if (isLoading) {
    return (
      <div className={styles.page}>
        <Header />
        <main className={styles.content}>
          <p className={styles.emptyText}>Загрузка...</p>
        </main>
        <BottomNav />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <Header />
        <main className={styles.content}>
          <p className={styles.emptyText}>Ошибка загрузки транзакций</p>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Header />

      <main className={styles.content}>
        <TransactionFilters filters={filters} onAddClick={() => navigate('/transactions/add')} />

        <hr className={styles.listSeparator} />

        <div className={styles.scrollArea}>
          {filters.filteredTransactions.length === 0 ? (
            <p className={styles.emptyText}>Транзакций пока нет</p>
          ) : (
            filters.filteredTransactions.map((tx) => (
              <TransactionCard key={tx.id} transaction={tx} onDelete={handleDelete} />
            ))
          )}
        </div>
      </main>

      <button
        className={styles.mobileAddButton}
        onClick={() => navigate('/transactions/add')}
        aria-label="Добавить транзакцию"
      >
        <img src={plusIcon} alt="" />
      </button>

      <BottomNav />
    </div>
  );
}
