# Implementation Plan

**Project**: sales-90-coverage
**Generated**: 2026-01-20T12:00:00Z

## Technical Context & Standards
*Detected Stack & Patterns*
- **Architecture**: NestJS Modulario con TypeORM
- **Framework**: NestJS 10, TypeORM 0.3, PostgreSQL
- **Testing**: Jest + ts-jest con 3 proyectos (unit, integration, api)
- **Conventions**: "spec.ts" junto al código para unit tests, "/test" para integration/api
- **Factories**: Datos de prueba en `/test/factories/`
- **Coverage Target**: 90% (branches, functions, lines, statements)
- **Setup existente**: `test/setup.ts`, `test/setup-integration.ts`, `test/setup-api.ts`

---

## Phase 1: Preparación y Helpers

- [x] **Crear factory mejorada para ventas** (ref: setup)
  Task ID: phase-1-setup-01
  > **Implementation**: Crear/Editar `apps/backend/test/factories/sale.factory.ts`.
  > **Details**: Ampliar factory existente para soportar todos los campos de `CreateSaleDto` incluyendo `taxes` array, `discountPercent`, `installments`, `generateInvoice`. Agregar helpers para crear pagos múltiples y estados de venta (completed, pending, cancelled).

- [x] **Crear factory para invoice** (ref: setup)
  Task ID: phase-1-setup-02
  > **Implementation**: Crear `apps/backend/test/factories/invoice.factory.ts`.
  > **Details**: Factory para crear entidades `Invoice` con todos los campos requeridos (CAE, QR data, emitter/receiver data, IVA breakdown). Exportar desde `index.ts`.

- [x] **Crear helpers comunes de testing** (ref: setup)
  Task ID: phase-1-setup-03
  > **Implementation**: Crear `apps/backend/test/helpers/sales.test-helpers.ts`.
  > **Details**: Exportar funciones: `mockQueryRunner()`, `mockEntityManager()`, `createMockSaleWithRelations()`, `assertSaleCalculations()`, `verifyAuditLogCalled()`.

---

## Phase 2: Unit Tests - SalesService (Métodos Faltantes)

- [x] **Tests para canCreateSale** (ref: sales.service.ts:243)
  Task ID: phase-2-sales-01
  > **Implementation**: Agregar tests en `apps/backend/src/modules/sales/sales.service.spec.ts`.
  > **Details**: Testar: caja abierta (true), caja cerrada (false con reason), error de servicio.

- [x] **Tests para findAll con filtros** (ref: sales.service.ts:467)
  Task ID: phase-2-sales-02
  > **Implementation**: Agregar tests en `apps/backend/src/modules/sales/sales.service.spec.ts`.
  > **Details**: Testar: búsqueda por saleNumber, customerName, filtros de fecha (startDate, endDate, rango), filtro por status, customerId, productId, fiscalPending, invoiceStatus, paginación, ordenamiento (sortBy desc/asc).

- [x] **Tests para findOne** (ref: sales.service.ts:512)
  Task ID: phase-2-sales-03
  > **Implementation**: Agregar tests en `apps/backend/src/modules/sales/sales.service.spec.ts`.
  > **Details**: Testar: venta encontrada con todas las relaciones, venta no encontrada (NotFoundException).

- [x] **Tests para update** (ref: sales.service.ts:528)
  Task ID: phase-2-sales-04
  > **Implementation**: Agregar tests en `apps/backend/src/modules/sales/sales.service.spec.ts`.
  > **Details**: Testar: actualización exitosa de campos permitidos, bloqueo si status=CANCELLED, bloqueo si inventoryUpdated=true, recálculo de total con tax/discount/surcharge, log de auditoría.

- [x] **Tests para cancel** (ref: sales.service.ts:600)
  Task ID: phase-2-sales-05
  > **Implementation**: Agregar tests en `apps/backend/src/modules/sales/sales.service.spec.ts`.
  > **Details**: Testar: cancelación exitosa, error si ya cancelada, reversión de inventario, reversión financiera (cuenta corriente con createAdjustment), devolución en caja (registerRefund) para ventas de contado, log de auditoría.

