# Auth System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement full client-side dual-token authentication (access token + httpOnly refresh cookie) with Zustand auth store, 401 interceptor with automatic refresh, route protection, and logout.

**Architecture:** Hybrid approach — apiClient extended with auth awareness (header injection, 401 interception, refresh with Promise queue), Zustand store for in-memory token state, ProtectedRoute component for route guards. Refresh token handled via httpOnly cookie (browser sends automatically).

**Tech Stack:** React, TypeScript, Zustand (state), TanStack React Query (server state), React Router v7 (routing), Zod (validation), custom fetch-based apiClient

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `/src/store/useAuthStore.ts` | CREATE | Zustand store: accessToken state, isAuthenticated, setAccessToken, clearAuth |
| `/src/api/schemas/user.ts` | MODIFY | Rename jwtToken→accessToken, add ResponseRefreshApiModelSchema |
| `/src/api/client.ts` | MODIFY | Add Authorization header, 401 interceptor, refreshAccessToken with Promise queue |
| `/src/api/queries/user.ts` | MODIFY | Update useLogin to store token, add useLogout mutation |
| `/src/components/ProtectedRoute/ProtectedRoute.tsx` | CREATE | Route guard component, redirects to /login if not authenticated |
| `/src/components/ProtectedRoute/ProtectedRoute.module.css` | CREATE | Loading spinner styles for auth init |
| `/src/hooks/useAuthInit.ts` | CREATE | Hook to restore session on app mount via refresh |
| `/src/App.tsx` | MODIFY | Wrap protected routes in ProtectedRoute, add auth init, remove isAuthPage logic |
| `/src/pages/LoginPage/LoginPage.tsx` | MODIFY | Store accessToken on successful login |
| `/src/components/Sidebar/Sidebar.tsx` | MODIFY | Add logout button |
| `/src/components/Sidebar/Sidebar.module.css` | MODIFY | Add logout button styles |
| `/src/pages/ProfilePage/ProfilePage.tsx` | MODIFY | Add logout button for mobile |

---

### Task 1: Create Auth Store

**Files:**
- Create: `/src/store/useAuthStore.ts`

- [ ] **Step 1: Create the auth store file**

```typescript
// /src/store/useAuthStore.ts
import { create } from 'zustand';

interface AuthState {
  accessToken: string | null;
  isAuthenticated: boolean;
  setAccessToken: (token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  isAuthenticated: false,
  setAccessToken: (token: string) =>
    set({ accessToken: token, isAuthenticated: true }),
  clearAuth: () =>
    set({ accessToken: null, isAuthenticated: false }),
}));
```

- [ ] **Step 2: Verify the store compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors related to useAuthStore

- [ ] **Step 3: Commit**

```bash
git add src/store/useAuthStore.ts
git commit -m "feat: add Zustand auth store for access token state"
```

---

### Task 2: Update Zod Schemas

**Files:**
- Modify: `/src/api/schemas/user.ts`

- [ ] **Step 1: Update ResponseLogInApiModelSchema and add ResponseRefreshApiModelSchema**

In `/src/api/schemas/user.ts`, replace lines 44-48 with:

```typescript
export const ResponseLogInApiModelSchema = z.object({
  accessToken: z.string(),
});

export type ResponseLogInApiModel = z.infer<typeof ResponseLogInApiModelSchema>;

export const ResponseRefreshApiModelSchema = z.object({
  accessToken: z.string(),
});

export type ResponseRefreshApiModel = z.infer<typeof ResponseRefreshApiModelSchema>;
```

This changes `jwtToken: z.string().nullable()` to `accessToken: z.string()` (non-nullable, matching the backend) and adds the new refresh response schema.

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: May show errors in files that reference `jwtToken` — these will be fixed in later tasks.

- [ ] **Step 3: Commit**

```bash
git add src/api/schemas/user.ts
git commit -m "feat: update login schema (jwtToken→accessToken), add refresh schema"
```

---

