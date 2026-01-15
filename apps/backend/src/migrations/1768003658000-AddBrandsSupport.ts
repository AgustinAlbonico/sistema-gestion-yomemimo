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

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Crear tabla brands
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

        // 2. Crear índice único en brands.name
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_96db6bbbaa6f23cad26871339b" ON "brands" ("name")
        `);

        // 3. Agregar columna brandId a products (nullable)
        await queryRunner.query(`
            ALTER TABLE "products" 
            ADD COLUMN "brandId" uuid
        `);

        // 4. Crear índice en products.brandId
        await queryRunner.query(`
            CREATE INDEX "IDX_ea86d0c514c4ecbb5694cbf57d" ON "products" ("brandId")
        `);

        // 5. Crear foreign key de products.brandId → brands.id
        await queryRunner.query(`
            ALTER TABLE "products" 
            ADD CONSTRAINT "FK_ea86d0c514c4ecbb5694cbf57df" 
            FOREIGN KEY ("brandId") 
            REFERENCES "brands"("id") 
            ON DELETE NO ACTION 
            ON UPDATE NO ACTION
        `);
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
