# Módulo: Caja - Sistema de Control de Flujo de Efectivo

## 1. Descripción y Objetivo

### 1.1 Descripción
El módulo de Caja es un sistema completo de control financiero que gestiona la apertura y cierre diario de caja, registra todos los movimientos monetarios, proporciona análisis detallado por método de pago, y genera reportes personalizables para el control del flujo de efectivo del negocio.

**Continuidad de Saldo**: El sistema mantiene continuidad automática del flujo de caja. Al abrir la caja de un nuevo día, el saldo inicial se establece automáticamente como el saldo final del día anterior. Si se necesita ajustar este monto (por depósitos bancarios u otros retiros), el sistema permite modificarlo pero emite una advertencia y registra el ajuste.

### 1.2 Objetivo
- Controlar apertura y cierre diario de caja con arqueo detallado
- **Mantener continuidad automática del saldo entre días**
- Registrar automáticamente ingresos desde ventas y egresos desde gastos
- Desglosar movimientos por método de pago (efectivo, tarjetas, transferencias, etc.)
- **Mostrar arqueo completo**: saldo anterior + ingresos - egresos = saldo final
- Generar reportes de flujo de caja por rangos de fechas personalizados
- Visualizar tendencias y patrones con gráficos interactivos
- Exportar reportes para análisis externo y auditoría
- Detectar diferencias y mantener control total del dinero

### 1.3 Funcionalidades por Sprint

#### 🚀 Sprint 1 - Core Mejorado (Prioridad Alta)
**Objetivo**: Control total del dinero por método de pago y reportes flexibles

1. **Arqueo Detallado por Método de Pago**
   - Totales separados de efectivo, débito, crédito, transferencias, QR, cheques
   - Arqueo individual al cerrar caja
   - Detección de diferencias por tipo de pago
   
2. **Reportes por Rango de Fechas**
   - Filtros: semanal, mensual, rango personalizado
   - Comparación con período anterior
   - Desglose diario dentro del rango

#### 🚀 Sprint 2 - Análisis y Visualización (Prioridad Media)

3. **Dashboard de Flujo de Caja**
   - Vista consolidada con métricas clave
   - Resumen por método de pago
   - Indicadores de rendimiento
   
4. **Gráficos de Tendencias**
   - Evolución de ingresos/egresos en el tiempo
   - Comparativas entre métodos de pago
   - Identificación de patrones

#### 🚀 Sprint 3 - Integración y Exportación (Prioridad Baja)

5. **Exportación de Reportes**
   - Formato Excel para análisis
   - Formato PDF para impresión
   - CSV para importar a otros sistemas

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
  id!: string;

  @Column({ type: 'date' })
  date!: Date;

  @Column({ type: 'timestamp' })
  openedAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  closedAt?: Date;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  initialAmount!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalIncome!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalExpense!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  expectedAmount?: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  actualAmount?: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  difference?: number;

  @Column({ type: 'enum', enum: CashRegisterStatus, default: CashRegisterStatus.OPEN })
  status!: CashRegisterStatus;

  @Column({ type: 'text', nullable: true })
  openingNotes?: string;

  @Column({ type: 'text', nullable: true })
  closingNotes?: string;

  @OneToMany(() => CashMovement, movement => movement.cashRegister)
  movements!: CashMovement[];

  @OneToMany(() => CashRegisterTotals, totals => totals.cashRegister)
  totals!: CashRegisterTotals[]; // NUEVO: Totales por método de pago

  @ManyToOne(() => User)
  @JoinColumn({ name: 'opened_by' })
  openedBy!: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'closed_by' })
  closedBy?: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
```

#### **CashMovement (Movimiento de Caja)**
```typescript
enum MovementType {
  INCOME = 'income',
  EXPENSE = 'expense',
  WITHDRAWAL = 'withdrawal',
  DEPOSIT = 'deposit',
  ADJUSTMENT = 'adjustment'
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
  id!: string;

  @ManyToOne(() => CashRegister, register => register.movements)
  @JoinColumn({ name: 'cash_register_id' })
  cashRegister!: CashRegister;

  @Column({ type: 'enum', enum: MovementType })
  movementType!: MovementType;

  @Column({ type: 'enum', enum: PaymentMethod })
  paymentMethod!: PaymentMethod;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount!: number;

  @Column({ type: 'varchar', length: 200 })
  description!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  referenceType?: string;

  @Column({ type: 'uuid', nullable: true })
  referenceId?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  createdBy!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
```

#### **CashRegisterTotals (Totales por Método de Pago)** - NUEVO Sprint 1
```typescript
@Entity('cash_register_totals')
export class CashRegisterTotals {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => CashRegister, register => register.totals)
  @JoinColumn({ name: 'cash_register_id' })
  cashRegister!: CashRegister;

  @Column({ type: 'enum', enum: PaymentMethod })
  paymentMethod!: PaymentMethod;

  // Totales calculados
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  initialAmount!: number; // Solo para CASH

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalIncome!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalExpense!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  expectedAmount!: number; // inicial + ingresos - egresos

  // Arqueo al cerrar
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  actualAmount?: number; // Contado manualmente

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  difference?: number; // actual - esperado

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
```

### 2.2 Relaciones
- **CashRegister** 1:N **CashMovement**
- **CashRegister** 1:N **CashRegisterTotals** (NUEVO)
- **CashRegister** N:1 **User** (openedBy/closedBy)
- **CashMovement** N:1 **User** (createdBy)

---

## 3. Backend (NestJS)

### 3.1 DTOs

#### Sprint 1 DTOs
```typescript
// open-cash-register.dto.ts
export class OpenCashRegisterDto {
  @IsNumber()
  @Min(0)
  initialAmount: number; // Efectivo inicial (normalmente = saldo final día anterior)

  @IsBoolean()
  @IsOptional()
  manuallyAdjusted?: boolean; // True si se modificó el saldo sugerido

  @IsString()
  @IsOptional()
  @MaxLength(500)
  adjustmentReason?: string; // Razón del ajuste (ej: "Depósito bancario de $5000")

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  openingNotes?: string;
}

// close-cash-register.dto.ts
export class CloseCashRegisterDto {
  // Monto real de efectivo contado
  @IsNumber()
  @Min(0)
  actualCashAmount: number;

