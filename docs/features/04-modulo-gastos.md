# Módulo: Gastos

## 1. Descripción y Objetivo

### 1.1 Descripción
El módulo de Gastos permite registrar y categorizar todos los gastos generales del negocio que no están relacionados con compras de mercadería. Incluye gastos como alquiler, servicios (luz, agua, gas, internet), impuestos, salarios, mantenimiento, publicidad, etc.

### 1.2 Objetivo
- Registrar todos los gastos operativos del negocio
- Categorizar gastos para mejor análisis
- Controlar egresos de dinero
- Facilitar la generación de reportes financieros
- Calcular costos operativos por período
- Identificar gastos recurrentes

### 1.3 Funcionalidades Principales
- CRUD completo de gastos
- Categorización de gastos
- Registro de fecha y monto
- Adjuntar comprobantes (opcional)
- Búsqueda y filtrado por múltiples criterios
- Marcado de gastos recurrentes
- Estadísticas de gastos por categoría y período

---

## 2. Modelo de Datos

### 2.1 Entidades

#### **ExpenseCategory (Categoría de Gasto)**
```typescript
@Entity('expense_categories')
export class ExpenseCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  name: string; // Ej: "Alquiler", "Servicios", "Salarios"

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'boolean', default: false })
  isRecurring: boolean; // Si es un gasto recurrente típico

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
```

#### **Expense (Gasto)**
```typescript
enum PaymentMethod {
  CASH = 'cash',
  TRANSFER = 'transfer',
  DEBIT_CARD = 'debit_card',
  CREDIT_CARD = 'credit_card',
  CHECK = 'check',
  OTHER = 'other'
}

@Entity('expenses')
export class Expense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  description: string; // Descripción del gasto

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number; // Monto del gasto

  @Column({ type: 'date' })
  expenseDate: Date; // Fecha del gasto

  @ManyToOne(() => ExpenseCategory)
  @JoinColumn({ name: 'category_id' })
  category: ExpenseCategory;

  @Column({ type: 'enum', enum: PaymentMethod, nullable: true })
  paymentMethod: PaymentMethod;

  @Column({ type: 'varchar', length: 100, nullable: true })
  receiptNumber: string; // Número de comprobante/factura

  @Column({ type: 'boolean', default: true })
  isPaid: boolean; // Si está pagado o no

  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date; // Fecha de pago

  @Column({ type: 'text', nullable: true })
  notes: string; // Notas adicionales

  @Column({ type: 'boolean', default: false })
  isRecurring: boolean; // Si es un gasto recurrente

  @Column({ type: 'varchar', length: 500, nullable: true })
  attachmentUrl: string; // URL del comprobante adjunto (opcional)

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
```

### 2.2 Relaciones
- **Expense** N:1 **ExpenseCategory** (muchos gastos por categoría)
- **Expense** N:1 **User** (usuario que registró el gasto)

---

## 3. Backend (NestJS)

### 3.1 Estructura de Carpetas
```
src/
└── expenses/
    ├── entities/
    │   ├── expense.entity.ts
    │   └── expense-category.entity.ts
    ├── dto/
    │   ├── create-expense.dto.ts
    │   ├── update-expense.dto.ts
    │   ├── create-expense-category.dto.ts
    │   ├── update-expense-category.dto.ts
    │   ├── expense-filters.dto.ts
    │   └── expense-stats.dto.ts
    ├── expenses.controller.ts
    ├── expenses.service.ts
    ├── expense-categories.controller.ts
    ├── expense-categories.service.ts
    └── expenses.module.ts
```

### 3.2 DTOs

#### **create-expense-category.dto.ts**
```typescript
import { IsString, IsNotEmpty, IsOptional, IsBoolean, MaxLength } from 'class-validator';

export class CreateExpenseCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsBoolean()
  @IsOptional()
  isRecurring?: boolean;
}
```

#### **create-expense.dto.ts**
```typescript
import { IsString, IsNotEmpty, IsNumber, IsDate, IsEnum, IsOptional, IsBoolean, Min, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateExpenseDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  description: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsDate()
  @Type(() => Date)
  expenseDate: Date;

  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  receiptNumber?: string;

  @IsBoolean()
  @IsOptional()
  isPaid?: boolean; // Default: true

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  paidAt?: Date;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  notes?: string;

  @IsBoolean()
  @IsOptional()
  isRecurring?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  attachmentUrl?: string;
}
```

#### **update-expense.dto.ts**
```typescript
import { PartialType } from '@nestjs/mapped-types';
import { CreateExpenseDto } from './create-expense.dto';

export class UpdateExpenseDto extends PartialType(CreateExpenseDto) {}
```

#### **expense-filters.dto.ts**
```typescript
import { IsOptional, IsString, IsDate, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class ExpenseFiltersDto {
  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;

  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;
}
```

