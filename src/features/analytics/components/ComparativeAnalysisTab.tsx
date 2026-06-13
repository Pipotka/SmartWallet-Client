import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useCategoryComparativeAnalysis } from '@/api/queries/financial-analytics';
import type { CategoryComparativeAnalysisApiRequest } from '@/api/schemas/financial-analytics';
import { TimeUnit } from '@/api/schemas/common';
import { parseApiError } from '@/api/parseApiError';
import { CHART_COLORS } from '../constants';
import { formatCurrency, formatCurrencyShort, formatPercent } from '@/utils/formatNumber';
import { PeriodPicker } from './PeriodPicker';
import { ChartSkeleton } from './ChartSkeleton';
import { EmptyChartState } from './EmptyChartState';
import { ChartErrorState } from './ChartErrorState';
import { ComparativeAnalysisTooltip } from './ComparativeAnalysisTooltip';
import styles from './ComparativeAnalysisTab.module.css';

export function ComparativeAnalysisTab() {
  const [firstPeriod, setFirstPeriod] = useState('');
  const [secondPeriod, setSecondPeriod] = useState('');
  const [timeUnit, setTimeUnit] = useState<TimeUnit>(TimeUnit.Month);
  const [timeUnitCount, setTimeUnitCount] = useState(1);

  const request: CategoryComparativeAnalysisApiRequest | null = useMemo(() => {
    if (firstPeriod === '' || secondPeriod === '') {
      return null;
    }
    return {
      firstPeriod,
      secondPeriod,
      timeUnit,
      timeUnitCount,
    };
  }, [firstPeriod, secondPeriod, timeUnit, timeUnitCount]);

  const { data, isLoading, isError, error, refetch } = useCategoryComparativeAnalysis(request);

  const fieldErrors = isError ? parseApiError(error).fieldErrors : {};
  const generalErrors = isError ? parseApiError(error).generalErrors : [];
  const firstPeriodError = fieldErrors['FirstPeriod'];
  const secondPeriodError = fieldErrors['SecondPeriod'];
  const generalErrorMessage = generalErrors.length > 0
    ? generalErrors.join('; ')
    : (Object.keys(fieldErrors).length > 0 ? undefined : 'Ошибка загрузки данных');

  const barData = useMemo(() => {
    if (!data?.categoryComparativeAnalyses) return [];
    return data.categoryComparativeAnalyses.map((cat) => ({
      name: cat.categoryName ?? 'Без категории',
      'Первый период': cat.firstPeriodAmount,
      'Второй период': cat.secondPeriodAmount,
    }));
  }, [data]);

  const isEmpty =
    !isLoading && !isError && data !== undefined && barData.length === 0;

  const summaryPercentChange = useMemo(() => {
    const first = data?.totalFirstPeriodSpending ?? 0;
    const second = data?.totalSecondPeriodSpending ?? 0;
    if (first === 0 && second === 0) {
      return { text: '0,0\u00A0%', className: styles.summaryPercentNeutral };
    }
    if (first === 0) {
      return { text: '+\u221E\u00A0%', className: styles.summaryPercentPositive };
    }
    const pct = ((second - first) / first) * 100;
    const cls =
      pct > 0
        ? styles.summaryPercentPositive
        : pct < 0
          ? styles.summaryPercentNegative
          : styles.summaryPercentNeutral;
    return { text: formatPercent(pct), className: cls };
  }, [data]);

  return (
    <div className={styles.tab}>
      <PeriodPicker
        firstPeriod={firstPeriod}
        secondPeriod={secondPeriod}
        timeUnit={timeUnit}
        timeUnitCount={timeUnitCount}
        onFirstPeriodChange={setFirstPeriod}
        onSecondPeriodChange={setSecondPeriod}
        onTimeUnitChange={setTimeUnit}
        onTimeUnitCountChange={setTimeUnitCount}
        firstPeriodError={firstPeriodError}
        secondPeriodError={secondPeriodError}
      />

      {isLoading && <ChartSkeleton />}
      {isError && generalErrorMessage && <ChartErrorState message={generalErrorMessage} onRetry={() => refetch()} />}
      {isEmpty && <EmptyChartState />}

      {!isLoading && !isError && !isEmpty && barData.length > 0 && (
        <>
          <div className={styles.summary}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Первый период</span>
              <span className={styles.summaryValue}>
                {formatCurrency(data?.totalFirstPeriodSpending ?? 0)}
              </span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Второй период</span>
              <div className={styles.summaryValueGroup}>
                <span className={styles.summaryValue}>
                  {formatCurrency(data?.totalSecondPeriodSpending ?? 0)}
                </span>
                <span className={`${styles.summaryPercent} ${summaryPercentChange.className}`}>
                  {summaryPercentChange.text}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v: number) => formatCurrencyShort(v)} />
                <Tooltip content={<ComparativeAnalysisTooltip />} />
                <Legend />
                <Bar
                  dataKey="Первый период"
                  fill={CHART_COLORS[0]}
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="Второй период"
                  fill={CHART_COLORS[1]}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