  // Montos de otros métodos (opcional)
  @IsObject()
  @IsOptional()
  actualAmounts?: {
    debit_card?: number;
    credit_card?: number;
    transfer?: number;
    qr?: number;
    check?: number;
  };

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  closingNotes?: string;
}

// cash-flow-report-filters.dto.ts (NUEVO)
export class CashFlowReportFiltersDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @IsBoolean()
  @IsOptional()
  includeComparison?: boolean; // Comparar con período anterior
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
    @InjectRepository(CashRegisterTotals)
    private cashTotalsRepo: Repository<CashRegisterTotals>,
  ) {}

  // ============ SPRINT 1: Arqueo por Método de Pago ============

  async open(dto: OpenCashRegisterDto, userId: string): Promise<CashRegister> {
    const openRegister = await this.getOpenRegister();
    if (openRegister) {
      throw new BadRequestException('Ya existe una caja abierta');
    }

    // Obtener saldo final del día anterior para continuidad
    const previousRegister = await this.getPreviousDayCashRegister();
    const suggestedInitialAmount = previousRegister?.actualAmount || 0;

    // Validar si se ajustó manualmente
    if (dto.manuallyAdjusted && dto.initialAmount !== suggestedInitialAmount) {
      console.warn(
        `[CashRegister] Saldo inicial ajustado manualmente. ` +
        `Sugerido: ${suggestedInitialAmount}, Ingresado: ${dto.initialAmount}. ` +
        `Razón: ${dto.adjustmentReason || 'No especificada'}`
      );
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

    const saved = await this.cashRegisterRepo.save(cashRegister);

    // Crear totales iniciales por método de pago
    await this.initializePaymentMethodTotals(saved, dto.initialAmount);

    return saved;
  }

  // Obtener caja del día anterior para continuidad
  private async getPreviousDayCashRegister(): Promise<CashRegister | null> {
    return this.cashRegisterRepo.findOne({
      where: { status: CashRegisterStatus.CLOSED },
      order: { date: 'DESC' },
    });
  }

  // Método para obtener saldo sugerido al abrir caja
  async getSuggestedInitialAmount(): Promise<{
    suggested: number;
    previousDate: Date | null;
    previousActual: number;
  }> {
    const previousRegister = await this.getPreviousDayCashRegister();
    
    return {
      suggested: previousRegister?.actualAmount || 0,
      previousDate: previousRegister?.date || null,
      previousActual: previousRegister?.actualAmount || 0,
    };
  }

  private async initializePaymentMethodTotals(
    cashRegister: CashRegister,
    initialCashAmount: number,
  ): Promise<void> {
    const paymentMethods = Object.values(PaymentMethod);

    for (const method of paymentMethods) {
      await this.cashTotalsRepo.save({
        cashRegister,
        paymentMethod: method,
        initialAmount: method === PaymentMethod.CASH ? initialCashAmount : 0,
        totalIncome: 0,
        totalExpense: 0,
        expectedAmount: method === PaymentMethod.CASH ? initialCashAmount : 0,
      });
    }
  }

  async close(dto: CloseCashRegisterDto, userId: string): Promise<CashRegister> {
    const cashRegister = await this.cashRegisterRepo.findOne({
      where: { status: CashRegisterStatus.OPEN },
      relations: ['totals'],
    });

    if (!cashRegister) {
      throw new NotFoundException('No hay caja abierta');
    }

    // Actualizar montos reales por método de pago
    await this.updateActualAmounts(cashRegister, dto);

    // Calcular totales generales
    const expectedAmount =
      Number(cashRegister.initialAmount) +
      Number(cashRegister.totalIncome) -
      Number(cashRegister.totalExpense);

    const totalActual = this.calculateTotalActual(cashRegister.totals);
    const difference = totalActual - expectedAmount;

    cashRegister.closedAt = new Date();
    cashRegister.expectedAmount = expectedAmount;
    cashRegister.actualAmount = totalActual;
    cashRegister.difference = difference;
    cashRegister.closingNotes = dto.closingNotes;
    cashRegister.status = CashRegisterStatus.CLOSED;
    cashRegister.closedBy = { id: userId } as any;

    return this.cashRegisterRepo.save(cashRegister);
  }

  private async updateActualAmounts(
    cashRegister: CashRegister,
    dto: CloseCashRegisterDto,
  ): Promise<void> {
    // Efectivo
    const cashTotal = cashRegister.totals.find(
      t => t.paymentMethod === PaymentMethod.CASH,
    );
    if (cashTotal) {
      cashTotal.actualAmount = dto.actualCashAmount;
      cashTotal.difference = dto.actualCashAmount - Number(cashTotal.expectedAmount);
      await this.cashTotalsRepo.save(cashTotal);
    }

    // Otros métodos (si se proporcionan)
    if (dto.actualAmounts) {
      for (const [method, amount] of Object.entries(dto.actualAmounts)) {
        const total = cashRegister.totals.find(
          t => t.paymentMethod === method,
        );
        if (total && amount !== undefined) {
          total.actualAmount = amount;
          total.difference = amount - Number(total.expectedAmount);
          await this.cashTotalsRepo.save(total);
        }
      }
    }
  }

  private calculateTotalActual(totals: CashRegisterTotals[]): number {
    return totals.reduce((sum, t) => sum + Number(t.actualAmount || t.expectedAmount), 0);
  }

  async registerIncome(
    data: {
      amount: number;
      paymentMethod: PaymentMethod;
      saleId: string;
      description: string;
    },
    userId: string,
  ): Promise<CashMovement> {
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

    // Actualizar totales generales y por método de pago
    cashRegister.totalIncome = Number(cashRegister.totalIncome) + Math.abs(data.amount);
    await this.cashRegisterRepo.save(cashRegister);

    await this.updatePaymentMethodTotal(
      cashRegister.id,
      data.paymentMethod,
      Math.abs(data.amount),
      'income',
    );

    return movement;
  }

  async registerExpense(
    data: {
      amount: number;
      paymentMethod: PaymentMethod;
      expenseId: string;
      description: string;
    },
    userId: string,
  ): Promise<CashMovement> {
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

    cashRegister.totalExpense = Number(cashRegister.totalExpense) + Math.abs(data.amount);
    await this.cashRegisterRepo.save(cashRegister);

    await this.updatePaymentMethodTotal(
      cashRegister.id,
      data.paymentMethod,
      Math.abs(data.amount),
      'expense',
    );

    return movement;
  }

  private async updatePaymentMethodTotal(
    cashRegisterId: string,
    paymentMethod: PaymentMethod,
    amount: number,
    type: 'income' | 'expense',
  ): Promise<void> {
    const total = await this.cashTotalsRepo.findOne({
      where: {
        cashRegister: { id: cashRegisterId },
        paymentMethod,
      },
    });

    if (total) {
      if (type === 'income') {
        total.totalIncome = Number(total.totalIncome) + amount;
      } else {
        total.totalExpense = Number(total.totalExpense) + amount;
      }
      total.expectedAmount =
        Number(total.initialAmount) +
        Number(total.totalIncome) -
        Number(total.totalExpense);
      await this.cashTotalsRepo.save(total);
    }
  }

  async getOpenRegister(): Promise<CashRegister | null> {
    return this.cashRegisterRepo.findOne({
      where: { status: CashRegisterStatus.OPEN },
      relations: ['movements', 'movements.createdBy', 'openedBy', 'totals'],
      order: {
        movements: {
          createdAt: 'DESC',
        },
      },
    });
  }

  // ============ SPRINT 1: Reportes por Rango de Fechas ============

  async getCashFlowReport(filters: CashFlowReportFiltersDto) {
    const { startDate, endDate, paymentMethod, includeComparison } = filters;

    // Obtener registros del período principal
    const query = this.cashRegisterRepo
      .createQueryBuilder('register')
      .leftJoinAndSelect('register.totals', 'totals')
      .leftJoinAndSelect('register.movements', 'movements')
      .where('register.date BETWEEN :start AND :end', {
        start: startDate,
        end: endDate,
      });

    if (paymentMethod) {
      query.andWhere('totals.paymentMethod = :method', { method: paymentMethod });
    }

    const registers = await query.getMany();

    // Calcular período anterior para comparación
    let comparison = null;
    if (includeComparison) {
      comparison = await this.calculateComparisonPeriod(startDate, endDate);
    }

    return {
      period: { start: startDate, end: endDate },
      summary: this.calculateSummary(registers),
      byPaymentMethod: this.calculateByPaymentMethod(registers),
      dailyBreakdown: this.calculateDailyBreakdown(registers),
      comparison,
    };
  }

  private calculateSummary(registers: CashRegister[]) {
    const closedRegisters = registers.filter(r => r.status === CashRegisterStatus.CLOSED);

    return {
      totalDays: registers.length,
      closedDays: closedRegisters.length,
      totalIncome: closedRegisters.reduce((sum, r) => sum + Number(r.totalIncome), 0),
      totalExpense: closedRegisters.reduce((sum, r) => sum + Number(r.totalExpense), 0),
      netCashFlow: closedRegisters.reduce(
        (sum, r) => sum + Number(r.totalIncome) - Number(r.totalExpense),
        0,
      ),
      totalDifferences: closedRegisters.reduce((sum, r) => sum + Number(r.difference || 0), 0),
      averageDailyIncome: closedRegisters.length > 0
        ? closedRegisters.reduce((sum, r) => sum + Number(r.totalIncome), 0) / closedRegisters.length
        : 0,
    };
  }

  private calculateByPaymentMethod(registers: CashRegister[]) {
    const methodTotals: Record<string, any> = {};

    registers.forEach(register => {
      register.totals?.forEach(total => {
        if (!methodTotals[total.paymentMethod]) {
          methodTotals[total.paymentMethod] = {
            totalIncome: 0,
            totalExpense: 0,
            netAmount: 0,
            totalDifferences: 0,
          };
        }

        methodTotals[total.paymentMethod].totalIncome += Number(total.totalIncome);
        methodTotals[total.paymentMethod].totalExpense += Number(total.totalExpense);
        methodTotals[total.paymentMethod].netAmount +=
          Number(total.totalIncome) - Number(total.totalExpense);
        methodTotals[total.paymentMethod].totalDifferences += Number(total.difference || 0);
      });
    });

    return methodTotals;
  }

  private calculateDailyBreakdown(registers: CashRegister[]) {
    return registers.map(register => ({
      date: register.date,
      status: register.status,
      income: Number(register.totalIncome),
      expense: Number(register.totalExpense),
      net: Number(register.totalIncome) - Number(register.totalExpense),
      difference: Number(register.difference || 0),
      movementsCount: register.movements?.length || 0,
    }));
  }

  private async calculateComparisonPeriod(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    const prevEnd = new Date(start);
    prevEnd.setDate(prevEnd.getDate() - 1);
    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevStart.setDate - days);

    const prevRegisters = await this.cashRegisterRepo.find({
      where: {
        date: Between(prevStart, prevEnd),
      },
      relations: ['totals'],
    });

    const summary = this.calculateSummary(prevRegisters);

    return {
      period: {
        start: prevStart.toISOString().split('T')[0],
        end: prevEnd.toISOString().split('T')[0],
      },
      summary,
    };
  }

  // ============ SPRINT 2: Dashboard y Estadísticas ============

  async getDashboardStats(daysBack: number = 7) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const registers = await this.cashRegisterRepo.find({
      where: {
        date: Between(startDate, endDate),
      },
      relations: ['totals', 'movements'],
    });

    return {
      currentCash: await this.getCurrentCashBalance(),
      recentRegisters: registers,
      summary: this.calculateSummary(registers),
      byPaymentMethod: this.calculateByPaymentMethod(registers),
      topMovements: await this.getTopMovements(10),
      trends: this.calculateTrends(registers),
    };
  }

  private async getCurrentCashBalance() {
    const openRegister = await this.getOpenRegister();
    if (!openRegister) return null;

    return {
      status: 'open',
      openedAt: openRegister.openedAt,
      initialAmount: Number(openRegister.initialAmount),
      totalIncome: Number(openRegister.totalIncome),
      totalExpense: Number(openRegister.totalExpense),
      currentBalance:
        Number(openRegister.initialAmount) +
        Number(openRegister.totalIncome) -
        Number(openRegister.totalExpense),
      byPaymentMethod: openRegister.totals?.map(t => ({
        method: t.paymentMethod,
        expected: Number(t.expectedAmount),
      })),
    };
  }

  private async getTopMovements(limit: number) {
    return this.cashMovementRepo.find({
      order: { amount: 'DESC' },
      take: limit,
      relations: ['createdBy'],
    });
  }

  private calculateTrends(registers: CashRegister[]) {
    const sorted = registers.sort((a, b) => a.date.getTime() - b.date.getTime());

    return sorted.map(register => ({
      date: register.date,
      income: Number(register.totalIncome),
      expense: Number(register.totalExpense),
      net: Number(register.totalIncome) - Number(register.totalExpense),
    }));
  }

  // ============ SPRINT 3: Exportación ============

  async exportToExcel(filters: CashFlowReportFiltersDto) {
    const report = await this.getCashFlowReport(filters);
    // Retornar datos en formato que el frontend pueda convertir a Excel
    return report;
  }
}
```

### 3.3 Controller (cash-register.controller.ts)

```typescript
@Controller('cash-register')
@UseGuards(JwtAuthGuard)
@ApiTags('cash-register')
export class CashRegisterController {
  constructor(private readonly cashService: CashRegisterService) {}

