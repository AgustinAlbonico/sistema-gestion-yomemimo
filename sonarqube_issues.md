# SonarQube Issues - Proyecto "punto-de-venta"

**Fecha de generación**: 2025-12-11  
**Total de issues**: 624

---

## 🔴 BLOCKER (1 issue)

| Archivo | Línea | Mensaje | Regla |
|---------|-------|---------|-------|
| `apps/backend/certs/production/clave_privada.key` | 1 | Make sure this private key gets revoked, changed, and removed from the code. | `secrets:S6706` |

---

## 🟠 CRITICAL (25 issues - 25 resueltos)

| Archivo | Línea | Mensaje | Regla |
|---------|-------|---------|-------|
| ~~`apps/backend/src/assets/factura-c.html`~~ | ~~54~~ | ~~Unexpected shorthand "margin" after "margin-right"~~ | ~~`css:S4657`~~ | ✅ RESUELTO
| ~~`apps/backend/src/modules/afip/afip.service.ts`~~ | ~~273~~ | ~~Cognitive Complexity from 16 to 15 allowed~~ | ~~`typescript:S3776`~~ | ✅ RESUELTO
| ~~`apps/backend/src/modules/cash-register/cash-register.service.ts`~~ | ~~185~~ | ~~Cognitive Complexity from 22 to 15 allowed~~ | ~~`typescript:S3776`~~ | ✅ RESUELTO
| ~~`apps/backend/src/modules/cash-register/cash-register.service.ts`~~ | ~~364~~ | ~~Cognitive Complexity from 31 to 15 allowed~~ | ~~`typescript:S3776`~~ | ✅ RESUELTO
| `apps/backend/src/modules/customer-accounts/customer-accounts.service.ts` | 168 | Cognitive Complexity from 26 to 15 allowed | `typescript:S3776` |
| ~~`apps/backend/src/modules/products/products.service.ts`~~ | ~~35~~ | ~~Cognitive Complexity from 22 to 15 allowed~~ | ~~`typescript:S3776`~~ | ✅ RESUELTO
| `apps/backend/src/modules/reports/reports.service.ts` | 265 | Cognitive Complexity from 19 to 15 allowed | `typescript:S3776` |
| ~~`apps/backend/src/modules/sales/sales.service.ts`~~ | ~~68~~ | ~~Cognitive Complexity from 62 to 15 allowed~~ | ~~`typescript:S3776`~~ | ✅ RESUELTO
| ~~`apps/backend/src/modules/sales/sales.service.ts`~~ | ~~397~~ | ~~Cognitive Complexity from 36 to 15 allowed~~ | ~~`typescript:S3776`~~ | ✅ RESUELTO
| ~~`apps/frontend/src/features/cash-register/components/CashRegisterSummary.tsx`~~ | ~~66~~ | ~~Cognitive Complexity from 28 to 15 allowed~~ | ~~`typescript:S3776`~~ | ✅ RESUELTO
| ~~`apps/frontend/src/features/configuration/pages/SettingsPage.tsx`~~ | ~~47~~ | ~~Cognitive Complexity from 18 to 15 allowed~~ | ~~`typescript:S3776`~~ | ✅ RESUELTO
| ~~`apps/frontend/src/features/customers/components/AccountStatementPage.tsx`~~ | ~~93~~ | ~~Cognitive Complexity from 18 to 15 allowed~~ | ~~`typescript:S3776`~~ | ✅ RESUELTO
| ~~`apps/frontend/src/features/expenses/components/ExpenseForm.tsx`~~ | ~~60~~ | ~~Cognitive Complexity from 17 to 15 allowed~~ | ~~`typescript:S3776`~~ | ✅ RESUELTO
| ~~`apps/frontend/src/features/income/components/IncomeForm.tsx`~~ | ~~57~~ | ~~Cognitive Complexity from 18 to 15 allowed~~ | ~~`typescript:S3776`~~ | ✅ RESUELTO
| ~~`apps/frontend/src/features/products/components/ProductForm.tsx`~~ | ~~91~~ | ~~Cognitive Complexity from 22 to 15 allowed~~ | ~~`typescript:S3776`~~ | ✅ RESUELTO
| ~~`apps/frontend/src/features/products/components/ProductList.tsx`~~ | ~~44~~ | ~~Cognitive Complexity from 18 to 15 allowed~~ | ~~`typescript:S3776`~~ | ✅ RESUELTO
| ~~`apps/frontend/src/features/purchases/components/PurchaseForm.tsx`~~ | ~~121~~ | ~~Cognitive Complexity from 34 to 15 allowed~~ | ~~`typescript:S3776`~~ | ✅ RESUELTO
| ~~`apps/frontend/src/features/purchases/components/PurchaseList.tsx`~~ | ~~42~~ | ~~Cognitive Complexity from 16 to 15 allowed~~ | ~~`typescript:S3776`~~ | ✅ RESUELTO
| ~~`apps/frontend/src/features/sales/components/SaleDetailDialog.tsx`~~ | ~~55~~ | ~~Cognitive Complexity from 25 to 15 allowed~~ | ~~`typescript:S3776`~~ | ✅ RESUELTO
| ~~`apps/frontend/src/features/sales/components/SaleForm.tsx`~~ | ~~178~~ | ~~Cognitive Complexity from 89 to 15 allowed~~ | ~~`typescript:S3776`~~ | ✅ RESUELTO
| ~~`apps/frontend/src/features/sales/components/SaleList.tsx`~~ | ~~80~~ | ~~Cognitive Complexity from 26 to 15 allowed~~ | ~~`typescript:S3776`~~ | ✅ RESUELTO
| ~~`apps/frontend/src/components/layout/Sidebar.tsx`~~ | ~~28~~ | ~~Cognitive Complexity from 16 to 15 allowed~~ | ~~`typescript:S3776`~~ | ✅ RESUELTO
| ~~`apps/frontend/src/features/sales/components/SaleForm.tsx`~~ | ~~697~~ | ~~Do not use &&, use a ternary expression instead~~ | ~~`typescript:S6853`~~ | ✅ RESUELTO
| ~~`apps/frontend/src/features/sales/components/SaleForm.tsx`~~ | ~~703~~ | ~~Do not use &&, use a ternary expression instead~~ | ~~`typescript:S6853`~~ | ✅ RESUELTO
| ~~`apps/frontend/src/features/sales/components/SaleForm.tsx`~~ | ~~709~~ | ~~Do not use &&, use a ternary expression instead~~ | ~~`typescript:S6853`~~ | ✅ RESUELTO
| ~~`apps/frontend/src/features/sales/components/SaleForm.tsx`~~ | ~~715~~ | ~~Do not use &&, use a ternary expression instead~~ | ~~`typescript:S6853`~~ | ✅ RESUELTO
| ~~`apps/frontend/src/features/sales/components/SaleForm.tsx`~~ | ~~978~~ | ~~Do not use &&, use a ternary expression instead~~ | ~~`typescript:S6853`~~ | ✅ RESUELTO
| ~~`apps/frontend/src/features/sales/components/SaleForm.tsx`~~ | ~~1087~~ | ~~Do not use &&, use a ternary expression instead~~ | ~~`typescript:S6853`~~ | ✅ RESUELTO