### Task 3: Modify apiClient — Auth Header, 401 Interceptor, Refresh Logic

**Files:**
- Modify: `/src/api/client.ts`

- [ ] **Step 1: Rewrite apiClient with auth support**

Replace the entire content of `/src/api/client.ts` with:

```typescript
import { getConfig } from '@/api/config';
import { useAuthStore } from '@/store/useAuthStore';
import { ResponseRefreshApiModelSchema } from '@/api/schemas/user';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export class ApiError extends Error {
  public statusCode: number;
  public data: unknown;

  constructor(statusCode: number, data: unknown) {
    super(`API error ${statusCode}`);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.data = data;
  }
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const { apiBaseUrl } = getConfig();
      const response = await fetch(`${apiBaseUrl}/api/users/refresh`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        return null;
      }

      const data: unknown = await response.json();
      const parsed = ResponseRefreshApiModelSchema.safeParse(data);
      if (!parsed.success) {
        return null;
      }

      useAuthStore.getState().setAccessToken(parsed.data.accessToken);
      return parsed.data.accessToken;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export { refreshAccessToken };

async function apiClientInternal<T>(
  path: string,
  method: HttpMethod,
  options?: { body?: unknown; signal?: AbortSignal },
  isRetry?: boolean,
): Promise<T> {
  const { apiBaseUrl } = getConfig();
  const url = `${apiBaseUrl}${path}`;

  const headers: Record<string, string> = {};
  let body: string | undefined;

  if (options?.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.body);
  }

  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(url, {
    method,
    headers,
    body,
    signal: options?.signal,
    credentials: 'include',
  });

  if (response.status === 401 && !isRetry) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return apiClientInternal<T>(path, method, options, true);
    }
    useAuthStore.getState().clearAuth();
    window.location.href = '/login';
    throw new ApiError(401, { message: 'Session expired' });
  }

  if (!response.ok) {
    let errorData: unknown;
    try {
      errorData = await response.json();
    } catch {
      errorData = null;
    }
    throw new ApiError(response.status, errorData);
  }

  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return undefined as T;
  }

  const data: T = await response.json();
  return data;
}

export async function apiClient<T>(
  path: string,
  method: HttpMethod,
  options?: { body?: unknown; signal?: AbortSignal },
): Promise<T> {
  return apiClientInternal<T>(path, method, options, false);
}
```

Key changes:
- Import `useAuthStore` and `ResponseRefreshApiModelSchema`
- Add `refreshAccessToken()` function with Promise queue for concurrent 401s
- Add `Authorization: Bearer` header from auth store
- On 401: attempt refresh, retry once, if refresh fails → clear auth + redirect to /login
- `isRetry` parameter prevents infinite recursion
- Export `refreshAccessToken` for use in `useAuthInit`

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors related to client.ts. Other files may still have errors from schema changes.

- [ ] **Step 3: Commit**

```bash
git add src/api/client.ts
git commit -m "feat: add auth header injection, 401 interceptor, and refresh logic to apiClient"
```

---

### Task 4: Update Auth Query Hooks

**Files:**
- Modify: `/src/api/queries/user.ts`

- [ ] **Step 1: Update useLogin and add useLogout**

Replace the entire content of `/src/api/queries/user.ts` with:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import {
  UserApiModelSchema,
  type CreateUserApiModel,
  type UpdateUserApiModel,
  type DeleteUserApiModel,
  type RequestLogInApiModel,
  ResponseLogInApiModelSchema,
  type ChangePasswordApiModel,
} from '@/api/schemas/user';
import { useAuthStore } from '@/store/useAuthStore';

