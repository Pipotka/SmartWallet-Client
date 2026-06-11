# Chart Color Indication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement stable category-to-color mapping for chart components using a ColorManager utility with localStorage persistence and an expanded 20-color palette.

**Architecture:** A pure utility module `colorManager.ts` provides `getColor(id)` that maps any string ID to a stable color from a 20-color palette, persisting the mapping in localStorage. Chart components replace index-based color assignment with `getColor(categoryId)` calls. BarChart period colors remain hardcoded.

**Tech Stack:** React, TypeScript, Recharts, localStorage API, Vitest (to be added)

---

### Task 1: Expand CHART_COLORS palette from 10 to 20 colors

**Files:**
- Modify: `src/features/analytics/constants.ts`

- [ ] **Step 1: Replace the CHART_COLORS array in constants.ts**

In `src/features/analytics/constants.ts`, replace the existing `CHART_COLORS` array (lines 10-21) with the expanded 20-color palette:

```ts
export const CHART_COLORS = [
  '#3B82F6',  // blue-500
  '#F59E0B',  // amber-500
  '#10B981',  // emerald-500
  '#EF4444',  // red-500
  '#8B5CF6',  // violet-500
  '#06B6D4',  // cyan-500
  '#F97316',  // orange-500
  '#EC4899',  // pink-500
  '#84CC16',  // lime-500
  '#6366F1',  // indigo-500
  '#14B8A6',  // teal-500
  '#EAB308',  // yellow-500
  '#0EA5E9',  // sky-500
  '#F43F5E',  // rose-500
  '#A855F7',  // purple-500
  '#D946EF',  // fuchsia-500
  '#22C55E',  // green-500
  '#E11D48',  // rose-600
  '#2563EB',  // blue-600
  '#059669',  // emerald-600
];
```

- [ ] **Step 2: Verify the app still builds**

Run: `npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/analytics/constants.ts
git commit -m "feat: expand CHART_COLORS palette from 10 to 20 colors"
```

---

### Task 2: Create ColorManager utility module

**Files:**
- Create: `src/features/analytics/colorManager.ts`

- [ ] **Step 1: Create colorManager.ts**

Create `src/features/analytics/colorManager.ts` with the following content:

```ts
import { CHART_COLORS } from './constants';

const STORAGE_KEY = 'chart-category-colors';

let cachedMapping: Record<string, string> | null = null;

function loadMapping(): Record<string, string> {
  if (cachedMapping !== null) {
    return cachedMapping;
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    cachedMapping = stored ? JSON.parse(stored) : {};
  } catch {
    cachedMapping = {};
  }
  return cachedMapping;
}

function saveMapping(mapping: Record<string, string>): void {
  cachedMapping = mapping;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mapping));
  } catch {
    // localStorage may be unavailable (private browsing, quota exceeded)
  }
}

export function getColor(categoryId: string): string {
  const mapping = loadMapping();
  if (categoryId in mapping) {
    return mapping[categoryId];
  }
  const colorIndex = Object.keys(mapping).length % CHART_COLORS.length;
  const color = CHART_COLORS[colorIndex];
  const updated = { ...mapping, [categoryId]: color };
  saveMapping(updated);
  return color;
}

export function getColorMap(ids: string[]): Map<string, string> {
  const result = new Map<string, string>();
  for (const id of ids) {
    result.set(id, getColor(id));
  }
  return result;
}

export function clearColors(): void {
  cachedMapping = {};
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
```

- [ ] **Step 2: Verify the app builds**

Run: `npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/analytics/colorManager.ts
git commit -m "feat: add ColorManager utility with localStorage persistence"
```

---

### Task 3: Update CategorizedSpendingTab to use ColorManager

**Files:**
- Modify: `src/features/analytics/components/CategorizedSpendingTab.tsx`

- [ ] **Step 1: Update imports**

In `src/features/analytics/components/CategorizedSpendingTab.tsx`, add the `getColor` import and remove the `CHART_COLORS` import.

Replace:
```ts
import { CHART_COLORS } from '../constants';
```

With:
```ts
import { getColor } from '../colorManager';
```

- [ ] **Step 2: Update PieEntry interface**

