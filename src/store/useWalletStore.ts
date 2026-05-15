import { create } from 'zustand';
import type { TransactionEndpoint, UserInfo } from '@/types';

interface WalletState {
  endpoints: TransactionEndpoint[];
  userInfo: UserInfo;

  addEndpoint: (endpoint: Omit<TransactionEndpoint, 'id' | 'value'>) => void;
  updateEndpoint: (id: string, updates: Partial<Omit<TransactionEndpoint, 'id'>>) => void;
  deleteEndpoint: (id: string) => void;
}

const generateId = (): string => crypto.randomUUID();

export const useWalletStore = create<WalletState>()((set) => ({
  endpoints: [
    { id: '1', name: 'Кошелёк', limitation: 1000, value: 100, isStorage: true },
    { id: '2', name: 'Карта', limitation: 500, value: 600, isStorage: true },
    { id: '3', name: 'Сбербанк', limitation: 2000, value: 350, isStorage: true },
    { id: '4', name: 'Тинькофф', limitation: 3000, value: 4200, isStorage: true },
    { id: '5', name: 'Наличные', limitation: 5000, value: 1200, isStorage: true },
    { id: '6', name: 'Продукты', limitation: 5000, value: 100, isStorage: false },
    { id: '7', name: 'Транспорт', limitation: 3000, value: 400, isStorage: false },
    { id: '8', name: 'Очень очень очень длинное название категории', limitation: 2000, value: 320, isStorage: false },
    { id: '9', name: 'Комунальные услуги', limitation: 4000, value: 101, isStorage: false },
    { id: '10', name: 'Развлечения', limitation: 1500, value: 0, isStorage: false },
    { id: '11', name: 'Одежда', limitation: 3000, value: 0, isStorage: false },
    { id: '12', name: 'Здоровье', limitation: 2500, value: 0, isStorage: false },
    { id: '13', name: 'Образование', limitation: 1000, value: 0, isStorage: false },
    { id: '14', name: 'Подарки', limitation: 2000, value: 0, isStorage: false },
  ],
  userInfo: {
    lastName: 'Абдулгаджиев',
    firstName: 'Насрудин',
    middleName: 'Магомедович',
  },

  addEndpoint: (endpoint) =>
    set((state) => ({
      endpoints: [
        ...state.endpoints,
        {
          ...endpoint,
          id: generateId(),
          value: 0,
        },
      ],
    })),

  updateEndpoint: (id, updates) =>
    set((state) => ({
      endpoints: state.endpoints.map((e) => {
        if (e.id !== id) return e;
        return { ...e, ...updates };
      }),
    })),

  deleteEndpoint: (id) =>
    set((state) => ({
      endpoints: state.endpoints.filter((e) => e.id !== id),
    })),
}));

export function getWallets(): TransactionEndpoint[] {
  return useWalletStore.getState().endpoints.filter((e) => e.isStorage);
}

export function getCategories(): TransactionEndpoint[] {
  return useWalletStore.getState().endpoints.filter((e) => !e.isStorage);
}
