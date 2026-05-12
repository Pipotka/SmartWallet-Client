# SmartWallet Web App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a mobile-first SmartWallet web application with category listing, wallet editing, and category editing pages based on Figma designs.

**Architecture:** React 19 + TypeScript 6 + Vite 8 with CSS Modules for styling, Zustand for state management, and React Router v7 for navigation. Mobile-first design targeting 402px width.

**Tech Stack:** React 19, TypeScript 6, Vite 8, React Router v7, Zustand, CSS Modules, Roboto font

**Figma status:** API rate limited (429). File key updated to 1XkzMeI3ah1RQg0pUA09Es. Only 6 of 13 screens were loaded previously. Implementation proceeds with available data only.

---

## File Structure

```
src/
  components/
    Header/
      Header.tsx
      Header.module.css
    BottomNav/
      BottomNav.tsx
      BottomNav.module.css
    InputField/
      InputField.tsx
      InputField.module.css
    Button/
      Button.tsx
      Button.module.css
    CategoryCard/
      CategoryCard.tsx
      CategoryCard.module.css
  pages/
    CategoryPage/
      CategoryPage.tsx
      CategoryPage.module.css
    EditWalletPage/
      EditWalletPage.tsx
      EditWalletPage.module.css
    EditCategoryPage/
      EditCategoryPage.tsx
      EditCategoryPage.module.css
  store/
    useWalletStore.ts
  types/
    index.ts
  styles/
    variables.css
    reset.css
  App.tsx
  App.module.css
  main.tsx
```

---

### Task 1: Project Setup — Dependencies and Configuration

**Files:**
- Modify: `package.json`
- Modify: `vite.config.ts`
- Modify: `index.html`
- Modify: `tsconfig.app.json`

- [ ] **Step 1: Install dependencies**

```bash
cd /mnt/c/ProgramProjects/React/smart-wallet-web-app && npm install react-router-dom zustand
```

- [ ] **Step 2: Update index.html — add Roboto font and set lang to ru**

Replace the entire content of `index.html`:

```html
<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet" />
    <title>Smart Wallet</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 3: Update tsconfig.app.json — add path aliases**

Replace the entire content of `tsconfig.app.json`:

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "target": "es2023",
    "lib": ["ES2023", "DOM"],
    "module": "esnext",
    "types": ["vite/client"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

- [ ] **Step 4: Update vite.config.ts — add path alias and CSS modules config**

Replace the entire content of `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  css: {
    modules: {
      localsConvention: 'camelCaseOnly',
    },
  },
})
```

- [ ] **Step 5: Verify build works**

```bash
cd /mnt/c/ProgramProjects/React/smart-wallet-web-app && npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 6: Commit**

```bash
cd /mnt/c/ProgramProjects/React/smart-wallet-web-app && git add -A && git commit -m "chore: install react-router-dom and zustand, configure path aliases and fonts"
```

---

### Task 2: Design System — CSS Variables and Global Styles

**Files:**
- Create: `src/styles/variables.css`
- Create: `src/styles/reset.css`
- Modify: `src/index.css`
- Delete: `src/App.css`

- [ ] **Step 1: Create `src/styles/variables.css`**

```css
:root {
  /* Primary colors */
  --color-primary: #2563EB;
  --color-primary-dark: #1E293B;
  --color-header: #0F172A;

  /* Background colors */
  --color-bg: #F9FAFB;
  --color-bg-alt: #F8FAFC;
  --color-surface: #FFFFFF;

  /* Accent colors */
  --color-blue-500: #3B82F6;
  --color-blue-400: #75A9FF;
  --color-indigo: #4F46E5;

  /* Category colors - Wallet (normal) */
  --color-wallet-bg: #E0F2FE;
  --color-wallet-text: #0369A1;

  /* Category colors - Over limit */
  --color-overlimit-bg: #FEE2E2;
  --color-overlimit-text: #991B1B;

  /* Category colors - Limit */
  --color-limit-bg: #64748B;

  /* Green */
  --color-green-500: #10B981;
  --color-green-600: #059669;

  /* Red */
  --color-red-400: #F87171;
  --color-red-500: #EF4444;

  /* Neutral */
  --color-neutral-200: #E2E8F0;
  --color-neutral-400: #94A3B8;
  --color-neutral-500: #64748B;
  --color-neutral-700: #334155;

  /* Text */
  --color-text-primary: #1E1E1E;
  --color-text-light: #E2E8F0;
  --color-text-muted: #64748B;

  /* Border */
  --color-border: #D9D9D9;
  --color-separator: #878787;

  /* Typography */
  --font-secondary: 'Roboto', system-ui, -apple-system, sans-serif;

  /* Font sizes */
  --text-xs: 12px;
  --text-sm: 14px;
  --text-base: 16px;
  --text-lg: 18px;
  --text-xl: 20px;
  --text-2xl: 24px;

  /* Border radius */
  --radius-md: 8px;
  --radius-lg: 12px;

  /* Shadows */
  --shadow-card: 0px 3px 5px rgba(0, 0, 0, 0.25);
  --shadow-card-alt: -2px 3px 5px rgba(0, 0, 0, 0.25);
  --shadow-nav: 0px -2px 5px rgba(0, 0, 0, 0.25);

  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 12px;
  --spacing-lg: 16px;
  --spacing-xl: 24px;
  --spacing-2xl: 32px;

  /* Layout */
  --header-height: 120px;
  --nav-height: 124px;
  --mobile-width: 402px;
}
```