Replace the `PieEntry` interface:

```ts
interface PieEntry {
  name: string;
  value: number;
  colorIndex: number;
}
```

With:
```ts
interface PieEntry {
  name: string;
  value: number;
  categoryId: string;
}
```

- [ ] **Step 3: Update pieData useMemo**

Replace the `pieData` useMemo:

```ts
const pieData: PieEntry[] = useMemo(() => {
    if (!data?.categories) return [];
    return data.categories.map((cat, index) => ({
      name: cat.categoryName ?? 'Без категории',
      value: cat.totalAmount,
      colorIndex: index,
    }));
  }, [data]);
```

With:
```ts
const pieData: PieEntry[] = useMemo(() => {
    if (!data?.categories) return [];
    return data.categories.map((cat) => ({
      name: cat.categoryName ?? 'Без категории',
      value: cat.totalAmount,
      categoryId: cat.categoryId,
    }));
  }, [data]);
```

- [ ] **Step 4: Update Cell fill in PieChart**

Replace:
```tsx
{pieData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={CHART_COLORS[entry.colorIndex % CHART_COLORS.length]}
                    />
                  ))}
```

With:
```tsx
{pieData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={getColor(entry.categoryId)}
                    />
                  ))}
```

- [ ] **Step 5: Update legend color**

Replace:
```tsx
style={{
                    backgroundColor:
                      CHART_COLORS[entry.colorIndex % CHART_COLORS.length],
                  }}
```

With:
```tsx
style={{
                    backgroundColor: getColor(entry.categoryId),
                  }}
```

- [ ] **Step 6: Verify the app builds and CategorizedSpendingTab works**

Run: `npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 7: Commit**

```bash
git add src/features/analytics/components/CategorizedSpendingTab.tsx
git commit -m "feat: use ColorManager in CategorizedSpendingTab for stable category colors"
```

---

### Task 4: Update TrendLineTab to use ColorManager

**Files:**
- Modify: `src/features/analytics/components/TrendLineTab.tsx`

Note: The trend line API (`SpendingTrendLineCategoryApiModelSchema`) does NOT include `categoryId` — only `name` (nullable string). We will use the category name as the key for color mapping. This means categories with the same name across different trend line requests will get the same color, which is the desired behavior.

- [ ] **Step 1: Update imports**

In `src/features/analytics/components/TrendLineTab.tsx`, add the `getColor` import and remove `CHART_COLORS` from the constants import.

Replace:
```ts
import { CHART_COLORS, TIME_UNIT_OPTIONS } from '../constants';
```

With:
```ts
import { TIME_UNIT_OPTIONS } from '../constants';
import { getColor } from '../colorManager';
```

- [ ] **Step 2: Update Line stroke color**

Replace:
```tsx
{categoryNames.map((name, index) => (
                <Line
                  key={`${name}-${index}`}
                  type="monotone"
                  dataKey={name}
                  stroke={CHART_COLORS[index % CHART_COLORS.length]}
                  dot={false}
                  strokeWidth={2}
                />
              ))}
```

With:
```tsx
{categoryNames.map((name) => (
                <Line
                  key={name}
                  type="monotone"
                  dataKey={name}
                  stroke={getColor(name)}
                  dot={false}
                  strokeWidth={2}
                />
              ))}
```

- [ ] **Step 3: Verify the app builds and TrendLineTab works**

Run: `npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/features/analytics/components/TrendLineTab.tsx
git commit -m "feat: use ColorManager in TrendLineTab for stable category colors"
```

---

### Task 5: Add Vitest and write unit tests for ColorManager

**Files:**
- Create: `src/features/analytics/colorManager.test.ts`
- Modify: `package.json` (add test script)
- Modify: `vite.config.ts` (add vitest config)

- [ ] **Step 1: Install Vitest**

Run:
```bash
npm install -D vitest
```

- [ ] **Step 2: Add test config to vite.config.ts**

Add the following to `vite.config.ts` inside the `defineConfig` call:

```ts
/// <reference types="vitest" />
```

And add the `test` property:

```ts
test: {
  environment: 'jsdom',
  globals: true,
},
```

- [ ] **Step 3: Add test script to package.json**

Add to `scripts` in `package.json`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Create colorManager.test.ts**

Create `src/features/analytics/colorManager.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getColor, getColorMap, clearColors } from './colorManager';
import { CHART_COLORS } from './constants';

