import { Module } from '@nestjs/common';
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

@Module({
    imports: [
        TypeOrmModule.forFeature([Product, Category]),
        ConfigurationModule,
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
