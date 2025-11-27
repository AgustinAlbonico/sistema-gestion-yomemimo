# Módulo: Compras

## 1. Descripción y Objetivo

### 1.1 Descripción
El módulo de Compras permite registrar todas las compras de mercadería realizadas a proveedores. Cada compra actualiza automáticamente el inventario de productos y registra el egreso de dinero. Los proveedores se manejan como texto simple sin necesidad de crear entidades separadas.

### 1.2 Objetivo
- Registrar compras de mercadería
- Actualizar automáticamente el stock de productos
- Controlar egresos de dinero por compras
- Mantener historial de compras
- Facilitar el cálculo de costos y márgenes
- Generar reportes de compras por período

### 1.3 Funcionalidades Principales
- Registro de compras con múltiples productos
- Proveedor como campo de texto
- Actualización automática de inventario
- Cálculo automático de totales
- Búsqueda y filtrado de compras
- Estadísticas de compras
- Historial de precios de compra

---

## 2. Modelo de Datos

### 2.1 Entidades

#### **Purchase (Compra)**
```typescript
enum PurchaseStatus {
  PENDING = 'pending',      // Pendiente de pago
  PAID = 'paid',           // Pagada
  PARTIAL = 'partial',     // Pago parcial
  CANCELLED = 'cancelled'  // Cancelada
}

enum PaymentMethod {
  CASH = 'cash',
  TRANSFER = 'transfer',
  DEBIT_CARD = 'debit_card',
  CREDIT_CARD = 'credit_card',
  CHECK = 'check',
  OTHER = 'other'
}

@Entity('purchases')
export class Purchase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  purchaseNumber: string; // Ej: "COMP-2024-00001"

  @Column({ type: 'varchar', length: 200 })
  providerName: string; // Nombre del proveedor (texto simple)

  @Column({ type: 'varchar', length: 100, nullable: true })
  providerDocument: string; // DNI/CUIT del proveedor (opcional)

  @Column({ type: 'varchar', length: 100, nullable: true })
  providerPhone: string; // Teléfono de contacto

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  purchaseDate: Date; // Fecha de la compra

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  subtotal: number; // Suma de todos los items

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  tax: number; // IVA u otros impuestos

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  discount: number; // Descuento aplicado

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  total: number; // subtotal + tax - discount

  @Column({ type: 'enum', enum: PurchaseStatus, default: PurchaseStatus.PENDING })
  status: PurchaseStatus;

  @Column({ type: 'enum', enum: PaymentMethod, nullable: true })
  paymentMethod: PaymentMethod;

  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date; // Fecha de pago

  @Column({ type: 'varchar', length: 100, nullable: true })
  invoiceNumber: string; // Número de factura del proveedor

  @Column({ type: 'text', nullable: true })
  notes: string; // Observaciones

  @Column({ type: 'boolean', default: false })
  inventoryUpdated: boolean; // Flag para saber si ya se actualizó el stock

  // Relaciones
  @OneToMany(() => PurchaseItem, item => item.purchase, { cascade: true })
  items: PurchaseItem[];

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  // Métodos virtuales
  @AfterLoad()
  calculateTotals() {
    if (this.items && this.items.length > 0) {
      this.subtotal = this.items.reduce((sum, item) => 
        sum + (item.quantity * item.unitPrice), 0
      );
      this.total = this.subtotal + this.tax - this.discount;
    }
  }
}
```

#### **PurchaseItem (Item de Compra)**
```typescript
@Entity('purchase_items')
export class PurchaseItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Purchase, purchase => purchase.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'purchase_id' })
  purchase: Purchase;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'int' })
  quantity: number; // Cantidad comprada

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number; // Precio unitario de compra

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  subtotal: number; // quantity * unitPrice

  @Column({ type: 'text', nullable: true })
  notes: string; // Notas del item

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Calcular subtotal antes de insertar/actualizar
  @BeforeInsert()
  @BeforeUpdate()
  calculateSubtotal() {
    this.subtotal = this.quantity * this.unitPrice;
  }
}
```

