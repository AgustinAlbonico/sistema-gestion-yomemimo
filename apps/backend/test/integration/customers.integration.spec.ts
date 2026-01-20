/**
 * Tests de integración para Customers
 * Prueba la interacción real con la base de datos
 */
import { testDataSource } from '../setup-integration';
import { Customer, DocumentType } from '../../src/modules/customers/entities/customer.entity';
import { CustomerCategory } from '../../src/modules/customers/entities/customer-category.entity';
import { IvaCondition } from '../../src/common/enums/iva-condition.enum';
import { Repository } from 'typeorm';

describe('Integración - Customers', () => {
    let customerRepo: Repository<Customer>;
    let categoryRepo: Repository<CustomerCategory>;

    beforeAll(() => {
        customerRepo = testDataSource.getRepository(Customer);
        categoryRepo = testDataSource.getRepository(CustomerCategory);
    });

    // Helpers para crear datos de prueba
    const seedCategory = async (overrides: Partial<CustomerCategory> = {}): Promise<CustomerCategory> => {
        const category = categoryRepo.create({
            name: 'VIP',
            description: 'Clientes VIP',
            color: '#FF5733',
            isActive: true,
            ...overrides,
        });
        return categoryRepo.save(category);
    };

    // Contador para generar nombres únicos en cada test
    let categoryCounter = 0;
    let customerCounter = 0;

    const seedCustomer = async (overrides: Partial<Customer> = {}): Promise<Customer> => {
        // Crear categoría única si no se proporciona categoryId
        const category = overrides.categoryId
            ? null
            : await seedCategory({ name: `Categoría ${categoryCounter++}` });

        const customerId = `DOC-${customerCounter++}`;
        const customer = customerRepo.create({
            firstName: 'Juan',
            lastName: 'Pérez',
            documentType: DocumentType.DNI,
            ivaCondition: IvaCondition.CONSUMIDOR_FINAL,
            documentNumber: customerId,
            email: `juan.perez${customerCounter}@example.com`,
            phone: '11-1234-5678',
            mobile: '11-9876-5432',
            address: 'Calle Test 123',
            city: 'Buenos Aires',
            state: 'B',
            postalCode: '1234',
            categoryId: overrides.categoryId ?? category?.id,
            notes: 'Cliente de prueba',
            isActive: true,
            ...overrides,
        });
        return customerRepo.save(customer);
    };

    describe('CRUD básico de Customers', () => {
        it('debe crear y persistir cliente con todos los campos', async () => {
            const category = await seedCategory({ name: 'Test Category' });
            const customer = customerRepo.create({
                firstName: 'María',
                lastName: 'González',
                documentType: DocumentType.DNI,
                ivaCondition: IvaCondition.RESPONSABLE_INSCRIPTO,
                documentNumber: '20123456789',
                email: 'maria.gonzalez@example.com',
                phone: '11-5555-1234',
                mobile: '11-5555-5678',
                address: 'Av. Corrientes 1234',
                city: 'CABA',
                state: 'C',
                postalCode: '1045',
                categoryId: category.id,
                notes: 'Notas de prueba',
                isActive: true,
            });

            const saved = await customerRepo.save(customer);
            const found = await customerRepo.findOne({
                where: { id: saved.id },
                relations: ['category'],
            });

            expect(found).toBeDefined();
            expect(found?.firstName).toBe('María');
            expect(found?.lastName).toBe('González');
            expect(found?.documentType).toBe(DocumentType.DNI);
            expect(found?.ivaCondition).toBe(IvaCondition.RESPONSABLE_INSCRIPTO);
            expect(found?.documentNumber).toBe('20123456789');
            expect(found?.email).toBe('maria.gonzalez@example.com');
            expect(found?.phone).toBe('11-5555-1234');
            expect(found?.mobile).toBe('11-5555-5678');
            expect(found?.address).toBe('Av. Corrientes 1234');
            expect(found?.city).toBe('CABA');
            expect(found?.state).toBe('C');
            expect(found?.postalCode).toBe('1045');
            expect(found?.notes).toBe('Notas de prueba');
            expect(found?.isActive).toBe(true);
            expect(found?.category).toBeDefined();
            expect(found?.category?.name).toBe('Test Category');
        });

        it('debe buscar cliente por documento number', async () => {
            const customer = await seedCustomer({ documentNumber: '99999999' });

            const found = await customerRepo.findOne({
                where: { documentNumber: '99999999' },
            });

            expect(found).toBeDefined();
            expect(found?.id).toBe(customer.id);
            expect(found?.documentNumber).toBe('99999999');
        });

        it('debe buscar cliente por email', async () => {
            const uniqueEmail = 'unique.test@example.com';
            const customer = await seedCustomer({ email: uniqueEmail });

            const found = await customerRepo.findOne({
                where: { email: uniqueEmail },
            });

            expect(found).toBeDefined();
            expect(found?.id).toBe(customer.id);
            expect(found?.email).toBe(uniqueEmail);
        });

        it('debe hacer soft delete (isActive = false)', async () => {
            const customer = await seedCustomer({ isActive: true });

            expect(customer.isActive).toBe(true);

            customer.isActive = false;
            await customerRepo.save(customer);

            const found = await customerRepo.findOne({
                where: { id: customer.id },
            });

            expect(found).toBeDefined();
            expect(found?.isActive).toBe(false);
        });

        it('debe listar clientes activos', async () => {
            // Crear clientes activos e inactivos
            await seedCustomer({ firstName: 'Activo 1', isActive: true });
            await seedCustomer({ firstName: 'Activo 2', isActive: true });
            await seedCustomer({ firstName: 'Inactivo 1', isActive: false });

            const activeCustomers = await customerRepo.find({
                where: { isActive: true },
                order: { firstName: 'ASC' },
            });

            expect(activeCustomers.length).toBeGreaterThanOrEqual(2);
            expect(activeCustomers.every((c) => c.isActive === true)).toBe(true);
        });

        it('debe calcular estadísticas correctamente', async () => {
            // Limpiar para tener datos controlados

            const cat1 = await seedCategory({ name: 'Categoria A' });
            const cat2 = await seedCategory({ name: 'Categoria B' });

            await seedCustomer({ categoryId: cat1.id, isActive: true });
            await seedCustomer({ categoryId: cat1.id, isActive: false });
            await seedCustomer({ categoryId: cat2.id, isActive: true });

            const total = await customerRepo.count();
            const active = await customerRepo.count({ where: { isActive: true } });

            expect(total).toBe(3);
            expect(active).toBe(2);
        });
    });

    describe('Relaciones Customer ↔ CustomerCategory', () => {
        it('debe crear cliente con categoría asociada', async () => {
            const category = await seedCategory({ name: 'Premium' });
            const customer = await seedCustomer({ categoryId: category.id });

            const found = await customerRepo.findOne({
                where: { id: customer.id },
                relations: ['category'],
            });

            expect(found?.category).toBeDefined();
            expect(found?.category?.id).toBe(category.id);
            expect(found?.category?.name).toBe('Premium');
        });

        it('debe cargar categoría en lazy loading', async () => {
            const category = await seedCategory({ name: 'VIP' });
            const customer = await seedCustomer({ categoryId: category.id });

            // Cargar sin relación
            const withoutRelation = await customerRepo.findOne({
                where: { id: customer.id },
            });
            expect(withoutRelation?.category).toBeUndefined();

            // Cargar con relación
            const withRelation = await customerRepo.findOne({
                where: { id: customer.id },
                relations: ['category'],
            });
            expect(withRelation?.category).toBeDefined();
            expect(withRelation?.category?.name).toBe('VIP');
        });

        it('debe contar clientes por categoría', async () => {
            // Limpiar

            const cat1 = await seedCategory({ name: 'Cat 1' });
            const cat2 = await seedCategory({ name: 'Cat 2' });

            await seedCustomer({ categoryId: cat1.id });
            await seedCustomer({ categoryId: cat1.id });
            await seedCustomer({ categoryId: cat1.id });
            await seedCustomer({ categoryId: cat2.id });

            const countCat1 = await customerRepo.count({ where: { categoryId: cat1.id } });
            const countCat2 = await customerRepo.count({ where: { categoryId: cat2.id } });

            expect(countCat1).toBe(3);
            expect(countCat2).toBe(1);
        });
    });

    describe('Restricciones de unicidad', () => {
        it('debe evitar documento duplicado (unique constraint en BD)', async () => {
            await seedCustomer({ documentNumber: 'DUP-123' });

            const duplicate = customerRepo.create({
                firstName: 'Otro',
                lastName: 'Cliente',
                documentNumber: 'DUP-123',
                email: 'otro@example.com',
                isActive: true,
            });

            await expect(customerRepo.save(duplicate)).rejects.toThrow();
        });

        it('debe permitir email duplicado (no hay unique constraint)', async () => {
            await seedCustomer({ email: 'dup@example.com' });

            const duplicate = customerRepo.create({
                firstName: 'Otro',
                lastName: 'Cliente',
                documentNumber: 'DIFF-123',
                email: 'dup@example.com',
                isActive: true,
            });

            const saved = await customerRepo.save(duplicate);
            expect(saved).toBeDefined();
            expect(saved.email).toBe('dup@example.com');
        });
    });

    describe('Queries complejas', () => {
        it('debe filtrar por múltiples criterios', async () => {
            const category = await seedCategory({ name: 'Filtro' });

            await seedCustomer({
                firstName: 'Juan',
                lastName: 'Pérez',
                city: 'Rosario',
                state: 'Santa Fe',
                categoryId: category.id,
                isActive: true,
            });

            const found = await customerRepo.findOne({
                where: {
                    firstName: 'Juan',
                    city: 'Rosario',
                    state: 'Santa Fe',
                    categoryId: category.id,
                    isActive: true,
                },
            });

            expect(found).toBeDefined();
            expect(found?.firstName).toBe('Juan');
            expect(found?.city).toBe('Rosario');
        });

        it('debe buscar con email exacto (case sensitive)', async () => {
            await seedCustomer({
                firstName: 'Carlos',
                email: 'carlos.TEST@example.com',
            });

            // Búsqueda con email exacto (debe coincidir exactamente)
            const foundByEmail = await customerRepo.findOne({
                where: { email: 'carlos.TEST@example.com' },
            });

            expect(foundByEmail).toBeDefined();
            expect(foundByEmail?.email).toBe('carlos.TEST@example.com');

            // Búsqueda con diferente case no debería encontrar nada (PostgreSQL es case-sensitive)
            const notFound = await customerRepo.findOne({
                where: { email: 'carlos.test@example.com' },
            });

            expect(notFound).toBeNull();
        });
    });
});
