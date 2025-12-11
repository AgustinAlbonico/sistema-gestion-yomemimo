/**
 * Repositorio de clientes
 * Encapsula operaciones de acceso a datos y queries complejas
 */
import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { QueryCustomersDTO } from './dto/query-customers.dto';

@Injectable()
export class CustomersRepository extends Repository<Customer> {
    constructor(private dataSource: DataSource) {
        super(Customer, dataSource.createEntityManager());
    }

    /**
     * Busca clientes con filtros, paginación y ordenamiento
     */
    async findWithFilters(
        filters: QueryCustomersDTO,
    ): Promise<[Customer[], number]> {
        const {
            page,
            limit,
            search,
            categoryId,
            isActive,
            city,
            state,
            sortBy,
            order,
        } = filters;

        const query = this.createQueryBuilder('customer')
            .leftJoinAndSelect('customer.category', 'category');

        // Búsqueda por texto (nombre, apellido, email, documento)
        if (search) {
            query.andWhere(
                '(customer.firstName ILIKE :search OR customer.lastName ILIKE :search OR customer.email ILIKE :search OR customer.documentNumber ILIKE :search)',
                { search: `%${search}%` },
            );
        }

        // Filtro por categoría
        if (categoryId) {
            query.andWhere('customer.categoryId = :categoryId', { categoryId });
        }

        // Filtro por estado
        if (isActive !== undefined) {
            query.andWhere('customer.isActive = :isActive', { isActive });
        }

        // Filtro por ciudad
        if (city) {
            query.andWhere('customer.city ILIKE :city', { city: `%${city}%` });
        }

        // Filtro por provincia
        if (state) {
            query.andWhere('customer.state ILIKE :state', { state: `%${state}%` });
        }

        // Ordenamiento
        query.orderBy(`customer.${sortBy}`, order);

        // Paginación
        query.skip((page - 1) * limit).take(limit);

        return query.getManyAndCount();
    }

    /**
     * Busca cliente por número de documento
     */
    async findByDocumentNumber(documentNumber: string): Promise<Customer | null> {
        return this.findOne({ where: { documentNumber } });
    }

    /**
     * Busca cliente por email
     */
    async findByEmail(email: string): Promise<Customer | null> {
        return this.findOne({ where: { email } });
    }

    /**
     * Lista todos los clientes activos ordenados por apellido
     */
    async findActiveCustomers(): Promise<Customer[]> {
        return this.find({
            where: { isActive: true },
            relations: ['category'],
            order: { lastName: 'ASC', firstName: 'ASC' },
        });
    }

    /**
     * Obtiene estadísticas de clientes
     */
    async getCustomerStats(): Promise<{
        total: number;
        active: number;
        inactive: number;
        byCategory: { categoryName: string; count: number }[];
    }> {
        const total = await this.count();
        const active = await this.count({ where: { isActive: true } });
        const inactive = total - active;

        const byCategory = await this.createQueryBuilder('customer')
            .leftJoin('customer.category', 'category')
            .select('category.name', 'categoryName')
            .addSelect('COUNT(customer.id)', 'count')
            .groupBy('category.name')
            .getRawMany();

        return {
            total,
            active,
            inactive,
            byCategory: byCategory.map((item) => ({
                categoryName: item.categoryName || 'Sin categoría',
                count: parseInt(item.count),
            })),
        };
    }
}