---

## 🟡 MAJOR (273 issues - algunos resueltos)

### Backend

| Archivo | Línea | Mensaje | Regla |
|---------|-------|---------|-------|
| `apps/backend/src/assets/factura-c.html` | 2 | Add "lang" and/or "xml:lang" attributes to this "<html>" element | `Web:S5254` |
| `apps/backend/src/assets/factura-c.html` | - | Add "<th>" headers to this table | `Web:S5256` |
| `apps/backend/src/modules/afip/afip.service.ts` | 7 | Remove this commented out code | `typescript:S125` |
| `apps/backend/src/modules/afip/afip.service.ts` | 70 | Remove this commented out code | `typescript:S125` |
| `apps/backend/src/modules/afip/afip.service.ts` | 80 | Remove this commented out code | `typescript:S125` |
| `apps/backend/src/modules/afip/afip.service.ts` | 162 | Remove this commented out code | `typescript:S125` |
| `apps/backend/src/modules/afip/utils/wsfe-utils.ts` | 10 | Remove this commented out code | `typescript:S125` |
| `apps/backend/src/modules/afip/utils/wsfe-utils.ts` | 23 | Remove this commented out code | `typescript:S125` |
| `apps/backend/src/modules/afip/utils/wsfe-utils.ts` | 55 | Remove this commented out code | `typescript:S125` |
| `apps/backend/src/modules/cash-register/cash-register.service.ts` | 6 | Remove this commented out code | `typescript:S125` |
| `apps/backend/src/modules/cash-register/cash-register.service.ts` | 161 | Remove this commented out code | `typescript:S125` |
| ~~`apps/backend/src/modules/cash-register/cash-register.service.ts`~~ | ~~197~~ | ~~Unexpected lexical declaration in case block~~ | ~~`typescript:S6836`~~ | ✅ RESUELTO
| ~~`apps/backend/src/modules/cash-register/cash-register.service.ts`~~ | ~~198~~ | ~~Unexpected lexical declaration in case block~~ | ~~`typescript:S6836`~~ | ✅ RESUELTO
| ~~`apps/backend/src/modules/cash-register/cash-register.service.ts`~~ | ~~205~~ | ~~Unexpected lexical declaration in case block~~ | ~~`typescript:S6836`~~ | ✅ RESUELTO
| ~~`apps/backend/src/modules/cash-register/cash-register.service.ts`~~ | ~~206~~ | ~~Unexpected lexical declaration in case block~~ | ~~`typescript:S6836`~~ | ✅ RESUELTO
| ~~`apps/backend/src/modules/cash-register/cash-register.service.ts`~~ | ~~210~~ | ~~Unexpected lexical declaration in case block~~ | ~~`typescript:S6836`~~ | ✅ RESUELTO
| ~~`apps/backend/src/modules/cash-register/cash-register.service.ts`~~ | ~~226~~ | ~~Unexpected lexical declaration in case block~~ | ~~`typescript:S6836`~~ | ✅ RESUELTO
| ~~`apps/backend/src/modules/cash-register/cash-register.service.ts`~~ | ~~227~~ | ~~Unexpected lexical declaration in case block~~ | ~~`typescript:S6836`~~ | ✅ RESUELTO
| ~~`apps/backend/src/modules/cash-register/cash-register.service.ts`~~ | ~~234~~ | ~~Unexpected lexical declaration in case block~~ | ~~`typescript:S6836`~~ | ✅ RESUELTO
| ~~`apps/backend/src/modules/configuration/configuration.service.ts`~~ | ~~2~~ | ~~Remove this commented out code~~ | ~~`typescript:S125`~~ | ✅ RESUELTO
| ~~`apps/backend/src/modules/customer-accounts/customer-accounts.controller.ts`~~ | ~~7~~ | ~~Remove this commented out code~~ | ~~`typescript:S125`~~ | ✅ RESUELTO
| ~~`apps/backend/src/modules/customer-accounts/customer-accounts.service.ts`~~ | ~~176~~ | ~~Unexpected lexical declaration in case block~~ | ~~`typescript:S6836`~~ | ✅ RESUELTO
| ~~`apps/backend/src/modules/customer-accounts/customer-accounts.service.ts`~~ | ~~177~~ | ~~Unexpected lexical declaration in case block~~ | ~~`typescript:S6836`~~ | ✅ RESUELTO
| ~~`apps/backend/src/modules/customer-accounts/customer-accounts.service.ts`~~ | ~~178~~ | ~~Unexpected lexical declaration in case block~~ | ~~`typescript:S6836`~~ | ✅ RESUELTO
| ~~`apps/backend/src/modules/customer-accounts/customer-accounts.service.ts`~~ | ~~186~~ | ~~Unexpected lexical declaration in case block~~ | ~~`typescript:S6836`~~ | ✅ RESUELTO
| ~~`apps/backend/src/modules/customer-accounts/customer-accounts.service.ts`~~ | ~~187~~ | ~~Unexpected lexical declaration in case block~~ | ~~`typescript:S6836`~~ | ✅ RESUELTO
| ~~`apps/backend/src/modules/customer-accounts/customer-accounts.service.ts`~~ | ~~188~~ | ~~Unexpected lexical declaration in case block~~ | ~~`typescript:S6836`~~ | ✅ RESUELTO
| ~~`apps/backend/src/modules/fiscal-configuration/fiscal-configuration.service.ts`~~ | ~~3~~ | ~~Remove this commented out code~~ | ~~`typescript:S125`~~ | ✅ RESUELTO
| ~~`apps/backend/src/modules/invoices/invoices.service.ts`~~ | ~~4~~ | ~~Remove this commented out code~~ | ~~`typescript:S125`~~ | ✅ RESUELTO
| ~~`apps/backend/src/modules/invoices/invoices.service.ts`~~ | ~~7~~ | ~~Remove this commented out code~~ | ~~`typescript:S125`~~ | ✅ RESUELTO
| ~~`apps/backend/src/modules/products/products.service.ts`~~ | ~~71~~ | ~~Remove this commented out code~~ | ~~`typescript:S125`~~ | ✅ RESUELTO
| ~~`apps/backend/src/modules/products/products.service.ts`~~ | ~~76~~ | ~~Remove this commented out code~~ | ~~`typescript:S125`~~ | ✅ RESUELTO
| ~~`apps/backend/src/modules/reports/reports.service.ts`~~ | ~~285~~ | ~~Unexpected lexical declaration in case block~~ | ~~`typescript:S6836`~~ | ✅ RESUELTO
| ~~`apps/backend/src/modules/reports/reports.service.ts`~~ | ~~286~~ | ~~Unexpected lexical declaration in case block~~ | ~~`typescript:S6836`~~ | ✅ RESUELTO
| ~~`apps/backend/src/modules/sales/sales.service.ts`~~ | ~~6~~ | ~~Remove this commented out code~~ | ~~`typescript:S125`~~ | ✅ RESUELTO
| ~~`apps/backend/src/modules/sales/sales.service.ts`~~ | ~~10~~ | ~~Remove this commented out code~~ | ~~`typescript:S125`~~ | ✅ RESUELTO
| ~~`apps/backend/src/modules/sales/sales.service.ts`~~ | ~~149~~ | ~~Remove this commented out code~~ | ~~`typescript:S125`~~ | ✅ RESUELTO
| ~~`apps/backend/src/modules/sales/sales.service.ts`~~ | ~~265~~ | ~~Remove this commented out code~~ | ~~`typescript:S125`~~ | ✅ RESUELTO
| ~~`apps/backend/src/modules/sales/sales.service.ts`~~ | ~~310~~ | ~~Remove this commented out code~~ | ~~`typescript:S125`~~ | ✅ RESUELTO
| ~~`apps/backend/src/modules/sales/sales.service.ts`~~ | ~~314~~ | ~~Remove this commented out code~~ | ~~`typescript:S125`~~ | ✅ RESUELTO
| `apps/backend/src/modules/users/users.service.ts` | 5 | Remove this commented out code | `typescript:S125` |
| `apps/backend/src/main.ts` | 59 | Prefer top-level await over async function call | `typescript:S7785` |

