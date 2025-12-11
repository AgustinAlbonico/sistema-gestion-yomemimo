import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { ProductsRepository } from './products.repository';
import { Product } from './entities/product.entity';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { CategoriesRepository } from './categories.repository';
import { Category } from './entities/category.entity';
import { ConfigurationModule } from '../configuration/configuration.module';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Product, Category]),
        ConfigurationModule,
        forwardRef(() => InventoryModule),
    ],
    controllers: [ProductsController, CategoriesController],
    providers: [
        ProductsService,
        ProductsRepository,
        CategoriesService,
        CategoriesRepository,
    ],
    exports: [ProductsService, CategoriesService],
})
export class ProductsModule { }
