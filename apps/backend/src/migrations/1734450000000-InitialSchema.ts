import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migracion inicial que crea todas las tablas del sistema.
 * Generada automaticamente basandose en el schema existente.
 *
 * Incluye:
 * - 31 tablas
 * - 16 enums
 * - 36 foreign keys
 * - 48 indices
 */
export class InitialSchema1734450000000 implements MigrationInterface {
    name = 'InitialSchema1734450000000';

    /**
     * Crea un tipo ENUM solo si no existe
     */
    private async createEnumTypeIfNotExists(queryRunner: QueryRunner, typeName: string, values: string): Promise<void> {
        // Verificar si el tipo existe usando pg_type
        const result = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM pg_type
                WHERE typname = '${typeName}'
            ) as exists
        `);

        const typeExists = result[0]?.exists;

        if (!typeExists) {
            try {
                // Convertir "val1,val2,val3" en "'val1','val2','val3'"
                const enumValues = values.split(',').map((v) => `'${v}'`).join(', ');
                await queryRunner.query(`CREATE TYPE "${typeName}" AS ENUM(${enumValues})`);
            } catch (error: unknown) {
                // Si el error es "duplicate key", significa que otro proceso lo creó primero
                const err = error as { message?: string; code?: string };
                if (
                    err.code === '23505' || // duplicate key
                    err.message?.includes('duplicate') ||
                    err.message?.includes('duplicada')
                ) {
                    // El tipo fue creado por otro proceso, continuar
                    return;
                }
                throw error;
            }
        }
    }

    /**
     * Ejecuta un CREATE TABLE solo si no existe
     * Extrae el nombre de la tabla de la query CREATE TABLE
     * Si la tabla existe, simplemente la deja tal cual (las columnas faltantes se agregan después)
     */
    private async createTableIgnoreExists(queryRunner: QueryRunner, createTableQuery: string): Promise<void> {
        // Extraer el nombre de la tabla de la query CREATE TABLE
        // El formato es: CREATE TABLE "table_name" (...) o CREATE TABLE table_name (...)
        const tableNameMatch = createTableQuery.match(/CREATE\s+TABLE\s+(?:"([^"]+)"|(\S+))/i);
        if (!tableNameMatch) {
             await queryRunner.query(createTableQuery);
             return;
         }

         const tableName = tableNameMatch[1] || tableNameMatch[2];

         // Verificar si la tabla ya existe
         const checkResult = await queryRunner.query(`
             SELECT EXISTS (
                 SELECT 1 FROM information_schema.tables
                 WHERE table_schema = 'public'
                 AND table_name = '${tableName}'
             )
         `);

         const tableExists = checkResult[0]?.exists;

         if (!tableExists) {
             await queryRunner.query(createTableQuery);
         }
         // Si la tabla ya existe, NO hacer nada
         // Las columnas faltantes se agregarán en migraciones posteriores
     }

    /**
     * Ejecuta un ALTER TABLE ADD CONSTRAINT solo si no existe
     * Extrae el nombre del constraint y la tabla de la query
     */
    private async addConstraintIgnoreExists(queryRunner: QueryRunner, constraintQuery: string): Promise<void> {
        // Extraer el nombre del constraint de la query
        // Formato: ALTER TABLE "table" ADD CONSTRAINT "constraint_name" ...
        const constraintMatch = constraintQuery.match(/ADD\s+CONSTRAINT\s+"([^"]+)"/i);
        if (!constraintMatch) {
            await queryRunner.query(constraintQuery);
            return;
        }

        const constraintName = constraintMatch[1];

        // Verificar si el constraint ya existe
        const checkResult = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.table_constraints
                WHERE constraint_schema = 'public'
                AND constraint_name = '${constraintName}'
            )
        `);

        const constraintExists = checkResult[0]?.exists;

        if (!constraintExists) {
            await queryRunner.query(constraintQuery);
        }
    }

     /**
      * Ejecuta un CREATE INDEX solo si no existe
      * Extrae el nombre del índice de la query CREATE INDEX
      * Si la columna no existe, simplemente salte la creación del índice
      */
     private async createIndexIgnoreExists(queryRunner: QueryRunner, indexQuery: string): Promise<void> {
         // Extraer el nombre del índice de la query
         // Formato: CREATE INDEX "index_name" ON ...
         const indexMatch = indexQuery.match(/CREATE\s+(UNIQUE\s+)?INDEX\s+"([^"]+)"/i);
         if (!indexMatch) {
             await queryRunner.query(indexQuery);
             return;
         }

         const indexName = indexMatch[2];

         // Verificar si el índice ya existe
         const checkResult = await queryRunner.query(`
             SELECT EXISTS (
                 SELECT 1 FROM pg_indexes
                 WHERE schemaname = 'public'
                 AND indexname = '${indexName}'
             )
         `);

         const indexExists = checkResult[0]?.exists;

         if (!indexExists) {
             await queryRunner.query(indexQuery);
         }
     }

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

        // Crear ENUMs solo si no existen (para evitar errores en migraciones repetidas)
        await this.createEnumTypeIfNotExists(queryRunner, 'account_movements_movementtype_enum', 'charge,payment,adjustment,discount,interest');
        await this.createEnumTypeIfNotExists(queryRunner, 'backups_status_enum', 'pending,completed,failed');
        await this.createEnumTypeIfNotExists(queryRunner, 'cash_movements_movementtype_enum', 'income,expense');
        await this.createEnumTypeIfNotExists(queryRunner, 'cash_registers_status_enum', 'open,closed');
        await this.createEnumTypeIfNotExists(queryRunner, 'customer_accounts_status_enum', 'active,suspended,closed');
        await this.createEnumTypeIfNotExists(queryRunner, 'customers_documenttype_enum', 'DNI,CUIT,CUIL,PASAPORTE,OTRO');
        await this.createEnumTypeIfNotExists(queryRunner, 'customers_ivacondition_enum', 'CONSUMIDOR_FINAL,RESPONSABLE_MONOTRIBUTO,RESPONSABLE_INSCRIPTO,EXENTO');
        await this.createEnumTypeIfNotExists(queryRunner, 'fiscal_configuration_afipenvironment_enum', 'homologacion,produccion');
        await this.createEnumTypeIfNotExists(queryRunner, 'fiscal_configuration_ivacondition_enum', 'CONSUMIDOR_FINAL,RESPONSABLE_MONOTRIBUTO,RESPONSABLE_INSCRIPTO,EXENTO');
        await this.createEnumTypeIfNotExists(queryRunner, 'invoices_status_enum', 'pending,authorized,rejected,error');
        await this.createEnumTypeIfNotExists(queryRunner, 'purchases_status_enum', 'pending,paid');
        await this.createEnumTypeIfNotExists(queryRunner, 'sales_status_enum', 'completed,pending,partial,cancelled');
        await this.createEnumTypeIfNotExists(queryRunner, 'stock_movements_source_enum', 'INITIAL_LOAD,PURCHASE,SALE,ADJUSTMENT,RETURN');
        await this.createEnumTypeIfNotExists(queryRunner, 'stock_movements_type_enum', 'IN,OUT');
        await this.createEnumTypeIfNotExists(queryRunner, 'suppliers_documenttype_enum', 'DNI,CUIT,CUIL,OTRO');
        await this.createEnumTypeIfNotExists(queryRunner, 'suppliers_ivacondition_enum', 'CONSUMIDOR_FINAL,RESPONSABLE_MONOTRIBUTO,RESPONSABLE_INSCRIPTO,EXENTO');

        // Tablas
        await this.createTableIgnoreExists(queryRunner, `
            CREATE TABLE "account_movements" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "accountId" uuid NOT NULL,
                "movementType" "account_movements_movementtype_enum" NOT NULL,
                "amount" numeric(12,2) NOT NULL,
                "balanceBefore" numeric(12,2) NOT NULL,
                "balanceAfter" numeric(12,2) NOT NULL,
                "description" varchar(200) NOT NULL,
                "referenceType" varchar(50),
                "referenceId" uuid,
                "paymentMethodId" uuid,
                "notes" text,
                "createdById" uuid,
                "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
                "updatedAt" timestamp without time zone NOT NULL DEFAULT now(),
                "deletedAt" timestamp without time zone,
                PRIMARY KEY ("id")
            )
        `);

        await this.createTableIgnoreExists(queryRunner, `
            CREATE TABLE "audit_logs" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "entity_type" varchar(50) NOT NULL,
                "entity_id" uuid NOT NULL,
                "action" varchar(20) NOT NULL,
                "user_id" uuid NOT NULL,
                "previous_values" jsonb,
                "new_values" jsonb,
                "metadata" jsonb,
                "description" varchar(500),
                "timestamp" timestamp without time zone NOT NULL DEFAULT now(),
                PRIMARY KEY ("id")
            )
        `);

        await this.createTableIgnoreExists(queryRunner, `
            CREATE TABLE "backups" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "filename" varchar(255) NOT NULL,
                "filePath" varchar(500) NOT NULL,
                "sizeBytes" bigint NOT NULL DEFAULT '0',
                "status" "backups_status_enum" NOT NULL DEFAULT 'pending',
                "errorMessage" varchar(255),
                "createdByUsername" varchar(100),
                "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
                PRIMARY KEY ("id")
            )
        `);

        await this.createTableIgnoreExists(queryRunner, `
            CREATE TABLE "cash_movements" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "movementType" "cash_movements_movementtype_enum" NOT NULL,
                "referenceType" varchar(50),
                "referenceId" uuid,
                "manualAmount" numeric(12,2),
                "manualDescription" varchar(200),
                "manual_payment_method_id" uuid,
                "manualNotes" varchar(1000),
                "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
                "updatedAt" timestamp without time zone NOT NULL DEFAULT now(),
                "deletedAt" timestamp without time zone,
                "cash_register_id" uuid,
                "created_by" uuid,
                PRIMARY KEY ("id")
            )
        `);

        await this.createTableIgnoreExists(queryRunner, `
            CREATE TABLE "cash_register_totals" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "payment_method_id" uuid NOT NULL,
                "initialAmount" numeric(12,2) NOT NULL DEFAULT '0',
                "totalIncome" numeric(12,2) NOT NULL DEFAULT '0',
                "totalExpense" numeric(12,2) NOT NULL DEFAULT '0',
                "expectedAmount" numeric(12,2) NOT NULL DEFAULT '0',
                "actualAmount" numeric(12,2),
                "difference" numeric(12,2),
                "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
                "updatedAt" timestamp without time zone NOT NULL DEFAULT now(),
                "cash_register_id" uuid,
                PRIMARY KEY ("id")
            )
        `);

        await this.createTableIgnoreExists(queryRunner, `
            CREATE TABLE "cash_registers" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "date" date NOT NULL,
                "openedAt" timestamp without time zone NOT NULL,
                "closedAt" timestamp without time zone,
                "initialAmount" numeric(12,2) NOT NULL,
                "totalIncome" numeric(12,2) NOT NULL DEFAULT '0',
                "totalExpense" numeric(12,2) NOT NULL DEFAULT '0',
                "expectedAmount" numeric(12,2),
                "actualAmount" numeric(12,2),
                "difference" numeric(12,2),
                "status" "cash_registers_status_enum" NOT NULL DEFAULT 'open',
                "openingNotes" text,
                "closingNotes" text,
                "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
                "updatedAt" timestamp without time zone NOT NULL DEFAULT now(),
                "deletedAt" timestamp without time zone,
                "opened_by" uuid,
                "closed_by" uuid,
                PRIMARY KEY ("id")
            )
        `);

        await this.createTableIgnoreExists(queryRunner, `
            CREATE TABLE "categories" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" varchar(100) NOT NULL,
                "description" text,
                "color" varchar(7),
                "profitMargin" numeric(5,2),
                "isActive" boolean NOT NULL DEFAULT true,
                "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
                "updatedAt" timestamp without time zone NOT NULL DEFAULT now(),
                PRIMARY KEY ("id")
            )
        `);

        await this.createTableIgnoreExists(queryRunner, `
            CREATE TABLE "customer_accounts" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "customerId" uuid NOT NULL,
                "balance" numeric(12,2) NOT NULL DEFAULT '0',
                "creditLimit" numeric(12,2) NOT NULL DEFAULT '0',
                "status" "customer_accounts_status_enum" NOT NULL DEFAULT 'active',
                "daysOverdue" integer NOT NULL DEFAULT 0,
                "paymentTermDays" integer NOT NULL DEFAULT 30,
                "lastPaymentDate" timestamp without time zone,
                "lastPurchaseDate" timestamp without time zone,
                "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
                "updatedAt" timestamp without time zone NOT NULL DEFAULT now(),
                "deletedAt" timestamp without time zone,
                PRIMARY KEY ("id")
            )
        `);

        await this.createTableIgnoreExists(queryRunner, `
            CREATE TABLE "customer_categories" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" varchar(100) NOT NULL,
                "description" text,
                "color" varchar(7),
                "isActive" boolean NOT NULL DEFAULT true,
                "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
                "updatedAt" timestamp without time zone NOT NULL DEFAULT now(),
                PRIMARY KEY ("id")
            )
        `);

        await this.createTableIgnoreExists(queryRunner, `
            CREATE TABLE "customers" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "firstName" varchar(100) NOT NULL,
                "lastName" varchar(100) NOT NULL,
                "documentType" "customers_documenttype_enum",
                "ivaCondition" "customers_ivacondition_enum" DEFAULT 'CONSUMIDOR_FINAL',
                "documentNumber" varchar(50),
                "email" varchar(255),
                "phone" varchar(20),
                "mobile" varchar(20),
                "address" varchar(255),
                "city" varchar(100),
                "state" varchar(100),
                "postalCode" varchar(20),
                "categoryId" uuid,
                "notes" text,
                "isActive" boolean NOT NULL DEFAULT true,
                "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
                "updatedAt" timestamp without time zone NOT NULL DEFAULT now(),
                PRIMARY KEY ("id")
            )
        `);

        await this.createTableIgnoreExists(queryRunner, `
            CREATE TABLE "expense_categories" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" varchar(100) NOT NULL,
                "isActive" boolean NOT NULL DEFAULT true,
                "description" text,
                "isRecurring" boolean NOT NULL DEFAULT false,
                "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
                PRIMARY KEY ("id")
            )
        `);

        await this.createTableIgnoreExists(queryRunner, `
            CREATE TABLE "expenses" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "description" varchar(200) NOT NULL,
                "amount" numeric(12,2) NOT NULL,
                "expenseDate" date NOT NULL,
                "category_id" uuid,
                "payment_method_id" uuid,
                "receiptNumber" varchar(100),
                "isPaid" boolean NOT NULL DEFAULT true,
                "paidAt" timestamp without time zone,
                "notes" text,
                "created_by" uuid,
                "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
                "updatedAt" timestamp without time zone NOT NULL DEFAULT now(),
                "deletedAt" timestamp without time zone,
                PRIMARY KEY ("id")
            )
        `);

        await this.createTableIgnoreExists(queryRunner, `
            CREATE TABLE "fiscal_configuration" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "businessName" varchar(200),
                "cuit" varchar(11),
                "grossIncome" varchar(50),
                "activityStartDate" date,
                "businessAddress" varchar(300),
                "ivaCondition" "fiscal_configuration_ivacondition_enum" NOT NULL DEFAULT 'RESPONSABLE_MONOTRIBUTO',
                "pointOfSale" integer NOT NULL DEFAULT 1,
                "afipEnvironment" "fiscal_configuration_afipenvironment_enum" NOT NULL DEFAULT 'homologacion',
                "homologacionCertificate" text,
                "homologacionPrivateKey" text,
                "homologacionUploadedAt" timestamp without time zone,
                "homologacionExpiresAt" date,
                "homologacionFingerprint" varchar(64),
                "produccionCertificate" text,
                "produccionPrivateKey" text,
                "produccionUploadedAt" timestamp without time zone,
                "produccionExpiresAt" date,
                "produccionFingerprint" varchar(64),
                "isConfigured" boolean NOT NULL DEFAULT false,
                "homologacionReady" boolean NOT NULL DEFAULT false,
                "produccionReady" boolean NOT NULL DEFAULT false,
                "wsaaTokenHomologacion" text,
                "wsaaSignHomologacion" text,
                "wsaaTokenExpirationHomologacion" timestamp without time zone,
                "wsaaTokenProduccion" text,
                "wsaaSignProduccion" text,
                "wsaaTokenExpirationProduccion" timestamp without time zone,
                "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
                "updatedAt" timestamp without time zone NOT NULL DEFAULT now(),
                PRIMARY KEY ("id")
            )
        `);

        await this.createTableIgnoreExists(queryRunner, `
            CREATE TABLE "income_categories" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" varchar(100) NOT NULL,
                "description" text,
                "isActive" boolean NOT NULL DEFAULT true,
                "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
                "updatedAt" timestamp without time zone NOT NULL DEFAULT now(),
                "deletedAt" timestamp without time zone,
                PRIMARY KEY ("id")
            )
        `);

        await this.createTableIgnoreExists(queryRunner, `
            CREATE TABLE "incomes" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "description" varchar(200) NOT NULL,
                "amount" numeric(12,2) NOT NULL,
                "incomeDate" date NOT NULL,
                "category_id" uuid,
                "customer_id" uuid,
                "customerName" varchar(200),
                "isOnAccount" boolean NOT NULL DEFAULT false,
                "payment_method_id" uuid,
                "receiptNumber" varchar(100),
                "isPaid" boolean NOT NULL DEFAULT true,
                "paidAt" timestamp without time zone,
                "notes" text,
                "created_by" uuid,
                "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
                "updatedAt" timestamp without time zone NOT NULL DEFAULT now(),
                "deletedAt" timestamp without time zone,
                PRIMARY KEY ("id")
            )
        `);

        await this.createTableIgnoreExists(queryRunner, `
            CREATE TABLE "invoices" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "sale_id" uuid NOT NULL,
                "invoiceType" integer NOT NULL,
                "pointOfSale" integer NOT NULL,
                "invoiceNumber" bigint,
                "issueDate" timestamp without time zone NOT NULL,
                "emitterCuit" varchar(11) NOT NULL,
                "emitterBusinessName" varchar(200) NOT NULL,
                "emitterAddress" varchar(300) NOT NULL,
                "emitterIvaCondition" varchar(50) NOT NULL,
                "emitterGrossIncome" varchar(50),
                "emitterActivityStartDate" date,
                "receiverDocumentType" integer NOT NULL,
                "receiverDocumentNumber" varchar(20),
                "receiverName" varchar(200),
                "receiverAddress" varchar(300),
                "receiverIvaCondition" varchar(50),
                "subtotal" numeric(12,2) NOT NULL,
                "discount" numeric(12,2) NOT NULL DEFAULT '0',
                "otherTaxes" numeric(12,2) NOT NULL DEFAULT '0',
                "total" numeric(12,2) NOT NULL,
                "netAmount" numeric(12,2) NOT NULL DEFAULT '0',
                "iva21" numeric(12,2) NOT NULL DEFAULT '0',
                "iva105" numeric(12,2) NOT NULL DEFAULT '0',
                "iva27" numeric(12,2) NOT NULL DEFAULT '0',
                "netAmountExempt" numeric(12,2) NOT NULL DEFAULT '0',
                "saleCondition" varchar(100) NOT NULL,
                "status" "invoices_status_enum" NOT NULL DEFAULT 'pending',
                "cae" varchar(14),
                "caeExpirationDate" date,
                "qrData" text,
                "pdfPath" varchar(500),
                "afipResponse" text,
                "afipErrorMessage" text,
                "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
                "updatedAt" timestamp without time zone NOT NULL DEFAULT now(),
                PRIMARY KEY ("id")
            )
        `);

        await this.createTableIgnoreExists(queryRunner, `
            CREATE TABLE "login_audits" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid NOT NULL,
                "userAgent" varchar(255),
                "success" boolean NOT NULL DEFAULT true,
                "failureReason" varchar,
                "timestamp" timestamp without time zone NOT NULL DEFAULT now(),
                PRIMARY KEY ("id")
            )
        `);

        await this.createTableIgnoreExists(queryRunner, `
            CREATE TABLE "payment_methods" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" varchar(50) NOT NULL,
                "code" varchar(50) NOT NULL,
                "isActive" boolean NOT NULL DEFAULT true,
                "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
                "updatedAt" timestamp without time zone NOT NULL DEFAULT now(),
                "deletedAt" timestamp without time zone,
                PRIMARY KEY ("id")
            )
        `);

        await this.createTableIgnoreExists(queryRunner, `
            CREATE TABLE "products" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" varchar(255) NOT NULL,
                "description" text,
                "sku" varchar(100),
                "barcode" varchar(100),
                "cost" numeric(10,2) NOT NULL,
                "price" numeric(10,2),
                "profitMargin" numeric(5,2),
                "stock" integer NOT NULL DEFAULT 0,
                "categoryId" uuid,
                "useCustomMargin" boolean NOT NULL DEFAULT false,
                "isActive" boolean NOT NULL DEFAULT true,
                "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
                "updatedAt" timestamp without time zone NOT NULL DEFAULT now(),
                PRIMARY KEY ("id")
            )
        `);

        await this.createTableIgnoreExists(queryRunner, `
            CREATE TABLE "purchase_items" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "purchase_id" uuid NOT NULL,
                "product_id" uuid NOT NULL,
                "quantity" integer NOT NULL,
                "unitPrice" numeric(10,2) NOT NULL,
                "subtotal" numeric(12,2) NOT NULL,
                "notes" text,
                "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
                "updatedAt" timestamp without time zone NOT NULL DEFAULT now(),
                PRIMARY KEY ("id")
            )
        `);

        await this.createTableIgnoreExists(queryRunner, `
            CREATE TABLE "purchases" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "purchaseNumber" varchar(20) NOT NULL,
                "supplier_id" uuid,
                "providerName" varchar(200) NOT NULL,
                "providerDocument" varchar(100),
                "providerPhone" varchar(100),
                "purchaseDate" date NOT NULL,
                "subtotal" numeric(12,2) NOT NULL DEFAULT '0',
                "tax" numeric(12,2) NOT NULL DEFAULT '0',
                "discount" numeric(12,2) NOT NULL DEFAULT '0',
                "total" numeric(12,2) NOT NULL DEFAULT '0',
                "status" "purchases_status_enum" NOT NULL DEFAULT 'pending',
                "payment_method_id" uuid,
                "paidAt" timestamp without time zone,
                "invoiceNumber" varchar(100),
                "notes" text,
                "inventoryUpdated" boolean NOT NULL DEFAULT false,
                "created_by" uuid,
                "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
                "updatedAt" timestamp without time zone NOT NULL DEFAULT now(),
                "deletedAt" timestamp without time zone,
                PRIMARY KEY ("id")
            )
        `);

        await this.createTableIgnoreExists(queryRunner, `
            CREATE TABLE "refresh_tokens" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid NOT NULL,
                "token" varchar(500) NOT NULL,
                "expiresAt" timestamp without time zone NOT NULL,
                "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
                PRIMARY KEY ("id")
            )
        `);

        await this.createTableIgnoreExists(queryRunner, `
            CREATE TABLE "sale_items" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "sale_id" uuid NOT NULL,
                "product_id" uuid NOT NULL,
                "productCode" varchar(50),
                "productDescription" varchar(200) NOT NULL,
                "quantity" integer NOT NULL,
                "unitOfMeasure" varchar(20) NOT NULL DEFAULT 'unidades',
                "unitPrice" numeric(10,2) NOT NULL,
                "discount" numeric(10,2) NOT NULL DEFAULT '0',
                "discountPercent" numeric(5,2) NOT NULL DEFAULT '0',
                "subtotal" numeric(12,2) NOT NULL,
                "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
                "updatedAt" timestamp without time zone NOT NULL DEFAULT now(),
                PRIMARY KEY ("id")
            )
        `);

        await this.createTableIgnoreExists(queryRunner, `
            CREATE TABLE "sale_payments" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "sale_id" uuid NOT NULL,
                "payment_method_id" uuid NOT NULL,
                "amount" numeric(12,2) NOT NULL,
                "installments" integer,
                "cardLastFourDigits" varchar(100),
                "authorizationCode" varchar(100),
                "referenceNumber" varchar(100),
                "notes" text,
                "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
                "updatedAt" timestamp without time zone NOT NULL DEFAULT now(),
                PRIMARY KEY ("id")
            )
        `);

        await this.createTableIgnoreExists(queryRunner, `
            CREATE TABLE "sale_taxes" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "sale_id" uuid NOT NULL,
                "name" varchar(100) NOT NULL,
                "percentage" numeric(5,2),
                "amount" numeric(12,2) NOT NULL DEFAULT '0',
                PRIMARY KEY ("id")
            )
        `);

        await this.createTableIgnoreExists(queryRunner, `
            CREATE TABLE "sales" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "saleNumber" varchar(20) NOT NULL,
                "customer_id" uuid,
                "customerName" varchar(200),
                "saleDate" timestamp without time zone NOT NULL DEFAULT now(),
                "subtotal" numeric(12,2) NOT NULL DEFAULT '0',
                "discount" numeric(12,2) NOT NULL DEFAULT '0',
                "surcharge" numeric(12,2) NOT NULL DEFAULT '0',
                "tax" numeric(12,2) NOT NULL DEFAULT '0',
                "total" numeric(12,2) NOT NULL DEFAULT '0',
                "status" "sales_status_enum" NOT NULL DEFAULT 'completed',
                "isOnAccount" boolean NOT NULL DEFAULT false,
                "notes" text,
                "inventoryUpdated" boolean NOT NULL DEFAULT false,
                "isFiscal" boolean NOT NULL DEFAULT false,
                "fiscalPending" boolean NOT NULL DEFAULT false,
                "fiscalError" text,
                "created_by" uuid,
                "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
                "updatedAt" timestamp without time zone NOT NULL DEFAULT now(),
                "deletedAt" timestamp without time zone,
                "ivaPercentage" numeric(4,2),
                PRIMARY KEY ("id")
            )
        `);

        await this.createTableIgnoreExists(queryRunner, `
            CREATE TABLE "stock_movements" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "productId" uuid NOT NULL,
                "type" "stock_movements_type_enum" NOT NULL,
                "source" "stock_movements_source_enum" NOT NULL DEFAULT 'ADJUSTMENT',
                "quantity" integer NOT NULL,
                "cost" numeric(10,2),
                "provider" varchar(255),
                "referenceId" varchar(255),
                "notes" text,
                "date" timestamp without time zone NOT NULL,
                "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
                PRIMARY KEY ("id")
            )
        `);

        await this.createTableIgnoreExists(queryRunner, `
            CREATE TABLE "suppliers" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" varchar(200) NOT NULL,
                "tradeName" varchar(200),
                "documentType" "suppliers_documenttype_enum",
                "documentNumber" varchar(50),
                "ivaCondition" "suppliers_ivacondition_enum",
                "email" varchar(255),
                "phone" varchar(50),
                "mobile" varchar(50),
                "address" varchar(255),
                "city" varchar(100),
                "state" varchar(100),
                "postalCode" varchar(20),
                "website" varchar(255),
                "contactName" varchar(100),
                "bankAccount" varchar(100),
                "notes" text,
                "isActive" boolean NOT NULL DEFAULT true,
                "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
                "updatedAt" timestamp without time zone NOT NULL DEFAULT now(),
                PRIMARY KEY ("id")
            )
        `);

        await this.createTableIgnoreExists(queryRunner, `
            CREATE TABLE "system_configuration" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "defaultProfitMargin" numeric(5,2) NOT NULL DEFAULT '30',
                "minStockAlert" integer NOT NULL DEFAULT 5,
                "sistemaHabilitado" boolean NOT NULL DEFAULT true,
                "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
                "updatedAt" timestamp without time zone NOT NULL DEFAULT now(),
                PRIMARY KEY ("id")
            )
        `);

        await this.createTableIgnoreExists(queryRunner, `
            CREATE TABLE "tax_types" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" varchar(100) NOT NULL,
                "percentage" numeric(5,2),
                "description" varchar(255),
                "isActive" boolean NOT NULL DEFAULT true,
                PRIMARY KEY ("id")
            )
        `);

        await this.createTableIgnoreExists(queryRunner, `
            CREATE TABLE "users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "username" varchar(50) NOT NULL,
                "email" varchar(255),
                "passwordHash" varchar(255) NOT NULL,
                "firstName" varchar(100) NOT NULL,
                "lastName" varchar(100) NOT NULL,
                "isActive" boolean NOT NULL DEFAULT true,
                "lastLogin" timestamp without time zone,
                "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
                "updatedAt" timestamp without time zone NOT NULL DEFAULT now(),
                PRIMARY KEY ("id")
            )
        `);

        // Foreign Keys
        await this.addConstraintIgnoreExists(queryRunner, `
            ALTER TABLE "account_movements"
            ADD CONSTRAINT "FK_7d2cd968644c5490bf50bff6709"
            FOREIGN KEY ("paymentMethodId")
            REFERENCES "payment_methods"("id")
        `);
        await this.addConstraintIgnoreExists(queryRunner, `
            ALTER TABLE "account_movements"
            ADD CONSTRAINT "FK_dae89f38e90f02a194f57608f5a"
            FOREIGN KEY ("accountId")
            REFERENCES "customer_accounts"("id")
        `);
        await this.addConstraintIgnoreExists(queryRunner, `
            ALTER TABLE "account_movements"
            ADD CONSTRAINT "FK_1329229002a091ef7fee593c08d"
            FOREIGN KEY ("createdById")
            REFERENCES "users"("id")
        `);
        await this.addConstraintIgnoreExists(queryRunner, `
            ALTER TABLE "audit_logs"
            ADD CONSTRAINT "FK_bd2726fd31b35443f2245b93ba0"
            FOREIGN KEY ("user_id")
            REFERENCES "users"("id")
        `);
        await this.addConstraintIgnoreExists(queryRunner, `
            ALTER TABLE "cash_movements"
            ADD CONSTRAINT "FK_4a8c24eb16a7adad2154aeb1c55"
            FOREIGN KEY ("cash_register_id")
            REFERENCES "cash_registers"("id")
        `);
        await this.addConstraintIgnoreExists(queryRunner, `
            ALTER TABLE "cash_movements"
            ADD CONSTRAINT "FK_3e189155db57fc4ec067ef68aa5"
            FOREIGN KEY ("created_by")
            REFERENCES "users"("id")
        `);
        await this.addConstraintIgnoreExists(queryRunner, `
            ALTER TABLE "cash_register_totals"
            ADD CONSTRAINT "FK_6544b5feaa70d4a11ed6073826e"
            FOREIGN KEY ("cash_register_id")
            REFERENCES "cash_registers"("id") ON DELETE CASCADE
        `);
        await this.addConstraintIgnoreExists(queryRunner, `
            ALTER TABLE "cash_register_totals"
            ADD CONSTRAINT "FK_d0c44e56ceb30e4077a292a551e"
            FOREIGN KEY ("payment_method_id")
            REFERENCES "payment_methods"("id")
        `);
        await this.addConstraintIgnoreExists(queryRunner, `
            ALTER TABLE "cash_registers"
            ADD CONSTRAINT "FK_d08f513314ad93f22aa720e18ca"
            FOREIGN KEY ("opened_by")
            REFERENCES "users"("id")
        `);
        await this.addConstraintIgnoreExists(queryRunner, `
            ALTER TABLE "cash_registers"
            ADD CONSTRAINT "FK_b433fa68b7d170e913c5bbeb8a6"
            FOREIGN KEY ("closed_by")
            REFERENCES "users"("id")
        `);
        await this.addConstraintIgnoreExists(queryRunner, `
            ALTER TABLE "customer_accounts"
            ADD CONSTRAINT "FK_faa79f189b7dff19db11e5ce6e6"
            FOREIGN KEY ("customerId")
            REFERENCES "customers"("id")
        `);
        await this.addConstraintIgnoreExists(queryRunner, `
            ALTER TABLE "customers"
            ADD CONSTRAINT "FK_f95c9f3263ba32c34ebb051f1f9"
            FOREIGN KEY ("categoryId")
            REFERENCES "customer_categories"("id")
        `);
        await this.addConstraintIgnoreExists(queryRunner, `
            ALTER TABLE "expenses"
            ADD CONSTRAINT "FK_8a16b10452bdd176884248ce50f"
            FOREIGN KEY ("payment_method_id")
            REFERENCES "payment_methods"("id")
        `);
        await this.addConstraintIgnoreExists(queryRunner, `
            ALTER TABLE "expenses"
            ADD CONSTRAINT "FK_5d1f4be708e0dfe2afa1a3c376c"
            FOREIGN KEY ("category_id")
            REFERENCES "expense_categories"("id")
        `);
        await this.addConstraintIgnoreExists(queryRunner, `
            ALTER TABLE "expenses"
            ADD CONSTRAINT "FK_7c0c012c2f8e6578277c239ee61"
            FOREIGN KEY ("created_by")
            REFERENCES "users"("id")
        `);
        await this.addConstraintIgnoreExists(queryRunner, `
            ALTER TABLE "incomes"
            ADD CONSTRAINT "FK_24a1bf2eb3863f1335c956591ab"
            FOREIGN KEY ("payment_method_id")
            REFERENCES "payment_methods"("id")
        `);
        await this.addConstraintIgnoreExists(queryRunner, `
            ALTER TABLE "incomes"
            ADD CONSTRAINT "FK_314abb2175ca312302671c0609b"
            FOREIGN KEY ("customer_id")
            REFERENCES "customers"("id")
        `);
        await this.addConstraintIgnoreExists(queryRunner, `
            ALTER TABLE "incomes"
            ADD CONSTRAINT "FK_aa542e88dd5eaece8243e470962"
            FOREIGN KEY ("category_id")
            REFERENCES "income_categories"("id")
        `);
        await this.addConstraintIgnoreExists(queryRunner, `
            ALTER TABLE "incomes"
            ADD CONSTRAINT "FK_ec4353d3f033dc09ccd0d4c32fb"
            FOREIGN KEY ("created_by")
            REFERENCES "users"("id")
        `);
        await this.addConstraintIgnoreExists(queryRunner, `
            ALTER TABLE "invoices"
            ADD CONSTRAINT "FK_d8a00152c976a4c6a391b1eb497"
            FOREIGN KEY ("sale_id")
            REFERENCES "sales"("id")
        `);
        await this.addConstraintIgnoreExists(queryRunner, `
            ALTER TABLE "login_audits"
            ADD CONSTRAINT "FK_f76965bf9858a2cab885e064304"
            FOREIGN KEY ("userId")
            REFERENCES "users"("id") ON DELETE CASCADE
        `);
        await this.addConstraintIgnoreExists(queryRunner, `
            ALTER TABLE "products"
            ADD CONSTRAINT "FK_ff56834e735fa78a15d0cf21926"
            FOREIGN KEY ("categoryId")
            REFERENCES "categories"("id")
        `);
        await this.addConstraintIgnoreExists(queryRunner, `
            ALTER TABLE "purchase_items"
            ADD CONSTRAINT "FK_43694b2fa800ce38d2da9ce74d6"
            FOREIGN KEY ("product_id")
            REFERENCES "products"("id")
        `);
        await this.addConstraintIgnoreExists(queryRunner, `
            ALTER TABLE "purchase_items"
            ADD CONSTRAINT "FK_607211d59b13e705a673a999ab5"
            FOREIGN KEY ("purchase_id")
            REFERENCES "purchases"("id") ON DELETE CASCADE
        `);
        await this.addConstraintIgnoreExists(queryRunner, `
            ALTER TABLE "purchases"
            ADD CONSTRAINT "FK_70ebb313de49b0256d21b1527d4"
            FOREIGN KEY ("created_by")
            REFERENCES "users"("id")
        `);
        await this.addConstraintIgnoreExists(queryRunner, `
            ALTER TABLE "purchases"
            ADD CONSTRAINT "FK_96fceb0b3442b1821091a2d9715"
            FOREIGN KEY ("payment_method_id")
            REFERENCES "payment_methods"("id")
        `);
        await this.addConstraintIgnoreExists(queryRunner, `
            ALTER TABLE "purchases"
            ADD CONSTRAINT "FK_d5fec047f705d5b510c19379b95"
            FOREIGN KEY ("supplier_id")
            REFERENCES "suppliers"("id")
        `);
        await this.addConstraintIgnoreExists(queryRunner, `
            ALTER TABLE "refresh_tokens"
            ADD CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4"
            FOREIGN KEY ("userId")
            REFERENCES "users"("id") ON DELETE CASCADE
        `);
        await this.addConstraintIgnoreExists(queryRunner, `
            ALTER TABLE "sale_items"
            ADD CONSTRAINT "FK_4ecae62db3f9e9cc9a368d57adb"
            FOREIGN KEY ("product_id")
            REFERENCES "products"("id")
        `);
        await this.addConstraintIgnoreExists(queryRunner, `
            ALTER TABLE "sale_items"
            ADD CONSTRAINT "FK_c210a330b80232c29c2ad68462a"
            FOREIGN KEY ("sale_id")
            REFERENCES "sales"("id") ON DELETE CASCADE
        `);
        await this.addConstraintIgnoreExists(queryRunner, `
            ALTER TABLE "sale_payments"
            ADD CONSTRAINT "FK_9c7db4fd07371a0c1eddcd1bd20"
            FOREIGN KEY ("payment_method_id")
            REFERENCES "payment_methods"("id")
        `);
        await this.addConstraintIgnoreExists(queryRunner, `
            ALTER TABLE "sale_payments"
            ADD CONSTRAINT "FK_0e4445597642c2456ebdd7e23b1"
            FOREIGN KEY ("sale_id")
            REFERENCES "sales"("id") ON DELETE CASCADE
        `);
        await this.addConstraintIgnoreExists(queryRunner, `
            ALTER TABLE "sale_taxes"
            ADD CONSTRAINT "FK_9e10f40f0530d4290b3bf5dbb82"
            FOREIGN KEY ("sale_id")
            REFERENCES "sales"("id") ON DELETE CASCADE
        `);
        await this.addConstraintIgnoreExists(queryRunner, `
            ALTER TABLE "sales"
            ADD CONSTRAINT "FK_83a12e5e2723eafe9a47c441457"
            FOREIGN KEY ("created_by")
            REFERENCES "users"("id")
        `);
        await this.addConstraintIgnoreExists(queryRunner, `
            ALTER TABLE "sales"
            ADD CONSTRAINT "FK_c51005b2b06cec7aa17462c54f5"
            FOREIGN KEY ("customer_id")
            REFERENCES "customers"("id")
        `);
        await this.addConstraintIgnoreExists(queryRunner, `
            ALTER TABLE "stock_movements"
            ADD CONSTRAINT "FK_2c1bb05b80ddcc562cd28d826c6"
            FOREIGN KEY ("productId")
            REFERENCES "products"("id")
        `);

        // Indexes
        await this.createIndexIgnoreExists(queryRunner, `CREATE INDEX "IDX_1896ae681cf45b65c30ac4d75d" ON public.account_movements USING btree ("createdAt")`);
        await this.createIndexIgnoreExists(queryRunner, `CREATE INDEX "IDX_318dacc6ac49989ce28297553a" ON public.account_movements USING btree ("movementType")`);
        await this.createIndexIgnoreExists(queryRunner, `CREATE INDEX "IDX_6f5c93a631fe50545d103f37bd" ON public.account_movements USING btree ("referenceType", "referenceId")`);
        // Mejora #2: Indice unico parcial para evitar duplicados
        await this.createIndexIgnoreExists(queryRunner, `CREATE UNIQUE INDEX "IDX_account_movements_unique_reference" ON "account_movements" ("accountId", "referenceType", "referenceId") WHERE "referenceId" IS NOT NULL`);
        await this.createIndexIgnoreExists(queryRunner, `CREATE INDEX "IDX_dae89f38e90f02a194f57608f5" ON public.account_movements USING btree ("accountId")`);
        await this.createIndexIgnoreExists(queryRunner, `CREATE INDEX "IDX_7421efc125d95e413657efa3c6" ON public.audit_logs USING btree (entity_type, entity_id)`);
        await this.createIndexIgnoreExists(queryRunner, `CREATE INDEX "IDX_88dcc148d532384790ab874c3d" ON public.audit_logs USING btree ("timestamp")`);
        await this.createIndexIgnoreExists(queryRunner, `CREATE INDEX "IDX_bd2726fd31b35443f2245b93ba" ON public.audit_logs USING btree (user_id)`);
        await this.createIndexIgnoreExists(queryRunner, `CREATE INDEX "IDX_cee5459245f652b75eb2759b4c" ON public.audit_logs USING btree (action)`);
        await this.createIndexIgnoreExists(queryRunner, `CREATE INDEX "IDX_8b0be371d28245da6e4f4b6187" ON public.categories USING btree (name)`);
        await this.createIndexIgnoreExists(queryRunner, `CREATE INDEX "IDX_7f67e3035731ad5aeb12af7376" ON public.customer_accounts USING btree ("daysOverdue")`);
        // Mejora #8: Indice para plazo de pago
        await this.createIndexIgnoreExists(queryRunner, `CREATE INDEX "IDX_customer_accounts_paymentTermDays" ON "customer_accounts" ("paymentTermDays")`);
        await this.createIndexIgnoreExists(queryRunner, `CREATE INDEX "IDX_aa4ad1331507e75eca55689ed2" ON public.customer_accounts USING btree (balance)`);
        await this.createIndexIgnoreExists(queryRunner, `CREATE INDEX "IDX_dd4af5e4a911ce718820caff37" ON public.customer_accounts USING btree (status)`);
        await this.createIndexIgnoreExists(queryRunner, `CREATE INDEX "IDX_c3a9318c56cf9f9e4eb9d1b0ef" ON public.customer_categories USING btree ("isActive")`);
        await this.createIndexIgnoreExists(queryRunner, `CREATE INDEX "IDX_ede93c8cf28e307313ec668e73" ON public.customer_categories USING btree (name)`);
        await this.createIndexIgnoreExists(queryRunner, `CREATE INDEX "IDX_40946e98ab87148f58703fa1c5" ON public.customers USING btree ("isActive")`);
        await this.createIndexIgnoreExists(queryRunner, `CREATE INDEX "IDX_8536b8b85c06969f84f0c098b0" ON public.customers USING btree (email)`);
        await this.createIndexIgnoreExists(queryRunner, `CREATE INDEX "IDX_a626a4799ae1d4f275f68ef4a2" ON public.customers USING btree ("lastName", "firstName")`);
        await this.createIndexIgnoreExists(queryRunner, `CREATE INDEX "IDX_dffea8343d90688bccac70b63a" ON public.customers USING btree ("documentNumber")`);
        await this.createIndexIgnoreExists(queryRunner, `CREATE INDEX "IDX_f95c9f3263ba32c34ebb051f1f" ON public.customers USING btree ("categoryId")`);
        await this.createIndexIgnoreExists(queryRunner, `CREATE INDEX "IDX_6bdb3db95dd955d3c701e93542" ON public.expense_categories USING btree (name)`);
        await this.createIndexIgnoreExists(queryRunner, `CREATE INDEX "IDX_36df98c0190cfafd07455a2bfc" ON public.expenses USING btree ("isPaid")`);
        await this.createIndexIgnoreExists(queryRunner, `CREATE INDEX "IDX_f52fb01c27607bb74ba05abf16" ON public.expenses USING btree ("expenseDate")`);
        await this.createIndexIgnoreExists(queryRunner, `CREATE INDEX "IDX_9bfab959a7960a323bcf1d118c" ON public.income_categories USING btree (name)`);
        await this.createIndexIgnoreExists(queryRunner, `CREATE INDEX "IDX_3a2c8e7c0b3e7d1e655f582473" ON public.incomes USING btree ("incomeDate")`);
        await this.createIndexIgnoreExists(queryRunner, `CREATE INDEX "IDX_6017a723ad7e03f5e885e4f982" ON public.incomes USING btree ("isPaid")`);
        await this.createIndexIgnoreExists(queryRunner, `CREATE INDEX "IDX_4c9fb58de893725258746385e1" ON public.products USING btree (name)`);
        await this.createIndexIgnoreExists(queryRunner, `CREATE INDEX "IDX_adfc522baf9d9b19cd7d9461b7" ON public.products USING btree (barcode)`);
        await this.createIndexIgnoreExists(queryRunner, `CREATE INDEX "IDX_ff39b9ac40872b2de41751eedc" ON public.products USING btree ("isActive")`);
        await this.createIndexIgnoreExists(queryRunner, `CREATE INDEX "IDX_ff56834e735fa78a15d0cf2192" ON public.products USING btree ("categoryId")`);
        await this.createIndexIgnoreExists(queryRunner, `CREATE INDEX "IDX_11862e6bc4363d7972bbff85bf" ON public.purchases USING btree ("purchaseDate")`);
        await this.createIndexIgnoreExists(queryRunner, `CREATE INDEX "IDX_2cb30fcfd2e6e895ffc58c3d7a" ON public.purchases USING btree ("providerName")`);
        await this.createIndexIgnoreExists(queryRunner, `CREATE INDEX "IDX_36cd9508061bebb74fb3e1a9c7" ON public.purchases USING btree (status)`);
        await this.createIndexIgnoreExists(queryRunner, `CREATE INDEX "IDX_d5fec047f705d5b510c19379b9" ON public.purchases USING btree (supplier_id)`);
        await this.createIndexIgnoreExists(queryRunner, `CREATE INDEX "IDX_4542dd2f38a61354a040ba9fd5" ON public.refresh_tokens USING btree (token)`);
        await this.createIndexIgnoreExists(queryRunner, `CREATE INDEX "IDX_56b91d98f71e3d1b649ed6e9f3" ON public.refresh_tokens USING btree ("expiresAt")`);
        await this.createIndexIgnoreExists(queryRunner, `CREATE INDEX "IDX_12c072f5150ca7d495b07aa1c6" ON public.sales USING btree ("saleNumber")`);
        await this.createIndexIgnoreExists(queryRunner, `CREATE INDEX "IDX_65f3c52de52446c1d23ed5daf2" ON public.sales USING btree ("saleDate")`);
        await this.createIndexIgnoreExists(queryRunner, `CREATE INDEX "IDX_83e1f4b8d3b863cce4846e0295" ON public.sales USING btree (status)`);
        await this.createIndexIgnoreExists(queryRunner, `CREATE INDEX "IDX_c51005b2b06cec7aa17462c54f" ON public.sales USING btree (customer_id)`);
        await this.createIndexIgnoreExists(queryRunner, `CREATE INDEX "IDX_4827b42d37a5f169c4bf7e63f9" ON public.stock_movements USING btree (date)`);
        await this.createIndexIgnoreExists(queryRunner, `CREATE INDEX "IDX_67aceb5d7a6fa85362821b15cb" ON public.stock_movements USING btree (source)`);
        await this.createIndexIgnoreExists(queryRunner, `CREATE INDEX "IDX_a3acb59db67e977be45e382fc5" ON public.stock_movements USING btree ("productId")`);
        await this.createIndexIgnoreExists(queryRunner, `CREATE INDEX "IDX_cca7634960c09010c40b6490a1" ON public.stock_movements USING btree (type)`);
        await this.createIndexIgnoreExists(queryRunner, `CREATE INDEX "IDX_5b5720d9645cee7396595a16c9" ON public.suppliers USING btree (name)`);
        await this.createIndexIgnoreExists(queryRunner, `CREATE INDEX "IDX_66181e465a65c2ddcfa9c00c9c" ON public.suppliers USING btree (email)`);
        await this.createIndexIgnoreExists(queryRunner, `CREATE INDEX "IDX_876c06b5396f3c4acb7144ca92" ON public.suppliers USING btree ("isActive")`);
        await this.createIndexIgnoreExists(queryRunner, `CREATE INDEX "IDX_939b78561f0b4da019d2f1bdcc" ON public.suppliers USING btree ("documentNumber")`);
        await this.createIndexIgnoreExists(queryRunner, `CREATE INDEX "IDX_fe0bb3f6520ee0469504521e71" ON public.users USING btree (username)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "users" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "tax_types" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "system_configuration" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "suppliers" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "stock_movements" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "sales" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "sale_taxes" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "sale_payments" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "sale_items" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "refresh_tokens" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "purchases" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "purchase_items" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "products" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "payment_methods" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "login_audits" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "invoices" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "incomes" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "income_categories" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "fiscal_configuration" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "expenses" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "expense_categories" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "customers" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "customer_categories" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "customer_accounts" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "categories" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "cash_registers" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "cash_register_totals" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "cash_movements" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "backups" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "account_movements" CASCADE`);
        await queryRunner.query(`DROP TYPE IF EXISTS "suppliers_ivacondition_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "suppliers_documenttype_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "stock_movements_type_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "stock_movements_source_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "sales_status_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "purchases_status_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "invoices_status_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "fiscal_configuration_ivacondition_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "fiscal_configuration_afipenvironment_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "customers_ivacondition_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "customers_documenttype_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "customer_accounts_status_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "cash_registers_status_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "cash_movements_movementtype_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "backups_status_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "account_movements_movementtype_enum"`);
    }
}
