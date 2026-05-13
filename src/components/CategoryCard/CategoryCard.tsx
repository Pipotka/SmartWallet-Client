import { useNavigate } from 'react-router-dom';
import styles from './CategoryCard.module.css';

interface CategoryCardProps {
  id: string;
  name: string;
  value?: number;
  limit: number;
  isOverLimit: boolean;
  type: 'wallet' | 'category';
}

export function CategoryCard({ id, name, value, limit, isOverLimit, type }: CategoryCardProps) {
  const navigate = useNavigate();

  const cardClass = [
    styles.card,
    type === 'wallet' ? styles.wallet : styles.category,
  ].join(' ');

  const editPath = type === 'wallet' ? `/wallet/${id}` : `/category/${id}`;

  const limitBadgeClass = [
    styles.limitBadge,
    isOverLimit ? styles.limitBadgeOver : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={styles.cardItem} onClick={() => navigate(editPath)}>
      <button className={cardClass}>
        <span className={styles.name}>{name}</span>
      </button>
      <span className={limitBadgeClass}>{limit} ₽</span>
      {value !== undefined && <span className={styles.value}>{value} ₽</span>}
    </div>
  );
}

interface AddCardProps {
  onClick: () => void;
}

export function AddCard({ onClick }: AddCardProps) {
  return (
    <div className={styles.addButtonOuter}>
      <button className={styles.addButton} onClick={onClick} aria-label="Добавить">
        <svg
          className={styles.plusIcon}
          viewBox="0 0 32 32"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <line x1="16" y1="4" x2="16" y2="28" />
          <line x1="4" y1="16" x2="28" y2="16" />
        </svg>
      </button>
    </div>
  );
}