# Módulo: Ventas

## 1. Descripción y Objetivo

### 1.1 Descripción
El módulo de Ventas es el núcleo del sistema comercial. Permite registrar ventas de productos con múltiples formas de pago (efectivo, tarjeta, transferencia), gestionar ventas en cuenta corriente, aplicar descuentos, y controlar el stock automáticamente. Incluye un punto de venta (POS) optimizado para operaciones rápidas.

### 1.2 Objetivo
- Registrar ventas de manera rápida y eficiente
- Soportar múltiples formas de pago (efectivo, tarjeta, mixto)
- Actualizar inventario automáticamente
- Gestionar ventas en cuenta corriente
- Soportar ventas con cuotas (tarjeta)
- Generar comprobantes de venta
- Facilitar reportes de ventas

### 1.3 Funcionalidades Principales
- Punto de venta (POS) con búsqueda rápida de productos
- Registro de ventas con múltiples items
- Múltiples formas de pago en una sola venta
- Descuentos por item o total
- Ventas en cuenta corriente
- Ventas con cuotas
- Actualización automática de inventario
- Generación de comprobantes
- Historial completo de ventas
- Estadísticas y reportes

---

## 2. Modelo de Datos

### 2.1 Entidades

#### **Sale (Venta)**
```typescript
enum SaleStatus {
  COMPLETED = 'completed',     // Venta completada y pagada
  PENDING = 'pending',         // Venta pendiente de pago (cuenta corriente)
  CANCELLED = 'cancelled',     // Venta cancelada
  PARTIAL = 'partial'          // Venta parcialmente pagada
}

@Entity('sales')
export class Sale {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  saleNumber: string; // Ej: "VENTA-2024-00001"

  @ManyToOne(() => Customer, { nullable: true })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer; // Opcional: cliente registrado

  @Column({ type: 'varchar', length: 200, nullable: true })
  customerName: string; // Nombre rápido si no hay cliente registrado

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  saleDate: Date;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  subtotal: number; // Suma de todos los items sin descuento

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  discount: number; // Descuento total aplicado

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  tax: number; // IVA u otros impuestos (opcional)

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  total: number; // subtotal - discount + tax

  @Column({ type: 'enum', enum: SaleStatus, default: SaleStatus.COMPLETED })
  status: SaleStatus;

  @Column({ type: 'boolean', default: false })
  isOnAccount: boolean; // Si es venta en cuenta corriente

  @Column({ type: 'text', nullable: true })
  notes: string; // Observaciones

  @Column({ type: 'boolean', default: false })
  inventoryUpdated: boolean; // Flag para saber si ya se actualizó el stock

  // Relaciones
  @OneToMany(() => SaleItem, item => item.sale, { cascade: true })
  items: SaleItem[];

  @OneToMany(() => SalePayment, payment => payment.sale, { cascade: true })
  payments: SalePayment[];

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
        sum + item.subtotal, 0
      );
      this.total = this.subtotal - this.discount + this.tax;
    }
  }
}
```

#### **SaleItem (Item de Venta)**
```typescript
@Entity('sale_items')
export class SaleItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Sale, sale => sale.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sale_id' })
  sale: Sale;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number; // Precio de venta unitario

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discount: number; // Descuento por item

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  subtotal: number; // (quantity * unitPrice) - discount

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Calcular subtotal antes de insertar/actualizar
  @BeforeInsert()
  @BeforeUpdate()
  calculateSubtotal() {
    this.subtotal = (this.quantity * this.unitPrice) - this.discount;
  }
}
```

