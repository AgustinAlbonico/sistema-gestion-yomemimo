/**
 * Seed BÁSICO para primera instalación
 * Solo crea: usuario admin, configuración del sistema, métodos de pago e impuestos
 * NO borra datos existentes - usa upsert para evitar duplicados
 */
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'node:path';
import * as bcrypt from 'bcryptjs';

// Entidades
import { User } from '../modules/auth/entities/user.entity';
import { SystemConfiguration } from '../modules/configuration/entities/system-configuration.entity';
import { FiscalConfiguration } from '../modules/configuration/entities/fiscal-configuration.entity';
import { TaxType } from '../modules/configuration/entities/tax-type.entity';
import { PaymentMethod } from '../modules/configuration/entities/payment-method.entity';
import { IvaCondition } from '../common/enums/iva-condition.enum';

// Cargar variables de entorno
config({ path: path.resolve(__dirname, '../../../../.env') });

// La inicialización del DataSource ahora está en el bloque condicional del final o se pasa por parámetro


// ... (imports)

export async function seedAdmin(dataSource: DataSource) {
    try {
        console.log('🌱 Verificando seed básico...');

        // El dataSource ya viene inicializado desde main.ts

        const userRepo = dataSource.getRepository(User);
        const configRepo = dataSource.getRepository(SystemConfiguration);
        const fiscalConfigRepo = dataSource.getRepository(FiscalConfiguration);
        const taxTypeRepo = dataSource.getRepository(TaxType);
        const paymentMethodRepo = dataSource.getRepository(PaymentMethod);

        // === 1. USUARIO ADMIN ===
        const existingAdmin = await userRepo.findOne({ where: { username: 'admin' } });
        if (existingAdmin === null) {
            const passwordHash = await bcrypt.hash('Admin123', 10);
            await dataSource.query(
                `INSERT INTO users (username, email, "passwordHash", "firstName", "lastName", "isActive") 
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                ['admin', 'admin@nexopos.com', passwordHash, 'Administrador', 'Sistema', true]
            );
            console.log('✅ Usuario admin creado (admin / Admin123)');
        }

        // === 2. CONFIGURACIÓN DEL SISTEMA ===
        const existingConfig = await configRepo.findOne({ where: {} });
        if (existingConfig === null) {
            await configRepo.save(configRepo.create({
                defaultProfitMargin: 30,
                minStockAlert: 5,
                sistemaHabilitado: true,
            }));
            console.log('✅ Configuración del sistema creada');
        }

        // === 3. CONFIGURACIÓN FISCAL ===
        const existingFiscal = await fiscalConfigRepo.findOne({ where: {} });
        if (existingFiscal === null) {
            await fiscalConfigRepo.save(fiscalConfigRepo.create({
                businessName: 'Mi Negocio',
                cuit: '',
                ivaCondition: IvaCondition.RESPONSABLE_MONOTRIBUTO,
                pointOfSale: 1,
                isConfigured: false,
            }));
            console.log('✅ Configuración fiscal inicializada');
        }

        // === 4. TIPOS DE IMPUESTOS ===
        const taxTypesData = [
            { name: 'IVA 21%', percentage: 21, description: 'IVA General' },
            { name: 'IVA 10.5%', percentage: 10.5, description: 'IVA Reducido' },
            { name: 'IVA 27%', percentage: 27, description: 'IVA Servicios Públicos' },
            { name: 'IVA 0% (Exento)', percentage: 0, description: 'Exento de IVA' },
        ];
        for (const tax of taxTypesData) {
            const exists = await taxTypeRepo.findOne({ where: { name: tax.name } });
            if (!exists) {
                await taxTypeRepo.save(taxTypeRepo.create(tax));
            }
        }

        // === 5. MÉTODOS DE PAGO ===
        const paymentMethodsData = [
            { name: 'Efectivo', code: 'cash', isActive: true },
            { name: 'Transferencia', code: 'transfer', isActive: true },
            { name: 'Tarjeta de Débito', code: 'debit_card', isActive: true },
            { name: 'Tarjeta de Crédito', code: 'credit_card', isActive: true },
            { name: 'QR / Billetera Virtual', code: 'qr', isActive: true },
            { name: 'Cheque', code: 'check', isActive: true },
        ];
        for (const pm of paymentMethodsData) {
            const exists = await paymentMethodRepo.findOne({ where: { code: pm.code } });
            if (!exists) {
                await paymentMethodRepo.save(paymentMethodRepo.create(pm));
            }
        }
    } catch (error) {
        console.error('❌ Error en seed básico:', error);
        // No lanzamos error para no detener el arranque del servidor, solo logueamos
    }
}

// Si se ejecuta directamente (CLI)
if (require.main === module) {
    const run = async () => {
        const ds = new DataSource({
            type: 'postgres',
            host: process.env.DATABASE_HOST || 'localhost',
            port: Number.parseInt(process.env.DATABASE_PORT || '5432'),
            username: process.env.DATABASE_USER || 'postgres',
            password: process.env.DATABASE_PASSWORD || 'postgres',
            database: process.env.DATABASE_NAME || 'nexopos',
            entities: [User, SystemConfiguration, FiscalConfiguration, TaxType, PaymentMethod],
            synchronize: false,
        });

        await ds.initialize();
        await seedAdmin(ds);
        await ds.destroy();
    };

    run().catch(console.error);
}
