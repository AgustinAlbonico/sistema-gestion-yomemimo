# Plan de Distribución - NexoPOS

> Documento que detalla todo lo necesario para distribuir el sistema NexoPOS a negocios.

## Resumen Ejecutivo

NexoPOS es un sistema de gestión comercial que se distribuirá como aplicación de escritorio. Este documento describe los componentes necesarios para una instalación profesional y el control de acceso para el modelo de suscripción mensual.

---

## Componentes a Implementar

### 1. Seed Básico del Administrador
**Prioridad**: Alta | **Complejidad**: Baja

Crear script `seed-admin.ts` que solo crea:
- Usuario admin (admin/Admin123)
- Configuración del sistema básica
- Métodos de pago por defecto
- Tipos de impuesto IVA

> **Importante**: NO usar el seed actual que borra toda la BD y crea datos demo.

---

### 2. Migraciones Automáticas
**Prioridad**: Alta | **Complejidad**: Media

El backend debe ejecutar migraciones automáticamente cuando detecta BD vacía.

**Archivos a modificar**:
- `apps/backend/src/main.ts`: Agregar lógica para correr migraciones al iniciar

**Comportamiento**:
1. Al iniciar backend, verificar si tabla `migrations` existe
2. Si no existe o está vacía, ejecutar `dataSource.runMigrations()`
3. Log de progreso para debugging

---

### 3. Setup Wizard (Configurador de Primera Ejecución)
**Prioridad**: Alta | **Complejidad**: Media

Pantalla de configuración inicial que aparece cuando no hay configuración de BD.

**Archivos a crear**:
- `apps/desktop/electron/setup-wizard.ts`: Módulo de configuración

**Funcionalidades**:
- Formulario HTML para: host, puerto, usuario, password, nombre BD
- Botón "Probar Conexión" que verifica conectividad con PostgreSQL
- Guardar configuración en `.env` junto al ejecutable
- Detectar si es primera ejecución (no existe `.env` o falla conexión)

**Flujo**:
1. App inicia → ¿Existe `.env`?
2. No → Mostrar Setup Wizard
3. Sí → ¿Conexión válida?
4. No → Mostrar Setup Wizard con error
5. Sí → Continuar flujo normal

---

### 4. Modo Red Local (Servidor/Cliente)
**Prioridad**: Alta | **Complejidad**: Media

Permitir que el sistema funcione en red local: una PC como servidor y otras como clientes.

**Arquitectura**:
| Modo | Qué incluye | Uso |
|------|-------------|-----|
| **Servidor** | Backend NestJS + PostgreSQL + Frontend | PC principal del negocio |
| **Cliente** | Solo Frontend (React) | Otras terminales/cajas |

**Pantalla en Setup Wizard**:
```
┌─────────────────────────────────────────┐
│     ¿Cómo se usará esta computadora?    │
├─────────────────────────────────────────┤
│  ○ SERVIDOR (PC principal)              │
│    Esta PC tendrá la base de datos      │
│    y otras PCs se conectarán aquí       │
│                                         │
│  ○ CLIENTE (Terminal adicional)         │
│    Esta PC se conectará a otra PC       │
│    que tiene el servidor                │
│    Ingrese IP del servidor: [_______]   │
└─────────────────────────────────────────┘
```

**Configuración backend**:
```typescript
// Cambiar de localhost a 0.0.0.0 para aceptar conexiones de red
await app.listen(PORT, '0.0.0.0');
```

**Requisitos de red**:
- El servidor debe tener IP fija en la red local (ej: 192.168.1.100)
- Abrir puerto 3000 en firewall de Windows
- Los clientes deben estar en la misma red

---

### 5. Control de Acceso (Flag en BD + VPN)
**Prioridad**: Media | **Complejidad**: Baja

Modelo de negocio: suscripción mensual. Si no pagan, se corta el servicio.

**Implementación**:

Agregar campos en `system_configuration`:
```typescript
@Column('boolean', { default: true })
sistemaHabilitado!: boolean;

@Column('varchar', { nullable: true })
mensajeDeshabilitado?: string; // "Contacte al proveedor"
```

**Frontend**:
- Verificar al cargar la app: GET `/api/configuration`
- Si `sistemaHabilitado === false` → mostrar pantalla de bloqueo
- No dejar acceder a ninguna funcionalidad

**VPN para acceso remoto**:

Opciones recomendadas (gratis):
1. **ZeroTier**: Red VPN fácil de configurar
2. **Tailscale**: Similar a ZeroTier
3. **WireGuard**: Más técnico pero eficiente

**Flujo para cortar servicio**:
1. Instalás ZeroTier en tu PC y en la del cliente
2. Ambos se unen a tu red privada
3. Te conectás a PostgreSQL del cliente desde tu PC
4. Ejecutás: `UPDATE system_configuration SET "sistemaHabilitado" = false;`

---

### 6. PostgreSQL Bundled en Instalador
**Prioridad**: Baja | **Complejidad**: Alta

Incluir PostgreSQL portable en el instalador NSIS como opción.

**Archivos a modificar**:
- `apps/desktop/electron-builder.yml`: Agregar PostgreSQL como extraResource

**Script NSIS**:
- Checkbox: "¿Instalar PostgreSQL? (recomendado)"
- Si marca, copiar PostgreSQL portable al destino
- Crear servicio de Windows para PostgreSQL
- Configurar data directory
- Crear base de datos `nexopos` y usuario

---

## Flujo Completo de Primera Instalación

```
1. Usuario ejecuta NexoPOS-Setup.exe
2. NSIS pregunta: "¿Instalar PostgreSQL?" [✓]
3. Si marcó, instala PostgreSQL portable + crea BD
4. Instala NexoPOS en Archivos de Programa
5. Usuario abre NexoPOS
6. App detecta que no hay .env → Muestra Setup Wizard
7. Setup Wizard pregunta: ¿Servidor o Cliente?
8. Si Servidor:
   - Configurar conexión BD (o auto si instaló PG)
   - Ejecutar migraciones + seed admin
9. Si Cliente:
   - Pedir IP del servidor
   - Probar conexión
10. Login funcionando con admin/Admin123
```

---

## Orden de Implementación

| Fase | Componente | Prioridad | Complejidad |
|------|------------|-----------|-------------|
| 1 | Seed Básico Admin | Alta | Baja |
| 2 | Migraciones Automáticas | Alta | Media |
| 3 | Setup Wizard | Alta | Media |
| 4 | Modo Red Local | Alta | Media |
| 5 | Control de Acceso (Flag+VPN) | Media | Baja |
| 6 | PostgreSQL Bundled | Baja | Alta |

---

## Herramientas Recomendadas

### VPN para Acceso Remoto
- **ZeroTier**: https://zerotier.com (gratis hasta 100 dispositivos)
- **Tailscale**: https://tailscale.com (gratis para uso personal)

### Cliente PostgreSQL
- **pgAdmin 4**: Para ejecutar queries remotamente
- **DBeaver**: Alternativa más liviana

---

## Notas Importantes

1. **La contraseña por defecto es `Admin123`** - Recomendar al cliente cambiarla después del primer login.

2. **El puerto 3000 debe estar abierto** en el firewall de Windows para el modo red local.

3. **ZeroTier/Tailscale** también sirven para dar soporte técnico remoto.

4. **Backup antes de cortar**: Antes de deshabilitar el sistema de un cliente, asegurate de tener backup de sus datos por si hay disputa.
