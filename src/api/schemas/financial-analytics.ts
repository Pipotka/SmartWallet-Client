import { z } from 'zod';
import { TimeUnitSchema } from '@/api/schemas/common';

// --- Categorized Spending ---

export const CategorizingSpendingApiRequestSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
});

export type CategorizingSpendingApiRequest = z.infer<typeof CategorizingSpendingApiRequestSchema>;

export const CategorySpendingItemApiModelSchema = z.object({
  categoryId: z.string().uuid(),
  categoryName: z.string().nullable(),
  totalAmount: z.number(),
});

export type CategorySpendingItemApiModel = z.infer<typeof CategorySpendingItemApiModelSchema>;

export const CategorizingSpendingApiResponseSchema = z.object({
  totalSpending: z.number(),
  categories: z.array(CategorySpendingItemApiModelSchema).nullable(),
});

export type CategorizingSpendingApiResponse = z.infer<typeof CategorizingSpendingApiResponseSchema>;

// --- Category Comparative Analysis ---

export const CategoryComparativeAnalysisApiRequestSchema = z.object({
  firstPeriod: z.string(),
  secondPeriod: z.string(),
  timeUnit: TimeUnitSchema,
  timeUnitCount: z.number(),
});

export type CategoryComparativeAnalysisApiRequest = z.infer<typeof CategoryComparativeAnalysisApiRequestSchema>;

export const CategoryComparativeAnalysisApiModelSchema = z.object({
  categoryId: z.string().uuid(),
  categoryName: z.string().nullable(),
  secondPeriodAmount: z.number(),
  firstPeriodAmount: z.number(),
});

export type CategoryComparativeAnalysisApiModel = z.infer<typeof CategoryComparativeAnalysisApiModelSchema>;

export const CategoryComparativeAnalysisResponseSchema = z.object({
  totalSecondPeriodSpending: z.number(),
  totalFirstPeriodSpending: z.number(),
  categoryComparativeAnalyses: z.array(CategoryComparativeAnalysisApiModelSchema).nullable(),
});

export type CategoryComparativeAnalysisResponse = z.infer<typeof CategoryComparativeAnalysisResponseSchema>;

// --- Spending Trend Line ---

export const SpendingTrendLineApiRequestSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  timeUnit: TimeUnitSchema,
});

export type SpendingTrendLineApiRequest = z.infer<typeof SpendingTrendLineApiRequestSchema>;

export const SpendingTrendLineNodeApiModelSchema = z.object({
  label: z.string().nullable(),
  amount: z.number(),
});

export type SpendingTrendLineNodeApiModel = z.infer<typeof SpendingTrendLineNodeApiModelSchema>;

export const SpendingTrendLineCategoryApiModelSchema = z.object({
  name: z.string().nullable(),
  nodes: z.array(SpendingTrendLineNodeApiModelSchema).nullable(),
});

export type SpendingTrendLineCategoryApiModel = z.infer<typeof SpendingTrendLineCategoryApiModelSchema>;

export const SpendingTrendLineApiResponseSchema = z.object({
  labels: z.array(z.string()).nullable(),
  categories: z.array(SpendingTrendLineCategoryApiModelSchema).nullable(),
});

export type SpendingTrendLineApiResponse = z.infer<typeof SpendingTrendLineApiResponseSchema>;
