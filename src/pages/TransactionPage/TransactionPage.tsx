import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header/Header';
import { BottomNav } from '@/components/BottomNav/BottomNav';
import { Toast } from '@/components/Toast/Toast';
import { TransactionCard } from '@/features/transactions/components/TransactionCard';
import { TransactionFilters } from '@/features/transactions/components/TransactionFilters';
import { useTransactions } from '@/features/transactions/hooks/useTransactions';
import { useTransactionFilters } from '@/features/transactions/hooks/useTransactionFilters';
import plusIcon from '@/assets/plus-icon.svg';
import styles from './TransactionPage.module.css';

export function TransactionPage() {
  const { transactions, fetchTransactions, deleteTransaction, undoDelete } = useTransactions();
  const filters = useTransactionFilters(transactions);
  const navigate = useNavigate();
  const [deletedId, setDeletedId] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleDelete = useCallback(
    async (id: string) => {
      setDeletedId(id);
      await deleteTransaction(id);
      setToastVisible(true);
    },
    [deleteTransaction]
  );

  const handleUndo = useCallback(() => {
    if (deletedId) {
      undoDelete(deletedId);
      setDeletedId(null);
      setToastVisible(false);
    }
  }, [deletedId, undoDelete]);

  const handleToastClose = useCallback(() => {
    setToastVisible(false);
    setDeletedId(null);
  }, []);

  return (
    <div className={styles.page}>
      <Header />

      <main className={styles.content}>
        <TransactionFilters filters={filters} />

        <div className={styles.list}>
          {filters.filteredTransactions.length === 0 ? (
            <p className={styles.emptyText}>Транзакций пока нет</p>
          ) : (
            filters.filteredTransactions.map((tx) => (
              <TransactionCard key={tx.id} transaction={tx} onDelete={handleDelete} />
            ))
          )}
        </div>

        <hr className={styles.listSeparator} />

        <button
          className={styles.addButton}
          onClick={() => navigate('/transactions/add')}
          aria-label="Добавить транзакцию"
        >
          <img src={plusIcon} alt="" />
        </button>
      </main>

      <BottomNav />

      <Toast
        message="Транзакция удалена"
        actionLabel="Отмена"
        onAction={handleUndo}
        onClose={handleToastClose}
        visible={toastVisible}
      />
    </div>
  );
}
