# Analytics Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an Analytics page at `/analytics` with three tabbed financial analytics widgets using Recharts.

**Architecture:** Feature module at `src/features/analytics/` with dedicated tab components. Each tab manages its own form state independently. Shared DateRangePicker and PeriodPicker components. Thin AnalyticsPage wrapper follows existing page layout pattern.

**Tech Stack:** React 19, TypeScript, Recharts, TanStack React Query, CSS Modules

---

### Task 1: Install Recharts dependency

**Files:**
- Modify: `package.json` (via npm install)
- Modify: `package-lock.json` (via npm install)

- [ ] **Step 1: Install recharts**

Run:
```bash
npm install recharts
```

- [ ] **Step 2: Verify installation**

Run:
```bash
node -e "require('recharts'); console.log('recharts OK')"
```

Expected: `recharts OK`

- [ ] **Step 3: Verify TypeScript compilation**

Run:
```bash
npx tsc -b --noEmit 2>&1 | head -5
```

Expected: No errors related to recharts import resolution.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install recharts dependency"
```

---

### Task 2: Create constants and types

**Files:**
- Create: `src/features/analytics/types.ts`
- Create: `src/features/analytics/constants.ts`

- [ ] **Step 1: Create the types file**

Create `src/features/analytics/types.ts`:

```typescript
import type { TimeUnit } from '@/api/schemas/common';

export type TabId = 'categorized' | 'comparative' | 'trend';

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface CategorizedSpendingFormState {
  dateRange: DateRange | null;
}

export interface ComparativeAnalysisFormState {
  firstPeriod: string;
  secondPeriod: string;
  timeUnit: TimeUnit;
  timeUnitCount: number;
}

export interface TrendLineFormState {
  dateRange: DateRange | null;
  timeUnit: TimeUnit;
}
```

- [ ] **Step 2: Create the constants file**

Create `src/features/analytics/constants.ts`:

```typescript
import { TimeUnit } from '@/api/schemas/common';
import type { TabId, DateRange } from './types';

export const TABS: { id: TabId; label: string }[] = [
  { id: 'categorized', label: 'Расходы по категориям' },
  { id: 'comparative', label: 'Сравнение периодов' },
  { id: 'trend', label: 'Тренды расходов' },
];

