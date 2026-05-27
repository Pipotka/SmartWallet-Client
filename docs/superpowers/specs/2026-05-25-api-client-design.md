# API Client Design Specification

## Overview

Connect the SmartWallet .NET backend to the React frontend. Stack: TanStack Query + fetch + Zod. Runtime configuration for Docker deployment.

## Decisions

1. **Authentication:** httpOnly cookie (backend sets JWT cookie, frontend sends `credentials: include`)
2. **Configuration:** Dynamic JSON file in `public/config.json`, loaded via fetch at app startup (no rebuild needed for Docker)
3. **State management:** Zustand for UI state only, TanStack Query for server data
4. **API client structure:** Approach A — separate `schemas/` and `queries/` directories with a base fetch wrapper in `client.ts`
5. **Hooks pattern:** One TanStack Query hook per endpoint

## 1. Runtime Configuration

**File:** `public/config.json`
```json
{
  "apiBaseUrl": "https://api.smartwallet.example.com"
}
```

**Loader:** `src/api/config.ts`
- `loadConfig()` — async, fetches `/config.json`, caches result in module variable
- `getConfig()` — sync getter, returns cached config
- Called in `main.tsx` before React render

**Docker integration:**
- `config.json` in `public/` is copied to dist as-is (not hashed by Vite)
- In Docker: mount or replace `config.json` via volume / entrypoint script

## 2. Base API Client

**File:** `src/api/client.ts`

```typescript
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

class ApiError extends Error {
  constructor(public statusCode: number, public data: ApiExceptionDetails | ProblemDetails | unknown) {
    super();
  }
}

async function apiClient<T>(
  path: string,
  method: HttpMethod,
  options?: { body?: unknown; signal?: AbortSignal }
): Promise<T>
```

**Behavior:**
- Prepends `getConfig().apiBaseUrl` to path
- Sets `credentials: 'include'` for httpOnly cookie
- Sets `Content-Type: application/json` when body exists
- Parses response JSON
- On non-2xx: parses error body as `ApiExceptionDetails` or `ProblemDetails`, throws `ApiError`
- Does NOT perform Zod validation — that's the hooks' responsibility

## 3. Zod Schemas

**Directory:** `src/api/schemas/`

### `common.ts`
- `ApiExceptionDetailsSchema` — `{ statusCode: z.number(), message: z.string().nullable() }`
- `ProblemDetailsSchema` — `{ type, title, status, detail, instance: z.string().nullable() }`
- `TimeUnitSchema` — `z.nativeEnum(TimeUnit)` where `enum TimeUnit { Day = 0, Month = 1, Year = 2 }`
- `TransactionTypeSchema` — `z.nativeEnum(TransactionType)` where `enum TransactionType { Transfer = 0, Expense = 1, AdjustmentDecrease = 2, AdjustmentIncrease = 3, Income = 4, ForTest = 5 }`

### `transaction.ts`
- `TransactionApiModelSchema` — `{ id: z.string().uuid(), sourceAccountId: z.string().uuid().nullable(), destinationAccountId: z.string().uuid().nullable(), type: TransactionTypeSchema, amount: z.number(), madeAt: z.string() }`
- `TransactionListSchema` — `z.array(TransactionApiModelSchema)`
- `CreateTransactionApiModelSchema` — `{ sourceAccountId: z.string().uuid().nullable(), destinationAccountId: z.string().uuid().nullable(), amount: z.number() }`
- `DeleteTransactionApiModelSchema` — `{ id: z.string().uuid() }`

### `transaction-endpoint.ts`
- `TransactionEndpointApiModelSchema` — `{ id: z.string().uuid(), name: z.string().nullable(), value: z.number(), limitation: z.number().nullable(), isStorage: z.boolean() }`
- `TransactionEndpointListSchema` — `z.array(TransactionEndpointApiModelSchema)`
- `CreateTransactionEndpointApiModelSchema` — `{ name: z.string().nullable(), limitation: z.number().nullable(), isStorage: z.boolean() }`
- `UpdateTransactionEndpointApiModelSchema` — `{ id: z.string().uuid(), name: z.string().nullable(), limitation: z.number().nullable() }`
- `DeleteTransactionEndpointApiModelSchema` — `{ id: z.string().uuid() }`

### `financial-analytics.ts`
- `CategorizingSpendingApiRequestSchema` — `{ startDate: z.string(), endDate: z.string() }`
- `CategorizingSpendingApiResponseSchema` — `{ totalSpending: z.number(), categories: z.array(CategorySpendingItemApiModelSchema).nullable() }`
- `CategorySpendingItemApiModelSchema` — `{ categoryId: z.string().uuid(), categoryName: z.string().nullable(), totalAmount: z.number() }`
- `CategoryComparativeAnalysisApiRequestSchema` — `{ firstPeriod: z.string(), secondPeriod: z.string(), timeUnit: TimeUnitSchema, timeUnitCount: z.number() }`
- `CategoryComparativeAnalysisResponseSchema` — `{ totalSecondPeriodSpending: z.number(), totalFirstPeriodSpending: z.number(), categoryComparativeAnalyses: z.array(CategoryComparativeAnalysisApiModelSchema).nullable() }`
- `CategoryComparativeAnalysisApiModelSchema` — `{ categoryId: z.string().uuid(), categoryName: z.string().nullable(), secondPeriodAmount: z.number(), firstPeriodAmount: z.number() }`
- `SpendingTrendLineApiRequestSchema` — `{ startDate: z.string(), endDate: z.string(), timeUnit: TimeUnitSchema }`
- `SpendingTrendLineApiResponseSchema` — `{ labels: z.array(z.string()).nullable(), categories: z.array(SpendingTrendLineCategoryApiModelSchema).nullable() }`
- `SpendingTrendLineCategoryApiModelSchema` — `{ name: z.string().nullable(), nodes: z.array(SpendingTrendLineNodeApiModelSchema).nullable() }`
- `SpendingTrendLineNodeApiModelSchema` — `{ label: z.string().nullable(), amount: z.number() }`

