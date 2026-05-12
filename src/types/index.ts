export interface Wallet {
  id: string;
  name: string;
  limit: number;
  value: number;
  isOverLimit: boolean;
}

export interface Category {
  id: string;
  name: string;
  limit: number;
  isOverLimit: boolean;
}

export type NavTab = 'home' | 'analytics' | 'transactions' | 'profile';

export interface UserInfo {
  lastName: string;
  firstName: string;
  middleName: string;
}