# Módulo: Inventario

## 1. Descripción y Objetivo

### 1.1 Descripción
El módulo de Inventario gestiona el control de stock de todos los productos, registrando movimientos de entrada y salida, manteniendo el stock actual en tiempo real y generando alertas cuando los productos alcanzan niveles mínimos.

### 1.2 Objetivo
- Mantener stock actualizado en tiempo real
- Registrar todos los movimientos de inventario
- Alertar cuando productos llegan a stock mínimo
- Facilitar auditorías y trazabilidad
- Calcular costos promedio de productos
- Prevenir ventas sin stock suficiente

### 1.3 Funcionalidades Principales
- Control de stock en tiempo real
- Registro automático desde compras/ventas
- Ajustes manuales con auditoría
- Alertas de stock mínimo
- Historial completo de movimientos
- Cálculo automático de costo promedio

---

## 2. Modelo de Datos

### 2.1 Entidades

#### **Inventory**
```typescript
@Entity('inventory')
export class Inventory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'int', default: 0 })
  currentStock: number;

  @Column({ type: 'int', default: 0 })
  minStock: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  averageCost: number;

  @Column({ type: 'timestamp', nullable: true })
  lastStockDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

#### **InventoryMovement**
```typescript
enum MovementType {
  PURCHASE = 'purchase',
  SALE = 'sale',
  ADJUSTMENT_IN = 'adjustment_in',
  ADJUSTMENT_OUT = 'adjustment_out',
  INITIAL = 'initial',
  RETURN = 'return',
  DAMAGE = 'damage'
}

@Entity('inventory_movements')
export class InventoryMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'enum', enum: MovementType })
  movementType: MovementType;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'int' })
  previousStock: number;

  @Column({ type: 'int' })
  newStock: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  unitCost: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  referenceType: string;

  @Column({ type: 'uuid', nullable: true })
  referenceId: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @CreateDateColumn()
  createdAt: Date;
}
```

---

## 3. Backend (NestJS)

### 3.1 Service Principal

```typescript
@Injectable()
export class InventoryService {
  // Agregar stock desde compra
  async addStockFromPurchase(dto: AddStockDto): Promise<InventoryMovement> {
    const inventory = await this.getProductStock(dto.productId);

    // Calcular nuevo costo promedio
    const totalCost = (inventory.currentStock * inventory.averageCost) + 
                     (dto.quantity * dto.unitCost);
    const totalQuantity = inventory.currentStock + dto.quantity;
    const newAverageCost = totalQuantity > 0 ? totalCost / totalQuantity : 0;

    // Crear movimiento
    const movement = this.movementRepo.create({
      product: { id: dto.productId } as any,
      movementType: MovementType.PURCHASE,
      quantity: dto.quantity,
      previousStock: inventory.currentStock,
      newStock: inventory.currentStock + dto.quantity,
      unitCost: dto.unitCost,
      referenceType: 'purchase',
      referenceId: dto.purchaseId,
    });

    await this.movementRepo.save(movement);

    // Actualizar inventario
    inventory.currentStock += dto.quantity;
    inventory.averageCost = newAverageCost;
    inventory.lastStockDate = new Date();
    await this.inventoryRepo.save(inventory);

    return movement;
  }

  // Reducir stock desde venta
  async reduceStockFromSale(dto: ReduceStockDto): Promise<InventoryMovement> {
    const inventory = await this.getProductStock(dto.productId);

    // Validar stock disponible
    if (inventory.currentStock < dto.quantity) {
      throw new BadRequestException('Stock insuficiente');
    }

    const movement = this.movementRepo.create({
      product: { id: dto.productId } as any,
      movementType: MovementType.SALE,
      quantity: -dto.quantity,
      previousStock: inventory.currentStock,
      newStock: inventory.currentStock - dto.quantity,
      referenceType: 'sale',
      referenceId: dto.saleId,
    });

    await this.movementRepo.save(movement);

    inventory.currentStock -= dto.quantity;
    inventory.lastStockDate = new Date();
    await this.inventoryRepo.save(inventory);

    return movement;
  }

  // Validar stock de múltiples productos
  async checkMultipleProductsStock(items: { productId: string; quantity: number }[]) {
    const insufficientProducts = [];

    for (const item of items) {
      const inventory = await this.getProductStock(item.productId);
      if (inventory.currentStock < item.quantity) {
        insufficientProducts.push({
          productId: item.productId,
          requested: item.quantity,
          available: inventory.currentStock
        });
      }
    }

    return {
      available: insufficientProducts.length === 0,
      insufficientProducts
    };
  }
}
```

---

## 4. Frontend (React)

### 4.1 Página de Inventario

```tsx
export function InventoryPage() {
  const { data: inventory } = useInventory();
  const { data: lowStock } = useLowStockProducts();

  return (
    <div className="space-y-6">
      <h1>Inventario</h1>
      
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatsCard title="Total Productos" value={inventory?.length} />
        <StatsCard title="Con Stock" value={productsWithStock} />
        <StatsCard title="Sin Stock" value={productsOutOfStock} />
        <StatsCard title="Valor Total" value={formatCurrency(totalValue)} />
      </div>

      {/* Alertas de Stock Bajo */}
      {lowStock?.length > 0 && (
        <Alert variant="warning">
          <AlertTriangle />
          {lowStock.length} productos con stock bajo
        </Alert>
      )}

      {/* Tabla de Stock */}
      <InventoryTable data={inventory} />
    </div>
  );
}
```

---

## 5. Casos de Uso

### 5.1 Entrada de Stock (Compra)
1. Sistema recibe compra pagada
2. Incrementa stock de productos
3. Recalcula costo promedio
4. Registra movimiento

### 5.2 Salida de Stock (Venta)
1. Sistema valida stock disponible
2. Si hay stock: decrementa y registra
3. Si no hay stock: lanza error

### 5.3 Ajuste Manual
1. Usuario selecciona producto
2. Ingresa cantidad y motivo (obligatorio)
3. Sistema registra con auditoría completa

---

## 6. Consideraciones Técnicas

### 6.1 Cálculo de Costo Promedio
```
nuevoCosto = (stockActual * costoActual + cantCompra * precioCompra) / (stockActual + cantCompra)
```

### 6.2 Validaciones
- **NUNCA** permitir stock negativo
- Validar stock antes de confirmar ventas
- Transacciones atómicas para movimientos

### 6.3 Alertas
- Generar alertas cuando `currentStock <= minStock`
- Mostrar en dashboard
- Notificaciones (futuro)

---

## 7. Integraciones

### Con Compras:
```typescript
await inventoryService.addStockFromPurchase({
  productId, quantity, purchaseId, unitCost
});
```

### Con Ventas:
```typescript
// Validar antes
const check = await inventoryService.checkMultipleProductsStock(items);
if (!check.available) throw error;

// Reducir después
await inventoryService.reduceStockFromSale({ productId, quantity, saleId });
```

---

**Módulo de Inventario completo - ready para desarrollo** 🚀
