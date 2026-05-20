import styles from './TransactionFilters.module.css';
import type { UseTransactionFiltersReturn } from '@/features/transactions/hooks/useTransactionFilters';
import { Select } from '@/components/Select/Select';

interface TransactionFiltersProps {
  filters: UseTransactionFiltersReturn;
}

export function TransactionFilters({ filters }: TransactionFiltersProps) {
  return (
    <div className={styles.filters}>
      <div className={styles.filterRow}>
        <div className={styles.filterItem}>
          <Select
            label="Тип транзакции"
            options={filters.availableTypes.map((t) => ({
              value: t.value ?? '',
              label: t.label,
            }))}
            value={filters.selectedType ?? ''}
            onChange={(value) => {
              filters.setSelectedType(value as UseTransactionFiltersReturn['selectedType']);
            }}
            placeholder="Все"
          />
        </div>
        <div className={styles.filterItem}>
          <Select
            label="Кошелёк / Категория"
            options={filters.availableEndpoints.map((e) => ({
              value: e.value ?? '',
              label: e.label,
            }))}
            value={filters.selectedEndpointId ?? ''}
            onChange={(value) => {
              filters.setSelectedEndpointId(value || null);
            }}
            placeholder="Все"
          />
        </div>
      </div>
    </div>
  );
}
