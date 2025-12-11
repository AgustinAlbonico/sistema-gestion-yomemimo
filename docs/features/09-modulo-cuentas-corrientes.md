# Módulo: Cuentas Corrientes

## 1. Descripción y Objetivo

### 1.1 Descripción
El módulo de Cuentas Corrientes gestiona las deudas de los clientes, permitiendo ventas a crédito, registrar pagos parciales o totales, y mantener un control actualizado del saldo de cada cliente. Incluye alertas de morosidad y reportes de deudores.

### 1.2 Objetivo
- Gestionar ventas en cuenta corriente
- Registrar pagos de clientes
- Controlar saldos y deudas
- Generar estados de cuenta
- Alertar sobre morosidad
- Facilitar cobros

### 1.3 Funcionalidades Principales
- Creación automática de deudas desde ventas
- Registro de pagos (parciales o totales)
- Consulta de estado de cuenta por cliente
- Listado de clientes deudores
- Alertas de morosidad
- Historial completo de movimientos
- Reportes de cuentas corrientes

---

## 2. Modelo de Datos

### 2.1 Entidades

#### **CustomerAccount (Cuenta Corriente)**
```typescript
enum AccountStatus {
  ACTIVE = 'active',       // Cuenta activa
  SUSPENDED = 'suspended', // Cuenta suspendida (morosidad)
  CLOSED = 'closed'        // Cuenta cerrada
}

@Entity('customer_accounts')
export class CustomerAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  balance: number; // Saldo actual de la cuenta
  // Convención:
  //  balance > 0  => el cliente le debe al negocio
  //  balance = 0  => cuenta saldada
  //  balance < 0  => el negocio le debe al cliente (saldo a favor)

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  creditLimit: number; // Límite de crédito

  @Column({ type: 'enum', enum: AccountStatus, default: AccountStatus.ACTIVE })
  status: AccountStatus;

  @Column({ type: 'int', default: 0 })
  daysOverdue: number; // Días de mora

  @Column({ type: 'date', nullable: true })
  lastPaymentDate: Date; // Última fecha de pago

  @Column({ type: 'date', nullable: true })
  lastPurchaseDate: Date; // Última fecha de compra

  // Relaciones
  @OneToMany(() => AccountMovement, movement => movement.account)
  movements: AccountMovement[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
```

#### **AccountMovement (Movimiento de Cuenta)**
```typescript
enum MovementType {
  CHARGE = 'charge',         // Cargo (venta)
  PAYMENT = 'payment',       // Pago
  ADJUSTMENT = 'adjustment', // Ajuste
  DISCOUNT = 'discount',     // Descuento/bonificación
  INTEREST = 'interest'      // Interés por mora
}

@Entity('account_movements')
export class AccountMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => CustomerAccount, account => account.movements)
  @JoinColumn({ name: 'account_id' })
  account: CustomerAccount;

  @Column({ type: 'enum', enum: MovementType })
  movementType: MovementType;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number; // Positivo aumenta la deuda, negativo la reduce
  // Convención de signos:
  //  amount > 0  => débito al cliente (cargo, venta, interés)
  //  amount < 0  => crédito al cliente (pago, descuento, ajuste a favor)

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  balanceBefore: number; // Saldo antes del movimiento

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  balanceAfter: number; // Saldo después del movimiento (running balance)

  @Column({ type: 'varchar', length: 200 })
  description: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  referenceType: string; // 'sale', 'payment'

  @Column({ type: 'uuid', nullable: true })
  referenceId: string; // ID de la venta relacionada

  @Column({ type: 'enum', enum: PaymentMethod, nullable: true })
  paymentMethod: PaymentMethod; // Si es pago

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
- **CustomerAccount** 1:1 **Customer** (cada cliente tiene una cuenta)
- **CustomerAccount** 1:N **AccountMovement** (una cuenta tiene muchos movimientos)
- **AccountMovement** N:1 **User** (usuario que registró el movimiento)

---

## 3. Backend (NestJS)

### 3.1 DTOs

```typescript
// create-charge.dto.ts
export class CreateChargeDto {
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  description: string;

