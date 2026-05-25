import { z } from 'zod';

// --- Enums (const objects because erasableSyntaxOnly: true) ---

export const TimeUnit = {
  Day: 0,
  Month: 1,
  Year: 2,
} as const;

export type TimeUnit = (typeof TimeUnit)[keyof typeof TimeUnit];

export const TransactionType = {
  Transfer: 0,
  Expense: 1,
  AdjustmentDecrease: 2,
  AdjustmentIncrease: 3,
  Income: 4,
  ForTest: 5,
} as const;

export type ApiTransactionType = (typeof TransactionType)[keyof typeof TransactionType];

// --- Zod schemas for enums ---

export const TimeUnitSchema = z.nativeEnum(TimeUnit);

export const TransactionTypeSchema = z.nativeEnum(TransactionType);

// --- Error schemas ---

export const ApiExceptionDetailsSchema = z.object({
  statusCode: z.number(),
  message: z.string().nullable(),
});

export type ApiExceptionDetails = z.infer<typeof ApiExceptionDetailsSchema>;

export const ProblemDetailsSchema = z.object({
  type: z.string().nullable(),
  title: z.string().nullable(),
  status: z.number().nullable(),
  detail: z.string().nullable(),
  instance: z.string().nullable(),
});

export type ProblemDetails = z.infer<typeof ProblemDetailsSchema>;
