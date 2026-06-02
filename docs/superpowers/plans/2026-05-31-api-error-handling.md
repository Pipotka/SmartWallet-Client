# API Error Handling — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a system for handling API errors: global toast notifications, 422 field error parsing and mapping to forms, and integration across all pages that currently lack error handling.

**Architecture:** Three independent components: `parseApiError` utility function for extracting field-level errors from API responses, `useToastStore` Zustand store for global toast notifications with success/error variants, and `useFormServerErrors` hook for mapping parsed errors onto form fields. A `ToastContainer` component renders toasts from the store at the app root. Each page is then updated to use these primitives.

**Tech Stack:** React 19, TypeScript, Zustand, TanStack Query v5, Zod, Vite

---

## File Structure

### New Files
- `src/api/parseApiError.ts` — Pure function to parse `ApiError` into `{ fieldErrors, generalErrors }`
- `src/store/useToastStore.ts` — Zustand store for toast queue management
- `src/components/Toast/ToastContainer.tsx` — Container component rendering toast queue
- `src/components/Toast/ToastContainer.module.css` — Styles for toast stack
- `src/hooks/useFormServerErrors.ts` — Hook mapping parsed server errors onto form fields

### Modified Files
- `src/components/Toast/Toast.tsx` — Add `variant` prop, remove `visible`/`onClose`, add close button
- `src/components/Toast/Toast.module.css` — Add variant styles (success/error)
- `src/api/schemas/common.ts` — Add `errors` field to `ProblemDetailsSchema`
- `src/App.tsx` — Add `<ToastContainer />`
- `src/pages/LoginPage/LoginPage.tsx` — Add error handling
- `src/pages/RegisterPage/RegisterPage.tsx` — Add error handling
- `src/pages/ChangePasswordPage/ChangePasswordPage.tsx` — Add error handling, migrate to toast store
- `src/pages/ProfilePage/ProfilePage.tsx` — Add error handling, migrate to toast store
- `src/pages/EditWalletPage/EditWalletPage.tsx` — Add error handling
- `src/pages/EditCategoryPage/EditCategoryPage.tsx` — Add error handling
- `src/pages/TransactionAddPage/TransactionAddPage.tsx` — Add error handling
- `src/pages/TransactionPage/TransactionPage.tsx` — Migrate to toast store, add delete error handling

---

## Task 1: Create `parseApiError` utility

**Files:**
- Create: `src/api/parseApiError.ts`
- Modify: `src/api/schemas/common.ts` (add `errors` field to ProblemDetailsSchema)

- [ ] **Step 1: Update ProblemDetailsSchema to include errors dict**

The current `ProblemDetailsSchema` is missing the `errors` dictionary field that .NET sends for 400 validation errors. Update `src/api/schemas/common.ts`:

```ts
export const ProblemDetailsSchema = z.object({
  type: z.string().nullable(),
  title: z.string().nullable(),
  status: z.number().nullable(),
  detail: z.string().nullable(),
  instance: z.string().nullable(),
  errors: z.record(z.string(), z.array(z.string())).nullable().optional(),
});
```

- [ ] **Step 2: Create `src/api/parseApiError.ts`**

```ts
import { ApiError } from '@/api/client';
import { ApiExceptionDetailsSchema, ProblemDetailsSchema } from '@/api/schemas/common';

export interface ParsedApiError {
  fieldErrors: Record<string, string>;
  generalErrors: string[];
}

export function parseApiError(error: unknown): ParsedApiError {
  if (!(error instanceof ApiError)) {
    return { fieldErrors: {}, generalErrors: [] };
  }

  if (error.statusCode === 422) {
    return parse422Error(error);
  }

  if (error.statusCode === 400) {
    return parse400Error(error);
  }

  return parseOtherError(error);
}

function parse422Error(error: ApiError): ParsedApiError {
  const parsed = ApiExceptionDetailsSchema.safeParse(error.data);
  if (!parsed.success || !parsed.data.message) {
    return { fieldErrors: {}, generalErrors: ['Произошла ошибка'] };
  }

  const message = parsed.data.message;
  const fieldErrors: Record<string, string> = {};
  const generalErrors: string[] = [];

  const pairs = message.split(';');
  for (const pair of pairs) {
    const trimmed = pair.trim();
    if (!trimmed) continue;

    const separatorIndex = trimmed.indexOf(' - ');
    if (separatorIndex === -1) {
      generalErrors.push(trimmed);
      continue;
    }

    const fieldName = trimmed.substring(0, separatorIndex).trim();
    const errorMessage = trimmed.substring(separatorIndex + 3).trim();
    fieldErrors[fieldName] = errorMessage;
  }

  return { fieldErrors, generalErrors };
}

function parse400Error(error: ApiError): ParsedApiError {
  const parsed = ProblemDetailsSchema.safeParse(error.data);
  if (!parsed.success) {
    return { fieldErrors: {}, generalErrors: [getErrorMessage(error)] };
  }

  const problemDetails = parsed.data;
  const fieldErrors: Record<string, string> = {};
  const generalErrors: string[] = [];

  if (problemDetails.errors) {
    for (const [field, messages] of Object.entries(problemDetails.errors)) {
      if (messages.length > 0) {
        fieldErrors[field] = messages.join('; ');
      }
    }
  }

  if (problemDetails.detail) {
    generalErrors.push(problemDetails.detail);
  }

  if (Object.keys(fieldErrors).length === 0 && generalErrors.length === 0) {
    generalErrors.push(problemDetails.title ?? 'Произошла ошибка');
  }

  return { fieldErrors, generalErrors };
}

function parseOtherError(error: ApiError): ParsedApiError {
  return { fieldErrors: {}, generalErrors: [getErrorMessage(error)] };
}

function getErrorMessage(error: ApiError): string {
  const message = ApiExceptionDetailsSchema.safeParse(error.data);
  if (message.success && message.data.message) {
    return message.data.message;
  }
  return 'Произошла ошибка';
}
```