  @IsString()
  @IsOptional()
  saleId?: string; // Referencia a venta

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  notes?: string;
}

// create-payment.dto.ts
export class CreatePaymentDto {
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  notes?: string;

  // En esta primera versión simple, los pagos siempre se imputan
  // al saldo total del cliente. En el futuro se podría extender
  // para imputar manualmente a documentos específicos.
}

// account-filters.dto.ts
export class AccountFiltersDto {
  @IsOptional()
  @IsEnum(AccountStatus)
  status?: AccountStatus;

  @IsOptional()
  @IsBoolean()
  hasDebt?: boolean; // Con saldo > 0

  @IsOptional()
  @IsBoolean()
  isOverdue?: boolean; // Con días de mora > 0
}
```

### 3.2 Service (customer-accounts.service.ts)

```typescript
@Injectable()
export class CustomerAccountsService {
  constructor(
    @InjectRepository(CustomerAccount)
    private accountRepo: Repository<CustomerAccount>,
    @InjectRepository(AccountMovement)
    private movementRepo: Repository<AccountMovement>,
    private customersService: CustomersService,
  ) {}

  // Obtener o crear cuenta de cliente
  async getOrCreateAccount(customerId: string): Promise<CustomerAccount> {
    let account = await this.accountRepo.findOne({
      where: { customer: { id: customerId } },
      relations: ['customer', 'movements']
    });

    if (!account) {
      // Verificar que el cliente existe
      await this.customersService.findOne(customerId);

      account = this.accountRepo.create({
        customer: { id: customerId } as any,
        balance: 0,
        creditLimit: 0,
        status: AccountStatus.ACTIVE,
        daysOverdue: 0,
      });

      await this.accountRepo.save(account);
    }

    return account;
  }

  // Crear cargo (desde venta)
  async createCharge(dto: CreateChargeDto, userId: string): Promise<AccountMovement> {
    const account = await this.getOrCreateAccount(dto.customerId);

    // Verificar límite de crédito
    if (account.creditLimit > 0 && 
        (account.balance + dto.amount) > account.creditLimit) {
      throw new BadRequestException(
        `El cliente ha excedido su límite de crédito (${account.creditLimit})`
      );
    }

    // Verificar si está suspendido
    if (account.status === AccountStatus.SUSPENDED) {
      throw new BadRequestException('La cuenta del cliente está suspendida');
    }

    const movement = this.movementRepo.create({
      account,
      movementType: MovementType.CHARGE,
      amount: Math.abs(dto.amount),
      balanceBefore: account.balance,
      balanceAfter: account.balance + Math.abs(dto.amount),
      description: dto.description,
      referenceType: dto.saleId ? 'sale' : 'manual',
      referenceId: dto.saleId,
      notes: dto.notes,
      createdBy: { id: userId } as any,
    });

    await this.movementRepo.save(movement);

    // Actualizar saldo de la cuenta
    account.balance += Math.abs(dto.amount);
    account.lastPurchaseDate = new Date();
    await this.accountRepo.save(account);

    return movement;
  }

