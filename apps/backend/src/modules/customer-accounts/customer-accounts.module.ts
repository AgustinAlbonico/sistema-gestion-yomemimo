/**
 * Módulo de Cuentas Corrientes
 * Agrupa todas las funcionalidades de gestión de cuentas corrientes de clientes
 */
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

// Entidades
import { CustomerAccount } from './entities/customer-account.entity';
import { AccountMovement } from './entities/account-movement.entity';
import { Sale } from '../sales/entities/sale.entity';
import { Income } from '../incomes/entities/income.entity';

// Controladores
import { CustomerAccountsController } from './customer-accounts.controller';

// Servicios
import { CustomerAccountsService } from './customer-accounts.service';

// Módulos externos
import { CustomersModule } from '../customers/customers.module';
import { CashRegisterModule } from '../cash-register/cash-register.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([CustomerAccount, AccountMovement, Sale, Income]),
        ScheduleModule.forRoot(), // Para los cron jobs
        CustomersModule,
        forwardRef(() => CashRegisterModule),
    ],
    controllers: [CustomerAccountsController],
    providers: [CustomerAccountsService],
    exports: [CustomerAccountsService],
})
export class CustomerAccountsModule { }