### 3.3 Service (expenses.service.ts)

```typescript
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like } from 'typeorm';
import { Expense, ExpenseCategory } from './entities';
import { CreateExpenseDto, UpdateExpenseDto, ExpenseFiltersDto } from './dto';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private expenseRepo: Repository<Expense>,
    @InjectRepository(ExpenseCategory)
    private categoryRepo: Repository<ExpenseCategory>,
  ) {}

  async create(dto: CreateExpenseDto, userId: string): Promise<Expense> {
    // Validar que la categoría existe
    const category = await this.categoryRepo.findOne({
      where: { id: dto.categoryId }
    });

    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }

    // Crear gasto
    const expense = this.expenseRepo.create({
      ...dto,
      category,
      isPaid: dto.isPaid !== undefined ? dto.isPaid : true,
      paidAt: dto.isPaid ? (dto.paidAt || dto.expenseDate) : null,
      createdBy: { id: userId } as any,
    });

    return this.expenseRepo.save(expense);
  }

  async findAll(filters?: ExpenseFiltersDto) {
    const query = this.expenseRepo.createQueryBuilder('expense')
      .leftJoinAndSelect('expense.category', 'category')
      .leftJoinAndSelect('expense.createdBy', 'user')
      .orderBy('expense.expenseDate', 'DESC');

    if (filters?.categoryId) {
      query.andWhere('expense.category.id = :categoryId', {
        categoryId: filters.categoryId
      });
    }

    if (filters?.description) {
      query.andWhere('expense.description ILIKE :description', {
        description: `%${filters.description}%`
      });
    }

    if (filters?.startDate && filters?.endDate) {
      query.andWhere('expense.expenseDate BETWEEN :start AND :end', {
        start: filters.startDate,
        end: filters.endDate
      });
    }

    if (filters?.isPaid !== undefined) {
      query.andWhere('expense.isPaid = :isPaid', { isPaid: filters.isPaid });
    }

    if (filters?.isRecurring !== undefined) {
      query.andWhere('expense.isRecurring = :isRecurring', {
        isRecurring: filters.isRecurring
      });
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<Expense> {
    const expense = await this.expenseRepo.findOne({
      where: { id },
      relations: ['category', 'createdBy']
    });

    if (!expense) {
      throw new NotFoundException(`Gasto con ID ${id} no encontrado`);
    }

    return expense;
  }

  async update(id: string, dto: UpdateExpenseDto): Promise<Expense> {
    const expense = await this.findOne(id);

    // Si cambia la categoría, validar que existe
    if (dto.categoryId && dto.categoryId !== expense.category.id) {
      const category = await this.categoryRepo.findOne({
        where: { id: dto.categoryId }
      });

      if (!category) {
        throw new NotFoundException('Categoría no encontrada');
      }

      expense.category = category;
    }

    Object.assign(expense, dto);

    // Si se marca como pagado y no tiene paidAt, usar la fecha del gasto
    if (dto.isPaid && !expense.paidAt) {
      expense.paidAt = expense.expenseDate;
    }

    return this.expenseRepo.save(expense);
  }

  async remove(id: string): Promise<void> {
    const expense = await this.findOne(id);
    await this.expenseRepo.softDelete(id);
  }

  // Estadísticas
  async getStats(startDate?: Date, endDate?: Date) {
    const query = this.expenseRepo.createQueryBuilder('expense')
      .leftJoinAndSelect('expense.category', 'category');

    if (startDate && endDate) {
      query.where('expense.expenseDate BETWEEN :start AND :end', {
        start: startDate,
        end: endDate
      });
    }

    const expenses = await query.getMany();

    const totalExpenses = expenses.length;
    const totalAmount = expenses
      .filter(e => e.isPaid)
      .reduce((sum, e) => sum + Number(e.amount), 0);

    const totalPending = expenses
      .filter(e => !e.isPaid)
      .reduce((sum, e) => sum + Number(e.amount), 0);

    // Gastos por categoría
    const byCategory = expenses.reduce((acc, e) => {
      if (!e.isPaid) return acc;

      const categoryName = e.category.name;
      if (!acc[categoryName]) {
        acc[categoryName] = { count: 0, total: 0 };
      }
      acc[categoryName].count++;
      acc[categoryName].total += Number(e.amount);
      return acc;
    }, {});

    return {
      totalExpenses,
      totalAmount,
      totalPending,
      byCategory: Object.entries(byCategory).map(([name, data]: [string, any]) => ({
        categoryName: name,
        count: data.count,
        total: data.total
      })).sort((a, b) => b.total - a.total)
    };
  }

  // Gastos recurrentes
  async getRecurringExpenses() {
    return this.expenseRepo.find({
      where: { isRecurring: true },
      relations: ['category'],
      order: { expenseDate: 'DESC' }
    });
  }
}
```

