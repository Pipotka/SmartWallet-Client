import { create } from 'zustand';

export type ToastVariant = 'success' | 'error';

export interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
  actionLabel?: string;
  onAction?: () => void;
}

interface ToastState {
  toasts: ToastItem[];
  addToast: (message: string, variant: ToastVariant, options?: { actionLabel?: string; onAction?: () => void }) => string;
  removeToast: (id: string) => void;
  showSuccess: (message: string) => string;
  showError: (message: string) => string;
}

let nextId = 0;

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  addToast: (message, variant, options) => {
    const id = `toast-${nextId++}`;
    const toast: ToastItem = {
      id,
      message,
      variant,
      actionLabel: options?.actionLabel,
      onAction: options?.onAction,
    };

    set((state) => ({ toasts: [...state.toasts, toast] }));

    setTimeout(() => {
      get().removeToast(id);
    }, 3000);

    return id;
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  showSuccess: (message) => get().addToast(message, 'success'),
  showError: (message) => get().addToast(message, 'error'),
}));