- [ ] **Step 2: Create `src/styles/reset.css`**

```css
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  -webkit-text-size-adjust: 100%;
  -moz-text-size-adjust: 100%;
  text-size-adjust: 100%;
}

body {
  min-height: 100dvh;
  font-family: var(--font-secondary);
  font-size: var(--text-base);
  line-height: 1.4;
  color: var(--color-text-primary);
  background-color: var(--color-bg);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

img,
svg {
  display: block;
  max-width: 100%;
}

button {
  cursor: pointer;
  border: none;
  background: none;
  font: inherit;
  color: inherit;
}

input {
  font: inherit;
  color: inherit;
  border: none;
  outline: none;
  background: none;
}

a {
  color: inherit;
  text-decoration: none;
}

ul,
ol {
  list-style: none;
}
```

- [ ] **Step 3: Replace `src/index.css`**

```css
@import './styles/variables.css';
@import './styles/reset.css';

#root {
  max-width: var(--mobile-width);
  margin: 0 auto;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background-color: var(--color-bg);
  position: relative;
}
```

- [ ] **Step 4: Delete `src/App.css`**

```bash
rm /mnt/c/ProgramProjects/React/smart-wallet-web-app/src/App.css
```

- [ ] **Step 5: Verify build works**

```bash
cd /mnt/c/ProgramProjects/React/smart-wallet-web-app && npm run build
```

Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
cd /mnt/c/ProgramProjects/React/smart-wallet-web-app && git add -A && git commit -m "feat: add design system CSS variables, reset styles, and global layout"
```

---

### Task 3: TypeScript Types

**Files:**
- Create: `src/types/index.ts`

- [ ] **Step 1: Create `src/types/index.ts`**

```typescript
export interface Wallet {
  id: string;
  name: string;
  limit: number;
  value: number;
  isOverLimit: boolean;
}

export interface Category {
  id: string;
  name: string;
  limit: number;
  isOverLimit: boolean;
}

export type Item = (Wallet | Category) & {
  type: 'wallet' | 'category';
};

export type NavTab = 'home' | 'analytics' | 'transactions' | 'profile';

export interface UserInfo {
  lastName: string;
  firstName: string;
  middleName: string;
}
```

- [ ] **Step 2: Commit**

```bash
cd /mnt/c/ProgramProjects/React/smart-wallet-web-app && git add -A && git commit -m "feat: add TypeScript type definitions for Wallet, Category, and navigation"
```

---

### Task 4: Zustand Store

**Files:**
- Create: `src/store/useWalletStore.ts`

- [ ] **Step 1: Create `src/store/useWalletStore.ts`**

```typescript
import { create } from 'zustand';
import type { Wallet, Category, UserInfo } from '@/types';

interface WalletState {
  wallets: Wallet[];
  categories: Category[];
  userInfo: UserInfo;

  addWallet: (wallet: Omit<Wallet, 'id' | 'isOverLimit'>) => void;
  updateWallet: (id: string, updates: Partial<Omit<Wallet, 'id'>>) => void;
  deleteWallet: (id: string) => void;

  addCategory: (category: Omit<Category, 'id' | 'isOverLimit'>) => void;
  updateCategory: (id: string, updates: Partial<Omit<Category, 'id'>>) => void;
  deleteCategory: (id: string) => void;
}

const generateId = (): string => crypto.randomUUID();

