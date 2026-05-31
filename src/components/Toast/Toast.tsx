import styles from './Toast.module.css';
import type { ToastVariant } from '@/store/useToastStore';

interface ToastProps {
  id: string;
  message: string;
  variant: ToastVariant;
  actionLabel?: string;
  onAction?: () => void;
  onClose: (id: string) => void;
}

export function Toast({ id, message, variant, actionLabel, onAction, onClose }: ToastProps) {
  const handleAction = () => {
    onAction?.();
    onClose(id);
  };

  return (
    <div role="status" aria-live="polite" className={`${styles.toast} ${styles[variant]}`}>
      <span className={styles.message}>{message}</span>
      {actionLabel && onAction && (
        <button className={styles.actionButton} onClick={handleAction}>
          {actionLabel}
        </button>
      )}
      <button className={styles.closeButton} onClick={() => onClose(id)} aria-label="Закрыть">
        ×
      </button>
    </div>
  );
}