  // Registrar pago
  async createPayment(dto: CreatePaymentDto, userId: string): Promise<AccountMovement> {
    const account = await this.getOrCreateAccount(dto.customerId);
    
    // En este diseño simple, permitimos dos comportamientos posibles:
    // A) Solo cancelar deuda (no permitir saldo a favor)
    // B) Permitir saldo a favor del cliente (pago mayor a la deuda)
    //
    // Por defecto implementamos A) para mantener la operación simple y segura.
    // Si se quisiera habilitar saldo a favor en el futuro, se podría
    // quitar la validación del monto y documentarlo claramente.

    if (account.balance <= 0) {
      throw new BadRequestException('El cliente no tiene deuda pendiente');
    }

    // Validar que el pago no exceda la deuda (no se permite saldo a favor)
    if (dto.amount > account.balance) {
      throw new BadRequestException(
        `El pago (${dto.amount}) excede la deuda pendiente (${account.balance})`
      );
    }

    const movement = this.movementRepo.create({
      account,
      movementType: MovementType.PAYMENT,
      amount: -Math.abs(dto.amount),
      balanceBefore: account.balance,
      balanceAfter: account.balance - Math.abs(dto.amount),
      description: dto.description || `Pago recibido`,
      paymentMethod: dto.paymentMethod,
      referenceType: 'payment',
      notes: dto.notes,
      createdBy: { id: userId } as any,
    });

    await this.movementRepo.save(movement);

    // Actualizar saldo de la cuenta
    account.balance -= Math.abs(dto.amount);
    account.lastPaymentDate = new Date();

    // Si saldo = 0, resetear días de mora
    if (account.balance === 0) {
      account.daysOverdue = 0;
      if (account.status === AccountStatus.SUSPENDED) {
        account.status = AccountStatus.ACTIVE;
      }
    }

    await this.accountRepo.save(account);

    return movement;
  }

  // Obtener estado de cuenta
  async getAccountStatement(customerId: string) {
    const account = await this.getOrCreateAccount(customerId);

    const movements = await this.movementRepo.find({
      where: { account: { id: account.id } },
      relations: ['createdBy'],
      order: { createdAt: 'DESC' }
    });

    const totalCharges = movements
      .filter(m => m.movementType === MovementType.CHARGE)
      .reduce((sum, m) => sum + Number(m.amount), 0);

    const totalPayments = movements
      .filter(m => m.movementType === MovementType.PAYMENT)
      .reduce((sum, m) => sum + Math.abs(Number(m.amount)), 0);

    return {
      account,
      movements,
      summary: {
        totalCharges,
        totalPayments,
        currentBalance: account.balance,
        customerPosition:
          account.balance > 0
            ? 'customer_owes'   // El cliente le debe al negocio
            : account.balance < 0
            ? 'business_owes'   // El negocio le debe al cliente (saldo a favor)
            : 'settled',        // Cuenta en cero
      }
    };
  }

  // Listar todas las cuentas
  async findAll(filters?: AccountFiltersDto) {
    const query = this.accountRepo.createQueryBuilder('account')
      .leftJoinAndSelect('account.customer', 'customer')
      .orderBy('account.balance', 'DESC');

    if (filters?.status) {
      query.andWhere('account.status = :status', { status: filters.status });
    }

    if (filters?.hasDebt) {
      query.andWhere('account.balance > 0');
    }

    if (filters?.isOverdue) {
      query.andWhere('account.daysOverdue > 0');
    }

    return query.getMany();
  }

  // Clientes deudores
  async getDebtors() {
    return this.accountRepo.find({
      where: { balance: MoreThan(0) },
      relations: ['customer'],
      order: { balance: 'DESC' }
    });
  }

  // Actualizar límite de crédito
  async updateCreditLimit(customerId: string, creditLimit: number): Promise<CustomerAccount> {
    const account = await this.getOrCreateAccount(customerId);
    account.creditLimit = creditLimit;
    return this.accountRepo.save(account);
  }

  // Suspender cuenta
  async suspendAccount(customerId: string): Promise<CustomerAccount> {
    const account = await this.getOrCreateAccount(customerId);
    account.status = AccountStatus.SUSPENDED;
    return this.accountRepo.save(account);
  }

  // Reactivar cuenta
  async activateAccount(customerId: string): Promise<CustomerAccount> {
    const account = await this.getOrCreateAccount(customerId);
    account.status = AccountStatus.ACTIVE;
    return this.accountRepo.save(account);
  }

