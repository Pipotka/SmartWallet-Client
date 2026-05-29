import styles from './EmptyChartState.module.css';

interface EmptyChartStateProps {
  message?: string;
  onChangePeriod?: () => void;
}

export function EmptyChartState({
  message = 'Нет данных за выбранный период',
  onChangePeriod,
}: EmptyChartStateProps) {
  return (
    <div className={styles.empty}>
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
        <rect x="6" y="30" width="8" height="12" rx="1" />
        <rect x="20" y="20" width="8" height="22" rx="1" />
        <rect x="34" y="10" width="8" height="32" rx="1" />
      </svg>
      <p className={styles.message}>{message}</p>
      {onChangePeriod && (
        <button className={styles.changeButton} onClick={onChangePeriod}>
          Изменить период
        </button>
      )}
    </div>
  );
}
