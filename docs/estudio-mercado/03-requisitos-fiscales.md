# Requisitos Fiscales y Contables - PyMEs Argentina 2024-2025

## Resumen Ejecutivo

Las PyMEs argentinas enfrentan obligaciones fiscales cada vez más complejas y digitalizadas. Un sistema POS competitivo debe ir más allá de la facturación electrónica básica e incorporar herramientas que faciliten el cumplimiento tributario y la interacción con contadores.

---

## Obligaciones Fiscales Clave

### 1. Libro IVA Digital (Obligatorio)

| Aspecto | Detalle |
|---------|---------|
| **Alcance** | Responsables Inscriptos y Sujetos Exentos en IVA |
| **Exentos** | Monotributistas, empleados domésticos |
| **Frecuencia** | Mensual, antes del vencimiento de DDJJ IVA |
| **Normativa** | RG 4597/2019 y modificatorias |

**Qué debe registrarse:**
- Todas las operaciones de compras y ventas
- Cesiones, exportaciones e importaciones
- Operaciones exentas y con monotributistas
- Código AFIP del comprobante
- CUIT del receptor/emisor

**Novedades 2024-2025:**
- **Octubre 2024**: DDJJ IVA precargada con datos del Libro IVA Digital
- **Noviembre 2025**: Sistema "IVA Simple" (F. 2051) obligatorio

> **⚠️ IMPORTANTE**: El Libro IVA Digital reemplazó al CITI Compras/Ventas (F. 4502). Una vez que se comienza a presentar, no se vuelve atrás.

---

### 2. Facturación Electrónica - Cambios 2025

#### Régimen de Transparencia Fiscal (RG 5614/2024)
| Fecha | Obligación |
|-------|------------|
| 1 Enero 2025 | Grandes empresas deben discriminar IVA e impuestos |
| 1 Abril 2025 | Obligatorio para TODOS los contribuyentes |

#### Modificaciones Factura Electrónica (RG 5616/2024)
| Fecha | Cambio |
|-------|--------|
| 15 Abril 2025 | Indicar si cobro es en moneda extranjera + cotización |
| 15 Abril 2025 | Incluir condición IVA del cliente en todo comprobante |

#### Eliminación Factura "M" (RG 5762/2025)
| Fecha | Cambio |
|-------|--------|
| 25 Sept 2025 | Factura "M" eliminada, reemplazada por Factura "A" con leyenda |
| Nueva opción | Factura "A" con leyenda "PAGO EN CBU INFORMADA" (sin retención) |

---

### 3. Notas de Crédito y Devoluciones

Requisitos AFIP para emisión de Notas de Crédito:

| Requisito | Detalle |
|-----------|---------|
| **Emisor** | Solo quien emitió la factura original |
| **Vinculación** | Obligatoria con factura original |
| **Receptor** | Debe ser el mismo de la factura original |
| **Plazo** | Máximo 15 días corridos desde el hecho |
| **Contenido** | Referencia explícita al comprobante original |

> **🔧 FUNCIONALIDAD REQUERIDA**: El sistema debe permitir generar notas de crédito vinculadas automáticamente a la factura original, dentro del plazo legal.

---

### 4. Percepciones y Retenciones

#### Regímenes más comunes para PyMEs

| Régimen | Aplica a | Agente |
|---------|----------|--------|
| **Retención IVA** | Compras a Resp. Inscriptos | Grandes compradores |
| **Percepción IVA** | Ventas a Resp. Inscriptos | Grandes vendedores |
| **Retención Ganancias** | Pagos a proveedores | Según actividad |
| **IIBB (provincial)** | Ventas según jurisdicción | Variable por provincia |

**Requisitos del sistema:**
- Calcular automáticamente percepciones según cliente
- Generar certificados de retención
- Exportar datos para declaraciones juradas

---

### 5. Reportes CITI y Archivos de Intercambio

Aunque el Libro IVA Digital reemplazó al CITI para IVA, existen otros reportes:

| Reporte | Descripción | Formato |
|---------|-------------|---------|
| **Archivo ventas** | Detalle de operaciones | TXT con formato AFIP |
| **Archivo compras** | Detalle de compras | TXT con formato AFIP |
| **Libro sueldos digital** | Si tiene empleados | Web AFIP |
| **SIRCREB** | Retenciones bancarias IIBB | Consulta web |

