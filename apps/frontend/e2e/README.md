# Tests E2E con Playwright - NexoPOS

Este directorio contiene los tests end-to-end (E2E) del sistema de gestión POS usando Playwright.

## Estructura

```
e2e/
├── .auth/                 # Estado de autenticación guardado
│   └── user.json          # Sesión del usuario para tests (generado)
├── fixtures/
│   └── test-fixtures.ts   # Helpers, datos de prueba y fixtures
├── tests/
│   ├── auth.spec.ts       # Tests de autenticación
│   ├── cash-register.spec.ts  # Tests de caja registradora
│   ├── customers.spec.ts  # Tests de clientes
│   ├── dashboard.spec.ts  # Tests del dashboard
│   ├── expenses.spec.ts   # Tests de gastos
│   ├── navigation.spec.ts # Tests de navegación
│   ├── products.spec.ts   # Tests de productos
│   ├── purchases.spec.ts  # Tests de compras
│   ├── sales.spec.ts      # Tests de ventas (POS)
│   └── suppliers.spec.ts  # Tests de proveedores
└── auth.setup.ts          # Setup de autenticación
```

## Prerrequisitos

1. **Backend corriendo**: El servidor backend debe estar corriendo en `http://localhost:3000`
2. **Frontend corriendo**: El frontend debe estar corriendo en `http://localhost:5173`
3. **Usuario de prueba**: Debe existir un usuario `admin` con contraseña `ferchu123`

## Comandos

```bash
# Ejecutar todos los tests
npm run test:e2e

# Ejecutar tests con UI de Playwright (recomendado para desarrollo)
npm run test:e2e:ui

# Ejecutar tests en modo visible (headed)
npm run test:e2e:headed

# Ejecutar tests en modo debug
npm run test:e2e:debug

# Ver el último reporte de tests
npm run test:e2e:report
```

## Ejecutar Tests Específicos

```bash
# Solo tests de autenticación
npx playwright test auth

# Solo tests de ventas
npx playwright test sales

# Solo tests de productos
npx playwright test products

# Un archivo específico
npx playwright test tests/sales.spec.ts
```

## Configuración

La configuración de Playwright está en `playwright.config.ts`. Puedes modificar:

- **baseURL**: URL del frontend (default: `http://localhost:5173`)
- **timeout**: Tiempo máximo por test (default: 60 segundos)
- **retries**: Reintentos en caso de fallo (0 en local, 2 en CI)

### Variables de Entorno

```bash
# Cambiar URL base del frontend
PLAYWRIGHT_BASE_URL=http://localhost:3000 npm run test:e2e
```

## Casos de Uso Cubiertos

### Autenticación
- ✅ Login exitoso
- ✅ Login con credenciales incorrectas
- ✅ Validación de campos requeridos
- ✅ Mostrar/ocultar contraseña
- ✅ Logout
- ✅ Persistencia de sesión

### Caja Registradora
- ✅ Visualización de estado de caja
- ✅ Apertura de caja con monto inicial
- ✅ Movimientos manuales
- ✅ Cierre de caja
- ✅ Historial de cajas

### Productos
- ✅ Listado de productos
- ✅ Búsqueda de productos
- ✅ Creación de productos
- ✅ Validación de formulario
- ✅ Cálculo automático de precio
- ✅ Edición de productos

### Ventas (POS)
- ✅ Visualización de página de ventas
- ✅ Estadísticas de ventas
- ✅ Filtros por fecha
- ✅ Modal de nueva venta
- ✅ Búsqueda y agregado de productos
- ✅ Flujo completo de venta
- ✅ Opciones de cuenta corriente y fiscal
- ✅ Atajo de teclado F1

### Clientes
- ✅ Listado de clientes
- ✅ Creación de clientes
- ✅ Validación de formulario
- ✅ Edición de clientes
- ✅ Detalle de cliente

### Proveedores
- ✅ Listado y estadísticas
- ✅ Creación de proveedores

### Gastos
- ✅ Listado y estadísticas
- ✅ Creación de gastos
- ✅ Filtros por período

### Compras
- ✅ Listado y estadísticas
- ✅ Creación de compras
- ✅ Detalle de compra

### Dashboard y Navegación
- ✅ Visualización del dashboard
- ✅ Navegación por sidebar
- ✅ Rutas protegidas
- ✅ Títulos de páginas

## Buenas Prácticas

1. **Independencia**: Cada test debe ser independiente y no depender del estado de otros tests.

2. **Cleanup**: Los tests no deben dejar datos residuales. Usa nombres únicos con `generateUniqueId()`.

3. **Selectores robustos**: Usa roles ARIA y labels antes que selectores de clase.

4. **Esperas explícitas**: Usa `waitForLoading()` y `expect().toBeVisible()` en lugar de `waitForTimeout()`.

5. **Skip condicional**: Si un test no puede ejecutarse (ej: caja cerrada), usa `test.skip()`.

## Debugging

### Ver Traza de Fallos
Los tests que fallan generan una traza que puedes ver con:
```bash
npx playwright show-trace test-results/[test-name]/trace.zip
```

### Modo UI
El modo UI es ideal para debugging:
```bash
npm run test:e2e:ui
```

### Screenshots
Los screenshots de fallos se guardan en `test-results/`.

## CI/CD

Para ejecutar en CI, asegúrate de:
1. Tener las dependencias del navegador instaladas
2. Configurar las variables de entorno correctamente
3. Usar `CI=true` para activar configuración de CI

```yaml
# Ejemplo para GitHub Actions
- name: Install Playwright
  run: npx playwright install --with-deps chromium
  
- name: Run E2E tests
  run: npm run test:e2e
  env:
    CI: true
    PLAYWRIGHT_BASE_URL: http://localhost:5173
```

