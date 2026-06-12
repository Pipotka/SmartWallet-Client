import type { TooltipContentProps } from 'recharts';
import { formatPercent } from '@/utils/formatNumber';
import styles from './CategorizedSpendingTab.module.css';

interface PieChartTooltipProps {
  totalSpending: number;
}

// Recharts injects these props at runtime via React.cloneElement when used as
// the `content` prop of <Tooltip>. They are optional here because the call site
// only passes custom props; recharts fills in the rest at runtime.
type PieChartTooltipRuntimeProps = PieChartTooltipProps &
  Partial<TooltipContentProps<number, string>>;

export function PieChartTooltip({ active, payload, totalSpending }: PieChartTooltipRuntimeProps) {
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
