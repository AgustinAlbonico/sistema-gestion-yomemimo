# Stack Tecnológico - Aplicación Web Full Stack

> Documento técnico para desarrollo asistido por IA. Define el stack tecnológico completo, patrones de diseño, arquitectura y mejores prácticas para una aplicación web empresarial con React, NestJS, PostgreSQL y TypeScript.

---

## 1. Arquitectura General

### 1.1 Tipo de Arquitectura
- **Patrón Principal**: Layered Architecture (Arquitectura en Capas)
- **Estilo**: SPA (Single Page Application) + RESTful API
- **Comunicación**: HTTP/HTTPS + WebSockets (opcional)
- **Persistencia**: Base de datos relacional con ORM
- **Cache**: Sistema de cache distribuido

### 1.2 Patrones de Diseño (GoF)

#### Backend
- **Repository Pattern**: Abstracción del acceso a datos
- **Factory Pattern**: Creación de entidades y servicios
- **Strategy Pattern**: Diferentes estrategias de procesamiento
- **Observer Pattern**: Sistema de eventos y notificaciones
- **Decorator Pattern**: Middleware y Guards
- **Singleton Pattern**: Instancias únicas (DI Container)
- **Chain of Responsibility**: Pipeline de middleware
- **Builder Pattern**: Construcción de queries complejas

#### Frontend
- **Observer Pattern**: Estado reactivo (React Query, Zustand)
- **Factory Pattern**: Creación de componentes dinámicos
- **Composite Pattern**: Composición de componentes React
- **Strategy Pattern**: Validadores y formateadores
- **Adapter Pattern**: Adaptadores de API
- **Facade Pattern**: Simplificación de interfaces complejas

### 1.3 Principios SOLID
- **Single Responsibility**: Módulos con responsabilidad única
- **Open/Closed**: Extensible mediante decoradores/plugins
- **Liskov Substitution**: Interfaces consistentes
- **Interface Segregation**: DTOs específicos por operación
- **Dependency Inversion**: Inyección de dependencias

---

## 2. Stack Backend

### 2.1 Runtime y Lenguaje
- **Node.js**: v20 LTS
- **TypeScript**: 5.x
- **Package Manager**: npm o pnpm

### 2.2 Framework: NestJS 10.x

**Justificación**:
- Framework TypeScript-first con arquitectura modular
- Sistema de inyección de dependencias robusto
- Decoradores para Guards, Interceptors, Pipes y Filters
- CLI para generación de código
- Ecosistema maduro

**Estructura de directorios**:
```
src/
├── modules/                  # Módulos funcionales
│   ├── [module-name]/
│   │   ├── entities/         # Entidades TypeORM
│   │   ├── dto/              # Data Transfer Objects
│   │   │   ├── create-[name].dto.ts
│   │   │   ├── update-[name].dto.ts
│   │   │   └── query-[name].dto.ts
│   │   ├── [name].controller.ts
│   │   ├── [name].service.ts
│   │   ├── [name].repository.ts
│   │   └── [name].module.ts
│
├── common/                   # Código compartido
│   ├── decorators/           # Custom decorators
│   ├── guards/               # Authorization guards
│   ├── interceptors/         # HTTP interceptors
│   ├── filters/              # Exception filters
│   ├── pipes/                # Validation pipes
│   ├── interfaces/           # Interfaces compartidas
│   └── constants/            # Constantes globales
│
├── config/                   # Configuración
│   ├── database.config.ts
│   ├── app.config.ts
│   ├── jwt.config.ts
│   └── validation.schema.ts
│
├── database/
│   ├── migrations/           # Migraciones
│   ├── seeds/                # Datos iniciales
│   └── factories/            # Factories para testing
│
└── main.ts                   # Entry point
```

**Configuración base (main.ts)**:
```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.setGlobalPrefix('api');
  
  app.enableCors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  });
  
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  
  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  
  await app.listen(3000);
}
bootstrap();
```

### 2.3 ORM: TypeORM 0.3.x

**Características**:
- Decoradores TypeScript para entidades
- Migraciones versionadas
- QueryBuilder para queries complejas
- Repository pattern
- Transacciones robustas

