# Módulo: Caja

## 1. Descripción y Objetivo

### 1.1 Descripción
El módulo de Caja gestiona la apertura y cierre diario de caja, registrando todos los ingresos y egresos de dinero en efectivo. Permite controlar el flujo de efectivo, realizar arqueos, y mantener un registro detallado de todos los movimientos monetarios.

### 1.2 Objetivo
- Controlar apertura y cierre diario de caja
- Registrar todos los ingresos (ventas en efectivo)
- Registrar todos los egresos (gastos, retiros)
- Realizar arqueos de caja
- Detectar diferencias de efectivo
- Mantener historial de movimientos
- Generar reportes de caja por período

### 1.3 Funcionalidades Principales
- Apertura de caja con monto inicial
- Cierre de caja con arqueo
- Registro automático de ingresos desde ventas
- Registro automático de egresos desde gastos
- Registro manual de movimientos (retiros, depósitos)
- Consulta de estado actual de caja
- Historial completo de cajas

---

## 2. Modelo de Datos

### 2.1 Entidades

#### **CashRegister (Caja)**
```typescript
enum CashRegisterStatus {
  OPEN = 'open',
  CLOSED = 'closed'
}

@Entity('cash_registers')
export class CashRegister {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  date: Date; // Fecha de la caja

  @Column({ type: 'timestamp' })
  openedAt: Date; // Hora de apertura

  @Column({ type: 'timestamp', nullable: true })
  closedAt: Date; // Hora de cierre

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  initialAmount: number; // Monto inicial al abrir

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalIncome: number; // Total de ingresos

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalExpense: number; // Total de egresos

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  expectedAmount: number; // Monto esperado (calculado)

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  actualAmount: number; // Monto real contado al cerrar

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  difference: number; // Diferencia (actualAmount - expectedAmount)

  @Column({ type: 'enum', enum: CashRegisterStatus, default: CashRegisterStatus.OPEN })
  status: CashRegisterStatus;

  @Column({ type: 'text', nullable: true })
  openingNotes: string; // Notas al abrir

  @Column({ type: 'text', nullable: true })
  closingNotes: string; // Notas al cerrar

  // Relaciones
  @OneToMany(() => CashMovement, movement => movement.cashRegister)
  movements: CashMovement[];

  @ManyToOne(() => User)
  @JoinColumn({ name: 'opened_by' })
  openedBy: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'closed_by' })
  closedBy: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
```

#### **CashMovement (Movimiento de Caja)**
```typescript
enum MovementType {
  INCOME = 'income',           // Ingreso (venta)
  EXPENSE = 'expense',         // Egreso (gasto)
  WITHDRAWAL = 'withdrawal',   // Retiro de efectivo
  DEPOSIT = 'deposit',         // Depósito de efectivo
  ADJUSTMENT = 'adjustment'    // Ajuste
}

enum PaymentMethod {
  CASH = 'cash',
  DEBIT_CARD = 'debit_card',
  CREDIT_CARD = 'credit_card',
  TRANSFER = 'transfer',
  QR = 'qr',
  CHECK = 'check'
}

@Entity('cash_movements')
export class CashMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => CashRegister, register => register.movements)
  @JoinColumn({ name: 'cash_register_id' })
  cashRegister: CashRegister;

  @Column({ type: 'enum', enum: MovementType })
  movementType: MovementType;

  @Column({ type: 'enum', enum: PaymentMethod })
  paymentMethod: PaymentMethod;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number; // Positivo para ingresos, negativo para egresos

  @Column({ type: 'varchar', length: 200 })
  description: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  referenceType: string; // 'sale', 'expense', 'manual'

  @Column({ type: 'uuid', nullable: true })
  referenceId: string; // ID de la venta/gasto relacionado

  @Column({ type: 'text', nullable: true })
  notes: string;

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
- **CashRegister** 1:N **CashMovement** (una caja tiene muchos movimientos)
- **CashRegister** N:1 **User** (usuario que abrió/cerró)
- **CashMovement** N:1 **User** (usuario que registró el movimiento)

---

## 3. Backend (NestJS)

### 3.1 DTOs

```typescript
// open-cash-register.dto.ts
export class OpenCashRegisterDto {
  @IsNumber()
  @Min(0)
  initialAmount: number;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  openingNotes?: string;
}

// close-cash-register.dto.ts
export class CloseCashRegisterDto {
  @IsNumber()
  @Min(0)
  actualAmount: number; // Monto real contado

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  closingNotes?: string;
}

// create-cash-movement.dto.ts
export class CreateCashMovementDto {
  @IsEnum(MovementType)
  movementType: MovementType;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsNumber()
  amount: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  description: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  notes?: string;
}
```

### 3.2 Service (cash-register.service.ts)

```typescript
@Injectable()
export class CashRegisterService {
  constructor(
    @InjectRepository(CashRegister)
    private cashRegisterRepo: Repository<CashRegister>,
    @InjectRepository(CashMovement)
    private cashMovementRepo: Repository<CashMovement>,
  ) {}

