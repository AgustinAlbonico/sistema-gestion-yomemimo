/**
 * Módulo de Compras
 * Gestiona compras a proveedores con integración a inventario
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PurchasesService } from './purchases.service';
import { PurchasesController } from './purchases.controller';
import { Purchase, PurchaseItem } from './entities';
import { InventoryModule } from '../inventory/inventory.module';
import { ProductsModule } from '../products/products.module';
import { CashRegisterModule } from '../cash-register/cash-register.module';
import { SuppliersModule } from '../suppliers/suppliers.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Purchase, PurchaseItem]),
        InventoryModule,
        ProductsModule,
        CashRegisterModule,
        SuppliersModule,
    ],
    controllers: [PurchasesController],
    providers: [PurchasesService],
    exports: [PurchasesService],
})
export class PurchasesModule {}