### Frontend

| Archivo | Línea | Mensaje | Regla |
|---------|-------|---------|-------|
| ~~`apps/frontend/src/features/cash-register/components/CashRegisterSummary.tsx`~~ | ~~79~~ | ~~Extract nested ternary into independent statement~~ | ~~`typescript:S3358`~~ | ✅ RESUELTO
| ~~`apps/frontend/src/features/cash-register/components/CashRegisterSummary.tsx`~~ | ~~91~~ | ~~Extract nested ternary into independent statement~~ | ~~`typescript:S3358`~~ | ✅ RESUELTO
| ~~`apps/frontend/src/features/cash-register/components/CashRegisterSummary.tsx`~~ | ~~103~~ | ~~Extract nested ternary into independent statement~~ | ~~`typescript:S3358`~~ | ✅ RESUELTO
| ~~`apps/frontend/src/features/cash-register/components/CashRegisterSummary.tsx`~~ | ~~115~~ | ~~Extract nested ternary into independent statement~~ | ~~`typescript:S3358`~~ | ✅ RESUELTO
| ~~`apps/frontend/src/features/cash-register/components/CashRegisterSummary.tsx`~~ | ~~127~~ | ~~Extract nested ternary into independent statement~~ | ~~`typescript:S3358`~~ | ✅ RESUELTO
| `apps/frontend/src/features/customers/pages/CustomersPage.tsx` | 27 | Remove commented out code | `typescript:S125` |
| ~~`apps/frontend/src/features/customers/components/CustomerForm.tsx`~~ | ~~2~~ | ~~Remove commented out code~~ | ~~`typescript:S125`~~ | ✅ RESUELTO
| ~~`apps/frontend/src/features/expenses/components/ExpenseForm.tsx`~~ | ~~75~~ | ~~Extract nested ternary into independent statement~~ | ~~`typescript:S3358`~~ | ✅ RESUELTO
| ~~`apps/frontend/src/features/income/components/IncomeForm.tsx`~~ | ~~72~~ | ~~Extract nested ternary into independent statement~~ | ~~`typescript:S3358`~~ | ✅ RESUELTO
| ~~`apps/frontend/src/features/products/components/ProductForm.tsx`~~ | ~~126~~ | ~~Extract nested ternary into independent statement~~ | ~~`typescript:S3358`~~ | ✅ RESUELTO
| ~~`apps/frontend/src/features/products/components/ProductForm.tsx`~~ | ~~128~~ | ~~Extract nested ternary into independent statement~~ | ~~`typescript:S3358`~~ | ✅ RESUELTO
| ~~`apps/frontend/src/features/purchases/components/PurchaseForm.tsx`~~ | ~~131~~ | ~~Extract nested ternary into independent statement~~ | ~~`typescript:S3358`~~ | ✅ RESUELTO
| ~~`apps/frontend/src/features/purchases/components/PurchaseForm.tsx`~~ | ~~175~~ | ~~Extract nested ternary into independent statement~~ | ~~`typescript:S3358`~~ | ✅ RESUELTO
| ~~`apps/frontend/src/features/purchases/components/PurchaseForm.tsx`~~ | ~~188~~ | ~~Extract nested ternary into independent statement~~ | ~~`typescript:S3358`~~ | ✅ RESUELTO
| ~~`apps/frontend/src/features/sales/components/SaleForm.tsx`~~ | ~~6~~ | ~~Remove this unused import~~ | ~~`typescript:S1128`~~ | ✅ RESUELTO
| ~~`apps/frontend/src/features/sales/components/SaleForm.tsx`~~ | ~~208~~ | ~~Extract nested ternary into independent statement~~ | ~~`typescript:S3358`~~ | ✅ RESUELTO
| ~~`apps/frontend/src/features/sales/components/SaleForm.tsx`~~ | ~~222~~ | ~~Extract nested ternary into independent statement~~ | ~~`typescript:S3358`~~ | ✅ RESUELTO
| ~~`apps/frontend/src/features/sales/components/SaleForm.tsx`~~ | ~~295~~ | ~~Extract nested ternary into independent statement~~ | ~~`typescript:S3358`~~ | ✅ RESUELTO
| ~~`apps/frontend/src/features/sales/components/SaleForm.tsx`~~ | ~~308~~ | ~~Extract nested ternary into independent statement~~ | ~~`typescript:S3358`~~ | ✅ RESUELTO
| ~~`apps/frontend/src/features/sales/components/SaleForm.tsx`~~ | ~~309~~ | ~~Extract nested ternary into independent statement~~ | ~~`typescript:S3358`~~ | ✅ RESUELTO
| ~~`apps/frontend/src/features/sales/components/SaleForm.tsx`~~ | ~~1145-1147~~ | ~~Extract nested ternary into independent statement~~ | ~~`typescript:S3358`~~ | ✅ RESUELTO
| ~~`apps/frontend/src/features/sales/components/SaleForm.tsx`~~ | ~~1174-1184~~ | ~~Extract nested ternary into independent statement~~ | ~~`typescript:S3358`~~ | ✅ RESUELTO
| `apps/frontend/src/features/sales/components/SaleForm.tsx` | 1004 | Avoid non-native interactive elements | `typescript:S6848` |
| ~~`apps/frontend/src/features/sales/components/SaleList.tsx`~~ | ~~1~~ | ~~Remove this unused import~~ | ~~`typescript:S1128`~~ | ✅ RESUELTO
| ~~`apps/frontend/src/features/sales/api/salesApi.ts`~~ | ~~6~~ | ~~Remove this unused import~~ | ~~`typescript:S1128`~~ | ✅ RESUELTO

