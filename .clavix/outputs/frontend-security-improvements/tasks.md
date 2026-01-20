# Implementation Plan

**Project**: frontend-security-improvements
**Generated**: 2025-01-20T00:00:00Z
**Source**: Code Review AI Analysis

## Technical Context & Standards

*Detected Stack & Patterns*
- **Architecture**: Feature-based module organization with React 18
- **Framework**: React 18.2.0 + TypeScript 5.0 + Vite 5
- **Styling**: Tailwind CSS + Radix UI primitives
- **State Management**: Zustand (stores in `/src/stores`)
- **Server State**: @tanstack/react-query v5
- **Routing**: React Router v6 (HashRouter for Electron compatibility)
- **API Layer**: Axios with interceptors (`/src/lib/axios.ts`)
- **Forms**: React Hook Form + Zod validation
- **Testing**: Vitest (unit) + Playwright (E2E)
- **Path Aliases**: `@/*` maps to `./src/*`

---

## Phase 1: CRITICAL - Security Improvements

### 1.1 Token Storage Migration

- [ ] **Create cookie-based token storage utility** (ref: CRITICAL Issue #1)
  Task ID: phase-1-security-01
  > **Implementation**: Create `apps/frontend/src/lib/auth-storage.ts`.
  > **Details**:
  > - Create interface `TokenStorage` with methods: `getTokens()`, `setTokens()`, `clearTokens()`
  > - Implement two strategies: `LocalStorageTokenStorage` (current, for fallback) and `CookieTokenStorage` (new)
  > - Note: This is frontend-only. Backend changes required for HttpOnly cookies (see backend tasks)
  > - Export factory function `createTokenStorage(): TokenStorage` that detects best available method

- [ ] **Update auth.store to use new storage abstraction** (ref: CRITICAL Issue #1)
  Task ID: phase-1-security-02
  > **Implementation**: Modify `apps/frontend/src/stores/auth.store.ts`.
  > **Details**:
  > - Import `createTokenStorage` from `@/lib/auth-storage`
  > - Replace direct `localStorage` calls with `tokenStorage.getTokens()` on init
  > - Replace `localStorage.setItem()` calls with `tokenStorage.setTokens()`
  > - Replace `localStorage.removeItem()` calls with `tokenStorage.clearTokens()`
  > - Maintain same `AuthState` interface - this is an internal refactor

- [ ] **Update axios interceptor to use new storage** (ref: CRITICAL Issue #1)
  Task ID: phase-1-security-03
  > **Implementation**: Modify `apps/frontend/src/lib/axios.ts`.
  > **Details**:
  > - Import `createTokenStorage` from `@/lib/auth-storage`
  > - Replace `localStorage.getItem('accessToken')` with `tokenStorage.getTokens()?.accessToken`
  > - Replace refresh token retrieval with `tokenStorage.getTokens()?.refreshToken`
  > - Replace token saving with `tokenStorage.setTokens({ accessToken, refreshToken })`
  > - Replace token clearing with `tokenStorage.clearTokens()`

### 1.2 URL Redirection Security

- [ ] **Replace direct location.href with React Router navigate** (ref: CRITICAL Issue #2)
  Task ID: phase-1-security-04
  > **Implementation**: Modify `apps/frontend/src/lib/axios.ts`.
  > **Details**:
  > - This is tricky because axios interceptor is outside React context
  > - Create a singleton `NavigationManager` in `apps/frontend/src/lib/navigation-manager.ts`
  > - Store a `navigate` function reference that gets set by the App component
  > - Update axios interceptor to call `NavigationManager.navigateTo('/login')`
  > - In `App.tsx`, call `NavigationManager.init(navigate)` on mount

- [ ] **Update DashboardPage reload to use navigate** (ref: CRITICAL Issue #2)
  Task ID: phase-1-security-05
  > **Implementation**: Modify `apps/frontend/src/pages/DashboardPage.tsx:85`.
  > **Details**:
  > - Replace `onClick={() => globalThis.location.reload()}` with proper navigation
  > - Use `window.location.href = window.location.href` (self-redirect) is acceptable here for full reload
  > - Actually, keeping reload() is fine for error recovery - only redirect needs fixing
  > - This task can be skipped if review confirms reload() is safe here

---

## Phase 2: HIGH - Error Boundary & Reliability

- [ ] **Install react-error-boundary dependency** (ref: HIGH Issue #4)
  Task ID: phase-2-error-01
  > **Implementation**: Run `npm install react-error-boundary` in `apps/frontend/`.
  > **Details**:
  > - Add to dependencies in package.json
  > - Install types package if separate: `@types/react-error-boundary` (usually included)

- [ ] **Create ErrorBoundary component with fallback UI** (ref: HIGH Issue #4)
  Task ID: phase-2-error-02
  > **Implementation**: Create `apps/frontend/src/components/ErrorBoundary.tsx`.
  > **Details**:
  > - Import `ErrorBoundary` from 'react-error-boundary'
  > - Create `ErrorFallback` component with:
  >   - Friendly error message in Spanish
  >   - "Recargar aplicación" button
  >   - Optional: error details toggle for development
  > - Export wrapped component as default export

- [ ] **Wrap App with ErrorBoundary** (ref: HIGH Issue #4)
  Task ID: phase-2-error-03
  > **Implementation**: Modify `apps/frontend/src/App.tsx`.
  > **Details**:
  > - Import `ErrorBoundary` from `@/components/ErrorBoundary`
  > - Wrap the entire `BackendHealthCheck` component tree
  > - Place ErrorBoundary outside QueryClientProvider to catch all errors

---

## Phase 3: MEDIUM - Code Quality & DRY Fixes

### 3.1 DRY: formatCurrency Consolidation

- [ ] **Consolidate formatCurrency to utils.ts** (ref: HIGH Issue #5)
  Task ID: phase-3-dry-01
  > **Implementation**: Modify `apps/frontend/src/lib/utils.ts`.
  > **Details**:
  > - Existing `formatCurrency` in utils.ts is already good
  > - Add optional parameter `options?: Intl.NumberFormatOptions` for flexibility
  > - Update JSDoc to document usage

- [ ] **Remove duplicate formatCurrency from DashboardPage** (ref: HIGH Issue #5)
  Task ID: phase-3-dry-02
  > **Implementation**: Modify `apps/frontend/src/pages/DashboardPage.tsx:41-48`.
  > **Details**:
  > - Delete local `formatCurrency` function (lines ~41-48)
  > - Add import: `import { formatCurrency } from '@/lib/utils'`
  > - Verify all usages still work (they're identical)

- [ ] **Remove duplicate formatCurrency from SaleForm** (ref: HIGH Issue #5)
  Task ID: phase-3-dry-03
  > **Implementation**: Modify `apps/frontend/src/features/sales/components/SaleForm.tsx:77-84`.
  > **Details**:
  > - Delete local `formatCurrency` function (lines ~77-84)
  > - Add import: `import { formatCurrency } from '@/lib/utils'`
  > - Note: This version has `minimumFractionDigits: 0, maximumFractionDigits: 2`
  > - Update utils.ts version to accept options, or create `formatCurrencyInt` variant

### 3.2 Type Safety: Remove `any` Types

- [ ] **Fix product type in SaleForm handleProductSelect** (ref: MEDIUM Issue #9)
  Task ID: phase-3-types-01
  > **Implementation**: Modify `apps/frontend/src/features/sales/components/SaleForm.tsx:238`.
  > **Details**:
  > - Change `product: any` to `product: Product` from `@/features/products/types`
  > - Verify Product type has all required fields (id, name, price, stock)

- [ ] **Scan for other `any` types in codebase** (ref: MEDIUM Issue #9)
  Task ID: phase-3-types-02
  > **Implementation**: Search using grep pattern `:\s*any\b` in `apps/frontend/src/`.
  > **Details**:
  > - Run search to identify all occurrences
  > - Document each location with context
  > - For each, determine proper type or use `unknown` if truly dynamic
  > - Create separate tasks for each file that needs updates

### 3.3 Cleanup: Console Logs

- [ ] **Remove development console.log from SaleForm** (ref: LOW Issue #13)
  Task ID: phase-3-cleanup-01
  > **Implementation**: Modify `apps/frontend/src/features/sales/components/SaleForm.tsx`.
  > **Details**:
  > - Remove `console.log('Form validation errors:', errors)` at line ~405
  > - Replace with proper error logging if needed, or remove entirely

- [ ] **Remove development console.log from useTokenRefresh** (ref: LOW Issue #13)
  Task ID: phase-3-cleanup-02
  > **Implementation**: Modify `apps/frontend/src/hooks/useTokenRefresh.ts`.
  > **Details**:
  > - Remove `console.log('Renovando refresh token automáticamente...')` at line ~46
  > - Remove `console.log('Refresh token renovado exitosamente')` at line ~52
  > - Keep error console.error - these are legitimate error logs

---

## Phase 4: MEDIUM - Performance Improvements

### 4.1 React Optimizations

- [ ] **Add useCallback to handlers in SaleForm** (ref: MEDIUM Issue #10)
  Task ID: phase-4-perf-01
  > **Implementation**: Modify `apps/frontend/src/features/sales/components/SaleForm.tsx`.
  > **Details**:
  > - Wrap `handleCustomerSelect` in `useCallback` with deps: `[form]`
  > - Wrap `handleCustomerClear` in `useCallback` with deps: `[form]`
  > - Wrap `handleOpenCreateCustomer` in `useCallback` with deps: `[]`
  > - Wrap `handleProductSelect` in `useCallback` with deps: `[]`
  > - Wrap `updateQuantity` in `useCallback` with deps: `[form, itemFields]`
  > - Wrap `handleParkSale` in `useCallback` with deps: `[form, total, selectedCustomer, parkSale, onParkSale]`
  > - Note: Some dependencies like `form` may cause issues - test carefully

- [ ] **Scan other components for missing useCallback/useMemo** (ref: MEDIUM Issue #10)
  Task ID: phase-4-perf-02
  > **Implementation**: Review components in `apps/frontend/src/features/` and `apps/frontend/src/components/`.
  > **Details**:
  > - Focus on components that receive callbacks as props
  > - Focus on components in lists/maps that might re-render unnecessarily
  > - Create individual tasks for each component that needs optimization

### 4.2 AbortController for Request Cancellation

- [ ] **Add AbortController to useTokenRefresh** (ref: MEDIUM Issue #7)
  Task ID: phase-4-perf-03
  > **Implementation**: Modify `apps/frontend/src/hooks/useTokenRefresh.ts`.
  > **Details**:
  > - Create `AbortController` in useEffect
  > - Pass signal to `authService.refreshToken()` call
  > - Abort in cleanup function
  > - Catch AbortError and ignore (don't logout on abort)
  > - Note: authService may need update to accept signal parameter

- [ ] **Update authService to support abort signal** (ref: MEDIUM Issue #7)
  Task ID: phase-4-perf-04
  > **Implementation**: Modify `apps/frontend/src/services/auth.service.ts`.
  > **Details**:
  > - Update `refreshToken` method signature to accept optional `signal?: AbortSignal`
  > - Pass signal to axios config: `{ signal, ...config }`
  > - Apply same pattern to other API methods if needed

---

## Phase 5: LOW - Architecture & Maintainability

### 5.1 Extract Inline Styles

- [ ] **Extract BackendHealthCheck styles to CSS module** (ref: MEDIUM Issue #8)
  Task ID: phase-5-arch-01
  > **Implementation**: Create `apps/frontend/src/components/BackendHealthCheck.module.css` and modify component.
  > **Details**:
  > - Create new file `BackendHealthCheck.module.css`
  > - Move all CSS from `<style>` tag (lines 164-308) to the module
  > - Convert kebab-case class names to camelCase for CSS modules
  > - Update component to use `styles.className` instead of string literals
  > - Delete the entire `<style>{`...`}</style>` block

### 5.2 Configuration Improvements

- [ ] **Move hardcoded IVA percentage to configuration** (ref: LOW Issue #11)
  Task ID: phase-5-arch-02
  > **Implementation**: Modify `apps/frontend/src/features/sales/components/SaleForm.tsx:107`.
  > **Details**:
  > - Replace `const ivaPercentage = 21;` with config lookup
  > - Option A: Get from fiscalConfig query response (backend may already provide this)
  > - Option B: Create `src/config/tax.config.ts` with default values
  > - Update all usages of `ivaPercentage` variable

---

## Phase 6: LOW - Testing & Documentation

- [ ] **Add unit tests for auth storage utility** (ref: LOW Issue #14)
  Task ID: phase-6-test-01
  > **Implementation**: Create `apps/frontend/src/lib/auth-storage.spec.ts`.
  > **Details**:
  > - Test getTokens returns null when empty
  > - Test setTokens stores both tokens
  > - Test clearTokens removes all tokens
  > - Test LocalStorageTokenStorage implementation
  > - Mock Cookie API for CookieTokenStorage tests

- [ ] **Add unit test for SaleForm key functions** (ref: LOW Issue #14)
  Task ID: phase-6-test-02
  > **Implementation**: Create `apps/frontend/src/features/sales/components/SaleForm.spec.tsx`.
  > **Details**:
  > - Test formatCurrency consolidation works
  > - Test addItemToSale adds new item
  > - Test addItemToSale increments quantity for existing item
  > - Test updateQuantity increments/decrements correctly
  > - Test updateQuantity removes item when quantity < 1

- [ ] **Add ErrorBoundary component test** (ref: LOW Issue #14)
  Task ID: phase-6-test-03
  > **Implementation**: Create `apps/frontend/src/components/ErrorBoundary.spec.tsx`.
  > **Details**:
  > - Test ErrorFallback renders correctly
  > - Test reload button triggers window.location reload
  > - Test ErrorBoundary catches child component errors

---

## Phase 7: DEPENDENCY - Backend Coordination

> **Note**: These tasks require backend changes to fully implement. Mark as blocked until backend team coordination.

- [ ] **Coordinate HttpOnly cookie implementation with backend** (ref: CRITICAL Issue #1)
  Task ID: phase-7-backend-01
  > **Implementation**: Backend task - NOT in scope for frontend-only work.
  > **Details**:
  > - Backend must set `Set-Cookie` headers with `HttpOnly`, `Secure`, `SameSite=Strict`
  > - Backend must remove tokens from login response body
  > - Backend must handle cookie-based authentication for refresh endpoint
  > - Frontend can proceed with localStorage until backend is ready

---

## Task Statistics

| Phase | Tasks | Priority |
|-------|-------|----------|
| Phase 1: Security | 5 | CRITICAL |
| Phase 2: Error Boundary | 3 | HIGH |
| Phase 3: Code Quality | 7 | MEDIUM |
| Phase 4: Performance | 4 | MEDIUM |
| Phase 5: Architecture | 2 | LOW |
| Phase 6: Testing | 3 | LOW |
| Phase 7: Backend | 1 | BLOCKED |
| **TOTAL** | **25** | - |

---

## Implementation Order Recommendation

1. **Phase 2** (Error Boundary) - Do this first! It prevents app crashes and is independent of other work
2. **Phase 3.1** (formatCurrency) - Quick wins, low risk
3. **Phase 3.2** (Type fixes) - Improves type safety immediately
4. **Phase 3.3** (Console logs) - Trivial cleanup
5. **Phase 1** (Security) - Requires coordination, localStorage works for now
6. **Phase 4** (Performance) - Nice to have, not blocking
7. **Phase 5** (Architecture) - Can be done incrementally
8. **Phase 6** (Testing) - Add as you go

---

*Generated by Clavix /clavix:plan*
