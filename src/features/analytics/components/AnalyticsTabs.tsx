import { useState } from 'react';
import { TABS } from '../constants';
import type { TabId } from '../types';
import { CategorizedSpendingTab } from './CategorizedSpendingTab';
import { ComparativeAnalysisTab } from './ComparativeAnalysisTab';
import { TrendLineTab } from './TrendLineTab';
import styles from './AnalyticsTabs.module.css';

export function AnalyticsTabs() {
  const [activeTab, setActiveTab] = useState<TabId>('categorized');

  return (
    <div className={styles.container}>
      <div className={styles.tabBar} role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab.id)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={styles.tabPanel} role="tabpanel">
        {activeTab === 'categorized' && <CategorizedSpendingTab />}
        {activeTab === 'comparative' && <ComparativeAnalysisTab />}
        {activeTab === 'trend' && <TrendLineTab />}
      </div>
    </div>
  );
}