- [x] **Tests para remove (soft delete)** (ref: sales.service.ts:686)
  Task ID: phase-2-sales-06
  > **Implementation**: Agregar tests en `apps/backend/src/modules/sales/sales.service.spec.ts`.
  > **Details**: Testar: eliminación exitosa, error si inventoryUpdated=true, log de auditoría.

- [x] **Tests para markAsPaid** (ref: sales.service.ts:723)
  Task ID: phase-2-sales-07
  > **Implementation**: Agregar tests en `apps/backend/src/modules/sales/sales.service.spec.ts`.
  > **Details**: Testar: marcar PENDING como COMPLETED, creación de pagos, actualización de inventario si no estaba actualizado, error si status=CANCELLED, error si status=COMPLETED, validación de caja abierta, registro de ingresos en caja, log de auditoría.

- [x] **Tests para getTodaySales** (ref: sales.service.ts:827)
  Task ID: phase-2-sales-08
  > **Implementation**: Agregar tests en `apps/backend/src/modules/sales/sales.service.spec.ts`.
  > **Details**: Testar: retorno de ventas del día actual, filtros de fecha correctos (startOfDay, endOfDay), relaciones cargadas.

- [x] **Tests para getStats** (ref: sales.service.ts:849)
  Task ID: phase-2-sales-09
  > **Implementation**: Agregar tests en `apps/backend/src/modules/sales/sales.service.spec.ts`.
  > **Details**: Testar: cálculo de totalSales, totalAmount (excluyendo cancelled), totalCompleted, totalPending, salesByStatus (conteo por cada estado), salesByPaymentMethod (agrupación por método), filtros de fecha.

- [ ] **Tests para métodos auxiliares privados** (ref: sales.service.ts:69-236)
  Task ID: phase-2-sales-10
  > **Implementation**: Agregar tests en `apps/backend/src/modules/sales/sales.service.spec.ts`.
  > **Details**: Testar coverage de: `validateProductsStock`, `calculateSaleTotals`, `determineSaleStatus`, `validatePayments`, `validateNoDuplicateTaxes` (FIX 7.8), `applyInvoiceStatusFilter`, `applyDateFilters`, `applySearchFilters`.

---

## Phase 3: Unit Tests - InvoiceService

- [x] **Crear spec de InvoiceService** (ref: new file)
  Task ID: phase-3-invoice-01
  > **Implementation**: Crear `apps/backend/src/modules/sales/services/invoice.service.spec.ts`.
  > **Details**: Setup con mocks de repositorios (Sale, Invoice, SaleItem), AfipService, QrGeneratorService, PdfGeneratorService, ConfigService. Mock de queryRunner para transacciones.

- [x] **Tests para generateInvoice** (ref: invoice.service.ts:41)
  Task ID: phase-3-invoice-02
  > **Implementation**: Agregar tests en `invoice.service.spec.ts`.
  > **Details**: Testar: generación exitosa con autorización AFIP, error si venta no encontrada, error si venta ya tiene factura, error si venta cancelada, error si AFIP no configurado, determinación correcta de InvoiceType según condición IVA, validación de CUIT para Factura A, manejo de error de autorización (fiscalPending=true, fiscalError seteado).

- [x] **Tests para retryAuthorization** (ref: invoice.service.ts:240)
  Task ID: phase-3-invoice-03
  > **Implementation**: Agregar tests en `invoice.service.spec.ts`.
  > **Details**: Testar: reintento exitoso de factura rechazada, actualización de datos del cliente desde BD, recálculo de netAmount e IVA, error si ya autorizada, limpieza de fiscalError en éxito.

- [x] **Tests para findAll de facturas** (ref: invoice.service.ts:305)
  Task ID: phase-3-invoice-04
  > **Implementation**: Agregar tests en `invoice.service.spec.ts`.
  > **Details**: Testar: filtros por status, from, to; paginación (page, limit, totalPages); ordenamiento por createdAt DESC.