### 2.2 Relaciones
- **Purchase** 1:N **PurchaseItem** (una compra tiene muchos items)
- **PurchaseItem** N:1 **Product** (cada item pertenece a un producto)
- **Purchase** N:1 **User** (creada por un usuario)

---

## 3. Backend (NestJS)

### 3.1 Estructura de Carpetas
```
src/
└── purchases/
    ├── entities/
    │   ├── purchase.entity.ts
    │   └── purchase-item.entity.ts
    ├── dto/
    │   ├── create-purchase.dto.ts
    │   ├── update-purchase.dto.ts
    │   ├── create-purchase-item.dto.ts
    │   ├── purchase-filters.dto.ts
    │   └── purchase-stats.dto.ts
    ├── purchases.controller.ts
    ├── purchases.service.ts
    └── purchases.module.ts
```

### 3.2 DTOs

#### **create-purchase.dto.ts**
```typescript
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, IsArray, ValidateNested, Min, IsDate, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePurchaseItemDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;
}

export class CreatePurchaseDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  providerName: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  providerDocument?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  providerPhone?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  purchaseDate?: Date; // Default: now

  @IsNumber()
  @Min(0)
  @IsOptional()
  tax?: number; // Default: 0

  @IsNumber()
  @Min(0)
  @IsOptional()
  discount?: number; // Default: 0

  @IsEnum(PurchaseStatus)
  @IsOptional()
  status?: PurchaseStatus; // Default: PENDING

  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  paidAt?: Date;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  invoiceNumber?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseItemDto)
  items: CreatePurchaseItemDto[];
}
```

#### **update-purchase.dto.ts**
```typescript
import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreatePurchaseDto } from './create-purchase.dto';

export class UpdatePurchaseDto extends PartialType(
  OmitType(CreatePurchaseDto, ['items'] as const)
) {
  // No se pueden modificar items después de crear la compra
  // Si necesita modificar, debe cancelar y crear una nueva
}
```

#### **purchase-filters.dto.ts**
```typescript
import { IsOptional, IsString, IsEnum, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class PurchaseFiltersDto {
  @IsOptional()
  @IsString()
  providerName?: string;

  @IsOptional()
  @IsEnum(PurchaseStatus)
  status?: PurchaseStatus;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @IsOptional()
  @IsString()
  invoiceNumber?: string;

  @IsOptional()
  @IsString()
  productId?: string; // Filtrar por compras que incluyan este producto
}
```

### 3.3 Service (purchases.service.ts) - Simplificado

