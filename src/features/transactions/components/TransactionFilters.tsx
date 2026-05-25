import styles from './TransactionFilters.module.css';
import type { UseTransactionFiltersReturn } from '@/features/transactions/hooks/useTransactionFilters';
import { Select } from '@/components/Select/Select';
import plusIcon from '@/assets/plus-icon.svg';

interface TransactionFiltersProps {
  filters: UseTransactionFiltersReturn;
  onAddClick: () => void;
}

export function TransactionFilters({ filters, onAddClick }: TransactionFiltersProps) {
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
        <button
          className={styles.addButton}
          onClick={onAddClick}
          aria-label="Добавить транзакцию"
        >
          <img src={plusIcon} alt="" />
        </button>
      </div>
    </div>
  );
}
