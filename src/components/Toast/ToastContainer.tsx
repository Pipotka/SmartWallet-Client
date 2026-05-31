import { useToastStore } from '@/store/useToastStore';
import { Toast } from './Toast';
import styles from './ToastContainer.module.css';

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className={styles.container}>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          message={toast.message}
          variant={toast.variant}
          actionLabel={toast.actionLabel}
          onAction={toast.onAction}
          onClose={removeToast}
        />
      ))}
    </div>
  );
}
