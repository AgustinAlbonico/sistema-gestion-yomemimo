/**
 * Integración: ingresos y gastos
 */
import { testDataSource } from '../setup-integration';
import { Income } from '../../src/modules/incomes/entities/income.entity';
import { IncomeCategory } from '../../src/modules/incomes/entities/income-category.entity';
import { Expense } from '../../src/modules/expenses/entities/expense.entity';
import { ExpenseCategory } from '../../src/modules/expenses/entities/expense-category.entity';
import { PaymentMethod } from '../../src/modules/configuration/entities/payment-method.entity';

const seedPaymentMethod = async (): Promise<PaymentMethod> => {
    const repo = testDataSource.getRepository(PaymentMethod);
    return repo.save(repo.create({ name: 'Efectivo', code: 'cash', isActive: true }));
};

const seedIncomeCategory = async (): Promise<IncomeCategory> => {
    const repo = testDataSource.getRepository(IncomeCategory);
    return repo.save(repo.create({ name: 'Servicios', isActive: true }));
};

const seedExpenseCategory = async (): Promise<ExpenseCategory> => {
    const repo = testDataSource.getRepository(ExpenseCategory);
    return repo.save(repo.create({ name: 'Operativo', isActive: true }));
};

describe('Integración ingresos y gastos', () => {
    it('crea ingreso y gasto con método de pago', async () => {
        const paymentMethod = await seedPaymentMethod();
        const incomeCategory = await seedIncomeCategory();
        const expenseCategory = await seedExpenseCategory();
        const incomeRepo = testDataSource.getRepository(Income);
        const expenseRepo = testDataSource.getRepository(Expense);

        const incomeEntity = incomeRepo.create({
            description: 'Ingreso integración',
            amount: 2000,
            incomeDate: new Date(),
            isOnAccount: false,
            paymentMethodId: paymentMethod.id,
            categoryId: incomeCategory.id,
            isPaid: true,
        });
        await incomeRepo.save(incomeEntity);

        const expenseEntity = expenseRepo.create({
            description: 'Gasto integración',
            amount: 1000,
            expenseDate: new Date(),
            paymentMethodId: paymentMethod.id,
            categoryId: expenseCategory.id,
            isPaid: true,
        });
        await expenseRepo.save(expenseEntity);

        const savedIncome = await incomeRepo.findOneBy({ id: incomeEntity.id });
        const savedExpense = await expenseRepo.findOneBy({ id: expenseEntity.id });

        expect(savedIncome?.amount).toBe(2000);
        expect(savedExpense?.amount).toBe(1000);
    });
});