  @Get('suggested-initial')
  @ApiOperation({ summary: 'Obtener saldo inicial sugerido (del día anterior)' })
  async getSuggestedInitial() {
    return this.cashService.getSuggestedInitialAmount();
  }

  @Post('open')
  @ApiOperation({ summary: 'Abrir caja' })
  async open(@Body() dto: OpenCashRegisterDto, @Req() req: any) {
    return this.cashService.open(dto, req.user.id);
  }

  @Post('close')
  @ApiOperation({ summary: 'Cerrar caja con arqueo detallado' })
  async close(@Body() dto: CloseCashRegisterDto, @Req() req: any) {
    return this.cashService.close(dto, req.user.id);
  }

  @Get('current')
  @ApiOperation({ summary: 'Obtener caja abierta actual' })
  async getCurrent() {
    return this.cashService.getOpenRegister();
  }

  @Post('movements')
  @ApiOperation({ summary: 'Crear movimiento manual' })
  async createMovement(@Body() dto: CreateCashMovementDto, @Req() req: any) {
    return this.cashService.createManualMovement(dto, req.user.id);
  }

  // ===== SPRINT 1: Reportes =====

  @Get('reports/cash-flow')
  @ApiOperation({ summary: 'Reporte de flujo de caja por rango de fechas' })
  async getCashFlowReport(@Query() filters: CashFlowReportFiltersDto) {
    return this.cashService.getCashFlowReport(filters);
  }

