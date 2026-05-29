import type { TimeUnit } from '@/api/schemas/common';

export type TabId = 'categorized' | 'comparative' | 'trend';

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface CategorizedSpendingFormState {
  dateRange: DateRange | null;
}

export interface ComparativeAnalysisFormState {
  firstPeriod: string;
  secondPeriod: string;
  timeUnit: TimeUnit;
  timeUnitCount: number;
}

export interface TrendLineFormState {
  dateRange: DateRange | null;
  timeUnit: TimeUnit;
}