- [ ] **Step 3: Verify types compile**

Run: `npx tsc --noEmit` from project root
Expected: No type errors related to the new files

- [ ] **Step 4: Commit**

```bash
git add src/api/parseApiError.ts src/api/schemas/common.ts
git commit -m "feat: add parseApiError utility for extracting field errors from API responses"
```

---

## Task 2: Create `useToastStore`

**Files:**
- Create: `src/store/useToastStore.ts`

- [ ] **Step 1: Create the toast store**

Create `src/store/useToastStore.ts`:

```ts
import { create } from 'zustand';

export type ToastVariant = 'success' | 'error';

export interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
  actionLabel?: string;
  onAction?: () => void;
}

interface ToastState {
  toasts: ToastItem[];
  addToast: (message: string, variant: ToastVariant, options?: { actionLabel?: string; onAction?: () => void }) => string;
  removeToast: (id: string) => void;
  showSuccess: (message: string) => string;
  showError: (message: string) => string;
}

let nextId = 0;

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  addToast: (message, variant, options) => {
    const id = `toast-${nextId++}`;
    const toast: ToastItem = {
      id,
      message,
      variant,
      actionLabel: options?.actionLabel,
      onAction: options?.onAction,
    };

    set((state) => ({ toasts: [...state.toasts, toast] }));

    setTimeout(() => {
      get().removeToast(id);
    }, 3000);

    return id;
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  showSuccess: (message) => get().addToast(message, 'success'),
  showError: (message) => get().addToast(message, 'error'),
}));
```

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 3: Commit**

```bash
git add src/store/useToastStore.ts
git commit -m "feat: add useToastStore for global toast notifications"
```

---

## Task 3: Refactor `Toast` component and create `ToastContainer`

**Files:**
- Modify: `src/components/Toast/Toast.tsx`
- Modify: `src/components/Toast/Toast.module.css`
- Create: `src/components/Toast/ToastContainer.tsx`
- Create: `src/components/Toast/ToastContainer.module.css`

- [ ] **Step 1: Update `Toast.tsx` to accept variant prop and remove visible/onClose**

The existing `Toast` component uses `visible` / `closing` state and `onClose` callback. The refactored version always renders (mount/unmount controlled by `ToastContainer`), accepts a `variant` prop, and has a close button.

Replace contents of `src/components/Toast/Toast.tsx`:

```tsx
import styles from './Toast.module.css';
import type { ToastVariant } from '@/store/useToastStore';

interface ToastProps {
  id: string;
  message: string;
  variant: ToastVariant;
  actionLabel?: string;
  onAction?: () => void;
  onClose: (id: string) => void;
}

export function Toast({ id, message, variant, actionLabel, onAction, onClose }: ToastProps) {
  const handleAction = () => {
    onAction?.();
    onClose(id);
  };

  return (
    <div role="status" aria-live="polite" className={`${styles.toast} ${styles[variant]}`}>
      <span className={styles.message}>{message}</span>
      {actionLabel && onAction && (
        <button className={styles.actionButton} onClick={handleAction}>
          {actionLabel}
        </button>
      )}
      <button className={styles.closeButton} onClick={() => onClose(id)} aria-label="Закрыть">
        ×
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Update `Toast.module.css` to add variant and close button styles**

Add variant styles and close button styles. Keep existing slide-up/fade-out animations.

Replace contents of `src/components/Toast/Toast.module.css`:

```css
.toast {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  padding-right: var(--spacing-md);
  background-color: var(--color-header);
  color: var(--color-text-light);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  font-family: var(--font);
  font-size: var(--text-sm);
  font-weight: 400;
  border-left: 4px solid transparent;
  animation: slide-up 0.3s ease-out;
}

