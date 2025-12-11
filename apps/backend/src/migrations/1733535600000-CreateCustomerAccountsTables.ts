import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateCustomerAccountsTables1733535600000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Verificar si la tabla customer_accounts ya existe
        const customerAccountsTableExists = await queryRunner.hasTable('customer_accounts');
        
        if (!customerAccountsTableExists) {
            // Crear tabla customer_accounts
            await queryRunner.createTable(
            new Table({
                name: 'customer_accounts',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'customerId',
                        type: 'uuid',
                        isUnique: true,
                    },
                    {
                        name: 'balance',
                        type: 'decimal',
                        precision: 12,
                        scale: 2,
                        default: 0,
                    },
                    {
                        name: 'creditLimit',
                        type: 'decimal',
                        precision: 12,
                        scale: 2,
                        default: 0,
                    },
                    {
                        name: 'status',
                        type: 'enum',
                        enum: ['active', 'suspended', 'closed'],
                        default: "'active'",
                    },
                    {
                        name: 'daysOverdue',
                        type: 'int',
                        default: 0,
                    },
                    {
                        name: 'lastPaymentDate',
                        type: 'date',
                        isNullable: true,
                    },
                    {
                        name: 'lastPurchaseDate',
                        type: 'date',
                        isNullable: true,
                    },
                    {
                        name: 'createdAt',
                        type: 'timestamp',
                        default: 'now()',
                    },
                    {
                        name: 'updatedAt',
                        type: 'timestamp',
                        default: 'now()',
                    },
                    {
                        name: 'deletedAt',
                        type: 'timestamp',
                        isNullable: true,
                    },
                ],
            }),
            true,
        );

        // Foreign key a customers
        await queryRunner.createForeignKey(
            'customer_accounts',
            new TableForeignKey({
                columnNames: ['customerId'],
                referencedTableName: 'customers',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
            }),
        );

        // Índices para customer_accounts
        await queryRunner.createIndex(
            'customer_accounts',
            new TableIndex({
                name: 'IDX_customer_accounts_status',
                columnNames: ['status'],
            }),
        );

        await queryRunner.createIndex(
            'customer_accounts',
            new TableIndex({
                name: 'IDX_customer_accounts_balance',
                columnNames: ['balance'],
            }),
        );

        await queryRunner.createIndex(
            'customer_accounts',
            new TableIndex({
                name: 'IDX_customer_accounts_daysOverdue',
                columnNames: ['daysOverdue'],
            }),
        );
        }

        // Verificar si la tabla account_movements ya existe
        const accountMovementsTableExists = await queryRunner.hasTable('account_movements');
        
        if (!accountMovementsTableExists) {
            // Crear tabla account_movements
            await queryRunner.createTable(
            new Table({
                name: 'account_movements',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'accountId',
                        type: 'uuid',
                    },
                    {
                        name: 'movementType',
                        type: 'enum',
                        enum: ['charge', 'payment', 'adjustment', 'discount', 'interest'],
                    },
                    {
                        name: 'amount',
                        type: 'decimal',
                        precision: 12,
                        scale: 2,
                    },
                    {
                        name: 'balanceBefore',
                        type: 'decimal',
                        precision: 12,
                        scale: 2,
                    },
                    {
                        name: 'balanceAfter',
                        type: 'decimal',
                        precision: 12,
                        scale: 2,
                    },
                    {
                        name: 'description',
                        type: 'varchar',
                        length: '200',
                    },
                    {
                        name: 'referenceType',
                        type: 'varchar',
                        length: '50',
                        isNullable: true,
                    },
                    {
                        name: 'referenceId',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'paymentMethodId',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'notes',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'createdById',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'createdAt',
                        type: 'timestamp',
                        default: 'now()',
                    },
                    {
                        name: 'updatedAt',
                        type: 'timestamp',
                        default: 'now()',
                    },
                    {
                        name: 'deletedAt',
                        type: 'timestamp',
                        isNullable: true,
                    },
                ],
            }),
            true,
        );

        // Foreign key a customer_accounts
        await queryRunner.createForeignKey(
            'account_movements',
            new TableForeignKey({
                columnNames: ['accountId'],
                referencedTableName: 'customer_accounts',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
            }),
        );

        // Foreign key a payment_methods
        await queryRunner.createForeignKey(
            'account_movements',
            new TableForeignKey({
                columnNames: ['paymentMethodId'],
                referencedTableName: 'payment_methods',
                referencedColumnNames: ['id'],
                onDelete: 'SET NULL',
                onUpdate: 'CASCADE',
            }),
        );

        // Foreign key a users
        await queryRunner.createForeignKey(
            'account_movements',
            new TableForeignKey({
                columnNames: ['createdById'],
                referencedTableName: 'users',
                referencedColumnNames: ['id'],
                onDelete: 'SET NULL',
                onUpdate: 'CASCADE',
            }),
        );

        // Índices para account_movements
        await queryRunner.createIndex(
            'account_movements',
            new TableIndex({
                name: 'IDX_account_movements_accountId',
                columnNames: ['accountId'],
            }),
        );

        await queryRunner.createIndex(
            'account_movements',
            new TableIndex({
                name: 'IDX_account_movements_movementType',
                columnNames: ['movementType'],
            }),
        );

        await queryRunner.createIndex(
            'account_movements',
            new TableIndex({
                name: 'IDX_account_movements_createdAt',
                columnNames: ['createdAt'],
            }),
        );

        await queryRunner.createIndex(
            'account_movements',
            new TableIndex({
                name: 'IDX_account_movements_reference',
                columnNames: ['referenceType', 'referenceId'],
            }),
        );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Eliminar tabla account_movements
        await queryRunner.dropTable('account_movements', true);

        // Eliminar tabla customer_accounts
        await queryRunner.dropTable('customer_accounts', true);
    }
}
