import { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useCategorizedSpending } from '@/api/queries/financial-analytics';
import type { CategorizingSpendingApiRequest } from '@/api/schemas/financial-analytics';
import { parseApiError } from '@/api/parseApiError';
import { getColor } from '../colorManager';
import { formatCurrency } from '@/utils/formatNumber';
import type { DateRange } from '../types';
import { DateRangePicker } from './DateRangePicker';
import { ChartSkeleton } from './ChartSkeleton';
import { EmptyChartState } from './EmptyChartState';
import { ChartErrorState } from './ChartErrorState';
import { PieChartTooltip } from './PieChartTooltip';
import styles from './CategorizedSpendingTab.module.css';

interface PieEntry {
  name: string;
  value: number;
  categoryId: string;
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

  const { data, isLoading, isError, error, refetch } = useCategorizedSpending(request);

  const fieldErrors = isError ? parseApiError(error).fieldErrors : {};
  const generalErrors = isError ? parseApiError(error).generalErrors : [];
  const startDateError = fieldErrors['StartDate'];
  const endDateError = fieldErrors['EndDate'];
  const generalErrorMessage = generalErrors.length > 0
    ? generalErrors.join('; ')
    : (Object.keys(fieldErrors).length > 0 ? undefined : 'Ошибка загрузки данных');

  const pieData: PieEntry[] = useMemo(() => {
    if (!data?.categories) return [];
    return data.categories.map((cat) => ({
      name: cat.categoryName ?? 'Без категории',
      value: cat.totalAmount,
      categoryId: cat.categoryId,
    }));
  }, [data]);

  const isEmpty = !isLoading && !isError && data !== undefined && pieData.length === 0;

  if (isLoading) {
    return (
      <div className={styles.tab}>
        <DateRangePicker value={dateRange} onChange={setDateRange} startDateError={startDateError} endDateError={endDateError} />
        <ChartSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div className={styles.tab}>
        <DateRangePicker value={dateRange} onChange={setDateRange} startDateError={startDateError} endDateError={endDateError} />
        <ChartErrorState message={generalErrorMessage} onRetry={() => refetch()} />
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className={styles.tab}>
        <DateRangePicker value={dateRange} onChange={setDateRange} startDateError={startDateError} endDateError={endDateError} />
        <EmptyChartState onChangePeriod={() => setDateRange(null)} />
      </div>
    );
  }

  return (
    <div className={styles.tab}>
      <DateRangePicker value={dateRange} onChange={setDateRange} startDateError={startDateError} endDateError={endDateError} />

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
                      fill={getColor(entry.categoryId)}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={<PieChartTooltip totalSpending={data?.totalSpending ?? 0} />}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className={styles.centerLabel}>
              <p className={styles.centerLabelTitle}>Итого</p>
              <p className={styles.centerLabelValue}>
                {data ? formatCurrency(data.totalSpending) : '0'}
              </p>
            </div>
          </div>

          <div className={styles.legend}>
            {pieData.map((entry) => (
              <div key={entry.name} className={styles.legendItem}>
                <div
                  className={styles.legendColor}
                  style={{
                    backgroundColor: getColor(entry.categoryId),
                  }}
                />
                <span className={styles.legendName}>{entry.name}</span>
                <span className={styles.legendAmount}>
                  {formatCurrency(entry.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