---

## Formatos de Exportación para Contadores

### Formatos más solicitados

| Formato | Uso | Prioridad |
|---------|-----|-----------|
| **Excel (.xlsx)** | Análisis, conciliación manual | 🔴 Crítico |
| **CSV** | Importación a sistemas contables | 🔴 Crítico |
| **PDF** | Respaldo, archivo legal | 🟡 Alto |
| **TXT AFIP** | Libro IVA Digital, CITI | 🔴 Crítico |
| **XML** | Intercambio con otros sistemas | 🟢 Medio |

### Datos mínimos que solicitan los contadores

1. **Listado de ventas mensual**
   - Fecha, tipo comprobante, número, CUIT cliente, razón social
   - Neto gravado, IVA 21%, IVA 10.5%, exento, total
   - CAE, vencimiento CAE

2. **Listado de compras mensual**
   - Fecha, tipo comprobante, número, CUIT proveedor
   - Neto gravado, IVA, percepciones, total

3. **Resumen de caja/movimientos**
   - Ingresos por método de pago
   - Egresos categorizados

4. **Libro IVA en formato AFIP**
   - Archivo compatible con Portal IVA

---

## Obligaciones por Rubro Específico

### Farmacias
| Obligación | Detalle |
|------------|---------|
| **Trazabilidad ANMAT** | Registro de lotes, vencimientos, movimientos |
| **CUFE/GLN** | Código de ubicación física obligatorio |
| **GTIN + Serie** | Identificación única de medicamentos |
| **Dispensación** | Registro de entrega al paciente |

### Gastronomía
| Obligación | Detalle |
|------------|---------|
| **Controlador fiscal** | Según jurisdicción puede ser obligatorio |
| **Propinas** | Tratamiento fiscal específico |
| **Ticket consumidor** | Puede requerir ticket no fiscal |

### Combustibles
| Obligación | Detalle |
|------------|---------|
| **RG 4428** | Registro de operaciones |
| **Trazabilidad** | Sistemas específicos |

---

## Funcionalidades Fiscales Requeridas en el Sistema

### 🔴 Críticas (Deal-Breakers)

1. **Facturación electrónica AFIP/ARCA completa**
   - Facturas A, B, C, E
   - Notas de Crédito/Débito
   - Tickets (para quien aplique)

2. **Generación de Libro IVA Digital**
   - Formato compatible con Portal IVA
   - Cuadre automático con DDJJ

3. **Exportación a formatos contables**
   - Excel con formato estándar
   - CSV para importación

### 🟡 Importantes

4. **Cálculo de percepciones IVA**
   - Por provincia
   - Por tipo de cliente

5. **Gestión de alícuotas múltiples**
   - IVA 21%, 10.5%, 27%, exento

6. **Notas de crédito vinculadas**
   - Referencia automática a factura
   - Validación de plazos

### 🟢 Deseables

7. **Dashboard de situación fiscal**
   - Resumen IVA débito/crédito
   - Alertas de vencimientos

8. **Integración Libro IVA Digital**
   - Exportación directa al portal
   - Pre-validación de datos

---

## Próximos Cambios Regulatorios a Monitorear

| Fecha | Cambio | Impacto |
|-------|--------|---------|
| Abril 2025 | Transparencia fiscal obligatoria | Adaptar formato facturas |
| Abril 2025 | Condición IVA cliente obligatoria | Validar datos clientes |
| Sept 2025 | Eliminación Factura M | Actualizar tipos comprobantes |
| Nov 2025 | IVA Simple obligatorio | Nuevo formulario DDJJ |
| Jun 2026 | CAEA como contingencia | Implementar si usa WebService |

---

## Recomendaciones para NexoPOS

1. **Priorizar exportación Excel/CSV** con todos los datos para contadores
2. **Implementar generación Libro IVA Digital** formato AFIP
3. **Agregar módulo de notas de crédito** con vinculación automática
4. **Incluir campo condición IVA** en todos los comprobantes
5. **Preparar adaptaciones** para cambios de abril y septiembre 2025

---

*Última actualización: Diciembre 2024*
