import styles from './ChartSkeleton.module.css';

export function ChartSkeleton() {
  return (
    <div className={styles.skeleton} aria-label="Загрузка данных">
      <div className={styles.chartArea}>
        <div className={styles.shimmerBlock} />
        <div className={`${styles.shimmerLine} ${styles.wide}`} />
        <div className={`${styles.shimmerLine} ${styles.narrow}`} />
        <div className={`${styles.shimmerLine} ${styles.medium}`} />
      </div>
      <div className={styles.legendArea}>
        <div className={styles.shimmerPill} />
        <div className={styles.shimmerPill} />
        <div className={styles.shimmerPill} />
      </div>
    </div>
  );
}
