# Diagrama Entidad-Relación (ER)

Este documento describe las principales entidades y relaciones del sistema de gestión. El diagrama está representado en formato texto para facilitar la visualización rápida.

## Entidades principales

```mermaid
erDiagram
    CUSTOMER ||--o{ CUSTOMER_ACCOUNT : tiene
    CUSTOMER_ACCOUNT ||--o{ ACCOUNT_MOVEMENT : registra
    CUSTOMER ||--o{ SALE : realiza
    SALE ||--o{ SALE_ITEM : contiene
    PRODUCT ||--o{ SALE_ITEM : vendido_en
    PRODUCT ||--o{ STOCK_MOVEMENT : afecta
    SUPPLIER ||--o{ PURCHASE : provee
    PURCHASE ||--o{ PURCHASE_ITEM : contiene
    PRODUCT ||--o{ PURCHASE_ITEM : comprado_en
    CASH_REGISTER ||--o{ CASH_REGISTER_TOTAL : totaliza
    CASH_REGISTER ||--o{ CASH_REGISTER_MOVEMENT : registra
    EXPENSE ||--o{ CASH_REGISTER_MOVEMENT : paga
    USER ||--o{ SALE : autoriza
    USER ||--o{ PURCHASE : autoriza
```

## Descripción de entidades

- **CUSTOMER**: Clientes del sistema.
- **CUSTOMER_ACCOUNT**: Cuentas corrientes de clientes.
- **ACCOUNT_MOVEMENT**: Movimientos en cuentas corrientes.
- **SALE**: Ventas realizadas.
- **SALE_ITEM**: Ítems de cada venta.
- **PRODUCT**: Productos gestionados.
- **STOCK_MOVEMENT**: Movimientos de stock.
- **SUPPLIER**: Proveedores.
- **PURCHASE**: Compras realizadas.
- **PURCHASE_ITEM**: Ítems de cada compra.
- **CASH_REGISTER**: Cajas registradoras.
- **CASH_REGISTER_TOTAL**: Totales de caja.
- **CASH_REGISTER_MOVEMENT**: Movimientos de caja.
- **EXPENSE**: Gastos registrados.
- **USER**: Usuarios del sistema.

## Notas
- Las relaciones reflejan las migraciones y módulos presentes en el backend.
- Puedes visualizar este diagrama usando [Mermaid Live Editor](https://mermaid.live/).