**Configuración**:
```typescript
TypeOrmModule.forRootAsync({
  useFactory: (config: ConfigService) => ({
    type: 'postgres',
    host: config.get('DB_HOST'),
    port: config.get('DB_PORT'),
    username: config.get('DB_USERNAME'),
    password: config.get('DB_PASSWORD'),
    database: config.get('DB_DATABASE'),
    entities: [__dirname + '/**/*.entity{.ts,.js}'],
    synchronize: false,
    migrations: ['dist/database/migrations/*{.ts,.js}'],
    migrationsRun: true,
    logging: ['error', 'warn'],
  }),
}),
```

**Definición de entidad**:
```typescript
@Entity('table_name')
@Index(['field1', 'field2'])
export class EntityName {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  @Index()
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => RelatedEntity, { onDelete: 'CASCADE' })
  relation: RelatedEntity;
}
```

### 2.4 Base de Datos: PostgreSQL 14+

**Características a utilizar**:
- ACID compliance
- Constraints (PK, FK, UNIQUE, CHECK)
- Índices (B-tree, Hash, GiST, GIN)
- Triggers para automatización
- Views y Materialized Views
- JSON/JSONB para datos flexibles
- Full-text search

**Extensiones recomendadas**:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";
```

### 2.5 Validación: Zod 3.x

**Schemas reutilizables**:
```typescript
import { z } from 'zod';

export const UuidSchema = z.string().uuid();
export const EmailSchema = z.string().email();

export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  sortBy: z.string().optional(),
  order: z.enum(['ASC', 'DESC']).default('ASC'),
});

export const CreateEntitySchema = z.object({
  name: z.string().min(1).max(255),
  amount: z.number().positive(),
  isActive: z.boolean().default(true),
});

export type CreateEntityDTO = z.infer<typeof CreateEntitySchema>;
export type PaginationDTO = z.infer<typeof PaginationSchema>;
```

**Pipe de validación**:
```typescript
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown) {
    try {
      return this.schema.parse(value);
    } catch (error) {
      throw new BadRequestException('Validation failed');
    }
  }
}
```

### 2.6 Documentación API: Swagger 7.x

**Configuración**:
```typescript
const config = new DocumentBuilder()
  .setTitle('API Documentation')
  .setDescription('REST API endpoints')
  .setVersion('1.0.0')
  .addBearerAuth({
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
  }, 'JWT-auth')
  .addTag('auth', 'Authentication')
  .addTag('entities', 'Entity CRUD')
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api/docs', app, document, {
  swaggerOptions: {
    persistAuthorization: true,
    tagsSorter: 'alpha',
    operationsSorter: 'alpha',
  },
});
```

**Decoradores en controllers**:
```typescript
@ApiTags('entities')
@Controller('entities')
@ApiBearerAuth('JWT-auth')
export class EntityController {
  
  @Post()
  @ApiOperation({ summary: 'Create entity' })
  @ApiBody({ type: CreateEntityDto })
  @ApiResponse({ status: 201, type: EntityResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  create(@Body() dto: CreateEntityDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List entities' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, type: [EntityResponseDto] })
  findAll(@Query() query: QueryDto) {
    return this.service.findAll(query);
  }
}
```

**DTOs documentados**:
```typescript
export class CreateEntityDto {
  @ApiProperty({ example: 'Example Name' })
  name: string;

  @ApiProperty({ example: 100.50, minimum: 0 })
  amount: number;

  @ApiProperty({ example: true, default: true })
  isActive: boolean;
}

export class EntityResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ type: Number })
  amount: number;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({ type: Date })
  createdAt: Date;
}
```

### 2.7 Autenticación: JWT + Passport

**Estrategia JWT**:
```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (request) => request?.cookies?.access_token,
      ]),
      secretOrKey: config.get('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    return {
      userId: payload.sub,
      email: payload.email,
      roles: payload.roles,
    };
  }
}
```

**Guards**:
```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!requiredRoles) return true;
    
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}
```

### 2.8 Cache y Queue: Redis + Bull

**Cache Manager**:
```typescript
CacheModule.registerAsync({
  isGlobal: true,
  useFactory: () => ({
    store: redisStore,
    host: 'localhost',
    port: 6379,
    ttl: 300,
  }),
}),
```

**Bull Queue**:
```typescript
BullModule.registerQueue({
  name: 'tasks',
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
  },
}),