### 3.4 Service (expense-categories.service.ts)

```typescript
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExpenseCategory } from './entities';
import { CreateExpenseCategoryDto, UpdateExpenseCategoryDto } from './dto';

@Injectable()
export class ExpenseCategoriesService {
  constructor(
    @InjectRepository(ExpenseCategory)
    private categoryRepo: Repository<ExpenseCategory>,
  ) {}

  async create(dto: CreateExpenseCategoryDto): Promise<ExpenseCategory> {
    // Verificar que no existe una categoría con ese nombre
    const existing = await this.categoryRepo.findOne({
      where: { name: dto.name }
    });

    if (existing) {
      throw new ConflictException('Ya existe una categoría con ese nombre');
    }

    const category = this.categoryRepo.create(dto);
    return this.categoryRepo.save(category);
  }

  async findAll() {
    return this.categoryRepo.find({
      where: { active: true },
      order: { name: 'ASC' }
    });
  }

  async findOne(id: string): Promise<ExpenseCategory> {
    const category = await this.categoryRepo.findOne({ where: { id } });

    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }

    return category;
  }

  async update(id: string, dto: UpdateExpenseCategoryDto): Promise<ExpenseCategory> {
    const category = await this.findOne(id);

    // Si cambia el nombre, verificar que no existe otra con ese nombre
    if (dto.name && dto.name !== category.name) {
      const existing = await this.categoryRepo.findOne({
        where: { name: dto.name }
      });

      if (existing) {
        throw new ConflictException('Ya existe una categoría con ese nombre');
      }
    }

    Object.assign(category, dto);
    return this.categoryRepo.save(category);
  }

  async remove(id: string): Promise<void> {
    const category = await this.findOne(id);
    await this.categoryRepo.softDelete(id);
  }

  async seed() {
    const defaultCategories = [
      { name: 'Alquiler', description: 'Alquiler del local', isRecurring: true },
      { name: 'Servicios', description: 'Luz, agua, gas, internet', isRecurring: true },
      { name: 'Salarios', description: 'Sueldos del personal', isRecurring: true },
      { name: 'Impuestos', description: 'Impuestos varios', isRecurring: true },
      { name: 'Mantenimiento', description: 'Reparaciones y mantenimiento', isRecurring: false },
      { name: 'Publicidad', description: 'Gastos de marketing y publicidad', isRecurring: false },
      { name: 'Transporte', description: 'Combustible, transporte', isRecurring: false },
      { name: 'Seguros', description: 'Seguros varios', isRecurring: true },
      { name: 'Otros', description: 'Gastos varios no categorizados', isRecurring: false },
    ];

    for (const cat of defaultCategories) {
      const existing = await this.categoryRepo.findOne({
        where: { name: cat.name }
      });

      if (!existing) {
        await this.categoryRepo.save(this.categoryRepo.create(cat));
      }
    }

    return { message: 'Categorías iniciales creadas' };
  }
}
```

### 3.5 Controllers

#### **expenses.controller.ts**
```typescript
import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto, UpdateExpenseDto, ExpenseFiltersDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('expenses')
@UseGuards(JwtAuthGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  create(@Body() dto: CreateExpenseDto, @Request() req) {
    return this.expensesService.create(dto, req.user.id);
  }

  @Get()
  findAll(@Query() filters: ExpenseFiltersDto) {
    return this.expensesService.findAll(filters);
  }

  @Get('stats')
  getStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.expensesService.getStats(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
  }

  @Get('recurring')
  getRecurring() {
    return this.expensesService.getRecurringExpenses();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.expensesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateExpenseDto) {
    return this.expensesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.expensesService.remove(id);
  }
}
```

#### **expense-categories.controller.ts**
```typescript
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ExpenseCategoriesService } from './expense-categories.service';
import { CreateExpenseCategoryDto, UpdateExpenseCategoryDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('expense-categories')
@UseGuards(JwtAuthGuard)
export class ExpenseCategoriesController {
  constructor(private readonly categoriesService: ExpenseCategoriesService) {}

  @Post()
  create(@Body() dto: CreateExpenseCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateExpenseCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }

  @Post('seed')
  seed() {
    return this.categoriesService.seed();
  }
}
```

