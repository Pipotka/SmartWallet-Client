import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import {
  CategorizingSpendingApiResponseSchema,
  type CategorizingSpendingApiRequest,
  CategoryComparativeAnalysisResponseSchema,
  type CategoryComparativeAnalysisApiRequest,
  SpendingTrendLineApiResponseSchema,
  type SpendingTrendLineApiRequest,
} from '@/api/schemas/financial-analytics';

export function useCategorizedSpending(request: CategorizingSpendingApiRequest | null) {
  return useQuery({
    queryKey: ['financial-analytics', 'categorized-spending', request],
    queryFn: ({ signal }) =>
      apiClient<unknown>('/api/financial-analytics/categorized-spending', 'PUT', {
        body: request!,
        signal,
      }),
    select: (data) => CategorizingSpendingApiResponseSchema.parse(data),
    enabled: request !== null,
  });
}

export function useCategoryComparativeAnalysis(request: CategoryComparativeAnalysisApiRequest | null) {
  return useQuery({
    queryKey: ['financial-analytics', 'category-comparative-analysis', request],
    queryFn: ({ signal }) =>
      apiClient<unknown>('/api/financial-analytics/category-comparative-analysis', 'PUT', {
        body: request!,
        signal,
      }),
    select: (data) => CategoryComparativeAnalysisResponseSchema.parse(data),
    enabled: request !== null,
  });
}

export function useSpendingTrendLine(request: SpendingTrendLineApiRequest | null) {
  return useQuery({
    queryKey: ['financial-analytics', 'spending-trend-line', request],
    queryFn: ({ signal }) =>
      apiClient<unknown>('/api/financial-analytics/spending-trend-line', 'PUT', {
        body: request!,
        signal,
      }),
    select: (data) => SpendingTrendLineApiResponseSchema.parse(data),
    enabled: request !== null,
  });
}
