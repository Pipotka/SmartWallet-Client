import styles from './CategoryLimitBadge.module.css';

interface CategoryLimitBadgeProps {
  remaining: number;
}

export function CategoryLimitBadge({ remaining }: CategoryLimitBadgeProps) {
  return (
    <span className={styles.badge}>
      До лимита: {remaining} ₽
    </span>
  );
}
