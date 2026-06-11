# Chart Color Indication — Design Spec

**Date:** 2026-06-11
**Status:** Approved

## Problem

Current chart color indication has two issues:

1. **Unstable colors** — colors are assigned by array index from API response. The same category gets different colors depending on its position in the response.
2. **Limited palette** — only 10 colors, causing repetition when there are more than 10 categories.

## Decision

Implement a **ColorManager** — a utility module that maps `categoryId` to a stable color from an expanded 20-color palette, persisting the mapping in localStorage.

## Architecture

### Files

| File | Change |
|------|--------|
| `src/features/analytics/constants.ts` | Expand `CHART_COLORS` from 10 to 20 colors |
| `src/features/analytics/colorManager.ts` | **New** — utility module for color assignment |
| `src/features/analytics/components/CategorizedSpendingTab.tsx` | Replace `CHART_COLORS[index]` with `getColor(categoryId)` |
| `src/features/analytics/components/TrendLineTab.tsx` | Replace `CHART_COLORS[index]` with `getColor(categoryId)` |
| `src/features/analytics/components/ComparativeAnalysisTab.tsx` | No changes (fixed period colors) |

### ColorManager API

```ts
// src/features/analytics/colorManager.ts
const STORAGE_KEY = 'chart-category-colors';

export function getColor(categoryId: string): string;
export function getColorMap(ids: string[]): Map<string, string>;
export function clearColors(): void;
```

**`getColor(categoryId: string): string`**
1. Load mapping from localStorage (cached in memory for session)
2. If `categoryId` exists in mapping — return stored color
3. If not — assign next available color from palette: `palette[mapping.size % palette.length]`
4. Save updated mapping to localStorage
5. Return the color

**`getColorMap(ids: string[]): Map<string, string>`**
Batch retrieval — returns a Map of `categoryId → color` for a list of IDs. Useful for PieChart and LineChart where all colors are needed at once for legends.

**`clearColors(): void`**
Clears the mapping from localStorage and in-memory cache. For debugging/testing.

### localStorage Format

```json
{
  "chart-category-colors": {
    "cat-1": "#3B82F6",
    "cat-2": "#F59E0B",
    "cat-3": "#10B981"
  }
}
```

Key is `categoryId` (string), value is hex color from the palette.

### Expanded Palette (20 colors)

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

Colors are ordered for maximum visual distinction between adjacent entries.

## Component Changes

### CategorizedSpendingTab (PieChart)

**Before:**
```ts
const pieData = data.categories.map((cat, index) => ({
  name: cat.categoryName ?? 'Без категории',
  value: cat.totalAmount,
  colorIndex: index,
}));
// ...
<Cell fill={CHART_COLORS[entry.colorIndex % CHART_COLORS.length]} />
```

**After:**
```ts
import { getColor } from '../colorManager';

const pieData = data.categories.map((cat) => ({
  name: cat.categoryName ?? 'Без категории',
  value: cat.totalAmount,
  categoryId: cat.categoryId,
}));
// ...
<Cell fill={getColor(entry.categoryId)} />
```

Legend also switches to `getColor(entry.categoryId)`.

### TrendLineTab (LineChart)

**Before:**
```ts
{categoryNames.map((name, index) => (
  <Line stroke={CHART_COLORS[index % CHART_COLORS.length]} />
))}
```

**After:**
```ts
import { getColor } from '../colorManager';

{categoryNames.map((name) => (
  <Line stroke={getColor(name)} />
))}
```

Note: TrendLineTab uses `categoryName` as identifier (not `categoryId`). If the API provides `categoryId` in trend data, it should be used instead.

### ComparativeAnalysisTab (BarChart)

No changes. Two periods use fixed colors `CHART_COLORS[0]` and `CHART_COLORS[1]`.

### TRANSACTION_TYPE_COLORS

No changes. Semantic transaction coloring (income/expense/transfer) is separate and unaffected.

## Edge Cases

### localStorage Cleared

When localStorage is cleared, the mapping is lost. On next access, `getColor()` reassigns colors sequentially from the palette. The same category may get a different color than before. This is expected behavior per the chosen approach.

### More Than 20 Categories

Colors cycle via `palette[index % 20]`. With 20+ categories on a single chart, some colors repeat. This is acceptable — 20+ categories on one chart are already hard to read regardless of colors.

### Stale Entries in localStorage

If a category is deleted on the backend, its color mapping remains in localStorage as a "dead" entry. This causes no errors, only takes minimal storage. Periodic cleanup is YAGNI at this stage.

### Performance

`getColor()` reads localStorage once on first call and caches the mapping in memory. Subsequent calls use the in-memory cache. Writes to localStorage only happen when a new color is assigned. No unnecessary I/O.

## Testing

Unit tests for `colorManager.ts`:
- `getColor` returns a palette color for a new ID
- `getColor` returns the same color on repeated calls with the same ID
- `getColor` assigns different colors to different IDs
- `getColorMap` correctly maps a list of IDs
- `clearColors` clears the mapping
- After clearing, colors are reassigned from the start of the palette

## Out of Scope

- Server-side color field in API responses
- React Context/Provider for colors
- Semantic coloring (income=green, expense=red) on category charts
- Periodic cleanup of stale localStorage entries
- Dark theme color variants