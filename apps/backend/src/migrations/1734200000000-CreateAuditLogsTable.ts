import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

/**
 * Migración para crear la tabla de logs de auditoría
 * Esta tabla almacena todas las acciones sobre entidades financieras
 */
export class CreateAuditLogsTable1734200000000 implements MigrationInterface {
    name = 'CreateAuditLogsTable1734200000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Crear tabla audit_logs
        await queryRunner.createTable(
            new Table({
                name: 'audit_logs',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        default: 'gen_random_uuid()',
                    },
                    {
                        name: 'entity_type',
                        type: 'varchar',
                        length: '50',
                        isNullable: false,
                    },
                    {
                        name: 'entity_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'action',
                        type: 'varchar',
                        length: '20',
                        isNullable: false,
                    },
                    {
                        name: 'user_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'previous_values',
                        type: 'jsonb',
                        isNullable: true,
                    },
                    {
                        name: 'new_values',
                        type: 'jsonb',
                        isNullable: true,
                    },
                    {
                        name: 'metadata',
                        type: 'jsonb',
                        isNullable: true,
                    },
                    {
                        name: 'description',
                        type: 'varchar',
                        length: '500',
                        isNullable: true,
                    },
                    {
                        name: 'timestamp',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                ],
            }),
            true,
        );

        // Crear índice para consultas por entidad (tipo + id)
        await queryRunner.createIndex(
            'audit_logs',
            new TableIndex({
                name: 'idx_audit_entity',
                columnNames: ['entity_type', 'entity_id'],
            }),
        );

        // Crear índice para consultas por usuario
        await queryRunner.createIndex(
            'audit_logs',
            new TableIndex({
                name: 'idx_audit_user',
                columnNames: ['user_id'],
            }),
        );

        // Crear índice para consultas por fecha
        await queryRunner.createIndex(
            'audit_logs',
            new TableIndex({
                name: 'idx_audit_timestamp',
                columnNames: ['timestamp'],
            }),
        );

        // Crear índice para consultas por acción
        await queryRunner.createIndex(
            'audit_logs',
            new TableIndex({
                name: 'idx_audit_action',
                columnNames: ['action'],
            }),
        );

        // Crear foreign key a users
        await queryRunner.createForeignKey(
            'audit_logs',
            new TableForeignKey({
                name: 'fk_audit_user',
                columnNames: ['user_id'],
                referencedTableName: 'users',
                referencedColumnNames: ['id'],
                onDelete: 'RESTRICT', // No permitir eliminar usuarios que tienen logs
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Eliminar foreign key
        await queryRunner.dropForeignKey('audit_logs', 'fk_audit_user');

        // Eliminar índices
        await queryRunner.dropIndex('audit_logs', 'idx_audit_action');
        await queryRunner.dropIndex('audit_logs', 'idx_audit_timestamp');
        await queryRunner.dropIndex('audit_logs', 'idx_audit_user');
        await queryRunner.dropIndex('audit_logs', 'idx_audit_entity');

        // Eliminar tabla
        await queryRunner.dropTable('audit_logs');
    }
}
