# Auth System Design: Dual-Token Authentication

## Overview

Implement full client-side authentication to integrate with the backend's dual-token auth architecture (access token + httpOnly refresh cookie). The frontend currently has no auth: tokens are discarded, no Authorization headers are sent, no refresh logic exists, no route protection, and no logout.

## Architecture: Hybrid Approach (Approach C)

`apiClient` is extended with auth awareness: it injects the Authorization header from the auth store, intercepts 401 responses, calls the refresh endpoint, and retries failed requests. The auth store (Zustand) manages token state. A Promise queue prevents duplicate refresh calls when multiple requests fail simultaneously.

## Components

### 1. Auth Store (`/src/store/useAuthStore.ts`)

**State:**
- `accessToken: string | null` — JWT access token, stored in memory only
- `isAuthenticated: boolean` — derived: `true` when `accessToken !== null`

**Actions:**
- `setAccessToken(token: string)` — stores token, sets `isAuthenticated = true`
- `clearAuth()` — clears token, sets `isAuthenticated = false`

**Key decisions:**
- In-memory only (no localStorage). On page reload, token is lost → refresh flow kicks in
- Store does NOT make API calls — pure state management
- Separate from existing `useWalletStore.ts` (which is just re-exports)

### 2. apiClient Modifications (`/src/api/client.ts`)

**2.1 Authorization header injection:**
- Read `accessToken` from `useAuthStore.getState()` (not a React hook — callable outside components)
- If token exists, add `Authorization: Bearer <token>` header

**2.2 401 interception and automatic refresh:**
- When a response has status 401 and the request is NOT already a refresh request:
  1. Call `refreshAccessToken()` to get a new token
  2. If refresh succeeds, retry the original request with the new token
  3. If refresh fails (401), call `clearAuth()` and redirect to `/login`

**2.3 Promise queue for concurrent 401s:**
- `let refreshPromise: Promise<string | null> | null = null`
- When first 401 arrives, create refresh Promise and store it
- Subsequent 401s await the same Promise — no duplicate refresh calls
- After Promise resolves, clear `refreshPromise`

**2.4 Refresh function (`refreshAccessToken`):**
- Makes `POST /api/users/refresh` with `credentials: 'include'` (httpOnly cookie sent automatically)
- On success: parses `ResponseRefreshApiModel { accessToken }`, calls `setAccessToken()`, returns token
- On failure: returns `null`
- Does NOT use `apiClient` itself (to avoid infinite recursion) — uses raw `fetch`

### 3. ProtectedRoute Component (`/src/components/ProtectedRoute/ProtectedRoute.tsx`)

```tsx
function ProtectedRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}
```

**Route changes in App.tsx:**
- Public routes: `/login`, `/register` — no protection
- All other routes wrapped in `<ProtectedRoute>`
- Remove `isAuthPage` conditional logic for Sidebar (ProtectedRoute handles it)

### 4. Auth Initialization (`useAuthInit` hook)

Called at app root level on mount:
- Attempts `refreshAccessToken()` to restore session from httpOnly cookie
- If refresh succeeds → user stays authenticated
- If refresh fails → `clearAuth()`, user sees login page (via ProtectedRoute redirect)
- Shows loading state during initialization to prevent flash of login page

### 5. Schema Updates (`/src/api/schemas/user.ts`)

```typescript
// Changed: jwtToken → accessToken, nullable → required
export const ResponseLogInApiModelSchema = z.object({
  accessToken: z.string(),
});

// New schema
export const ResponseRefreshApiModelSchema = z.object({
  accessToken: z.string(),
});
```

### 6. Auth Query Hooks (`/src/api/queries/user.ts`)

- `useLogin()` — on success, calls `useAuthStore.getState().setAccessToken(data.accessToken)`
- `useLogout()` — new mutation for `POST /api/users/logout`; on success, calls `clearAuth()` and navigates to `/login`

> **Note:** `refreshAccessToken()` is NOT a React query hook and does NOT belong in the queries file. It is an internal utility function defined within `/src/api/client.ts` (or extracted to a separate `/src/api/auth.ts` utility module). It uses raw `fetch`, not `apiClient`, to avoid infinite recursion.

### 7. Login Page Update (`/src/pages/LoginPage/LoginPage.tsx`)

```typescript
onSubmit: async (values) => {
  try {
    const data = await loginMutation.mutateAsync({
      email: values.email,
      password: values.password,
    });
    useAuthStore.getState().setAccessToken(data.accessToken);
    navigate('/');
  } catch {
    // Error handling
  }
},
```

### 8. Logout in UI

Add logout button to Sidebar and/or Header components:
1. Call `POST /api/users/logout` (via `useLogout()` mutation)
2. Call `useAuthStore.getState().clearAuth()`
3. Navigate to `/login`

### 9. Expired Session Handling

When refresh request returns 401 (refresh token also expired):
1. Call `clearAuth()`
2. Redirect to `/login`
3. Optionally show toast notification "Session expired"

## File Change Summary

| File | Change |
|------|--------|
| `/src/store/useAuthStore.ts` | **NEW** — Zustand auth store |
| `/src/api/client.ts` | **MODIFY** — add auth header, 401 interceptor, `refreshAccessToken()` utility (not in queries file) |
| `/src/api/schemas/user.ts` | **MODIFY** — `jwtToken` → `accessToken`, add `ResponseRefreshApiModelSchema` |
| `/src/api/queries/user.ts` | **MODIFY** — update `useLogin`, add `useLogout` (note: `refreshAccessToken` is NOT here — it lives in `/src/api/client.ts`) |
| `/src/components/ProtectedRoute/ProtectedRoute.tsx` | **NEW** — route guard component |
| `/src/components/ProtectedRoute/ProtectedRoute.module.css` | **NEW** — styles (loading spinner) |
| `/src/App.tsx` | **MODIFY** — wrap protected routes, add auth init |
| `/src/pages/LoginPage/LoginPage.tsx` | **MODIFY** — store access token on login |
| `/src/components/Sidebar/Sidebar.tsx` | **MODIFY** — add logout button |
| `/src/components/Header/Header.tsx` | **MODIFY** — add logout button (mobile) |

## Data Flow

```
Login → POST /api/users/login
  → Response: { accessToken } + Set-Cookie: refresh_token
  → Store accessToken in Zustand (memory)
  → Navigate to /

API Request → apiClient adds Authorization: Bearer <token>
  → 200 OK → return data
  → 401 → refreshAccessToken() (internal utility in /src/api/client.ts, NOT a React hook)
    → POST /api/users/refresh (raw fetch, cookie sent automatically)
    → Success: new accessToken → retry original request
    → Failure: clearAuth() → redirect to /login

Page Reload → useAuthInit()
  → refreshAccessToken() (called as plain function, not via useRefresh hook)
  → Success: restored session
  → Failure: clearAuth() → login page

Logout → POST /api/users/logout
  → clearAuth() → navigate to /login
```

## Security Considerations

- Access token stored in memory only — not accessible via XSS
- Refresh token in httpOnly cookie — not accessible via JavaScript
- `credentials: 'include'` already set in apiClient — cookies sent cross-origin
- Backend CORS configured with `AllowCredentials()`
- No token in URL parameters or localStorage