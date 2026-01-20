/**
 * Tests de integración para módulo configuration
 * Cubre: ConfigurationService, PaymentMethodsService, FiscalConfigurationService
 * Enfoque: Pruebas con BD real PostgreSQL usando TestingModule
 */
import { Test } from '@nestjs/testing';
import { testDataSource } from '../setup-integration';
import { SystemConfiguration } from '../../src/modules/configuration/entities/system-configuration.entity';
import { PaymentMethod } from '../../src/modules/configuration/entities/payment-method.entity';
import { FiscalConfiguration, AfipEnvironment } from '../../src/modules/configuration/entities/fiscal-configuration.entity';
import { IvaCondition } from '../../src/common/enums/iva-condition.enum';
import { Product } from '../../src/modules/products/entities/product.entity';
import { Category } from '../../src/modules/products/entities/category.entity';
import { ConfigurationService } from '../../src/modules/configuration/configuration.service';
import { PaymentMethodsService } from '../../src/modules/configuration/services/payment-methods.service';
import { FiscalConfigurationService } from '../../src/modules/configuration/fiscal-configuration.service';
import { CertificateEncryptionService } from '../../src/modules/configuration/certificate-encryption.service';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

describe('Integración: módulo configuration', () => {
    let configService: ConfigurationService;
    let paymentMethodsService: PaymentMethodsService;
    let fiscalConfigService: FiscalConfigurationService;
    let dataSource: DataSource;

    beforeAll(async () => {
        dataSource = testDataSource;

        const mockConfigService = {
            get: jest.fn((key: string) => {
                if (key === 'AFIP_ENCRYPTION_KEY') {
                    return Buffer.alloc(32, 'a').toString('base64');
                }
                return undefined;
            }),
        } as unknown as ConfigService;

        const module = await Test.createTestingModule({
            providers: [
                ConfigurationService,
                PaymentMethodsService,
                FiscalConfigurationService,
                CertificateEncryptionService,
                { provide: ConfigService, useValue: mockConfigService },
                { provide: DataSource, useValue: dataSource },
                { provide: getRepositoryToken(SystemConfiguration), useValue: dataSource.getRepository(SystemConfiguration) },
                { provide: getRepositoryToken(PaymentMethod), useValue: dataSource.getRepository(PaymentMethod) },
                { provide: getRepositoryToken(FiscalConfiguration), useValue: dataSource.getRepository(FiscalConfiguration) },
            ],
        }).compile();

        configService = module.get<ConfigurationService>(ConfigurationService);
        paymentMethodsService = module.get<PaymentMethodsService>(PaymentMethodsService);
        fiscalConfigService = module.get<FiscalConfigurationService>(FiscalConfigurationService);
    });

    describe('ConfigurationService', () => {
        it('debe crear configuración por defecto en onModuleInit', async () => {
            const configRepo = dataSource.getRepository(SystemConfiguration);

            await configService.onModuleInit();

            const configs = await configRepo.find();
            expect(configs).toHaveLength(1);
            expect(Number(configs[0].defaultProfitMargin)).toBe(30);
            expect(configs[0].minStockAlert).toBe(5);
        });

        it('debe obtener la configuración existente', async () => {
            await configService.onModuleInit();

            const config = await configService.getConfiguration();

            expect(config).toBeDefined();
            expect(config.id).toBeDefined();
            expect(config.defaultProfitMargin).toBeDefined();
        });

        it('debe actualizar la configuración', async () => {
            await configService.onModuleInit();

            const updated = await configService.updateConfiguration({
                defaultProfitMargin: 40,
                minStockAlert: 10,
            });

            expect(Number(updated.defaultProfitMargin)).toBe(40);
            expect(updated.minStockAlert).toBe(10);
        });

        it('debe actualizar precios de productos sin categoría y sin margen personalizado', async () => {
            await configService.onModuleInit();

            const productRepo = dataSource.getRepository(Product);

            const product1 = productRepo.create({
                name: 'Producto 1',
                cost: 100,
                price: 150,
                isActive: true,
                useCustomMargin: false,
            });
            const product2 = productRepo.create({
                name: 'Producto 2',
                cost: 200,
                price: 250,
                isActive: true,
                useCustomMargin: false,
                categoryId: null,
            });
            await productRepo.save([product1, product2]);

            const result = await configService.updateAllProductsPrices(50);

            expect(result.margin).toBe(50);
            expect(result.updated).toBe(2);

            const updated1 = await productRepo.findOneBy({ id: product1.id });
            const updated2 = await productRepo.findOneBy({ id: product2.id });

            expect(Number(updated1?.price)).toBe(150); // 100 * 1.5
            expect(Number(updated2?.price)).toBe(300); // 200 * 1.5
        });

        it('debe saltar productos con margen personalizado', async () => {
            await configService.onModuleInit();

            const productRepo = dataSource.getRepository(Product);

            const productCustom = productRepo.create({
                name: 'Producto Custom',
                cost: 100,
                price: 200,
                isActive: true,
                useCustomMargin: true,
                profitMargin: 100,
            });
            await productRepo.save(productCustom);

            const result = await configService.updateAllProductsPrices(30);

            expect(result.skipped).toBe(1);

            const unchanged = await productRepo.findOneBy({ id: productCustom.id });
            expect(Number(unchanged?.price)).toBe(200);
        });
    });

    describe('PaymentMethodsService', () => {
        it('debe crear métodos de pago por defecto en seed', async () => {
            await paymentMethodsService.seed();

            const paymentRepo = dataSource.getRepository(PaymentMethod);
            const methods = await paymentRepo.find({ withDeleted: true });

            expect(methods.length).toBeGreaterThanOrEqual(7);

            const cash = methods.find(m => m.code === 'cash');
            expect(cash).toBeDefined();
            expect(cash?.name).toBe('Efectivo');

            const qr = methods.find(m => m.code === 'qr');
            expect(qr).toBeDefined();
            expect(qr?.name).toBe('QR / Billetera Virtual');
        });

        it('debe restaurar métodos de pago eliminados', async () => {
            const paymentRepo = dataSource.getRepository(PaymentMethod);

            // Crear un método que ya existe (del seed anterior)
            await paymentMethodsService.seed();

            const cash = await paymentRepo.findOne({ where: { code: 'cash' } });
            expect(cash).toBeDefined();

            // Eliminarlo suavemente
            if (cash) {
                await paymentRepo.softDelete(cash.id);

                let deleted = await paymentRepo.findOne({
                    where: { id: cash.id },
                    withDeleted: true,
                });
                expect(deleted?.deletedAt).toBeDefined();

                // Correr seed nuevamente - debería restaurarlo
                await paymentMethodsService.seed();

                deleted = await paymentRepo.findOne({
                    where: { id: cash.id },
                    withDeleted: true,
                });
                expect(deleted?.deletedAt).toBeNull();
            }
        });

        it('debe desactivar método wallet si existe', async () => {
            const paymentRepo = dataSource.getRepository(PaymentMethod);

            const wallet = paymentRepo.create({
                name: 'Billetera',
                code: 'wallet',
                isActive: true,
            });
            await paymentRepo.save(wallet);

            await paymentMethodsService.deactivateWalletMethod();

            const deactivated = await paymentRepo.findOneBy({ code: 'wallet' });
            expect(deactivated?.isActive).toBe(false);
        });

        it('debe retornar solo métodos activos en findAll', async () => {
            await paymentMethodsService.seed();
            await paymentMethodsService.deactivateWalletMethod();

            const activeMethods = await paymentMethodsService.findAll();

            const wallet = activeMethods.find(m => m.code === 'wallet');
            expect(wallet).toBeUndefined();

            expect(activeMethods.some(m => m.code === 'cash')).toBe(true);
            expect(activeMethods.some(m => m.code === 'qr')).toBe(true);
        });
    });

    describe('FiscalConfigurationService', () => {
        it('debe crear configuración fiscal por defecto en onModuleInit', async () => {
            await fiscalConfigService.onModuleInit();

            const fiscalRepo = dataSource.getRepository(FiscalConfiguration);
            const count = await fiscalRepo.count();

            expect(count).toBe(1);
        });

        it('debe obtener configuración fiscal', async () => {
            await fiscalConfigService.onModuleInit();

            const config = await fiscalConfigService.getConfiguration();

            expect(config).toBeDefined();
            expect(config.id).toBeDefined();
            expect(config.ivaCondition).toBeDefined();
        });

        it('debe actualizar datos del emisor', async () => {
            await fiscalConfigService.onModuleInit();

            const updated = await fiscalConfigService.updateEmitterData({
                businessName: 'Empresa Actualizada S.A.',
                cuit: '20012345675',
                grossIncome: '987654321',
                activityStartDate: '2021-01-01',
                businessAddress: 'Nueva Dirección 123',
                ivaCondition: IvaCondition.RESPONSABLE_INSCRIPTO,
                pointOfSale: 5,
            });

            expect(updated.businessName).toBe('Empresa Actualizada S.A.');
            expect(updated.cuit).toBe('20012345675');
        });

        it('debe rechazar CUIT inválido', async () => {
            await fiscalConfigService.onModuleInit();

            await expect(
                fiscalConfigService.updateEmitterData({
                    businessName: 'Empresa Test',
                    cuit: '11111111111',
                })
            ).rejects.toThrow();
        });

        it('debe cambiar entorno de AFIP', async () => {
            await fiscalConfigService.onModuleInit();

            const homologacion = await fiscalConfigService.setEnvironment(AfipEnvironment.HOMOLOGACION);
            expect(homologacion.afipEnvironment).toBe(AfipEnvironment.HOMOLOGACION);

            const produccion = await fiscalConfigService.setEnvironment(AfipEnvironment.PRODUCCION);
            expect(produccion.afipEnvironment).toBe(AfipEnvironment.PRODUCCION);
        });

        it('debe subir certificados para homologación', async () => {
            await fiscalConfigService.onModuleInit();

            const certPem = '-----BEGIN CERTIFICATE-----\nMIIB...\n-----END CERTIFICATE-----';
            const keyPem = '-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----';

            const updated = await fiscalConfigService.uploadCertificates({
                environment: AfipEnvironment.HOMOLOGACION,
                certificate: Buffer.from(certPem).toString('base64'),
                privateKey: Buffer.from(keyPem).toString('base64'),
            });

            expect(updated.homologacionReady).toBe(true);

            const fiscalRepo = dataSource.getRepository(FiscalConfiguration);
            const config = await fiscalRepo.findOne({ where: {} });
            expect(config?.homologacionCertificate).toBe(certPem);
            expect(config?.homologacionPrivateKey).toBe(keyPem);
            expect(config?.homologacionFingerprint).toBeDefined();
        });

        it('debe eliminar certificados de un entorno', async () => {
            await fiscalConfigService.onModuleInit();

            const certPem = '-----BEGIN CERTIFICATE-----\nMIIB...\n-----END CERTIFICATE-----';
            const keyPem = '-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----';

            await fiscalConfigService.uploadCertificates({
                environment: AfipEnvironment.PRODUCCION,
                certificate: Buffer.from(certPem).toString('base64'),
                privateKey: Buffer.from(keyPem).toString('base64'),
            });

            const updated = await fiscalConfigService.deleteCertificates(AfipEnvironment.PRODUCCION);

            expect(updated.produccionReady).toBe(false);

            const fiscalRepo = dataSource.getRepository(FiscalConfiguration);
            const config = await fiscalRepo.findOne({ where: {} });
            expect(config?.produccionCertificate).toBeNull();
            expect(config?.produccionPrivateKey).toBeNull();
            expect(config?.produccionFingerprint).toBeNull();
        });

        it('debe calcular estado de expiración correctamente', async () => {
            await fiscalConfigService.onModuleInit();

            // Verificar estado sin certificados
            const statusWithoutCert = await fiscalConfigService.getCertificateExpirationStatus();
            expect(statusWithoutCert.homologacion.status).toBe('unknown');
            expect(statusWithoutCert.homologacion.expiresAt).toBeNull();
            expect(statusWithoutCert.produccion.status).toBe('unknown');

            // Subir certificados con fecha futura lejana
            const certPem = '-----BEGIN CERTIFICATE-----\nMIIB...\n-----END CERTIFICATE-----';
            const keyPem = '-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----';

            await fiscalConfigService.uploadCertificates({
                environment: AfipEnvironment.HOMOLOGACION,
                certificate: Buffer.from(certPem).toString('base64'),
                privateKey: Buffer.from(keyPem).toString('base64'),
                // Sin fecha de expiración - debería ser 'unknown'
            });

            const status = await fiscalConfigService.getCertificateExpirationStatus();

            // Sin fecha de expiración, el status debería ser 'unknown'
            expect(status.homologacion.expiresAt).toBeNull();
            expect(status.homologacion.status).toBe('unknown');
        });

        it('debe verificar si está listo para facturar', async () => {
            await fiscalConfigService.onModuleInit();

            await fiscalConfigService.updateEmitterData({
                businessName: 'Empresa Lista S.A.',
                cuit: '20012345675',
                grossIncome: '123456789',
                businessAddress: 'Calle Falsa 123',
                ivaCondition: IvaCondition.RESPONSABLE_INSCRIPTO,
            });

            const certPem = '-----BEGIN CERTIFICATE-----\nMIIB...\n-----END CERTIFICATE-----';
            const keyPem = '-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----';

            await fiscalConfigService.uploadCertificates({
                environment: AfipEnvironment.HOMOLOGACION,
                certificate: Buffer.from(certPem).toString('base64'),
                privateKey: Buffer.from(keyPem).toString('base64'),
                expiresAt: '2030-12-31',
            });

            const ready = await fiscalConfigService.isReadyForInvoicing();

            expect(ready.ready).toBe(true);
            expect(ready.missingFields).toEqual([]);
        });

        it('debe indicar campos faltantes para facturar', async () => {
            await fiscalConfigService.onModuleInit();

            const ready = await fiscalConfigService.isReadyForInvoicing();

            expect(ready.ready).toBe(false);
            expect(ready.missingFields.length).toBeGreaterThan(0);
        });

        it('debe guardar y recuperar token WSAA', async () => {
            await fiscalConfigService.onModuleInit();

            const token = 'test-token-' + Date.now();
            const sign = 'test-sign-' + Date.now();
            const expirationTime = new Date(Date.now() + 3600000);

            await fiscalConfigService.saveWsaaToken(token, sign, expirationTime);

            const stored = await fiscalConfigService.getStoredWsaaToken();

            expect(stored).toEqual({ token, sign, expirationTime });
        });

        it('debe limpiar token WSAA', async () => {
            await fiscalConfigService.onModuleInit();

            await fiscalConfigService.saveWsaaToken(
                'token',
                'sign',
                new Date(Date.now() + 3600000)
            );

            await fiscalConfigService.clearWsaaToken();

            const stored = await fiscalConfigService.getStoredWsaaToken();

            expect(stored).toBeNull();
        });
    });

    describe('Integración entre ConfigurationService y Productos', () => {
        it('debe respetar categorías con margen definido', async () => {
            await configService.onModuleInit();

            const categoryRepo = dataSource.getRepository(Category);
            const productRepo = dataSource.getRepository(Product);

            const category = categoryRepo.create({
                name: 'Electrónica',
                profitMargin: 40,
            });
            await categoryRepo.save(category);

            const product = productRepo.create({
                name: 'Producto en categoría',
                cost: 100,
                price: 130,
                isActive: true,
                useCustomMargin: false,
                categoryId: category.id,
            });
            await productRepo.save(product);

            const result = await configService.updateAllProductsPrices(30);

            expect(result.updated).toBe(0);
            expect(result.skippedByCategory).toBe(1);

            const unchanged = await productRepo.findOneBy({ id: product.id });
            expect(Number(unchanged?.price)).toBe(130);
        });
    });
});
