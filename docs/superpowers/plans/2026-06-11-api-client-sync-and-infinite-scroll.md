# API Client Sync & Infinite Scroll Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sync the frontend API client with the updated backend spec (method changes, paged transaction endpoint) and replace the client-side-filtered transaction list with server-side filtering via infinite scroll.

**Architecture:** The transaction list endpoint moves from a simple array response to a paged response. The feature layer switches from `useQuery` + client-side filtering to `useInfiniteQuery` with server-side filter params. The `useTransactionFilters` hook becomes a pure filter-state holder (no data filtering). `TransactionPage` uses `IntersectionObserver` for infinite scroll. HTTP methods are patched across login, password, and financial-analytics endpoints. PATCH is added to the union type.

**Tech Stack:** React 19, TypeScript, TanStack React Query v5 (useInfiniteQuery), Zod v4, Zustand v5

---

### Task 1: Add PATCH to API Client

**Files:**
- Modify: `src/api/client.ts:5`

- [ ] **Step 1: Add `'PATCH'` to HttpMethod type**

In `src/api/client.ts`, change line 5:

```typescript
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
```

- [ ] **Step 2: Verify the change compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/api/client.ts
git commit -m "feat: add PATCH to HttpMethod union type"
```

---

### Task 2: Update HTTP Methods for Existing Endpoints

**Files:**
- Modify: `src/api/queries/user.ts:63`
- Modify: `src/api/queries/user.ts:87`
- Modify: `src/api/queries/financial-analytics.ts:16`
- Modify: `src/api/queries/financial-analytics.ts:29`

- [ ] **Step 1: Change login from PUT to POST**

In `src/api/queries/user.ts`, change line 63:

```typescript
      const data = await apiClient<unknown>('/api/users/login', 'POST', { body, skipAuthRefresh: true });
```

- [ ] **Step 2: Change password from PUT to PATCH**

In `src/api/queries/user.ts`, change line 87:

```typescript
      apiClient<unknown>('/api/users/password', 'PATCH', { body }),
