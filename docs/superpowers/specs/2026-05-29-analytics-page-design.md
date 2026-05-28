# Analytics Page — Design Specification

**Date:** 2026-05-29
**Status:** Approved

## Overview

Add an Analytics page at `/analytics` with three tabbed widgets for financial analytics: Categorized Spending, Comparative Analysis, and Spending Trend Line. The API layer (Zod schemas, React Query hooks) is already implemented. This spec covers the UI layer only.

## Architecture

**Approach:** Feature module with dedicated components (Approach 2).

**File Structure:**

```
src/
├── pages/
│   └── AnalyticsPage/
│       ├── AnalyticsPage.tsx          # Thin wrapper: Header + Tabs + BottomNav/Sidebar
│       └── AnalyticsPage.module.css
├── features/
│   └── analytics/
│       ├── components/
│       │   ├── AnalyticsTabs.tsx            # Tab container, manages active tab
│       │   ├── AnalyticsTabs.module.css
│       │   ├── CategorizedSpendingTab.tsx   # "Расходы по категориям" tab
│       │   ├── CategorizedSpendingTab.module.css
│       │   ├── ComparativeAnalysisTab.tsx   # "Сравнение периодов" tab
│       │   ├── ComparativeAnalysisTab.module.css
│       │   ├── TrendLineTab.tsx             # "Тренды расходов" tab
│       │   ├── TrendLineTab.module.css
│       │   ├── DateRangePicker.tsx          # Shared: presets + custom range
│       │   ├── DateRangePicker.module.css
│       │   ├── PeriodPicker.tsx             # For comparative: two periods + TimeUnit + count
│       │   ├── PeriodPicker.module.css
│       │   ├── ChartSkeleton.tsx            # Loading skeleton
│       │   ├── ChartSkeleton.module.css
│       │   ├── EmptyChartState.tsx          # Empty data state
│       │   ├── EmptyChartState.module.css
│       │   ├── ChartErrorState.tsx          # Error state
│       │   └── ChartErrorState.module.css
│       └── constants.ts               # Period presets, tab configuration
└── App.tsx                             # Add route /analytics → AnalyticsPage
```

## Component Design

### AnalyticsTabs

- Three tabs: "Расходы по категориям", "Сравнение периодов", "Тренды расходов"
- Active tab managed via `useState<'categorized' | 'comparative' | 'trend'>`
- Renders only the active tab (not all three simultaneously)

### CategorizedSpendingTab

- **Form:** `DateRangePicker` (presets + custom range)
- **State:** `startDate`, `endDate` in `useState`
- **Query:** `useCategorizedSpending(request)` — enabled when both dates are filled
- **Chart:** Donut chart (Recharts `PieChart` with `innerRadius`)
- **Center label:** `totalSpending` displayed in the donut center
- **Legend:** Category list with colors and amounts below the chart

### ComparativeAnalysisTab

- **Form:** `PeriodPicker` — two periods (firstPeriod, secondPeriod) via presets or custom + `TimeUnit` (Day/Month/Year) + `TimeUnitCount` (numeric field)
- **State:** `firstPeriod`, `secondPeriod`, `timeUnit`, `timeUnitCount` in `useState`
- **Query:** `useCategoryComparativeAnalysis(request)` — enabled when all fields are filled
- **Chart:** Grouped Bar chart (Recharts `BarChart`) — two bar groups per category (first period vs second period)
- **Summary:** Total amounts for both periods displayed above the chart

### TrendLineTab

- **Form:** `DateRangePicker` (presets + custom range) + `TimeUnit` (Day/Month/Year)
- **State:** `startDate`, `endDate`, `timeUnit` in `useState`
- **Query:** `useSpendingTrendLine(request)` — enabled when all fields are filled
- **Chart:** Multi-line chart (Recharts `LineChart`) — one line per category
- **Tooltip:** Hover tooltip showing category name and amount

### DateRangePicker

- **Presets:** "Эта неделя", "Этот месяц", "Этот квартал", "Этот год"
- **Custom range:** Two `<input type="date">` for startDate and endDate
- **Logic:** Selecting a preset auto-fills dates. Manual input clears preset selection.
- **Validation:** endDate must not be before startDate

### PeriodPicker

- Two date range blocks for firstPeriod and secondPeriod
- Dropdown for `TimeUnit` (Day/Month/Year)
- Numeric field for `TimeUnitCount` (minimum 1)

## Data Flow

```
User selects period → useState updates
→ Request object formed → React Query hook enabled
→ Data loads → Render chart or state (loading/empty/error)
```

Each tab manages its own form state independently. No shared state between tabs.

## State Handling

### Loading (ChartSkeleton)

- Skeleton placeholder mimicking chart shape (rectangle with shimmer animation)
- Used in all three tabs when `isLoading`
- CSS animation `@keyframes shimmer`

### Empty (EmptyChartState)

- Displayed when query succeeds but data is empty (empty categories/nodes array)
- Icon + text: "Нет данных за выбранный период"
- "Изменить период" button to return to form

### Error (ChartErrorState)

- Displayed on API error (`isError`)
- Icon + error message
- "Повторить" button calling `refetch` from React Query

## Styling

- Follows existing design tokens from `variables.css`
- Mobile-first: vertical layout on mobile (form on top, chart below)
- Desktop: form on left (sidebar-like panel), chart on right (main area)
- Tabs: horizontal on mobile, can be vertical on desktop
- Category colors: predefined palette of 8-10 colors, consistent across all three widgets

## Routing

- Add to `App.tsx`: `<Route path="/analytics" element={<AnalyticsPage />} />`
- `AnalyticsPage` uses the same layout pattern as other pages (Header + BottomNav/Sidebar)

## Dependencies

- **Recharts** — must be added as a new dependency (`npm install recharts`)
- Existing API hooks in `src/api/queries/financial-analytics.ts` — no changes needed
- Existing Zod schemas in `src/api/schemas/financial-analytics.ts` — no changes needed

## Out of Scope

- Data tables under charts (charts only)
- Zustand store for analytics state (local `useState` is sufficient)
- Persisting selected periods across page navigation
- Export functionality (PDF, CSV)
- Drill-down from chart segments to transaction details