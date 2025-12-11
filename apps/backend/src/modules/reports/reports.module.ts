/**
 * Módulo de Reportes
 * Gestiona análisis financieros y operativos
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

// Entidades
import { Sale } from '../sales/entities/sale.entity';
import { SaleItem } from '../sales/entities/sale-item.entity';
import { SalePayment } from '../sales/entities/sale-payment.entity';
import { Purchase } from '../purchases/entities/purchase.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { Product } from '../products/entities/product.entity';
import { Customer } from '../customers/entities/customer.entity';
import { CustomerAccount } from '../customer-accounts/entities/customer-account.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Sale,
            SaleItem,
            SalePayment,
            Purchase,
            Expense,
            Product,
            Customer,
            CustomerAccount,
        ]),
    ],
    controllers: [ReportsController],
    providers: [ReportsService],
    exports: [ReportsService],
})
export class ReportsModule {}