#### **SalePayment (Pago de Venta)**
```typescript
enum PaymentMethod {
  CASH = 'cash',
  DEBIT_CARD = 'debit_card',
  CREDIT_CARD = 'credit_card',
  TRANSFER = 'transfer',
  QR = 'qr',
  CHECK = 'check',
  OTHER = 'other'
}

@Entity('sale_payments')
export class SalePayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Sale, sale => sale.payments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sale_id' })
  sale: Sale;

  @Column({ type: 'enum', enum: PaymentMethod })
  paymentMethod: PaymentMethod;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number; // Monto de este pago

  @Column({ type: 'int', nullable: true })
  installments: number; // Cantidad de cuotas (si es tarjeta crédito)

  @Column({ type: 'varchar', length: 100, nullable: true })
  cardLastFourDigits: string; // Últimos 4 dígitos de tarjeta

  @Column({ type: 'varchar', length: 100, nullable: true })
  authorizationCode: string; // Código de autorización

  @Column({ type: 'varchar', length: 100, nullable: true })
  referenceNumber: string; // Número de referencia/transacción

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### 2.2 Relaciones
- **Sale** 1:N **SaleItem** (una venta tiene muchos items)
- **Sale** 1:N **SalePayment** (una venta puede tener múltiples pagos)
- **Sale** N:1 **Customer** (opcional - para cuenta corriente)
- **SaleItem** N:1 **Product** (cada item pertenece a un producto)
- **Sale** N:1 **User** (vendedor que registró la venta)

---

## 3. Backend (NestJS)

### 3.1 Estructura de Carpetas
```
src/
└── sales/
    ├── entities/
    │   ├── sale.entity.ts
    │   ├── sale-item.entity.ts
    │   └── sale-payment.entity.ts
    ├── dto/
    │   ├── create-sale.dto.ts
    │   ├── create-sale-item.dto.ts
    │   ├── create-sale-payment.dto.ts
    │   ├── sale-filters.dto.ts
    │   └── sale-stats.dto.ts
    ├── sales.controller.ts
    ├── sales.service.ts
    └── sales.module.ts
```

### 3.2 DTOs

#### **create-sale.dto.ts**
```typescript
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, IsArray, ValidateNested, Min, IsBoolean, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSaleItemDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  discount?: number; // Descuento por item
}

export class CreateSalePaymentDto {
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  installments?: number; // Para tarjeta de crédito

  @IsString()
  @IsOptional()
  @MaxLength(100)
  cardLastFourDigits?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  authorizationCode?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  referenceNumber?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;
}

export class CreateSaleDto {
  @IsString()
  @IsOptional()
  customerId?: string; // Cliente registrado (opcional)

  @IsString()
  @IsOptional()
  @MaxLength(200)
  customerName?: string; // Nombre rápido si no hay cliente

  @IsNumber()
  @Min(0)
  @IsOptional()
  discount?: number; // Descuento total de la venta

  @IsNumber()
  @Min(0)
  @IsOptional()
  tax?: number;