*... y más issues MAJOR (ver SonarQube para lista completa)*

---

## 🟢 MINOR (322 issues)

### Tipos más comunes:

| Tipo | Cantidad Aprox. | Descripción |
|------|-----------------|-------------|
| `typescript:S1128` | ~50 | Unused imports |
| `typescript:S7773` | ~40 | Prefer `Number.parseFloat` over `parseFloat` |
| `typescript:S7766` | ~30 | Prefer `Math.max()` to simplify ternary expressions |
| `typescript:S4325` | ~25 | Unnecessary type assertion |
| `typescript:S1082` | ~20 | Elements with click handlers must have keyboard listeners |
| `typescript:S7772` | ~15 | Prefer `node:path` over `path` |
| `typescript:S6544` | ~15 | Make async function return await or remove async |
| `typescript:S1854` | ~10 | Remove useless assignment to variable |
| `typescript:S4624` | ~10 | Enforce template literal expressions to be string type |

### Ejemplos de archivos afectados:

- `apps/frontend/src/features/sales/components/SaleForm.tsx` - Múltiples issues
- `apps/frontend/src/features/purchases/components/PurchaseForm.tsx`
- `apps/frontend/src/features/products/components/ProductForm.tsx`
- `apps/frontend/src/features/cash-register/components/*.tsx`
- `apps/backend/src/modules/**/*.ts`

---

## 📊 Resumen por Severidad

| Severidad | Cantidad | Porcentaje |
|-----------|----------|------------|
| 🔴 BLOCKER | 1 | 0.16% |
| 🟠 CRITICAL | 28 | 4.49% |
| 🟡 MAJOR | 273 | 43.75% |
| 🟢 MINOR | 322 | 51.60% |
| **TOTAL** | **624** | **100%** |

---

## ⚠️ Acciones Prioritarias

1. **🔴 BLOCKER - Clave privada expuesta**: Remover `clave_privada.key` del repositorio y agregar a `.gitignore`
2. **🟠 CRITICAL - Complejidad cognitiva**: Refactorizar funciones con alta complejidad (especialmente `SaleForm.tsx` con 89)
3. **🟡 MAJOR - Código comentado**: Limpiar código comentado en múltiples archivos del backend
4. **🟢 MINOR - Imports no usados**: Limpiar imports no utilizados en el frontend
