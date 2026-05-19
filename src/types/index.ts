export interface TransactionEndpoint {
  id: string;
  name: string;
  value: number;
  limitation: number;
  isStorage: boolean;
}

export interface CreateTransactionEndpoint {
  name: string;
  limitation: number;
  isStorage: boolean;
}

export interface UpdateTransactionEndpoint {
  id: string;
  name: string;
  limitation: number;
}

export type NavTab = 'home' | 'analytics' | 'transactions' | 'profile';

export interface UserInfo {
  lastName: string;
  firstName: string;
  middleName: string;
}

export interface RegistrationFormData {
  firstName: string;
  lastName: string;
  middleName: string;
  email: string;
  password: string;
  passwordConfirm: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}