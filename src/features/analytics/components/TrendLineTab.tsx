import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useSpendingTrendLine } from '@/api/queries/financial-analytics';
import type { SpendingTrendLineApiRequest } from '@/api/schemas/financial-analytics';
import { TimeUnit } from '@/api/schemas/common';
import { TIME_UNIT_OPTIONS } from '../constants';
import { getColor } from '../colorManager';
import type { DateRange } from '../types';
import { formatCurrency } from '@/utils/formatNumber';
import { DateRangePicker } from './DateRangePicker';
import { ChartSkeleton } from './ChartSkeleton';
import { EmptyChartState } from './EmptyChartState';
import { ChartErrorState } from './ChartErrorState';
import { Select } from '@/components/Select/Select';
import { parseApiError } from '@/api/parseApiError';
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

  const { data, isLoading, isError, error, refetch } = useSpendingTrendLine(request);

  const fieldErrors = isError ? parseApiError(error).fieldErrors : {};
  const generalErrors = isError ? parseApiError(error).generalErrors : [];
  const startDateError = fieldErrors['StartDate'];
  const endDateError = fieldErrors['EndDate'];
  const timeUnitError = fieldErrors['TimeUnit'];
  const generalErrorMessage = generalErrors.length > 0
    ? generalErrors.join('; ')
    : (Object.keys(fieldErrors).length > 0 ? undefined : 'Ошибка загрузки данных');

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
        <DateRangePicker value={dateRange} onChange={setDateRange} startDateError={startDateError} endDateError={endDateError} />
        <Select
          label="Единица времени"
          options={TIME_UNIT_OPTIONS}
          value={String(timeUnit)}
          onChange={handleTimeUnitChange}
          placeholder="Выберите"
          error={!!timeUnitError}
          errorText={timeUnitError}
        />
      </div>

      {isLoading && <ChartSkeleton />}
      {isError && generalErrorMessage && <ChartErrorState message={generalErrorMessage} onRetry={() => refetch()} />}
      {isEmpty && <EmptyChartState onChangePeriod={() => setDateRange(null)} />}

      {!isLoading && !isError && !isEmpty && lineData.length > 0 && (
        <div className={styles.chartContainer}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v: number) => formatCurrency(v)} />
              <Tooltip formatter={(value, name) => [formatCurrency(Number(value)), name as string]} />
              <Legend />
              {categoryNames.map((name) => (
                <Line
                  key={name}
                  type="monotone"
                  dataKey={name}
                  stroke={getColor(name)}
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