  @IsBoolean()
  @IsOptional()
  isOnAccount?: boolean; // Si es venta en cuenta corriente

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSaleItemDto)
  items: CreateSaleItemDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSalePaymentDto)
  @IsOptional()
  payments?: CreateSalePaymentDto[]; // Opcional si es venta en cuenta
}
```

#### **sale-filters.dto.ts**
```typescript
import { IsOptional, IsString, IsEnum, IsDate, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class SaleFiltersDto {
  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsEnum(SaleStatus)
  status?: SaleStatus;

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
  isOnAccount?: boolean;

  @IsOptional()
  @IsString()
  productId?: string; // Filtrar ventas que incluyan este producto
}
```

### 3.3 Service (sales.service.ts)

```typescript
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, DataSource } from 'typeorm';
import { Sale, SaleItem, SalePayment } from './entities';
import { CreateSaleDto, SaleFiltersDto } from './dto';
import { InventoryService } from '../inventory/inventory.service';
import { ProductsService } from '../products/products.service';
import { CustomersService } from '../customers/customers.service';

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(Sale)
    private saleRepo: Repository<Sale>,
    @InjectRepository(SaleItem)
    private saleItemRepo: Repository<SaleItem>,
    @InjectRepository(SalePayment)
    private salePaymentRepo: Repository<SalePayment>,
    private inventoryService: InventoryService,
    private productsService: ProductsService,
    private customersService: CustomersService,
    private dataSource: DataSource,
  ) {}

  async create(dto: CreateSaleDto, userId: string): Promise<Sale> {
    // Validar cliente si existe
    if (dto.customerId) {
      await this.customersService.findOne(dto.customerId);
    }

    // Validar que todos los productos existan
    for (const item of dto.items) {
      await this.productsService.findOne(item.productId);
    }

    // Validar stock disponible ANTES de crear la venta
    const stockCheck = await this.inventoryService.checkMultipleProductsStock(
      dto.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      }))
    );

    if (!stockCheck.available) {
      throw new BadRequestException({
        message: 'Stock insuficiente para los siguientes productos',
        insufficientProducts: stockCheck.insufficientProducts
      });
    }

    // Usar transacción para garantizar consistencia
    return this.dataSource.transaction(async manager => {
      // Generar número de venta
      const saleNumber = await this.generateSaleNumber();

      // Crear items
      const items = dto.items.map(item =>
        this.saleItemRepo.create({
          product: { id: item.productId } as any,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount || 0,
        })
      );

      // Calcular totales
      const subtotal = items.reduce((sum, item) => 
        sum + ((item.quantity * item.unitPrice) - item.discount), 0
      );
      const total = subtotal - (dto.discount || 0) + (dto.tax || 0);

      // Crear pagos (si no es venta en cuenta corriente)
      let payments = [];
      if (!dto.isOnAccount && dto.payments) {
        payments = dto.payments.map(payment =>
          this.salePaymentRepo.create(payment)
        );

        // Validar que el total de pagos coincida con el total de la venta
        const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
        if (Math.abs(totalPaid - total) > 0.01) {
          throw new BadRequestException(
            `El total de pagos ($${totalPaid}) no coincide con el total de la venta ($${total})`
          );
        }
      }

      // Crear venta
      const sale = this.saleRepo.create({
        saleNumber,
        customer: dto.customerId ? { id: dto.customerId } as any : null,
        customerName: dto.customerName,
        saleDate: new Date(),
        subtotal,
        discount: dto.discount || 0,
        tax: dto.tax || 0,
        total,
        status: dto.isOnAccount ? SaleStatus.PENDING : SaleStatus.COMPLETED,
        isOnAccount: dto.isOnAccount || false,
        notes: dto.notes,
        items,
        payments,
        createdBy: { id: userId } as any,
      });

      // Guardar venta
      const savedSale = await manager.save(sale);

      // Actualizar inventario automáticamente
      for (const item of dto.items) {
        await this.inventoryService.reduceStockFromSale({
          productId: item.productId,
          quantity: item.quantity,
          saleId: savedSale.id,
        }, userId);
      }

      // Marcar inventario como actualizado
      savedSale.inventoryUpdated = true;
      await manager.save(savedSale);

      return this.findOne(savedSale.id);
    });
  }

  async findAll(filters?: SaleFiltersDto) {
    const query = this.saleRepo.createQueryBuilder('sale')
      .leftJoinAndSelect('sale.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('sale.payments', 'payments')
      .leftJoinAndSelect('sale.customer', 'customer')
      .leftJoinAndSelect('sale.createdBy', 'user')
      .orderBy('sale.saleDate', 'DESC');

    if (filters?.customerId) {
      query.andWhere('sale.customer.id = :customerId', {
        customerId: filters.customerId
      });
    }

    if (filters?.customerName) {
      query.andWhere('(sale.customerName ILIKE :name OR customer.firstName ILIKE :name OR customer.lastName ILIKE :name)', {
        name: `%${filters.customerName}%`
      });
    }

    if (filters?.status) {
      query.andWhere('sale.status = :status', { status: filters.status });
    }

    if (filters?.startDate && filters?.endDate) {
      query.andWhere('sale.saleDate BETWEEN :start AND :end', {
        start: filters.startDate,
        end: filters.endDate
      });
    }

    if (filters?.isOnAccount !== undefined) {
      query.andWhere('sale.isOnAccount = :isOnAccount', {
        isOnAccount: filters.isOnAccount
      });
    }

    if (filters?.productId) {
      query.andWhere('items.product.id = :productId', {
        productId: filters.productId
      });
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<Sale> {
    const sale = await this.saleRepo.findOne({
      where: { id },
      relations: ['items', 'items.product', 'payments', 'customer', 'createdBy']
    });

    if (!sale) {
      throw new NotFoundException(`Venta con ID ${id} no encontrada`);
    }

    return sale;
  }

  async cancel(id: string): Promise<Sale> {
    const sale = await this.findOne(id);

    if (sale.status === SaleStatus.CANCELLED) {
      throw new BadRequestException('La venta ya está cancelada');
    }

    // No permitir cancelar si ya afectó inventario
    // (En un sistema real, se debería hacer una devolución que sume stock)
    if (sale.inventoryUpdated) {
      throw new BadRequestException(
        'No se puede cancelar una venta que ya actualizó el inventario. ' +
        'Debe registrar una devolución.'
      );
    }

    sale.status = SaleStatus.CANCELLED;
    return this.saleRepo.save(sale);
  }

  async remove(id: string): Promise<void> {
    const sale = await this.findOne(id);

    if (sale.inventoryUpdated) {
      throw new BadRequestException(
        'No se puede eliminar una venta que ya actualizó el inventario'
      );
    }

    await this.saleRepo.softDelete(id);
  }

  // Generar número de venta único
  private async generateSaleNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.saleRepo.count({
      where: { saleNumber: Like(`VENTA-${year}-%`) }
    });
    
    const nextNumber = (count + 1).toString().padStart(5, '0');
    return `VENTA-${year}-${nextNumber}`;
  }

  // Estadísticas
  async getStats(startDate?: Date, endDate?: Date) {
    const query = this.saleRepo.createQueryBuilder('sale')
      .leftJoinAndSelect('sale.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('sale.payments', 'payments');

    if (startDate && endDate) {
      query.where('sale.saleDate BETWEEN :start AND :end', {
        start: startDate,
        end: endDate
      });
    }

    const sales = await query.getMany();

    const completedSales = sales.filter(s => s.status === SaleStatus.COMPLETED);
    const pendingSales = sales.filter(s => s.status === SaleStatus.PENDING);

    const totalSales = completedSales.length;
    const totalRevenue = completedSales.reduce((sum, s) => sum + Number(s.total), 0);
    const totalPending = pendingSales.reduce((sum, s) => sum + Number(s.total), 0);

    // Calcular total por método de pago
    const paymentMethodStats = {};
    completedSales.forEach(sale => {
      sale.payments?.forEach(payment => {
        if (!paymentMethodStats[payment.paymentMethod]) {
          paymentMethodStats[payment.paymentMethod] = 0;
        }
        paymentMethodStats[payment.paymentMethod] += Number(payment.amount);
      });
    });

    // Productos más vendidos
    const productSales = {};
    completedSales.forEach(sale => {
      sale.items?.forEach(item => {
        const productId = item.product.id;
        if (!productSales[productId]) {
          productSales[productId] = {
            product: item.product,
            quantitySold: 0,
            revenue: 0
          };
        }
        productSales[productId].quantitySold += item.quantity;
        productSales[productId].revenue += Number(item.subtotal);
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a: any, b: any) => b.quantitySold - a.quantitySold)
      .slice(0, 10);

    return {
      totalSales,
      totalRevenue,
      totalPending,
      averageTicket: totalSales > 0 ? totalRevenue / totalSales : 0,
      paymentMethodStats,
      topProducts
    };
  }

  // Ventas del día
  async getTodaySales() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.findAll({
      startDate: today,
      endDate: tomorrow
    } as any);
  }
}
```

### 3.4 Controller (sales.controller.ts)

```typescript
import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto, SaleFiltersDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('sales')
@UseGuards(JwtAuthGuard)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  create(@Body() dto: CreateSaleDto, @Request() req) {
    return this.salesService.create(dto, req.user.id);
  }

  @Get()
  findAll(@Query() filters: SaleFiltersDto) {
    return this.salesService.findAll(filters);
  }

  @Get('stats')
  getStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.salesService.getStats(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
  }

  @Get('today')
  getTodaySales() {
    return this.salesService.getTodaySales();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.salesService.findOne(id);
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.salesService.cancel(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.salesService.remove(id);
  }
}
```

### 3.5 Module (sales.module.ts)

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { Sale, SaleItem, SalePayment } from './entities';
import { InventoryModule } from '../inventory/inventory.module';
import { ProductsModule } from '../products/products.module';
import { CustomersModule } from '../customers/customers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Sale, SaleItem, SalePayment]),
    InventoryModule,
    ProductsModule,
    CustomersModule,
  ],
  controllers: [SalesController],
  providers: [SalesService],
  exports: [SalesService],
})
export class SalesModule {}
```

---

## 4. Frontend (React)

### 4.1 Hooks

#### **useSales.ts**
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salesApi } from '../api/sales.api';
import { toast } from 'sonner';

export function useSales(filters?: any) {
  return useQuery({
    queryKey: ['sales', filters],
    queryFn: () => salesApi.getAll(filters),
  });
}

export function useSale(id: string) {
  return useQuery({
    queryKey: ['sale', id],
    queryFn: () => salesApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: salesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Venta registrada exitosamente');
    },
    onError: (error: any) => {
      if (error.response?.data?.insufficientProducts) {
        toast.error('Stock insuficiente para algunos productos');
      } else {
        toast.error('Error al registrar la venta');
      }
    },
  });
}

export function useTodaySales() {
  return useQuery({
    queryKey: ['sales-today'],
    queryFn: () => salesApi.getTodaySales(),
    refetchInterval: 30000, // Refrescar cada 30 segundos
  });
}

export function useSalesStats(startDate?: Date, endDate?: Date) {
  return useQuery({
    queryKey: ['sales-stats', startDate, endDate],
    queryFn: () => salesApi.getStats(startDate, endDate),
  });
}
```

### 4.2 Página Principal: POSPage.tsx (Punto de Venta)

```tsx
import React, { useState } from 'react';
import { ShoppingCart, Plus, Trash2, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ProductSearch } from '../components/ProductSearch';
import { PaymentDialog } from '../components/PaymentDialog';
import { useCreateSale } from '../hooks/useSales';
import { formatCurrency } from '@/lib/utils';

export function POSPage() {
  const [cart, setCart] = useState([]);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const createSale = useCreateSale();

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.productId === product.id);
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.salePrice,
        discount: 0
      }]);
    }
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCart(cart.map(item =>
      item.productId === productId ? { ...item, quantity } : item
    ));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => 
      sum + ((item.quantity * item.unitPrice) - item.discount), 0
    );
  };

  const handlePayment = async (paymentData) => {
    const saleData = {
      items: cart.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount
      })),
      payments: paymentData.payments,
      customerName: paymentData.customerName,
      customerId: paymentData.customerId,
      isOnAccount: paymentData.isOnAccount,
      discount: paymentData.discount || 0,
    };

    try {
      await createSale.mutateAsync(saleData);
      setCart([]);
      setPaymentDialogOpen(false);
    } catch (error) {
      console.error('Error al procesar venta:', error);
    }
  };

  const total = calculateTotal();

  return (
    <div className="h-screen flex">
      {/* Productos */}
      <div className="flex-1 p-6 overflow-y-auto">
        <h1 className="text-2xl font-bold mb-4">Punto de Venta</h1>
        <ProductSearch onSelect={addToCart} />
      </div>

      {/* Carrito */}
      <Card className="w-96 m-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Carrito ({cart.length} items)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {cart.map((item) => (
              <div key={item.productId} className="flex items-center gap-2 p-2 border rounded">
                <div className="flex-1">
                  <div className="font-medium">{item.productName}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatCurrency(item.unitPrice)}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                  >
                    -
                  </Button>
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value))}
                    className="w-16 text-center"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                  >
                    +
                  </Button>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeFromCart(item.productId)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-2xl font-bold">
              <span>Total:</span>
              <span>{formatCurrency(total)}</span>
            </div>

            <Button
              className="w-full"
              size="lg"
              disabled={cart.length === 0}
              onClick={() => setPaymentDialogOpen(true)}
            >
              <CreditCard className="mr-2 h-5 w-5" />
              Procesar Pago
            </Button>
          </div>
        </CardContent>
      </Card>

      <PaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        total={total}
        onConfirm={handlePayment}
      />
    </div>
  );
}
```

---

## 5. Casos de Uso

### 5.1 Venta Contado Simple

**Flujo**:
1. Vendedor busca y agrega productos al carrito
2. Ajusta cantidades si es necesario
3. Click en "Procesar Pago"
4. Selecciona método de pago (efectivo/tarjeta)
5. Sistema valida stock
6. Sistema reduce stock automáticamente
7. Sistema genera comprobante

### 5.2 Venta con Pago Mixto

**Flujo**:
1. Items en carrito, total $1000
2. Cliente paga: $600 efectivo + $400 tarjeta
3. Sistema registra ambos pagos
4. Valida que suma = total
5. Confirma venta

### 5.3 Venta en Cuenta Corriente

**Flujo**:
1. Seleccionar cliente registrado
2. Marcar "Venta en Cuenta Corriente"
3. No se registran pagos
4. Estado: PENDING
5. Se reduce stock igual
6. Se genera deuda en cuenta corriente

### 5.4 Venta con Cuotas

**Flujo**:
1. Seleccionar pago con tarjeta de crédito
2. Indicar cantidad de cuotas (3, 6, 12)
3. Sistema registra cuotas en el pago
4. Comprobante muestra plan de cuotas

---

## 6. Consideraciones Técnicas

### 6.1 Validación de Stock ANTES de Venta

**Crítico**: Siempre validar stock antes de confirmar:
```typescript
const stockCheck = await inventoryService.checkMultipleProductsStock(items);
if (!stockCheck.available) {
  throw new BadRequestException({
    insufficientProducts: stockCheck.insufficientProducts
  });
}
```

### 6.2 Transacciones Atómicas

Ventas usan transacciones para garantizar:
1. Si falla alguna operación, se revierte todo
2. Stock y venta se actualizan juntos
3. Consistencia de datos

### 6.3 Múltiples Formas de Pago

Una venta puede tener múltiples pagos:
- $500 efectivo + $500 tarjeta
- Validar que suma de pagos = total venta

### 6.4 Ventas en Cuenta Corriente

- Requieren cliente registrado
- Estado: PENDING
- No tienen pagos asociados
- Se reduce stock igual
- Se crea deuda automática

### 6.5 Número de Venta Único

Formato: `VENTA-YYYY-NNNNN`
- Autoincremental por año
- Ejemplo: VENTA-2024-00001

---

## 7. Integraciones

### 7.1 Con Inventario

```typescript
// Antes de crear venta: validar stock
await inventoryService.checkMultipleProductsStock(items);

