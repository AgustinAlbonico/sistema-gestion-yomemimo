/**
 * Script de seed para poblar la base de datos con datos de ejemplo
 * Orientado a negocio de belleza, marroquinería y accesorios
 */
import { DataSource, DeepPartial } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';
import * as bcrypt from 'bcryptjs';
import { User } from '../modules/auth/entities/user.entity';
import { RefreshToken } from '../modules/auth/entities/refresh-token.entity';
import { Category } from '../modules/products/entities/category.entity';
import { Product } from '../modules/products/entities/product.entity';
import { SystemConfiguration } from '../modules/configuration/entities/system-configuration.entity';
import { TaxType } from '../modules/configuration/entities/tax-type.entity';
import { CustomerCategory } from '../modules/customers/entities/customer-category.entity';
import { Customer, DocumentType } from '../modules/customers/entities/customer.entity';
import { IvaCondition } from '../common/enums/iva-condition.enum';
import { ExpenseCategory } from '../modules/expenses/entities/expense-category.entity';
import { Expense } from '../modules/expenses/entities/expense.entity';
import { PaymentMethod } from '../modules/cash-register/entities/cash-movement.entity';
import { PaymentMethod as PaymentMethodEntity } from '../modules/configuration/entities/payment-method.entity';
import { Supplier } from '../modules/suppliers/entities/supplier.entity';
import { Purchase, PurchaseStatus, PaymentMethod as PurchasePaymentMethod } from '../modules/purchases/entities/purchase.entity';
import { PurchaseItem } from '../modules/purchases/entities/purchase-item.entity';
import { parseLocalDate, formatDateLocal } from '../common/utils/date.utils';

// Cargar variables de entorno desde la raíz del monorepo
config({ path: path.resolve(__dirname, '../../../../.env') });

const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    username: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'sistema_gestion',
    entities: [
        User,
        RefreshToken,
        Category,
        Product,
        SystemConfiguration,
        TaxType,
        CustomerCategory,
        Customer,
        ExpenseCategory,
        Expense,
        PaymentMethodEntity,
        Supplier,
        Purchase,
        PurchaseItem,
    ],
    synchronize: true,
    dropSchema: true, // Forzar sincronización para actualizar esquema
});

/**
 * Helper para generar fechas pasadas
 */
function getDateDaysAgo(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return formatDateLocal(date);
}

/**
 * Helper para generar fechas futuras
 */
function getDateDaysFromNow(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return formatDateLocal(date);
}

