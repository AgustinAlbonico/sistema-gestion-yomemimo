/**
 * Módulo de Ventas
 * Configura el módulo de ventas con sus dependencias
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';
import { Sale } from './entities/sale.entity';
import { SaleItem } from './entities/sale-item.entity';
import { SalePayment } from './entities/sale-payment.entity';
import { SaleTax } from './entities/sale-tax.entity';
import { Invoice } from './entities/invoice.entity';
import { InventoryModule } from '../inventory/inventory.module';
import { ProductsModule } from '../products/products.module';
// ConfigurationModule es @Global(), no necesita importarse
// Servicios de facturación
import { InvoiceController } from './invoice.controller';
import { InvoiceService } from './services/invoice.service';
import { AfipService } from './services/afip.service';
import { PdfGeneratorService } from './services/pdf-generator.service';
import { QrGeneratorService } from './services/qr-generator.service';
import { CashRegisterModule } from '../cash-register/cash-register.module';
import { CustomerAccountsModule } from '../customer-accounts/customer-accounts.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Sale, SaleItem, SalePayment, SaleTax, Invoice]),
        InventoryModule,
        ProductsModule,
        CashRegisterModule,
        CustomerAccountsModule, // Para registrar ventas en cuenta corriente
        // ConfigurationModule es @Global(), no necesita importarse explícitamente
    ],
    controllers: [SalesController, InvoiceController],
    providers: [
        SalesService,
        InvoiceService,
        AfipService,
        PdfGeneratorService,
        QrGeneratorService,
    ],
    exports: [SalesService, InvoiceService, AfipService],
})
export class SalesModule { }

