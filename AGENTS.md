# Agent Development Guide

## Project Overview

Monorepo with NestJS backend, React frontend (Vite + Electron), PostgreSQL with TypeORM ORM.

## Build Commands

### Root
```bash
npm run dev              # Start all services
npm run build            # Build all packages
npm run lint             # Lint all packages
npm run test             # Run all tests
npm run test:unit        # Unit tests
npm run test:coverage    # Coverage reports
npm run test:e2e         # E2E tests
```

### Backend (apps/backend)
```bash
npm run dev              # Dev server with hot reload
npm run build            # TypeScript compilation
npm run start            # Production server
npm run lint             # ESLint with auto-fix
npm test                 # Jest: all tests
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests
npm run test:api         # API endpoint tests
npm run test:all         # Full coverage report

# Run single test
npm test -- --testNamePattern="describe specific test"
npm test -- path/to/file.spec.ts
```

### Frontend (apps/frontend)
```bash
npm run dev              # Vite dev server
npm run build            # Production build
npm run lint             # ESLint with auto-fix
npm test                 # Vitest: all tests
npm run test:coverage    # Vitest with coverage
npm run test:e2e         # Playwright e2e tests
npm run test:e2e:ui      # Playwright UI mode
npm run test:e2e:debug   # Playwright debug mode

# Run single test
npm test -- --run file.spec.ts
npm test -- -t "test name"
```

## Code Style Guidelines

### TypeScript Configuration
- **Strict mode**: Enabled in all packages
- **Target**: ES2022
- **Module**: CommonJS (backend), ESNext (frontend)
- **Decorators**: Enabled for NestJS
- **Path aliases**: `@/*` resolves to `./src` (frontend)

### Import Order
```typescript
// React/core imports
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';

// Third-party libraries
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';

// Internal imports
import { Button } from '@/components/ui/button';
import { api } from '@/lib/axios';
```

### Naming Conventions
- **Files**: kebab-case (`auth.controller.ts`, `product-form.tsx`)
- **Classes/Interfaces**: PascalCase (`AuthService`, `ProductFormProps`)
- **Functions/Variables**: camelCase (`validateUser`, `handleSubmit`)
- **Constants**: UPPER_SNAKE_CASE (`API_URL`, `MAX_RETRIES`)
- **Enums**: PascalCase (`UserRole`, `InvoiceStatus`)
- **React Components**: PascalCase (`ProductForm`, `DataTable`)

### Backend Patterns
```typescript
@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly service: AuthService) {}

    @Post('login')
    @ApiOperation({ summary: 'Login user' })
    async login(@Body() dto: LoginDto) {
        return this.service.login(dto);
    }
}

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly configService: ConfigService,
    ) {}
}
```

### Frontend Patterns
```typescript
interface ProductFormProps {
    readonly initialData?: ProductFormValues;
    readonly onSubmit: (data: ProductFormValues) => void;
}

export function ProductForm({ initialData, onSubmit }: ProductFormProps) {}
```

### Error Handling
**Backend**: NestJS HTTP exceptions
```typescript
throw new UnauthorizedException('Credenciales inválidas');
throw new ConflictException('El email ya está registrado');
throw new NotFoundException('Producto no encontrado');
```

**Frontend**: Try-catch with user feedback
```typescript
try {
    await productsApi.create(data);
    toast.success('Producto creado exitosamente');
} catch (error) {
    toast.error('Error al crear producto');
}
```

### Type Safety
- **Never use `any`** - use `unknown` or specific types
- **Explicit return types** for public functions
- **Use `readonly`** for props that shouldn't be reassigned
- **Use interfaces** for object shapes, **types** for unions/intersections
- **Explicitly mark optional fields** (`string | null`)

## Additional Guidelines

- **Explicit imports**: No barrel imports unless documented
- **Console logging**: Remove before committing, use proper logging
- **Comments**: Only for complex business logic, not obvious code
- **File structure**: Group related files in feature folders
- **Path aliases**: Use `@/` for internal imports in frontend, absolute paths in backend

<!-- CLAVIX:START -->
## Clavix Integration

This project uses Clavix for prompt improvement and PRD generation.

### Setup Commands (CLI)
| Command | Purpose |
|---------|---------|
| `clavix init` | Initialize Clavix in a project |
| `clavix update` | Update templates after package update |
| `clavix diagnose` | Check installation health |
| `clavix version` | Show version |

### Workflow Commands (Slash Commands)
| Slash Command | Purpose |
|---------------|---------|
| `/clavix:improve` | Optimize prompts (auto-selects depth) |
| `/clavix:prd` | Generate PRD through guided questions |
| `/clavix:plan` | Create task breakdown from PRD |
| `/clavix:implement` | Execute tasks or prompts (auto-detects source) |
| `/clavix:start` | Begin conversational session |
| `/clavix:summarize` | Extract requirements from conversation |
| `/clavix:verify` | Verify implementation |
| `/clavix:archive` | Archive completed projects |

Learn more: https://github.com/clavixdev/clavix
<!-- CLAVIX:END -->
