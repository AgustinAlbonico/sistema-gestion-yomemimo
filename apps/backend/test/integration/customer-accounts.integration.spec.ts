/**
 * Tests de integración para cuentas corrientes
 * Prueban la interacción con la base de datos real
 */
import { testDataSource } from '../setup-integration';
import { Customer } from '../../src/modules/customers/entities/customer.entity';
import { CustomerAccount, AccountStatus } from '../../src/modules/customer-accounts/entities/customer-account.entity';
import { AccountMovement, MovementType } from '../../src/modules/customer-accounts/entities/account-movement.entity';
import { Repository, DataSource } from 'typeorm';

const seedCustomer = async (dataSource: DataSource): Promise<Customer> => {
    const repo = dataSource.getRepository(Customer);
    return repo.save(
        repo.create({
            firstName: 'Cliente',
            lastName: 'Cuenta',
            email: 'cliente.cta@example.com',
            documentNumber: '12345678',
            isActive: true,
        }),
    );
};

const createAccount = async (
    dataSource: DataSource,
    customerId: string,
    creditLimit = 10000,
): Promise<CustomerAccount> => {
    const repo = dataSource.getRepository(CustomerAccount);
    const account = repo.create({
        customerId,
        balance: 0,
        creditLimit,
        status: AccountStatus.ACTIVE,
        daysOverdue: 0,
        paymentTermDays: 30,
    });
    return repo.save(account);
};

