# Documentación del Seed de Base de Datos

Este documento describe todos los datos que se crean al ejecutar el script de seed (`apps/backend/src/scripts/seed.ts`). El seed está orientado a un negocio de **belleza, marroquinería y accesorios**.

## 📋 Tabla de Contenidos

1. [Usuario Administrador](#usuario-administrador)
2. [Configuración del Sistema](#configuración-del-sistema)
3. [Categorías de Productos](#categorías-de-productos)
4. [Productos](#productos)
5. [Categorías de Clientes](#categorías-de-clientes)
6. [Clientes](#clientes)
7. [Categorías de Gastos](#categorías-de-gastos)
8. [Gastos](#gastos)
9. [Compras](#compras)
10. [Proveedores](#proveedores)

---

## Usuario Administrador

Se crea un usuario administrador con las siguientes credenciales:

- **Username:** `admin`
- **Email:** `admin@admin.com`
- **Password:** `Admin123`
- **Nombre:** Admin Sistema
- **Estado:** Activo

> ⚠️ **Nota:** Si el usuario ya existe, se reutiliza el existente.

---

## Configuración del Sistema

Se crea una configuración inicial del sistema con los siguientes valores:

- **Margen de ganancia por defecto:** 30%
- **Alerta de stock mínimo:** 5 unidades

> ⚠️ **Nota:** Si la configuración ya existe, no se sobrescribe.

---

## Categorías de Productos

Se crean **11 categorías** de productos:

### Belleza

1. **Maquillaje** (`#ec4899`)
   - Bases, labiales, sombras, rubores

2. **Cuidado Facial** (`#f59e0b`)
   - Cremas, serums, limpiadores faciales

3. **Cuidado Capilar** (`#8b5cf6`)
   - Shampoos, acondicionadores, tratamientos

4. **Perfumería** (`#06b6d4`)
   - Perfumes, colonias, desodorantes

5. **Uñas** (`#ef4444`)
   - Esmaltes, removedores, accesorios de uñas

### Marroquinería

6. **Carteras** (`#6366f1`)
   - Carteras, billeteras, monederos

7. **Bolsos** (`#14b8a6`)
   - Bolsos, mochilas, carteras de mano

8. **Cinturones** (`#a855f7`)
   - Cinturones de cuero y sintéticos

9. **Accesorios** (`#f97316`)
   - Llaveros, tarjeteros, organizadores

### Otros

10. **Joyería** (`#eab308`)
    - Aros, collares, pulseras, anillos

11. **Relojes** (`#3b82f6`)
    - Relojes de pulsera y accesorios

---

## Productos

Se crean **50 productos** distribuidos en las diferentes categorías. Todos los productos tienen:
- **Margen de ganancia:** 30%
- **Precio:** Calculado automáticamente (costo × 1.30)
- **Estado:** Activo
- **SKU:** Código único por categoría

### Maquillaje (8 productos)

| SKU | Nombre | Costo | Stock | Precio |
|-----|--------|-------|-------|--------|
| MAQ-001 | Base Líquida Natural Beige | $4,500 | 15 | $5,850 |
| MAQ-002 | Labial Mate Rojo Intenso | $3,200 | 25 | $4,160 |
| MAQ-003 | Paleta de Sombras 12 Colores | $6,800 | 10 | $8,840 |
| MAQ-004 | Rubor en Polvo Rosa | $2,800 | 20 | $3,640 |
| MAQ-005 | Máscara de Pestañas Waterproof | $3,500 | 18 | $4,550 |
| MAQ-006 | Delineador Líquido Negro | $2,400 | 22 | $3,120 |
| MAQ-007 | Corrector Alta Cobertura | $2,900 | 16 | $3,770 |
| MAQ-008 | Polvo Translúcido Compacto | $3,100 | 14 | $4,030 |

### Cuidado Facial (6 productos)

| SKU | Nombre | Costo | Stock | Precio |
|-----|--------|-------|-------|--------|
| CF-001 | Crema Hidratante Día SPF 30 | $5,200 | 12 | $6,760 |
| CF-002 | Serum Vitamina C | $7,500 | 8 | $9,750 |
| CF-003 | Limpiador Facial Espumoso | $3,800 | 20 | $4,940 |
| CF-004 | Mascarilla Facial Arcilla | $4,200 | 15 | $5,460 |
| CF-005 | Tónico Facial Equilibrante | $3,600 | 18 | $4,680 |
| CF-006 | Crema Anti-edad Noche | $6,800 | 10 | $8,840 |

### Cuidado Capilar (5 productos)

| SKU | Nombre | Costo | Stock | Precio |
|-----|--------|-------|-------|--------|
| CC-001 | Shampoo Reparador 500ml | $3,200 | 25 | $4,160 |
| CC-002 | Acondicionador Hidratante 500ml | $3,200 | 25 | $4,160 |
| CC-003 | Mascarilla Capilar Nutritiva | $4,500 | 15 | $5,850 |
| CC-004 | Aceite Capilar Argan | $4,800 | 12 | $6,240 |
| CC-005 | Spray Termoprotector | $2,800 | 20 | $3,640 |

### Perfumería (4 productos)

| SKU | Nombre | Costo | Stock | Precio |
|-----|--------|-------|-------|--------|
| PERF-001 | Perfume Mujer 50ml | $12,500 | 8 | $16,250 |
| PERF-002 | Perfume Hombre 50ml | $12,500 | 8 | $16,250 |
| PERF-003 | Colonia Unisex 100ml | $6,800 | 15 | $8,840 |
| PERF-004 | Desodorante Roll-on | $1,800 | 30 | $2,340 |

### Uñas (5 productos)

| SKU | Nombre | Costo | Stock | Precio |
|-----|--------|-------|-------|--------|
| UÑ-001 | Esmalte Rojo Clásico | $1,200 | 40 | $1,560 |
| UÑ-002 | Esmalte Rosa Nude | $1,200 | 35 | $1,560 |
| UÑ-003 | Esmalte Azul Marino | $1,200 | 30 | $1,560 |
| UÑ-004 | Top Coat Brillante | $1,500 | 25 | $1,950 |
| UÑ-005 | Removedor de Esmalte 200ml | $1,800 | 20 | $2,340 |

### Carteras (5 productos)

| SKU | Nombre | Costo | Stock | Precio |
|-----|--------|-------|-------|--------|
| CAR-001 | Cartera Cuero Negro | $8,500 | 10 | $11,050 |
| CAR-002 | Billetera Cuero Marrón | $5,200 | 15 | $6,760 |
| CAR-003 | Monedero Cuero Negro | $3,200 | 20 | $4,160 |
| CAR-004 | Cartera Sintética Rosa | $4,500 | 12 | $5,850 |
| CAR-005 | Tarjetero Cuero | $2,800 | 18 | $3,640 |

### Bolsos (5 productos)

| SKU | Nombre | Costo | Stock | Precio |
|-----|--------|-------|-------|--------|
| BOL-001 | Bolso Tote Cuero Negro | $18,500 | 5 | $24,050 |
| BOL-002 | Bolso Bandolera Cuero | $15,200 | 6 | $19,760 |
| BOL-003 | Mochila Cuero Marrón | $22,000 | 4 | $28,600 |
| BOL-004 | Cartera de Mano Sintética | $6,800 | 10 | $8,840 |
| BOL-005 | Bolso Crossbody Pequeño | $9,800 | 8 | $12,740 |

### Cinturones (3 productos)

| SKU | Nombre | Costo | Stock | Precio |
|-----|--------|-------|-------|--------|
| CIN-001 | Cinturón Cuero Negro 3cm | $4,500 | 15 | $5,850 |
| CIN-002 | Cinturón Cuero Marrón 4cm | $5,200 | 12 | $6,760 |
| CIN-003 | Cinturón Sintético Negro | $2,800 | 20 | $3,640 |

### Accesorios (3 productos)

| SKU | Nombre | Costo | Stock | Precio |
|-----|--------|-------|-------|--------|
| ACC-001 | Llavero Cuero con Logo | $1,800 | 30 | $2,340 |
| ACC-002 | Organizador de Tarjetas | $2,200 | 25 | $2,860 |
| ACC-003 | Porta Documentos Cuero | $3,800 | 15 | $4,940 |

### Joyería (4 productos)

| SKU | Nombre | Costo | Stock | Precio |
|-----|--------|-------|-------|--------|
| JOY-001 | Aros Aro Dorado | $3,200 | 20 | $4,160 |
| JOY-002 | Collar Plata 45cm | $5,800 | 12 | $7,540 |
| JOY-003 | Pulsera Ajustable Plata | $4,200 | 15 | $5,460 |
| JOY-004 | Anillo Plata Talla 16 | $3,800 | 10 | $4,940 |

### Relojes (2 productos)

| SKU | Nombre | Costo | Stock | Precio |
|-----|--------|-------|-------|--------|
| REL-001 | Reloj Analógico Cuero | $12,500 | 8 | $16,250 |
| REL-002 | Reloj Digital Deportivo | $9,800 | 10 | $12,740 |

---

## Categorías de Clientes

Se crean **4 categorías** de clientes:

1. **VIP** (`#fbbf24`)
   - Clientes frecuentes con descuentos especiales

2. **Mayorista** (`#3b82f6`)
   - Clientes que compran en grandes cantidades

3. **Minorista** (`#10b981`)
   - Clientes ocasionales

4. **Online** (`#8b5cf6`)
   - Clientes que compran por internet

---

## Clientes

Se crean **10 clientes** con datos completos:

| Nombre | Apellido | Tipo Doc | Número | Email | Teléfono | Categoría |
|--------|----------|----------|--------|-------|----------|-----------|
| María | González | DNI | 12345678 | maria.gonzalez@email.com | 11-2345-6789 | VIP |
| Juan | Pérez | DNI | 23456789 | juan.perez@email.com | 11-3456-7890 | Mayorista |
| Ana | Martínez | DNI | 34567890 | ana.martinez@email.com | 11-4567-8901 | Minorista |
| Carlos | Rodríguez | CUIT | 20-12345678-9 | carlos.rodriguez@email.com | 11-5678-9012 | Mayorista |
| Laura | Fernández | DNI | 45678901 | laura.fernandez@email.com | 11-6789-0123 | VIP |
| Diego | López | DNI | 56789012 | diego.lopez@email.com | 11-7890-1234 | Online |
| Sofía | García | DNI | 67890123 | sofia.garcia@email.com | 11-8901-2345 | Minorista |
| Martín | Sánchez | DNI | 78901234 | martin.sanchez@email.com | 11-9012-3456 | Mayorista |
| Valentina | Torres | DNI | 89012345 | valentina.torres@email.com | 11-0123-4567 | VIP |
| Lucas | Ramírez | DNI | 90123456 | lucas.ramirez@email.com | 11-1234-5678 | Online |

Todos los clientes tienen:
- Dirección en Buenos Aires, CABA
- Teléfono fijo y móvil
- Estado: Activo

---

## Categorías de Gastos

Se crean **8 categorías** de gastos:

1. **Alquiler** (Recurrente)
   - Alquiler del local comercial

2. **Servicios** (Recurrente)
   - Luz, gas, agua, internet

3. **Sueldos** (Recurrente)
   - Pago de sueldos y salarios

4. **Publicidad** (No recurrente)
   - Marketing y publicidad

5. **Mantenimiento** (No recurrente)
   - Reparaciones y mantenimiento

6. **Impuestos** (Recurrente)
   - Impuestos y tasas

7. **Seguros** (Recurrente)
   - Seguros del negocio

8. **Otros** (No recurrente)
   - Otros gastos varios

---

## Gastos

Se crean **20 gastos** distribuidos en diferentes fechas:

### Alquiler (4 gastos)

| Descripción | Monto | Fecha | Estado | Método Pago | Recibo |
|-------------|-------|-------|--------|-------------|--------|
| Alquiler Local - Noviembre 2024 | $85,000 | Hace 5 días | Pagado | Transferencia | ALQ-2024-11 |
| Alquiler Local - Octubre 2024 | $85,000 | Hace 35 días | Pagado | Transferencia | ALQ-2024-10 |
| Alquiler Local - Septiembre 2024 | $85,000 | Hace 65 días | Pagado | Transferencia | ALQ-2024-09 |
| Alquiler Local - Diciembre 2024 | $85,000 | En 2 días | Pendiente | - | - |

### Servicios (6 gastos)

| Descripción | Monto | Fecha | Estado | Método Pago | Recibo |
|-------------|-------|-------|--------|-------------|--------|
| Luz - Noviembre 2024 | $12,500 | Hace 3 días | Pagado | Tarjeta Débito | LUZ-2024-11 |
| Gas - Noviembre 2024 | $8,500 | Hace 2 días | Pagado | Tarjeta Débito | GAS-2024-11 |
| Internet - Noviembre 2024 | $6,500 | Hace 1 día | Pagado | Tarjeta Débito | INT-2024-11 |
| Luz - Octubre 2024 | $11,800 | Hace 33 días | Pagado | Tarjeta Débito | LUZ-2024-10 |
| Gas - Octubre 2024 | $7,800 | Hace 32 días | Pagado | Tarjeta Débito | GAS-2024-10 |
| Luz - Diciembre 2024 | $13,000 | En 5 días | Pendiente | - | - |

### Sueldos (3 gastos)

| Descripción | Monto | Fecha | Estado | Método Pago | Recibo |
|-------------|-------|-------|--------|-------------|--------|
| Sueldo Empleado 1 - Noviembre 2024 | $120,000 | Hace 7 días | Pagado | Transferencia | SUE-2024-11-01 |
| Sueldo Empleado 2 - Noviembre 2024 | $110,000 | Hace 7 días | Pagado | Transferencia | SUE-2024-11-02 |
| Sueldo Empleado 1 - Octubre 2024 | $120,000 | Hace 37 días | Pagado | Transferencia | SUE-2024-10-01 |

### Publicidad (2 gastos)

| Descripción | Monto | Fecha | Estado | Método Pago | Recibo |
|-------------|-------|-------|--------|-------------|--------|
| Publicidad Redes Sociales - Noviembre | $15,000 | Hace 10 días | Pagado | Tarjeta Crédito | PUB-2024-11-01 |
| Flyers y Folletos | $8,500 | Hace 20 días | Pagado | Efectivo | PUB-2024-11-02 |

### Mantenimiento (2 gastos)

| Descripción | Monto | Fecha | Estado | Método Pago | Recibo |
|-------------|-------|-------|--------|-------------|--------|
| Reparación Aire Acondicionado | $25,000 | Hace 15 días | Pagado | Transferencia | MANT-2024-11-01 |
| Limpieza Profunda Local | $12,000 | Hace 25 días | Pagado | Efectivo | MANT-2024-11-02 |

### Impuestos (2 gastos)

| Descripción | Monto | Fecha | Estado | Método Pago | Recibo |
|-------------|-------|-------|--------|-------------|--------|
| Ingresos Brutos - Octubre 2024 | $18,000 | Hace 40 días | Pagado | Transferencia | IMP-2024-10 |
| Ingresos Brutos - Septiembre 2024 | $16,500 | Hace 70 días | Pagado | Transferencia | IMP-2024-09 |

### Seguros (1 gasto)

| Descripción | Monto | Fecha | Estado | Método Pago | Recibo |
|-------------|-------|-------|--------|-------------|--------|
| Seguro Local - Trimestre 4 | $35,000 | Hace 45 días | Pagado | Transferencia | SEG-2024-Q4 |

---

## Proveedores

Se crean **4 proveedores** que aparecen en las compras:

1. **Distribuidora de Belleza S.A.**
   - CUIT: 30-12345678-9
   - Teléfono: 11-4000-1234

2. **Marroquinería El Cuero**
   - CUIT: 30-23456789-0
   - Teléfono: 11-4000-2345

3. **Perfumería Premium**
   - CUIT: 30-34567890-1
   - Teléfono: 11-4000-3456

4. **Accesorios y Más**
   - CUIT: 30-45678901-2
   - Teléfono: 11-4000-4567

---

## Compras

Se crean **10 compras** distribuidas en diferentes fechas:

### Compras Pagadas (7)

#### Compra 1 - Hace 60 días
- **Proveedor:** Distribuidora de Belleza S.A.
- **Fecha:** Hace 60 días
- **Estado:** Pagada
- **Método de pago:** Transferencia
- **Factura:** FC-001-2024
- **Items:**
  - Base Líquida Natural Beige: 20 unidades × $4,500
  - Labial Mate Rojo Intenso: 30 unidades × $3,200
  - Paleta de Sombras 12 Colores: 10 unidades × $6,800
- **Subtotal:** $242,000
- **Total:** $242,000
- **Stock actualizado:** ✅

#### Compra 2 - Hace 45 días
- **Proveedor:** Marroquinería El Cuero
- **Fecha:** Hace 45 días
- **Estado:** Pagada
- **Método de pago:** Transferencia
- **Factura:** FC-002-2024
- **Descuento:** $5,000
- **Items:**
  - Cartera Cuero Negro: 8 unidades × $8,500
  - Billetera Cuero Marrón: 12 unidades × $5,200
  - Monedero Cuero Negro: 15 unidades × $3,200
- **Subtotal:** $200,000
- **Total:** $195,000
- **Stock actualizado:** ✅

#### Compra 3 - Hace 30 días
- **Proveedor:** Perfumería Premium
- **Fecha:** Hace 30 días
- **Estado:** Pagada
- **Método de pago:** Tarjeta Crédito
- **Factura:** FC-003-2024
- **Impuestos:** $2,100
- **Items:**
  - Perfume Mujer 50ml: 5 unidades × $12,500
  - Perfume Hombre 50ml: 5 unidades × $12,500
  - Colonia Unisex 100ml: 10 unidades × $6,800
- **Subtotal:** $180,500
- **Total:** $182,600
- **Stock actualizado:** ✅

#### Compra 4 - Hace 20 días
- **Proveedor:** Distribuidora de Belleza S.A.
- **Fecha:** Hace 20 días
- **Estado:** Pagada
- **Método de pago:** Transferencia
- **Factura:** FC-004-2024
- **Items:**
  - Crema Hidratante Día SPF 30: 15 unidades × $5,200
  - Serum Vitamina C: 8 unidades × $7,500
  - Limpiador Facial Espumoso: 20 unidades × $3,800
- **Subtotal:** $208,000
- **Total:** $208,000
- **Stock actualizado:** ✅

#### Compra 5 - Hace 15 días
- **Proveedor:** Accesorios y Más
- **Fecha:** Hace 15 días
- **Estado:** Pagada
- **Método de pago:** Efectivo
- **Factura:** FC-005-2024
- **Items:**
  - Aros Aro Dorado: 10 unidades × $3,200
  - Collar Plata 45cm: 8 unidades × $5,800
  - Pulsera Ajustable Plata: 12 unidades × $4,200
- **Subtotal:** $133,600
- **Total:** $133,600
- **Stock actualizado:** ✅

#### Compra 6 - Hace 10 días
- **Proveedor:** Marroquinería El Cuero
- **Fecha:** Hace 10 días
- **Estado:** Pagada
- **Método de pago:** Transferencia
- **Factura:** FC-006-2024
- **Descuento:** $3,000
- **Items:**
  - Bolso Tote Cuero Negro: 3 unidades × $18,500
  - Bolso Bandolera Cuero: 4 unidades × $15,200
- **Subtotal:** $110,300
- **Total:** $107,300
- **Stock actualizado:** ✅

#### Compra 7 - Hace 5 días
- **Proveedor:** Distribuidora de Belleza S.A.
- **Fecha:** Hace 5 días
- **Estado:** Pagada
- **Método de pago:** Tarjeta Débito
- **Factura:** FC-007-2024
- **Items:**
  - Shampoo Reparador 500ml: 25 unidades × $3,200
  - Acondicionador Hidratante 500ml: 25 unidades × $3,200
  - Mascarilla Capilar Nutritiva: 15 unidades × $4,500
- **Subtotal:** $207,500
- **Total:** $207,500
- **Stock actualizado:** ✅

### Compras Pendientes (3)

#### Compra 8 - Hace 3 días
- **Proveedor:** Perfumería Premium
- **Fecha:** Hace 3 días
- **Estado:** Pendiente
- **Factura:** FC-008-2024
- **Items:**
  - Esmalte Rojo Clásico: 20 unidades × $1,200
  - Esmalte Rosa Nude: 20 unidades × $1,200
  - Esmalte Azul Marino: 15 unidades × $1,200
- **Subtotal:** $66,000
- **Total:** $66,000
- **Stock actualizado:** ❌

#### Compra 9 - Ayer
- **Proveedor:** Marroquinería El Cuero
- **Fecha:** Ayer
- **Estado:** Pendiente
- **Factura:** FC-009-2024
- **Items:**
  - Cinturón Cuero Negro 3cm: 5 unidades × $4,500
  - Cinturón Cuero Marrón 4cm: 5 unidades × $5,200
- **Subtotal:** $48,500
- **Total:** $48,500
- **Stock actualizado:** ❌

#### Compra 10 - Hoy
- **Proveedor:** Accesorios y Más
- **Fecha:** Hoy
- **Estado:** Pendiente
- **Factura:** FC-010-2024
- **Items:**
  - Reloj Analógico Cuero: 8 unidades × $12,500
- **Subtotal:** $100,000
- **Total:** $100,000
- **Stock actualizado:** ❌

---

## Resumen General

Al ejecutar el seed se crean:

- ✅ **1 usuario** administrador
- ✅ **1 configuración** del sistema
- ✅ **11 categorías** de productos
- ✅ **50 productos** con precios y stock
- ✅ **4 categorías** de clientes
- ✅ **10 clientes** con datos completos
- ✅ **8 categorías** de gastos
- ✅ **20 gastos** (18 pagados, 2 pendientes)
- ✅ **10 compras** (7 pagadas, 3 pendientes)
- ✅ **4 proveedores** diferentes

---

## Notas Importantes

1. **Fechas dinámicas:** Las fechas se calculan dinámicamente basándose en la fecha actual del sistema usando las funciones `getDateDaysAgo()` y `getDateDaysFromNow()`.

2. **Stock actualizado:** Solo las compras con estado `PAID` actualizan el stock de los productos. Las compras pendientes no afectan el inventario hasta que se marquen como pagadas.

3. **Margen de ganancia:** Todos los productos se crean con un margen de ganancia del 30%, que coincide con la configuración del sistema.

4. **Números de compra:** Se generan automáticamente con el formato `COMP-YYYY-NNNNN` donde YYYY es el año actual y NNNNN es un número secuencial.

5. **Eliminación de datos:** El seed usa `dropSchema: true`, lo que significa que **elimina todos los datos existentes** antes de crear los nuevos. ⚠️ **Usar con precaución en producción.**

---

## Ejecución

Para ejecutar el seed:

```bash
cd apps/backend
npm run seed
# o
pnpm seed
```

El script mostrará el progreso en la consola y un resumen final al completarse.

