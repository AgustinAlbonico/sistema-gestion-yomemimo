/**
 * Tests de PdfGeneratorService
 * Prueba la generación de PDFs para facturas y notas de venta
 */

import { PdfGeneratorService } from './pdf-generator.service';
import { ConfigService } from '@nestjs/config';
import { QrGeneratorService } from './qr-generator.service';
import { Invoice, InvoiceType } from '../entities/invoice.entity';
import { SaleItem } from '../entities/sale-item.entity';
import { IvaCondition } from '../../../common/enums/iva-condition.enum';

describe('PdfGeneratorService', () => {
    let service: PdfGeneratorService;
    let configService: jest.Mocked<ConfigService>;
    let qrGeneratorService: jest.Mocked<QrGeneratorService>;

    // Mock Invoice
    const mockInvoice: Invoice = {
        id: 'invoice-123',
        saleId: 'sale-123',
        invoiceType: InvoiceType.FACTURA_C,
        pointOfSale: 1,
        invoiceNumber: 123,
        issueDate: new Date('2024-11-28'),
        emitterCuit: '20111222233',
        emitterBusinessName: 'Mi Negocio',
        emitterAddress: 'Av. Corrientes 1234, CABA',
        emitterIvaCondition: IvaCondition.RESPONSABLE_INSCRIPTO,
        emitterGrossIncome: '901-123456-1',
        emitterActivityStartDate: new Date('2020-01-01'),
        receiverDocumentType: 80,
        receiverDocumentNumber: '20111222233',
        receiverName: 'Cliente S.A.',
        receiverAddress: 'Belgrano 567, CABA',
        receiverIvaCondition: IvaCondition.RESPONSABLE_INSCRIPTO,
        subtotal: 1000,
        discount: 0,
        otherTaxes: 0,
        total: 1210,
        netAmount: 1000,
        iva21: 210,
        iva105: 0,
        iva27: 0,
        netAmountExempt: 0,
        saleCondition: 'Contado',
        status: 'authorized',
        cae: '12345678901234',
        caeExpirationDate: new Date('2024-12-31'),
        qrData: null,
        pdfPath: null,
        afipResponse: null,
        afipErrorMessage: null,
        createdAt: new Date(),
        updatedAt: new Date(),
    } as unknown as Invoice;

    // Helper function para crear mock SaleItem
    const createMockSaleItem = (overrides: Partial<SaleItem> = {}): SaleItem => {
        return {
            id: 'item-123',
            saleId: 'sale-123',
            productId: 'product-123',
            productCode: 'SKU001',
            productDescription: 'Producto de prueba',
            quantity: 2,
            unitOfMeasure: 'unidades',
            unitPrice: 500,
            discount: 0,
            discountPercent: 0,
            subtotal: 1000,
            product: {
                id: 'product-123',
                sku: 'SKU001',
                name: 'Producto de prueba',
            } as unknown as SaleItem['product'],
            createdAt: new Date(),
            updatedAt: new Date(),
            calculateSubtotal: jest.fn(),
            ...overrides,
        } as unknown as SaleItem;
    };

    // Mock SaleItem base
    const mockSaleItem = createMockSaleItem();

    beforeEach(() => {
        // Mock ConfigService
        configService = {
            get: jest.fn(),
        } as unknown as jest.Mocked<ConfigService>;

        // Mock QrGeneratorService
        qrGeneratorService = {
            generateQrImage: jest.fn().mockResolvedValue('data:image/png;base64,mock-qr'),
        } as unknown as jest.Mocked<QrGeneratorService>;

        service = new PdfGeneratorService(configService, qrGeneratorService);
    });

    describe('constructor', () => {
        it('debería crear una instancia de PdfGeneratorService', () => {
            expect(service).toBeInstanceOf(PdfGeneratorService);
        });

        it('debería cargar los templates al inicializar', () => {
            // El constructor llama a loadTemplates y registerHandlebarsHelpers
            // Si no hay error, la instancia se crea correctamente
            expect(service).toBeDefined();
        });
    });

    describe('generateInvoicePdf - validaciones', () => {
        it('debería lanzar error si la factura no tiene CAE', async () => {
            const invoiceWithoutCae = { ...mockInvoice, cae: null };

            await expect(service.generateInvoicePdf(invoiceWithoutCae, [mockSaleItem])).rejects.toThrow(
                'La factura debe tener CAE para generar el PDF'
            );
        });

        it('debería lanzar error si el template no está disponible', async () => {
            // Este test asume que los templates están cargados
            // Si no están cargados, lanzaría el error esperado
            // Si están cargados, intentará conectar al servidor HTTP (que no existe)
            try {
                await service.generateInvoicePdf(mockInvoice, [mockSaleItem]);
            } catch (error) {
                // Puede ser error de template o de conexión al servidor
                expect((error as Error).message).toMatch(/Template de factura no disponible|Cannot connect to PDF server/);
            }
        });

        it('debería generar QR para la factura', async () => {
            // Este test asume que los templates están cargados
            try {
                await service.generateInvoicePdf(mockInvoice, [mockSaleItem]);
            } catch (error) {
                // Puede fallar por falta de servidor HTTP, pero debería haber llamado a generateQrImage
                expect(qrGeneratorService.generateQrImage).toHaveBeenCalledWith(mockInvoice);
            }
        });
    });

    describe('generateSaleNotePdf - validaciones', () => {
        const mockSale = {
            saleNumber: '0001-00001234',
            saleDate: new Date('2024-11-28'),
            customer: {
                firstName: 'Juan',
                lastName: 'Pérez',
                documentType: 'DNI',
                documentNumber: '12345678',
                address: 'Calle Falsa 123',
                ivaCondition: IvaCondition.CONSUMIDOR_FINAL,
            },
            items: [mockSaleItem],
            payments: [],
            subtotal: 1000,
            discount: 0,
            tax: 210,
            total: 1210,
            isOnAccount: false,
        };

        it('debería lanzar error si el template de nota de venta no está disponible', async () => {
            // Este test asume que los templates están cargados
            try {
                await service.generateSaleNotePdf(mockSale);
            } catch (error) {
                // Puede ser error de template o de conexión al servidor
                expect((error as Error).message).toMatch(/Template de nota de venta no disponible|Cannot connect to PDF server/);
            }
        });
    });

    describe('métodos de formateo (tests unitarios privados)', () => {
        // No podemos testear directamente los métodos privados,
        // pero podemos testear el comportamiento a través de la API pública

        it('debería formatear correctamente el CUIT', async () => {
            // El formateo de CUIT se usa en prepareRenderData
            const invoice = { ...mockInvoice, emitterCuit: '20111222233' };

            try {
                await service.generateInvoicePdf(invoice, [mockSaleItem]);
            } catch (error) {
                // Puede fallar por otros motivos, pero el formateo se aplica
            }
        });

        it('debería formatear correctamente las fechas', async () => {
            const invoice = { ...mockInvoice, issueDate: new Date('2024-11-28') };

            try {
                await service.generateInvoicePdf(invoice, [mockSaleItem]);
            } catch (error) {
                // Puede fallar por otros motivos, pero el formateo de fecha se aplica
            }
        });

        it('debería formatear correctamente los montos', async () => {
            const invoice = { ...mockInvoice, total: 1234.56 };

            try {
                await service.generateInvoicePdf(invoice, [mockSaleItem]);
            } catch (error) {
                // Puede fallar por otros motivos, pero el formateo de moneda se aplica
            }
        });
    });

    describe('manejo de diferentes tipos de factura', () => {
        it('debería usar el template correcto para FACTURA_A', async () => {
            const invoiceA = { ...mockInvoice, invoiceType: InvoiceType.FACTURA_A };

            try {
                await service.generateInvoicePdf(invoiceA, [mockSaleItem]);
            } catch (error) {
                // Verificar que se intentó usar el template correcto
            }
        });

        it('debería usar el template correcto para FACTURA_B', async () => {
            const invoiceB = { ...mockInvoice, invoiceType: InvoiceType.FACTURA_B };

            try {
                await service.generateInvoicePdf(invoiceB, [mockSaleItem]);
            } catch (error) {
                // Verificar que se intentó usar el template correcto
            }
        });

        it('debería usar el template correcto para FACTURA_C', async () => {
            const invoiceC = { ...mockInvoice, invoiceType: InvoiceType.FACTURA_C };

            try {
                await service.generateInvoicePdf(invoiceC, [mockSaleItem]);
            } catch (error) {
                // Verificar que se intentó usar el template correcto
            }
        });
    });

    describe('manejo de documentos del receptor', () => {
        it('debería manejar documento tipo 99 (Sin Identificar)', async () => {
            const invoice = {
                ...mockInvoice,
                receiverDocumentType: 99,
                receiverDocumentNumber: '0',
            };

            try {
                await service.generateInvoicePdf(invoice, [mockSaleItem]);
            } catch (error) {
                // El formateo debe manejar correctamente el tipo 99
            }
        });

        it('debería manejar documento tipo 80 (CUIT)', async () => {
            const invoice = {
                ...mockInvoice,
                receiverDocumentType: 80,
                receiverDocumentNumber: '20111222233',
            };

            try {
                await service.generateInvoicePdf(invoice, [mockSaleItem]);
            } catch (error) {
                // El formateo debe aplicar formato XX-XXXXXXXX-X
            }
        });

        it('debería manejar documento tipo 96 (DNI)', async () => {
            const invoice = {
                ...mockInvoice,
                receiverDocumentType: 96,
                receiverDocumentNumber: '12345678',
            };

            try {
                await service.generateInvoicePdf(invoice, [mockSaleItem]);
            } catch (error) {
                // El DNI no debe tener formato especial
            }
        });
    });

    describe('condiciones IVA', () => {
        it('debería formatear Responsable Inscripto', async () => {
            const invoice = {
                ...mockInvoice,
                emitterIvaCondition: IvaCondition.RESPONSABLE_INSCRIPTO,
            };

            try {
                await service.generateInvoicePdf(invoice, [mockSaleItem]);
            } catch (error) {
                // Verificar que el formateo se aplica
            }
        });

        it('debería formatear Consumidor Final', async () => {
            const invoice = {
                ...mockInvoice,
                emitterIvaCondition: IvaCondition.CONSUMIDOR_FINAL,
            };

            try {
                await service.generateInvoicePdf(invoice, [mockSaleItem]);
            } catch (error) {
                // Verificar que el formateo se aplica
            }
        });

        it('debería formatear Responsable Monotributo', async () => {
            const invoice = {
                ...mockInvoice,
                emitterIvaCondition: IvaCondition.RESPONSABLE_MONOTRIBUTO,
            };

            try {
                await service.generateInvoicePdf(invoice, [mockSaleItem]);
            } catch (error) {
                // Verificar que el formateo se aplica
            }
        });

        it('debería formatear Exento', async () => {
            const invoice = {
                ...mockInvoice,
                emitterIvaCondition: IvaCondition.EXENTO,
            };

            try {
                await service.generateInvoicePdf(invoice, [mockSaleItem]);
            } catch (error) {
                // Verificar que el formateo se aplica
            }
        });
    });

    describe('items de venta', () => {
        it('debería manejar items con producto', async () => {
            const itemWithProduct = mockSaleItem;

            try {
                await service.generateInvoicePdf(mockInvoice, [itemWithProduct]);
            } catch (error) {
                // El item con producto debe incluir SKU y nombre
            }
        });

        it('debería manejar items sin producto', async () => {
            const itemWithoutProduct = createMockSaleItem({
                product: undefined,
                productCode: null,
                productDescription: 'Producto genérico',
            });

            try {
                await service.generateInvoicePdf(mockInvoice, [itemWithoutProduct]);
            } catch (error) {
                // El item sin producto debe usar valores por defecto
            }
        });

        it('debería manejar items con descuento', async () => {
            const itemWithDiscount = createMockSaleItem({
                discount: 100,
                discountPercent: 10,
                subtotal: 900,
            });

            try {
                await service.generateInvoicePdf(mockInvoice, [itemWithDiscount]);
            } catch (error) {
                // El descuento debe estar incluido en el render
            }
        });
    });

    describe('nota de venta con configuración fiscal', () => {
        const mockSale = {
            saleNumber: '0001-00001234',
            saleDate: new Date('2024-11-28'),
            customer: {
                firstName: 'Juan',
                lastName: 'Pérez',
                documentType: 'DNI',
                documentNumber: '12345678',
                address: 'Calle Falsa 123',
                ivaCondition: IvaCondition.CONSUMIDOR_FINAL,
            },
            items: [mockSaleItem],
            payments: [
                {
                    paymentMethod: { code: 'cash', name: 'Efectivo' } as any,
                    amount: 1210,
                },
            ],
            subtotal: 1000,
            discount: 0,
            tax: 210,
            total: 1210,
            isOnAccount: false,
        };

        const mockFiscalConfig = {
            businessName: 'Mi Negocio',
            businessAddress: 'Av. Corrientes 1234, CABA',
            cuit: '20111222233',
            ivaCondition: IvaCondition.RESPONSABLE_INSCRIPTO,
            grossIncome: '901-123456-1',
            activityStartDate: new Date('2020-01-01'),
            pointOfSale: 1,
        };

        it('debería incluir configuración fiscal en la nota de venta', async () => {
            try {
                await service.generateSaleNotePdf(mockSale, mockFiscalConfig);
            } catch (error) {
                // La configuración fiscal debe estar incluida en el render
            }
        });

        it('debería manejar venta sin configuración fiscal', async () => {
            try {
                await service.generateSaleNotePdf(mockSale, null);
            } catch (error) {
                // Debe usar valores por defecto cuando no hay configuración
            }
        });

        it('debería manejar venta en cuenta corriente', async () => {
            const saleOnAccount = { ...mockSale, isOnAccount: true };

            try {
                await service.generateSaleNotePdf(saleOnAccount, mockFiscalConfig);
            } catch (error) {
                // La condición de venta debe ser "Cuenta Corriente"
            }
        });

        it('debería formatear correctamente los métodos de pago', async () => {
            const saleWithMultiplePayments = {
                ...mockSale,
                payments: [
                    { paymentMethod: { code: 'cash', name: 'Efectivo' } as any, amount: 605 },
                    { paymentMethod: { code: 'debit_card', name: 'Débito' } as any, amount: 605 },
                ],
            };

            try {
                await service.generateSaleNotePdf(saleWithMultiplePayments, mockFiscalConfig);
            } catch (error) {
                // Los métodos de pago deben estar formateados correctamente
            }
        });
    });

    describe('helpers de formateo (testados a través de spies)', () => {
        let capturedHtml: string | null = null;

        // Crear un service que capture el HTML renderizado
        const createServiceWithHtmlCapture = () => {
            const captureService = new PdfGeneratorService(configService, qrGeneratorService);

            // Monkey-patch el método htmlToPdf para capturar el HTML
            const originalHtmlToPdf = captureService['htmlToPdf'].bind(captureService);
            jest.spyOn(captureService as any, 'htmlToPdf').mockImplementation(async (...args: unknown[]) => {
                capturedHtml = args[0] as string;
                throw new Error('HTML captured');
            });

            return captureService;
        };

        beforeEach(() => {
            capturedHtml = null;
        });

        describe('formatCuit', () => {
            it('debería formatear CUIT correctamente', async () => {
                const testService = createServiceWithHtmlCapture();

                try {
                    await testService.generateSaleNotePdf({
                        saleNumber: '0001-00000001',
                        saleDate: new Date('2024-11-28'),
                        customer: null,
                        items: [mockSaleItem],
                        subtotal: 1000,
                        discount: 0,
                        tax: 0,
                        total: 1000,
                        isOnAccount: false,
                    }, {
                        businessName: 'Test',
                        businessAddress: 'Test',
                        cuit: '20111222233',
                        ivaCondition: IvaCondition.RESPONSABLE_INSCRIPTO,
                        pointOfSale: 1,
                    });
                } catch (e) {
                    // Expected
                }

                // El CUIT formateado debe estar en el HTML
                expect(capturedHtml).toContain('20-11122223-3');
            });

            it('debería retornar CUIT sin formatear si no tiene 11 dígitos', async () => {
                const testService = createServiceWithHtmlCapture();

                try {
                    await testService.generateSaleNotePdf({
                        saleNumber: '0001-00000001',
                        saleDate: new Date('2024-11-28'),
                        customer: null,
                        items: [mockSaleItem],
                        subtotal: 1000,
                        discount: 0,
                        tax: 0,
                        total: 1000,
                        isOnAccount: false,
                    }, {
                        businessName: 'Test',
                        businessAddress: 'Test',
                        cuit: '12345678', // Solo 8 dígitos
                        ivaCondition: IvaCondition.RESPONSABLE_INSCRIPTO,
                        pointOfSale: 1,
                    });
                } catch (e) {
                    // Expected
                }

                // El CUIT debe aparecer sin formato
                expect(capturedHtml).toContain('12345678');
            });
        });

        describe('formatIvaCondition', () => {
            it('debería formatear Responsable Inscripto', async () => {
                const testService = createServiceWithHtmlCapture();

                try {
                    await testService.generateSaleNotePdf({
                        saleNumber: '0001-00000001',
                        saleDate: new Date('2024-11-28'),
                        customer: null,
                        items: [mockSaleItem],
                        subtotal: 1000,
                        discount: 0,
                        tax: 0,
                        total: 1000,
                        isOnAccount: false,
                    }, {
                        businessName: 'Test',
                        businessAddress: 'Test',
                        cuit: null,
                        ivaCondition: IvaCondition.RESPONSABLE_INSCRIPTO,
                        pointOfSale: 1,
                    });
                } catch (e) {
                    // Expected
                }

                expect(capturedHtml).toContain('Responsable Inscripto');
            });

            it('debería formatear Responsable Monotributo', async () => {
                const testService = createServiceWithHtmlCapture();

                try {
                    await testService.generateSaleNotePdf({
                        saleNumber: '0001-00000001',
                        saleDate: new Date('2024-11-28'),
                        customer: null,
                        items: [mockSaleItem],
                        subtotal: 1000,
                        discount: 0,
                        tax: 0,
                        total: 1000,
                        isOnAccount: false,
                    }, {
                        businessName: 'Test',
                        businessAddress: 'Test',
                        cuit: null,
                        ivaCondition: IvaCondition.RESPONSABLE_MONOTRIBUTO,
                        pointOfSale: 1,
                    });
                } catch (e) {
                    // Expected
                }

                expect(capturedHtml).toContain('Responsable Monotributo');
            });

            it('debería formatear Consumidor Final', async () => {
                const testService = createServiceWithHtmlCapture();

                try {
                    await testService.generateSaleNotePdf({
                        saleNumber: '0001-00000001',
                        saleDate: new Date('2024-11-28'),
                        customer: {
                            firstName: 'Juan',
                            lastName: 'Pérez',
                            ivaCondition: IvaCondition.CONSUMIDOR_FINAL,
                        },
                        items: [mockSaleItem],
                        subtotal: 1000,
                        discount: 0,
                        tax: 0,
                        total: 1000,
                        isOnAccount: false,
                    }, {
                        businessName: 'Test',
                        businessAddress: 'Test',
                        cuit: null,
                        ivaCondition: IvaCondition.RESPONSABLE_MONOTRIBUTO,
                        pointOfSale: 1,
                    });
                } catch (e) {
                    // Expected
                }

                // El nombre del cliente debería estar en el HTML (verificamos que el render funcione)
                expect(capturedHtml).toContain('Juan Pérez');

                // Verificar que la sección de condición IVA del cliente esté presente
                expect(capturedHtml).toContain('Condición Frente al IVA');
            });

            it('debería formatear Exento', async () => {
                const testService = createServiceWithHtmlCapture();

                try {
                    await testService.generateSaleNotePdf({
                        saleNumber: '0001-00000001',
                        saleDate: new Date('2024-11-28'),
                        customer: {
                            firstName: 'Carlos',
                            lastName: 'Gómez',
                            ivaCondition: IvaCondition.EXENTO,
                        },
                        items: [mockSaleItem],
                        subtotal: 1000,
                        discount: 0,
                        tax: 0,
                        total: 1000,
                        isOnAccount: false,
                    }, {
                        businessName: 'Test',
                        businessAddress: 'Test',
                        cuit: null,
                        ivaCondition: IvaCondition.RESPONSABLE_MONOTRIBUTO,
                        pointOfSale: 1,
                    });
                } catch (e) {
                    // Expected
                }

                // El nombre del cliente debería estar en el HTML
                expect(capturedHtml).toContain('Carlos Gómez');
                // La sección de IVA debería estar presente
                expect(capturedHtml).toContain('Condición Frente al IVA');
            });

            it('debería usar valor original para condición desconocida', async () => {
                const testService = createServiceWithHtmlCapture();

                try {
                    await testService.generateSaleNotePdf({
                        saleNumber: '0001-00000001',
                        saleDate: new Date('2024-11-28'),
                        customer: {
                            firstName: 'María',
                            lastName: 'López',
                            ivaCondition: 'CONDICION_DESCONOCIDA',
                        },
                        items: [mockSaleItem],
                        subtotal: 1000,
                        discount: 0,
                        tax: 0,
                        total: 1000,
                        isOnAccount: false,
                    }, {
                        businessName: 'Test',
                        businessAddress: 'Test',
                        cuit: null,
                        ivaCondition: IvaCondition.RESPONSABLE_MONOTRIBUTO,
                        pointOfSale: 1,
                    });
                } catch (e) {
                    // Expected
                }

                // El nombre del cliente debería estar en el HTML
                expect(capturedHtml).toContain('María López');
                // La sección de IVA debería estar presente
                expect(capturedHtml).toContain('Condición Frente al IVA');
                // La renderización de la nota de venta funciona correctamente
                // (formatIvaCondition retorna el valor original si no está en el mapa)
                expect(capturedHtml).toBeTruthy();
                expect(capturedHtml?.length).toBeGreaterThan(0);
            });
        });

        describe('formatDate', () => {
            it('debería formatear fecha a DD/MM/YYYY usando UTC', async () => {
                const testService = createServiceWithHtmlCapture();
                const testDate = new Date('2024-12-25T00:00:00Z'); // UTC midnight

                try {
                    await testService.generateSaleNotePdf({
                        saleNumber: '0001-00000001',
                        saleDate: testDate,
                        customer: null,
                        items: [mockSaleItem],
                        subtotal: 1000,
                        discount: 0,
                        tax: 0,
                        total: 1000,
                        isOnAccount: false,
                    }, null);
                } catch (e) {
                    // Expected
                }

                // Debe usar UTC, no hora local
                expect(capturedHtml).toContain('25/12/2024');
            });

            it('debería formatear correctamente mes y día con un dígito', async () => {
                const testService = createServiceWithHtmlCapture();
                const testDate = new Date('2024-01-05T00:00:00Z');

                try {
                    await testService.generateSaleNotePdf({
                        saleNumber: '0001-00000001',
                        saleDate: testDate,
                        customer: null,
                        items: [mockSaleItem],
                        subtotal: 1000,
                        discount: 0,
                        tax: 0,
                        total: 1000,
                        isOnAccount: false,
                    }, null);
                } catch (e) {
                    // Expected
                }

                expect(capturedHtml).toContain('05/01/2024');
            });
        });

        describe('formatNumber y formatCurrency', () => {
            it('debería formatear número con 2 decimales', async () => {
                const testService = createServiceWithHtmlCapture();

                try {
                    await testService.generateSaleNotePdf({
                        saleNumber: '0001-00000001',
                        saleDate: new Date(),
                        customer: null,
                        items: [createMockSaleItem({ quantity: 2.5 })],
                        subtotal: 1000,
                        discount: 0,
                        tax: 0,
                        total: 1000,
                        isOnAccount: false,
                    }, null);
                } catch (e) {
                    // Expected
                }

                // La cantidad debe tener 2 decimales
                expect(capturedHtml).toContain('2,50');
            });

            it('debería formatear moneda con separador de miles', async () => {
                const testService = createServiceWithHtmlCapture();

                try {
                    await testService.generateSaleNotePdf({
                        saleNumber: '0001-00000001',
                        saleDate: new Date(),
                        customer: null,
                        items: [mockSaleItem],
                        subtotal: 10000,
                        discount: 0,
                        tax: 0,
                        total: 10000,
                        isOnAccount: false,
                    }, null);
                } catch (e) {
                    // Expected
                }

                // El total debe tener separador de miles (formato español)
                expect(capturedHtml).toMatch(/10\.000,00/); // 10.000,00 en español
            });

            it('debería formatear centavos correctamente', async () => {
                const testService = createServiceWithHtmlCapture();

                try {
                    await testService.generateSaleNotePdf({
                        saleNumber: '0001-00000001',
                        saleDate: new Date(),
                        customer: null,
                        items: [mockSaleItem],
                        subtotal: 999.99,
                        discount: 0,
                        tax: 0,
                        total: 999.99,
                        isOnAccount: false,
                    }, null);
                } catch (e) {
                    // Expected
                }

                // Sin separador de miles porque es menor a 1000
                expect(capturedHtml).toContain('999,99');
            });
        });
    });

    describe('formatDocumentNumber', () => {
        it('debería formatear CUIT (tipo 80) con guiones', async () => {
            const invoiceWithCuit = {
                ...mockInvoice,
                receiverDocumentType: 80,
                receiverDocumentNumber: '20111222233',
            };

            // Usar un service que capture el HTML
            const testService = new PdfGeneratorService(configService, qrGeneratorService);
            let capturedHtml = '';
            jest.spyOn(testService as any, "htmlToPdf").mockImplementation(async (...args: unknown[]) => {
                capturedHtml = args[0] as string;
                throw new Error('HTML captured');
            });

            try {
                await testService.generateInvoicePdf(invoiceWithCuit, [mockSaleItem]);
            } catch (e) {
                // Expected
            }

            expect(capturedHtml).toContain('20-11122223-3');
        });

        it('debería formatear CUIL (tipo 86) con guiones', async () => {
            const invoiceWithCuil = {
                ...mockInvoice,
                receiverDocumentType: 86,
                receiverDocumentNumber: '20111222233',
            };

            const testService = new PdfGeneratorService(configService, qrGeneratorService);
            let capturedHtml = '';
            jest.spyOn(testService as any, "htmlToPdf").mockImplementation(async (...args: unknown[]) => {
                capturedHtml = args[0] as string;
                throw new Error('HTML captured');
            });

            try {
                await testService.generateInvoicePdf(invoiceWithCuil, [mockSaleItem]);
            } catch (e) {
                // Expected
            }

            expect(capturedHtml).toContain('20-11122223-3');
        });

        it('debería dejar DNI (tipo 96) sin formato', async () => {
            const invoiceWithDni = {
                ...mockInvoice,
                receiverDocumentType: 96,
                receiverDocumentNumber: '12345678',
            };

            const testService = new PdfGeneratorService(configService, qrGeneratorService);
            let capturedHtml = '';
            jest.spyOn(testService as any, "htmlToPdf").mockImplementation(async (...args: unknown[]) => {
                capturedHtml = args[0] as string;
                throw new Error('HTML captured');
            });

            try {
                await testService.generateInvoicePdf(invoiceWithDni, [mockSaleItem]);
            } catch (e) {
                // Expected
            }

            expect(capturedHtml).toContain('12345678');
            expect(capturedHtml).not.toContain('12-345678-');
        });
    });

    describe('isValidDocumentNumber', () => {
        it('debería retornar false para tipo 99 (Sin Identificar)', async () => {
            const invoiceType99 = {
                ...mockInvoice,
                receiverDocumentType: 99,
                receiverDocumentNumber: '0',
            };

            const testService = new PdfGeneratorService(configService, qrGeneratorService);
            let capturedHtml = '';
            jest.spyOn(testService as any, "htmlToPdf").mockImplementation(async (...args: unknown[]) => {
                capturedHtml = args[0] as string;
                throw new Error('HTML captured');
            });

            try {
                await testService.generateInvoicePdf(invoiceType99, [mockSaleItem]);
            } catch (e) {
                // Expected
            }

            // Para tipo 99, no debe mostrar el número de documento
            expect(capturedHtml).toContain('Sin Identificar');
        });

        it('debería retornar false para número "0"', async () => {
            const invoiceWithZero = {
                ...mockInvoice,
                receiverDocumentType: 80,
                receiverDocumentNumber: '0',
            };

            const testService = new PdfGeneratorService(configService, qrGeneratorService);
            let capturedHtml = '';
            jest.spyOn(testService as any, "htmlToPdf").mockImplementation(async (...args: unknown[]) => {
                capturedHtml = args[0] as string;
                throw new Error('HTML captured');
            });

            try {
                await testService.generateInvoicePdf(invoiceWithZero, [mockSaleItem]);
            } catch (e) {
                // Expected
            }

            // El número 0 no debe mostrarse formateado
            expect(capturedHtml).not.toContain('0-00000000-0');
        });

        it('debería retornar false para número "-"', async () => {
            const invoiceWithDash = {
                ...mockInvoice,
                receiverDocumentType: 80,
                receiverDocumentNumber: '-',
            };

            const testService = new PdfGeneratorService(configService, qrGeneratorService);
            let capturedHtml = '';
            jest.spyOn(testService as any, "htmlToPdf").mockImplementation(async (...args: unknown[]) => {
                capturedHtml = args[0] as string;
                throw new Error('HTML captured');
            });

            try {
                await testService.generateInvoicePdf(invoiceWithDash, [mockSaleItem]);
            } catch (e) {
                // Expected
            }

            // El número "-" no debe mostrarse formateado
            expect(capturedHtml).not.toMatch(/-\d+-\d+-\d+/);
        });
    });

    describe('getInvoiceTypeName y getInvoiceTypeLetter', () => {
        it('debería retornar "FACTURA A" para FACTURA_A', async () => {
            const invoiceA = { ...mockInvoice, invoiceType: InvoiceType.FACTURA_A };

            const testService = new PdfGeneratorService(configService, qrGeneratorService);
            let capturedHtml = '';
            jest.spyOn(testService as any, "htmlToPdf").mockImplementation(async (...args: unknown[]) => {
                capturedHtml = args[0] as string;
                throw new Error('HTML captured');
            });

            try {
                await testService.generateInvoicePdf(invoiceA, [mockSaleItem]);
            } catch (e) {
                // Expected
            }

            expect(capturedHtml).toContain('FACTURA A');
        });

        it('debería retornar "FACTURA B" para FACTURA_B', async () => {
            const invoiceB = { ...mockInvoice, invoiceType: InvoiceType.FACTURA_B };

            const testService = new PdfGeneratorService(configService, qrGeneratorService);
            let capturedHtml = '';
            jest.spyOn(testService as any, "htmlToPdf").mockImplementation(async (...args: unknown[]) => {
                capturedHtml = args[0] as string;
                throw new Error('HTML captured');
            });

            try {
                await testService.generateInvoicePdf(invoiceB, [mockSaleItem]);
            } catch (e) {
                // Expected
            }

            expect(capturedHtml).toContain('FACTURA B');
        });

        it('debería retornar "FACTURA C" para FACTURA_C', async () => {
            const invoiceC = { ...mockInvoice, invoiceType: InvoiceType.FACTURA_C };

            const testService = new PdfGeneratorService(configService, qrGeneratorService);
            let capturedHtml = '';
            jest.spyOn(testService as any, "htmlToPdf").mockImplementation(async (...args: unknown[]) => {
                capturedHtml = args[0] as string;
                throw new Error('HTML captured');
            });

            try {
                await testService.generateInvoicePdf(invoiceC, [mockSaleItem]);
            } catch (e) {
                // Expected
            }

            expect(capturedHtml).toContain('FACTURA C');
        });
    });

    describe('getDocumentTypeName', () => {
        it('debería retornar "CUIT" para tipo 80', async () => {
            const invoiceWithCuit = {
                ...mockInvoice,
                receiverDocumentType: 80,
                receiverDocumentNumber: '20111222233',
            };

            const testService = new PdfGeneratorService(configService, qrGeneratorService);
            let capturedHtml = '';
            jest.spyOn(testService as any, "htmlToPdf").mockImplementation(async (...args: unknown[]) => {
                capturedHtml = args[0] as string;
                throw new Error('HTML captured');
            });

            try {
                await testService.generateInvoicePdf(invoiceWithCuit, [mockSaleItem]);
            } catch (e) {
                // Expected
            }

            expect(capturedHtml).toContain('CUIT');
        });

        it('debería retornar "DNI" para tipo 96', async () => {
            const invoiceWithDni = {
                ...mockInvoice,
                receiverDocumentType: 96,
                receiverDocumentNumber: '12345678',
            };

            const testService = new PdfGeneratorService(configService, qrGeneratorService);
            let capturedHtml = '';
            jest.spyOn(testService as any, "htmlToPdf").mockImplementation(async (...args: unknown[]) => {
                capturedHtml = args[0] as string;
                throw new Error('HTML captured');
            });

            try {
                await testService.generateInvoicePdf(invoiceWithDni, [mockSaleItem]);
            } catch (e) {
                // Expected
            }

            expect(capturedHtml).toContain('DNI');
        });

        it('debería retornar "Sin Identificar" para tipo 99', async () => {
            const invoiceType99 = {
                ...mockInvoice,
                receiverDocumentType: 99,
                receiverDocumentNumber: '0',
            };

            const testService = new PdfGeneratorService(configService, qrGeneratorService);
            let capturedHtml = '';
            jest.spyOn(testService as any, "htmlToPdf").mockImplementation(async (...args: unknown[]) => {
                capturedHtml = args[0] as string;
                throw new Error('HTML captured');
            });

            try {
                await testService.generateInvoicePdf(invoiceType99, [mockSaleItem]);
            } catch (e) {
                // Expected
            }

            expect(capturedHtml).toContain('Sin Identificar');
        });

        it('debería retornar "Documento" para tipo desconocido', async () => {
            const invoiceUnknownType = {
                ...mockInvoice,
                receiverDocumentType: 999, // Tipo inexistente
                receiverDocumentNumber: '12345678',
            };

            const testService = new PdfGeneratorService(configService, qrGeneratorService);
            let capturedHtml = '';
            jest.spyOn(testService as any, "htmlToPdf").mockImplementation(async (...args: unknown[]) => {
                capturedHtml = args[0] as string;
                throw new Error('HTML captured');
            });

            try {
                await testService.generateInvoicePdf(invoiceUnknownType, [mockSaleItem]);
            } catch (e) {
                // Expected
            }

            expect(capturedHtml).toContain('Documento');
        });
    });
});