export const useWalletStore = create<WalletState>((set) => ({
  wallets: [
    { id: '1', name: 'Кошелёк', limit: 1000, value: 100, isOverLimit: false },
    { id: '2', name: 'Карта', limit: 500, value: 600, isOverLimit: true },
  ],
  categories: [
    { id: '1', name: 'Продукты', limit: 5000, isOverLimit: false },
    { id: '2', name: 'Транспорт', limit: 3000, isOverLimit: false },
    { id: '3', name: 'Очень очень очень длинное название категории', limit: 2000, isOverLimit: true },
    { id: '4', name: 'Комунальные услуги', limit: 4000, isOverLimit: false },
  ],
  userInfo: {
    lastName: 'Абдулгаджиев',
    firstName: 'Насрудин',
    middleName: 'Магомедович',
  },

  addWallet: (wallet) =>
    set((state) => ({
      wallets: [
        ...state.wallets,
        {
          ...wallet,
          id: generateId(),
          isOverLimit: wallet.value > wallet.limit,
        },
      ],
    })),

  updateWallet: (id, updates) =>
    set((state) => ({
      wallets: state.wallets.map((w) => {
        if (w.id !== id) return w;
        const updated = { ...w, ...updates };
        return { ...updated, isOverLimit: updated.value > updated.limit };
      }),
    })),

  deleteWallet: (id) =>
    set((state) => ({
      wallets: state.wallets.filter((w) => w.id !== id),
    })),

  addCategory: (category) =>
    set((state) => ({
      categories: [
        ...state.categories,
        { ...category, id: generateId(), isOverLimit: false },
      ],
    })),

  updateCategory: (id, updates) =>
    set((state) => ({
      categories: state.categories.map((c) => {
        if (c.id !== id) return c;
        return { ...c, ...updates };
      }),
    })),

  deleteCategory: (id) =>
    set((state) => ({
      categories: state.categories.filter((c) => c.id !== id),
    })),
}));
```

- [ ] **Step 2: Verify build works**

```bash
cd /mnt/c/ProgramProjects/React/smart-wallet-web-app && npm run build
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
cd /mnt/c/ProgramProjects/React/smart-wallet-web-app && git add -A && git commit -m "feat: add Zustand store with wallet and category CRUD operations"
```

---

### Task 5: Header Component

**Files:**
- Create: `src/components/Header/Header.tsx`
- Create: `src/components/Header/Header.module.css`

- [ ] **Step 1: Create `src/components/Header/Header.module.css`**

```css
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: var(--header-height);
  padding: var(--spacing-lg) var(--spacing-xl);
  background-color: var(--color-header);
  border-radius: 0 var(--radius-lg) var(--radius-lg) 0;
  box-sizing: border-box;
}

.logo {
  font-family: var(--font-secondary);
  font-size: var(--text-2xl);
  font-weight: 400;
  color: var(--color-text-muted);
  margin: 0;
}

.userInfo {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--spacing-xs);
}

.userName {
  font-family: var(--font-secondary);
  font-size: var(--text-xl);
  font-weight: 400;
  color: var(--color-text-light);
  margin: 0;
  line-height: 1.2;
}

.backButton {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  color: var(--color-text-light);
  cursor: pointer;
  flex-shrink: 0;
}

.backIcon {
  width: 24px;
  height: 24px;
}

.titleSection {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex: 1;
  justify-content: center;
}

.title {
  font-family: var(--font-secondary);
  font-size: var(--text-2xl);
  font-weight: 400;
  color: var(--color-text-muted);
  text-align: center;
  margin: 0;
}
```

- [ ] **Step 2: Create `src/components/Header/Header.tsx`**

```tsx
import { useNavigate } from 'react-router-dom';
import { useWalletStore } from '@/store/useWalletStore';
import styles from './Header.module.css';

interface HeaderProps {
  showBackButton?: boolean;
  title?: string;
}

