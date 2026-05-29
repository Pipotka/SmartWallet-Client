import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useCategoryComparativeAnalysis } from '@/api/queries/financial-analytics';
import type { CategoryComparativeAnalysisApiRequest } from '@/api/schemas/financial-analytics';
import { TimeUnit } from '@/api/schemas/common';
import { CHART_COLORS } from '../constants';
import { formatAmount } from '../utils/formatAmount';
import { PeriodPicker } from './PeriodPicker';
import { ChartSkeleton } from './ChartSkeleton';
import { EmptyChartState } from './EmptyChartState';
import { ChartErrorState } from './ChartErrorState';
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

  const { data, isLoading, isError, refetch } = useCategoryComparativeAnalysis(request);

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
      />

      {isLoading && <ChartSkeleton />}
      {isError && <ChartErrorState onRetry={() => refetch()} />}
      {isEmpty && <EmptyChartState />}

      {!isLoading && !isError && !isEmpty && barData.length > 0 && (
        <>
          <div className={styles.summary}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Первый период</span>
              <span className={styles.summaryValue}>
                {formatAmount(data?.totalFirstPeriodSpending ?? 0)}
              </span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Второй период</span>
              <span className={styles.summaryValue}>
                {formatAmount(data?.totalSecondPeriodSpending ?? 0)}
              </span>
            </div>
          </div>

          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => formatAmount(Number(value))} />
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
