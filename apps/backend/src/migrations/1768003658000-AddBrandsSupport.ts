import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Migración incremental: Agregar soporte de Marcas a Productos
 *
 * Cambios:
 * - Crea tabla "brands" con campos: id, name, displayName, isActive, createdAt, updatedAt
 * - Agrega columna "brandId" (nullable) a la tabla "products"
 * - Crea índice único en "brands.name" para búsquedas case-insensitive
 * - Crea índice en "products.brandId" para optimizar joins
 * - Crea foreign key de products.brandId → brands.id
 */
export class AddBrandsSupport1768003658000 implements MigrationInterface {
    name = 'AddBrandsSupport1768003658000'

    /**
     * Verifica si una tabla existe
     */
    private async tableExists(queryRunner: QueryRunner, tableName: string): Promise<boolean> {
        const result = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name = '${tableName}'
            )
        `);
        return result[0]?.exists || false;
    }

    /**
     * Verifica si una columna existe en una tabla
     */
    private async columnExists(queryRunner: QueryRunner, tableName: string, columnName: string): Promise<boolean> {
        const result = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public'
                AND table_name = '${tableName}'
                AND column_name = '${columnName}'
            )
        `);
        return result[0]?.exists || false;
    }

    /**
     * Verifica si un constraint existe
     */
    private async constraintExists(queryRunner: QueryRunner, tableName: string, constraintName: string): Promise<boolean> {
        const result = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.table_constraints
                WHERE constraint_schema = 'public'
                AND table_name = '${tableName}'
                AND constraint_name = '${constraintName}'
            )
        `);
        return result[0]?.exists || false;
    }

    /**
     * Verifica si un índice existe
     */
    private async indexExists(queryRunner: QueryRunner, indexName: string): Promise<boolean> {
        const result = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM pg_indexes
                WHERE schemaname = 'public'
                AND indexname = '${indexName}'
            )
        `);
        return result[0]?.exists || false;
    }

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Crear tabla brands solo si no existe
        if (!await this.tableExists(queryRunner, 'brands')) {
            await queryRunner.query(`
                CREATE TABLE "brands" (
                    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                    "name" character varying(100) NOT NULL,
                    "displayName" character varying(100) NOT NULL,
                    "isActive" boolean NOT NULL DEFAULT true,
                    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                    "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                    CONSTRAINT "UQ_96db6bbbaa6f23cad26871339b6" UNIQUE ("name"),
                    CONSTRAINT "PK_b0c437120b624da1034a81fc561" PRIMARY KEY ("id")
                )
            `);
        }

        // 2. Crear índice único en brands.name solo si no existe
        if (!await this.indexExists(queryRunner, 'IDX_96db6bbbaa6f23cad26871339b')) {
            await queryRunner.query(`
                CREATE UNIQUE INDEX "IDX_96db6bbbaa6f23cad26871339b" ON "brands" ("name")
            `);
        }

        // 3. Agregar columna brandId a products (nullable) solo si no existe
        if (!await this.columnExists(queryRunner, 'products', 'brandId')) {
            await queryRunner.query(`
                ALTER TABLE "products"
                ADD COLUMN "brandId" uuid
            `);
        }

        // 4. Crear índice en products.brandId solo si no existe
        if (!await this.indexExists(queryRunner, 'IDX_ea86d0c514c4ecbb5694cbf57d')) {
            await queryRunner.query(`
                CREATE INDEX "IDX_ea86d0c514c4ecbb5694cbf57d" ON "products" ("brandId")
            `);
        }

        // 5. Crear foreign key de products.brandId → brands.id solo si no existe
        if (!await this.constraintExists(queryRunner, 'products', 'FK_ea86d0c514c4ecbb5694cbf57df')) {
            await queryRunner.query(`
                ALTER TABLE "products"
                ADD CONSTRAINT "FK_ea86d0c514c4ecbb5694cbf57df"
                FOREIGN KEY ("brandId")
                REFERENCES "brands"("id")
                ON DELETE NO ACTION
                ON UPDATE NO ACTION
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revertir cambios en orden inverso

        // 1. Eliminar foreign key
        await queryRunner.query(`
            ALTER TABLE "products" 
            DROP CONSTRAINT "FK_ea86d0c514c4ecbb5694cbf57df"
        `);

        // 2. Eliminar índice de products.brandId
        await queryRunner.query(`
            DROP INDEX "IDX_ea86d0c514c4ecbb5694cbf57d"
        `);

        // 3. Eliminar columna brandId de products
        await queryRunner.query(`
            ALTER TABLE "products" 
            DROP COLUMN "brandId"
        `);

        // 4. Eliminar índice de brands.name
        await queryRunner.query(`
            DROP INDEX "IDX_96db6bbbaa6f23cad26871339b"
        `);

        // 5. Eliminar tabla brands
        await queryRunner.query(`
            DROP TABLE "brands"
        `);
    }
}