  // Abrir caja
  async open(dto: OpenCashRegisterDto, userId: string): Promise<CashRegister> {
    // Verificar que no hay caja abierta
    const openRegister = await this.getOpenRegister();
    if (openRegister) {
      throw new BadRequestException('Ya existe una caja abierta');
    }

    const cashRegister = this.cashRegisterRepo.create({
      date: new Date(),
      openedAt: new Date(),
      initialAmount: dto.initialAmount,
      totalIncome: 0,
      totalExpense: 0,
      openingNotes: dto.openingNotes,
      status: CashRegisterStatus.OPEN,
      openedBy: { id: userId } as any,
    });

    return this.cashRegisterRepo.save(cashRegister);
  }

  // Cerrar caja
  async close(dto: CloseCashRegisterDto, userId: string): Promise<CashRegister> {
    const cashRegister = await this.getOpenRegister();

    if (!cashRegister) {
      throw new NotFoundException('No hay caja abierta');
    }

    // Calcular monto esperado
    const expectedAmount = cashRegister.initialAmount + 
                          cashRegister.totalIncome - 
                          cashRegister.totalExpense;

    // Calcular diferencia
    const difference = dto.actualAmount - expectedAmount;

    // Actualizar caja
    cashRegister.closedAt = new Date();
    cashRegister.expectedAmount = expectedAmount;
    cashRegister.actualAmount = dto.actualAmount;
    cashRegister.difference = difference;
    cashRegister.closingNotes = dto.closingNotes;
    cashRegister.status = CashRegisterStatus.CLOSED;
    cashRegister.closedBy = { id: userId } as any;

    return this.cashRegisterRepo.save(cashRegister);
  }

  // Obtener caja abierta actual
  async getOpenRegister(): Promise<CashRegister | null> {
    return this.cashRegisterRepo.findOne({
      where: { status: CashRegisterStatus.OPEN },
      relations: ['movements', 'openedBy']
    });
  }

  // Registrar ingreso (desde venta)
  async registerIncome(data: {
    amount: number;
    paymentMethod: PaymentMethod;
    saleId: string;
    description: string;
  }, userId: string): Promise<CashMovement> {
    const cashRegister = await this.getOpenRegister();

    if (!cashRegister) {
      throw new BadRequestException('No hay caja abierta');
    }

    const movement = this.cashMovementRepo.create({
      cashRegister,
      movementType: MovementType.INCOME,
      paymentMethod: data.paymentMethod,
      amount: Math.abs(data.amount),
      description: data.description,
      referenceType: 'sale',
      referenceId: data.saleId,
      createdBy: { id: userId } as any,
    });

    await this.cashMovementRepo.save(movement);

    // Actualizar totales de caja
    cashRegister.totalIncome += Math.abs(data.amount);
    await this.cashRegisterRepo.save(cashRegister);

    return movement;
  }

  // Registrar egreso (desde gasto)
  async registerExpense(data: {
    amount: number;
    paymentMethod: PaymentMethod;
    expenseId: string;
    description: string;
  }, userId: string): Promise<CashMovement> {
    const cashRegister = await this.getOpenRegister();

    if (!cashRegister) {
      throw new BadRequestException('No hay caja abierta');
    }

    const movement = this.cashMovementRepo.create({
      cashRegister,
      movementType: MovementType.EXPENSE,
      paymentMethod: data.paymentMethod,
      amount: -Math.abs(data.amount),
      description: data.description,
      referenceType: 'expense',
      referenceId: data.expenseId,
      createdBy: { id: userId } as any,
    });

    await this.cashMovementRepo.save(movement);

    // Actualizar totales de caja
    cashRegister.totalExpense += Math.abs(data.amount);
    await this.cashRegisterRepo.save(cashRegister);

    return movement;
  }

  // Registrar movimiento manual
  async createManualMovement(
    dto: CreateCashMovementDto,
    userId: string
  ): Promise<CashMovement> {
    const cashRegister = await this.getOpenRegister();

    if (!cashRegister) {
      throw new BadRequestException('No hay caja abierta');
    }

    const movement = this.cashMovementRepo.create({
      ...dto,
      cashRegister,
      referenceType: 'manual',
      createdBy: { id: userId } as any,
    });

    await this.cashMovementRepo.save(movement);

    // Actualizar totales según tipo de movimiento
    if (dto.movementType === MovementType.INCOME || 
        dto.movementType === MovementType.DEPOSIT) {
      cashRegister.totalIncome += Math.abs(dto.amount);
    } else {
      cashRegister.totalExpense += Math.abs(dto.amount);
    }

    await this.cashRegisterRepo.save(cashRegister);

    return movement;
  }

  // Historial de cajas
  async findAll(startDate?: Date, endDate?: Date) {
    const query = this.cashRegisterRepo.createQueryBuilder('register')
      .leftJoinAndSelect('register.movements', 'movements')
      .leftJoinAndSelect('register.openedBy', 'openedBy')
      .leftJoinAndSelect('register.closedBy', 'closedBy')
      .orderBy('register.date', 'DESC');

    if (startDate && endDate) {
      query.where('register.date BETWEEN :start AND :end', {
        start: startDate,
        end: endDate
      });
    }

    return query.getMany();
  }