export function Header({ showBackButton = false, title }: HeaderProps) {
  const navigate = useNavigate();
  const userInfo = useWalletStore((s) => s.userInfo);

  return (
    <header className={styles.header}>
      {showBackButton ? (
        <button
          className={styles.backButton}
          onClick={() => navigate(-1)}
          aria-label="Назад"
        >
          <svg
            className={styles.backIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
        </button>
      ) : (
        <h1 className={styles.logo}>Smart Wallet</h1>
      )}

      {title && (
        <div className={styles.titleSection}>
          <h2 className={styles.title}>{title}</h2>
        </div>
      )}

      <div className={styles.userInfo}>
        <span className={styles.userName}>{userInfo.lastName}</span>
        <span className={styles.userName}>{userInfo.firstName}</span>
        <span className={styles.userName}>{userInfo.middleName}</span>
      </div>
    </header>
  );
}
```

- [ ] **Step 3: Verify build works**

```bash
cd /mnt/c/ProgramProjects/React/smart-wallet-web-app && npm run build
```

Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
cd /mnt/c/ProgramProjects/React/smart-wallet-web-app && git add -A && git commit -m "feat: add Header component with logo, back button, and user info"
```

---

### Task 6: BottomNav Component

**Files:**
- Create: `src/components/BottomNav/BottomNav.tsx`
- Create: `src/components/BottomNav/BottomNav.module.css`

- [ ] **Step 1: Create `src/components/BottomNav/BottomNav.module.css`**

```css
.nav {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: var(--mobile-width);
  max-width: 100%;
  height: var(--nav-height);
  background-color: var(--color-header);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  box-shadow: var(--shadow-nav);
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: var(--spacing-sm) var(--spacing-md);
  box-sizing: border-box;
  z-index: 100;
}

.tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  background-color: var(--color-blue-500);
  color: var(--color-text-light);
  cursor: pointer;
  transition: background-color 0.2s ease;
  border: none;
  min-width: 70px;
}

.tabActive {
  background-color: var(--color-blue-400);
}

.tabIcon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tabLabel {
  font-family: var(--font-secondary);
  font-size: var(--text-xs);
  font-weight: 400;
  color: var(--color-text-light);
}
```

- [ ] **Step 2: Create `src/components/BottomNav/BottomNav.tsx`**

```tsx
import { useLocation, useNavigate } from 'react-router-dom';
import type { NavTab } from '@/types';
import styles from './BottomNav.module.css';

interface NavItem {
  key: NavTab;
  label: string;
  path: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    key: 'home',
    label: 'Главная',
    path: '/',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
      </svg>
    ),
  },
  {
    key: 'analytics',
    label: 'Аналитика',
    path: '/analytics',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
      </svg>
    ),
  },
  {
    key: 'transactions',
    label: 'Транзакций',
    path: '/transactions',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
        <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
      </svg>
    ),
  },
  {
    key: 'profile',
    label: 'Профиль',
    path: '/profile',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
      </svg>
    ),
  },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className={styles.nav}>
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <button
            key={item.key}
            className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
            onClick={() => navigate(item.path)}
            aria-label={item.label}
          >
            <span className={styles.tabIcon}>{item.icon}</span>
            <span className={styles.tabLabel}>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 3: Verify build works**

```bash
cd /mnt/c/ProgramProjects/React/smart-wallet-web-app && npm run build
```

Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
cd /mnt/c/ProgramProjects/React/smart-wallet-web-app && git add -A && git commit -m "feat: add BottomNav component with 4 tabs and active state"
```

---

### Task 7: InputField Component

**Files:**
- Create: `src/components/InputField/InputField.tsx`
- Create: `src/components/InputField/InputField.module.css`

- [ ] **Step 1: Create `src/components/InputField/InputField.module.css`**

```css
.field {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  width: 100%;
}

.label {
  font-family: var(--font-secondary);
  font-size: var(--text-base);
  font-weight: 400;
  line-height: 140%;
  color: var(--color-text-primary);
}

.input {
  width: 100%;
  padding: var(--spacing-md) var(--spacing-lg);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-family: var(--font-secondary);
  font-size: var(--text-base);
  font-weight: 400;
  line-height: 100%;
  color: var(--color-text-primary);
  box-sizing: border-box;
  transition: border-color 0.2s ease;
}

.input:focus {
  border-color: var(--color-primary);
  outline: none;
}

.input::placeholder {
  color: var(--color-neutral-400);
}
```

- [ ] **Step 2: Create `src/components/InputField/InputField.tsx`**

```tsx
import styles from './InputField.module.css';

interface InputFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'number';
  name?: string;
}

export function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  name,
}: InputFieldProps) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      <input
        className={styles.input}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        name={name}
      />
    </div>
  );
}
```

- [ ] **Step 3: Verify build works**

```bash
cd /mnt/c/ProgramProjects/React/smart-wallet-web-app && npm run build
```

Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
cd /mnt/c/ProgramProjects/React/smart-wallet-web-app && git add -A && git commit -m "feat: add InputField component with label and styled input"
```

---

### Task 8: Button Component

**Files:**
- Create: `src/components/Button/Button.tsx`
- Create: `src/components/Button/Button.module.css`

- [ ] **Step 1: Create `src/components/Button/Button.module.css`**

```css
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  font-family: var(--font-secondary);
  font-size: var(--text-base);
  font-weight: 700;
  color: var(--color-text-light);
  cursor: pointer;
  border: none;
  transition: opacity 0.2s ease;
  box-sizing: border-box;
}

