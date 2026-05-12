import { useNavigate } from 'react-router-dom';
import styles from './CategoryCard.module.css';

interface CategoryCardProps {
  id: string;
  name: string;
  amount?: number;
  isOverLimit: boolean;
  type: 'wallet' | 'category';
}

export function CategoryCard({ id, name, amount, isOverLimit, type }: CategoryCardProps) {
  const navigate = useNavigate();

  const cardClass = [
    styles.card,
    type === 'wallet' ? styles.wallet : styles.category,
    isOverLimit ? styles.overLimit : '',
  ]
    .filter(Boolean)
    .join(' ');

  const editPath = type === 'wallet' ? `/wallet/${id}/edit` : `/category/${id}/edit`;

  return (
    <button className={cardClass} onClick={() => navigate(editPath)}>
      <span className={styles.name}>{name}</span>
      {amount !== undefined && <span className={styles.amount}>{amount} ₽</span>}
    </button>
  );
}

interface AddCardProps {
  onClick: () => void;
}

export function AddCard({ onClick }: AddCardProps) {
  return (
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
  );
}