  // Actualizar días de mora (ejecutar diariamente)
  async updateOverdueDays() {
    const accounts = await this.accountRepo.find({
      where: { balance: MoreThan(0) },
      relations: ['movements']
    });

    for (const account of accounts) {
      // Buscar último cargo sin pagar completo
      const lastCharge = account.movements
        .filter(m => m.movementType === MovementType.CHARGE)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];

      if (lastCharge) {
        const daysSinceCharge = Math.floor(
          (Date.now() - lastCharge.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        );

        account.daysOverdue = daysSinceCharge;

        // Suspender si más de 30 días de mora
        if (daysSinceCharge > 30 && account.status === AccountStatus.ACTIVE) {
          account.status = AccountStatus.SUSPENDED;
        }

        await this.accountRepo.save(account);
      }
    }
  }

  // Estadísticas
  async getStats() {
    const accounts = await this.findAll();
    
    const debtors = accounts.filter(a => a.balance > 0);
    const totalDebt = debtors.reduce((sum, a) => sum + Number(a.balance), 0);
    const overdueAccounts = accounts.filter(a => a.daysOverdue > 0);
    const totalOverdue = overdueAccounts.reduce((sum, a) => sum + Number(a.balance), 0);

    return {
      totalAccounts: accounts.length,
      activeAccounts: accounts.filter(a => a.status === AccountStatus.ACTIVE).length,
      suspendedAccounts: accounts.filter(a => a.status === AccountStatus.SUSPENDED).length,
      totalDebtors: debtors.length,
      totalDebt,
      averageDebt: debtors.length > 0 ? totalDebt / debtors.length : 0,
      overdueAccounts: overdueAccounts.length,
      totalOverdue,
    };
  }
}
```

---

## 4. Frontend (React)

### 4.1 Página Principal: CustomerAccountsPage.tsx

```tsx
export function CustomerAccountsPage() {
  const { data: accounts } = useCustomerAccounts({ hasDebt: true });
  const { data: stats } = useAccountsStats();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Cuentas Corrientes</h1>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatsCard
          title="Total Deudores"
          value={stats?.totalDebtors || 0}
          icon={Users}
        />
        <StatsCard
          title="Deuda Total"
          value={formatCurrency(stats?.totalDebt || 0)}
          icon={TrendingUp}
        />
        <StatsCard
          title="En Mora"
          value={stats?.overdueAccounts || 0}
          variant="warning"
          icon={AlertTriangle}
        />
        <StatsCard
          title="Deuda en Mora"
          value={formatCurrency(stats?.totalOverdue || 0)}
          variant="danger"
          icon={AlertTriangle}
        />
      </div>

      {/* Tabla de Deudores */}
      <Card>
        <CardHeader>
          <CardTitle>Clientes con Deuda</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Cliente</th>
                <th className="text-right py-2">Saldo</th>
                <th className="text-right py-2">Límite</th>
                <th className="text-right py-2">Días Mora</th>
                <th className="text-center py-2">Estado</th>
                <th className="text-center py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {accounts?.map((account) => (
                <tr key={account.id} className="border-b">
                  <td className="py-2">
                    {account.customer.firstName} {account.customer.lastName}
                  </td>
                  <td className="text-right font-semibold">
                    {formatCurrency(account.balance)}
                  </td>
                  <td className="text-right text-muted-foreground">
                    {formatCurrency(account.creditLimit)}
                  </td>
                  <td className="text-right">
                    {account.daysOverdue > 0 && (
                      <Badge variant="warning">{account.daysOverdue} días</Badge>
                    )}
                  </td>
                  <td className="text-center">
                    <Badge
                      variant={
                        account.status === 'active' ? 'success' :
                        account.status === 'suspended' ? 'destructive' :
                        'default'
                      }
                    >
                      {account.status}
                    </Badge>
                  </td>
                  <td className="text-center">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/accounts/${account.customer.id}`)}
                    >
                      Ver Estado
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 4.2 Página de Estado de Cuenta: AccountStatementPage.tsx

```tsx
export function AccountStatementPage() {
  const { customerId } = useParams();
  const { data: statement } = useAccountStatement(customerId);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate(-1)}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver
      </Button>

      {/* Info del Cliente */}
      <Card>
        <CardHeader>
          <CardTitle>
            {statement?.account.customer.firstName} {statement?.account.customer.lastName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-muted-foreground">Saldo Actual</label>
              <p className="text-3xl font-bold text-red-600">
                {formatCurrency(statement?.account.balance || 0)}
              </p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Límite de Crédito</label>
              <p className="text-2xl font-bold">
                {formatCurrency(statement?.account.creditLimit || 0)}
              </p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Días de Mora</label>
              <p className="text-2xl font-bold">
                {statement?.account.daysOverdue || 0} días
              </p>
            </div>
          </div>

          <div className="mt-4">
            <Button onClick={() => setPaymentDialogOpen(true)}>
              Registrar Pago
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Movimientos */}
      <Card>
        <CardHeader>
          <CardTitle>Movimientos</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Fecha</th>
                <th className="text-left py-2">Descripción</th>
                <th className="text-right py-2">Debe</th>
                <th className="text-right py-2">Haber</th>
                <th className="text-right py-2">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {statement?.movements.map((movement) => (
                <tr key={movement.id} className="border-b">
                  <td className="py-2">{formatDate(movement.createdAt)}</td>
                  <td>{movement.description}</td>
                  <td className="text-right">
                    {movement.amount > 0 && formatCurrency(movement.amount)}
                  </td>
                  <td className="text-right">
                    {movement.amount < 0 && formatCurrency(Math.abs(movement.amount))}
                  </td>
                  <td className="text-right font-semibold">
                    {formatCurrency(movement.balanceAfter)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <PaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        customerId={customerId}
        currentDebt={statement?.account.balance || 0}
      />
    </div>
  );
}
```

---

## 5. Casos de Uso

### 5.1 Venta en Cuenta Corriente

**Flujo (desde módulo de ventas)**:
1. Vendedor selecciona cliente
2. Marca "Venta en Cuenta Corriente"
3. Sistema valida límite de crédito
4. Sistema valida estado de cuenta (no suspendida)
5. Sistema crea venta sin pagos
6. Sistema crea cargo en cuenta corriente
7. Saldo del cliente se incrementa

### 5.2 Registrar Pago

**Flujo**:
1. Usuario busca cliente
2. Accede a estado de cuenta
3. Click en "Registrar Pago"
4. Ingresa monto y método de pago
5. Sistema valida que pago ≤ deuda
6. Sistema registra pago
7. Saldo del cliente se reduce
8. Si saldo = 0, resetea días de mora

### 5.3 Suspender Cuenta

**Flujo manual**:
1. Usuario detecta morosidad
2. Click en "Suspender Cuenta"
3. Sistema cambia estado a SUSPENDED
4. Cliente no puede comprar en cuenta hasta reactivar

**Flujo automático (cron job)**:
1. Sistema ejecuta tarea diaria
2. Calcula días de mora de cada cliente
3. Si días > 30, suspende automáticamente

---

## 6. Integraciones

### Con Ventas:
```typescript
// Después de crear venta en cuenta
if (sale.isOnAccount) {
  await accountsService.createCharge({
    customerId: sale.customer.id,
    amount: sale.total,
    description: `Venta ${sale.saleNumber}`,
    saleId: sale.id
  });
}
```

### Con Caja:
```typescript
// Al registrar pago de cuenta corriente
const payment = await accountsService.createPayment({
  customerId, amount, paymentMethod
});

// Registrar ingreso en caja
await cashService.registerIncome({
  amount: payment.amount,
  paymentMethod,
  description: `Pago cuenta corriente`
});
```

---

**Módulo de Cuentas Corrientes completo** ✅