- [x] **Tests para findOne y findBySaleId** (ref: invoice.service.ts:196,212)
  Task ID: phase-3-invoice-05
  > **Implementation**: Agregar tests en `invoice.service.spec.ts`.
  > **Details**: Testar: encontrar factura por ID, NotFoundException si no existe, encontrar por saleId (null si no tiene).

- [x] **Tests para generatePdf** (ref: invoice.service.ts:221)
  Task ID: phase-3-invoice-06
  > **Implementation**: Agregar tests en `invoice.service.spec.ts`.
  > **Details**: Testar: generación exitosa con CAE, error si status != AUTHORIZED, llamado a PdfGeneratorService con items correctos.

- [x] **Tests para generateReceiptHtml** (ref: invoice.service.ts:552)
  Task ID: phase-3-invoice-07
  > **Implementation**: Agregar tests en `invoice.service.spec.ts`.
  > **Details**: Testar: HTML generado correctamente, formato de fecha locale, datos del cliente (con/sin documento), items renderizados, pagos renderizados, descuento y taxes mostrados.

- [x] **Tests para generateSaleNotePdf** (ref: invoice.service.ts:856)
  Task ID: phase-3-invoice-08
  > **Implementation**: Agregar tests en `invoice.service.spec.ts`.
  > **Details**: Testar: llamada a PdfGeneratorService con datos correctos, inclusión de configuración fiscal, NotFoundException si venta no existe.

- [x] **Tests para métodos auxiliares privados** (ref: invoice.service.ts)
  Task ID: phase-3-invoice-09
  > **Implementation**: Agregar tests en `invoice.service.spec.ts`.
  > **Details**: Testar coverage de: `buildIvaArray` (alícuotas 21%, 10.5%, 27%), `getDocumentType`, `normalizeIvaCondition`, `calculateNetAmount`, `calculateIva21`, `getIvaConditionCode`, `buildReceiptCustomerInfoHtml`.

---

## Phase 4: Unit Tests - AfipService

- [ ] **Crear spec de AfipService** (ref: new file)
  Task ID: phase-4-afip-01
  > **Implementation**: Crear `apps/backend/src/modules/sales/services/afip.service.spec.ts`.
  > **Details**: Setup con mocks de FiscalConfigurationService, axios (para llamadas SOAP), crypto/forge. Preparar mock responses para WSAA y WSFE.

- [ ] **Tests para isConfigured y getConfiguration** (ref: afip.service.ts:111,119)
  Task ID: phase-4-afip-02
  > **Implementation**: Agregar tests en `afip.service.spec.ts`.
  > **Details**: Testar: retorno true cuando configurado, false cuando falta CUIT, mapeo correcto de configuración desde FiscalConfigurationService.

- [ ] **Tests para determineInvoiceType** (ref: afip.service.ts:145)
  Task ID: phase-4-afip-03
  > **Implementation**: Agregar tests en `afip.service.spec.ts`.
  > **Details**: Testar: monotributo -> FACTURA_C, RI + RI -> FACTURA_A, RI + otros -> FACTURA_B, default -> FACTURA_C.

- [ ] **Tests para getAuthToken** (ref: afip.service.ts:222)
  Task ID: phase-4-afip-04
  > **Implementation**: Agregar tests en `afip.service.spec.ts`.
  > **Details**: Testar: uso de caché en memoria (tokens separados por ambiente), carga desde BD si caché expiró, solicitud de nuevo token si no hay válido, renovación proactiva si expira en <30min, almacenamiento en BD y caché después de obtener nuevo token, manejo de token fantasma (error WSAA).

- [ ] **Tests para authorizeInvoice** (ref: afip.service.ts:494)
  Task ID: phase-4-afip-05
  > **Implementation**: Agregar tests en `afip.service.spec.ts`.
  > **Details**: Testar: llamada exitosa a WSFE, obtención de CAE, parseo de respuesta, uso de mutex (serialización de peticiones concurrentes), simulación cuando AFIP no configurado, manejo de errores SOAP, construcción correcta del request con todos los campos.