### 3.6 Module (expenses.module.ts)

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpensesService } from './expenses.service';
import { ExpenseCategoriesService } from './expense-categories.service';
import { ExpensesController } from './expenses.controller';
import { ExpenseCategoriesController } from './expense-categories.controller';
import { Expense, ExpenseCategory } from './entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([Expense, ExpenseCategory]),
  ],
  controllers: [ExpensesController, ExpenseCategoriesController],
  providers: [ExpensesService, ExpenseCategoriesService],
  exports: [ExpensesService],
})
export class ExpensesModule {}
```

---

## 4. Frontend (React)

### 4.1 Hooks

#### **useExpenses.ts**
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expensesApi } from '../api/expenses.api';
import { toast } from 'sonner';

export function useExpenses(filters?: any) {
  return useQuery({
    queryKey: ['expenses', filters],
    queryFn: () => expensesApi.getAll(filters),
  });
}

export function useExpense(id: string) {
  return useQuery({
    queryKey: ['expense', id],
    queryFn: () => expensesApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: expensesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Gasto registrado exitosamente');
    },
  });
}

export function useExpenseCategories() {
  return useQuery({
    queryKey: ['expense-categories'],
    queryFn: () => expensesApi.getCategories(),
  });
}

export function useExpenseStats(startDate?: Date, endDate?: Date) {
  return useQuery({
    queryKey: ['expense-stats', startDate, endDate],
    queryFn: () => expensesApi.getStats(startDate, endDate),
  });
}
```

### 4.2 Página Principal

```tsx
import React, { useState } from 'react';
import { Plus, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useExpenses, useExpenseStats } from '../hooks/useExpenses';
import { CreateExpenseDialog } from '../components/CreateExpenseDialog';
import { ExpenseTable } from '../components/ExpenseTable';
import { formatCurrency } from '@/lib/utils';

export function ExpensesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: expenses, isLoading } = useExpenses();
  const { data: stats } = useExpenseStats();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gastos</h1>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Gasto
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Gastos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.totalAmount || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.totalExpenses || 0} gastos registrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(stats?.totalPending || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Top Categorías</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats?.byCategory?.slice(0, 3).map((cat) => (
                <div key={cat.categoryName} className="flex justify-between text-sm">
                  <span>{cat.categoryName}</span>
                  <span className="font-medium">{formatCurrency(cat.total)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Listado de Gastos</CardTitle>
        </CardHeader>
        <CardContent>
          <ExpenseTable expenses={expenses || []} isLoading={isLoading} />
        </CardContent>
      </Card>

      <CreateExpenseDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
```

---

## 5. Casos de Uso

### 5.1 Registrar Nuevo Gasto

**Flujo principal**:
1. Usuario hace clic en "Nuevo Gasto"
2. Selecciona categoría
3. Ingresa descripción y monto
4. Selecciona fecha del gasto
5. Marca si está pagado o pendiente
6. Opcionalmente: adjunta comprobante, marca como recurrente
7. Sistema guarda el gasto

**Validaciones**:
- Monto debe ser mayor a 0
- Categoría obligatoria
- Si está pagado, fecha de pago no puede ser anterior a fecha del gasto

### 5.2 Consultar Gastos por Período

**Flujo**:
1. Usuario selecciona rango de fechas
2. Sistema calcula total de gastos pagados
3. Sistema muestra desglose por categoría
4. Usuario puede filtrar por categoría específica

### 5.3 Marcar Gasto como Pagado

**Flujo**:
1. Usuario busca gasto pendiente
2. Hace clic en "Marcar como Pagado"
3. Sistema registra fecha de pago
4. Actualiza estado a pagado

---

## 6. Consideraciones Técnicas

### 6.1 Categorías Predefinidas

El sistema incluye categorías por defecto:
- Alquiler (recurrente)
- Servicios (recurrente)
- Salarios (recurrente)
- Impuestos (recurrente)
- Mantenimiento
- Publicidad
- Transporte
- Seguros (recurrente)
- Otros

**Endpoint de seed**: `POST /expense-categories/seed`

### 6.2 Gastos Recurrentes

Los gastos marcados como recurrentes:
- Aparecen en sección especial
- Útil para identificar gastos mensuales
- Base para recordatorios futuros

### 6.3 Reportes

- Total por período
- Total por categoría
- Gastos mensuales comparados
- Promedio mensual de gastos

### 6.4 Integraciones Futuras

#### Con Módulo de Caja:
```typescript
// Registrar egreso al pagar gasto
await cashService.registerExpense({
  amount: expense.amount,
  referenceId: expense.id,
  date: expense.paidAt
});
```

#### Con Módulo de Reportes:
- Incluir gastos en cálculo de resultado
- Análisis de rentabilidad
- Proyección de gastos

---

## 7. Próximos Pasos

1. ✅ CRUD completo de gastos y categorías
2. ✅ Estadísticas por período y categoría
3. ⏳ Recordatorios de gastos recurrentes
4. ⏳ Adjuntar archivos/comprobantes
5. ⏳ Exportación a Excel/PDF
6. ⏳ Dashboard de gastos con gráficos
7. ⏳ Alertas de gastos superiores al promedio
8. ⏳ Integración con módulo de Caja
9. ⏳ Proyección de gastos mensuales

---

**Módulo de Gastos completo - ready para desarrollo** 🚀
