import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveProductCategoriesTable1734096030000 implements MigrationInterface {
    name = 'RemoveProductCategoriesTable1734096030000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Eliminar la tabla intermedia product_categories
        // La relación correcta es ManyToOne desde Product hacia Category
        // Un producto solo puede tener UNA categoría (o ninguna)
        await queryRunner.query(`
            DROP TABLE IF EXISTS "product_categories" CASCADE
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revertir: crear la tabla product_categories
        // Nota: Esta reversión es solo para mantener la estructura de migración
        // pero no se recomienda usarla ya que la relación ManyToMany es incorrecta
        await queryRunner.query(`
            CREATE TABLE "product_categories" (
                "productId" uuid NOT NULL,
                "categoryId" uuid NOT NULL,
                CONSTRAINT "PK_product_categories" PRIMARY KEY ("productId", "categoryId")
            )
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_product_categories_productId" ON "product_categories" ("productId")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_product_categories_categoryId" ON "product_categories" ("categoryId")
        `);

        await queryRunner.query(`
            ALTER TABLE "product_categories" 
            ADD CONSTRAINT "FK_product_categories_productId" 
            FOREIGN KEY ("productId") REFERENCES "products"("id") 
            ON DELETE CASCADE ON UPDATE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "product_categories" 
            ADD CONSTRAINT "FK_product_categories_categoryId" 
            FOREIGN KEY ("categoryId") REFERENCES "categories"("id") 
            ON DELETE CASCADE ON UPDATE CASCADE
        `);
    }
}
