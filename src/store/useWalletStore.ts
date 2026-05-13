import { create } from 'zustand';
import type { Wallet, Category, UserInfo } from '@/types';

interface WalletState {
  wallets: Wallet[];
  categories: Category[];
  userInfo: UserInfo;

  addWallet: (wallet: Omit<Wallet, 'id' | 'isOverLimit'>) => void;
  updateWallet: (id: string, updates: Partial<Omit<Wallet, 'id'>>) => void;
  deleteWallet: (id: string) => void;

  addCategory: (category: Omit<Category, 'id' | 'isOverLimit'>) => void;
  updateCategory: (id: string, updates: Partial<Omit<Category, 'id'>>) => void;
  deleteCategory: (id: string) => void;
}

const generateId = (): string => crypto.randomUUID();

export const useWalletStore = create<WalletState>((set) => ({
  wallets: [
    { id: '1', name: 'Кошелёк', limit: 1000, value: 100, isOverLimit: false },
    { id: '2', name: 'Карта', limit: 500, value: 600, isOverLimit: true },
    { id: '3', name: 'Сбербанк', limit: 2000, value: 350, isOverLimit: false },
    { id: '4', name: 'Тинькофф', limit: 3000, value: 4200, isOverLimit: true },
    { id: '5', name: 'Наличные', limit: 5000, value: 1200, isOverLimit: false },
  ],
  categories: [
    { id: '1', name: 'Продукты', limit: 5000, isOverLimit: false },
    { id: '2', name: 'Транспорт', limit: 3000, isOverLimit: false },
    { id: '3', name: 'Очень очень очень длинное название категории', limit: 2000, isOverLimit: true },
    { id: '4', name: 'Комунальные услуги', limit: 4000, isOverLimit: false },
    { id: '5', name: 'Развлечения', limit: 1500, isOverLimit: true },
    { id: '6', name: 'Одежда', limit: 3000, isOverLimit: false },
    { id: '7', name: 'Здоровье', limit: 2500, isOverLimit: false },
    { id: '8', name: 'Образование', limit: 1000, isOverLimit: false },
    { id: '9', name: 'Подарки', limit: 2000, isOverLimit: true },
  ],
  userInfo: {
    lastName: 'Абдулгаджиев',
    firstName: 'Насрудин',
    middleName: 'Магомедович',
  },

  addWallet: (wallet) =>
    set((state) => ({
      wallets: [
        ...state.wallets,
        {
          ...wallet,
          id: generateId(),
          isOverLimit: wallet.value > wallet.limit,
        },
      ],
    })),

  updateWallet: (id, updates) =>
    set((state) => ({
      wallets: state.wallets.map((w) => {
        if (w.id !== id) return w;
        const updated = { ...w, ...updates };
        return { ...updated, isOverLimit: updated.value > updated.limit };
      }),
    })),

  deleteWallet: (id) =>
    set((state) => ({
      wallets: state.wallets.filter((w) => w.id !== id),
    })),

  addCategory: (category) =>
    set((state) => ({
      categories: [
        ...state.categories,
        { ...category, id: generateId(), isOverLimit: false },
      ],
    })),

  updateCategory: (id, updates) =>
    set((state) => ({
      categories: state.categories.map((c) => {
        if (c.id !== id) return c;
        return { ...c, ...updates };
      }),
    })),

  deleteCategory: (id) =>
    set((state) => ({
      categories: state.categories.filter((c) => c.id !== id),
    })),
}));