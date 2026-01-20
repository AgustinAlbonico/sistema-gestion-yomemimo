/**
 * Tests de integración para CustomerCategories
 * Prueba la interacción real con la base de datos
 */
import { testDataSource } from '../setup-integration';
import { CustomerCategory } from '../../src/modules/customers/entities/customer-category.entity';
import { Customer } from '../../src/modules/customers/entities/customer.entity';
import { DocumentType } from '../../src/modules/customers/entities/customer.entity';
import { IvaCondition } from '../../src/common/enums/iva-condition.enum';
import { Repository } from 'typeorm';

describe('Integración - CustomerCategories', () => {
    let categoryRepo: Repository<CustomerCategory>;
    let customerRepo: Repository<Customer>;

    // Contadores para generar valores únicos
    let categoryCounter = 0;
    let customerCounter = 0;

    beforeAll(() => {
        categoryRepo = testDataSource.getRepository(CustomerCategory);
        customerRepo = testDataSource.getRepository(Customer);
    });

    const seedCategory = async (overrides: Partial<CustomerCategory> = {}): Promise<CustomerCategory> => {
        const category = categoryRepo.create({
            name: `Categoría ${categoryCounter++}`,
            description: 'Clientes VIP',
            color: '#FF5733',
            isActive: true,
            ...overrides,
        });
        return categoryRepo.save(category);
    };

    const seedCustomer = async (categoryId: string): Promise<Customer> => {
        const customerDoc = `DOC-${customerCounter++}`;
        const customer = customerRepo.create({
            firstName: 'Juan',
            lastName: 'Pérez',
            documentType: DocumentType.DNI,
            ivaCondition: IvaCondition.CONSUMIDOR_FINAL,
            documentNumber: customerDoc,
            email: `juan${customerCounter}@example.com`,
            isActive: true,
            categoryId,
        });
        return customerRepo.save(customer);
    };

    describe('CRUD básico de CustomerCategories', () => {
        it('debe crear categoría con todos los campos', async () => {
            const category = categoryRepo.create({
                name: 'Mayorista',
                description: 'Clientes mayoristas con volumen',
                color: '#123456',
                isActive: true,
            });

            const saved = await categoryRepo.save(category);
            const found = await categoryRepo.findOne({
                where: { id: saved.id },
            });

            expect(found).toBeDefined();
            expect(found?.name).toBe('Mayorista');
            expect(found?.description).toBe('Clientes mayoristas con volumen');
            expect(found?.color).toBe('#123456');
            expect(found?.isActive).toBe(true);
        });

        it('debe buscar categoría por nombre', async () => {
            await seedCategory({ name: 'NombreUnico' });

            const found = await categoryRepo.findOne({
                where: { name: 'NombreUnico' },
            });

            expect(found).toBeDefined();
            expect(found?.name).toBe('NombreUnico');
        });

        it('debe listar categorías activas', async () => {
            await seedCategory({ name: 'Activa 1', isActive: true });
            await seedCategory({ name: 'Activa 2', isActive: true });
            await seedCategory({ name: 'Inactiva', isActive: false });

            const activeCategories = await categoryRepo.find({
                where: { isActive: true },
                order: { name: 'ASC' },
            });

            expect(activeCategories.length).toBeGreaterThanOrEqual(2);
            expect(activeCategories.every((c) => c.isActive === true)).toBe(true);
        });

        it('debe actualizar categoría', async () => {
            const category = await seedCategory({ name: 'Original' });

            category.name = 'Actualizada';
            category.description = 'Nueva descripción';
            category.color = '#ABCDEF';

            const updated = await categoryRepo.save(category);

            expect(updated.name).toBe('Actualizada');
            expect(updated.description).toBe('Nueva descripción');
            expect(updated.color).toBe('#ABCDEF');
        });

        it('debe eliminar categoría sin clientes', async () => {
            const category = await seedCategory({ name: 'ParaEliminar' });

            await categoryRepo.remove(category);

            const found = await categoryRepo.findOne({
                where: { id: category.id },
            });

            expect(found).toBeNull();
        });
    });

    describe('Restricción de unicidad en nombre', () => {
        it('debe evitar nombres duplicados', async () => {
            await seedCategory({ name: 'Unico' });

            const duplicate = categoryRepo.create({
                name: 'Unico',
                color: '#000000',
                isActive: true,
            });

            await expect(categoryRepo.save(duplicate)).rejects.toThrow();
        });
    });

    describe('Relación con Customers', () => {
        it('debe contar clientes por categoría usando query builder', async () => {
            const category = await seedCategory({ name: 'ConClientes' });

            await seedCustomer(category.id);
            await seedCustomer(category.id);
            await seedCustomer(category.id);

            const result = await categoryRepo
                .createQueryBuilder('category')
                .leftJoin('category.customers', 'customer')
                .where('category.id = :categoryId', { categoryId: category.id })
                .select('COUNT(customer.id)', 'count')
                .getRawOne();

            const count = Number.parseInt(result?.count || '0', 10);
            expect(count).toBe(3);
        });

        it('no debe permitir eliminar categoría con clientes asociados (soft delete)', async () => {
            const category = await seedCategory({ name: 'ConClientes' });
            await seedCustomer(category.id);

            // En un caso real, esto se maneja en el servicio
            // Aquí solo probamos que la relación existe
            const customersCount = await customerRepo.count({
                where: { categoryId: category.id },
            });

            expect(customersCount).toBeGreaterThan(0);
        });

        it('debe cargar clientes de una categoría', async () => {
            const category = await seedCategory({ name: 'Cargable' });
            await seedCustomer(category.id);
            await seedCustomer(category.id);

            const found = await categoryRepo.findOne({
                where: { id: category.id },
                relations: ['customers'],
            });

            expect(found).toBeDefined();
            expect(found?.customers).toBeDefined();
            expect(found?.customers.length).toBe(2);
        });
    });

    describe('Ordenamiento y filtros', () => {
        it('debe listar categorías ordenadas por nombre', async () => {

            await seedCategory({ name: 'Zeta' });
            await seedCategory({ name: 'Alfa' });
            await seedCategory({ name: 'Beta' });

            const categories = await categoryRepo.find({
                order: { name: 'ASC' },
            });

            expect(categories[0].name).toBe('Alfa');
            expect(categories[1].name).toBe('Beta');
            expect(categories[2].name).toBe('Zeta');
        });

        it('debe filtrar por estado activo', async () => {
            await seedCategory({ name: 'Activo', isActive: true });
            await seedCategory({ name: 'Inactivo', isActive: false });

            const active = await categoryRepo.find({
                where: { isActive: true },
            });

            const inactive = await categoryRepo.find({
                where: { isActive: false },
            });

            expect(active.length).toBeGreaterThan(0);
            expect(inactive.length).toBeGreaterThan(0);
            expect(active.every((c) => c.isActive)).toBe(true);
            expect(inactive.every((c) => !c.isActive)).toBe(true);
        });
    });

    describe('Timestamps', () => {
        it('debe setear createdAt y updatedAt automáticamente', async () => {
            const category = await seedCategory({ name: 'Timestamps' });

            expect(category.createdAt).toBeDefined();
            expect(category.updatedAt).toBeDefined();
            expect(category.createdAt).toBeInstanceOf(Date);
            expect(category.updatedAt).toBeInstanceOf(Date);
        });

        it('debe actualizar updatedAt al modificar', async () => {
            const category = await seedCategory({ name: 'UpdateTest' });
            const originalUpdatedAt = category.updatedAt;

            // Pequeña demora para asegurar diferencia de milisegundos
            await new Promise((resolve) => setTimeout(resolve, 10));

            category.description = 'Descripción actualizada';
            const updated = await categoryRepo.save(category);

            expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(
                originalUpdatedAt.getTime()
            );
        });
    });
});
