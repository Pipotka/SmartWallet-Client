import styles from './ChartErrorState.module.css';

interface ChartErrorStateProps {
  message?: string;
  onRetry: () => void;
}

export function ChartErrorState({
  message = 'Ошибка загрузки данных',
  onRetry,
}: ChartErrorStateProps) {
  return (
    <div className={styles.error}>
      <svg
        className={styles.icon}
        viewBox="0 0 48 48"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        width="48"
        height="48"
        aria-hidden="true"
      >
        <circle cx="24" cy="24" r="20" />
        <line x1="16" y1="16" x2="32" y2="32" />
        <line x1="32" y1="16" x2="16" y2="32" />
      </svg>
      <p className={styles.message}>{message}</p>
      <button className={styles.retryButton} onClick={onRetry}>
        Повторить
      </button>
    </div>
  );
}