```typescript
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Purchase, PurchaseItem } from './entities';
import { CreatePurchaseDto, UpdatePurchaseDto, PurchaseFiltersDto } from './dto';
import { InventoryService } from '../inventory/inventory.service';
import { ProductsService } from '../products/products.service';

@Injectable()
export class PurchasesService {
  constructor(
    @InjectRepository(Purchase)
    private purchaseRepo: Repository<Purchase>,
    @InjectRepository(PurchaseItem)
    private purchaseItemRepo: Repository<PurchaseItem>,
    private inventoryService: InventoryService,
    private productsService: ProductsService,
  ) {}

  async create(dto: CreatePurchaseDto, userId: string): Promise<Purchase> {
    // Validar que todos los productos existan
    for (const item of dto.items) {
      await this.productsService.findOne(item.productId);
    }

    // Generar número de compra
    const purchaseNumber = await this.generatePurchaseNumber();

    // Crear compra con items
    const purchase = this.purchaseRepo.create({
      ...dto,
      purchaseNumber,
      purchaseDate: dto.purchaseDate || new Date(),
      createdBy: { id: userId } as any,
      items: dto.items.map(item => 
        this.purchaseItemRepo.create({
          product: { id: item.productId } as any,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          notes: item.notes,
        })
      ),
    });

    // Calcular totales
    const subtotal = purchase.items.reduce(
      (sum, item) => sum + (item.quantity * item.unitPrice), 0
    );
    purchase.subtotal = subtotal;
    purchase.total = subtotal + (dto.tax || 0) - (dto.discount || 0);

    // Guardar
    const saved = await this.purchaseRepo.save(purchase);

    // Actualizar inventario si está pagado
    if (dto.status === PurchaseStatus.PAID) {
      await this.updateInventoryFromPurchase(saved.id);
    }

    return this.findOne(saved.id);
  }

  async findAll(filters?: PurchaseFiltersDto) {
    const query = this.purchaseRepo.createQueryBuilder('purchase')
      .leftJoinAndSelect('purchase.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('purchase.createdBy', 'user')
      .orderBy('purchase.purchaseDate', 'DESC');

    if (filters?.providerName) {
      query.andWhere('purchase.providerName ILIKE :provider', {
        provider: `%${filters.providerName}%`
      });
    }

    if (filters?.status) {
      query.andWhere('purchase.status = :status', { status: filters.status });
    }

    if (filters?.startDate && filters?.endDate) {
      query.andWhere('purchase.purchaseDate BETWEEN :start AND :end', {
        start: filters.startDate,
        end: filters.endDate
      });
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<Purchase> {
    const purchase = await this.purchaseRepo.findOne({
      where: { id },
      relations: ['items', 'items.product', 'createdBy']
    });

    if (!purchase) {
      throw new NotFoundException(`Compra con ID ${id} no encontrada`);
    }

    return purchase;
  }

  async update(id: string, dto: UpdatePurchaseDto): Promise<Purchase> {
    const purchase = await this.findOne(id);

    if (purchase.status === PurchaseStatus.CANCELLED) {
      throw new BadRequestException('No se puede modificar una compra cancelada');
    }

    // Actualizar inventario si cambia a PAID
    if (dto.status === PurchaseStatus.PAID && !purchase.inventoryUpdated) {
      await this.updateInventoryFromPurchase(id);
    }

    Object.assign(purchase, dto);

    // Recalcular total si cambian tax o discount
    if (dto.tax !== undefined || dto.discount !== undefined) {
      purchase.total = purchase.subtotal + (purchase.tax || 0) - (purchase.discount || 0);
    }

    return this.purchaseRepo.save(purchase);
  }

  async cancel(id: string): Promise<Purchase> {
    const purchase = await this.findOne(id);

    if (purchase.inventoryUpdated) {
      throw new BadRequestException(
        'No se puede cancelar una compra que ya actualizó el inventario'
      );
    }

    purchase.status = PurchaseStatus.CANCELLED;
    return this.purchaseRepo.save(purchase);
  }

  async remove(id: string): Promise<void> {
    const purchase = await this.findOne(id);

    if (purchase.inventoryUpdated) {
      throw new BadRequestException(
        'No se puede eliminar una compra que ya actualizó el inventario'
      );
    }

    await this.purchaseRepo.softDelete(id);
  }

  // Actualizar inventario desde compra
  async updateInventoryFromPurchase(purchaseId: string): Promise<void> {
    const purchase = await this.findOne(purchaseId);

    if (purchase.inventoryUpdated) {
      throw new BadRequestException('El inventario ya fue actualizado');
    }

    // Actualizar stock de cada producto
    for (const item of purchase.items) {
      await this.inventoryService.addStockFromPurchase({
        productId: item.product.id,
        quantity: item.quantity,
        purchaseId: purchase.id,
        unitCost: item.unitPrice,
      });
    }

    purchase.inventoryUpdated = true;
    await this.purchaseRepo.save(purchase);
  }

  // Generar número de compra único
  private async generatePurchaseNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.purchaseRepo.count({
      where: { purchaseNumber: Like(`COMP-${year}-%`) }
    });
    
    const nextNumber = (count + 1).toString().padStart(5, '0');
    return `COMP-${year}-${nextNumber}`;
  }

  // Estadísticas
  async getStats(startDate?: Date, endDate?: Date) {
    const query = this.purchaseRepo.createQueryBuilder('purchase');

    if (startDate && endDate) {
      query.where('purchase.purchaseDate BETWEEN :start AND :end', {
        start: startDate, end: endDate
      });
    }

    const [purchases, totalPurchases] = await query.getManyAndCount();

    const totalAmount = purchases
      .filter(p => p.status !== PurchaseStatus.CANCELLED)
      .reduce((sum, p) => sum + Number(p.total), 0);

    const totalPaid = purchases
      .filter(p => p.status === PurchaseStatus.PAID)
      .reduce((sum, p) => sum + Number(p.total), 0);

    const totalPending = purchases
      .filter(p => p.status === PurchaseStatus.PENDING)
      .reduce((sum, p) => sum + Number(p.total), 0);

    return {
      totalPurchases,
      totalAmount,
      totalPaid,
      totalPending,
    };
  }
}
```

