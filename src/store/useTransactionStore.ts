import { create } from 'zustand';
import type { Transaction, CreateTransactionDTO } from '@/features/transactions/types';
import { getTransactionType } from '@/features/transactions/utils';
import { getWallets, getCategories } from '@/store/useWalletStore';

interface TransactionState {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  optimisticDeleted: Set<string>;

  fetchTransactions: () => Promise<void>;
  createTransaction: (dto: CreateTransactionDTO) => Promise<void>;
  deleteTransaction: (id: string) => Promise<string>;
  undoDelete: (id: string) => void;
}

const generateId = (): string => crypto.randomUUID();

const pendingDeletionTimers = new Map<string, ReturnType<typeof setTimeout>>();

const UNDO_WINDOW_MS = 3000;
const MOCK_FETCH_DELAY_MS = 500;
const MOCK_CREATE_DELAY_MS = 300;

const mockTransactions: Transaction[] = [
  {
    id: 'mock-tx-001',
    sourceId: '1',
    destinationId: '6',
    amount: 1500,
    type: 'expense',
    date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-tx-002',
    sourceId: '2',
    destinationId: '7',
    amount: 350,
    type: 'expense',
    date: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-tx-003',
    sourceId: '1',
    destinationId: '3',
    amount: 2000,
    type: 'transfer',
    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-tx-004',
    sourceId: '4',
    destinationId: '5',
    amount: 5000,
    type: 'transfer',
    date: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-tx-005',
    sourceId: null,
    destinationId: '1',
    amount: 10000,
    type: 'income',
    date: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-tx-006',
    sourceId: null,
    destinationId: '2',
    amount: 25000,
    type: 'income',
    date: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-tx-007',
    sourceId: '3',
    destinationId: null,
    amount: 800,
    type: 'balance_decrease',
    date: new Date(Date.now() - 120 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-tx-008',
    sourceId: '5',
    destinationId: null,
    amount: 1200,
    type: 'balance_decrease',
    date: new Date(Date.now() - 144 * 60 * 60 * 1000).toISOString(),
  },
];

export const useTransactionStore = create<TransactionState>()((set, get) => ({
  transactions: [],
  isLoading: false,
  error: null,
  optimisticDeleted: new Set<string>(),

  fetchTransactions: async () => {
    set({ isLoading: true, error: null });
    try {
      await new Promise((resolve) => setTimeout(resolve, MOCK_FETCH_DELAY_MS));
      set({ transactions: mockTransactions, isLoading: false });
    } catch {
      set({ error: 'Failed to fetch transactions', isLoading: false });
    }
  },

  createTransaction: async (dto: CreateTransactionDTO) => {
    set({ isLoading: true, error: null });
    try {
      await new Promise((resolve) => setTimeout(resolve, MOCK_CREATE_DELAY_MS));
      const wallets = getWallets();
      const categories = getCategories();
      const type = getTransactionType(dto.sourceId, dto.destinationId, wallets, categories);

      if (!type) {
        set({ error: 'Invalid transaction type', isLoading: false });
        return;
      }

      const newTransaction: Transaction = {
        id: generateId(),
        sourceId: dto.sourceId,
        destinationId: dto.destinationId,
        amount: dto.amount,
        type,
        date: new Date().toISOString(),
      };

      set((state) => ({
        transactions: [newTransaction, ...state.transactions],
        isLoading: false,
      }));
    } catch {
      set({ error: 'Failed to create transaction', isLoading: false });
    }
  },

  deleteTransaction: async (id: string) => {
    if (pendingDeletionTimers.has(id)) return id;

    set((state) => {
      const newOptimisticDeleted = new Set(state.optimisticDeleted);
      newOptimisticDeleted.add(id);
      return { optimisticDeleted: newOptimisticDeleted };
    });

    const timer = setTimeout(() => {
      set((state) => {
        const newOptimisticDeleted = new Set(state.optimisticDeleted);
        newOptimisticDeleted.delete(id);
        pendingDeletionTimers.delete(id);
        return {
          transactions: state.transactions.filter((t) => t.id !== id),
          optimisticDeleted: newOptimisticDeleted,
        };
      });
    }, UNDO_WINDOW_MS);

    pendingDeletionTimers.set(id, timer);

    return id;
  },

  undoDelete: (id: string) => {
    const timer = pendingDeletionTimers.get(id);
    if (timer) {
      clearTimeout(timer);
      pendingDeletionTimers.delete(id);
    }

    set((state) => {
      const newOptimisticDeleted = new Set(state.optimisticDeleted);
      newOptimisticDeleted.delete(id);
      return { optimisticDeleted: newOptimisticDeleted, error: null };
    });
  },
}));