  // ===== SPRINT 2: Dashboard =====

  @Get('dashboard')
  @ApiOperation({ summary: 'Dashboard con estadísticas' })
  async getDashboard(@Query('days') days: number = 7) {
    return this.cashService.getDashboardStats(days);
  }

  // ===== SPRINT 3: Exportación =====

  @Get('export/excel')
  @ApiOperation({ summary: 'Exportar reporte a Excel' })
  async exportExcel(@Query() filters: CashFlowReportFiltersDto) {
    return this.cashService.exportToExcel(filters);
  }

  @Get('history')
  @ApiOperation({ summary: 'Historial de cajas' })
  async getHistory(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.cashService.findAll(start, end);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener caja por ID' })
  async getById(@Param('id') id: string) {
    return this.cashService.findOne(id);
  }
}
```

---

## 4. Frontend (React + TypeScript)

### 4.1 Tipos

```typescript
// types/index.ts
export interface CashRegisterTotals {
  id: string;
  paymentMethod: PaymentMethod;
  initialAmount: number;
  totalIncome: number;
  totalExpense: number;
  expectedAmount: number;
  actualAmount?: number;
  difference?: number;
}

export interface CashRegister {
  id: string;
  date: Date;
  openedAt: Date;
  closedAt?: Date;
  initialAmount: number;
  totalIncome: number;
  totalExpense: number;
  expectedAmount?: number;
  actualAmount?: number;
  difference?: number;
  status: CashRegisterStatus;
  openingNotes?: string;
  closingNotes?: string;
  movements: CashMovement[];
  totals: CashRegisterTotals[]; // NUEVO
  openedBy: User;
  closedBy?: User;
}

export interface CashFlowReport {
  period: { start: string; end: string };
  summary: {
    totalDays: number;
    closedDays: number;
    totalIncome: number;
    totalExpense: number;
    netCashFlow: number;
    totalDifferences: number;
    averageDailyIncome: number;
  };
  byPaymentMethod: Record<string, {
    totalIncome: number;
    totalExpense: number;
    netAmount: number;
    totalDifferences: number;
  }>;
  dailyBreakdown: Array<{
    date: Date;
    status: string;
    income: number;
    expense: number;
    net: number;
    difference: number;
    movementsCount: number;
  }>;
  comparison?: {
    period: { start: string; end: string };
    summary: any;
  };
}
```

### 4.2 API Client

```typescript
// api/index.ts
import { api } from '@/lib/axios';

export const cashRegisterApi = {
  // Core
  open: (data: OpenCashRegisterDto) => 
    api.post<CashRegister>('/api/cash-register/open', data),
    
  close: (data: CloseCashRegisterDto) => 
    api.post<CashRegister>('/api/cash-register/close', data),
    
  getCurrent: () => 
    api.get<CashRegister | null>('/api/cash-register/current'),

  // Sprint 1: Reportes
  getCashFlowReport: (filters: CashFlowReportFiltersDto) =>
    api.get<CashFlowReport>('/api/cash-register/reports/cash-flow', { params: filters }),

  // Sprint 2: Dashboard
  getDashboard: (days: number = 7) =>
    api.get<DashboardStats>('/api/cash-register/dashboard', { params: { days } }),

  // Sprint 3: Exportación
  exportExcel: (filters: CashFlowReportFiltersDto) =>
    api.get('/api/cash-register/export/excel', { 
      params: filters,
      responseType: 'blob'
    }),

  getHistory: (startDate?: string, endDate?: string) =>
    api.get<CashRegister[]>('/api/cash-register/history', { 
      params: { startDate, endDate } 
    }),
};
```

### 4.3 Componentes

#### SPRINT 1: Arqueo Detallado

**CloseCashDialog.tsx**
```tsx
export function CloseCashDialog({ 
  open, 
  onOpenChange, 
  currentRegister 
}: CloseCashDialogProps) {
  const [actualAmounts, setActualAmounts] = useState<Record<string, number>>({});
  const closeMutation = useCloseCashRegisterMutation();

  if (!currentRegister) return null;

  const handleSubmit = (data: any) => {
    closeMutation.mutate({
      actualCashAmount: data.actualCashAmount,
      actualAmounts: {
        debit_card: actualAmounts.debit_card,
        credit_card: actualAmounts.credit_card,
        transfer: actualAmounts.transfer,
        qr: actualAmounts.qr,
        check: actualAmounts.check,
      },
      closingNotes: data.closingNotes,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Cerrar Caja - Arqueo Detallado</DialogTitle>
        </DialogHeader>

        {/* Resumen General */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
          <StatCard label="Inicial" value={currentRegister.initialAmount} />
          <StatCard label="Ingresos" value={currentRegister.totalIncome} color="green" />
          <StatCard label="Egresos" value={currentRegister.totalExpense} color="red" />
        </div>

        {/* Arqueo por Método de Pago */}
        <div className="space-y-4">
          <h3 className="font-semibold">Arqueo por Método de Pago</h3>
          
          {currentRegister.totals?.map(total => (
            <PaymentMethodArqueo
              key={total.id}
              total={total}
              onActualAmountChange={(amount) => 
                setActualAmounts(prev => ({
                  ...prev,
                  [total.paymentMethod]: amount
                }))
              }
            />
          ))}
        </div>

        {/* Diferencia Total */}
        <DifferenceAlert totals={currentRegister.totals} actualAmounts={actualAmounts} />

        {/* Form */}
        <Form onSubmit={handleSubmit}>
          <Textarea name="closingNotes" label="Notas de cierre" />
          <Button type="submit">Cerrar Caja</Button>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

**PaymentMethodArqueo.tsx**
```tsx
function PaymentMethodArqueo({ total, onActualAmountChange }: Props) {
  const [actual, setActual] = useState(total.expectedAmount);
  const difference = actual - total.expectedAmount;

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <PaymentMethodIcon method={total.paymentMethod} />
          <span className="font-medium">
            {getPaymentMethodLabel(total.paymentMethod)}
          </span>
        </div>
        <Badge variant={difference === 0 ? 'success' : 'warning'}>
          {difference >= 0 ? '+' : ''}{formatCurrency(difference)}
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <label className="text-muted-foreground">Esperado</label>
          <p className="font-semibold">{formatCurrency(total.expectedAmount)}</p>
        </div>
        
        <div>
          <label className="text-muted-foreground">Real</label>
          <Input
            type="number"
            value={actual}
            onChange={(e) => {
              const val = parseFloat(e.target.value) || 0;
              setActual(val);
              onActualAmountChange(val);
            }}
            className="mt-1"
          />
        </div>

        <div>
          <label className="text-muted-foreground">Diferencia</label>
          <p className={cn(
            "font-semibold",
            difference > 0 && "text-green-600",
            difference < 0 && "text-red-600"
          )}>
            {formatCurrency(difference)}
          </p>
        </div>
      </div>

      {/* Desglose */}
      <div className="mt-2 text-xs text-muted-foreground">
        Inicial: {formatCurrency(total.initialAmount)} + 
        Ingresos: {formatCurrency(total.totalIncome)} - 
        Egresos: {formatCurrency(total.totalExpense)}
      </div>
    </div>
  );
}
```

#### SPRINT 1: Reportes por Rango

**CashFlowReportDialog.tsx**
```tsx
export function CashFlowReportDialog({ open, onOpenChange }: Props) {
  const [filters, setFilters] = useState({
    startDate: startOfWeek(new Date()),
    endDate: endOfWeek(new Date()),
    includeComparison: true,
  });

  const { data: report, isLoading } = useCashFlowReport(filters);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reporte de Flujo de Caja</DialogTitle>
        </DialogHeader>

        {/* Filtros */}
        <div className="flex gap-4">
          <DateRangePicker
            value={[filters.startDate, filters.endDate]}
            onChange={([start, end]) => setFilters(f => ({ 
              ...f, 
              startDate: start, 
              endDate: end 
            }))}
          />
          <Select
            value={filters.period}
            onChange={(period) => {
              // Presets: today, week, month, year
              setFilters(f => ({ ...f, ...getPeriodDates(period) }));
            }}
          >
            <SelectItem value="today">Hoy</SelectItem>
            <SelectItem value="week">Esta Semana</SelectItem>
            <SelectItem value="month">Este Mes</SelectItem>
            <SelectItem value="custom">Personalizado</SelectItem>
          </Select>
        </div>

        {isLoading ? <Skeleton /> : (
          <>
            {/* Resumen */}
            <Card>
              <CardHeader>
                <CardTitle>Resumen del Período</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  <MetricCard
                    label="Ingresos Totales"
                    value={report.summary.totalIncome}
                    trend={report.comparison ? calculateTrend(
                      report.summary.totalIncome,
                      report.comparison.summary.totalIncome
                    ) : null}
                  />
                  <MetricCard
                    label="Egresos Totales"
                    value={report.summary.totalExpense}
                    trend={report.comparison ? calculateTrend(
                      report.summary.totalExpense,
                      report.comparison.summary.totalExpense
                    ) : null}
                  />
                  <MetricCard
                    label="Flujo Neto"
                    value={report.summary.netCashFlow}
                    color={report.summary.netCashFlow >= 0 ? 'green' : 'red'}
                  />
                  <MetricCard
                    label="Promedio Diario"
                    value={report.summary.averageDailyIncome}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Por Método de Pago */}
            <Card>
              <CardHeader>
                <CardTitle>Desglose por Método de Pago</CardTitle>
              </CardHeader>
              <CardContent>
                <PaymentMethodBreakdownChart data={report.byPaymentMethod} />
              </CardContent>
            </Card>

            {/* Desglose Diario */}
            <Card>
              <CardHeader>
                <CardTitle>Desglose Diario</CardTitle>
              </CardHeader>
              <CardContent>
                <DailyBreakdownTable data={report.dailyBreakdown} />
              </CardContent>
            </Card>

            {/* Acciones */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => exportToPDF(report)}>
                <FileText className="mr-2 h-4 w-4" />
                Exportar PDF
              </Button>
              <Button onClick={() => exportToExcel(report)}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Exportar Excel
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

#### SPRINT 2: Dashboard

**CashFlowDashboard.tsx**
```tsx
export function CashFlowDashboard() {
  const { data: dashboard } = useDashboard(7); // Últimos 7 días
  const [selectedPeriod, setSelectedPeriod] = useState(7);

  return (
    <div className="space-y-6">
      {/* Header con selector de período */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Dashboard de Flujo de Caja</h2>
        <Select value={selectedPeriod} onChange={setSelectedPeriod}>
          <SelectItem value={7}>Última Semana</SelectItem>
          <SelectItem value={30}>Último Mes</SelectItem>
          <SelectItem value={90}>Últimos 3 Meses</SelectItem>
        </Select>
      </div>

      {/* KPIs Principales */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          title="Caja Actual"
          value={dashboard?.currentCash?.currentBalance}
          icon={Wallet}
          color="blue"
        />
        <KPICard
          title="Ingresos Período"
          value={dashboard?.summary.totalIncome}
          icon={TrendingUp}
          color="green"
          trend="+12%"
        />
        <KPICard
          title="Egresos Período"
          value={dashboard?.summary.totalExpense}
          icon={TrendingDown}
          color="red"
          trend="-5%"
        />
        <KPICard
          title="Flujo Neto"
          value={dashboard?.summary.netCashFlow}
          icon={DollarSign}
          color={dashboard?.summary.netCashFlow >= 0 ? 'green' : 'red'}
        />
      </div>

      {/* Gráfico de Tendencias - SPRINT 2 */}
      <Card>
        <CardHeader>
          <CardTitle>Evolución de Ingresos y Egresos</CardTitle>
        </CardHeader>
        <CardContent>
          <CashFlowChart data={dashboard?.trends} />
        </CardContent>
      </Card>

      {/* Desglose por Método de Pago */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Por Método de Pago</CardTitle>
          </CardHeader>
          <CardContent>
            <PaymentMethodPieChart data={dashboard?.byPaymentMethod} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Movimientos Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <TopMovementsList movements={dashboard?.topMovements} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

**CashFlowChart.tsx** - SPRINT 2
```tsx
import { Line, Bar } from 'recharts';
import { ResponsiveContainer, LineChart, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export function CashFlowChart({ data }: { data: TrendData[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="date" 
          tickFormatter={(date) => format(new Date(date), 'dd/MM')}
        />
        <YAxis tickFormatter={(value) => formatCurrency(value)} />
        <Tooltip 
          formatter={(value) => formatCurrency(value as number)}
          labelFormatter={(date) => format(new Date(date), 'dd/MM/yyyy')}
        />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="income" 
          stroke="#22c55e" 
          name="Ingresos"
          strokeWidth={2}
        />
        <Line 
          type="monotone" 
          dataKey="expense" 
          stroke="#ef4444" 
          name="Egresos"
          strokeWidth={2}
        />
        <Line 
          type="monotone" 
          dataKey="net" 
          stroke="#3b82f6" 
          name="Neto"
          strokeWidth={2}
          strokeDasharray="5 5"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

#### SPRINT 3: Exportación

```typescript
// utils/export.ts
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export function exportToExcel(report: CashFlowReport) {
  const wb = XLSX.utils.book_new();

  // Hoja 1: Resumen
  const summaryData = [
    ['Período', `${report.period.start} - ${report.period.end}`],
    [''],
    ['Métrica', 'Valor'],
    ['Total Ingresos', report.summary.totalIncome],
    ['Total Egresos', report.summary.totalExpense],
    ['Flujo Neto', report.summary.netCashFlow],
    ['Días con Caja', report.summary.closedDays],
    ['Promedio Diario', report.summary.averageDailyIncome],
  ];
  const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, ws1, 'Resumen');

  // Hoja 2: Por Método de Pago
  const methodData = Object.entries(report.byPaymentMethod).map(([method, data]) => ({
    'Método de Pago': method,
    'Ingresos': data.totalIncome,
    'Egresos': data.totalExpense,
    'Neto': data.netAmount,
    'Diferencias': data.totalDifferences,
  }));
  const ws2 = XLSX.utils.json_to_sheet(methodData);
  XLSX.utils.book_append_sheet(wb, ws2, 'Por Método de Pago');

  // Hoja 3: Desglose Diario
  const dailyData = report.dailyBreakdown.map(day => ({
    'Fecha': format(new Date(day.date), 'dd/MM/yyyy'),
    'Estado': day.status,
    'Ingresos': day.income,
    'Egresos': day.expense,
    'Neto': day.net,
    'Diferencia': day.difference,
    'Movimientos': day.movementsCount,
  }));
  const ws3 = XLSX.utils.json_to_sheet(dailyData);
  XLSX.utils.book_append_sheet(wb, ws3, 'Desglose Diario');

  // Descargar
  XLSX.writeFile(wb, `flujo-caja-${report.period.start}-${report.period.end}.xlsx`);
}

export function exportToPDF(report: CashFlowReport) {
  const doc = new jsPDF();

  // Título
  doc.setFontSize(20);
  doc.text('Reporte de Flujo de Caja', 14, 20);
  doc.setFontSize(12);
  doc.text(`Período: ${report.period.start} - ${report.period.end}`, 14, 30);

  // Resumen
  doc.autoTable({
    startY: 40,
    head: [['Métrica', 'Valor']],
    body: [
      ['Total Ingresos', formatCurrency(report.summary.totalIncome)],
      ['Total Egresos', formatCurrency(report.summary.totalExpense)],
      ['Flujo Neto', formatCurrency(report.summary.netCashFlow)],
      ['Promedio Diario', formatCurrency(report.summary.averageDailyIncome)],
    ],
  });

  // Desglose diario
  doc.addPage();
  doc.text('Desglose Diario', 14, 20);
  doc.autoTable({
    startY: 30,
    head: [['Fecha', 'Ingresos', 'Egresos', 'Neto', 'Diferencia']],
    body: report.dailyBreakdown.map(day => [
      format(new Date(day.date), 'dd/MM/yyyy'),
      formatCurrency(day.income),
      formatCurrency(day.expense),
      formatCurrency(day.net),
      formatCurrency(day.difference),
    ]),
  });

  doc.save(`flujo-caja-${report.period.start}-${report.period.end}.pdf`);
}
```

---

## 5. Plan de Implementación

### 🚀 Sprint 1: Control por Método de Pago y Reportes (Alta Prioridad)
**Duración**: 3-4 días  
**Valor**: Control preciso del dinero por cada forma de pago

**Backend**:
- ✅ Crear entidad `CashRegisterTotals`
- ✅ Modificar `open()` para inicializar totales por método
- ✅ Modificar `registerIncome/registerExpense()` para actualizar totales
- ✅ Modificar `close()` para arqueo detallado
- ✅ Endpoint `GET /reports/cash-flow` con filtros de rango

**Frontend**:
- ✅ Actualizar `CloseCashDialog` con arqueo por método
- ✅ Componente `PaymentMethodArqueo`
- ✅ Componente `CashFlowReportDialog`
- ✅ Filtros de fecha (presets + custom)

**Migración**:
```sql
CREATE TABLE cash_register_totals (
  id UUID PRIMARY KEY,
  cash_register_id UUID REFERENCES cash_registers(id),
  payment_method VARCHAR(50),
  initial_amount DECIMAL(12,2),
  total_income DECIMAL(12,2),
  total_expense DECIMAL(12,2),
  expected_amount DECIMAL(12,2),
  actual_amount DECIMAL(12,2),
  difference DECIMAL(12,2),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

---

### 🚀 Sprint 2: Dashboard y Gráficos (Media Prioridad)
**Duración**: 2-3 días  
**Valor**: Visualización clara de tendencias y patrones

**Backend**:
- ✅ Endpoint `GET /dashboard` con estadísticas
- ✅ Cálculo de tendencias y comparaciones
- ✅ Top movimientos

**Frontend**:
- ✅ Componente `CashFlowDashboard`
- ✅ Gráfico de líneas con recharts: `CashFlowChart`
- ✅ Gráfico de torta: `PaymentMethodPieChart`
- ✅ Tarjetas de KPIs con tendencias
- ✅ Selector de período (7, 30, 90 días)

**Librerías**:
```bash
npm install recharts date-fns
```

---

### 🚀 Sprint 3: Exportación (Baja Prioridad)
**Duración**: 1-2 días  
**Valor**: Integración con contabilidad externa

**Backend**:
- ✅ Endpoint `GET /export/excel` que retorna data estructurada
- ✅ Endpoint `GET /export/pdf` (opcional, puede ser solo frontend)

**Frontend**:
- ✅ Función `exportToExcel()` con XLSX
- ✅ Función `exportToPDF()` con jsPDF
- ✅ Botones de exportación en reportes

**Librerías**:
```bash
npm install xlsx jspdf jspdf-autotable
```

---

## 6. Casos de Uso

### 6.1 Sprint 1: Arqueo Detallado

**Flujo de Cierre con Arqueo**:
1. Usuario selecciona "Cerrar Caja"
2. Sistema muestra resumen por método de pago:
   - Efectivo: Esperado $13,500 → Usuario ingresa real: $13,450 → Diferencia: -$50
   - Débito: Esperado $8,000 → Automático (no se cuenta)
   - Crédito: Esperado $5,000 → Automático
3. Usuario ve diferencia total: -$50
4. Agrega notas: "Faltante por cambio mal dado"
5. Confirma cierre
6. Sistema guarda diferencias por método

### 6.2 Sprint 1: Reporte Semanal

**Flujo**:
1. Usuario selecciona "Reportes" → "Esta Semana"
2. Sistema carga datos de lunes a domingo
3. Muestra:
   - Total ingresos: $125,000
   - Total egresos: $45,000
   - Neto: $80,000
   - Comparación con semana anterior: +15%
4. Desglose por día y por método de pago
5. Usuario puede exportar a Excel

### 6.3 Sprint 2: Dashboard Diario

**Flujo**:
1. Usuario ingresa a "Caja" → Ve dashboard
2. Tarjetas muestran:
   - Caja actual: $15,000 (en tiempo real)
   - Ingresos hoy: $25,000
   - Tendencia vs ayer: +12%
3. Gráfico muestra evolución de últimos 7 días
4. Torta muestra distribución por método de pago

---

## 7. Integraciones

### Con Ventas
```typescript
// En sales.service.ts después del commit
if (status === SaleStatus.COMPLETED && dto.payments) {
  for (const payment of dto.payments) {
    await this.cashRegisterService.registerIncome({
      amount: payment.amount,
      paymentMethod: payment.paymentMethod, // Método específico
      saleId: savedSale.id,
      description: `Venta ${saleNumber}`,
    }, userId);
  }
}
```

### Con Gastos
```typescript
// En expenses.service.ts al crear/pagar gasto
if (expense.isPaid && expense.paymentMethod) {
  await this.cashRegisterService.registerExpense({
    amount: expense.amount,
    paymentMethod: expense.paymentMethod,
    expenseId: expense.id,
    description: expense.description,
  }, userId);
}
```

---

## 8. Validaciones y Reglas de Negocio

1. **Solo una caja abierta a la vez**
2. **Continuidad automática de saldo**: El saldo inicial se sugiere basado en el saldo final del día anterior
3. **Ajuste manual con advertencia**: Si se modifica el saldo sugerido, se requiere razón y se registra un log
4. **Registro automático solo si hay caja abierta** (no lanza error, solo loguea warning)
5. **Arqueo detallado obligatorio** para efectivo, opcional para otros métodos
6. **Diferencias mayores al 5%** deben incluir notas explicativas
7. **Exportación limitada a 3 meses** de histórico por performance

---

## 9. Componente Frontend: OpenCashDialog Mejorado

```tsx
// OpenCashDialog.tsx
import { useSuggestedInitialAmount } from '@/features/cash-register/hooks';

export function OpenCashDialog({ open, onOpenChange }: OpenCashDialogProps) {
  const { data: suggestion } = useSuggestedInitialAmount();
  const [manuallyAdjusted, setManuallyAdjusted] = useState(false);
  const [showAdjustmentWarning, setShowAdjustmentWarning] = useState(false);
  
  const form = useForm({
    defaultValues: {
      initialAmount: suggestion?.suggested || 0,
      adjustmentReason: '',
      openingNotes: '',
    },
  });

  // Detectar cambio manual del monto
  const handleAmountChange = (value: number) => {
    if (suggestion && value !== suggestion.suggested) {
      setManuallyAdjusted(true);
      setShowAdjustmentWarning(true);
    } else {
      setManuallyAdjusted(false);
      setShowAdjustmentWarning(false);
    }
    form.setValue('initialAmount', value);
  };

  const onSubmit = (data: any) => {
    openMutation.mutate({
      initialAmount: data.initialAmount,
      manuallyAdjusted,
      adjustmentReason: data.adjustmentReason,
      openingNotes: data.openingNotes,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Abrir Caja</DialogTitle>
          <DialogDescription>
            Registra el monto inicial de efectivo en caja
          </DialogDescription>
        </DialogHeader>

        <Form {...form} onSubmit={onSubmit}>
          {/* Información del día anterior */}
          {suggestion?.previousDate && (
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Saldo final del {formatDate(suggestion.previousDate)}:
                    </span>
                    <span className="font-semibold">
                      {formatCurrency(suggestion.previousActual)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Este es el monto sugerido para comenzar hoy
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Campo de monto inicial */}
          <FormField
            control={form.control}
            name="initialAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monto Inicial en Efectivo</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    {...field}
                    onChange={(e) => handleAmountChange(parseFloat(e.target.value) || 0)}
                    className={showAdjustmentWarning ? 'border-yellow-500' : ''}
                  />
                </FormControl>
                {suggestion && (
                  <FormDescription>
                    Sugerido: {formatCurrency(suggestion.suggested)}
                  </FormDescription>
                )}
              </FormItem>
            )}
          />

          {/* Advertencia de ajuste manual */}
          {showAdjustmentWarning && (
            <Alert variant="warning">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Monto Ajustado Manualmente</AlertTitle>
              <AlertDescription>
                El monto ingresado difiere del saldo final de ayer.
                Por favor indica el motivo del ajuste.
              </AlertDescription>
            </Alert>
          )}

          {/* Razón del ajuste (solo si se modificó) */}
          {manuallyAdjusted && (
            <FormField
              control={form.control}
              name="adjustmentReason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Razón del Ajuste *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ej: Depósito bancario de $5,000"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Explica por qué el monto difiere del día anterior
                  </FormDescription>
                </FormItem>
              )}
            />
          )}

          {/* Notas de apertura */}
          <FormField
            control={form.control}
            name="openingNotes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notas (Opcional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Cualquier observación al abrir caja..."
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={manuallyAdjusted && !form.watch('adjustmentReason')}
            >
              Abrir Caja
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 10. Caso de Uso Completo: Arqueo Diario Mejorado

### Escenario: Cerrar Caja al Final del Día

**Contexto Inicial:**
- Saldo inicial (del día anterior): $10,000
- Ingresos del día: $25,000
- Egresos del día: $8,000
- Saldo esperado: $27,000

**Flujo del Usuario:**

1. **Usuario selecciona "Cerrar Caja"**
   
2. **Sistema muestra resumen del día:**
   ```
   ┌──────────────────────────────────────┐
   │ RESUMEN DEL DÍA - 01/12/2024         │
   ├──────────────────────────────────────┤
   │ Saldo Día Anterior:      $10,000     │
   │ (+) Ingresos del Día:    $25,000     │
   │ (-) Egresos del Día:     $ 8,000     │
   │ (=) Saldo Final Esperado:$27,000     │
   └──────────────────────────────────────┘
   ```

3. **Sistema muestra desglose por método de pago:**
   
   | Método      | Inicial | Ingresos | Egresos | Esperado | Real | Diferencia |
   |-------------|---------|----------|---------|----------|------|------------|
   | Efectivo    | $10,000 | $12,000  | $5,000  | $17,000  | ?    | -          |
   | Débito      | $0      | $8,000   | $0      | $8,000   | -    | -          |
   | Crédito     | $0      | $3,000   | $0      | $3,000   | -    | -          |
   | Transfer    | $0      | $2,000   | $3,000  | -$1,000  | ?    | -          |

4. **Usuario cuenta efectivo físico:**
   - Ingresa: $16,950
   - Sistema detecta: Diferencia de -$50

5. **Sistema pide explicación (diferencia > 0%):**
   - Usuario escribe: "Faltante por cambio mal dado en venta de la tarde"

6. **Usuario confirma montos de otros métodos:**
   - Débito/Crédito: Automático (esperado)
   - Transferencias: Verifica y confirma

7. **Sistema cierra caja y muestra resumen final:**
   ```
   ┌──────────────────────────────────────┐
   │ CAJA CERRADA - 01/12/2024            │
   ├──────────────────────────────────────┤
   │ Saldo Inicial:          $10,000      │
   │ Ingresos Totales:       $25,000      │
   │ Egresos Totales:        $ 8,000      │
   │ Saldo Esperado:         $27,000      │
   │ Saldo Real Contado:     $26,950      │
   │ DIFERENCIA:             -$50 ⚠️      │
   │                                       │
   │ Este será el saldo inicial mañana    │
   └──────────────────────────────────────┘
   ```

8. **Al día siguiente:**
   - Usuario abre caja
   - Sistema sugiere: $26,950 (saldo final de ayer)
   - Usuario puede ajustar si hizo depósitos/retiros

---

## 11. Mantenimiento del Flujo de Caja

### Casos Especiales

#### Caso A: Depósito Bancario Durante el Día
**Situación**: Retiraste $5,000 para depositar en el banco

**Al día siguiente:**
1. Sistema sugiere: $22,950 (saldo real ayer)
2. Usuario modifica a: $17,950  
3. Razón: "Depósito bancario de $5,000"
4. Sistema registra el ajuste

#### Caso B: Robo o Pérdida
**Situación**: Faltaron $500 del efectivo

**Al cerrar:**
1. Esperado: $27,000
2. Real: $26,500
3. Usuario explica: "Robo - denuncia policial #12345"
4. Sistema registra diferencia y continúa con $26,500

#### Caso C: Inicio del Sistema (Primer Día)
**Situación**: No hay caja anterior

1. Sistema sugiere: $0
2. Usuario ingresa monto real de la caja física
3. No requiere razón (es el primer día)

---

## Resumen de Mejoras

| Feature | Sprint | Complejidad | Valor | Estado |
|---------|--------|-------------|-------|--------|
| 📊 Arqueo por método de pago | 1 | Media | Alto | ⏳ Pendiente |
| 🔄 Continuidad automática de saldo | 1 | Baja | Alto | ⏳ Pendiente |
| 📅 Reportes por rango | 1 | Baja | Alto | ⏳ Pendiente |
| 📈 Dashboard | 2 | Media | Medio | ⏳ Pendiente |
| 📉 Gráficos de tendencias | 2 | Media | Medio | ⏳ Pendiente |
| 📄 Exportación Excel/PDF | 3 | Baja | Bajo | ⏳ Pendiente |

**Tiempo total estimado**: 6-9 días  
**Valor agregado**: Control financiero completo y profesional con continuidad del flujo de caja

---

✨ **Módulo de Caja - Sistema Completo de Control Financiero con Continuidad**