.success {
  border-left-color: #4caf50;
}

.error {
  border-left-color: var(--color-red-500);
}

.message {
  flex: 1;
}

.actionButton {
  padding: var(--spacing-xs) var(--spacing-sm);
  background: none;
  border: none;
  color: var(--color-red-500);
  font-family: var(--font);
  font-size: var(--text-sm);
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.actionButton:hover {
  opacity: 0.8;
}

.closeButton {
  padding: 0;
  background: none;
  border: none;
  color: var(--color-text-light);
  font-size: var(--text-lg);
  line-height: 1;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s ease;
  margin-left: var(--spacing-xs);
}

.closeButton:hover {
  opacity: 1;
}

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

- [ ] **Step 3: Create `ToastContainer.tsx`**

Create `src/components/Toast/ToastContainer.tsx`:

```tsx
import { useToastStore } from '@/store/useToastStore';
import { Toast } from './Toast';
import styles from './ToastContainer.module.css';

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className={styles.container}>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          message={toast.message}
          variant={toast.variant}
          actionLabel={toast.actionLabel}
          onAction={toast.onAction}
          onClose={removeToast}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Create `ToastContainer.module.css`**

Create `src/components/Toast/ToastContainer.module.css`:

```css
.container {
  position: fixed;
  bottom: calc(var(--nav-height) + var(--spacing-sm));
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column-reverse;
  gap: var(--spacing-sm);
  z-index: 1000;
  pointer-events: none;
}

.container > * {
  pointer-events: auto;
}

@media (min-width: 768px) {
  .container {
    left: calc(50% + var(--sidebar-collapsed-width) / 2);
    bottom: var(--spacing-lg);
  }
}

@media (min-width: 1024px) {
  .container {
    left: calc(50% + var(--sidebar-width) / 2);
  }
}
```

- [ ] **Step 5: Add `ToastContainer` to `App.tsx`**

Add the import and render `<ToastContainer />` inside `<AppContent>` in `src/App.tsx`:

Add import at top:
```ts
import { ToastContainer } from '@/components/Toast/ToastContainer';
```

Add `<ToastContainer />` inside the `<div>` returned by `AppContent`, after `{!isAuthPage && <Sidebar />}`:

```tsx
function AppContent() {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  return (
    <div className={`${styles.app} ${isAuthPage ? styles.authPage : ''}`}>
      {!isAuthPage && <Sidebar />}
      <ToastContainer />
      <Routes>
```

- [ ] **Step 6: Verify build compiles**

Run: `npx tsc --noEmit`
Expected: No type errors. Note: old usages of `Toast` in pages will break — that's expected, they'll be fixed in later tasks.

- [ ] **Step 7: Commit**

```bash
git add src/components/Toast/ src/App.tsx
git commit -m "feat: refactor Toast component with variants and add ToastContainer"
```

---

## Task 4: Create `useFormServerErrors` hook

**Files:**
- Create: `src/hooks/useFormServerErrors.ts`

- [ ] **Step 1: Create the hook**

Create `src/hooks/useFormServerErrors.ts`:

```ts
import { useCallback } from 'react';
import type { UseFormReturn } from '@/hooks/useForm';
import { parseApiError } from '@/api/parseApiError';

export function useFormServerErrors<T extends { [K in keyof T]: string }>(
  form: UseFormReturn<T>,
  fieldMap?: Record<string, keyof T>,
): {
  setServerErrors: (error: unknown) => string[];
} {
  const setServerErrors = useCallback(
    (error: unknown): string[] => {
      const { fieldErrors, generalErrors } = parseApiError(error);

      const mappedFieldErrors: Partial<Record<keyof T, string>> = {};

      for (const [serverField, errorMessage] of Object.entries(fieldErrors)) {
        const formField = fieldMap
          ? fieldMap[serverField]
          : (serverField as keyof T);

        if (formField) {
          mappedFieldErrors[formField] = errorMessage;
        } else {
          generalErrors.push(errorMessage);
        }
      }

      if (Object.keys(mappedFieldErrors).length > 0) {
        form.setFieldErrors(mappedFieldErrors);
        form.setFieldTouched(mappedFieldErrors);
      }

      return generalErrors;
    },
    [form, fieldMap],
  );

  return { setServerErrors };
}
```

**Important:** This hook requires `setFieldErrors` and `setFieldTouched` methods on `useFormReturn`. These must be added to `useForm` first (Task 5).

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useFormServerErrors.ts
git commit -m "feat: add useFormServerErrors hook for mapping server errors to form fields"
```

---

## Task 5: Extend `useForm` with `setFieldErrors` and `setFieldTouched`

**Files:**
- Modify: `src/hooks/useForm.ts`

The `useFormServerErrors` hook needs to call `form.setFieldErrors(errors)` and `form.setFieldTouched(errors)` to set server errors and mark fields as touched. These methods don't exist on `UseFormReturn` yet.

- [ ] **Step 1: Add `setFieldErrors` and `setFieldTouched` to `useForm`**

Update `src/hooks/useForm.ts`:

Add to the `UseFormReturn` interface (after `handleSubmit`):
```ts
setFieldErrors: (errors: Partial<Record<keyof T, string>>) => void;
setFieldTouched: (fields: Partial<Record<keyof T, string>>) => void;
```

Add the implementations inside `useForm`, before the `return` statement:
```ts
const setFieldErrors = useCallback((errors: Partial<Record<keyof T, string>>) => {
  setErrors(errors);
}, []);

const setFieldTouched = useCallback((fields: Partial<Record<keyof T, string>>) => {
  const newTouched: Partial<Record<keyof T, boolean>> = {};
  for (const key of Object.keys(fields) as Array<keyof T>) {
    newTouched[key] = true;
  }
  setTouched((prev) => ({ ...prev, ...newTouched }));
}, []);
```

Add to the return object:
```ts
return {
  values,
  errors,
  touched,
  isSubmitting,
  handleChange,
  handleBlur,
  handleSubmit,
  setFieldErrors,
  setFieldTouched,
};
```

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useForm.ts
git commit -m "feat: add setFieldErrors and setFieldTouched to useForm hook"
```

---

## Task 6: Integrate error handling in `LoginPage`

**Files:**
- Modify: `src/pages/LoginPage/LoginPage.tsx`

Current state: Empty catch block with comment "could show a toast"

- [ ] **Step 1: Update LoginPage to use useFormServerErrors and toast store**

Update `src/pages/LoginPage/LoginPage.tsx`:

Add imports:
```ts
import { useFormServerErrors } from '@/hooks/useFormServerErrors';
import { useToastStore } from '@/store/useToastStore';
```

Add `showError` selector before the `useForm` call:
```ts
const showError = useToastStore((s) => s.showError);
```

Add `useFormServerErrors` after the `useForm` call:
```ts
const { setServerErrors } = useFormServerErrors(form);
```

Replace the empty catch block:
```ts
// Before:
} catch {
  // Error handling — could show a toast in the future
}

// After:
} catch (error) {
  const generalErrors = setServerErrors(error);
  generalErrors.forEach((msg) => showError(msg));
}
```

**Note:** `setServerErrors` is declared after `form` but referenced inside `onSubmit`. This works because `useForm` calls `onSubmit` via `setTimeout(..., 0)`, so by the time the callback executes, all hooks have been called and `setServerErrors` is available.

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit`
Expected: No type errors for LoginPage

- [ ] **Step 3: Commit**

```bash
git add src/pages/LoginPage/LoginPage.tsx
git commit -m "feat: add error handling to LoginPage"
```

---

## Task 7: Integrate error handling in `RegisterPage`

**Files:**
- Modify: `src/pages/RegisterPage/RegisterPage.tsx`

Current state: No try/catch at all — `mutateAsync` call is unguarded.

- [ ] **Step 1: Add error handling**

Update `src/pages/RegisterPage/RegisterPage.tsx`:

Add imports:
```ts
import { useFormServerErrors } from '@/hooks/useFormServerErrors';
import { useToastStore } from '@/store/useToastStore';
```

Add `showError` selector:
```ts
const showError = useToastStore((s) => s.showError);
```

Wrap the `onSubmit` callback body in try/catch:
```ts
onSubmit: async (values) => {
  try {
    await createMutation.mutateAsync({
      firstName: values.firstName,
      lastName: values.lastName,
      patronymic: values.patronymic,
      email: values.email,
      password: values.password,
    });
    navigate('/');
  } catch (error) {
    const generalErrors = setServerErrors(error);
    generalErrors.forEach((msg) => showError(msg));
  }
},
```

Add `useFormServerErrors` after `useForm`:
```ts
const { setServerErrors } = useFormServerErrors(form);
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/pages/RegisterPage/RegisterPage.tsx
git commit -m "feat: add error handling to RegisterPage"
```

---

## Task 8: Integrate error handling in `ChangePasswordPage`

**Files:**
- Modify: `src/pages/ChangePasswordPage/ChangePasswordPage.tsx`

Current state: Empty catch block, per-page `useState` for toast visibility.

- [ ] **Step 1: Replace per-page toast with toast store and add server error handling**

Replace the entire `ChangePasswordPage` component with:

```tsx
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header/Header';
import { BottomNav } from '@/components/BottomNav/BottomNav';
import { InputField } from '@/components/InputField/InputField';
import { Button, SaveIcon } from '@/components/Button/Button';
import { useForm } from '@/hooks/useForm';
import { useFormServerErrors } from '@/hooks/useFormServerErrors';
import { useChangePassword } from '@/api/queries/user';
import { useToastStore } from '@/store/useToastStore';
import styles from './ChangePasswordPage.module.css';

interface ChangePasswordFormData {
  oldPassword: string;
  newPassword: string;
  newPasswordConfirm: string;
}

function validateChangePassword(
  values: ChangePasswordFormData,
): Partial<Record<keyof ChangePasswordFormData, string>> {
  const errors: Partial<Record<keyof ChangePasswordFormData, string>> = {};

  if (!values.oldPassword) {
    errors.oldPassword = 'Поле обязательно для заполнения';
  }

  if (!values.newPassword) {
    errors.newPassword = 'Поле обязательно для заполнения';
  } else {
    if (values.newPassword.length < 8)
      errors.newPassword = 'Пароль должен содержать минимум 8 символов';
    else if (!/[A-ZА-Я]/.test(values.newPassword))
      errors.newPassword = 'Пароль должен содержать хотя бы одну заглавную букву';
    else if (!/\d/.test(values.newPassword))
      errors.newPassword = 'Пароль должен содержать хотя бы одну цифру';
    else if (!/[!@#$%^&*()_+=\]{};':"\\|,.<>?/[-]/.test(values.newPassword))
      errors.newPassword = 'Пароль должен содержать хотя бы один специальный символ';
  }

  if (!values.newPasswordConfirm) {
    errors.newPasswordConfirm = 'Поле обязательно для заполнения';
  } else if (values.newPassword !== values.newPasswordConfirm) {
    errors.newPasswordConfirm = 'Пароли не совпадают';
  }

  return errors;
}

export function ChangePasswordPage() {
  const navigate = useNavigate();
  const changePasswordMutation = useChangePassword();
  const showError = useToastStore((s) => s.showError);

  const handleSubmit = useCallback(async (values: ChangePasswordFormData) => {
    try {
      await changePasswordMutation.mutateAsync({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      });
      navigate('/profile');
    } catch (error) {
      const generalErrors = setServerErrors(error);
      generalErrors.forEach((msg) => showError(msg));
    }
  }, [changePasswordMutation, navigate]);

  const form = useForm<ChangePasswordFormData>({
    initialValues: {
      oldPassword: '',
      newPassword: '',
      newPasswordConfirm: '',
    },
    validate: validateChangePassword,
    onSubmit: handleSubmit,
  });

  const { setServerErrors } = useFormServerErrors(form, {
    OldPassword: 'oldPassword',
    NewPassword: 'newPassword',
  });

  return (
    <div className={styles.page}>
      <Header />

      <main className={styles.content}>
        <div className={styles.centerGroup}>
          <h2 className={styles.title}>Смена пароля</h2>
          <form
            className={styles.form}
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
          >
            <InputField
              label="Старый пароль"
              type="password"
              value={form.values.oldPassword}
              onChange={form.handleChange('oldPassword')}
              onBlur={() => form.handleBlur('oldPassword')}
              error={!!form.touched.oldPassword && !!form.errors.oldPassword}
              errorText={form.touched.oldPassword ? form.errors.oldPassword : undefined}
            />
            <InputField
              label="Новый пароль"
              type="password"
              value={form.values.newPassword}
              onChange={form.handleChange('newPassword')}
              onBlur={() => form.handleBlur('newPassword')}
              error={!!form.touched.newPassword && !!form.errors.newPassword}
              errorText={form.touched.newPassword ? form.errors.newPassword : undefined}
            />
            <InputField
              label="Новый пароль ещё раз"
              type="password"
              value={form.values.newPasswordConfirm}
              onChange={form.handleChange('newPasswordConfirm')}
              onBlur={() => form.handleBlur('newPasswordConfirm')}
              error={!!form.touched.newPasswordConfirm && !!form.errors.newPasswordConfirm}
              errorText={form.touched.newPasswordConfirm ? form.errors.newPasswordConfirm : undefined}
            />

            <div className={styles.submitRow}>
              <Button
                variant="primary"
                fullWidth
                type="submit"
                icon={<SaveIcon />}
                disabled={form.isSubmitting}
              >
                Сохранить
              </Button>
            </div>
          </form>
        </div>

        <div className={styles.profileLink}>
          <button
            type="button"
            className={styles.link}
            onClick={() => navigate('/profile')}
          >
            Профиль
          </button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
```

**Note:** `setServerErrors` is declared after `form` but referenced inside `handleSubmit`. This works because `useForm` calls `onSubmit` via `setTimeout(..., 0)`, so by the time the callback executes, all hooks have been called and `setServerErrors` is available.

Key changes:
- Removed `useState` for `toastVisible`
- Removed `<Toast>` JSX element
- Removed `handleToastClose`
- Added `useToastStore` and `useFormServerErrors`
- Added `fieldMap` for `OldPassword → oldPassword`, `NewPassword → newPassword`
- On success, navigate directly instead of showing toast first

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/pages/ChangePasswordPage/ChangePasswordPage.tsx
git commit -m "feat: add error handling to ChangePasswordPage, migrate to toast store"
```

---

## Task 9: Integrate error handling in `ProfilePage`

**Files:**
- Modify: `src/pages/ProfilePage/ProfilePage.tsx`

Current state: Two per-page toasts (success for profile update, error for logout). No error handling on profile update mutation.

- [ ] **Step 1: Replace per-page toasts with toast store, add server error handling**

Replace the entire `ProfilePage` component body. Key changes:

1. Remove `useState` for `toastVisible` and `logoutErrorVisible`
2. Remove both `<Toast>` JSX elements
3. Add `useToastStore` and `useFormServerErrors`
4. Add `fieldMap` mapping: `FirstName → firstName`, `LastName → lastName`, `Patronymic → patronymic`

```tsx
import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header/Header';
import { BottomNav } from '@/components/BottomNav/BottomNav';
import { InputField } from '@/components/InputField/InputField';
import { Button, SaveIcon } from '@/components/Button/Button';
import { useUser, useUpdateUser, useLogout } from '@/api/queries/user';
import { useForm } from '@/hooks/useForm';
import { useFormServerErrors } from '@/hooks/useFormServerErrors';
import { useToastStore } from '@/store/useToastStore';
import styles from './ProfilePage.module.css';

interface ProfileFormData {
  lastName: string;
  firstName: string;
  patronymic: string;
}

function validateProfile(values: ProfileFormData): Partial<Record<keyof ProfileFormData, string>> {
  const errors: Partial<Record<keyof ProfileFormData, string>> = {};
  if (!values.lastName.trim()) errors.lastName = 'Поле обязательно для заполнения';
  if (!values.firstName.trim()) errors.firstName = 'Поле обязательно для заполнения';
  return errors;
}

export function ProfilePage() {
  const navigate = useNavigate();
  const { data: user } = useUser();
  const updateMutation = useUpdateUser();
  const logoutMutation = useLogout();
  const showSuccess = useToastStore((s) => s.showSuccess);
  const showError = useToastStore((s) => s.showError);

  const handleSubmit = useCallback(async (values: ProfileFormData) => {
    try {
      await updateMutation.mutateAsync({
        firstName: values.firstName,
        lastName: values.lastName,
        patronymic: values.patronymic,
      });
      showSuccess('Профиль обновлён');
    } catch (error) {
      const generalErrors = setServerErrors(error);
      generalErrors.forEach((msg) => showError(msg));
    }
  }, [updateMutation, showError]);

  const handleLogout = useCallback(() => {
    if (!window.confirm('Вы уверены, что хотите выйти?')) {
      return;
    }
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        navigate('/login');
      },
      onError: () => {
        showError('Ошибка выхода, попробуйте снова');
      },
    });
  }, [logoutMutation, navigate, showError]);

  const initialValues = useMemo(() => ({
    lastName: user?.lastName ?? '',
    firstName: user?.firstName ?? '',
    patronymic: user?.patronymic ?? '',
  }), [user]);

  const form = useForm<ProfileFormData>({
    initialValues,
    validate: validateProfile,
    onSubmit: handleSubmit,
  });

  const { setServerErrors } = useFormServerErrors(form, {
    FirstName: 'firstName',
    LastName: 'lastName',
    Patronymic: 'patronymic',
  });

