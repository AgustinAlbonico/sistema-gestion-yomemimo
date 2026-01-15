# Plan de Implementación: Estrategia de Testing NexoPOS

## Contexto

Implementar la estrategia de testing definida en [TESTING-STRATEGY.md](./coding/TESTING-STRATEGY.md) para lograr detección de regresiones en menos de 5 minutos con el menor costo de mantenimiento.

### Estado Actual

| Componente | Tests Existentes | Infraestructura |
|------------|------------------|-----------------|
| Backend Unit | 3 archivos (~45 tests) | Jest configurado ✅ |
| Backend Integration | 0 | Setup + Docker ✅ |
| Backend API | 0 | Setup archivo ✅ |
| Frontend Unit | 0 | Vitest en package.json |
| Frontend E2E | 11 archivos | Playwright configurado ✅ |

---

## Propuesta de Fases

### Fase 1: Fundamentos (5-7 días de trabajo)

Objetivo: Establecer base sólida y primeros tests de integración.

#### Archivos a modificar/crear:

1. **`apps/backend/test/setup-integration.ts`** - Agregar entidades faltantes:
   - `Expense`, `ExpenseCategory`, `ExpensePayment`
   - `Income`, `IncomeCategory`, `IncomePayment`
   - `Purchase`, `PurchaseItem`, `PurchasePayment`
   - `Supplier`
   - `CashRegister`, `CashRegisterMovement`

2. **`apps/backend/test/factories/customer.factory.ts`** - Factory para clientes
3. **`apps/backend/test/factories/cash-register.factory.ts`** - Factory para cajas

4. **Unit tests prioritarios:**
   - `auth.service.spec.ts` - Login, logout, refresh token
   - `cash-register.service.spec.ts` - Apertura, cierre, validaciones

5. **Integration tests críticos:**
   - `test/integration/sales.integration.spec.ts` - Flujo completo de venta + stock

---

### Fase 2: Cobertura Core (2-3 semanas)

- **`test/integration/`**: cash-register, customer-accounts, inventory
- **`test/api/`**: auth, products, sales
- **Unit tests restantes**: customers, customer-accounts, inventory, etc.

---

### Fase 3: Frontend + CI/CD (2 semanas)

- **`apps/frontend/vitest.config.ts`** - Setup React Testing Library
- **`.github/workflows/ci.yml`** - Pipeline con gates

---

## Métricas de Éxito

| Métrica | Actual | Objetivo Fase 1 | Objetivo Final |
|---------|--------|-----------------|----------------|
| Coverage líneas backend | ~10%* | ≥ 40% | ≥ 70% |
| Coverage branches backend | ~5%* | ≥ 30% | ≥ 60% |
| Tests unitarios backend | 3 archivos | 8 archivos | 15+ archivos |
| Tests integración backend | 0 | 3 archivos | 8+ archivos |

---

## Comandos Útiles

```powershell
# Backend - Tests unitarios
cd apps/backend && npm run test:unit

# Backend - Tests de integración (requiere Docker)
docker-compose -f docker-compose.test.yml up -d
npm run test:integration

# Frontend - Tests E2E
cd apps/frontend && npm run test:e2e
```
