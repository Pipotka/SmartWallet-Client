import { useState } from 'react';
import { TABS } from '../constants';
import type { TabId } from '../types';
import { CategorizedSpendingTab } from './CategorizedSpendingTab';
import { ComparativeAnalysisTab } from './ComparativeAnalysisTab';
import { TrendLineTab } from './TrendLineTab';
import styles from './AnalyticsTabs.module.css';

const TAB_COMPONENTS: Record<TabId, React.ComponentType> = {
  categorized: CategorizedSpendingTab,
  comparative: ComparativeAnalysisTab,
  trend: TrendLineTab,
};

export function AnalyticsTabs() {
  const [activeTab, setActiveTab] = useState<TabId>('categorized');

  const ActiveComponent = TAB_COMPONENTS[activeTab];

  return (
    <div className={styles.container}>
      <div className={styles.tabBar} role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            id={`analytics-tab-${tab.id}`}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls="analytics-tabpanel"
            tabIndex={activeTab === tab.id ? 0 : -1}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab.id)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div
        className={styles.tabPanel}
        role="tabpanel"
        id="analytics-tabpanel"
        aria-labelledby={`analytics-tab-${activeTab}`}
      >
        <ActiveComponent />
      </div>
    </div>
  );
}
