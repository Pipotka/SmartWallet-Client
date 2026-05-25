import { z } from 'zod';
import { TransactionTypeSchema } from '@/api/schemas/common';

export const TransactionApiModelSchema = z.object({
  id: z.string().uuid(),
  sourceAccountId: z.string().uuid().nullable(),
  destinationAccountId: z.string().uuid().nullable(),
  type: TransactionTypeSchema,
  amount: z.number(),
  madeAt: z.string(),
});

export type TransactionApiModel = z.infer<typeof TransactionApiModelSchema>;

export const TransactionListSchema = z.array(TransactionApiModelSchema);

export const CreateTransactionApiModelSchema = z.object({
  sourceAccountId: z.string().uuid().nullable(),
  destinationAccountId: z.string().uuid().nullable(),
  amount: z.number(),
});

export type CreateTransactionApiModel = z.infer<typeof CreateTransactionApiModelSchema>;

export const DeleteTransactionApiModelSchema = z.object({
  id: z.string().uuid(),
});

export type DeleteTransactionApiModel = z.infer<typeof DeleteTransactionApiModelSchema>;