@Processor('tasks')
export class TasksProcessor {
  @Process('heavy-task')
  async handle(job: Job<TaskData>) {
    await job.progress(50);
    // Process...
    return { success: true };
  }
}
```

### 2.9 Logging: Winston 3.x

**Configuración**:
```typescript
WinstonModule.forRoot({
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, context }) => {
          return `${timestamp} [${context}] ${level}: ${message}`;
        }),
      ),
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
    }),
  ],
}),
```

### 2.10 Generación de Documentos

**PDF (Puppeteer 21.x)**:
```typescript
@Injectable()
export class PdfService {
  async generateFromHtml(html: string): Promise<Buffer> {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.setContent(html);
    const pdf = await page.pdf({ format: 'A4' });
    await browser.close();
    return pdf;
  }
}
```

**Excel (ExcelJS 4.x)**:
```typescript
@Injectable()
export class ExcelService {
  async generate(data: any[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sheet 1');
    
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Name', key: 'name', width: 30 },
    ];
    
    worksheet.addRows(data);
    return (await workbook.xlsx.writeBuffer()) as Buffer;
  }
}
```

### 2.11 Testing Backend

**Jest (unitario)**:
```typescript
describe('EntityService', () => {
  let service: EntityService;
  let repository: MockType<Repository<Entity>>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        EntityService,
        {
          provide: getRepositoryToken(Entity),
          useFactory: mockRepository,
        },
      ],
    }).compile();

    service = module.get(EntityService);
    repository = module.get(getRepositoryToken(Entity));
  });

  it('should find all entities', async () => {
    repository.find.mockResolvedValue([{ id: '1', name: 'Test' }]);
    const result = await service.findAll();
    expect(result).toHaveLength(1);
  });
});
```

**Supertest (e2e)**:
```typescript
describe('EntityController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  it('/entities (GET)', () => {
    return request(app.getHttpServer())
      .get('/entities')
      .expect(200);
  });
});
```

---

## 3. Stack Frontend

### 3.1 Build Tool: Vite 5.x

**Configuración**:
```typescript
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-ui': ['@radix-ui/react-dialog'],
        },
      },
    },
  },
});
```

### 3.2 Framework: React 18.x + TypeScript 5.x

**Estructura de directorios**:
```
src/
├── app/
│   ├── App.tsx
│   └── router.tsx
│
├── pages/                   # Páginas principales
│   ├── auth/
│   ├── dashboard/
│   └── [other-pages]/
│
├── features/                # Features por dominio
│   ├── [feature-name]/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api/
│   │   ├── types/
│   │   └── schemas/
│
├── components/              # Componentes compartidos
│   ├── ui/                  # Shadcn components
│   ├── layout/
│   └── common/
│
├── lib/                     # Utilities
│   ├── api/
│   ├── utils/
│   └── cn.ts
│
├── hooks/                   # Global hooks
├── stores/                  # Zustand stores
├── types/                   # Global types
└── main.tsx
```

### 3.3 Routing: React Router DOM 6.x

```typescript
export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <ProtectedRoute><Layout /></ProtectedRoute>,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'entities', element: <EntitiesPage /> },
      { path: 'entities/:id', element: <EntityDetailPage /> },
    ],
  },
]);
```

### 3.4 Estilos: Tailwind CSS 3.x

**Configuración**:
```javascript
export default {
  darkMode: ['class'],
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {...},
        secondary: {...},
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    require('@tailwindcss/forms'),
  ],
};
```

### 3.5 Componentes UI: Shadcn/ui

**Componentes principales**:
- Button, Input, Label, Select
- Dialog, Table, Form, Toast
- Dropdown Menu, Tabs, Card
- Calendar, Popover, Command

**Instalación**:
```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add table
npx shadcn-ui@latest add form
```

### 3.6 Estado: React Query 5.x + Zustand 4.x

**React Query (datos del servidor)**:
```typescript
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: true,
    },
  },
});

export function useEntities(params: QueryParams) {
  return useQuery({
    queryKey: ['entities', params],
    queryFn: () => api.getAll(params),
  });
}

