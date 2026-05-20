import { useRef, useState, useCallback } from 'react';
import styles from './TransactionCard.module.css';
import type { Transaction } from '@/features/transactions/types';
import { TRANSACTION_TYPE_LABELS, TRANSACTION_TYPE_COLORS } from '@/features/transactions/types';
import { formatTransactionDescription } from '@/features/transactions/utils';
import trashIcon from '@/assets/trash.svg';
import { useWalletStore } from '@/store/useWalletStore';

interface TransactionCardProps {
  transaction: Transaction;
  onDelete: (id: string) => void;
}

export function TransactionCard({ transaction, onDelete }: TransactionCardProps) {
  const endpoints = useWalletStore((state) => state.endpoints);
  const wallets = endpoints.filter((e) => e.isStorage);
  const categories = endpoints.filter((e) => !e.isStorage);

  const description = formatTransactionDescription(transaction, wallets, categories);
  const date = new Date(transaction.date).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const typeLabel = TRANSACTION_TYPE_LABELS[transaction.type];
  const typeColor = TRANSACTION_TYPE_COLORS[transaction.type];

  const startXRef = useRef(0);
  const [deltaX, setDeltaX] = useState(0);
  const [showOverlay, setShowOverlay] = useState(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const currentX = e.touches[0].clientX;
    const diff = currentX - startXRef.current;
    if (diff < 0) {
      setDeltaX(Math.max(diff, -80));
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (deltaX < -40) {
      setShowOverlay(true);
    }
    setDeltaX(0);
  }, [deltaX]);

  const handleDeleteClick = useCallback(() => {
    onDelete(transaction.id);
    setShowOverlay(false);
  }, [onDelete, transaction.id]);

  const handleCardClick = useCallback(() => {
    setShowOverlay(false);
  }, []);

  return (
    <div className={styles.cardWrapper}>
      <div
        className={styles.card}
        style={{ transform: `translateX(${deltaX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className={styles.cardContent} onClick={handleCardClick}>
          <div className={styles.header}>
            <div className={styles.typeRow}>
              <span
                className={styles.dot}
                style={{ backgroundColor: typeColor }}
              />
              <span className={styles.typeLabel}>{typeLabel}</span>
            </div>
            <span className={styles.date}>{date}</span>
          </div>
          <div className={styles.description}>{description}</div>
          <div
            className={styles.amount}
            style={{ color: typeColor }}
          >
            {transaction.amount} ₽
          </div>
        </div>
        {showOverlay && (
          <div className={styles.overlay} onClick={handleDeleteClick}>
            Удалить
          </div>
        )}
        <button
          className={styles.deleteButton}
          onClick={handleDeleteClick}
          aria-label="Удалить транзакцию"
        >
          <img src={trashIcon} alt="" />
        </button>
      </div>
    </div>
  );
}
