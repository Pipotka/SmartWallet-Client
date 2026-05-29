import { Header } from '@/components/Header/Header';
import { BottomNav } from '@/components/BottomNav/BottomNav';
import { AnalyticsTabs } from '@/features/analytics/components/AnalyticsTabs';
import styles from './AnalyticsPage.module.css';

export function AnalyticsPage() {
  return (
    <div className={styles.page}>
      <Header pageTitle="Аналитика" />
      <main className={styles.content}>
        <AnalyticsTabs />
      </main>
      <BottomNav />
    </div>
  );
}
