import type { TimeUnit } from '@/api/schemas/common';
import { Select } from '@/components/Select/Select';
import { TIME_UNIT_OPTIONS } from '../constants';
import styles from './PeriodPicker.module.css';

interface PeriodPickerProps {
  firstPeriod: string;
  secondPeriod: string;
  timeUnit: TimeUnit;
  timeUnitCount: number;
  onFirstPeriodChange: (value: string) => void;
  onSecondPeriodChange: (value: string) => void;
  onTimeUnitChange: (value: TimeUnit) => void;
  onTimeUnitCountChange: (value: number) => void;
}

export function PeriodPicker({
  firstPeriod,
  secondPeriod,
  timeUnit,
  timeUnitCount,
  onFirstPeriodChange,
  onSecondPeriodChange,
  onTimeUnitChange,
  onTimeUnitCountChange,
}: PeriodPickerProps) {
  const handleTimeUnitChange = (value: string | null) => {
    if (value !== null) {
      onTimeUnitChange(Number(value) as TimeUnit);
    }
  };

  const handleCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = parseInt(e.target.value, 10);
    if (!isNaN(raw) && raw >= 1) {
      onTimeUnitCountChange(raw);
    }
  };

  return (
    <div className={styles.picker}>
      <div className={styles.periodGroup}>
        <p className={styles.periodLabel}>Первый период</p>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="period-first">
            Дата начала
          </label>
          <input
            id="period-first"
            type="date"
            className={styles.input}
            value={firstPeriod}
            onChange={(e) => onFirstPeriodChange(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.periodGroup}>
        <p className={styles.periodLabel}>Второй период</p>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="period-second">
            Дата начала
          </label>
          <input
            id="period-second"
            type="date"
            className={styles.input}
            value={secondPeriod}
            onChange={(e) => onSecondPeriodChange(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.settingsRow}>
        <Select
          label="Единица времени"
          options={TIME_UNIT_OPTIONS}
          value={String(timeUnit)}
          onChange={handleTimeUnitChange}
          placeholder="Выберите"
        />
        <div className={styles.numberField}>
          <label className={styles.label} htmlFor="time-unit-count">
            Количество
          </label>
          <input
            id="time-unit-count"
            type="number"
            min={1}
            className={styles.numberInput}
            value={timeUnitCount}
            onChange={handleCountChange}
          />
        </div>
      </div>
    </div>
  );
}
