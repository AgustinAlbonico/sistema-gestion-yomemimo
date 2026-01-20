# Implementation Plan - E2E Tests Fixes (Updated)

**Project**: e2e-fixes
**Generated**: 2025-01-18T14:45:00Z
**Source**: Latest test run analysis - 53 tests failing

## Technical Context & Standards

*Detected Stack & Patterns*
- **Framework**: React + TypeScript (Vite)
- **E2E Testing**: Playwright v1.57.0
- **Test Structure**: `/apps/frontend/e2e/tests/*.spec.ts`
- **Test Fixtures**: Custom fixtures in `/apps/frontend/e2e/fixtures/test-fixtures.ts`
- **Auth Setup**: Global setup in `/apps/frontend/e2e/auth.setup.ts`

## Summary of Issues Found (Latest Run)

| Category | Count | Priority |
|----------|-------|----------|
| **Critical: Function does not exist** | 11 tests | 🔴 P0 - `waitForLoadURL` |
| **Critical: Strict mode violation** | 2 tests | 🔴 P0 - Ambiguous selectors |
| **High: Timeout / UI issues** | 39 tests | 🟡 P1 - Modals not opening |
| **Medium: Toast/Assertion** | 1 test | 🟢 P2 - Error toast not found |

---

## Phase 1: Critical Fix - Replace `waitForLoadURL` (11 tests)

**All 11 tests in customer-accounts.spec.ts fail because `page.waitForLoadURL` does not exist in Playwright API**

- [ ] **Replace `waitForLoadURL` with `waitForURL` in customer-accounts.spec.ts** (ref: test-analysis)
  Task ID: phase-1-critical-01
  > **Implementation**: Edit `apps/frontend/e2e/tests/customer-accounts.spec.ts`
  > **Details**: Replace ALL 12 occurrences of `page.waitForLoadURL('**/customers')` with `page.waitForURL('**/customers')`. Affected lines: 17, 57, 104, 126, 191, 242, 318, 360, 405, 459, 511, 557.
  > **Command**: Use Edit tool with pattern replacement: `waitForLoadURL` → `waitForURL`

---

## Phase 2: Critical Fix - Strict Mode Violations (2 tests)

**Tests fail because selectors resolve to multiple elements**

- [ ] **Fix strict mode violation - 'Caja' heading** (ref: cash-register:15)
  Task ID: phase-2-critical-01
  > **Implementation**: Edit `apps/frontend/e2e/tests/cash-register.spec.ts` line 15
  > **Details**: Change `page.getByRole('heading', { name: 'Caja' })` to `page.getByRole('heading', { name: 'Caja' }).first()`. The selector resolves to 2 elements: h1 "Caja" and h3 inside "Historial de Cajas".

- [ ] **Fix strict mode violation - 'Historial de Cajas' text** (ref: cash-register:30)
  Task ID: phase-2-critical-02
  > **Implementation**: Edit `apps/frontend/e2e/tests/cash-register.spec.ts` line 30
  > **Details**: Change `page.getByText('Historial de Cajas')` to `page.getByRole('heading', { name: 'Historial de Cajas' })` or add `.first()`. Resolves to 3 elements: tab button, h3 heading, and text div.

---

## Phase 3: High Priority - Investigate Modal Timeouts (39 tests)

**Pattern: Tests timeout at ~10-11s when trying to open dialogs/modals**

### Sales (11 tests)
- [ ] **Debug sales modal timeout** (ref: sales.spec.ts)
  Task ID: phase-3-sales-01
  > **Implementation**: Run debug & fix `apps/frontend/e2e/tests/sales.spec.ts`
  > **Details**: Failing tests at lines: 54, 65, 76, 84, 93, 132, 141, 155, 299, 331, 432, 472, 572, 585, 599.
  > **Root Cause**: "debe abrir el modal de nueva venta" - button click succeeds but dialog doesn't appear within 10s.
  > **Fix Approach**: 1) Check if "Nueva Venta" button selector is correct, 2) Verify if cash register needs to be open first, 3) Check for blocking toast messages.

### Incomes (10 tests)
- [ ] **Debug incomes modal timeout** (ref: incomes.spec.ts)
  Task ID: phase-3-incomes-01
  > **Implementation**: Run debug & fix `apps/frontend/e2e/tests/incomes.spec.ts`
  > **Details**: Failing tests at lines: 13, 44, 87, 125, 195, 225, 277, 398, 442, 487.
  > **Root Cause**: "debe abrir modal/diálogo de ingreso" - similar to sales, dialog not appearing.

