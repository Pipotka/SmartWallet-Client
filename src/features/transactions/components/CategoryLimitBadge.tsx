import styles from './CategoryLimitBadge.module.css';
import { CurrencyTooltip } from '@/components/CurrencyTooltip/CurrencyTooltip';

interface CategoryLimitBadgeProps {
  remaining: number;
}

export function CategoryLimitBadge({ remaining }: CategoryLimitBadgeProps) {
  return (
    <span className={styles.badge}>
      До лимита: <CurrencyTooltip amount={remaining} />
    </span>
  );
}
