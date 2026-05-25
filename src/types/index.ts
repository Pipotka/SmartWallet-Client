import type { TransactionEndpointApiModel } from '@/api/schemas/transaction-endpoint';
import type { CreateTransactionEndpointApiModel } from '@/api/schemas/transaction-endpoint';
import type { UpdateTransactionEndpointApiModel } from '@/api/schemas/transaction-endpoint';
import type { UserApiModel } from '@/api/schemas/user';

export type TransactionEndpoint = TransactionEndpointApiModel;
export type CreateTransactionEndpoint = CreateTransactionEndpointApiModel;
export type UpdateTransactionEndpoint = UpdateTransactionEndpointApiModel;
export type UserInfo = Pick<UserApiModel, 'firstName' | 'lastName' | 'patronymic'>;

export type NavTab = 'home' | 'analytics' | 'transactions' | 'profile';

export interface RegistrationFormData {
  firstName: string;
  lastName: string;
  patronymic: string;
  email: string;
  password: string;
  passwordConfirm: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export type { TransactionType } from '@/features/transactions/types';
export type { Transaction } from '@/features/transactions/types';
export type { CreateTransactionDTO } from '@/features/transactions/types';