async function seed() {
    try {
        console.log('🌱 Iniciando seed de base de datos...');
        console.log('Connecting to database...');
        await dataSource.initialize();
        console.log('✅ Database connected successfully.');

        // === Crear usuario admin ===
        const userRepository = dataSource.getRepository(User);
        const username = 'admin';
        const email = 'admin@admin.com';

        const existingUser = await userRepository.findOneBy({ username });

        let adminUser: User;
        if (existingUser) {
            console.log(`⚠️  El usuario ${username} ya existe. Actualizando contraseña...`);
            // Actualizar contraseña del usuario existente usando update para evitar el hook
            const passwordHash = await bcrypt.hash('Admin123', 10);
            await userRepository.update(existingUser.id, {
                passwordHash,
                firstName: 'Agustín',
                lastName: 'Albónico',
                isActive: true,
            });
            // Recargar el usuario actualizado
            adminUser = await userRepository.findOneBy({ id: existingUser.id }) as User;
            console.log(`✅ Contraseña del usuario ${username} actualizada:`);
            console.log(`   Username: ${username}`);
            console.log(`   Password: Admin123`);
        } else {
            const newUser = userRepository.create({
                username,
                email,
                passwordHash: 'Admin123', // El hook @BeforeInsert de la entidad se encargará de hashearlo
                firstName: 'Agustín',
                lastName: 'Albónico',
                isActive: true,
            });

            adminUser = await userRepository.save(newUser);
            console.log(`✅ Usuario creado exitosamente:`);
            console.log(`   Username: ${username}`);
            console.log(`   Password: Admin123`);
        }

        // === Crear configuración por defecto ===
        const configRepository = dataSource.getRepository(SystemConfiguration);
        const count = await configRepository.count();

        if (count === 0) {
            const config = configRepository.create({
                defaultProfitMargin: 30.00,
                minStockAlert: 5,
            });
            await configRepository.save(config);
            console.log('✅ Configuración del sistema creada (margen: 30%, alerta stock: 5)');
        } else {
            console.log('⚠️  La configuración del sistema ya existe.');
        }

        // === Crear tipos de impuestos ===
        const taxTypeRepository = dataSource.getRepository(TaxType);
        const taxTypesData = [
            { name: 'IVA 21%', percentage: 21, description: 'IVA General' },
            { name: 'IVA 10.5%', percentage: 10.5, description: 'IVA Reducido' },
            { name: 'IVA 27%', percentage: 27, description: 'IVA Servicios Públicos' },
            { name: 'IVA 0% (Exento)', percentage: 0, description: 'Exento de IVA' },
            { name: 'Ingresos Brutos', percentage: null, description: 'Porcentaje variable según jurisdicción' },
            { name: 'Impuesto Interno', percentage: null, description: 'Impuesto variable' },
        ];

        let taxTypesCount = 0;
        for (const taxData of taxTypesData) {
            const exists = await taxTypeRepository.findOneBy({ name: taxData.name });
            if (!exists) {
                const taxType = taxTypeRepository.create(taxData);
                await taxTypeRepository.save(taxType);
                taxTypesCount++;
            }
        }
        if (taxTypesCount > 0) {
            console.log(`✅ ${taxTypesCount} tipos de impuestos creados`);
        } else {
            console.log('⚠️  Los tipos de impuestos ya existen.');
        }

        // === Crear categorías de productos ===
        const categoryRepository = dataSource.getRepository(Category);
        const categoriesData = [
            // Belleza
            { name: 'Maquillaje', description: 'Bases, labiales, sombras, rubores', color: '#ec4899' },
            { name: 'Cuidado Facial', description: 'Cremas, serums, limpiadores faciales', color: '#f59e0b' },
            { name: 'Cuidado Capilar', description: 'Shampoos, acondicionadores, tratamientos', color: '#8b5cf6' },
            { name: 'Perfumería', description: 'Perfumes, colonias, desodorantes', color: '#06b6d4' },
            { name: 'Uñas', description: 'Esmaltes, removedores, accesorios de uñas', color: '#ef4444' },
            // Marroquinería
            { name: 'Carteras', description: 'Carteras, billeteras, monederos', color: '#6366f1' },
            { name: 'Bolsos', description: 'Bolsos, mochilas, carteras de mano', color: '#14b8a6' },
            { name: 'Cinturones', description: 'Cinturones de cuero y sintéticos', color: '#a855f7' },
            { name: 'Accesorios', description: 'Llaveros, tarjeteros, organizadores', color: '#f97316' },
            // Otros
            { name: 'Joyería', description: 'Aros, collares, pulseras, anillos', color: '#eab308' },
            { name: 'Relojes', description: 'Relojes de pulsera y accesorios', color: '#3b82f6' },
        ];

        const categories: Category[] = [];
        for (const catData of categoriesData) {
            const category = categoryRepository.create(catData);
            categories.push(await categoryRepository.save(category));
        }
        console.log(`✅ ${categories.length} categorías de productos creadas`);

        // === Crear productos ===
        const productRepository = dataSource.getRepository(Product);
        const productsData = [
            // Maquillaje
            { name: 'Base Líquida Natural Beige', cost: 4500, stock: 15, category: categories[0], sku: 'MAQ-001' },
            { name: 'Labial Mate Rojo Intenso', cost: 3200, stock: 25, category: categories[0], sku: 'MAQ-002' },
            { name: 'Paleta de Sombras 12 Colores', cost: 6800, stock: 10, category: categories[0], sku: 'MAQ-003' },
            { name: 'Rubor en Polvo Rosa', cost: 2800, stock: 20, category: categories[0], sku: 'MAQ-004' },
            { name: 'Máscara de Pestañas Waterproof', cost: 3500, stock: 18, category: categories[0], sku: 'MAQ-005' },
            { name: 'Delineador Líquido Negro', cost: 2400, stock: 22, category: categories[0], sku: 'MAQ-006' },
            { name: 'Corrector Alta Cobertura', cost: 2900, stock: 16, category: categories[0], sku: 'MAQ-007' },
            { name: 'Polvo Translúcido Compacto', cost: 3100, stock: 14, category: categories[0], sku: 'MAQ-008' },

            // Cuidado Facial
            { name: 'Crema Hidratante Día SPF 30', cost: 5200, stock: 12, category: categories[1], sku: 'CF-001' },
            { name: 'Serum Vitamina C', cost: 7500, stock: 8, category: categories[1], sku: 'CF-002' },
            { name: 'Limpiador Facial Espumoso', cost: 3800, stock: 20, category: categories[1], sku: 'CF-003' },
            { name: 'Mascarilla Facial Arcilla', cost: 4200, stock: 15, category: categories[1], sku: 'CF-004' },
            { name: 'Tónico Facial Equilibrante', cost: 3600, stock: 18, category: categories[1], sku: 'CF-005' },
            { name: 'Crema Anti-edad Noche', cost: 6800, stock: 10, category: categories[1], sku: 'CF-006' },

            // Cuidado Capilar
            { name: 'Shampoo Reparador 500ml', cost: 3200, stock: 25, category: categories[2], sku: 'CC-001' },
            { name: 'Acondicionador Hidratante 500ml', cost: 3200, stock: 25, category: categories[2], sku: 'CC-002' },
            { name: 'Mascarilla Capilar Nutritiva', cost: 4500, stock: 15, category: categories[2], sku: 'CC-003' },
            { name: 'Aceite Capilar Argan', cost: 4800, stock: 12, category: categories[2], sku: 'CC-004' },
            { name: 'Spray Termoprotector', cost: 2800, stock: 20, category: categories[2], sku: 'CC-005' },

            // Perfumería
            { name: 'Perfume Mujer 50ml', cost: 12500, stock: 8, category: categories[3], sku: 'PERF-001' },
            { name: 'Perfume Hombre 50ml', cost: 12500, stock: 8, category: categories[3], sku: 'PERF-002' },
            { name: 'Colonia Unisex 100ml', cost: 6800, stock: 15, category: categories[3], sku: 'PERF-003' },
            { name: 'Desodorante Roll-on', cost: 1800, stock: 30, category: categories[3], sku: 'PERF-004' },

            // Uñas
            { name: 'Esmalte Rojo Clásico', cost: 1200, stock: 40, category: categories[4], sku: 'UÑ-001' },
            { name: 'Esmalte Rosa Nude', cost: 1200, stock: 35, category: categories[4], sku: 'UÑ-002' },
            { name: 'Esmalte Azul Marino', cost: 1200, stock: 30, category: categories[4], sku: 'UÑ-003' },
            { name: 'Top Coat Brillante', cost: 1500, stock: 25, category: categories[4], sku: 'UÑ-004' },
            { name: 'Removedor de Esmalte 200ml', cost: 1800, stock: 20, category: categories[4], sku: 'UÑ-005' },

            // Carteras
            { name: 'Cartera Cuero Negro', cost: 8500, stock: 10, category: categories[5], sku: 'CAR-001' },
            { name: 'Billetera Cuero Marrón', cost: 5200, stock: 15, category: categories[5], sku: 'CAR-002' },
            { name: 'Monedero Cuero Negro', cost: 3200, stock: 20, category: categories[5], sku: 'CAR-003' },
            { name: 'Cartera Sintética Rosa', cost: 4500, stock: 12, category: categories[5], sku: 'CAR-004' },
            { name: 'Tarjetero Cuero', cost: 2800, stock: 18, category: categories[5], sku: 'CAR-005' },

            // Bolsos
            { name: 'Bolso Tote Cuero Negro', cost: 18500, stock: 5, category: categories[6], sku: 'BOL-001' },
            { name: 'Bolso Bandolera Cuero', cost: 15200, stock: 6, category: categories[6], sku: 'BOL-002' },
            { name: 'Mochila Cuero Marrón', cost: 22000, stock: 4, category: categories[6], sku: 'BOL-003' },
            { name: 'Cartera de Mano Sintética', cost: 6800, stock: 10, category: categories[6], sku: 'BOL-004' },
            { name: 'Bolso Crossbody Pequeño', cost: 9800, stock: 8, category: categories[6], sku: 'BOL-005' },

            // Cinturones
            { name: 'Cinturón Cuero Negro 3cm', cost: 4500, stock: 15, category: categories[7], sku: 'CIN-001' },
            { name: 'Cinturón Cuero Marrón 4cm', cost: 5200, stock: 12, category: categories[7], sku: 'CIN-002' },
            { name: 'Cinturón Sintético Negro', cost: 2800, stock: 20, category: categories[7], sku: 'CIN-003' },

            // Accesorios
            { name: 'Llavero Cuero con Logo', cost: 1800, stock: 30, category: categories[8], sku: 'ACC-001' },
            { name: 'Organizador de Tarjetas', cost: 2200, stock: 25, category: categories[8], sku: 'ACC-002' },
            { name: 'Porta Documentos Cuero', cost: 3800, stock: 15, category: categories[8], sku: 'ACC-003' },

            // Joyería
            { name: 'Aros Aro Dorado', cost: 3200, stock: 20, category: categories[9], sku: 'JOY-001' },
            { name: 'Collar Plata 45cm', cost: 5800, stock: 12, category: categories[9], sku: 'JOY-002' },
            { name: 'Pulsera Ajustable Plata', cost: 4200, stock: 15, category: categories[9], sku: 'JOY-003' },
            { name: 'Anillo Plata Talla 16', cost: 3800, stock: 10, category: categories[9], sku: 'JOY-004' },

            // Relojes
            { name: 'Reloj Analógico Cuero', cost: 12500, stock: 8, category: categories[10], sku: 'REL-001' },
            { name: 'Reloj Digital Deportivo', cost: 9800, stock: 10, category: categories[10], sku: 'REL-002' },
        ];

        const profitMargin = 30;
        const products: Product[] = [];
        for (const prodData of productsData) {
            const price = prodData.cost * (1 + profitMargin / 100);
            const product = productRepository.create({
                name: prodData.name,
                cost: prodData.cost,
                price: Math.round(price * 100) / 100,
                profitMargin,
                stock: prodData.stock,
                category: prodData.category,
                sku: prodData.sku,
                isActive: true,
            });
            products.push(await productRepository.save(product));
        }
        console.log(`✅ ${products.length} productos creados`);

        // === Crear categorías de clientes ===
        const customerCategoryRepository = dataSource.getRepository(CustomerCategory);
        const customerCategoriesData = [
            { name: 'VIP', description: 'Clientes frecuentes con descuentos especiales', color: '#fbbf24' },
            { name: 'Mayorista', description: 'Clientes que compran en grandes cantidades', color: '#3b82f6' },
            { name: 'Minorista', description: 'Clientes ocasionales', color: '#10b981' },
            { name: 'Online', description: 'Clientes que compran por internet', color: '#8b5cf6' },
        ];

        const customerCategories: CustomerCategory[] = [];
        for (const catData of customerCategoriesData) {
            const category = customerCategoryRepository.create(catData);
            customerCategories.push(await customerCategoryRepository.save(category));
        }
        console.log(`✅ ${customerCategories.length} categorías de clientes creadas`);

        // === Crear clientes ===
        const customerRepository = dataSource.getRepository(Customer);
        const customersData = [
            { firstName: 'María', lastName: 'González', documentType: DocumentType.DNI, documentNumber: '12345678', ivaCondition: IvaCondition.CONSUMIDOR_FINAL, email: 'maria.gonzalez@email.com', phone: '11-2345-6789', mobile: '11-1234-5678', address: 'Av. Corrientes 1234', city: 'Buenos Aires', state: 'CABA', postalCode: '1043', category: customerCategories[0] },
            { firstName: 'Juan', lastName: 'Pérez', documentType: DocumentType.DNI, documentNumber: '23456789', ivaCondition: IvaCondition.CONSUMIDOR_FINAL, email: 'juan.perez@email.com', phone: '11-3456-7890', mobile: '11-2345-6789', address: 'San Martín 567', city: 'Buenos Aires', state: 'CABA', postalCode: '1004', category: customerCategories[1] },
            { firstName: 'Ana', lastName: 'Martínez', documentType: DocumentType.DNI, documentNumber: '34567890', ivaCondition: IvaCondition.RESPONSABLE_MONOTRIBUTO, email: 'ana.martinez@email.com', phone: '11-4567-8901', mobile: '11-3456-7890', address: 'Rivadavia 890', city: 'Buenos Aires', state: 'CABA', postalCode: '1083', category: customerCategories[2] },
            { firstName: 'Carlos', lastName: 'Rodríguez', documentType: DocumentType.CUIT, documentNumber: '20-12345678-9', ivaCondition: IvaCondition.RESPONSABLE_INSCRIPTO, email: 'carlos.rodriguez@email.com', phone: '11-5678-9012', mobile: '11-4567-8901', address: 'Florida 123', city: 'Buenos Aires', state: 'CABA', postalCode: '1005', category: customerCategories[1] },
            { firstName: 'Laura', lastName: 'Fernández', documentType: DocumentType.DNI, documentNumber: '45678901', ivaCondition: IvaCondition.CONSUMIDOR_FINAL, email: 'laura.fernandez@email.com', phone: '11-6789-0123', mobile: '11-5678-9012', address: 'Cabildo 2345', city: 'Buenos Aires', state: 'CABA', postalCode: '1428', category: customerCategories[0] },
            { firstName: 'Diego', lastName: 'López', documentType: DocumentType.DNI, documentNumber: '56789012', ivaCondition: IvaCondition.RESPONSABLE_MONOTRIBUTO, email: 'diego.lopez@email.com', phone: '11-7890-1234', mobile: '11-6789-0123', address: 'Santa Fe 3456', city: 'Buenos Aires', state: 'CABA', postalCode: '1425', category: customerCategories[3] },
            { firstName: 'Sofía', lastName: 'García', documentType: DocumentType.DNI, documentNumber: '67890123', ivaCondition: IvaCondition.CONSUMIDOR_FINAL, email: 'sofia.garcia@email.com', phone: '11-8901-2345', mobile: '11-7890-1234', address: 'Córdoba 4567', city: 'Buenos Aires', state: 'CABA', postalCode: '1054', category: customerCategories[2] },
            { firstName: 'Martín', lastName: 'Sánchez', documentType: DocumentType.DNI, documentNumber: '78901234', ivaCondition: IvaCondition.EXENTO, email: 'martin.sanchez@email.com', phone: '11-9012-3456', mobile: '11-8901-2345', address: 'Lavalle 5678', city: 'Buenos Aires', state: 'CABA', postalCode: '1047', category: customerCategories[1] },
            { firstName: 'Valentina', lastName: 'Torres', documentType: DocumentType.DNI, documentNumber: '89012345', ivaCondition: IvaCondition.CONSUMIDOR_FINAL, email: 'valentina.torres@email.com', phone: '11-0123-4567', mobile: '11-9012-3456', address: 'Belgrano 6789', city: 'Buenos Aires', state: 'CABA', postalCode: '1426', category: customerCategories[0] },
            { firstName: 'Lucas', lastName: 'Ramírez', documentType: DocumentType.DNI, documentNumber: '90123456', ivaCondition: IvaCondition.RESPONSABLE_INSCRIPTO, email: 'lucas.ramirez@email.com', phone: '11-1234-5678', mobile: '11-0123-4567', address: 'Palermo 7890', city: 'Buenos Aires', state: 'CABA', postalCode: '1414', category: customerCategories[3] },
        ];

        const customers: Customer[] = [];
        for (const custData of customersData) {
            const customer = customerRepository.create(custData as any) as unknown as Customer;
            customers.push(await customerRepository.save(customer));
        }
        console.log(`✅ ${customers.length} clientes creados`);

        // === Crear categorías de gastos ===
        const expenseCategoryRepository = dataSource.getRepository(ExpenseCategory);
        const expenseCategoriesData = [
            { name: 'Alquiler', description: 'Alquiler del local comercial', isRecurring: true },
            { name: 'Servicios', description: 'Luz, gas, agua, internet', isRecurring: true },
            { name: 'Sueldos', description: 'Pago de sueldos y salarios', isRecurring: true },
            { name: 'Publicidad', description: 'Marketing y publicidad', isRecurring: false },
            { name: 'Mantenimiento', description: 'Reparaciones y mantenimiento', isRecurring: false },
            { name: 'Impuestos', description: 'Impuestos y tasas', isRecurring: true },
            { name: 'Seguros', description: 'Seguros del negocio', isRecurring: true },
            { name: 'Otros', description: 'Otros gastos varios', isRecurring: false },
        ];

        const expenseCategories: ExpenseCategory[] = [];
        for (const catData of expenseCategoriesData) {
            const category = expenseCategoryRepository.create(catData);
            expenseCategories.push(await expenseCategoryRepository.save(category));
        }
        console.log(`✅ ${expenseCategories.length} categorías de gastos creadas`);

        // === Crear métodos de pago ===
        const paymentMethodRepository = dataSource.getRepository(PaymentMethodEntity);
        const paymentMethodsData = [
            { name: 'Efectivo', code: 'cash', isActive: true },
            { name: 'Transferencia', code: 'transfer', isActive: true },
            { name: 'Tarjeta de Débito', code: 'debit_card', isActive: true },
            { name: 'Tarjeta de Crédito', code: 'credit_card', isActive: true },
            { name: 'Cheque', code: 'check', isActive: true },
            { name: 'QR / Billetera Virtual', code: 'qr', isActive: true },
            { name: 'Otro', code: 'other', isActive: true },
        ];

        const paymentMethodsMap: Record<string, PaymentMethodEntity> = {};
        for (const pmData of paymentMethodsData) {
            const pm = paymentMethodRepository.create(pmData);
            const savedPm = await paymentMethodRepository.save(pm);
            paymentMethodsMap[pmData.code] = savedPm;
        }
        console.log(`✅ ${Object.keys(paymentMethodsMap).length} métodos de pago creados`);

        // === Crear gastos en diferentes fechas ===
        const expenseRepository = dataSource.getRepository(Expense);
        const expensesData = [
            // Alquiler (mensual, últimos 3 meses)
            { description: 'Alquiler Local - Noviembre 2024', amount: 85000, expenseDate: getDateDaysAgo(5), category: expenseCategories[0], paymentMethod: paymentMethodsMap['transfer'], isPaid: true, paidAt: getDateDaysAgo(5), receiptNumber: 'ALQ-2024-11' },
            { description: 'Alquiler Local - Octubre 2024', amount: 85000, expenseDate: getDateDaysAgo(35), category: expenseCategories[0], paymentMethod: paymentMethodsMap['transfer'], isPaid: true, paidAt: getDateDaysAgo(35), receiptNumber: 'ALQ-2024-10' },
            { description: 'Alquiler Local - Septiembre 2024', amount: 85000, expenseDate: getDateDaysAgo(65), category: expenseCategories[0], paymentMethod: paymentMethodsMap['transfer'], isPaid: true, paidAt: getDateDaysAgo(65), receiptNumber: 'ALQ-2024-09' },

            // Servicios (mensuales)
            { description: 'Luz - Noviembre 2024', amount: 12500, expenseDate: getDateDaysAgo(3), category: expenseCategories[1], paymentMethod: paymentMethodsMap['debit_card'], isPaid: true, paidAt: getDateDaysAgo(3), receiptNumber: 'LUZ-2024-11' },
            { description: 'Gas - Noviembre 2024', amount: 8500, expenseDate: getDateDaysAgo(2), category: expenseCategories[1], paymentMethod: paymentMethodsMap['debit_card'], isPaid: true, paidAt: getDateDaysAgo(2), receiptNumber: 'GAS-2024-11' },
            { description: 'Internet - Noviembre 2024', amount: 6500, expenseDate: getDateDaysAgo(1), category: expenseCategories[1], paymentMethod: paymentMethodsMap['debit_card'], isPaid: true, paidAt: getDateDaysAgo(1), receiptNumber: 'INT-2024-11' },
            { description: 'Luz - Octubre 2024', amount: 11800, expenseDate: getDateDaysAgo(33), category: expenseCategories[1], paymentMethod: paymentMethodsMap['debit_card'], isPaid: true, paidAt: getDateDaysAgo(33), receiptNumber: 'LUZ-2024-10' },
            { description: 'Gas - Octubre 2024', amount: 7800, expenseDate: getDateDaysAgo(32), category: expenseCategories[1], paymentMethod: paymentMethodsMap['debit_card'], isPaid: true, paidAt: getDateDaysAgo(32), receiptNumber: 'GAS-2024-10' },

            // Sueldos
            { description: 'Sueldo Empleado 1 - Noviembre 2024', amount: 120000, expenseDate: getDateDaysAgo(7), category: expenseCategories[2], paymentMethod: paymentMethodsMap['transfer'], isPaid: true, paidAt: getDateDaysAgo(7), receiptNumber: 'SUE-2024-11-01' },
            { description: 'Sueldo Empleado 2 - Noviembre 2024', amount: 110000, expenseDate: getDateDaysAgo(7), category: expenseCategories[2], paymentMethod: paymentMethodsMap['transfer'], isPaid: true, paidAt: getDateDaysAgo(7), receiptNumber: 'SUE-2024-11-02' },
            { description: 'Sueldo Empleado 1 - Octubre 2024', amount: 120000, expenseDate: getDateDaysAgo(37), category: expenseCategories[2], paymentMethod: paymentMethodsMap['transfer'], isPaid: true, paidAt: getDateDaysAgo(37), receiptNumber: 'SUE-2024-10-01' },

            // Publicidad
            { description: 'Publicidad Redes Sociales - Noviembre', amount: 15000, expenseDate: getDateDaysAgo(10), category: expenseCategories[3], paymentMethod: paymentMethodsMap['credit_card'], isPaid: true, paidAt: getDateDaysAgo(10), receiptNumber: 'PUB-2024-11-01' },
            { description: 'Flyers y Folletos', amount: 8500, expenseDate: getDateDaysAgo(20), category: expenseCategories[3], paymentMethod: paymentMethodsMap['cash'], isPaid: true, paidAt: getDateDaysAgo(20), receiptNumber: 'PUB-2024-11-02' },

            // Mantenimiento
            { description: 'Reparación Aire Acondicionado', amount: 25000, expenseDate: getDateDaysAgo(15), category: expenseCategories[4], paymentMethod: paymentMethodsMap['transfer'], isPaid: true, paidAt: getDateDaysAgo(15), receiptNumber: 'MANT-2024-11-01' },
            { description: 'Limpieza Profunda Local', amount: 12000, expenseDate: getDateDaysAgo(25), category: expenseCategories[4], paymentMethod: paymentMethodsMap['cash'], isPaid: true, paidAt: getDateDaysAgo(25), receiptNumber: 'MANT-2024-11-02' },

            // Impuestos
            { description: 'Ingresos Brutos - Octubre 2024', amount: 18000, expenseDate: getDateDaysAgo(40), category: expenseCategories[5], paymentMethod: paymentMethodsMap['transfer'], isPaid: true, paidAt: getDateDaysAgo(40), receiptNumber: 'IMP-2024-10' },
            { description: 'Ingresos Brutos - Septiembre 2024', amount: 16500, expenseDate: getDateDaysAgo(70), category: expenseCategories[5], paymentMethod: paymentMethodsMap['transfer'], isPaid: true, paidAt: getDateDaysAgo(70), receiptNumber: 'IMP-2024-09' },

            // Seguros
            { description: 'Seguro Local - Trimestre 4', amount: 35000, expenseDate: getDateDaysAgo(45), category: expenseCategories[6], paymentMethod: paymentMethodsMap['transfer'], isPaid: true, paidAt: getDateDaysAgo(45), receiptNumber: 'SEG-2024-Q4' },

            // Pendientes
            { description: 'Luz - Diciembre 2024', amount: 13000, expenseDate: getDateDaysFromNow(5), category: expenseCategories[1], paymentMethod: null, isPaid: false, paidAt: null, receiptNumber: null },
            { description: 'Alquiler Local - Diciembre 2024', amount: 85000, expenseDate: getDateDaysFromNow(2), category: expenseCategories[0], paymentMethod: null, isPaid: false, paidAt: null, receiptNumber: null },
        ];

        for (const expData of expensesData) {
            const expense = expenseRepository.create({
                ...expData,
                expenseDate: parseLocalDate(expData.expenseDate),
                paidAt: expData.paidAt ? parseLocalDate(expData.paidAt) : null,
                createdById: adminUser.id,
                paymentMethod: expData.paymentMethod,
            });
            await expenseRepository.save(expense);
        }
        console.log(`✅ ${expensesData.length} gastos creados`);

        // === Crear compras en diferentes fechas ===
        const purchaseRepository = dataSource.getRepository(Purchase);
        const purchaseItemRepository = dataSource.getRepository(PurchaseItem);

        // Proveedores
        const providers = [
            { name: 'Distribuidora de Belleza S.A.', document: '30-12345678-9', phone: '11-4000-1234' },
            { name: 'Marroquinería El Cuero', document: '30-23456789-0', phone: '11-4000-2345' },
            { name: 'Perfumería Premium', document: '30-34567890-1', phone: '11-4000-3456' },
            { name: 'Accesorios y Más', document: '30-45678901-2', phone: '11-4000-4567' },
        ];

        // Compras históricas
        const purchasesData = [
            // Compra 1 - Hace 60 días (pagada)
            {
                provider: providers[0],
                purchaseDate: getDateDaysAgo(60),
                status: PurchaseStatus.PAID,
                paymentMethod: paymentMethodsMap['transfer'],
                paidAt: getDateDaysAgo(60),
                invoiceNumber: 'FC-001-2024',
                tax: 0,
                discount: 0,
                items: [
                    { product: products[0], quantity: 20, unitPrice: 4500 }, // Base
                    { product: products[1], quantity: 30, unitPrice: 3200 }, // Labial
                    { product: products[2], quantity: 10, unitPrice: 6800 }, // Paleta
                ],
            },
            // Compra 2 - Hace 45 días (pagada)
            {
                provider: providers[1],
                purchaseDate: getDateDaysAgo(45),
                status: PurchaseStatus.PAID,
                paymentMethod: paymentMethodsMap['transfer'],
                paidAt: getDateDaysAgo(45),
                invoiceNumber: 'FC-002-2024',
                tax: 0,
                discount: 5000,
                items: [
                    { product: products[25], quantity: 8, unitPrice: 8500 }, // Cartera
                    { product: products[26], quantity: 12, unitPrice: 5200 }, // Billetera
                    { product: products[27], quantity: 15, unitPrice: 3200 }, // Monedero
                ],
            },
            // Compra 3 - Hace 30 días (pagada)
            {
                provider: providers[2],
                purchaseDate: getDateDaysAgo(30),
                status: PurchaseStatus.PAID,
                paymentMethod: paymentMethodsMap['credit_card'],
                paidAt: getDateDaysAgo(30),
                invoiceNumber: 'FC-003-2024',
                tax: 2100,
                discount: 0,
                items: [
                    { product: products[19], quantity: 5, unitPrice: 12500 }, // Perfume Mujer
                    { product: products[20], quantity: 5, unitPrice: 12500 }, // Perfume Hombre
                    { product: products[21], quantity: 10, unitPrice: 6800 }, // Colonia
                ],
            },
            // Compra 4 - Hace 20 días (pagada)
            {
                provider: providers[0],
                purchaseDate: getDateDaysAgo(20),
                status: PurchaseStatus.PAID,
                paymentMethod: paymentMethodsMap['transfer'],
                paidAt: getDateDaysAgo(20),
                invoiceNumber: 'FC-004-2024',
                tax: 0,
                discount: 0,
                items: [
                    { product: products[8], quantity: 15, unitPrice: 5200 }, // Crema Hidratante
                    { product: products[9], quantity: 8, unitPrice: 7500 }, // Serum
                    { product: products[10], quantity: 20, unitPrice: 3800 }, // Limpiador
                ],
            },
            // Compra 5 - Hace 15 días (pagada)
            {
                provider: providers[3],
                purchaseDate: getDateDaysAgo(15),
                status: PurchaseStatus.PAID,
                paymentMethod: paymentMethodsMap['cash'],
                paidAt: getDateDaysAgo(15),
                invoiceNumber: 'FC-005-2024',
                tax: 0,
                discount: 0,
                items: [
                    { product: products[40], quantity: 10, unitPrice: 3200 }, // Aros
                    { product: products[41], quantity: 8, unitPrice: 5800 }, // Collar
                    { product: products[42], quantity: 12, unitPrice: 4200 }, // Pulsera
                ],
            },
            // Compra 6 - Hace 10 días (pagada)
            {
                provider: providers[1],
                purchaseDate: getDateDaysAgo(10),
                status: PurchaseStatus.PAID,
                paymentMethod: paymentMethodsMap['transfer'],
                paidAt: getDateDaysAgo(10),
                invoiceNumber: 'FC-006-2024',
                tax: 0,
                discount: 3000,
                items: [
                    { product: products[30], quantity: 3, unitPrice: 18500 }, // Bolso Tote
                    { product: products[31], quantity: 4, unitPrice: 15200 }, // Bolso Bandolera
                ],
            },
            // Compra 7 - Hace 5 días (pagada)
            {
                provider: providers[0],
                purchaseDate: getDateDaysAgo(5),
                status: PurchaseStatus.PAID,
                paymentMethod: paymentMethodsMap['debit_card'],
                paidAt: getDateDaysAgo(5),
                invoiceNumber: 'FC-007-2024',
                tax: 0,
                discount: 0,
                items: [
                    { product: products[14], quantity: 25, unitPrice: 3200 }, // Shampoo
                    { product: products[15], quantity: 25, unitPrice: 3200 }, // Acondicionador
                    { product: products[16], quantity: 15, unitPrice: 4500 }, // Mascarilla
                ],
            },
            // Compra 8 - Hace 3 días (pendiente)
            {
                provider: providers[2],
                purchaseDate: getDateDaysAgo(3),
                status: PurchaseStatus.PENDING,
                paymentMethod: null,
                paidAt: null,
                invoiceNumber: 'FC-008-2024',
                tax: 0,
                discount: 0,
                items: [
                    { product: products[22], quantity: 20, unitPrice: 1200 }, // Esmalte Rojo
                    { product: products[23], quantity: 20, unitPrice: 1200 }, // Esmalte Rosa
                    { product: products[24], quantity: 15, unitPrice: 1200 }, // Esmalte Azul
                ],
            },
            // Compra 9 - Ayer (pendiente)
            {
                provider: providers[1],
                purchaseDate: getDateDaysAgo(1),
                status: PurchaseStatus.PENDING,
                paymentMethod: null,
                paidAt: null,
                invoiceNumber: 'FC-009-2024',
                tax: 0,
                discount: 0,
                items: [
                    { product: products[33], quantity: 5, unitPrice: 4500 }, // Cinturón Negro
                    { product: products[34], quantity: 5, unitPrice: 5200 }, // Cinturón Marrón
                ],
            },
            // Compra 10 - Hoy (pendiente)
            {
                provider: providers[3],
                purchaseDate: getDateDaysAgo(0),
                status: PurchaseStatus.PENDING,
                paymentMethod: null,
                paidAt: null,
                invoiceNumber: 'FC-010-2024',
                tax: 0,
                discount: 0,
                items: [
                    { product: products[43], quantity: 8, unitPrice: 12500 }, // Reloj Analógico
                ],
            },
        ];

        let purchaseCounter = 0;
        for (const purchaseData of purchasesData) {
            purchaseCounter++;
            const year = new Date().getFullYear();
            const purchaseNumber = `COMP-${year}-${purchaseCounter.toString().padStart(5, '0')}`;

            // Calcular totales
            const subtotal = purchaseData.items.reduce(
                (sum, item) => sum + item.quantity * item.unitPrice,
                0
            );
            const total = subtotal + purchaseData.tax - purchaseData.discount;

            // Crear compra
            const purchase = purchaseRepository.create({
                purchaseNumber,
                providerName: purchaseData.provider.name,
                providerDocument: purchaseData.provider.document,
                providerPhone: purchaseData.provider.phone,
                purchaseDate: parseLocalDate(purchaseData.purchaseDate),
                subtotal,
                tax: purchaseData.tax,
                discount: purchaseData.discount,
                total,
                status: purchaseData.status,
                paymentMethod: purchaseData.paymentMethod,
                paidAt: purchaseData.paidAt ? parseLocalDate(purchaseData.paidAt) : null,
                invoiceNumber: purchaseData.invoiceNumber,
                inventoryUpdated: purchaseData.status === PurchaseStatus.PAID,
                createdById: adminUser.id,
            });

            const savedPurchase = await purchaseRepository.save(purchase);

            // Crear items
            for (const itemData of purchaseData.items) {
                const item = purchaseItemRepository.create({
                    purchaseId: savedPurchase.id,
                    productId: itemData.product.id,
                    quantity: itemData.quantity,
                    unitPrice: itemData.unitPrice,
                    subtotal: itemData.quantity * itemData.unitPrice,
                });
                await purchaseItemRepository.save(item);
            }

            // Si está pagada, actualizar stock (simular el proceso)
            if (purchaseData.status === PurchaseStatus.PAID) {
                for (const itemData of purchaseData.items) {
                    const product = await productRepository.findOne({
                        where: { id: itemData.product.id },
                    });
                    if (product) {
                        product.stock += itemData.quantity;
                        await productRepository.save(product);
                    }
                }
            }
        }
        console.log(`✅ ${purchasesData.length} compras creadas`);

        console.log('\n🎉 Seed completado exitosamente!');
        console.log('\n📊 Resumen:');
        console.log(`   - ${categories.length} categorías de productos`);
        console.log(`   - ${products.length} productos`);
        console.log(`   - ${customerCategories.length} categorías de clientes`);
        console.log(`   - ${customers.length} clientes`);
        console.log(`   - ${expenseCategories.length} categorías de gastos`);
        console.log(`   - ${expensesData.length} gastos`);
        console.log(`   - ${purchasesData.length} compras`);

    } catch (error) {
        console.error('❌ Error seeding database:', error);
        throw error;
    } finally {
        await dataSource.destroy();
        console.log('\nDatabase connection closed.');
    }
}

seed();