### `user.ts`
- `UserApiModelSchema` — `{ id: z.string().uuid(), email: z.string().nullable(), firstName: z.string().nullable(), lastName: z.string().nullable(), patronymic: z.string().nullable() }`
- `CreateUserApiModelSchema` — `{ email: z.string().nullable(), firstName: z.string().nullable(), lastName: z.string().nullable(), patronymic: z.string().nullable(), password: z.string().nullable() }`
- `UpdateUserApiModelSchema` — `{ firstName: z.string().nullable(), lastName: z.string().nullable(), patronymic: z.string().nullable() }`
- `DeleteUserApiModelSchema` — `{ password: z.string().nullable() }`
- `RequestLogInApiModelSchema` — `{ email: z.string().nullable(), password: z.string().nullable() }`
- `ResponseLogInApiModelSchema` — `{ jwtToken: z.string().nullable() }`
- `ChangePasswordApiModelSchema` — `{ oldPassword: z.string().nullable(), newPassword: z.string().nullable() }`

## 4. TanStack Query Hooks

**Directory:** `src/api/queries/`

### Pattern for Queries (GET):
```typescript
export function useTransactions() {
  return useQuery({
    queryKey: ['transactions'],
    queryFn: () => apiClient<unknown>('/api/Transaction/list', 'GET'),
    select: (data) => TransactionListSchema.parse(data),
  });
}
```

### Pattern for Mutations (POST/PUT/DELETE):
```typescript
export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: z.infer<typeof CreateTransactionApiModelSchema>) =>
      apiClient('/api/Transaction', 'POST', { body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}
```

### Hook List:

**`transaction.ts`:**
- `useTransactions()` — GET `/api/Transaction/list` → `TransactionApiModel[]`
- `useCreateTransaction()` — POST `/api/Transaction` → `TransactionApiModel`
- `useDeleteTransaction()` — DELETE `/api/Transaction` → `void`

**`transaction-endpoint.ts`:**
- `useTransactionEndpoints()` — GET `/api/TransactionEndpoint/list` → `TransactionEndpointApiModel[]`
- `useCreateTransactionEndpoint()` — POST `/api/TransactionEndpoint` → `TransactionEndpointApiModel`
- `useUpdateTransactionEndpoint()` — PUT `/api/TransactionEndpoint` → `TransactionEndpointApiModel`
- `useDeleteTransactionEndpoint()` — DELETE `/api/TransactionEndpoint` → `void`

**`financial-analytics.ts`:**
- `useCategorizedSpending(request)` — PUT `/api/FinancialAnalytics/categorized-spending` → `CategorizingSpendingApiResponse`
- `useCategoryComparativeAnalysis(request)` — PUT `/api/FinancialAnalytics/category-comparative-analysis` → `CategoryComparativeAnalysisResponse`
- `useSpendingTrendLine(request)` — PUT `/api/FinancialAnalytics/spending-trend-line` → `SpendingTrendLineApiResponse`
- Note: These are PUT endpoints but semantically queries. Use `useQuery` with queryFn calling PUT. queryKey includes request params.

**`user.ts`:**
- `useUser()` — GET `/api/User` → `UserApiModel`
- `useCreateUser()` — POST `/api/User` → `UserApiModel`
- `useUpdateUser()` — PUT `/api/User` → `UserApiModel`
- `useDeleteUser()` — DELETE `/api/User` → `void`
- `useLogin()` — PUT `/api/User/login` → `ResponseLogInApiModel`
- `useChangePassword()` — PUT `/api/User/password` → `void`

## 5. Integration & Migration

### App Bootstrap (`main.tsx`):
1. `loadConfig()` — fetch config.json
2. Create `QueryClient`
3. Render `<QueryClientProvider><App /></QueryClientProvider>`

### Zustand Migration:
- **`useTransactionStore`**: Server data → TanStack Query hooks. UI state (optimisticDeleted, undoDelete) → remain in Zustand or local component state.
- **`useWalletStore`**: Server data (endpoints, userInfo) → TanStack Query hooks. UI-only state removed from store.
- New Zustand stores only for UI state if needed.

### Type Updates:
- `src/types/index.ts` — align with API schemas (uuid for id fields, nullable per spec)
- `src/features/transactions/types.ts` — update `TransactionType` to numeric enum matching API

### Component Updates:
- Pages and components switch from Zustand store calls to TanStack Query hooks
- Data via `data`, loading via `isLoading`, errors via `error` from hooks

## File Structure Summary

```
src/
  api/
    client.ts              — Base fetch wrapper
    config.ts              — Runtime config loader
    schemas/
      common.ts            — Shared schemas (ApiExceptionDetails, ProblemDetails, enums)
      transaction.ts       — Transaction Zod schemas
      transaction-endpoint.ts — TransactionEndpoint Zod schemas
      financial-analytics.ts  — FinancialAnalytics Zod schemas
      user.ts              — User Zod schemas
    queries/
      transaction.ts       — Transaction hooks
      transaction-endpoint.ts — TransactionEndpoint hooks
      financial-analytics.ts  — FinancialAnalytics hooks
      user.ts              — User hooks
  main.tsx                 — Updated: loadConfig + QueryClientProvider
public/
  config.json              — Runtime configuration
```