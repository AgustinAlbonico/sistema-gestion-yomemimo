# Product Requirements Document: Test E2E Punto de Venta

## Problem & Goal
El punto de venta ya está construido pero falta testearlo de punta a punta para validar que el sistema no se rompe y cumple correctamente con las metas de los casos de uso. El objetivo es asegurar estabilidad funcional y cobertura de los flujos críticos de negocio.

## Requirements
### Must-Have Features
- Ventas: flujo completo de venta, anulaciones, comprobantes y validaciones.
- Cuenta corriente: operaciones de clientes, saldos, movimientos y conciliación.
- Caja: apertura/cierre, arqueo, movimientos y control de saldos.
- Ingresos: registro y validación de ingresos operativos.
- Gastos: registro y validación de egresos operativos.
- Otros módulos: importantes pero secundarios frente a los críticos.

### Technical Requirements
- Stack: React (frontend), NestJS (backend), TypeORM, PostgreSQL.
- Desktop: Electron.
- Integraciones: AFIP (y otras existentes).
- Pirámide de tests: 60% unitarios, 30% integración, 10% E2E.

### Architecture & Design
- Monorepo con frontend, backend y desktop.
- Arquitectura monolítica en cada componente.

## Out of Scope
- Pruebas de performance por ahora (el sistema funciona bien).

## Additional Context
- Sin requisitos adicionales.

---
*Generated with Clavix Planning Mode*
*Generated: 2026-01-16T00:00:00Z*