.button:hover {
  opacity: 0.9;
}

.button:active {
  opacity: 0.8;
}

.primary {
  background-color: var(--color-primary);
}

.neutral {
  background-color: var(--color-neutral-500);
}

.danger {
  background-color: var(--color-header);
}

.icon {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fullWidth {
  width: 100%;
}
```

- [ ] **Step 2: Create `src/components/Button/Button.tsx`**

```tsx
import styles from './Button.module.css';

type ButtonVariant = 'primary' | 'neutral' | 'danger';

interface ButtonProps {
  variant?: ButtonVariant;
  children: React.ReactNode;
  onClick?: () => void;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  type?: 'button' | 'submit';
  disabled?: boolean;
}

export function Button({
  variant = 'primary',
  children,
  onClick,
  icon,
  fullWidth = false,
  type = 'button',
  disabled = false,
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${styles.button} ${styles[variant]} ${fullWidth ? styles.fullWidth : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <span className={styles.icon}>{icon}</span>}
      {children}
    </button>
  );
}

export const SaveIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" width="16" height="16">
    <path d="M13.854 2.146a.5.5 0 0 1 0 .708l-8 8a.5.5 0 0 1-.708 0l-3-3a.5.5 0 1 1 .708-.708L5.5 9.793l7.646-7.647a.5.5 0 0 1 .708 0z" />
    <path d="M13.854 2.146a.5.5 0 0 1 0 .708l-8 8a.5.5 0 0 1-.708 0l-3-3a.5.5 0 1 1 .708-.708L5.5 9.793l7.646-7.647a.5.5 0 0 1 .708 0z" transform="translate(0,0) scale(1)" />
  </svg>
);

export const CloseIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
    <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
  </svg>
);
```

- [ ] **Step 3: Verify build works**

```bash
cd /mnt/c/ProgramProjects/React/smart-wallet-web-app && npm run build
```

Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
cd /mnt/c/ProgramProjects/React/smart-wallet-web-app && git add -A && git commit -m "feat: add Button component with primary, neutral, and danger variants"
```

---

### Task 9: CategoryCard Component

**Files:**
- Create: `src/components/CategoryCard/CategoryCard.tsx`
- Create: `src/components/CategoryCard/CategoryCard.module.css`

- [ ] **Step 1: Create `src/components/CategoryCard/CategoryCard.module.css`**

```css
.card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100px;
  height: 136px;
  border-radius: var(--radius-md);
  padding: var(--spacing-sm);
  box-sizing: border-box;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  text-align: center;
  gap: var(--spacing-xs);
}

.card:hover {
  transform: translateY(-2px);
}

.card:active {
  transform: translateY(0);
}

.wallet {
  background-color: var(--color-wallet-bg);
  color: var(--color-wallet-text);
  box-shadow: var(--shadow-card-alt);
}

.category {
  background-color: var(--color-wallet-bg);
  color: var(--color-wallet-text);
  box-shadow: var(--shadow-card);
}

.overLimit {
  background-color: var(--color-overlimit-bg);
  color: var(--color-overlimit-text);
}

.name {
  font-family: var(--font-secondary);
  font-size: var(--text-lg);
  font-weight: 400;
  text-align: center;
  line-height: 1.2;
  word-break: break-word;
  overflow-wrap: break-word;
  max-width: 100%;
}

.amount {
  font-family: var(--font-secondary);
  font-size: var(--text-sm);
  font-weight: 400;
  margin: 0;
}

.addButton {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100px;
  height: 136px;
  border-radius: var(--radius-md);
  border: 2px dashed var(--color-neutral-400);
  background-color: transparent;
  cursor: pointer;
  transition: border-color 0.2s ease;
  color: var(--color-neutral-400);
}

.addButton:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.plusIcon {
  width: 32px;
  height: 32px;
}
```

- [ ] **Step 2: Create `src/components/CategoryCard/CategoryCard.tsx`**

