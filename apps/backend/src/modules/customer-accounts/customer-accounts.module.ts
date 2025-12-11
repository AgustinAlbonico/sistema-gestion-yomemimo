/**
 * Módulo de Cuentas Corrientes
 * Agrupa todas las funcionalidades de gestión de cuentas corrientes de clientes
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

// Entidades
import { CustomerAccount } from './entities/customer-account.entity';
import { AccountMovement } from './entities/account-movement.entity';

// Controladores
import { CustomerAccountsController } from './customer-accounts.controller';

// Servicios
import { CustomerAccountsService } from './customer-accounts.service';

// Módulos externos
import { CustomersModule } from '../customers/customers.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([CustomerAccount, AccountMovement]),
        ScheduleModule.forRoot(), // Para los cron jobs
        CustomersModule,
    ],
    controllers: [CustomerAccountsController],
    providers: [CustomerAccountsService],
    exports: [CustomerAccountsService],
})
export class CustomerAccountsModule { }
