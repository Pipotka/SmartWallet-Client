import type { TooltipProps } from 'recharts';
import { formatCurrency, formatPercent } from '@/utils/formatNumber';
import styles from './ComparativeAnalysisTab.module.css';

type ComparativeTooltipProps = TooltipProps<number, string>;

export function ComparativeAnalysisTooltip({ active, payload, label }: ComparativeTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const firstPeriodEntry = payload.find((p) => p.name === 'Первый период');
  const secondPeriodEntry = payload.find((p) => p.name === 'Второй период');

  const firstPeriodValue = Number(firstPeriodEntry?.value ?? 0);
  const secondPeriodValue = Number(secondPeriodEntry?.value ?? 0);

  let percentageText: string;
  if (firstPeriodValue === 0 && secondPeriodValue === 0) {
    percentageText = '0,0\u00A0%';
  } else if (firstPeriodValue === 0) {
    percentageText = '+\u221E\u00A0%';
  } else {
    const percentage = ((secondPeriodValue - firstPeriodValue) / firstPeriodValue) * 100;
    percentageText = formatPercent(percentage);
  }

  const percentColorClass =
    secondPeriodValue > firstPeriodValue
      ? styles.tooltipPercentPositive
      : secondPeriodValue < firstPeriodValue
        ? styles.tooltipPercentNegative
        : styles.tooltipPercentNeutral;

  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipHeader}>{label}</p>
      <div className={styles.tooltipRow}>
        <span className={styles.tooltipLabel}>Первый период</span>
        <span className={styles.tooltipValue}>{formatCurrency(firstPeriodValue)}</span>
      </div>
      <div className={styles.tooltipRow}>
        <span className={styles.tooltipLabel}>Второй период</span>
        <span className={styles.tooltipValue}>{formatCurrency(secondPeriodValue)}</span>
      </div>
      <div className={styles.tooltipDivider} />
      <div className={styles.tooltipRow}>
        <span className={styles.tooltipLabel}>Изменение</span>
        <span className={`${styles.tooltipPercent} ${percentColorClass}`}>{percentageText}</span>
      </div>
    </div>
  );
}