export const CHART_COLORS = [
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#F97316',
  '#6366F1',
  '#14B8A6',
];

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(date: Date): Date {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfQuarter(date: Date): Date {
  const d = new Date(date);
  const quarterStartMonth = Math.floor(d.getMonth() / 3) * 3;
  d.setMonth(quarterStartMonth, 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfYear(date: Date): Date {
  const d = new Date(date);
  d.setMonth(0, 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function getThisWeekRange(): DateRange {
  const now = new Date();
  const start = startOfWeek(now);
  const end = endOfDay(now);
  return { startDate: formatDate(start), endDate: formatDate(end) };
}

export function getThisMonthRange(): DateRange {
  const now = new Date();
  const start = startOfMonth(now);
  const end = endOfDay(now);
  return { startDate: formatDate(start), endDate: formatDate(end) };
}

export function getThisQuarterRange(): DateRange {
  const now = new Date();
  const start = startOfQuarter(now);
  const end = endOfDay(now);
  return { startDate: formatDate(start), endDate: formatDate(end) };
}

export function getThisYearRange(): DateRange {
  const now = new Date();
  const start = startOfYear(now);
  const end = endOfDay(now);
  return { startDate: formatDate(start), endDate: formatDate(end) };
}

export const PERIOD_PRESETS: { label: string; getRange: () => DateRange }[] = [
  { label: 'Эта неделя', getRange: getThisWeekRange },
  { label: 'Этот месяц', getRange: getThisMonthRange },
  { label: 'Этот квартал', getRange: getThisQuarterRange },
  { label: 'Этот год', getRange: getThisYearRange },
];

export const TIME_UNIT_OPTIONS: { value: string; label: string }[] = [
  { value: String(TimeUnit.Day), label: 'День' },
  { value: String(TimeUnit.Month), label: 'Месяц' },
  { value: String(TimeUnit.Year), label: 'Год' },
];
```

- [ ] **Step 3: Verify TypeScript compilation**

Run:
```bash
npx tsc -b --noEmit 2>&1 | head -10
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/features/analytics/types.ts src/features/analytics/constants.ts
git commit -m "feat(analytics): add types and constants for analytics feature"
```

---

### Task 3: Create shared state components (ChartSkeleton, EmptyChartState, ChartErrorState)

**Files:**
- Create: `src/features/analytics/components/ChartSkeleton.tsx`
- Create: `src/features/analytics/components/ChartSkeleton.module.css`
- Create: `src/features/analytics/components/EmptyChartState.tsx`
- Create: `src/features/analytics/components/EmptyChartState.module.css`
- Create: `src/features/analytics/components/ChartErrorState.tsx`
- Create: `src/features/analytics/components/ChartErrorState.module.css`

- [ ] **Step 1: Create ChartSkeleton component**

Create `src/features/analytics/components/ChartSkeleton.tsx`:

```typescript
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
```

Create `src/features/analytics/components/ChartSkeleton.module.css`:

```css
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.skeleton {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-lg);
  padding: var(--spacing-xl);
}

.chartArea {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
  width: 100%;
}

.shimmerBlock {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: linear-gradient(
    90deg,
    var(--color-neutral-200) 25%,
    var(--color-bg-alt) 50%,
    var(--color-neutral-200) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

.shimmerLine {
  height: 16px;
  border-radius: var(--radius-md);
  background: linear-gradient(
    90deg,
    var(--color-neutral-200) 25%,
    var(--color-bg-alt) 50%,
    var(--color-neutral-200) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

.wide {
  width: 60%;
}

.narrow {
  width: 40%;
}

.medium {
  width: 50%;
}

.legendArea {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
  justify-content: center;
}

.shimmerPill {
  width: 80px;
  height: 32px;
  border-radius: var(--radius-md);
  background: linear-gradient(
    90deg,
    var(--color-neutral-200) 25%,
    var(--color-bg-alt) 50%,
    var(--color-neutral-200) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

@media (min-width: 768px) {
  .shimmerBlock {
    width: 240px;
    height: 240px;
  }
}

@media (min-width: 1024px) {
  .shimmerBlock {
    width: 280px;
    height: 280px;
  }
}
```

- [ ] **Step 2: Create EmptyChartState component**

Create `src/features/analytics/components/EmptyChartState.tsx`:

```typescript
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
```

Create `src/features/analytics/components/EmptyChartState.module.css`:

```css
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-2xl) var(--spacing-lg);
  gap: var(--spacing-lg);
  text-align: center;
}

.icon {
  color: var(--color-neutral-400);
  width: 48px;
  height: 48px;
}

.message {
  font-family: var(--font);
  font-size: var(--text-base);
  color: var(--color-text-muted);
  margin: 0;
}

.changeButton {
  font-family: var(--font);
  font-size: var(--text-sm);
  color: var(--color-primary);
  background: none;
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-md);
  padding: var(--spacing-sm) var(--spacing-lg);
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.changeButton:hover {
  background-color: var(--color-blue-500);
  color: var(--color-text-light);
}
```

- [ ] **Step 3: Create ChartErrorState component**

Create `src/features/analytics/components/ChartErrorState.tsx`:

```typescript
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
```

Create `src/features/analytics/components/ChartErrorState.module.css`:

```css
.error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-2xl) var(--spacing-lg);
  gap: var(--spacing-lg);
  text-align: center;
}

.icon {
  color: var(--color-red-500);
  width: 48px;
  height: 48px;
}

.message {
  font-family: var(--font);
  font-size: var(--text-base);
  color: var(--color-text-muted);
  margin: 0;
}

.retryButton {
  font-family: var(--font);
  font-size: var(--text-sm);
  color: var(--color-text-light);
  background-color: var(--color-blue-500);
  border: none;
  border-radius: var(--radius-md);
  padding: var(--spacing-sm) var(--spacing-lg);
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.retryButton:hover {
  background-color: var(--color-primary);
}
```

- [ ] **Step 4: Verify TypeScript compilation**

Run:
```bash
npx tsc -b --noEmit 2>&1 | head -10
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/features/analytics/components/ChartSkeleton.tsx src/features/analytics/components/ChartSkeleton.module.css src/features/analytics/components/EmptyChartState.tsx src/features/analytics/components/EmptyChartState.module.css src/features/analytics/components/ChartErrorState.tsx src/features/analytics/components/ChartErrorState.module.css
git commit -m "feat(analytics): add ChartSkeleton, EmptyChartState, and ChartErrorState components"
```

---

### Task 4: Create DateRangePicker component

**Files:**
- Create: `src/features/analytics/components/DateRangePicker.tsx`
- Create: `src/features/analytics/components/DateRangePicker.module.css`

- [ ] **Step 1: Create DateRangePicker CSS module**

Create `src/features/analytics/components/DateRangePicker.module.css`:

```css
.picker {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.presets {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.presetButton {
  font-family: var(--font);
  font-size: var(--text-sm);
  color: var(--color-text-primary);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-sm) var(--spacing-md);
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

.presetButton:hover {
  background-color: var(--color-bg);
}

.presetButtonActive {
  background-color: var(--color-blue-500);
  color: var(--color-text-light);
  border-color: var(--color-blue-500);
}

.presetButtonActive:hover {
  background-color: var(--color-primary);
}

.dateFields {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.label {
  font-family: var(--font);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.input {
  font-family: var(--font);
  font-size: var(--text-base);
  color: var(--color-text-primary);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-md) var(--spacing-lg);
  width: 100%;
  box-sizing: border-box;
  transition: border-color 0.2s ease;
}

.input:focus {
  border-color: var(--color-primary);
  outline: none;
}

.inputInvalid {
  border-color: var(--color-red-500);
}

.errorMessage {
  font-family: var(--font);
  font-size: var(--text-xs);
  color: var(--color-red-500);
  margin: 0;
}

@media (min-width: 768px) {
  .dateFields {
    flex-direction: row;
    gap: var(--spacing-md);
  }

  .field {
    flex: 1;
  }
}
```

- [ ] **Step 2: Create DateRangePicker component**

Create `src/features/analytics/components/DateRangePicker.tsx`:

```typescript
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
```

- [ ] **Step 3: Verify TypeScript compilation**

Run:
```bash
npx tsc -b --noEmit 2>&1 | head -10
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/features/analytics/components/DateRangePicker.tsx src/features/analytics/components/DateRangePicker.module.css
git commit -m "feat(analytics): add DateRangePicker component with presets and custom range"
```

---

### Task 5: Create PeriodPicker component

**Files:**
- Create: `src/features/analytics/components/PeriodPicker.tsx`
- Create: `src/features/analytics/components/PeriodPicker.module.css`

- [ ] **Step 1: Create PeriodPicker CSS module**

Create `src/features/analytics/components/PeriodPicker.module.css`:

```css
.picker {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.periodGroup {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.periodLabel {
  font-family: var(--font);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text-primary);
  margin: 0;
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.label {
  font-family: var(--font);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.input {
  font-family: var(--font);
  font-size: var(--text-base);
  color: var(--color-text-primary);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-md) var(--spacing-lg);
  width: 100%;
  box-sizing: border-box;
  transition: border-color 0.2s ease;
}

.input:focus {
  border-color: var(--color-primary);
  outline: none;
}

.settingsRow {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.numberField {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.numberInput {
  font-family: var(--font);
  font-size: var(--text-base);
  color: var(--color-text-primary);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-md) var(--spacing-lg);
  width: 100%;
  box-sizing: border-box;
  transition: border-color 0.2s ease;
  -moz-appearance: textfield;
}

.numberInput:focus {
  border-color: var(--color-primary);
  outline: none;
}

.numberInput::-webkit-inner-spin-button,
.numberInput::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

@media (min-width: 768px) {
  .settingsRow {
    flex-direction: row;
    gap: var(--spacing-lg);
  }

  .numberField {
    flex: 0 0 120px;
  }
}
```

- [ ] **Step 2: Create PeriodPicker component**

Create `src/features/analytics/components/PeriodPicker.tsx`:

```typescript
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
```

- [ ] **Step 3: Verify TypeScript compilation**

Run:
```bash
npx tsc -b --noEmit 2>&1 | head -10
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/features/analytics/components/PeriodPicker.tsx src/features/analytics/components/PeriodPicker.module.css
git commit -m "feat(analytics): add PeriodPicker component for comparative analysis"
```

---

### Task 6: Create CategorizedSpendingTab component

**Files:**
- Create: `src/features/analytics/components/CategorizedSpendingTab.tsx`
- Create: `src/features/analytics/components/CategorizedSpendingTab.module.css`

- [ ] **Step 1: Create CategorizedSpendingTab CSS module**

Create `src/features/analytics/components/CategorizedSpendingTab.module.css`:

```css
.tab {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.chartContainer {
  width: 100%;
  min-height: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.pieChartWrapper {
  position: relative;
  width: 100%;
  max-width: 320px;
  height: 320px;
}

.centerLabel {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  pointer-events: none;
}

.centerLabelTitle {
  font-family: var(--font);
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  margin: 0;
}

.centerLabelValue {
  font-family: var(--font);
  font-size: var(--text-xl);
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm) var(--spacing-lg);
  justify-content: center;
  margin-top: var(--spacing-md);
}

.legendItem {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.legendColor {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  flex-shrink: 0;
}

.legendName {
  font-family: var(--font);
  font-size: var(--text-sm);
  color: var(--color-text-primary);
}

.legendAmount {
  font-family: var(--font);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  margin-left: var(--spacing-xs);
}

@media (min-width: 768px) {
  .pieChartWrapper {
    max-width: 360px;
    height: 360px;
  }
}

@media (min-width: 1024px) {
  .tab {
    flex-direction: row;
    align-items: flex-start;
  }

  .chartContainer {
    flex: 1;
    align-items: center;
  }
}
```

- [ ] **Step 2: Create CategorizedSpendingTab component**

Create `src/features/analytics/components/CategorizedSpendingTab.tsx`:

```typescript
import { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useCategorizedSpending } from '@/api/queries/financial-analytics';
import type { CategorizingSpendingApiRequest } from '@/api/schemas/financial-analytics';
import { CHART_COLORS } from '../constants';
import type { DateRange } from '../types';
import { DateRangePicker } from './DateRangePicker';
import { ChartSkeleton } from './ChartSkeleton';
import { EmptyChartState } from './EmptyChartState';
import { ChartErrorState } from './ChartErrorState';
import styles from './CategorizedSpendingTab.module.css';

interface PieEntry {
  name: string;
  value: number;
  colorIndex: number;
}

function formatAmount(amount: number): string {
  return amount.toLocaleString('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function CategorizedSpendingTab() {
  const [dateRange, setDateRange] = useState<DateRange | null>(null);

  const request: CategorizingSpendingApiRequest | null = useMemo(() => {
    if (
      dateRange === null ||
      dateRange.startDate === '' ||
      dateRange.endDate === ''
    ) {
      return null;
    }
    if (dateRange.endDate < dateRange.startDate) {
      return null;
    }
    return { startDate: dateRange.startDate, endDate: dateRange.endDate };
  }, [dateRange]);

  const { data, isLoading, isError, refetch } = useCategorizedSpending(request);

  const pieData: PieEntry[] = useMemo(() => {
    if (!data?.categories) return [];
    return data.categories.map((cat, index) => ({
      name: cat.categoryName ?? 'Без категории',
      value: cat.totalAmount,
      colorIndex: index,
    }));
  }, [data]);

  const isEmpty = !isLoading && !isError && data !== undefined && pieData.length === 0;

  if (isLoading) {
    return (
      <div className={styles.tab}>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
        <ChartSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div className={styles.tab}>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
        <ChartErrorState onRetry={() => refetch()} />
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className={styles.tab}>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
        <EmptyChartState onChangePeriod={() => setDateRange(null)} />
      </div>
    );
  }

  return (
    <div className={styles.tab}>
      <DateRangePicker value={dateRange} onChange={setDateRange} />

      {pieData.length > 0 && (
        <div className={styles.chartContainer}>
          <div className={styles.pieChartWrapper}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius="55%"
                  outerRadius="80%"
                  dataKey="value"
                  nameKey="name"
                  paddingAngle={2}
                >
                  {pieData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={CHART_COLORS[entry.colorIndex % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatAmount(value)}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className={styles.centerLabel}>
              <p className={styles.centerLabelTitle}>Итого</p>
              <p className={styles.centerLabelValue}>
                {data ? formatAmount(data.totalSpending) : '0'}
              </p>
            </div>
          </div>

          <div className={styles.legend}>
            {pieData.map((entry) => (
              <div key={entry.name} className={styles.legendItem}>
                <div
                  className={styles.legendColor}
                  style={{
                    backgroundColor:
                      CHART_COLORS[entry.colorIndex % CHART_COLORS.length],
                  }}
                />
                <span className={styles.legendName}>{entry.name}</span>
                <span className={styles.legendAmount}>
                  {formatAmount(entry.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verify TypeScript compilation**

Run:
```bash
npx tsc -b --noEmit 2>&1 | head -10
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/features/analytics/components/CategorizedSpendingTab.tsx src/features/analytics/components/CategorizedSpendingTab.module.css
git commit -m "feat(analytics): add CategorizedSpendingTab with donut chart"
```

---

### Task 7: Create ComparativeAnalysisTab component

**Files:**
- Create: `src/features/analytics/components/ComparativeAnalysisTab.tsx`
- Create: `src/features/analytics/components/ComparativeAnalysisTab.module.css`

- [ ] **Step 1: Create ComparativeAnalysisTab CSS module**

Create `src/features/analytics/components/ComparativeAnalysisTab.module.css`:

```css
.tab {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.summary {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.summaryItem {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--color-surface);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}

.summaryLabel {
  font-family: var(--font);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.summaryValue {
  font-family: var(--font);
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--color-text-primary);
}

.chartContainer {
  width: 100%;
  min-height: 300px;
}

@media (min-width: 1024px) {
  .tab {
    flex-direction: row;
    align-items: flex-start;
  }

  .summary {
    flex: 0 0 200px;
  }

  .chartContainer {
    flex: 1;
  }
}
```

- [ ] **Step 2: Create ComparativeAnalysisTab component**

Create `src/features/analytics/components/ComparativeAnalysisTab.tsx`:

```typescript
import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useCategoryComparativeAnalysis } from '@/api/queries/financial-analytics';
import type { CategoryComparativeAnalysisApiRequest } from '@/api/schemas/financial-analytics';
import { TimeUnit } from '@/api/schemas/common';
import { CHART_COLORS } from '../constants';
import { PeriodPicker } from './PeriodPicker';
import { ChartSkeleton } from './ChartSkeleton';
import { EmptyChartState } from './EmptyChartState';
import { ChartErrorState } from './ChartErrorState';
import styles from './ComparativeAnalysisTab.module.css';

function formatAmount(amount: number): string {
  return amount.toLocaleString('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function ComparativeAnalysisTab() {
  const [firstPeriod, setFirstPeriod] = useState('');
  const [secondPeriod, setSecondPeriod] = useState('');
  const [timeUnit, setTimeUnit] = useState<TimeUnit>(TimeUnit.Month);
  const [timeUnitCount, setTimeUnitCount] = useState(1);

  const request: CategoryComparativeAnalysisApiRequest | null = useMemo(() => {
    if (firstPeriod === '' || secondPeriod === '') {
      return null;
    }
    return {
      firstPeriod,
      secondPeriod,
      timeUnit,
      timeUnitCount,
    };
  }, [firstPeriod, secondPeriod, timeUnit, timeUnitCount]);

  const { data, isLoading, isError, refetch } = useCategoryComparativeAnalysis(request);

  const barData = useMemo(() => {
    if (!data?.categoryComparativeAnalyses) return [];
    return data.categoryComparativeAnalyses.map((cat) => ({
      name: cat.categoryName ?? 'Без категории',
      'Первый период': cat.firstPeriodAmount,
      'Второй период': cat.secondPeriodAmount,
    }));
  }, [data]);

  const isEmpty =
    !isLoading && !isError && data !== undefined && barData.length === 0;

  if (isLoading) {
    return (
      <div className={styles.tab}>
        <PeriodPicker
          firstPeriod={firstPeriod}
          secondPeriod={secondPeriod}
          timeUnit={timeUnit}
          timeUnitCount={timeUnitCount}
          onFirstPeriodChange={setFirstPeriod}
          onSecondPeriodChange={setSecondPeriod}
          onTimeUnitChange={setTimeUnit}
          onTimeUnitCountChange={setTimeUnitCount}
        />
        <ChartSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div className={styles.tab}>
        <PeriodPicker
          firstPeriod={firstPeriod}
          secondPeriod={secondPeriod}
          timeUnit={timeUnit}
          timeUnitCount={timeUnitCount}
          onFirstPeriodChange={setFirstPeriod}
          onSecondPeriodChange={setSecondPeriod}
          onTimeUnitChange={setTimeUnit}
          onTimeUnitCountChange={setTimeUnitCount}
        />
        <ChartErrorState onRetry={() => refetch()} />
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className={styles.tab}>
        <PeriodPicker
          firstPeriod={firstPeriod}
          secondPeriod={secondPeriod}
          timeUnit={timeUnit}
          timeUnitCount={timeUnitCount}
          onFirstPeriodChange={setFirstPeriod}
          onSecondPeriodChange={setSecondPeriod}
          onTimeUnitChange={setTimeUnit}
          onTimeUnitCountChange={setTimeUnitCount}
        />
        <EmptyChartState />
      </div>
    );
  }

  return (
    <div className={styles.tab}>
      <PeriodPicker
        firstPeriod={firstPeriod}
        secondPeriod={secondPeriod}
        timeUnit={timeUnit}
        timeUnitCount={timeUnitCount}
        onFirstPeriodChange={setFirstPeriod}
        onSecondPeriodChange={setSecondPeriod}
        onTimeUnitChange={setTimeUnit}
        onTimeUnitCountChange={setTimeUnitCount}
      />

      {barData.length > 0 && (
        <>
          <div className={styles.summary}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Первый период</span>
              <span className={styles.summaryValue}>
                {formatAmount(data?.totalFirstPeriodSpending ?? 0)}
              </span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Второй период</span>
              <span className={styles.summaryValue}>
                {formatAmount(data?.totalSecondPeriodSpending ?? 0)}
              </span>
            </div>
          </div>

          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: number) => formatAmount(value)} />
                <Legend />
                <Bar
                  dataKey="Первый период"
                  fill={CHART_COLORS[0]}
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="Второй период"
                  fill={CHART_COLORS[1]}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verify TypeScript compilation**

Run:
```bash
npx tsc -b --noEmit 2>&1 | head -10
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/features/analytics/components/ComparativeAnalysisTab.tsx src/features/analytics/components/ComparativeAnalysisTab.module.css
git commit -m "feat(analytics): add ComparativeAnalysisTab with grouped bar chart"
```

---

### Task 8: Create TrendLineTab component

**Files:**
- Create: `src/features/analytics/components/TrendLineTab.tsx`
- Create: `src/features/analytics/components/TrendLineTab.module.css`

- [ ] **Step 1: Create TrendLineTab CSS module**

Create `src/features/analytics/components/TrendLineTab.module.css`:

```css
.tab {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.controls {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.chartContainer {
  width: 100%;
  min-height: 300px;
}

@media (min-width: 1024px) {
  .tab {
    flex-direction: row;
    align-items: flex-start;
  }

  .controls {
    flex: 0 0 280px;
  }

  .chartContainer {
    flex: 1;
  }
}
```

- [ ] **Step 2: Create TrendLineTab component**

Create `src/features/analytics/components/TrendLineTab.tsx`:

```typescript
import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useSpendingTrendLine } from '@/api/queries/financial-analytics';
import type { SpendingTrendLineApiRequest } from '@/api/schemas/financial-analytics';
import { TimeUnit } from '@/api/schemas/common';
import { CHART_COLORS, TIME_UNIT_OPTIONS } from '../constants';
import type { DateRange } from '../types';
import { DateRangePicker } from './DateRangePicker';
import { ChartSkeleton } from './ChartSkeleton';
import { EmptyChartState } from './EmptyChartState';
import { ChartErrorState } from './ChartErrorState';
import { Select } from '@/components/Select/Select';
import styles from './TrendLineTab.module.css';

function formatAmount(amount: number): string {
  return amount.toLocaleString('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function TrendLineTab() {
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [timeUnit, setTimeUnit] = useState<TimeUnit>(TimeUnit.Month);

  const request: SpendingTrendLineApiRequest | null = useMemo(() => {
    if (
      dateRange === null ||
      dateRange.startDate === '' ||
      dateRange.endDate === ''
    ) {
      return null;
    }
    if (dateRange.endDate < dateRange.startDate) {
      return null;
    }
    return {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      timeUnit,
    };
  }, [dateRange, timeUnit]);

  const { data, isLoading, isError, refetch } = useSpendingTrendLine(request);

  const lineData = useMemo(() => {
    if (!data?.labels || !data?.categories) return [];
    const labels = data.labels;
    return labels.map((label, labelIndex) => {
      const entry: Record<string, string | number> = { label: label ?? '' };
      for (const cat of data.categories ?? []) {
        const name = cat.name ?? 'Без категории';
        const amount =
          cat.nodes && cat.nodes[labelIndex]
            ? cat.nodes[labelIndex].amount
            : 0;
        entry[name] = amount;
      }
      return entry;
    });
  }, [data]);

  const categoryNames = useMemo(() => {
    if (!data?.categories) return [];
    return (data.categories ?? []).map((cat) => cat.name ?? 'Без категории');
  }, [data]);

  const isEmpty =
    !isLoading && !isError && data !== undefined && lineData.length === 0;

  const handleTimeUnitChange = (value: string | null) => {
    if (value !== null) {
      setTimeUnit(Number(value) as TimeUnit);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.tab}>
        <div className={styles.controls}>
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          <Select
            label="Единица времени"
            options={TIME_UNIT_OPTIONS}
            value={String(timeUnit)}
            onChange={handleTimeUnitChange}
            placeholder="Выберите"
          />
        </div>
        <ChartSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div className={styles.tab}>
        <div className={styles.controls}>
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          <Select
            label="Единица времени"
            options={TIME_UNIT_OPTIONS}
            value={String(timeUnit)}
            onChange={handleTimeUnitChange}
            placeholder="Выберите"
          />
        </div>
        <ChartErrorState onRetry={() => refetch()} />
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className={styles.tab}>
        <div className={styles.controls}>
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          <Select
            label="Единица времени"
            options={TIME_UNIT_OPTIONS}
            value={String(timeUnit)}
            onChange={handleTimeUnitChange}
            placeholder="Выберите"
          />
        </div>
        <EmptyChartState onChangePeriod={() => setDateRange(null)} />
      </div>
    );
  }

  return (
    <div className={styles.tab}>
      <div className={styles.controls}>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
        <Select
          label="Единица времени"
          options={TIME_UNIT_OPTIONS}
          value={String(timeUnit)}
          onChange={handleTimeUnitChange}
          placeholder="Выберите"
        />
      </div>

      {lineData.length > 0 && (
        <div className={styles.chartContainer}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value: number) => formatAmount(value)} />
              <Legend />
              {categoryNames.map((name, index) => (
                <Line
                  key={name}
                  type="monotone"
                  dataKey={name}
                  stroke={CHART_COLORS[index % CHART_COLORS.length]}
                  dot={false}
                  strokeWidth={2}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verify TypeScript compilation**

Run:
```bash
npx tsc -b --noEmit 2>&1 | head -10
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/features/analytics/components/TrendLineTab.tsx src/features/analytics/components/TrendLineTab.module.css
git commit -m "feat(analytics): add TrendLineTab with multi-line chart"
```

---

### Task 9: Create AnalyticsTabs container

**Files:**
- Create: `src/features/analytics/components/AnalyticsTabs.tsx`
- Create: `src/features/analytics/components/AnalyticsTabs.module.css`

- [ ] **Step 1: Create AnalyticsTabs CSS module**

Create `src/features/analytics/components/AnalyticsTabs.module.css`:

```css
.container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.tabBar {
  display: flex;
  overflow-x: auto;
  gap: var(--spacing-sm);
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
  padding-bottom: var(--spacing-xs);
}

.tabBar::-webkit-scrollbar {
  display: none;
}

.tab {
  font-family: var(--font);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-sm) var(--spacing-md);
  cursor: pointer;
  white-space: nowrap;
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}

.tab:hover {
  color: var(--color-text-primary);
  border-color: var(--color-neutral-400);
}

.tabActive {
  background-color: var(--color-blue-500);
  color: var(--color-text-light);
  border-color: var(--color-blue-500);
}

.tabActive:hover {
  background-color: var(--color-primary);
  color: var(--color-text-light);
  border-color: var(--color-primary);
}

.tabPanel {
  min-height: 400px;
}

@media (min-width: 768px) {
  .tab {
    font-size: var(--text-base);
    padding: var(--spacing-sm) var(--spacing-lg);
  }
}

@media (min-width: 1024px) {
  .tabBar {
    overflow-x: visible;
  }
}
```

- [ ] **Step 2: Create AnalyticsTabs component**

Create `src/features/analytics/components/AnalyticsTabs.tsx`:

```typescript
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
```

- [ ] **Step 3: Verify TypeScript compilation**

Run:
```bash
npx tsc -b --noEmit 2>&1 | head -10
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/features/analytics/components/AnalyticsTabs.tsx src/features/analytics/components/AnalyticsTabs.module.css
git commit -m "feat(analytics): add AnalyticsTabs container component"
```

---

### Task 10: Create AnalyticsPage and route

**Files:**
- Create: `src/pages/AnalyticsPage/AnalyticsPage.tsx`
- Create: `src/pages/AnalyticsPage/AnalyticsPage.module.css`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create AnalyticsPage CSS module**

Create `src/pages/AnalyticsPage/AnalyticsPage.module.css`:

```css
.page {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  background-color: var(--color-bg);
}

.content {
  flex: 1;
  padding: var(--spacing-lg) var(--content-padding);
  padding-bottom: calc(var(--nav-height) + var(--spacing-xl));
}
```

- [ ] **Step 2: Create AnalyticsPage component**

Create `src/pages/AnalyticsPage/AnalyticsPage.tsx`:

```typescript
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
```

- [ ] **Step 3: Add route to App.tsx**

In `src/App.tsx`, add the import for `AnalyticsPage` and the route.

First, add the import at the top of the file (after line 10, alongside other page imports):

```typescript
import { AnalyticsPage } from '@/pages/AnalyticsPage/AnalyticsPage';
```

Then, add the route inside the `<Routes>` element (after the `/transactions` route on line 29, before the `/profile` route):

```typescript
        <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
```

The full modified `src/App.tsx` should read:

```typescript
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar/Sidebar';
import { ProtectedRoute, AuthInitGuard } from '@/components/ProtectedRoute/ProtectedRoute';
import { CategoryPage } from '@/pages/CategoryPage/CategoryPage';
import { EditWalletPage } from '@/pages/EditWalletPage/EditWalletPage';
import { EditCategoryPage } from '@/pages/EditCategoryPage/EditCategoryPage';
import { RegisterPage } from '@/pages/RegisterPage/RegisterPage';
import { LoginPage } from '@/pages/LoginPage/LoginPage';
import { TransactionPage } from '@/pages/TransactionPage/TransactionPage';
import { TransactionAddPage } from '@/pages/TransactionAddPage/TransactionAddPage';
import { ProfilePage } from '@/pages/ProfilePage/ProfilePage';
import { ChangePasswordPage } from '@/pages/ChangePasswordPage/ChangePasswordPage';
import { AnalyticsPage } from '@/pages/AnalyticsPage/AnalyticsPage';
import styles from './App.module.css';

function AppContent() {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  return (
    <div className={`${styles.app} ${isAuthPage ? styles.authPage : ''}`}>
      {!isAuthPage && <Sidebar />}
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<ProtectedRoute><CategoryPage /></ProtectedRoute>} />
        <Route path="/wallet/:id" element={<ProtectedRoute><EditWalletPage /></ProtectedRoute>} />
        <Route path="/category/:id" element={<ProtectedRoute><EditCategoryPage /></ProtectedRoute>} />
        <Route path="/transactions/add" element={<ProtectedRoute><TransactionAddPage /></ProtectedRoute>} />
        <Route path="/transactions" element={<ProtectedRoute><TransactionPage /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/profile/change-password" element={<ProtectedRoute><ChangePasswordPage /></ProtectedRoute>} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthInitGuard>
        <AppContent />
      </AuthInitGuard>
    </BrowserRouter>
  );
}

export default App;
```

- [ ] **Step 4: Verify TypeScript compilation**

Run:
```bash
npx tsc -b --noEmit 2>&1 | head -10
```

Expected: No errors.

- [ ] **Step 5: Verify dev server starts**

Run:
```bash
npm run build 2>&1 | tail -5
```

Expected: Build completes successfully.

- [ ] **Step 6: Commit**

```bash
git add src/pages/AnalyticsPage/AnalyticsPage.tsx src/pages/AnalyticsPage/AnalyticsPage.module.css src/App.tsx
git commit -m "feat(analytics): add AnalyticsPage and /analytics route"
```