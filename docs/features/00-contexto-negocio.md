# Contexto de Negocio - Sistema de Gestión

## 1. Propósito del Sistema

El **Sistema de Gestión** es una aplicación web empresarial orientada a pequeñas y medianas empresas que necesitan centralizar la administración de su operación diaria. El objetivo principal es reemplazar planillas sueltas, sistemas desconectados y procesos manuales por una **plataforma única**, integrada y accesible desde cualquier lugar.

El sistema combina un **backend** robusto (NestJS + PostgreSQL) con un **frontend** moderno (React + Vite), permitiendo construir flujos de trabajo complejos manteniendo una experiencia de usuario clara y consistente.

## 2. Problemas de Negocio que Resuelve

1. **Información dispersa y duplicada**  
   Muchas empresas gestionan ventas, compras, clientes y stock en herramientas separadas (planillas Excel, sistemas de facturación, notas manuales). Esto genera datos inconsistentes, errores y pérdida de tiempo.

2. **Falta de visibilidad en tiempo real**  
   Es difícil responder preguntas básicas como: _"¿Qué stock real tengo?", "¿Quién me debe y cuánto?", "¿Cuántas ventas hice esta semana?"_. El sistema unifica la información y la expone en dashboards y reportes.

3. **Procesos manuales y poco escalables**  
   El registro manual de movimientos (caja, inventario, gastos) aumenta la probabilidad de errores humanos y hace muy costoso escalar el negocio. El sistema estandariza procesos y automatiza cálculos.

4. **Control limitado sobre permisos y auditoría**  
   Sin un módulo de autenticación robusto, es difícil controlar quién puede ver o modificar qué información. El módulo de Auth definido en los docs permite gestionar usuarios, roles y permisos por recurso/acción.

5. **Dificultad para tomar decisiones basadas en datos**  
   Al no contar con reportes claros, las decisiones suelen ser intuitivas. El módulo de reportes y dashboard provee indicadores clave (ventas, márgenes, morosidad, rotación de stock) para decisiones informadas.

## 3. Áreas de Negocio que Cubre

Según los módulos funcionales definidos en `docs/features`, el sistema aborda de forma integral los siguientes dominios:

- **Autenticación y Seguridad (Auth)**: gestión de usuarios, roles, permisos y sesiones seguras con JWT.
- **Productos**: alta, baja y modificación de productos, categorías, listas de precios y atributos clave.
- **Clientes**: registro de clientes, datos de contacto, condiciones comerciales y seguimiento de historial.
- **Gastos**: registro y categorización de gastos para análisis de rentabilidad y control de costos.
- **Compras**: gestión de órdenes de compra, proveedores y recepción de mercadería.
- **Inventario**: control de stock, movimientos, ajustes e historial de existencia en depósitos/sucursales.
- **Ventas**: registro de ventas, condiciones de pago, descuentos y documentos asociados.
- **Caja**: control diario de ingresos y egresos de efectivo, arqueos y cierre de caja.
- **Cuentas Corrientes**: seguimiento de deudas de clientes y obligaciones con proveedores.
- **Dashboard**: visión ejecutiva con KPIs clave del negocio.
- **Reportes**: generación de reportes detallados (PDF/Excel) para análisis contable, operativo y comercial.

## 4. Usuarios Objetivo

El sistema está pensado principalmente para:

- **Dueños y gerentes** que necesitan una visión global y consolidada del negocio.
- **Responsables administrativos** que registran compras, ventas, gastos y conciliaciones.
- **Personal de caja / punto de venta** que opera ventas diarias y cierres de caja.
- **Responsables de stock / depósito** que controlan inventario, movimientos y reposiciones.

Cada perfil se modela mediante **roles y permisos** configurables en el módulo de Auth, permitiendo definir qué puede ver y hacer cada usuario dentro del sistema.

## 5. Beneficios Clave

- **Centralización de la información**: un solo sistema para productos, clientes, ventas, compras, caja y reportes.
- **Trazabilidad completa**: cada movimiento (venta, compra, ajuste de stock, movimiento de caja) queda registrado con usuario, fecha y contexto.
- **Reducción de errores manuales**: formularios validados, reglas de negocio claras y procesos guiados reducen la carga operativa.
- **Mejor toma de decisiones**: dashboards y reportes alimentados por datos consistentes y en tiempo (casi) real.
- **Escalabilidad**: la arquitectura basada en NestJS/React + PostgreSQL/Redis permite crecer en volumen de datos y usuarios.

## 6. Relación con la Arquitectura Técnica

El diseño técnico definido en `stack-tecnologico.md` está alineado con estos objetivos de negocio:

- La **arquitectura en capas** y el uso de **TypeORM** facilitan modelar dominios como ventas, inventario o cuentas corrientes respetando reglas de negocio.
- El uso de **PostgreSQL** con extensiones como `uuid-ossp` y `unaccent` permite claves robustas, búsquedas avanzadas y buen rendimiento.
- El frontend en **React + Vite + Tailwind + Shadcn** permite construir una UI amigable para usuarios no técnicos, siguiendo los estándares definidos en `estandares-ui-ux.md`.
- El soporte para **caché y colas (Redis + Bull)** habilita procesos asíncronos (ej. generación de reportes pesados, notificaciones, tareas batch).

## 7. Resumen en Lenguaje de Negocio

En términos simples, el Sistema de Gestión busca ser el **sistema operativo del negocio**: una herramienta donde se registran y controlan todas las operaciones clave del día a día (compras, ventas, stock, caja, deudas) y que, a la vez, provee la información necesaria para decidir con datos y no con intuición.

Su enfoque es especialmente útil para empresas que han crecido lo suficiente como para que las planillas ya no alcancen, pero que aún necesitan una solución flexible, modular y pensada para seguir evolucionando.
