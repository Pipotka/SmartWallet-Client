import { useEffect, useState } from 'react';
import styles from './Toast.module.css';

interface ToastProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onClose?: () => void;
  visible: boolean;
}

export function Toast({ message, actionLabel, onAction, onClose, visible }: ToastProps) {
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (!visible) {
      setClosing(false);
      return;
    }

    const timer = setTimeout(() => {
      setClosing(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, [visible]);

  const handleAnimationEnd = (e: React.AnimationEvent<HTMLDivElement>) => {
    if (!closing) return;
    setClosing(false);
    onClose?.();
  };

  const handleAction = () => {
    try {
      onAction?.();
    } finally {
      onClose?.();
    }
  };

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`${styles.toast}${closing ? ` ${styles.closing}` : ''}`}
      onAnimationEnd={handleAnimationEnd}
    >
      <span className={styles.message}>{message}</span>
      {actionLabel && onAction && (
        <button className={styles.actionButton} onClick={handleAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
