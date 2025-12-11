/**
 * Módulo de Gastos
 * Gestiona gastos operativos del negocio y sus categorías
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpensesService } from './expenses.service';
import { ExpenseCategoriesService } from './expense-categories.service';
import { ExpensesController } from './expenses.controller';
import { ExpenseCategoriesController } from './expense-categories.controller';
import { Expense, ExpenseCategory } from './entities';
import { CashRegisterModule } from '../cash-register/cash-register.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Expense, ExpenseCategory]),
        CashRegisterModule,
    ],
    controllers: [ExpensesController, ExpenseCategoriesController],
    providers: [ExpensesService, ExpenseCategoriesService],
    exports: [ExpensesService, ExpenseCategoriesService],
})
export class ExpensesModule { }