```tsx
import { useNavigate } from 'react-router-dom';
import styles from './CategoryCard.module.css';

interface CategoryCardProps {
  id: string;
  name: string;
  amount?: number;
  isOverLimit: boolean;
  type: 'wallet' | 'category';
}

export function CategoryCard({ id, name, amount, isOverLimit, type }: CategoryCardProps) {
  const navigate = useNavigate();

  const cardClass = [
    styles.card,
    type === 'wallet' ? styles.wallet : styles.category,
    isOverLimit ? styles.overLimit : '',
  ]
    .filter(Boolean)
    .join(' ');

  const editPath = type === 'wallet' ? `/wallet/${id}/edit` : `/category/${id}/edit`;

  return (
    <button className={cardClass} onClick={() => navigate(editPath)}>
      <span className={styles.name}>{name}</span>
      {amount !== undefined && <span className={styles.amount}>{amount} ₽</span>}
    </button>
  );
}

interface AddCardProps {
  onClick: () => void;
}

export function AddCard({ onClick }: AddCardProps) {
  return (
    <button className={styles.addButton} onClick={onClick} aria-label="Добавить">
      <svg
        className={styles.plusIcon}
        viewBox="0 0 32 32"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <line x1="16" y1="4" x2="16" y2="28" />
        <line x1="4" y1="16" x2="28" y2="16" />
      </svg>
    </button>
  );
}
```

- [ ] **Step 3: Verify build works**

```bash
cd /mnt/c/ProgramProjects/React/smart-wallet-web-app && npm run build
```

Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
cd /mnt/c/ProgramProjects/React/smart-wallet-web-app && git add -A && git commit -m "feat: add CategoryCard and AddCard components with over-limit styling"
```

---

### Task 10: CategoryPage

**Files:**
- Create: `src/pages/CategoryPage/CategoryPage.tsx`
- Create: `src/pages/CategoryPage/CategoryPage.module.css`

- [ ] **Step 1: Create `src/pages/CategoryPage/CategoryPage.module.css`**

```css
.page {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  background-color: var(--color-bg);
}

.content {
  flex: 1;
  padding: var(--spacing-xl);
  padding-bottom: calc(var(--nav-height) + var(--spacing-xl));
}

.section {
  margin-bottom: var(--spacing-xl);
}

.sectionTitle {
  font-family: var(--font-secondary);
  font-size: var(--text-lg);
  font-weight: 500;
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-md) 0;
}

.cardGrid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
}
```

- [ ] **Step 2: Create `src/pages/CategoryPage/CategoryPage.tsx`**

```tsx
import { Header } from '@/components/Header/Header';
import { BottomNav } from '@/components/BottomNav/BottomNav';
import { CategoryCard, AddCard } from '@/components/CategoryCard/CategoryCard';
import { useWalletStore } from '@/store/useWalletStore';
import styles from './CategoryPage.module.css';

