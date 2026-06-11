import { useCallback, useRef, useEffect } from 'react';
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
  const filters = useTransactionFilters();
  const { transactions, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error, deleteTransaction, undoDelete } =
    useTransactions(filters.filterParams);
  const markOptimisticDeleted = useTransactionStore((s) => s.markOptimisticDeleted);
  const confirmDeleted = useTransactionStore((s) => s.confirmDeleted);
  const navigate = useNavigate();

  const showErrorToast = useToastStore((s) => s.showError);

  const handleDelete = useCallback(
    (id: string) => {
      useToastStore.getState().addToast('Транзакция удалена', 'success', {
        actionLabel: 'Отмена',
        onAction: () => {
          undoDelete(id);
        },
      });

      markOptimisticDeleted(id, async () => {
        try {
          await deleteTransaction(id);
          confirmDeleted(id);
        } catch {
          undoDelete(id);
          showErrorToast('Ошибка удаления транзакции');
        }
      });
    },
    [deleteTransaction, markOptimisticDeleted, confirmDeleted, undoDelete, showErrorToast],
  );

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

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
          {transactions.length === 0 ? (
            <p className={styles.emptyText}>Транзакций пока нет</p>
          ) : (
            transactions.map((tx) => (
              <TransactionCard key={tx.id} transaction={tx} onDelete={handleDelete} />
            ))
          )}
          <div ref={sentinelRef} className={styles.sentinel} />
          {isFetchingNextPage && (
            <p className={styles.loadingMore}>Загрузка...</p>
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