export function useUser() {
  return useQuery({
    queryKey: ['user'],
    queryFn: ({ signal }) =>
      apiClient<unknown>('/api/User', 'GET', { signal }),
    select: (data) => UserApiModelSchema.parse(data),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateUserApiModel) => {
      const data = await apiClient<unknown>('/api/User', 'POST', { body });
      return UserApiModelSchema.parse(data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: UpdateUserApiModel) => {
      const data = await apiClient<unknown>('/api/User', 'PUT', { body });
      return UserApiModelSchema.parse(data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: DeleteUserApiModel) =>
      apiClient<unknown>('/api/User', 'DELETE', { body }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
}

export function useLogin() {
  return useMutation({
    mutationFn: async (body: RequestLogInApiModel) => {
      const data = await apiClient<unknown>('/api/User/login', 'PUT', { body });
      return ResponseLogInApiModelSchema.parse(data);
    },
    onSuccess: (data) => {
      useAuthStore.getState().setAccessToken(data.accessToken);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiClient<unknown>('/api/User/logout', 'POST'),
    onSuccess: () => {
      useAuthStore.getState().clearAuth();
      void queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (body: ChangePasswordApiModel) =>
      apiClient<unknown>('/api/User/password', 'PUT', { body }),
  });
}
```

Key changes:
- Import `useAuthStore`
- `useLogin`: added `onSuccess` callback that stores `accessToken` in auth store
- `useLogout`: new mutation for `POST /api/users/logout`, clears auth and invalidates user queries on success

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors related to user.ts queries.

- [ ] **Step 3: Commit**

```bash
git add src/api/queries/user.ts
git commit -m "feat: update useLogin to store token, add useLogout mutation"
```

---

### Task 5: Create ProtectedRoute Component

**Files:**
- Create: `/src/components/ProtectedRoute/ProtectedRoute.tsx`
- Create: `/src/components/ProtectedRoute/ProtectedRoute.module.css`

- [ ] **Step 1: Create ProtectedRoute component**

```typescript
// /src/components/ProtectedRoute/ProtectedRoute.tsx
import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { refreshAccessToken } from '@/api/client';
import styles from './ProtectedRoute.module.css';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

export function AuthInitGuard({ children }: ProtectedRouteProps) {
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    refreshAccessToken()
      .then((token) => {
        if (!token) {
          useAuthStore.getState().clearAuth();
        }
      })
      .catch(() => {
        useAuthStore.getState().clearAuth();
      })
      .finally(() => {
        setIsInitializing(false);
      });
  }, []);

  if (isInitializing) {
    return (
      <div className={styles.loadingOverlay}>
        <div className={styles.spinner} />
      </div>
    );
  }

  return <>{children}</>;
}
```

Wait — I need to import `useState`, `useEffect`, and `refreshAccessToken`. Let me fix this:

```typescript
// /src/components/ProtectedRoute/ProtectedRoute.tsx
import { type ReactNode, useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { refreshAccessToken } from '@/api/client';
import styles from './ProtectedRoute.module.css';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

export function AuthInitGuard({ children }: ProtectedRouteProps) {
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    refreshAccessToken()
      .then((token) => {
        if (!token) {
          useAuthStore.getState().clearAuth();
        }
      })
      .catch(() => {
        useAuthStore.getState().clearAuth();
      })
      .finally(() => {
        setIsInitializing(false);
      });
  }, []);

  if (isInitializing) {
    return (
      <div className={styles.loadingOverlay}>
        <div className={styles.spinner} />
      </div>
    );
  }

  return <>{children}</>;
}
```

- [ ] **Step 2: Create ProtectedRoute styles**

```css
/* /src/components/ProtectedRoute/ProtectedRoute.module.css */
.loadingOverlay {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100dvh;
  background-color: var(--color-bg, #1a1a2e);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-neutral-600, #4a4a6a);
  border-top-color: var(--color-blue-500, #3b82f6);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
```

- [ ] **Step 3: Verify compilation**

Run: `npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors related to ProtectedRoute.

- [ ] **Step 4: Commit**

```bash
git add src/components/ProtectedRoute/
git commit -m "feat: add ProtectedRoute and AuthInitGuard components"
```

---

### Task 6: Update Login Page

**Files:**
- Modify: `/src/pages/LoginPage/LoginPage.tsx`

- [ ] **Step 1: Update LoginPage to store access token**

In `/src/pages/LoginPage/LoginPage.tsx`, update the `onSubmit` handler. The `useLogin` hook now automatically stores the token via its `onSuccess` callback, so we just need to remove the old pattern where the result was discarded.

The current code (lines 37-46):
```typescript
onSubmit: async (values) => {
  try {
    await loginMutation.mutateAsync({
      email: values.email,
      password: values.password,
    });
    navigate('/');
  } catch {
    // Error handling — could show a toast in the future
  }
},
```

Since `useLogin` now stores the token in its `onSuccess` callback, the LoginPage code stays almost the same — the `mutateAsync` call triggers the hook's `onSuccess` which stores the token. No changes needed to the `onSubmit` handler itself.

However, we should also handle the case where the user is already authenticated and visits `/login` — redirect them to `/`:

Add this import at the top:
```typescript
import { useAuthStore } from '@/store/useAuthStore';
```

Add this redirect check inside the `LoginPage` function, before the form:
```typescript
const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
if (isAuthenticated) {
  return <Navigate to="/" replace />;
}
```

Add `Navigate` to the import from `react-router-dom`:
```typescript
import { useNavigate, Navigate } from 'react-router-dom';
```

The full updated LoginPage:

```typescript
import { useNavigate, Navigate } from 'react-router-dom';
import { useForm } from '@/hooks/useForm';
import type { LoginFormData } from '@/types';
import { useLogin } from '@/api/queries/user';
import { useAuthStore } from '@/store/useAuthStore';
import { AuthLayout } from '@/components/AuthLayout/AuthLayout';
import { InputField } from '@/components/InputField/InputField';
import { Button } from '@/components/Button/Button';
import styles from './LoginPage.module.css';

function validateLogin(values: LoginFormData): Partial<Record<keyof LoginFormData, string>> {
  const errors: Partial<Record<keyof LoginFormData, string>> = {};

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!values.email.trim()) {
    errors.email = 'Поле обязательно для заполнения';
  } else if (!emailRegex.test(values.email)) {
    errors.email = 'Введите корректный email';
  }

  if (!values.password) {
    errors.password = 'Поле обязательно для заполнения';
  }

  return errors;
}

export function LoginPage() {
  const navigate = useNavigate();
  const loginMutation = useLogin();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const form = useForm<LoginFormData>({
    initialValues: {
      email: '',
      password: '',
    },
    validate: validateLogin,
    onSubmit: async (values) => {
      try {
        await loginMutation.mutateAsync({
          email: values.email,
          password: values.password,
        });
        navigate('/');
      } catch {
        // Error handling — could show a toast in the future
      }
    },
  });

  return (
    <AuthLayout title="Вход в Smart Wallet">
      <form className={styles.form} onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
        <InputField
          label="Email"
          type="email"
          value={form.values.email}
          onChange={form.handleChange('email')}
          onBlur={() => form.handleBlur('email')}
          error={!!form.touched.email && !!form.errors.email}
          errorText={form.touched.email ? form.errors.email : undefined}
        />
        <InputField
          label="Пароль"
          type="password"
          value={form.values.password}
          onChange={form.handleChange('password')}
          onBlur={() => form.handleBlur('password')}
          error={!!form.touched.password && !!form.errors.password}
          errorText={form.touched.password ? form.errors.password : undefined}
        />

        <div className={styles.submitRow}>
          <Button variant="primary" fullWidth type="submit">
            Войти
          </Button>
        </div>
      </form>

      <div className={styles.registerLink}>
        Новый пользователь Smart Wallet?
        <br />
        <span
          className={styles.link}
          onClick={() => navigate('/register')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/register'); }}
        >
          Создать аккаунт
        </span>
      </div>
    </AuthLayout>
  );
}
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors related to LoginPage.

- [ ] **Step 3: Commit**

```bash
git add src/pages/LoginPage/LoginPage.tsx
git commit -m "feat: redirect authenticated users away from login page"
```

---

### Task 7: Add Logout to Sidebar

**Files:**
- Modify: `/src/components/Sidebar/Sidebar.tsx`
- Modify: `/src/components/Sidebar/Sidebar.module.css`

- [ ] **Step 1: Add logout button to Sidebar**

Update `/src/components/Sidebar/Sidebar.tsx`:

```typescript
import { useLocation, useNavigate } from 'react-router-dom';
import { useUser, useLogout } from '@/api/queries/user';
import type { NavTab } from '@/types';
import logoSvg from '@/assets/logo.svg';
import categoriesIcon from '@/assets/categories-icon.svg';
import analyzeIcon from '@/assets/analyze-icon.svg';
import transactionIcon from '@/assets/transaction-icon.svg';
import profileIcon from '@/assets/profile-icon.svg';
import styles from './Sidebar.module.css';

interface NavItem {
  key: NavTab;
  label: string;
  path: string;
  icon: string;
}

const navItems: NavItem[] = [
  { key: 'home', label: 'Категории', path: '/', icon: categoriesIcon },
  { key: 'analytics', label: 'Аналитика', path: '/analytics', icon: analyzeIcon },
  { key: 'transactions', label: 'Транзакций', path: '/transactions', icon: transactionIcon },
  { key: 'profile', label: 'Профиль', path: '/profile', icon: profileIcon },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: user } = useUser();
  const logoutMutation = useLogout();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        navigate('/login');
      },
    });
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoSection}>
        <img src={logoSvg} alt="Smart Wallet" className={styles.logoIcon} />
        <div className={styles.logoText}>
          <span className={styles.logoWord}>Smart</span>
          <span className={styles.logoWord}>Wallet</span>
        </div>
      </div>

      <nav className={styles.nav}>
        {navItems.map((item) => {
          const isActive = item.key === 'profile'
            ? location.pathname.startsWith('/profile')
            : location.pathname === item.path;
          return (
            <button
              key={item.key}
              className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
              onClick={() => navigate(item.path)}
              data-label={item.label}
              aria-label={item.label}
            >
              <span className={styles.navIcon}>
                <img src={item.icon} alt="" />
              </span>
              <span className={styles.navLabel}>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className={styles.userInfo}>
        <span className={styles.userName}>{user?.lastName ?? ''}</span>
        <span className={styles.userName}>{user?.firstName ?? ''}</span>
        <span className={styles.userName}>{user?.patronymic ?? ''}</span>
        <button
          className={styles.logoutButton}
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
        >
          Выйти
        </button>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Add logout button styles to Sidebar.module.css**

Append to `/src/components/Sidebar/Sidebar.module.css`:

```css
.logoutButton {
  margin-top: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  background-color: transparent;
  color: var(--color-text-light);
  border: 1px solid var(--color-neutral-600);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-family: var(--font);
  font-size: var(--text-xs);
  transition: background-color 0.2s ease;
  width: 100%;
}

.logoutButton:hover {
  background-color: rgba(239, 68, 68, 0.2);
  border-color: var(--color-red-500, #ef4444);
  color: var(--color-red-400, #f87171);
}

.logoutButton:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

- [ ] **Step 3: Verify compilation**

Run: `npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors related to Sidebar.

- [ ] **Step 4: Commit**

```bash
git add src/components/Sidebar/Sidebar.tsx src/components/Sidebar/Sidebar.module.css
git commit -m "feat: add logout button to Sidebar"
```

---

### Task 8: Add Logout to ProfilePage (Mobile)

**Files:**
- Modify: `/src/pages/ProfilePage/ProfilePage.tsx`
- Modify: `/src/pages/ProfilePage/ProfilePage.module.css`

- [ ] **Step 1: Add logout button to ProfilePage**

Update `/src/pages/ProfilePage/ProfilePage.tsx`:

Add import:
```typescript
import { useLogout } from '@/api/queries/user';
```

Add inside the `ProfilePage` function, after `const updateMutation = useUpdateUser();`:
```typescript
const logoutMutation = useLogout();
```

Add logout handler after `handleSubmit`:
```typescript
const handleLogout = useCallback(() => {
  logoutMutation.mutate(undefined, {
    onSuccess: () => {
      navigate('/login');
    },
  });
}, [logoutMutation, navigate]);
```

Add logout button in the JSX, after the `changePasswordLink` div and before `</main>`:
```tsx
<div className={styles.logoutSection}>
  <button
    type="button"
    className={styles.logoutButton}
    onClick={handleLogout}
    disabled={logoutMutation.isPending}
  >
    Выйти из аккаунта
  </button>
</div>
```

- [ ] **Step 2: Add logout button styles to ProfilePage.module.css**

Append to `/src/pages/ProfilePage/ProfilePage.module.css`:

```css
.logoutSection {
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--color-neutral-700);
}

.logoutButton {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: transparent;
  color: var(--color-red-400, #f87171);
  border: 1px solid var(--color-red-500, #ef4444);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-family: var(--font);
  font-size: var(--text-sm);
  transition: background-color 0.2s ease;
}

.logoutButton:hover {
  background-color: rgba(239, 68, 68, 0.15);
}

.logoutButton:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

- [ ] **Step 3: Verify compilation**

Run: `npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors related to ProfilePage.

- [ ] **Step 4: Commit**

```bash
git add src/pages/ProfilePage/ProfilePage.tsx src/pages/ProfilePage/ProfilePage.module.css
git commit -m "feat: add logout button to ProfilePage for mobile"
```

---

### Task 9: Update App.tsx — Route Protection and Auth Init

**Files:**
- Modify: `/src/App.tsx`

- [ ] **Step 1: Rewrite App.tsx with ProtectedRoute and AuthInitGuard**

Replace the entire content of `/src/App.tsx` with:

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

Key changes:
- `isAuthPage` logic hides Sidebar on login/register pages (BottomNav is rendered per-page, not globally)
- `AuthInitGuard` wraps everything to attempt session restore on mount
- All protected routes wrapped in `<ProtectedRoute>`
- Login and register pages remain public

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors.

- [ ] **Step 3: Verify the app builds**

Run: `npm run build 2>&1 | tail -20`
Expected: Successful build with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat: add route protection and auth initialization to App"
```

---

### Task 10: Update RegisterPage Redirect

**Files:**
- Modify: `/src/pages/RegisterPage/RegisterPage.tsx`

- [ ] **Step 1: Add authenticated user redirect to RegisterPage**

Similar to LoginPage, add a redirect for authenticated users who visit `/register`:

Add imports:
```typescript
import { useAuthStore } from '@/store/useAuthStore';
```

Add `Navigate` to the `react-router-dom` import if not already present.

Add inside the component, before the form:
```typescript
const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
if (isAuthenticated) {
  return <Navigate to="/" replace />;
}
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/RegisterPage/RegisterPage.tsx
git commit -m "feat: redirect authenticated users away from register page"
```

---

### Task 11: Final Integration Verification

- [ ] **Step 1: Run full TypeScript check**

Run: `npx tsc --noEmit --pretty`
Expected: No errors.

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: Successful build.

- [ ] **Step 3: Manual smoke test checklist**

Start the dev server (`npm run dev`) and verify:

1. **Unauthenticated access to protected route** → Redirected to `/login`
2. **Login with valid credentials** → Access token stored, redirected to `/`
3. **Protected page loads** → User data visible in Sidebar/Header
4. **API requests include Authorization header** → Check Network tab
5. **Page refresh** → AuthInitGuard shows spinner, then restores session via refresh
6. **Logout** → Click "Выйти" in Sidebar → Redirected to `/login`, token cleared
7. **Login page redirect** → Already authenticated user visiting `/login` → Redirected to `/`
8. **Register page redirect** → Already authenticated user visiting `/register` → Redirected to `/`

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete dual-token auth system implementation"
```