export function CategoryPage() {
  const wallets = useWalletStore((s) => s.wallets);
  const categories = useWalletStore((s) => s.categories);

  return (
    <div className={styles.page}>
      <Header />

      <main className={styles.content}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Кошельки</h2>
          <div className={styles.cardGrid}>
            {wallets.map((wallet) => (
              <CategoryCard
                key={wallet.id}
                id={wallet.id}
                name={wallet.name}
                amount={wallet.value}
                isOverLimit={wallet.isOverLimit}
                type="wallet"
              />
            ))}
            <AddCard onClick={() => {}} />
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Категории</h2>
          <div className={styles.cardGrid}>
            {categories.map((category) => (
              <CategoryCard
                key={category.id}
                id={category.id}
                name={category.name}
                isOverLimit={category.isOverLimit}
                type="category"
              />
            ))}
            <AddCard onClick={() => {}} />
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
```

- [ ] **Step 3: Verify build works**

```bash
cd /mnt/c/ProgramProjects/React/smart-wallet-web-app && npm run build
```

Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
cd /mnt/c/ProgramProjects/React/smart-wallet-web-app && git add -A && git commit -m "feat: add CategoryPage with wallet and category sections"
```

---

### Task 11: EditWalletPage

**Files:**
- Create: `src/pages/EditWalletPage/EditWalletPage.tsx`
- Create: `src/pages/EditWalletPage/EditWalletPage.module.css`

- [ ] **Step 1: Create `src/pages/EditWalletPage/EditWalletPage.module.css`**

```css
.page {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  background-color: var(--color-bg);
}

.content {
  flex: 1;
  padding: var(--spacing-xl);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  width: 100%;
  max-width: 334px;
  margin: 0 auto;
}

.separator {
  width: 100%;
  height: 2px;
  background-color: var(--color-separator);
  border: none;
  margin: var(--spacing-sm) 0;
}

.buttonGroup {
  display: flex;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}
```

- [ ] **Step 2: Create `src/pages/EditWalletPage/EditWalletPage.tsx`**

```tsx
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header/Header';
import { InputField } from '@/components/InputField/InputField';
import { Button, SaveIcon, CloseIcon } from '@/components/Button/Button';
import { useWalletStore } from '@/store/useWalletStore';
import styles from './EditWalletPage.module.css';

export function EditWalletPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const wallets = useWalletStore((s) => s.wallets);
  const updateWallet = useWalletStore((s) => s.updateWallet);
  const deleteWallet = useWalletStore((s) => s.deleteWallet);

  const wallet = wallets.find((w) => w.id === id);

  const [name, setName] = useState(wallet?.name ?? '');
  const [limit, setLimit] = useState(String(wallet?.limit ?? ''));
  const [value, setValue] = useState(String(wallet?.value ?? ''));

  if (!wallet) {
    return (
      <div className={styles.page}>
        <Header showBackButton title="Кошелёк не найден" />
        <main className={styles.content}>
          <p>Кошелёк не найден</p>
        </main>
      </div>
    );
  }

  const handleSave = () => {
    const limitNum = Number(limit);
    const valueNum = Number(value);
    if (!isNaN(limitNum) && !isNaN(valueNum)) {
      updateWallet(id!, { name, limit: limitNum, value: valueNum });
      navigate('/');
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const handleDelete = () => {
    deleteWallet(id!);
    navigate('/');
  };

  return (
    <div className={styles.page}>
      <Header showBackButton title="Редактирование Кошелька" />

      <main className={styles.content}>
        <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
          <InputField
            label="Название"
            value={name}
            onChange={setName}
            placeholder="Название кошелька"
          />
          <InputField
            label="Лимиты"
            value={limit}
            onChange={setLimit}
            type="number"
            placeholder="0"
          />
          <InputField
            label="Значение"
            value={value}
            onChange={setValue}
            type="number"
            placeholder="0"
          />

          <hr className={styles.separator} />

          <div className={styles.buttonGroup}>
            <Button variant="primary" onClick={handleSave} icon={<SaveIcon />}>
              Сохранить
            </Button>
            <Button variant="neutral" onClick={handleCancel} icon={<CloseIcon />}>
              Отмена
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Удал
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Verify build works**

```bash
cd /mnt/c/ProgramProjects/React/smart-wallet-web-app && npm run build
```

Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
cd /mnt/c/ProgramProjects/React/smart-wallet-web-app && git add -A && git commit -m "feat: add EditWalletPage with form and CRUD operations"
```

---

### Task 12: EditCategoryPage

**Files:**
- Create: `src/pages/EditCategoryPage/EditCategoryPage.tsx`
- Create: `src/pages/EditCategoryPage/EditCategoryPage.module.css`

- [ ] **Step 1: Create `src/pages/EditCategoryPage/EditCategoryPage.module.css`**

```css
.page {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  background-color: var(--color-bg);
}

.content {
  flex: 1;
  padding: var(--spacing-xl);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  width: 100%;
  max-width: 334px;
  margin: 0 auto;
}

.separator {
  width: 100%;
  height: 2px;
  background-color: var(--color-separator);
  border: none;
  margin: var(--spacing-sm) 0;
}

.buttonGroup {
  display: flex;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}
```

- [ ] **Step 2: Create `src/pages/EditCategoryPage/EditCategoryPage.tsx`**

```tsx
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header/Header';
import { InputField } from '@/components/InputField/InputField';
import { Button, SaveIcon, CloseIcon } from '@/components/Button/Button';
import { useWalletStore } from '@/store/useWalletStore';
import styles from './EditCategoryPage.module.css';

export function EditCategoryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const categories = useWalletStore((s) => s.categories);
  const updateCategory = useWalletStore((s) => s.updateCategory);
  const deleteCategory = useWalletStore((s) => s.deleteCategory);

  const category = categories.find((c) => c.id === id);

  const [name, setName] = useState(category?.name ?? '');
  const [limit, setLimit] = useState(String(category?.limit ?? ''));

  if (!category) {
    return (
      <div className={styles.page}>
        <Header showBackButton title="Категория не найдена" />
        <main className={styles.content}>
          <p>Категория не найдена</p>
        </main>
      </div>
    );
  }

  const handleSave = () => {
    const limitNum = Number(limit);
    if (!isNaN(limitNum)) {
      updateCategory(id!, { name, limit: limitNum });
      navigate('/');
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const handleDelete = () => {
    deleteCategory(id!);
    navigate('/');
  };

  return (
    <div className={styles.page}>
      <Header showBackButton title="Редактирование категории" />

      <main className={styles.content}>
        <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
          <InputField
            label="Название"
            value={name}
            onChange={setName}
            placeholder="Название категории"
          />
          <InputField
            label="Лимиты"
            value={limit}
            onChange={setLimit}
            type="number"
            placeholder="0"
          />

          <hr className={styles.separator} />

          <div className={styles.buttonGroup}>
            <Button variant="primary" onClick={handleSave} icon={<SaveIcon />}>
              Сохранить
            </Button>
            <Button variant="neutral" onClick={handleCancel} icon={<CloseIcon />}>
              Отмена
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Удал
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Verify build works**

```bash
cd /mnt/c/ProgramProjects/React/smart-wallet-web-app && npm run build
```

Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
cd /mnt/c/ProgramProjects/React/smart-wallet-web-app && git add -A && git commit -m "feat: add EditCategoryPage with form and CRUD operations"
```

---

### Task 13: App Routing and Layout

**Files:**
- Modify: `src/App.tsx`
- Create: `src/App.module.css`
- Modify: `src/main.tsx`

- [ ] **Step 1: Create `src/App.module.css`**

```css
.app {
  width: 100%;
  max-width: var(--mobile-width);
  margin: 0 auto;
  min-height: 100dvh;
  position: relative;
}
```

- [ ] **Step 2: Replace `src/App.tsx`**

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CategoryPage } from '@/pages/CategoryPage/CategoryPage';
import { EditWalletPage } from '@/pages/EditWalletPage/EditWalletPage';
import { EditCategoryPage } from '@/pages/EditCategoryPage/EditCategoryPage';
import styles from './App.module.css';

function App() {
  return (
    <BrowserRouter>
      <div className={styles.app}>
        <Routes>
          <Route path="/" element={<CategoryPage />} />
          <Route path="/wallet/:id/edit" element={<EditWalletPage />} />
          <Route path="/category/:id/edit" element={<EditCategoryPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
```

- [ ] **Step 3: Update `src/main.tsx`**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 4: Delete unused assets**

```bash
rm -f /mnt/c/ProgramProjects/React/smart-wallet-web-app/src/assets/react.svg
rm -f /mnt/c/ProgramProjects/React/smart-wallet-web-app/src/assets/vite.svg
rm -f /mnt/c/ProgramProjects/React/smart-wallet-web-app/src/assets/hero.png
```

- [ ] **Step 5: Verify build works**

```bash
cd /mnt/c/ProgramProjects/React/smart-wallet-web-app && npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 6: Verify dev server starts**

```bash
cd /mnt/c/ProgramProjects/React/smart-wallet-web-app && timeout 10 npm run dev || true
```

Expected: Dev server starts without errors.

- [ ] **Step 7: Commit**

```bash
cd /mnt/c/ProgramProjects/React/smart-wallet-web-app && git add -A && git commit -m "feat: wire up React Router with all pages and clean up default Vite assets"
```

---

### Task 14: Final Verification and Cleanup

**Files:**
- All project files

- [ ] **Step 1: Run TypeScript type check**

```bash
cd /mnt/c/ProgramProjects/React/smart-wallet-web-app && npx tsc --noEmit
```

Expected: No type errors.

- [ ] **Step 2: Run ESLint**

```bash
cd /mnt/c/ProgramProjects/React/smart-wallet-web-app && npm run lint
```

Expected: No lint errors (or only acceptable warnings).

- [ ] **Step 3: Run production build**

```bash
cd /mnt/c/ProgramProjects/React/smart-wallet-web-app && npm run build
```

Expected: Build succeeds.

- [ ] **Step 4: Final commit if any fixes were needed**

```bash
cd /mnt/c/ProgramProjects/React/smart-wallet-web-app && git add -A && git commit -m "chore: fix type and lint issues from final verification"
```

---

## Дизайн-система

**Цвета:** Primary #2563EB, Header #0F172A, Wallet bg #E0F2FE/text #0369A1, Over-limit bg #FEE2E2/text #991B1B, Limit bg #64748B