// Después de crear venta: reducir stock
await inventoryService.reduceStockFromSale({
  productId, quantity, saleId
});
```

### 7.2 Con Cuentas Corrientes (Futuro)

```typescript
// Si isOnAccount = true
await accountsService.createDebt({
  customerId,
  amount: sale.total,
  saleId: sale.id
});
```

### 7.3 Con Caja (Futuro)

```typescript
// Registrar ingresos por cada pago
for (const payment of sale.payments) {
  await cashService.registerIncome({
    amount: payment.amount,
    method: payment.paymentMethod,
    saleId: sale.id
  });
}
```

---

## 8. Reportes y Estadísticas

### 8.1 Métricas Clave
- Total de ventas por período
- Ingresos totales
- Ticket promedio
- Ventas por método de pago
- Top 10 productos más vendidos
- Ventas pendientes (cuenta corriente)

### 8.2 Reportes Disponibles
- Ventas del día
- Ventas por vendedor
- Ventas por cliente
- Productos más vendidos
- Comparativa de períodos

---

## 9. Próximos Pasos

1. ✅ CRUD completo de ventas
2. ✅ Validación de stock
3. ✅ Múltiples formas de pago
4. ✅ Ventas en cuenta corriente
5. ⏳ Devoluciones y notas de crédito
6. ⏳ Impresión de comprobantes
7. ⏳ Integración con facturación electrónica (AFIP)
8. ⏳ Reportes avanzados
9. ⏳ Descuentos por promoción
10. ⏳ Integración con lector de código de barras

---

**Módulo de Ventas completo - ready para desarrollo** 🚀