  // Estadísticas
  async getStats(startDate?: Date, endDate?: Date) {
    const registers = await this.findAll(startDate, endDate);
    
    const closedRegisters = registers.filter(r => r.status === CashRegisterStatus.CLOSED);

    const totalIncome = closedRegisters.reduce((sum, r) => sum + Number(r.totalIncome), 0);
    const totalExpense = closedRegisters.reduce((sum, r) => sum + Number(r.totalExpense), 0);
    const totalDifferences = closedRegisters.reduce((sum, r) => sum + Number(r.difference || 0), 0);

    return {
      totalRegisters: registers.length,
      closedRegisters: closedRegisters.length,
      openRegisters: registers.filter(r => r.status === CashRegisterStatus.OPEN).length,
      totalIncome,
      totalExpense,
      netCashFlow: totalIncome - totalExpense,
      totalDifferences,
      averageDifference: closedRegisters.length > 0 ? totalDifferences / closedRegisters.length : 0
    };
  }
}
```

---

## 4. Frontend (React)

### 4.1 Página Principal: CashRegisterPage.tsx

```tsx
export function CashRegisterPage() {
  const { data: openRegister } = useOpenCashRegister();
  const { data: history } = useCashHistory();
  const [openDialogOpen, setOpenDialogOpen] = useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);

  const currentBalance = openRegister
    ? openRegister.initialAmount + openRegister.totalIncome - openRegister.totalExpense
    : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Caja</h1>

      {/* Estado Actual de Caja */}
      {openRegister ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse" />
                Caja Abierta
              </span>
              <Button onClick={() => setCloseDialogOpen(true)}>
                Cerrar Caja
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="text-sm text-muted-foreground">Monto Inicial</label>
                <p className="text-2xl font-bold">{formatCurrency(openRegister.initialAmount)}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Ingresos</label>
                <p className="text-2xl font-bold text-green-600">
                  +{formatCurrency(openRegister.totalIncome)}
                </p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Egresos</label>
                <p className="text-2xl font-bold text-red-600">
                  -{formatCurrency(openRegister.totalExpense)}
                </p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Saldo Actual</label>
                <p className="text-2xl font-bold">{formatCurrency(currentBalance)}</p>
              </div>
            </div>

            <div className="mt-4 text-sm text-muted-foreground">
              Abierta por {openRegister.openedBy.name} el {formatDateTime(openRegister.openedAt)}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <h3 className="font-semibold">No hay caja abierta</h3>
              <p className="text-sm text-muted-foreground">
                Debe abrir una caja para comenzar a operar
              </p>
            </div>
            <Button onClick={() => setOpenDialogOpen(true)}>
              Abrir Caja
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Movimientos de Hoy */}
      {openRegister && (
        <Card>
          <CardHeader>
            <CardTitle>Movimientos de Hoy</CardTitle>
          </CardHeader>
          <CardContent>
            <CashMovementsTable movements={openRegister.movements} />
          </CardContent>
        </Card>
      )}

      {/* Historial */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Cajas</CardTitle>
        </CardHeader>
        <CardContent>
          <CashHistoryTable history={history || []} />
        </CardContent>
      </Card>

      <OpenCashDialog open={openDialogOpen} onOpenChange={setOpenDialogOpen} />
      <CloseCashDialog 
        open={closeDialogOpen} 
        onOpenChange={setCloseDialogOpen}
        currentRegister={openRegister}
      />
    </div>
  );
}
```

---

## 5. Casos de Uso

### 5.1 Abrir Caja

**Flujo**:
1. Usuario ingresa monto inicial (efectivo en caja)
2. Opcionalmente agrega notas
3. Sistema crea registro de caja abierta
4. Estado: OPEN

### 5.2 Registrar Venta (Automático)

**Flujo**:
1. Sistema detecta venta completada
2. Por cada pago en efectivo/tarjeta:
   - Crea movimiento de ingreso
   - Incrementa totalIncome de caja
3. Usuario no interviene

### 5.3 Registrar Gasto (Automático)

**Flujo**:
1. Sistema detecta gasto pagado
2. Crea movimiento de egreso
3. Incrementa totalExpense de caja

### 5.4 Cerrar Caja

**Flujo**:
1. Usuario cuenta efectivo en caja
2. Ingresa monto real contado
3. Sistema calcula:
   - Esperado = inicial + ingresos - egresos
   - Diferencia = real - esperado
4. Si diferencia ≠ 0, marcar para revisión
5. Genera reporte de cierre

---

## 6. Integraciones

### Con Ventas:
```typescript
// Después de confirmar venta
for (const payment of sale.payments) {
  if (payment.paymentMethod === 'cash') {
    await cashService.registerIncome({
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      saleId: sale.id,
      description: `Venta ${sale.saleNumber}`
    });
  }
}
```

### Con Gastos:
```typescript
// Al pagar gasto
if (expense.isPaid && expense.paymentMethod === 'cash') {
  await cashService.registerExpense({
    amount: expense.amount,
    paymentMethod: expense.paymentMethod,
    expenseId: expense.id,
    description: expense.description
  });
}
```

---

**Módulo de Caja completo** ✅
