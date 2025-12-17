// Archivo que exporta todas las migraciones para uso con webpack bundle
// TypeORM necesita referencias explícitas en lugar de patrones glob cuando se bundlea

import { CreateCashRegisterTables1733079863000 } from './migrations/1733079863000-CreateCashRegisterTables';
import { CreateCashRegisterTotals1733100000000 } from './migrations/1733100000000-CreateCashRegisterTotals';
import { AddStockMovementSource1733100001000 } from './migrations/1733100001000-AddStockMovementSource';
import { CreateCustomerAccountsTables1733535600000 } from './migrations/1733535600000-CreateCustomerAccountsTables';
import { SeparateWsaaTokensByEnvironment1733866700000 } from './migrations/1733866700000-SeparateWsaaTokensByEnvironment';
import { CategoryProfitMarginAndManyToOne1733877600000 } from './migrations/1733877600000-CategoryProfitMarginAndManyToOne';
import { RemoveExpenseCategoryFields1734095590000 } from './migrations/1734095590000-RemoveExpenseCategoryFields';
import { RemoveProductCategoriesTable1734096030000 } from './migrations/1734096030000-RemoveProductCategoriesTable';
import { AddDescriptionToProducts1734110000000 } from './migrations/1734110000000-AddDescriptionToProducts';
import { CreateAuditLogsTable1734200000000 } from './migrations/1734200000000-CreateAuditLogsTable';
import { AddManualMovementFields1734228600000 } from './migrations/1734228600000-AddManualMovementFields';
import { AddSistemaHabilitado1734310000000 } from './migrations/1734310000000-AddSistemaHabilitado';

export const migrations = [
    CreateCashRegisterTables1733079863000,
    CreateCashRegisterTotals1733100000000,
    AddStockMovementSource1733100001000,
    CreateCustomerAccountsTables1733535600000,
    SeparateWsaaTokensByEnvironment1733866700000,
    CategoryProfitMarginAndManyToOne1733877600000,
    RemoveExpenseCategoryFields1734095590000,
    RemoveProductCategoriesTable1734096030000,
    AddDescriptionToProducts1734110000000,
    CreateAuditLogsTable1734200000000,
    AddManualMovementFields1734228600000,
    AddSistemaHabilitado1734310000000,
];
