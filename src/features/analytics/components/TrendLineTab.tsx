import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useSpendingTrendLine } from '@/api/queries/financial-analytics';
import type { SpendingTrendLineApiRequest } from '@/api/schemas/financial-analytics';
import { TimeUnit } from '@/api/schemas/common';
import { CHART_COLORS, TIME_UNIT_OPTIONS } from '../constants';
import type { DateRange } from '../types';
import { formatAmount } from '../utils/formatAmount';
import { DateRangePicker } from './DateRangePicker';
import { ChartSkeleton } from './ChartSkeleton';
import { EmptyChartState } from './EmptyChartState';
import { ChartErrorState } from './ChartErrorState';
import { Select } from '@/components/Select/Select';
import styles from './TrendLineTab.module.css';

export function TrendLineTab() {
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [timeUnit, setTimeUnit] = useState<TimeUnit>(TimeUnit.Month);

  const request: SpendingTrendLineApiRequest | null = useMemo(() => {
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
    return {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      timeUnit,
    };
  }, [dateRange, timeUnit]);

  const { data, isLoading, isError, refetch } = useSpendingTrendLine(request);

  const lineData = useMemo(() => {
    if (!data?.labels || !data?.categories) return [];
    const labels = data.labels;
    return labels.map((label, labelIndex) => {
      const entry: Record<string, string | number> = { label: label ?? '' };
      for (const cat of data.categories ?? []) {
        const name = cat.name ?? 'Без категории';
        const amount =
          cat.nodes && cat.nodes[labelIndex]
            ? cat.nodes[labelIndex].amount
            : 0;
        entry[name] = amount;
      }
      return entry;
    });
  }, [data]);

  const categoryNames = useMemo(() => {
    if (!data?.categories) return [];
    return (data.categories ?? []).map((cat) => cat.name ?? 'Без категории');
  }, [data]);

  const isEmpty =
    !isLoading && !isError && data !== undefined && lineData.length === 0;

  const handleTimeUnitChange = (value: string | null) => {
    if (value !== null) {
      setTimeUnit(Number(value) as TimeUnit);
    }
  };

  return (
    <div className={styles.tab}>
      <div className={styles.controls}>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
        <Select
          label="Единица времени"
          options={TIME_UNIT_OPTIONS}
          value={String(timeUnit)}
          onChange={handleTimeUnitChange}
          placeholder="Выберите"
        />
      </div>

      {isLoading && <ChartSkeleton />}
      {isError && <ChartErrorState onRetry={() => refetch()} />}
      {isEmpty && <EmptyChartState onChangePeriod={() => setDateRange(null)} />}

      {!isLoading && !isError && !isEmpty && lineData.length > 0 && (
        <div className={styles.chartContainer}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v: number) => formatAmount(v)} />
              <Tooltip formatter={(value, name) => [formatAmount(Number(value)), name as string]} />
              <Legend />
              {categoryNames.map((name, index) => (
                <Line
                  key={`${name}-${index}`}
                  type="monotone"
                  dataKey={name}
                  stroke={CHART_COLORS[index % CHART_COLORS.length]}
                  dot={false}
                  strokeWidth={2}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
