# Plan de Implementación: Gestión de Usuarios del Sistema

## Objetivo
Agregar funcionalidad completa para gestionar usuarios del sistema desde la página de configuración, permitiendo crear, editar, listar y desactivar usuarios.

## Requisitos
1. **Validaciones de usuario**:
   - Nombre de usuario: minúsculas, sin espacios, una sola palabra
   - Contraseñas: siempre hasheadas (ya implementado en la entidad)
   - Todos los usuarios tienen permisos completos

2. **Funcionalidades**:
   - Listado de usuarios existentes
   - Crear nuevo usuario (username, password, firstName, lastName)
   - Editar usuario existente
   - Desactivar/Activar usuario (no eliminar)

3. **UI/UX**:
   - Link en página de configuración que lleve a nueva página de gestión
   - Página con tabla de usuarios y acciones
   - Diálogos para crear/editar usuarios

## Tareas Backend

### 1. Actualizar DTOs y Validaciones
**Archivo**: `apps/backend/src/modules/auth/dto/index.ts`

- Modificar `CreateUserSchema` para validar username en minúsculas sin espacios
- Agregar validación para que username sea una sola palabra
- Asegurar que las validaciones de contraseña se mantengan

### 2. Actualizar UsersService
**Archivo**: `apps/backend/src/modules/auth/users.service.ts`

- Agregar método `toggleActive(id: string, isActive: boolean)` para activar/desactivar usuarios
- Asegurar que el método `update` no permita cambiar la contraseña (ya está implementado)

### 3. Actualizar UsersController
**Archivo**: `apps/backend/src/modules/auth/users.controller.ts`

- Agregar endpoint PATCH `/users/:id/toggle-active` para activar/desactivar
- Los endpoints existentes ya cubren: GET all, GET one, POST create, PATCH update

## Tareas Frontend

### 4. Crear tipos TypeScript
**Archivo**: `apps/frontend/src/features/users/types/user.types.ts` (nuevo)

```typescript
export interface User {
  id: string;
  username: string;
  email: string | null;
  firstName: string;
  lastName: string;
  isActive: boolean;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface UpdateUserRequest {
  username?: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
}
```

### 5. Crear API Client
**Archivo**: `apps/frontend/src/features/users/api/users.api.ts` (nuevo)

- `listUsers()`: GET /api/users
- `getUser(id)`: GET /api/users/:id
- `createUser(data)`: POST /api/users
- `updateUser(id, data)`: PATCH /api/users/:id
- `toggleUserActive(id, isActive)`: PATCH /api/users/:id/toggle-active

### 6. Crear hooks personalizados
**Archivo**: `apps/frontend/src/features/users/hooks/useUsers.ts` (nuevo)

- `useUsers()`: hook para listar usuarios
- `useCreateUser()`: hook para crear usuario
- `useUpdateUser()`: hook para actualizar usuario
- `useToggleUserActive()`: hook para activar/desactivar

### 7. Crear componentes

#### 7.1 UserForm Component
**Archivo**: `apps/frontend/src/features/users/components/UserForm.tsx` (nuevo)

- Formulario con validación usando Zod
- Campos: username, password (solo en creación), firstName, lastName
- Validación de username: minúsculas, sin espacios, una palabra
- Validación de contraseña: mínimo 8 caracteres, mayúscula, minúscula, número

#### 7.2 UserFormDialog Component
**Archivo**: `apps/frontend/src/features/users/components/UserFormDialog.tsx` (nuevo)

- Diálogo modal para crear/editar usuario
- Usa UserForm internamente
- Maneja estados de creación y edición

#### 7.3 UsersTable Component
**Archivo**: `apps/frontend/src/features/users/components/UsersTable.tsx` (nuevo)

- Tabla con columnas: username, nombre completo, email, estado, último login, acciones
- Acciones: Editar, Activar/Desactivar
- Badge para mostrar estado activo/inactivo

### 8. Crear página de gestión de usuarios
**Archivo**: `apps/frontend/src/features/users/pages/UsersPage.tsx` (nuevo)

- Header con título y botón "Crear Usuario"
- UsersTable con todos los usuarios
- Integración con UserFormDialog

### 9. Actualizar rutas
**Archivo**: `apps/frontend/src/App.tsx`

- Agregar ruta `/settings/users` que renderice `UsersPage`

### 10. Actualizar página de configuración
**Archivo**: `apps/frontend/src/pages/settings/SettingsPage.tsx`

- Agregar card clickeable "Gestión de Usuarios" similar al de "Facturación Fiscal"
- Link que lleve a `/settings/users`
- Icono: Users de lucide-react

## Orden de Implementación

1. Backend: Actualizar DTOs con validaciones (Tarea 1)
2. Backend: Actualizar UsersService (Tarea 2)
3. Backend: Actualizar UsersController (Tarea 3)
4. Frontend: Crear estructura de carpetas y tipos (Tarea 4)
5. Frontend: Crear API client (Tarea 5)
6. Frontend: Crear hooks (Tarea 6)
7. Frontend: Crear UserForm (Tarea 7.1)
8. Frontend: Crear UserFormDialog (Tarea 7.2)
9. Frontend: Crear UsersTable (Tarea 7.3)
10. Frontend: Crear UsersPage (Tarea 8)
11. Frontend: Actualizar rutas (Tarea 9)
12. Frontend: Actualizar SettingsPage (Tarea 10)

## Validaciones de Seguridad

- ✅ Contraseñas hasheadas automáticamente por la entidad User
- ✅ Username único validado en el servicio
- ✅ No se puede eliminar usuarios, solo desactivar
- ✅ Validación de formato de username (minúsculas, sin espacios)
- ✅ Validación de complejidad de contraseña

## Notas Técnicas

- El sistema ya tiene la entidad User con hash automático de contraseñas
- El UsersService y UsersController ya existen con funcionalidad básica
- Solo necesitamos agregar la funcionalidad de toggle active y el frontend completo
- Seguir el patrón de diseño existente en el proyecto (similar a customer-accounts)
