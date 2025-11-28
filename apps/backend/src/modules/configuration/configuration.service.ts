import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { SystemConfiguration } from './entities/system-configuration.entity';
import { UpdateConfigurationDto } from './dto/update-configuration.dto';
import { Product } from '../products/entities/product.entity';

/**
 * Servicio de configuración del sistema
 */
@Injectable()
export class ConfigurationService implements OnModuleInit {
    constructor(
        @InjectRepository(SystemConfiguration)
        private readonly configRepository: Repository<SystemConfiguration>,
        private readonly dataSource: DataSource,
    ) { }

    async onModuleInit() {
        // Asegurar que existe la configuración por defecto
        const count = await this.configRepository.count();
        if (count === 0) {
            await this.configRepository.save({
                defaultProfitMargin: 30.00,
                minStockAlert: 5,
            });
        }
    }

    async getConfiguration(): Promise<SystemConfiguration> {
        const config = await this.configRepository.find();
        return config[0];
    }

    async updateConfiguration(updateDto: UpdateConfigurationDto): Promise<SystemConfiguration> {
        const config = await this.getConfiguration();
        Object.assign(config, updateDto);
        return this.configRepository.save(config);
    }

    async getDefaultProfitMargin(): Promise<number> {
        const config = await this.getConfiguration();
        return Number(config.defaultProfitMargin);
    }

    async getMinStockAlert(): Promise<number> {
        const config = await this.getConfiguration();
        return Number(config.minStockAlert);
    }

    /**
     * Actualiza el precio de TODOS los productos según el % de ganancia configurado
     */
    async updateAllProductsPrices(): Promise<{ updated: number; margin: number }> {
        const config = await this.getConfiguration();
        const margin = Number(config.defaultProfitMargin);

        const productRepo = this.dataSource.getRepository(Product);
        
        // Obtener todos los productos activos
        const products = await productRepo.find({ where: { isActive: true } });
        
        // Actualizar precio de cada producto
        for (const product of products) {
            product.price = product.cost * (1 + margin / 100);
            product.price = Math.round(product.price * 100) / 100;
            product.profitMargin = margin;
        }

        await productRepo.save(products);

        return { updated: products.length, margin };
    }
}