### Expenses (5 tests)
- [ ] **Debug expenses modal timeout** (ref: expenses.spec.ts)
  Task ID: phase-3-expenses-01
  > **Implementation**: Run debug & fix `apps/frontend/e2e/tests/expenses.spec.ts`
  > **Details**: Failing tests at lines: 40, 45, 76, 95, 119.
  > **Root Cause**: "debe abrir el diálogo de nuevo gasto" - dialog not appearing.

### Purchases (3 tests)
- [ ] **Debug purchases modal timeout** (ref: purchases.spec.ts)
  Task ID: phase-3-purchases-01
  > **Implementation**: Run debug & fix `apps/frontend/e2e/tests/purchases.spec.ts`
  > **Details**: Failing tests at lines: 28, 34, 65.
  > **Root Cause**: "debe abrir el diálogo de nueva compra" - dialog not appearing.

### Customers & Suppliers (3 tests)
- [ ] **Debug customers save button timeout** (ref: customers.spec.ts:66,77)
  Task ID: phase-3-customers-01
  > **Implementation**: Run debug & fix `apps/frontend/e2e/tests/customers.spec.ts`
  > **Details**: `TimeoutError: locator.click: Timeout 10000ms exceeded` on "Guardar" button. Button may not be visible or enabled.

- [ ] **Debug suppliers save button timeout** (ref: suppliers.spec.ts:36)
  Task ID: phase-3-suppliers-01
  > **Implementation**: Run debug & fix `apps/frontend/e2e/tests/suppliers.spec.ts`
  > **Details**: Similar to customers - "Guardar" button timeout.

### Data Freshness (1 test)
- [ ] **Debug data-freshness timeout** (ref: data-freshness.spec.ts:13)
  Task ID: phase-3-data-01
  > **Implementation**: Run debug & fix `apps/frontend/e2e/tests/data-freshness.spec.ts`
  > **Details**: Test "debe actualizar Reportes después de modificar datos en Cuentas Corrientes" times out. Requires test data setup.

---

## Phase 4: Medium Priority - Toast Assertion Fix (1 test)

- [ ] **Fix auth error toast selector** (ref: auth.spec.ts:49)
  Task ID: phase-4-auth-01
  > **Implementation**: Edit `apps/frontend/e2e/tests/auth.spec.ts` line 49
  > **Details**: `expect.toBeVisible failed` - toast with regex /error|incorrecto|inválido/i not found.
  > **Fix**: Check actual toast text in production. The toast might use different text or the selector `[data-sonner-toast]` might need adjustment.

---

## Phase 5: Low Priority - Sidebar Test Fix (1 test)

- [ ] **Fix navigation sidebar assertion** (ref: navigation.spec.ts:18)
  Task ID: phase-5-nav-01
  > **Implementation**: Edit `apps/frontend/e2e/tests/navigation.spec.ts` lines 15-37
  > **Details**: Test expects `<aside>` but code throws "No sidebar found". Current code has try/catch but still throws. Make it fail gracefully or update selector.

---

## Phase 6: Verification & Summary

- [ ] **Run full E2E suite and document improvements** (ref: final-verification)
  Task ID: phase-6-verify-01
  > **Implementation**: Run `cd apps/frontend && npm run test:e2e`
  > **Details**: After Phases 1-5, re-run full suite. Expected: At least 13 more tests passing (11 waitForLoadURL + 2 strict mode). Document remaining failures with new root causes.

---

## Quick Reference File Paths

| File | Lines to Fix | Issue |
|------|-------------|-------|
| `customer-accounts.spec.ts` | 17, 57, 104, 126, 191, 242, 318, 360, 405, 459, 511, 557 | `waitForLoadURL` → `waitForURL` |
| `cash-register.spec.ts` | 15, 30 | Add `.first()` or use exact selector |
| `auth.spec.ts` | 49 | Fix toast selector |
| `navigation.spec.ts` | 15-37 | Fix sidebar assertion |
| `sales.spec.ts` | 54, 65, 76, 84, 93, 132, 141, 155, 299, 331, 432, 472, 572, 585, 599 | Debug modal timeout |
| `incomes.spec.ts` | 13, 44, 87, 125, 195, 225, 277, 398, 442, 487 | Debug modal timeout |
| `expenses.spec.ts` | 40, 45, 76, 95, 119 | Debug modal timeout |
| `purchases.spec.ts` | 28, 34, 65 | Debug modal timeout |
| `customers.spec.ts` | 66, 77 | Debug save button timeout |
| `suppliers.spec.ts` | 36 | Debug save button timeout |
| `data-freshness.spec.ts` | 13 | Debug timeout |

---

*Generated by Clavix /clavix:plan*