**Note:** `setServerErrors` is declared after `form` but referenced inside `handleSubmit`. This works because `useForm` calls `onSubmit` via `setTimeout(..., 0)`, so by the time the callback executes, all hooks have been called and `setServerErrors` is available.

  return (
    <div className={styles.page}>
      <Header />

      <main className={styles.content}>
        <div className={styles.centerGroup}>
          <h2 className={styles.title}>Редактирование профиля</h2>
          <form
            className={styles.form}
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
          >
            <InputField
              label="Фамилия"
              value={form.values.lastName}
              onChange={form.handleChange('lastName')}
              onBlur={() => form.handleBlur('lastName')}
              error={!!form.touched.lastName && !!form.errors.lastName}
              errorText={form.touched.lastName ? form.errors.lastName : undefined}
            />
            <InputField
              label="Имя"
              value={form.values.firstName}
              onChange={form.handleChange('firstName')}
              onBlur={() => form.handleBlur('firstName')}
              error={!!form.touched.firstName && !!form.errors.firstName}
              errorText={form.touched.firstName ? form.errors.firstName : undefined}
            />
            <InputField
              label="Отчество"
              value={form.values.patronymic}
              onChange={form.handleChange('patronymic')}
              onBlur={() => form.handleBlur('patronymic')}
              error={!!form.touched.patronymic && !!form.errors.patronymic}
              errorText={form.touched.patronymic ? form.errors.patronymic : undefined}
            />

            <div className={styles.submitRow}>
              <Button
                variant="primary"
                fullWidth
                type="submit"
                icon={<SaveIcon />}
                disabled={form.isSubmitting}
              >
                Сохранить
              </Button>
            </div>
          </form>
        </div>

        <div className={styles.changePasswordLink}>
          <button
            type="button"
            className={styles.link}
            onClick={() => navigate('/profile/change-password')}
          >
            Изменить пароль
          </button>
        </div>

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
      </main>

      <BottomNav />
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/pages/ProfilePage/ProfilePage.tsx
git commit -m "feat: add error handling to ProfilePage, migrate to toast store"
```

---

## Task 10: Integrate error handling in `EditWalletPage`

**Files:**
- Modify: `src/pages/EditWalletPage/EditWalletPage.tsx`

Current state: No error handling at all on mutations.

- [ ] **Step 1: Add try/catch with toast store error handling**

Update `src/pages/EditWalletPage/EditWalletPage.tsx`.

Add imports:
```ts
import { useToastStore } from '@/store/useToastStore';
import { parseApiError } from '@/api/parseApiError';
```

Add selector hooks:
```ts
const showError = useToastStore((s) => s.showError);
const showSuccess = useToastStore((s) => s.showSuccess);
```

Update `handleSave`:
```ts
const handleSave = async () => {
  const limitationNum = Number(limitation);
  const valueNum = Number(value);
  if (!isNaN(limitationNum) && !isNaN(valueNum)) {
    try {
      if (isNew) {
        await createMutation.mutateAsync({ name, limitation: limitationNum, isStorage: true });
      } else {
        await updateMutation.mutateAsync({ id: id!, name, limitation: limitationNum });
      }
      showSuccess('Кошелёк сохранён');
      navigate('/');
    } catch (error) {
      const { generalErrors } = parseApiError(error);
      if (generalErrors.length > 0) {
        generalErrors.forEach((msg) => showError(msg));
      } else {
        showError('Произошла ошибка');
      }
    }
  }
};
```

Update `handleDelete`:
```ts
const handleDelete = async () => {
  if (!isNew) {
    try {
      await deleteMutation.mutateAsync({ id: id! });
      showSuccess('Кошелёк удалён');
      navigate('/');
    } catch (error) {
      const { generalErrors } = parseApiError(error);
      if (generalErrors.length > 0) {
        generalErrors.forEach((msg) => showError(msg));
      } else {
        showError('Произошла ошибка');
      }
    }
  }
};
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/pages/EditWalletPage/EditWalletPage.tsx
git commit -m "feat: add error handling to EditWalletPage"
```

---

## Task 11: Integrate error handling in `EditCategoryPage`

**Files:**
- Modify: `src/pages/EditCategoryPage/EditCategoryPage.tsx`

Current state: No error handling at all on mutations. Very similar to EditWalletPage.

- [ ] **Step 1: Add try/catch with toast store error handling**

Update `src/pages/EditCategoryPage/EditCategoryPage.tsx`.

Add imports:
```ts
import { useToastStore } from '@/store/useToastStore';
import { parseApiError } from '@/api/parseApiError';
```

Add selector hooks:
```ts
const showError = useToastStore((s) => s.showError);
const showSuccess = useToastStore((s) => s.showSuccess);
```

Update `handleSave`:
```ts
const handleSave = async () => {
  const limitationNum = Number(limitation);
  if (!isNaN(limitationNum)) {
    try {
      if (isNew) {
        await createMutation.mutateAsync({ name, limitation: limitationNum, isStorage: false });
      } else {
        await updateMutation.mutateAsync({ id: id!, name, limitation: limitationNum });
      }
      showSuccess('Категория сохранена');
      navigate('/');
    } catch (error) {
      const { generalErrors } = parseApiError(error);
      if (generalErrors.length > 0) {
        generalErrors.forEach((msg) => showError(msg));
      } else {
        showError('Произошла ошибка');
      }
    }
  }
};
```

Update `handleDelete`:
```ts
const handleDelete = async () => {
  if (!isNew) {
    try {
      await deleteMutation.mutateAsync({ id: id! });
      showSuccess('Категория удалена');
      navigate('/');
    } catch (error) {
      const { generalErrors } = parseApiError(error);
      if (generalErrors.length > 0) {
        generalErrors.forEach((msg) => showError(msg));
      } else {
        showError('Произошла ошибка');
      }
    }
  }
};
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/pages/EditCategoryPage/EditCategoryPage.tsx
git commit -m "feat: add error handling to EditCategoryPage"
```

---

## Task 12: Integrate error handling in `TransactionAddPage`

**Files:**
- Modify: `src/pages/TransactionAddPage/TransactionAddPage.tsx`

Current state: No try/catch on `mutateAsync`.

- [ ] **Step 1: Add try/catch with toast store error handling**

Update `src/pages/TransactionAddPage/TransactionAddPage.tsx`:

Add imports:
```ts
import { useToastStore } from '@/store/useToastStore';
import { parseApiError } from '@/api/parseApiError';
```

Add selector:
```ts
const showError = useToastStore((s) => s.showError);
```

Update `handleSubmit`:
```ts
const handleSubmit = useCallback(
  async (dto: CreateTransactionDTO) => {
    try {
      await createMutation.mutateAsync(dto);
      navigate('/transactions');
    } catch (error) {
      const { generalErrors } = parseApiError(error);
      if (generalErrors.length > 0) {
        generalErrors.forEach((msg) => showError(msg));
      } else {
        showError('Произошла ошибка');
      }
    }
  },
  [createMutation, navigate],
);
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/pages/TransactionAddPage/TransactionAddPage.tsx
git commit -m "feat: add error handling to TransactionAddPage"
```

---

## Task 13: Migrate `TransactionPage` to toast store

**Files:**
- Modify: `src/pages/TransactionPage/TransactionPage.tsx`

Current state: Uses per-page `useState` for toast visibility, shows "Транзакция удалена" with "Отмена" action. Delete success shows toast, delete error does nothing visible.

- [ ] **Step 1: Replace per-page toast with toast store, add error handling for delete**

Update `src/pages/TransactionPage/TransactionPage.tsx`:

Remove the `Toast` import and per-page `useState` for toast. Add toast store imports:

```ts
import { useToastStore } from '@/store/useToastStore';
```

Replace the `handleDelete`, `handleUndo`, `handleToastClose` functions and `deletedId` state:

```ts
const showSuccessToast = useToastStore((s) => s.showSuccess);
const showErrorToast = useToastStore((s) => s.showError);
```

Update `handleDelete`:
```ts
const handleDelete = useCallback(
  async (id: string) => {
    const undoId = useToastStore.getState().addToast('Транзакция удалена', 'success', {
      actionLabel: 'Отмена',
      onAction: () => {
        undoDelete(id);
      },
    });

    markOptimisticDeleted(id);
    try {
      await deleteTransaction(id);
      confirmDeleted(id);
    } catch {
      undoDelete(id);
      useToastStore.getState().removeToast(undoId);
      showErrorToast('Ошибка удаления транзакции');
    }
  },
  [deleteTransaction, markOptimisticDeleted, confirmDeleted, undoDelete, showErrorToast],
);
```

Remove: `deletedId` state, `handleToastClose`, `handleUndo` function.

**Note:** `useToastStore.getState()` is used inside `handleDelete` because we need the return value of `addToast` (the toast ID) to later remove it on error. The hook selector `useToastStore((s) => s.addToast)` would also work, but `getState()` is more idiomatic when you need the return value inside a callback.

Remove the `<Toast>` JSX element at the bottom of the component.

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/pages/TransactionPage/TransactionPage.tsx
git commit -m "feat: migrate TransactionPage to toast store, add delete error handling"
```

---

## Task 14: Remove unused `Toast` direct imports and verify full build

**Files:**
- Potentially clean up any remaining direct `Toast` imports
- Run full type check and build

- [ ] **Step 1: Search for any remaining direct Toast imports that are unused**

Run: `grep -r "from '@/components/Toast/Toast'" src/pages/`

If any pages still import `Toast` directly and don't use it, remove those imports.

- [ ] **Step 2: Run full type check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Run full build**

Run: `npm run build`
Expected: Successful build with no errors

- [ ] **Step 4: Run lint**

Run: `npm run lint`
Expected: No lint errors (or fix any that appear)

- [ ] **Step 5: Commit any cleanup changes**

```bash
git add -A
git commit -m "chore: clean up unused Toast imports and verify build"
```

---

## Summary of dependencies between tasks

- **Task 1** (parseApiError) → no dependencies, start here
- **Task 2** (useToastStore) → no dependencies, can run in parallel with Task 1
- **Task 3** (Toast component refactor) → depends on Task 2 (uses useToastStore)
- **Task 5** (useForm extension) → no dependencies, can run in parallel with Tasks 1-3
- **Task 4** (useFormServerErrors) → depends on Task 1 (uses parseApiError) and Task 5 (uses UseFormReturn)
- **Tasks 6-13** (page integrations) → depend on Tasks 1-5 (all infrastructure must be ready)
- **Task 14** (cleanup) → depends on all page integrations being complete