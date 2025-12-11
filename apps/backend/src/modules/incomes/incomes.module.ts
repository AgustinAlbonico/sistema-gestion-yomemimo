/**
 * Módulo de Ingresos
 * Gestiona ingresos por servicios y sus categorías
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IncomesService } from './incomes.service';
import { IncomeCategoriesService } from './income-categories.service';
import { IncomesController } from './incomes.controller';
import { IncomeCategoriesController } from './income-categories.controller';
import { Income, IncomeCategory } from './entities';
import { CashRegisterModule } from '../cash-register/cash-register.module';
import { CustomerAccountsModule } from '../customer-accounts/customer-accounts.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Income, IncomeCategory]),
        CashRegisterModule,
        CustomerAccountsModule,
    ],
    controllers: [IncomesController, IncomeCategoriesController],
    providers: [IncomesService, IncomeCategoriesService],
    exports: [IncomesService, IncomeCategoriesService],
})
export class IncomesModule { }
