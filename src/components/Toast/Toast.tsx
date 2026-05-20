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
      onClose?.();
    }, 3000);

    return () => clearTimeout(timer);
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className={`${styles.toast}${closing ? ` ${styles.closing}` : ''}`}
      onAnimationEnd={(e) => {
        if (e.animationName === 'fade-out') {
          setClosing(false);
        }
      }}
    >
      <span className={styles.message}>{message}</span>
      {actionLabel && onAction && (
        <button className={styles.actionButton} onClick={() => { onAction?.(); onClose?.(); }}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
