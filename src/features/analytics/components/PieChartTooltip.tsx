import type { TooltipProps } from 'recharts';
import { formatPercent } from '@/utils/formatNumber';
import styles from './CategorizedSpendingTab.module.css';

interface PieChartTooltipProps extends TooltipProps<number, string> {
  totalSpending: number;
}

export function PieChartTooltip({ active, payload, totalSpending }: PieChartTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const entry = payload[0];
  const value = Number(entry.value ?? 0);
  const percentage = totalSpending > 0 ? (value / totalSpending) * 100 : 0;

  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipName}>{entry.name}</p>
      <p className={styles.tooltipValue}>{formatPercent(percentage, { alwaysShowSign: false })}</p>
    </div>
  );
}
