import { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useCategorizedSpending } from '@/api/queries/financial-analytics';
import type { CategorizingSpendingApiRequest } from '@/api/schemas/financial-analytics';
import { CHART_COLORS } from '../constants';
import type { DateRange } from '../types';
import { DateRangePicker } from './DateRangePicker';
import { ChartSkeleton } from './ChartSkeleton';
import { EmptyChartState } from './EmptyChartState';
import { ChartErrorState } from './ChartErrorState';
import styles from './CategorizedSpendingTab.module.css';

interface PieEntry {
  name: string;
  value: number;
  colorIndex: number;
}

function formatAmount(amount: number): string {
  return amount.toLocaleString('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function CategorizedSpendingTab() {
  const [dateRange, setDateRange] = useState<DateRange | null>(null);

  const request: CategorizingSpendingApiRequest | null = useMemo(() => {
    if (
      dateRange === null ||
      dateRange.startDate === '' ||
      dateRange.endDate === ''
    ) {
      return null;
    }
    if (dateRange.endDate < dateRange.startDate) {
      return null;
    }
    return { startDate: dateRange.startDate, endDate: dateRange.endDate };
  }, [dateRange]);

  const { data, isLoading, isError, refetch } = useCategorizedSpending(request);

  const pieData: PieEntry[] = useMemo(() => {
    if (!data?.categories) return [];
    return data.categories.map((cat, index) => ({
      name: cat.categoryName ?? 'Без категории',
      value: cat.totalAmount,
      colorIndex: index,
    }));
  }, [data]);

  const isEmpty = !isLoading && !isError && data !== undefined && pieData.length === 0;

  if (isLoading) {
    return (
      <div className={styles.tab}>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
        <ChartSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div className={styles.tab}>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
        <ChartErrorState onRetry={() => refetch()} />
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className={styles.tab}>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
        <EmptyChartState onChangePeriod={() => setDateRange(null)} />
      </div>
    );
  }

  return (
    <div className={styles.tab}>
      <DateRangePicker value={dateRange} onChange={setDateRange} />

      {pieData.length > 0 && (
        <div className={styles.chartContainer}>
          <div className={styles.pieChartWrapper}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius="55%"
                  outerRadius="80%"
                  dataKey="value"
                  nameKey="name"
                  paddingAngle={2}
                >
                  {pieData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={CHART_COLORS[entry.colorIndex % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => formatAmount(Number(value))}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className={styles.centerLabel}>
              <p className={styles.centerLabelTitle}>Итого</p>
              <p className={styles.centerLabelValue}>
                {data ? formatAmount(data.totalSpending) : '0'}
              </p>
            </div>
          </div>

          <div className={styles.legend}>
            {pieData.map((entry) => (
              <div key={entry.name} className={styles.legendItem}>
                <div
                  className={styles.legendColor}
                  style={{
                    backgroundColor:
                      CHART_COLORS[entry.colorIndex % CHART_COLORS.length],
                  }}
                />
                <span className={styles.legendName}>{entry.name}</span>
                <span className={styles.legendAmount}>
                  {formatAmount(entry.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
