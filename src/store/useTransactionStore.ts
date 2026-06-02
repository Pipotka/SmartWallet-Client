import { create } from 'zustand';

interface TransactionUiState {
  optimisticDeleted: Set<string>;
  markOptimisticDeleted: (id: string, onConfirm?: () => void) => void;
  undoDelete: (id: string) => void;
  confirmDeleted: (id: string) => void;
}

const pendingDeletionTimers = new Map<string, ReturnType<typeof setTimeout>>();
const pendingDeletionCallbacks = new Map<string, () => void>();
const UNDO_WINDOW_MS = 3000;

export const useTransactionStore = create<TransactionUiState>()((set) => ({
  optimisticDeleted: new Set<string>(),

  markOptimisticDeleted: (id: string, onConfirm?: () => void) => {
    if (pendingDeletionTimers.has(id)) return;

    set((state) => {
      const newSet = new Set(state.optimisticDeleted);
      newSet.add(id);
      return { optimisticDeleted: newSet };
    });

    if (onConfirm) {
      pendingDeletionCallbacks.set(id, onConfirm);
    }

    const timer = setTimeout(() => {
      pendingDeletionTimers.delete(id);
      const callback = pendingDeletionCallbacks.get(id);
      if (callback) {
        pendingDeletionCallbacks.delete(id);
        callback();
      }
    }, UNDO_WINDOW_MS);

    pendingDeletionTimers.set(id, timer);
  },

  undoDelete: (id: string) => {
    const timer = pendingDeletionTimers.get(id);
    if (timer) {
      clearTimeout(timer);
      pendingDeletionTimers.delete(id);
    }
    pendingDeletionCallbacks.delete(id);

    set((state) => {
      const newSet = new Set(state.optimisticDeleted);
      newSet.delete(id);
      return { optimisticDeleted: newSet };
    });
  },

  confirmDeleted: (id: string) => {
    const timer = pendingDeletionTimers.get(id);
    if (timer) {
      clearTimeout(timer);
      pendingDeletionTimers.delete(id);
    }
    pendingDeletionCallbacks.delete(id);

    set((state) => {
      const newSet = new Set(state.optimisticDeleted);
      newSet.delete(id);
      return { optimisticDeleted: newSet };
    });
  },
}));