- [ ] **Tests para getLastInvoiceNumber** (ref: afip.service.ts:659)
  Task ID: phase-4-afip-06
  > **Implementation**: Agregar tests en `afip.service.spec.ts`.
  > **Details**: Testar: llamada FECompUltimoAutorizada, parseo de respuesta, retorno de número simulado si no configurado, manejo de errores.

- [ ] **Tests para testConnection** (ref: afip.service.ts:710)
  Task ID: phase-4-afip-07
  > **Implementation**: Agregar tests en `afip.service.spec.ts`.
  > **Details**: Testar: success=true cuando getAuthToken funciona, success=false con lista de missingFields, success=false con error de conexión.

- [ ] **Tests para invalidateAuthToken** (ref: afip.service.ts:447)
  Task ID: phase-4-afip-08
  > **Implementation**: Agregar tests en `afip.service.spec.ts`.
  > **Details**: Testar: invalidación de caché del ambiente correcto, llamado a clearWsaaToken, logging.

- [ ] **Tests para formatDateForAfip y parseAfipDate** (ref: afip.service.ts:735,739)
  Task ID: phase-4-afip-09
  > **Implementation**: Agregar tests en `afip.service.spec.ts`.
  > **Details**: Testar: formato YYYYMMDD sin guiones, parseo de string a Date, manejo de zonas horarias.

- [ ] **Tests para getPhantomTokenWaitTime** (ref: afip.service.ts:186)
  Task ID: phase-4-afip-10
  > **Implementation**: Agregar tests en `afip.service.spec.ts`.
  > **Details**: Testar: cálculo de waitTime cuando hay timestamp de error fantasma, limpieza de timestamps expirados, retorno de blocked=false si no hay bloqueo.

---

## Phase 5: Unit Tests - PdfGeneratorService

- [ ] **Completar tests existentes de PdfGeneratorService** (ref: pdf-generator.service.spec.ts)
  Task ID: phase-5-pdf-01
  > **Implementation**: Editar `apps/backend/src/modules/sales/services/pdf-generator.service.spec.ts`.
  > **Details**: El archivo ya existe pero puede estar incompleto. Revisar y agregar tests faltantes para: `prepareSaleNoteRenderData`, `isValidDocumentNumber`, `formatDocumentNumber`, `formatDate`, todos los formaters (formatNumber, formatCurrency, formatCuit, formatIvaCondition).

---

## Phase 6: Unit Tests - QrGeneratorService

- [ ] **Crear spec de QrGeneratorService** (ref: new file)
  Task ID: phase-6-qr-01
  > **Implementation**: Crear `apps/backend/src/modules/sales/services/qr-generator.service.spec.ts`.
  > **Details**: Setup con mocks de qrcode library. Testar: `generateQrData` (construcción del string QR según formato AFIP), `generateQrImage` (llamada a qrcode.toDataURL).

---

## Phase 7: Unit Tests - Controllers

- [ ] **Crear spec de SalesController** (ref: new file)
  Task ID: phase-7-controller-01
  > **Implementation**: Crear `apps/backend/src/modules/sales/sales.controller.spec.ts`.
  > **Details**: Setup con mock de SalesService. Testear todos los endpoints: POST / (create), GET / (findAll), GET /stats, GET /can-create, GET /today, GET /:id (findOne), PATCH /:id (update), PATCH /:id/cancel, PATCH /:id/pay, DELETE /:id. Verificar ParseUUIDPipe en params, JwtAuthGuard aplicado.

- [ ] **Crear spec de InvoiceController** (ref: invoice.controller.ts)
  Task ID: phase-7-controller-02
  > **Implementation**: Crear `apps/backend/src/modules/sales/invoice.controller.spec.ts`.
  > **Details**: Setup con mock de InvoiceService. Testear todos los endpoints que existan en InvoiceController (verificar archivo primero).