```

- [ ] **Step 3: Change categorized-spending from PUT to POST**

In `src/api/queries/financial-analytics.ts`, change line 16:

```typescript
      apiClient<unknown>('/api/financial-analytics/categorized-spending', 'POST', {
```

- [ ] **Step 4: Change category-comparative-analysis from PUT to POST**

In `src/api/queries/financial-analytics.ts`, change line 29:

```typescript
      apiClient<unknown>('/api/financial-analytics/category-comparative-analysis', 'POST', {
```

- [ ] **Step 5: Verify the changes compile**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add src/api/queries/user.ts src/api/queries/financial-analytics.ts
git commit -m "fix: update HTTP methods to match new API spec"
```

---

### Task 3: Add Paged Result Schema

**Files:**
- Modify: `src/api/schemas/transaction.ts`

- [ ] **Step 1: Add TransactionPagedResultSchema**

Replace the entire contents of `src/api/schemas/transaction.ts` with:

```typescript
import { z } from 'zod';
import { TransactionTypeSchema } from '@/api/schemas/common';

export const TransactionApiModelSchema = z.object({
  id: z.string().uuid(),
  sourceAccountId: z.string().uuid().nullable(),
  destinationAccountId: z.string().uuid().nullable(),
  type: TransactionTypeSchema,
  amount: z.number(),
  madeAt: z.string(),
});

export type TransactionApiModel = z.infer<typeof TransactionApiModelSchema>;

export const TransactionListSchema = z.array(TransactionApiModelSchema);

export const TransactionPagedResultSchema = z.object({
  items: z.array(TransactionApiModelSchema),
  totalCount: z.number(),
  page: z.number(),
  pageSize: z.number(),
  totalPages: z.number(),
});

export type TransactionPagedResult = z.infer<typeof TransactionPagedResultSchema>;

export const CreateTransactionApiModelSchema = z.object({
  sourceAccountId: z.string().uuid().nullable(),
  destinationAccountId: z.string().uuid().nullable(),
  amount: z.number(),
});

export type CreateTransactionApiModel = z.infer<typeof CreateTransactionApiModelSchema>;

export const DeleteTransactionApiModelSchema = z.object({
  id: z.string().uuid(),
});

export type DeleteTransactionApiModel = z.infer<typeof DeleteTransactionApiModelSchema>;
```

- [ ] **Step 2: Verify the schema compiles**

Run: `npx tsc --noEmit`
Expected: No errors (no consumers of `TransactionPagedResultSchema` yet, so no breakage)

- [ ] **Step 3: Commit**

```bash
git add src/api/schemas/transaction.ts
git commit -m "feat: add TransactionPagedResultSchema for paged API response"
```

---

### Task 4: Rework Transaction Query to Use Infinite Query with Server-Side Filtering

**Files:**
- Modify: `src/api/queries/transaction.ts`

- [ ] **Step 1: Replace useTransactions with useTransactionsInfinite**

Replace the entire contents of `src/api/queries/transaction.ts` with:

```typescript
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import {
  TransactionListSchema,
  TransactionPagedResultSchema,
  TransactionApiModelSchema,
  type CreateTransactionApiModel,
  type DeleteTransactionApiModel,
} from '@/api/schemas/transaction';

const TRANSACTIONS_PAGE_SIZE = 20;

export interface TransactionsFilterParams {
  type?: number;
  accountId?: string;
}

export function useTransactionsInfinite(params: TransactionsFilterParams = {}) {
  return useInfiniteQuery({
    queryKey: ['transactions', params],
    queryFn: ({ signal, pageParam }) => {
      const searchParams = new URLSearchParams();
      searchParams.set('Page', String(pageParam));
      searchParams.set('PageSize', String(TRANSACTIONS_PAGE_SIZE));
      if (params.type !== undefined) {
        searchParams.set('Type', String(params.type));
      }
      if (params.accountId !== undefined) {
        searchParams.set('AccountId', params.accountId);
      }
      const url = `/api/transactions?${searchParams.toString()}`;
      return apiClient<unknown>(url, 'GET', { signal });
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage: unknown) => {
      const parsed = TransactionPagedResultSchema.parse(lastPage);
      if (parsed.page < parsed.totalPages) {
        return parsed.page + 1;
      }
      return undefined;
    },
    select: (data) => ({
      pages: data.pages.map((page) => TransactionPagedResultSchema.parse(page)),
      pageParams: data.pageParams,
    }),
  });
}

export function useTransactions() {
  return useQuery({
    queryKey: ['transactions'],
    queryFn: ({ signal }) =>
      apiClient<unknown>('/api/transactions/list', 'GET', { signal }),
    select: (data) => TransactionListSchema.parse(data),
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateTransactionApiModel) => {
      const data = await apiClient<unknown>('/api/transactions', 'POST', { body });
      return TransactionApiModelSchema.parse(data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['transactions'] });
      void queryClient.invalidateQueries({ queryKey: ['transaction-endpoints'] });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: DeleteTransactionApiModel) =>
      apiClient<unknown>('/api/transactions', 'DELETE', { body }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['transactions'] });
      void queryClient.invalidateQueries({ queryKey: ['transaction-endpoints'] });
    },
  });
}
```

> Note: The old `useTransactions()` (without params) is kept for backward compatibility. It still queries the old `/api/transactions/list` endpoint. Once all consumers have migrated to `useTransactionsInfinite`, it can be removed. The `queryKey: ['transactions']` invalidation in mutations covers both the old key and the prefix of the new key (`['transactions', params]`), so invalidation works for both.

- [ ] **Step 2: Verify the changes compile**

Run: `npx tsc --noEmit`
Expected: No errors (the existing `useTransactions()` still works, new `useTransactionsInfinite` is unused but valid)

- [ ] **Step 3: Commit**

```bash
git add src/api/queries/transaction.ts
git commit -m "feat: add useTransactionsInfinite with server-side filtering and pagination"
```

---

### Task 5: Rework useTransactionFilters Hook for Server-Side Filtering

**Files:**
- Modify: `src/features/transactions/hooks/useTransactionFilters.ts`

The hook no longer receives a `transactions` array. It manages filter state and returns filter params suitable for passing to the API. `filteredTransactions` is removed. `availableTypes` and `availableEndpoints` remain but `availableEndpoints` no longer depends on transaction data.

- [ ] **Step 1: Rewrite useTransactionFilters**

Replace the entire contents of `src/features/transactions/hooks/useTransactionFilters.ts` with:

```typescript
import { useState, useMemo, useCallback } from 'react';
import { TRANSACTION_TYPE_LABELS } from '@/features/transactions/types';
import { useTransactionEndpoints } from '@/api/queries/transaction-endpoint';
import { TransactionType } from '@/api/schemas/common';
import type { TransactionsFilterParams } from '@/api/queries/transaction';

export interface UseTransactionFiltersReturn {
  selectedType: number | null;
  setSelectedType: (type: number | null) => void;
  selectedEndpointId: string | null;
  setSelectedEndpointId: (id: string | null) => void;
  filterParams: TransactionsFilterParams;
  availableTypes: { value: string | null; label: string }[];
  availableEndpoints: { value: string | null; label: string }[];
}

export function useTransactionFilters(): UseTransactionFiltersReturn {
  const [selectedType, setSelectedTypeState] = useState<number | null>(null);
  const [selectedEndpointId, setSelectedEndpointIdState] = useState<string | null>(null);

  const { data: endpoints = [] } = useTransactionEndpoints();

  const setSelectedType = useCallback((type: number | null) => {
    setSelectedTypeState(type);
  }, []);

  const setSelectedEndpointId = useCallback((id: string | null) => {
    setSelectedEndpointIdState(id);
  }, []);

  const filterParams = useMemo<TransactionsFilterParams>(() => {
    const params: TransactionsFilterParams = {};
    if (selectedType !== null) {
      params.type = selectedType;
    }
    if (selectedEndpointId !== null) {
      params.accountId = selectedEndpointId;
    }
    return params;
  }, [selectedType, selectedEndpointId]);

  const availableTypes = useMemo(() => {
    const excludedTypes = new Set([4, 5]);
    const types = Object.entries(TRANSACTION_TYPE_LABELS)
      .filter(([value]) => !excludedTypes.has(Number(value)))
      .map(([value, label]) => ({
        value,
        label,
      }));
    return [{ value: null, label: 'Все' }, ...types];
  }, []);

  const availableEndpoints = useMemo(() => {
    const walletsOnlyTypes: number[] = [
      TransactionType.Transfer,
      TransactionType.AdjustmentIncrease,
      TransactionType.Income,
    ];
    const isWalletsOnly = selectedType !== null && walletsOnlyTypes.includes(selectedType);

    const filteredEndpoints = isWalletsOnly
      ? endpoints.filter((ep) => ep.isStorage)
      : endpoints;

    const endpointOptions = filteredEndpoints.map((ep) => ({
      value: ep.id,
      label: ep.name ?? '',
    }));
    return [{ value: null, label: 'Все' }, ...endpointOptions];
  }, [endpoints, selectedType]);

  return {
    selectedType,
    setSelectedType,
    selectedEndpointId,
    setSelectedEndpointId,
    filterParams,
    availableTypes,
    availableEndpoints,
  };
}
```

- [ ] **Step 2: Verify the changes compile**

Run: `npx tsc --noEmit`
Expected: No errors (TransactionPage still calls `useTransactionFilters(transactions)` — will be fixed in Task 6/7)

Actually, this WILL produce a compile error because the call site passes an argument now. Let me check — yes, the current `useTransactionFilters` takes `(transactions: Transaction[])` and we're removing that param. But we'll fix all call sites in Tasks 6 and 7. Let's verify this compiles by temporarily checking:

Run: `npx tsc --noEmit 2>&1 | head -30`

Expected: A compile error in `TransactionPage.tsx` about too many arguments to `useTransactionFilters`. This is expected; the call-site fix is in Task 7.

- [ ] **Step 3: Commit**

```bash
git add src/features/transactions/hooks/useTransactionFilters.ts
git commit -m "refactor: useTransactionFilters returns filter params instead of filtered data"
```

---

### Task 6: Rework useTransactions Feature Hook for Infinite Scroll

**Files:**
- Modify: `src/features/transactions/hooks/useTransactions.ts`

This hook switches from using the old `useTransactions` query to the new `useTransactionsInfinite`. It accepts `filterParams`, flattens all loaded pages, and applies optimistic-delete filtering. It returns infinite-scroll controls.

- [ ] **Step 1: Rewrite useTransactions**

Replace the entire contents of `src/features/transactions/hooks/useTransactions.ts` with:

```typescript
import { useMemo } from 'react';
import { useTransactionsInfinite, useDeleteTransaction } from '@/api/queries/transaction';
import type { TransactionsFilterParams } from '@/api/queries/transaction';
import { useTransactionStore } from '@/store/useTransactionStore';
import type { Transaction } from '@/features/transactions/types';

interface UseTransactionsReturn {
  transactions: Transaction[];
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isLoading: boolean;
  error: Error | null;
  deleteTransaction: (id: string) => Promise<void>;
  undoDelete: (id: string) => void;
}

export function useTransactions(filterParams: TransactionsFilterParams = {}): UseTransactionsReturn {
  const infiniteQuery = useTransactionsInfinite(filterParams);
  const deleteMutation = useDeleteTransaction();
  const optimisticDeleted = useTransactionStore((state) => state.optimisticDeleted);
  const undoDelete = useTransactionStore((state) => state.undoDelete);

  const transactions = useMemo(() => {
    if (!infiniteQuery.data?.pages) return [];

    const allItems = infiniteQuery.data.pages.flatMap((page) => page.items);
    return allItems.filter((tx) => !optimisticDeleted.has(tx.id));
  }, [infiniteQuery.data?.pages, optimisticDeleted]);

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync({ id });
  };

  return {
    transactions,
    fetchNextPage: infiniteQuery.fetchNextPage,
    hasNextPage: infiniteQuery.hasNextPage ?? false,
    isFetchingNextPage: infiniteQuery.isFetchingNextPage,
    isLoading: infiniteQuery.isLoading,
    error: infiniteQuery.error,
    deleteTransaction: handleDelete,
    undoDelete,
  };
}
```

- [ ] **Step 2: Verify the changes compile**

Run: `npx tsc --noEmit 2>&1 | head -30`
Expected: Errors only in `TransactionPage.tsx` (call-site mismatches) — fixed in Task 7.

- [ ] **Step 3: Commit**

```bash
git add src/features/transactions/hooks/useTransactions.ts
git commit -m "refactor: useTransactions uses infinite query with server-side filters"
```

---

### Task 7: Update TransactionPage for Infinite Scroll

**Files:**
- Modify: `src/pages/TransactionPage/TransactionPage.tsx`
- Modify: `src/pages/TransactionPage/TransactionPage.module.css`

The page switches from passing `transactions` to `useTransactionFilters` and from rendering `filters.filteredTransactions` to rendering the infinite-scroll list. An `IntersectionObserver` sentinel element at the bottom triggers `fetchNextPage`.

- [ ] **Step 1: Update TransactionPage.tsx**

Replace the entire contents of `src/pages/TransactionPage/TransactionPage.tsx` with:

```typescript
import { useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header/Header';
import { BottomNav } from '@/components/BottomNav/BottomNav';
import { useToastStore } from '@/store/useToastStore';
import { TransactionCard } from '@/features/transactions/components/TransactionCard';
import { TransactionFilters } from '@/features/transactions/components/TransactionFilters';
import { useTransactions } from '@/features/transactions/hooks/useTransactions';
import { useTransactionFilters } from '@/features/transactions/hooks/useTransactionFilters';
import { useTransactionStore } from '@/store/useTransactionStore';
import plusIcon from '@/assets/plus-icon.svg';
import styles from './TransactionPage.module.css';

export function TransactionPage() {
  const filters = useTransactionFilters();
  const { transactions, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error, deleteTransaction, undoDelete } =
    useTransactions(filters.filterParams);
  const markOptimisticDeleted = useTransactionStore((s) => s.markOptimisticDeleted);
  const confirmDeleted = useTransactionStore((s) => s.confirmDeleted);
  const navigate = useNavigate();

  const showErrorToast = useToastStore((s) => s.showError);

  const handleDelete = useCallback(
    (id: string) => {
      useToastStore.getState().addToast('Транзакция удалена', 'success', {
        actionLabel: 'Отмена',
        onAction: () => {
          undoDelete(id);
        },
      });

      markOptimisticDeleted(id, async () => {
        try {
          await deleteTransaction(id);
          confirmDeleted(id);
        } catch {
          undoDelete(id);
          showErrorToast('Ошибка удаления транзакции');
        }
      });
    },
    [deleteTransaction, markOptimisticDeleted, confirmDeleted, undoDelete, showErrorToast],
  );

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <div className={styles.page}>
        <Header />
        <main className={styles.content}>
          <p className={styles.emptyText}>Загрузка...</p>
        </main>
        <BottomNav />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <Header />
        <main className={styles.content}>
          <p className={styles.emptyText}>Ошибка загрузки транзакций</p>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Header />

      <main className={styles.content}>
        <TransactionFilters filters={filters} onAddClick={() => navigate('/transactions/add')} />

        <hr className={styles.listSeparator} />

        <div className={styles.scrollArea}>
          {transactions.length === 0 ? (
            <p className={styles.emptyText}>Транзакций пока нет</p>
          ) : (
            transactions.map((tx) => (
              <TransactionCard key={tx.id} transaction={tx} onDelete={handleDelete} />
            ))
          )}
          <div ref={sentinelRef} className={styles.sentinel} />
          {isFetchingNextPage && (
            <p className={styles.loadingMore}>Загрузка...</p>
          )}
        </div>
      </main>

      <button
        className={styles.mobileAddButton}
        onClick={() => navigate('/transactions/add')}
        aria-label="Добавить транзакцию"
      >
        <img src={plusIcon} alt="" />
      </button>

      <BottomNav />
    </div>
  );
}
```

- [ ] **Step 2: Add CSS for sentinel and loading-more**

Append the following styles to `src/pages/TransactionPage/TransactionPage.module.css`:

```css
.sentinel {
  height: 1px;
  width: 100%;
}

.loadingMore {
  font-family: var(--font);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  text-align: center;
  padding: var(--spacing-md) 0;
}
```

- [ ] **Step 3: Verify the changes compile**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/pages/TransactionPage/TransactionPage.tsx src/pages/TransactionPage/TransactionPage.module.css
git commit -m "feat: TransactionPage uses infinite scroll via IntersectionObserver"
```

---

### Task 8: Update TransactionFilters Component

**Files:**
- Modify: `src/features/transactions/components/TransactionFilters.tsx`

The `filters` prop type changes because `UseTransactionFiltersReturn` no longer has `filteredTransactions`. The component itself only uses `selectedType`, `setSelectedType`, `availableTypes`, `selectedEndpointId`, `setSelectedEndpointId`, and `availableEndpoints` — none of which changed in shape. However, we should verify the component still compiles with the updated return type.

- [ ] **Step 1: Verify TransactionFilters compiles with updated return type**

The component at `src/features/transactions/components/TransactionFilters.tsx` references `filters.availableTypes`, `filters.selectedType`, `filters.setSelectedType`, `filters.availableEndpoints`, `filters.selectedEndpointId`, and `filters.setSelectedEndpointId`. All of these fields are still present in the updated `UseTransactionFiltersReturn` type. The only removed field is `filteredTransactions`, which the component does not reference.

No changes needed to the component file itself. The TypeScript type `UseTransactionFiltersReturn` was already updated in Task 5, and the component's interface uses that type, so it automatically picks up the new shape.

- [ ] **Step 2: Verify everything compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Run linter**

Run: `npm run lint` (or whatever the lint command is)

Expected: No errors related to these changes

- [ ] **Step 4: Commit (if any lint fixes were needed)**

```bash
git add -A
git commit -m "chore: lint fixes from infinite scroll migration"
```

---

## Self-Review Checklist

- [ ] **Spec coverage:** All 4 HTTP method changes covered (Task 2). Paged result schema (Task 3). Infinite query (Task 4). Filter hook rework (Task 5). Feature hook rework (Task 6). Page + infinite scroll (Task 7). Filters component (Task 8). PATCH HttpMethod (Task 1).
- [ ] **Placeholder scan:** No TBD, TODO, "implement later", or "similar to" references. All code shown inline.
- [ ] **Type consistency:** `TransactionsFilterParams` exported from `src/api/queries/transaction.ts` and imported in `useTransactionFilters.ts` and `useTransactions.ts`. `UseTransactionFiltersReturn` updated in hook file and referenced in `TransactionFilters.tsx`. `TransactionPagedResultSchema` defined in schemas and used in the infinite query `select`. `Transaction` type from `features/transactions/types.ts` used consistently.