export function useCreateEntity() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entities'] });
      toast.success('Created successfully');
    },
  });
}
```

**Zustand (estado UI)**:
```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null, token: null }),
}));
```

### 3.7 Formularios: React Hook Form 7.x + Zod

```typescript
export function EntityForm({ onSubmit }: Props) {
  const form = useForm<EntityDTO>({
    resolver: zodResolver(EntitySchema),
    defaultValues: { name: '', amount: 0 },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
```

### 3.8 Tablas: TanStack Table 8.x

```typescript
export function DataTable<TData>({ columns, data }: Props) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((group) => (
            <TableRow key={group.id}>
              {group.headers.map((header) => (
                <TableHead key={header.id}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

### 3.9 HTTP Client: Axios 1.x

```typescript
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 30000,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### 3.10 Gráficos: Recharts 2.x

```typescript
export function LineChartComponent({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="value" stroke="#8884d8" />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

### 3.11 Utilidades

**date-fns 3.x**:
```typescript
import { format, parseISO, subDays } from 'date-fns';
import { es } from 'date-fns/locale';

export const formatDate = (date: Date | string) => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'dd/MM/yyyy', { locale: es });
};
```

**Formatters**:
```typescript
export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(value);
};
```

### 3.12 Notificaciones: Sonner 1.x

```typescript
import { toast } from 'sonner';

toast.success('Success message');
toast.error('Error message');
toast.promise(apiCall(), {
  loading: 'Loading...',
  success: 'Success!',
  error: 'Error!',
});
```

### 3.13 Testing Frontend

**Vitest 1.x + React Testing Library 14.x**:
```typescript
describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

---

## 4. Herramientas de Desarrollo

### 4.1 Linting y Formateo

**ESLint 8.x**:
```javascript
module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'prettier',
  ],
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  },
};
```

**Prettier 3.x**:
```json
{
  "semi": true,
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

**Husky + lint-staged**:
```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

### 4.2 Containerización: Docker

**Backend Dockerfile**:
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

**Docker Compose**:
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: ${DB_DATABASE}
      POSTGRES_USER: ${DB_USERNAME}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

  backend:
    build: ./backend
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
  redis_data:
```

---

## 5. Resumen del Stack

### Backend
| Tecnología | Versión | Propósito |
|-----------|---------|-----------|
| Node.js | 20 LTS | Runtime |
| NestJS | 10.x | Framework |
| TypeScript | 5.x | Lenguaje |
| TypeORM | 0.3.x | ORM |
| PostgreSQL | 14+ | Base de datos |
| Redis + Bull | 7.x / 4.x | Cache/Queue |
| Zod | 3.x | Validación |
| JWT + Passport | 10.x | Autenticación |
| Winston | 3.x | Logging |
| Swagger | 7.x | Documentación |
| Puppeteer | 21.x | PDF |
| ExcelJS | 4.x | Excel |
| Jest | 29.x | Testing |

### Frontend
| Tecnología | Versión | Propósito |
|-----------|---------|-----------|
| Vite | 5.x | Build Tool |
| React | 18.x | Framework |
| TypeScript | 5.x | Lenguaje |
| React Router | 6.x | Routing |
| Tailwind CSS | 3.x | Estilos |
| Shadcn/ui | Latest | Componentes |
| React Query | 5.x | Estado servidor |
| Zustand | 4.x | Estado UI |
| React Hook Form | 7.x | Formularios |
| TanStack Table | 8.x | Tablas |
| Axios | 1.x | HTTP Client |
| Recharts | 2.x | Gráficos |
| date-fns | 3.x | Fechas |
| Sonner | 1.x | Notificaciones |
| Vitest | 1.x | Testing |

---

## 6. Comandos Útiles

### Backend
```bash
npm run start:dev        # Desarrollo
npm run build            # Build
npm run test             # Tests
npm run test:cov         # Coverage
npm run migration:run    # Migraciones
```

### Frontend
```bash
npm run dev              # Desarrollo
npm run build            # Build
npm run test             # Tests
npm run lint             # Linting
```

### Docker
```bash
docker-compose up -d     # Iniciar servicios
docker-compose down      # Detener servicios
docker-compose logs -f   # Ver logs
```

---

## 7. Manejo de Fechas

### 7.1 Problema de Zona Horaria

**⚠️ CRÍTICO**: Nunca uses `new Date('YYYY-MM-DD')` directamente. JavaScript interpreta estas fechas como **medianoche UTC**, lo que puede causar que se muestren con un día de diferencia en zonas horarias detrás de UTC (ej: Argentina UTC-3).

### 7.2 Utilidades Centralizadas

El proyecto incluye utilidades centralizadas para prevenir problemas de zona horaria:

#### Frontend (`apps/frontend/src/lib/date-utils.ts`)

```typescript
import { 
    getTodayLocal, 
    parseLocalDate, 
    formatDateLocal,
    formatDateForDisplay,
    getCurrentMonthRange,
    getCurrentWeekRange,
    getTodayRange 
} from '@/lib/date-utils';

// ✅ Obtener fecha de hoy
const today = getTodayLocal(); // "2024-11-28"

// ✅ Parsear fecha desde string (EVITA problemas de zona horaria)
const date = parseLocalDate('2024-11-28');

// ✅ Formatear Date a string
const formatted = formatDateLocal(new Date());

// ✅ Formatear para mostrar en UI
const display = formatDateForDisplay('2024-11-28', 'short'); // "28/11/2024"
const displayLong = formatDateForDisplay('2024-11-28', 'long'); // "28 de noviembre, 2024"

// ✅ Rangos de fechas
const monthRange = getCurrentMonthRange();
const weekRange = getCurrentWeekRange();
const todayRange = getTodayRange();
```

#### Backend (`apps/backend/src/common/utils/date.utils.ts`)

```typescript
import { parseLocalDate, formatDateLocal, getTodayLocal } from '../../common/utils/date.utils';

// ✅ Parsear fecha desde DTO (SIEMPRE usar esto)
const expenseDate = parseLocalDate(dto.expenseDate);

// ✅ Formatear Date a string
const formatted = formatDateLocal(new Date());

// ✅ Obtener fecha de hoy
const today = getTodayLocal();
```

### 7.3 Reglas de Uso

#### ❌ NUNCA Hacer

```typescript
// Frontend
const today = new Date().toISOString().split('T')[0]; // ❌
const date = new Date('2024-11-28'); // ❌

// Backend
expenseDate: new Date(dto.expenseDate) // ❌
```

#### ✅ SIEMPRE Hacer

```typescript
// Frontend
import { getTodayLocal, parseLocalDate } from '@/lib/date-utils';
const today = getTodayLocal(); // ✅
const date = parseLocalDate('2024-11-28'); // ✅

// Backend
import { parseLocalDate } from '../../common/utils/date.utils';
expenseDate: parseLocalDate(dto.expenseDate) // ✅
```

### 7.4 Casos de Uso Comunes

#### Crear entidad con fecha

```typescript
// Backend Service
async create(dto: CreateEntityDto) {
    const entity = this.repo.create({
        dateField: parseLocalDate(dto.dateField), // ✅
        // ...
    });
    return this.repo.save(entity);
}
```

#### Formulario con fecha por defecto

```typescript
// Frontend Component
import { getTodayLocal } from '@/lib/date-utils';

const form = useForm({
    defaultValues: {
        dateField: getTodayLocal(), // ✅
        // ...
    },
});
```

#### Filtrar por rango de fechas

```typescript
// Frontend Component
import { getCurrentMonthRange } from '@/lib/date-utils';

const [filters, setFilters] = useState({
    ...getCurrentMonthRange(), // ✅
});
```

#### Mostrar fecha en UI

```typescript
// Frontend Component
import { formatDateForDisplay } from '@/lib/date-utils';

<span>{formatDateForDisplay(expense.date, 'short')}</span> // ✅
```

### 7.5 Documentación Completa

- **Frontend**: Ver `apps/frontend/src/lib/date-utils.README.md`
- **Backend**: Ver `apps/backend/src/common/utils/date.utils.README.md`

### 7.6 Cuándo NO Usar Estas Utilidades

- ✅ **SÍ usar** para campos de tipo `date` (solo fecha, sin hora)
- ✅ **SÍ usar** para parsear strings `YYYY-MM-DD` desde DTOs
- ❌ **NO usar** para timestamps completos (`createdAt`, `updatedAt`) - estos ya vienen correctos del ORM
- ❌ **NO usar** para fechas que ya son objetos `Date` - úsalas directamente
- ❌ **NO usar** para cálculos de tiempo/hora - usa Date nativo

---

## 8. Mejores Prácticas

### Código
- TypeScript strict mode
- Validación dual (frontend + backend)
- Principios SOLID
- Tests para lógica crítica
- Nombres descriptivos

### Seguridad
- No commitear secrets
- Variables de entorno
- Rate limiting
- Validación de inputs
- HTTPS en producción
- HttpOnly cookies

### Rendimiento
- Paginación en listados
- Índices en DB
- Caching estratégico
- Code splitting
- Lazy loading

### Mantenibilidad
- Estructura consistente
- Separación de concerns
- Código autodocumentado
- Logging adecuado
- Dependencias actualizadas

---

**Documento para desarrollo asistido por IA - Sin referencias al dominio del problema**