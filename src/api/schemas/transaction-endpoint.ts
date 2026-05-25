import { z } from 'zod';

export const TransactionEndpointApiModelSchema = z.object({
  id: z.string().uuid(),
  name: z.string().nullable(),
  value: z.number(),
  limitation: z.number().nullable(),
  isStorage: z.boolean(),
});

export type TransactionEndpointApiModel = z.infer<typeof TransactionEndpointApiModelSchema>;

export const TransactionEndpointListSchema = z.array(TransactionEndpointApiModelSchema);

export const CreateTransactionEndpointApiModelSchema = z.object({
  name: z.string().nullable(),
  limitation: z.number().nullable(),
  isStorage: z.boolean(),
});

export type CreateTransactionEndpointApiModel = z.infer<typeof CreateTransactionEndpointApiModelSchema>;

export const UpdateTransactionEndpointApiModelSchema = z.object({
  id: z.string().uuid(),
  name: z.string().nullable(),
  limitation: z.number().nullable(),
});

export type UpdateTransactionEndpointApiModel = z.infer<typeof UpdateTransactionEndpointApiModelSchema>;

export const DeleteTransactionEndpointApiModelSchema = z.object({
  id: z.string().uuid(),
});

export type DeleteTransactionEndpointApiModel = z.infer<typeof DeleteTransactionEndpointApiModelSchema>;