describe('Integración cuentas corrientes', () => {
    let accountRepo: Repository<CustomerAccount>;
    let movementRepo: Repository<AccountMovement>;

    beforeEach(() => {
        accountRepo = testDataSource.getRepository(CustomerAccount);
        movementRepo = testDataSource.getRepository(AccountMovement);
    });

    describe('Creación de cuenta y movimientos básicos', () => {
        it('crea cuenta y registra movimientos', async () => {
            const customer = await seedCustomer(testDataSource);

            const accountEntity = accountRepo.create({
                customerId: customer.id,
                balance: 0,
                creditLimit: 0,
                status: AccountStatus.ACTIVE,
                daysOverdue: 0,
                paymentTermDays: 30,
            });
            const account = await accountRepo.save(accountEntity);

            await movementRepo.save(
                movementRepo.create({
                    accountId: account.id,
                    movementType: MovementType.CHARGE,
                    amount: 1500,
                    balanceBefore: 0,
                    balanceAfter: 1500,
                    description: 'Cargo inicial',
                    referenceType: 'manual',
                    referenceId: null,
                    paymentMethodId: null,
                    notes: null,
                    createdById: null,
                }),
            );

            const updatedAccount = await accountRepo.findOneBy({ id: account.id });
            const movements = await movementRepo.find({ where: { accountId: account.id } });

            expect(movements.length).toBe(1);
            expect(movements[0].amount).toBe(1500);
            expect(movements[0].balanceAfter).toBe(1500);
        });

        it('crea múltiples movimientos con balance correcto', async () => {
            const customer = await seedCustomer(testDataSource);
            const account = await createAccount(testDataSource, customer.id);

            // Cargo de $5000
            await movementRepo.save(
                movementRepo.create({
                    accountId: account.id,
                    movementType: MovementType.CHARGE,
                    amount: 5000,
                    balanceBefore: 0,
                    balanceAfter: 5000,
                    description: 'Venta #001',
                    referenceType: 'sale',
                    referenceId: null,
                    paymentMethodId: null,
                    notes: null,
                    createdById: null,
                }),
            );

            // Pago de $2000
            await movementRepo.save(
                movementRepo.create({
                    accountId: account.id,
                    movementType: MovementType.PAYMENT,
                    amount: -2000,
                    balanceBefore: 5000,
                    balanceAfter: 3000,
                    description: 'Pago parcial',
                    referenceType: 'manual',
                    referenceId: null,
                    paymentMethodId: null,
                    notes: null,
                    createdById: null,
                }),
            );

            // Segundo cargo de $1000
            await movementRepo.save(
                movementRepo.create({
                    accountId: account.id,
                    movementType: MovementType.CHARGE,
                    amount: 1000,
                    balanceBefore: 3000,
                    balanceAfter: 4000,
                    description: 'Venta #002',
                    referenceType: 'sale',
                    referenceId: null,
                    paymentMethodId: null,
                    notes: null,
                    createdById: null,
                }),
            );

            const movements = await movementRepo.find({
                where: { accountId: account.id },
                order: { createdAt: 'ASC' },
            });

            expect(movements.length).toBe(3);
            expect(Number(movements[0].balanceAfter)).toBe(5000);
            expect(Number(movements[1].balanceAfter)).toBe(3000);
            expect(Number(movements[2].balanceAfter)).toBe(4000);
        });
    });

    describe('Estados de cuenta', () => {
        it('maneja diferentes estados de cuenta correctamente', async () => {
            const customer = await seedCustomer(testDataSource);

            // Cuenta activa
            const activeAccount = await createAccount(testDataSource, customer.id);

            // Cuenta suspendida
            const suspendedAccount = await accountRepo.save(
                accountRepo.create({
                    customerId: customer.id,
                    balance: 5000,
                    creditLimit: 10000,
                    status: AccountStatus.SUSPENDED,
                    daysOverdue: 45,
                    paymentTermDays: 30,
                }),
            );

            const accounts = await accountRepo.find({
                where: { customerId: customer.id },
            });

            expect(accounts.length).toBe(2);
            expect(accounts.some((a) => a.status === AccountStatus.ACTIVE)).toBe(true);
            expect(accounts.some((a) => a.status === AccountStatus.SUSPENDED)).toBe(true);
        });

        it('calcula días de mora correctamente', async () => {
            const customer = await seedCustomer(testDataSource);

            // Cuenta sin mora
            await accountRepo.save(
                accountRepo.create({
                    customerId: customer.id,
                    balance: 1000,
                    creditLimit: 10000,
                    status: AccountStatus.ACTIVE,
                    daysOverdue: 0,
                    paymentTermDays: 30,
                }),
            );

            // Cuenta con mora leve
            await accountRepo.save(
                accountRepo.create({
                    customerId: customer.id,
                    balance: 3000,
                    creditLimit: 10000,
                    status: AccountStatus.ACTIVE,
                    daysOverdue: 15,
                    paymentTermDays: 30,
                }),
            );

            // Cuenta con mora severa
            await accountRepo.save(
                accountRepo.create({
                    customerId: customer.id,
                    balance: 5000,
                    creditLimit: 10000,
                    status: AccountStatus.SUSPENDED,
                    daysOverdue: 60,
                    paymentTermDays: 30,
                }),
            );

            const overdueAccounts = await accountRepo.find({
                where: { daysOverdue: 0 as any },
                relations: ['customer'],
            });

            const accountsWithMora = overdueAccounts.filter((a: any) => Number(a.daysOverdue) > 0);

            expect(accountsWithMora.length).toBe(2);
        });
    });

    describe('Tipos de movimientos', () => {
        it('registra todos los tipos de movimientos', async () => {
            const customer = await seedCustomer(testDataSource);
            const account = await createAccount(testDataSource, customer.id);

            // Cargo (CHARGE)
            await movementRepo.save(
                movementRepo.create({
                    accountId: account.id,
                    movementType: MovementType.CHARGE,
                    amount: 5000,
                    balanceBefore: 0,
                    balanceAfter: 5000,
                    description: 'Venta',
                    referenceType: 'sale',
                    referenceId: null,
                    paymentMethodId: null,
                    notes: null,
                    createdById: null,
                }),
            );

            // Pago (PAYMENT)
            await movementRepo.save(
                movementRepo.create({
                    accountId: account.id,
                    movementType: MovementType.PAYMENT,
                    amount: -2000,
                    balanceBefore: 5000,
                    balanceAfter: 3000,
                    description: 'Pago',
                    referenceType: 'manual',
                    referenceId: null,
                    paymentMethodId: null,
                    notes: null,
                    createdById: null,
                }),
            );

            // Recargo/Interés (INTEREST)
            await movementRepo.save(
                movementRepo.create({
                    accountId: account.id,
                    movementType: MovementType.INTEREST,
                    amount: 150,
                    balanceBefore: 3000,
                    balanceAfter: 3150,
                    description: 'Interés por mora',
                    referenceType: 'manual',
                    referenceId: null,
                    paymentMethodId: null,
                    notes: null,
                    createdById: null,
                }),
            );

            // Ajuste positivo (ADJUSTMENT)
            await movementRepo.save(
                movementRepo.create({
                    accountId: account.id,
                    movementType: MovementType.ADJUSTMENT,
                    amount: 50,
                    balanceBefore: 3150,
                    balanceAfter: 3200,
                    description: 'Ajuste',
                    referenceType: 'manual',
                    referenceId: null,
                    paymentMethodId: null,
                    notes: null,
                    createdById: null,
                }),
            );

            // Ajuste negativo (ADJUSTMENT)
            await movementRepo.save(
                movementRepo.create({
                    accountId: account.id,
                    movementType: MovementType.ADJUSTMENT,
                    amount: -200,
                    balanceBefore: 3200,
                    balanceAfter: 3000,
                    description: 'Reversión',
                    referenceType: 'manual',
                    referenceId: null,
                    paymentMethodId: null,
                    notes: null,
                    createdById: null,
                }),
            );

            const movements = await movementRepo.find({
                where: { accountId: account.id },
                order: { createdAt: 'ASC' },
            });

            expect(movements.length).toBe(5);
            expect(movements[0].movementType).toBe(MovementType.CHARGE);
            expect(movements[1].movementType).toBe(MovementType.PAYMENT);
            expect(movements[2].movementType).toBe(MovementType.INTEREST);
            expect(movements[3].movementType).toBe(MovementType.ADJUSTMENT);
            expect(movements[4].movementType).toBe(MovementType.ADJUSTMENT);
        });
    });

    describe('Relaciones con clientes', () => {
        it('crea múltiples cuentas para diferentes clientes', async () => {
            const customer1 = await seedCustomer(testDataSource);

            // Segundo cliente
            const customer2 = await testDataSource.getRepository(Customer).save(
                testDataSource.getRepository(Customer).create({
                    firstName: 'Otro',
                    lastName: 'Cliente',
                    email: 'otro@example.com',
                    documentNumber: '87654321',
                    isActive: true,
                }),
            );

            const account1 = await createAccount(testDataSource, customer1.id, 5000);
            const account2 = await createAccount(testDataSource, customer2.id, 15000);

            expect(account1.customerId).toBe(customer1.id);
            expect(account2.customerId).toBe(customer2.id);
            expect(Number(account1.creditLimit)).toBe(5000);
            expect(Number(account2.creditLimit)).toBe(15000);
        });

        it('busca cuentas por cliente', async () => {
            const customer = await seedCustomer(testDataSource);

            await accountRepo.save(
                accountRepo.create({
                    customerId: customer.id,
                    balance: 1000,
                    creditLimit: 5000,
                    status: AccountStatus.ACTIVE,
                    daysOverdue: 0,
                    paymentTermDays: 30,
                }),
            );

            const accounts = await accountRepo.find({
                where: { customerId: customer.id },
            });

            expect(accounts.length).toBe(1);
            expect(accounts[0].customerId).toBe(customer.id);
        });
    });

    describe('Plazos de pago', () => {
        it('maneja diferentes plazos de pago', async () => {
            const customer = await seedCustomer(testDataSource);

            // Cuenta con plazo 30 días
            await accountRepo.save(
                accountRepo.create({
                    customerId: customer.id,
                    balance: 0,
                    creditLimit: 10000,
                    status: AccountStatus.ACTIVE,
                    daysOverdue: 0,
                    paymentTermDays: 30,
                }),
            );

            // Cuenta con plazo 60 días
            await accountRepo.save(
                accountRepo.create({
                    customerId: customer.id,
                    balance: 0,
                    creditLimit: 20000,
                    status: AccountStatus.ACTIVE,
                    daysOverdue: 0,
                    paymentTermDays: 60,
                }),
            );

            const accounts = await accountRepo.find({
                where: { customerId: customer.id },
            });

            expect(accounts.length).toBe(2);
            expect(accounts.some((a) => a.paymentTermDays === 30)).toBe(true);
            expect(accounts.some((a) => a.paymentTermDays === 60)).toBe(true);
        });
    });
});