### 3.4 Controller

```typescript
import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { PurchasesService } from './purchases.service';
import { CreatePurchaseDto, UpdatePurchaseDto, PurchaseFiltersDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('purchases')
@UseGuards(JwtAuthGuard)
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Post()
  create(@Body() dto: CreatePurchaseDto, @Request() req) {
    return this.purchasesService.create(dto, req.user.id);
  }

  @Get()
  findAll(@Query() filters: PurchaseFiltersDto) {
    return this.purchasesService.findAll(filters);
  }

  @Get('stats')
  getStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.purchasesService.getStats(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.purchasesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePurchaseDto) {
    return this.purchasesService.update(id, dto);
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.purchasesService.cancel(id);
  }

  @Patch(':id/update-inventory')
  updateInventory(@Param('id') id: string) {
    return this.purchasesService.updateInventoryFromPurchase(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.purchasesService.remove(id);
  }
}
```

---

## 4. Frontend (React) - Simplificado

### 4.1 Hook Principal

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { purchasesApi } from '../api/purchases.api';
import { toast } from 'sonner';

export function usePurchases(filters?: any) {
  return useQuery({
    queryKey: ['purchases', filters],
    queryFn: () => purchasesApi.getAll(filters),
  });
}

export function useCreatePurchase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: purchasesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Compra registrada exitosamente');
    },
  });
}
```

---

## 5. Casos de Uso

### 5.1 Registrar Nueva Compra

**Flujo principal**:
1. Usuario ingresa datos del proveedor
2. Usuario agrega productos con cantidad y precio
3. Sistema calcula subtotales automáticamente
4. Usuario selecciona estado (Pendiente/Pagado)
5. Si está pagado, sistema actualiza inventario automáticamente

**Reglas**:
- Mínimo 1 item por compra
- Número de compra: COMP-YYYY-NNNNN
- Estado default: Pendiente

### 5.2 Pagar Compra Pendiente

**Flujo**:
1. Usuario marca compra como "Pagada"
2. Sistema actualiza inventario
3. Sistema registra fecha de pago

### 5.3 Cancelar Compra

**Validación**: No se puede cancelar si el inventario ya fue actualizado

---

## 6. Consideraciones Técnicas

### 6.1 Actualización de Inventario

Cuando se marca como "Pagado":
1. Incrementa stock de cada producto
2. Actualiza costo promedio
3. Registra movimiento de inventario

### 6.2 Cálculo de Costo Promedio

```
nuevoCosto = (stockActual * costoActual + cantCompra * precioCompra) / (stockActual + cantCompra)
```

### 6.3 Proveedores como Texto

**Ventajas**: Simple, rápido, sin CRUD extra
**Futuro**: Autocompletado de proveedores previos

---

## 7. Próximos Pasos

1. ✅ CRUD completo
2. ✅ Actualización automática de inventario
3. ⏳ Autocompletado de proveedores
4. ⏳ Reportes por proveedor
5. ⏳ Integración con Caja

---

**Módulo de Compras completo - ready para desarrollo** 🚀