describe('colorManager', () => {
  beforeEach(() => {
    localStorage.clear();
    clearColors();
  });

  describe('getColor', () => {
    it('returns a color from the palette for a new ID', () => {
      const color = getColor('cat-1');
      expect(CHART_COLORS).toContain(color);
    });

    it('returns the same color on repeated calls with the same ID', () => {
      const first = getColor('cat-1');
      const second = getColor('cat-1');
      expect(first).toBe(second);
    });

    it('assigns different colors to different IDs', () => {
      const color1 = getColor('cat-1');
      const color2 = getColor('cat-2');
      expect(color1).not.toBe(color2);
    });

    it('assigns colors sequentially from the palette', () => {
      const color1 = getColor('cat-1');
      const color2 = getColor('cat-2');
      const color3 = getColor('cat-3');
      expect(color1).toBe(CHART_COLORS[0]);
      expect(color2).toBe(CHART_COLORS[1]);
      expect(color3).toBe(CHART_COLORS[2]);
    });

    it('cycles through the palette when exceeding its length', () => {
      const colors: string[] = [];
      for (let i = 0; i < CHART_COLORS.length + 5; i++) {
        colors.push(getColor(`cat-${i}`));
      }
      // First 20 should match palette exactly
      for (let i = 0; i < CHART_COLORS.length; i++) {
        expect(colors[i]).toBe(CHART_COLORS[i]);
      }
      // Next 5 should cycle back
      for (let i = CHART_COLORS.length; i < CHART_COLORS.length + 5; i++) {
        expect(colors[i]).toBe(CHART_COLORS[i % CHART_COLORS.length]);
      }
    });

    it('persists mapping to localStorage', () => {
      getColor('cat-1');
      const stored = JSON.parse(localStorage.getItem('chart-category-colors')!);
      expect(stored['cat-1']).toBe(CHART_COLORS[0]);
    });

    it('loads existing mapping from localStorage on init', () => {
      // Simulate a pre-existing mapping in localStorage
      clearColors();
      localStorage.setItem(
        'chart-category-colors',
        JSON.stringify({ 'existing-cat': '#FF0000' })
      );
      // Force cache invalidation so the next getColor reads from localStorage
      // clearColors clears both cache and localStorage, so we set localStorage after it
      const color = getColor('existing-cat');
      expect(color).toBe('#FF0000');
    });
  });

  describe('getColorMap', () => {
    it('returns a Map with colors for all provided IDs', () => {
      const ids = ['cat-1', 'cat-2', 'cat-3'];
      const map = getColorMap(ids);
      expect(map.size).toBe(3);
      expect(map.get('cat-1')).toBe(CHART_COLORS[0]);
      expect(map.get('cat-2')).toBe(CHART_COLORS[1]);
      expect(map.get('cat-3')).toBe(CHART_COLORS[2]);
    });
  });

  describe('clearColors', () => {
    it('clears the mapping from localStorage and cache', () => {
      getColor('cat-1');
      clearColors();
      expect(localStorage.getItem('chart-category-colors')).toBeNull();
      // After clearing, next call should reassign from palette start
      const color = getColor('cat-1');
      expect(color).toBe(CHART_COLORS[0]);
    });
  });
});
```

- [ ] **Step 5: Run tests**

Run: `npm run test`
Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/features/analytics/colorManager.test.ts package.json vite.config.ts
git commit -m "feat: add Vitest and unit tests for ColorManager"
```

---

### Task 6: Final verification and cleanup

**Files:**
- Remove: `colors.txt` (temporary palette reference file)

- [ ] **Step 1: Run full build**

Run: `npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 2: Run all tests**

Run: `npm run test`
Expected: All tests pass.

- [ ] **Step 3: Remove temporary colors.txt**

```bash
rm colors.txt
```

- [ ] **Step 4: Commit cleanup**

```bash
git add -A
git commit -m "chore: remove temporary colors.txt palette reference"
```