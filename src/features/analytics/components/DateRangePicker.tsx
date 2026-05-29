import { useState, useCallback } from 'react';
import { PERIOD_PRESETS } from '../constants';
import type { DateRange } from '../types';
import styles from './DateRangePicker.module.css';

interface DateRangePickerProps {
  value: DateRange | null;
  onChange: (range: DateRange) => void;
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [activePreset, setActivePreset] = useState<number | null>(null);

  const handlePresetClick = useCallback(
    (index: number) => {
      setActivePreset(index);
      const range = PERIOD_PRESETS[index].getRange();
      onChange(range);
    },
    [onChange]
  );

  const handleStartDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setActivePreset(null);
      const startDate = e.target.value;
      const endDate = value?.endDate ?? '';
      if (startDate && endDate) {
        onChange({ startDate, endDate });
      }
    },
    [value, onChange]
  );

  const handleEndDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setActivePreset(null);
      const endDate = e.target.value;
      const startDate = value?.startDate ?? '';
      if (startDate && endDate) {
        onChange({ startDate, endDate });
      }
    },
    [value, onChange]
  );

  const isInvalid =
    value !== null &&
    value.startDate !== '' &&
    value.endDate !== '' &&
    value.endDate < value.startDate;

  return (
    <div className={styles.picker}>
      <div className={styles.presets}>
        {PERIOD_PRESETS.map((preset, index) => (
          <button
            key={preset.label}
            className={`${styles.presetButton} ${activePreset === index ? styles.presetButtonActive : ''}`}
            onClick={() => handlePresetClick(index)}
            type="button"
          >
            {preset.label}
          </button>
        ))}
      </div>
      <div className={styles.dateFields}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="date-range-start">
            С
          </label>
          <input
            id="date-range-start"
            type="date"
            className={`${styles.input} ${isInvalid ? styles.inputInvalid : ''}`}
            value={value?.startDate ?? ''}
            onChange={handleStartDateChange}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="date-range-end">
            По
          </label>
          <input
            id="date-range-end"
            type="date"
            className={`${styles.input} ${isInvalid ? styles.inputInvalid : ''}`}
            value={value?.endDate ?? ''}
            onChange={handleEndDateChange}
          />
        </div>
      </div>
      {isInvalid && (
        <p className={styles.errorMessage}>
          Дата окончания не может быть раньше даты начала
        </p>
      )}
    </div>
  );
}