---

## Phase 8: Integration Tests - Sales Flows

- [ ] **Tests de integración para creación de ventas** (ref: integration)
  Task ID: phase-8-integration-01
  > **Implementation**: Crear `apps/backend/test/integration/sales/create-sale.spec.ts`.
  > **Details**: Usar BD real (setup-integration.ts). Testar flujo completo: crear venta con productos reales, verificar descontó stock, verificar creó pagos en caja, verificar generó movimiento de inventario, verificar log de auditoría. Probar con múltiples items, con impuestos, con descuentos.

- [ ] **Tests de integración para ventas a cuenta corriente** (ref: integration)
  Task ID: phase-8-integration-02
  > **Implementation**: Crear `apps/backend/test/integration/sales/account-sale.spec.ts`.
  > **Details**: Testar: venta CC crea cargo en CustomerAccount, status=PENDING, no registra ingresos en caja, markAsPaid completa la venta, actualiza inventario al pagar.

- [ ] **Tests de integración para cancelación de ventas** (ref: integration)
  Task ID: phase-8-integration-03
  > **Implementation**: Crear `apps/backend/test/integration/sales/cancel-sale.spec.ts`.
  > **Details**: Testar: cancelación revierte inventario, cancelación de CC crea ajuste negativo, cancelación de contado registra devolución en caja, verificación de estados.

- [ ] **Tests de integración para facturación** (ref: integration)
  Task ID: phase-8-integration-04
  > **Implementation**: Crear `apps/backend/test/integration/sales/invoicing.spec.ts`.
  > **Details**: Mock de servicios AFIP externos. Testar: generateInvoice desde createSale, retry de autorización fallida, generación de PDF, findBySaleId.

---

## Phase 9: API Tests - Endpoints E2E

- [ ] **Tests API para endpoints de ventas** (ref: api)
  Task ID: phase-9-api-01
  > **Implementation**: Crear `apps/backend/test/api/sales.spec.ts`.
  > **Details**: Usar supertest con setup-api.ts. Testear todos los endpoints con autenticación: POST /sales, GET /sales, GET /sales/:id, PATCH /sales/:id, PATCH /sales/:id/cancel, DELETE /sales/:id. Verificar status codes, validación de DTOs, manejo de errores.

- [ ] **Tests API para endpoints de facturación** (ref: api)
  Task ID: phase-9-api-02
  > **Implementation**: Crear `apps/backend/test/api/invoices.spec.ts`.
  > **Details**: Testear: GET /invoices, GET /invoices/:id, POST /invoices/:id/pdf, POST /invoices/:id/retry. Verificar permisos, validaciones.

- [ ] **Tests API para filtros y búsqueda** (ref: api)
  Task ID: phase-9-api-03
  > **Implementation**: Agregar tests en `apps/backend/test/api/sales.spec.ts`.
  > **Details**: Testear todos los filtros de findAll: search, startDate, endDate, status, customerId, productId, invoiceStatus, sortBy, order, page, limit.

---

## Phase 10: Smoke Tests - Flujos Críticos

- [ ] **Crear smoke test para ventas** (ref: smoke)
  Task ID: phase-10-smoke-01
  > **Implementation**: Crear `apps/backend/test/smoke/sales.smoke.spec.ts`.
  > **Details**: Smoke test rápido que verifica: el módulo de ventas carga correctamente, los servicios se pueden inyectar, el CRUD básico funciona sin romperse. Debe tomar <5 segundos.

- [ ] **Crear smoke test para facturación** (ref: smoke)
  Task ID: phase-10-smoke-02
  > **Implementation**: Crear `apps/backend/test/smoke/invoicing.smoke.spec.ts`.
  > **Details**: Verificar: servicios AFIP cargan (aunque fallen por certificados), generación de QR funciona, templates de PDF cargan.

---

*Generated by Clavix /clavix:plan*
