# Módulo: Productos Más Vendidos

## 1. Descripción y Objetivo

### 1.1 Descripción
El módulo de Productos Más Vendidos proporciona un análisis detallado del rendimiento de ventas por producto. Permite visualizar rankings, tendencias históricas, comparativas por período y análisis de rentabilidad. Esta información es clave para toma de decisiones de compra, gestión de inventario y estrategias de marketing.

### 1.2 Objetivo
- Identificar los productos estrella del negocio
- Analizar tendencias de venta por producto
- Detectar productos en crecimiento/declive
- Optimizar decisiones de reposición de stock
- Identificar productos de baja rotación
- Analizar rentabilidad por producto vendido
- Exportar rankings para análisis externo

### 1.3 Funcionalidades Principales
- Ranking de productos más vendidos (por cantidad o ingresos)
- Filtros por período (día, semana, mes, año, personalizado)
- Filtro por categoría de producto
- Comparativa entre períodos
- Gráficos de evolución de ventas por producto
- Análisis de margen de ganancia por producto
- Productos en tendencia (crecimiento)
- Productos en declive (decrecimiento)
- Productos con 0 ventas
- Exportación a Excel/PDF

---

## 2. Métricas Clave

### 2.1 Ranking Principal

| Métrica | Descripción |
|---------|-------------|
| Cantidad vendida | Unidades totales vendidas del producto |
| Ingresos generados | Total $ facturado por el producto |
| Margen bruto | Ganancia = Ingresos - (Costo × Cantidad) |
| % de ventas totales | Participación del producto en ventas totales |
| Ticket promedio | Precio promedio al que se vendió |

### 2.2 Indicadores de Tendencia

| Indicador | Fórmula |
|-----------|---------|
| Crecimiento % | ((Ventas actual - Ventas anterior) / Ventas anterior) × 100 |
| Velocidad de rotación | Cantidad vendida / Stock promedio |
| Días sin venta | Días transcurridos desde última venta |

### 2.3 Análisis de Rentabilidad

| Métrica | Descripción |
|---------|-------------|
| Costo total vendido | Costo unitario × Cantidad vendida |
| Margen bruto $ | Ingresos - Costo total vendido |
| Margen bruto % | (Margen / Ingresos) × 100 |
| ROI por producto | (Margen / Costo total) × 100 |

---

## 3. Backend (NestJS)

### 3.1 Estructura de Carpetas

```
src/
└── reports/
    ├── dto/
    │   ├── top-products-filters.dto.ts
    │   └── product-sales-stats.dto.ts
    ├── reports.controller.ts
    ├── reports.service.ts
    └── reports.module.ts
```

### 3.2 DTOs

#### **top-products-filters.dto.ts**
```typescript
import { IsOptional, IsString, IsEnum, IsDate, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export enum RankingOrderBy {
  QUANTITY = 'quantity',      // Por cantidad vendida
  REVENUE = 'revenue',        // Por ingresos generados
  MARGIN = 'margin',          // Por margen de ganancia
  GROWTH = 'growth'           // Por crecimiento %
}

export enum PeriodPreset {
  TODAY = 'today',
  LAST_7_DAYS = 'last_7_days',
  LAST_30_DAYS = 'last_30_days',
  THIS_MONTH = 'this_month',
  LAST_MONTH = 'last_month',
  THIS_YEAR = 'this_year',
  CUSTOM = 'custom'
}

export class TopProductsFiltersDto {
  @IsOptional()
  @IsEnum(PeriodPreset)
  period?: PeriodPreset = PeriodPreset.THIS_MONTH;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsEnum(RankingOrderBy)
  orderBy?: RankingOrderBy = RankingOrderBy.QUANTITY;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 10;

  @IsOptional()
  @IsBoolean()
  includeComparison?: boolean = false; // Incluir comparación con período anterior
}
```

#### **product-sales-stats.dto.ts**
```typescript
export interface ProductSalesStats {
  product: {
    id: string;
    name: string;
    code: string;
    category: string;
    salePrice: number;
    costPrice: number;
    currentStock: number;
  };
  stats: {
    quantitySold: number;
    revenue: number;
    costOfGoodsSold: number;
    grossMargin: number;
    grossMarginPercentage: number;
    averageSalePrice: number;
    salesCount: number;              // Cantidad de ventas donde apareció
    percentageOfTotalSales: number;  // % del total de ventas
  };
  trend?: {
    previousQuantity: number;
    previousRevenue: number;
    quantityGrowth: number;          // % crecimiento en cantidad
    revenueGrowth: number;           // % crecimiento en ingresos
    isGrowing: boolean;
  };
  inventory?: {
    currentStock: number;
    daysOfStock: number;             // Días de stock según velocidad de venta
    needsReorder: boolean;
  };
}

export interface TopProductsResponse {
  period: {
    startDate: Date;
    endDate: Date;
    label: string;
  };
  summary: {
    totalProducts: number;           // Productos distintos vendidos
    totalQuantitySold: number;       // Unidades totales vendidas
    totalRevenue: number;            // Ingresos totales
    totalMargin: number;             // Margen total
    averageMarginPercentage: number;
  };
  topProducts: ProductSalesStats[];
  comparison?: {
    previousPeriod: {
      startDate: Date;
      endDate: Date;
    };
    totalQuantityGrowth: number;
    totalRevenueGrowth: number;
  };
}
```

### 3.3 Service (reports.service.ts - Sección Productos)

```typescript
@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Sale)
    private saleRepo: Repository<Sale>,
    @InjectRepository(SaleItem)
    private saleItemRepo: Repository<SaleItem>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
  ) {}

  // ============================================
  // PRODUCTOS MÁS VENDIDOS
  // ============================================

  async getTopProducts(filters: TopProductsFiltersDto): Promise<TopProductsResponse> {
    // Resolver fechas según preset o custom
    const { startDate, endDate } = this.resolvePeriodDates(filters);

    // Query base: items de ventas completadas
    const query = this.saleItemRepo.createQueryBuilder('item')
      .innerJoin('item.sale', 'sale')
      .innerJoin('item.product', 'product')
      .leftJoin('product.category', 'category')
      .where('sale.status = :status', { status: SaleStatus.COMPLETED })
      .andWhere('sale.saleDate BETWEEN :start AND :end', {
        start: startDate,
        end: endDate
      });

    // Filtrar por categoría si se especifica
    if (filters.categoryId) {
      query.andWhere('product.categoryId = :categoryId', {
        categoryId: filters.categoryId
      });
    }

    // Agrupar por producto y calcular estadísticas
    query.select([
      'product.id AS productId',
      'product.name AS productName',
      'product.code AS productCode',
      'product.salePrice AS salePrice',
      'product.costPrice AS costPrice',
      'product.stock AS currentStock',
      'product.minStock AS minStock',
      'category.name AS categoryName',
      'SUM(item.quantity) AS quantitySold',
      'SUM(item.subtotal) AS revenue',
      'SUM(item.quantity * product.costPrice) AS costOfGoodsSold',
      'COUNT(DISTINCT sale.id) AS salesCount',
      'AVG(item.unitPrice) AS averageSalePrice',
    ])
    .groupBy('product.id')
    .addGroupBy('product.name')
    .addGroupBy('product.code')
    .addGroupBy('product.salePrice')
    .addGroupBy('product.costPrice')
    .addGroupBy('product.stock')
    .addGroupBy('product.minStock')
    .addGroupBy('category.name');

    // Ordenar según criterio
    const orderColumn = this.getOrderColumn(filters.orderBy);
    query.orderBy(orderColumn, 'DESC');

    // Limitar resultados
    query.limit(filters.limit || 10);

    const rawResults = await query.getRawMany();

    // Calcular totales para porcentajes
    const totals = await this.calculatePeriodTotals(startDate, endDate, filters.categoryId);

    // Transformar resultados
    const topProducts: ProductSalesStats[] = rawResults.map(row => {
      const revenue = Number(row.revenue);
      const costOfGoodsSold = Number(row.costOfGoodsSold);
      const grossMargin = revenue - costOfGoodsSold;
      const quantitySold = Number(row.quantitySold);

      return {
        product: {
          id: row.productId,
          name: row.productName,
          code: row.productCode,
          category: row.categoryName,
          salePrice: Number(row.salePrice),
          costPrice: Number(row.costPrice),
          currentStock: Number(row.currentStock),
        },
        stats: {
          quantitySold,
          revenue,
          costOfGoodsSold,
          grossMargin,
          grossMarginPercentage: revenue > 0 ? (grossMargin / revenue) * 100 : 0,
          averageSalePrice: Number(row.averageSalePrice),
          salesCount: Number(row.salesCount),
          percentageOfTotalSales: totals.totalRevenue > 0
            ? (revenue / totals.totalRevenue) * 100
            : 0,
        },
        inventory: {
          currentStock: Number(row.currentStock),
          daysOfStock: this.calculateDaysOfStock(
            Number(row.currentStock),
            quantitySold,
            startDate,
            endDate
          ),
          needsReorder: Number(row.currentStock) <= Number(row.minStock),
        },
      };
    });

    // Obtener comparación con período anterior si se solicita
    let comparison = undefined;
    if (filters.includeComparison) {
      comparison = await this.getPeriodsComparison(
        topProducts,
        startDate,
        endDate,
        filters.categoryId
      );
    }

    return {
      period: {
        startDate,
        endDate,
        label: this.getPeriodLabel(filters.period, startDate, endDate),
      },
      summary: totals,
      topProducts,
      comparison,
    };
  }

  // Obtener productos con tendencia de crecimiento
  async getTrendingProducts(limit: number = 10): Promise<ProductSalesStats[]> {
    const today = new Date();
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

    // Ventas de este mes
    const currentMonthProducts = await this.getTopProducts({
      period: PeriodPreset.CUSTOM,
      startDate: thisMonthStart,
      endDate: today,
      limit: 100,
      orderBy: RankingOrderBy.QUANTITY,
    });

    // Ventas del mes pasado
    const lastMonthProducts = await this.getTopProducts({
      period: PeriodPreset.CUSTOM,
      startDate: lastMonthStart,
      endDate: lastMonthEnd,
      limit: 100,
      orderBy: RankingOrderBy.QUANTITY,
    });

    // Calcular crecimiento
    const productsWithGrowth = currentMonthProducts.topProducts.map(current => {
      const previous = lastMonthProducts.topProducts.find(
        p => p.product.id === current.product.id
      );

      const previousQuantity = previous?.stats.quantitySold || 0;
      const quantityGrowth = previousQuantity > 0
        ? ((current.stats.quantitySold - previousQuantity) / previousQuantity) * 100
        : current.stats.quantitySold > 0 ? 100 : 0;

      return {
        ...current,
        trend: {
          previousQuantity,
          previousRevenue: previous?.stats.revenue || 0,
          quantityGrowth,
          revenueGrowth: previous?.stats.revenue > 0
            ? ((current.stats.revenue - previous.stats.revenue) / previous.stats.revenue) * 100
            : current.stats.revenue > 0 ? 100 : 0,
          isGrowing: quantityGrowth > 0,
        },
      };
    });

    // Ordenar por crecimiento y retornar top
    return productsWithGrowth
      .filter(p => p.trend.isGrowing)
      .sort((a, b) => b.trend.quantityGrowth - a.trend.quantityGrowth)
      .slice(0, limit);
  }

  // Obtener productos en declive
  async getDecliningProducts(limit: number = 10): Promise<ProductSalesStats[]> {
    const trending = await this.getTrendingProducts(100);

    // Filtrar los que tienen crecimiento negativo
    const trendingAll = await this.getProductsWithTrend();

    return trendingAll
      .filter(p => p.trend && !p.trend.isGrowing && p.trend.quantityGrowth < 0)
      .sort((a, b) => a.trend.quantityGrowth - b.trend.quantityGrowth)
      .slice(0, limit);
  }

  // Productos sin ventas en el período
  async getProductsWithoutSales(startDate: Date, endDate: Date): Promise<Product[]> {
    const productsWithSales = await this.saleItemRepo.createQueryBuilder('item')
      .innerJoin('item.sale', 'sale')
      .where('sale.status = :status', { status: SaleStatus.COMPLETED })
      .andWhere('sale.saleDate BETWEEN :start AND :end', { start: startDate, end: endDate })
      .select('DISTINCT item.productId', 'productId')
      .getRawMany();

    const productIdsWithSales = productsWithSales.map(p => p.productId);

    if (productIdsWithSales.length === 0) {
      return this.productRepo.find({ where: { isActive: true } });
    }

    return this.productRepo.createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.isActive = :active', { active: true })
      .andWhere('product.id NOT IN (:...ids)', { ids: productIdsWithSales })
      .orderBy('product.name', 'ASC')
      .getMany();
  }

  // Análisis de un producto específico
  async getProductSalesAnalysis(productId: string, months: number = 6) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    // Ventas mensuales del producto
    const monthlyData = [];
    for (let i = 0; i < months; i++) {
      const monthStart = new Date(endDate.getFullYear(), endDate.getMonth() - i, 1);
      const monthEnd = new Date(endDate.getFullYear(), endDate.getMonth() - i + 1, 0);

      const stats = await this.saleItemRepo.createQueryBuilder('item')
        .innerJoin('item.sale', 'sale')
        .where('item.productId = :productId', { productId })
        .andWhere('sale.status = :status', { status: SaleStatus.COMPLETED })
        .andWhere('sale.saleDate BETWEEN :start AND :end', {
          start: monthStart,
          end: monthEnd
        })
        .select([
          'SUM(item.quantity) AS quantity',
          'SUM(item.subtotal) AS revenue',
          'COUNT(DISTINCT sale.id) AS sales',
        ])
        .getRawOne();

      monthlyData.unshift({
        month: monthStart.toISOString().slice(0, 7),
        label: monthStart.toLocaleDateString('es-AR', { month: 'short', year: 'numeric' }),
        quantity: Number(stats.quantity) || 0,
        revenue: Number(stats.revenue) || 0,
        sales: Number(stats.sales) || 0,
      });
    }

    // Obtener datos del producto
    const product = await this.productRepo.findOne({
      where: { id: productId },
      relations: ['category'],
    });

    // Calcular promedios y tendencias
    const totalQuantity = monthlyData.reduce((sum, m) => sum + m.quantity, 0);
    const totalRevenue = monthlyData.reduce((sum, m) => sum + m.revenue, 0);
    const avgMonthlyQuantity = totalQuantity / months;
    const avgMonthlyRevenue = totalRevenue / months;

    // Tendencia (comparando últimos 3 meses vs 3 anteriores)
    const recent3 = monthlyData.slice(-3).reduce((sum, m) => sum + m.quantity, 0);
    const previous3 = monthlyData.slice(-6, -3).reduce((sum, m) => sum + m.quantity, 0);
    const trendPercentage = previous3 > 0
      ? ((recent3 - previous3) / previous3) * 100
      : 0;

    return {
      product,
      period: { startDate, endDate, months },
      monthlyData,
      summary: {
        totalQuantity,
        totalRevenue,
        totalMargin: totalRevenue - (totalQuantity * (product?.costPrice || 0)),
        avgMonthlyQuantity,
        avgMonthlyRevenue,
        trendPercentage,
        trendDirection: trendPercentage > 5 ? 'up' : trendPercentage < -5 ? 'down' : 'stable',
      },
      recommendations: this.generateProductRecommendations(
        product,
        avgMonthlyQuantity,
        trendPercentage
      ),
    };
  }

  // ============================================
  // MÉTODOS AUXILIARES
  // ============================================

  private resolvePeriodDates(filters: TopProductsFiltersDto): { startDate: Date; endDate: Date } {
    if (filters.period === PeriodPreset.CUSTOM && filters.startDate && filters.endDate) {
      return { startDate: filters.startDate, endDate: filters.endDate };
    }

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    switch (filters.period) {
      case PeriodPreset.TODAY:
        const todayStart = new Date(today);
        todayStart.setHours(0, 0, 0, 0);
        return { startDate: todayStart, endDate: today };

      case PeriodPreset.LAST_7_DAYS:
        const last7 = new Date(today);
        last7.setDate(last7.getDate() - 7);
        last7.setHours(0, 0, 0, 0);
        return { startDate: last7, endDate: today };

      case PeriodPreset.LAST_30_DAYS:
        const last30 = new Date(today);
        last30.setDate(last30.getDate() - 30);
        last30.setHours(0, 0, 0, 0);
        return { startDate: last30, endDate: today };

      case PeriodPreset.THIS_MONTH:
        return {
          startDate: new Date(today.getFullYear(), today.getMonth(), 1),
          endDate: today
        };

      case PeriodPreset.LAST_MONTH:
        return {
          startDate: new Date(today.getFullYear(), today.getMonth() - 1, 1),
          endDate: new Date(today.getFullYear(), today.getMonth(), 0)
        };

      case PeriodPreset.THIS_YEAR:
        return {
          startDate: new Date(today.getFullYear(), 0, 1),
          endDate: today
        };

      default:
        return {
          startDate: new Date(today.getFullYear(), today.getMonth(), 1),
          endDate: today
        };
    }
  }

  private getOrderColumn(orderBy?: RankingOrderBy): string {
    switch (orderBy) {
      case RankingOrderBy.REVENUE:
        return 'revenue';
      case RankingOrderBy.MARGIN:
        return '(SUM(item.subtotal) - SUM(item.quantity * product.costPrice))';
      case RankingOrderBy.GROWTH:
        return 'quantitySold'; // Se reordena después con datos de tendencia
      default:
        return 'quantitySold';
    }
  }

  private async calculatePeriodTotals(
    startDate: Date,
    endDate: Date,
    categoryId?: string
  ) {
    const query = this.saleItemRepo.createQueryBuilder('item')
      .innerJoin('item.sale', 'sale')
      .innerJoin('item.product', 'product')
      .where('sale.status = :status', { status: SaleStatus.COMPLETED })
      .andWhere('sale.saleDate BETWEEN :start AND :end', { start: startDate, end: endDate });

    if (categoryId) {
      query.andWhere('product.categoryId = :categoryId', { categoryId });
    }

    const result = await query
      .select([
        'COUNT(DISTINCT product.id) AS totalProducts',
        'SUM(item.quantity) AS totalQuantitySold',
        'SUM(item.subtotal) AS totalRevenue',
        'SUM(item.quantity * product.costPrice) AS totalCost',
      ])
      .getRawOne();

    const totalRevenue = Number(result.totalRevenue) || 0;
    const totalCost = Number(result.totalCost) || 0;
    const totalMargin = totalRevenue - totalCost;

    return {
      totalProducts: Number(result.totalProducts) || 0,
      totalQuantitySold: Number(result.totalQuantitySold) || 0,
      totalRevenue,
      totalMargin,
      averageMarginPercentage: totalRevenue > 0 ? (totalMargin / totalRevenue) * 100 : 0,
    };
  }

  private calculateDaysOfStock(
    currentStock: number,
    quantitySold: number,
    startDate: Date,
    endDate: Date
  ): number {
    const daysDiff = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const dailyAverage = quantitySold / daysDiff;

    if (dailyAverage <= 0) return 999; // Stock infinito si no hay ventas

    return Math.round(currentStock / dailyAverage);
  }

  private getPeriodLabel(period: PeriodPreset, startDate: Date, endDate: Date): string {
    const formatDate = (d: Date) => d.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    switch (period) {
      case PeriodPreset.TODAY:
        return 'Hoy';
      case PeriodPreset.LAST_7_DAYS:
        return 'Últimos 7 días';
      case PeriodPreset.LAST_30_DAYS:
        return 'Últimos 30 días';
      case PeriodPreset.THIS_MONTH:
        return 'Este mes';
      case PeriodPreset.LAST_MONTH:
        return 'Mes anterior';
      case PeriodPreset.THIS_YEAR:
        return 'Este año';
      default:
        return `${formatDate(startDate)} - ${formatDate(endDate)}`;
    }
  }

  private generateProductRecommendations(
    product: Product,
    avgMonthlyQuantity: number,
    trendPercentage: number
  ): string[] {
    const recommendations = [];

    // Stock bajo
    if (product && product.stock <= product.minStock) {
      const suggestedOrder = Math.ceil(avgMonthlyQuantity * 2);
      recommendations.push(
        `⚠️ Stock bajo: quedan ${product.stock} unidades. Se recomienda pedir ${suggestedOrder} unidades.`
      );
    }

    // Tendencia
    if (trendPercentage > 20) {
      recommendations.push(
        `📈 Producto en crecimiento (${trendPercentage.toFixed(1)}%). Considerar aumentar stock.`
      );
    } else if (trendPercentage < -20) {
      recommendations.push(
        `📉 Producto en declive (${trendPercentage.toFixed(1)}%). Revisar precio o promocionar.`
      );
    }

    // Margen
    if (product) {
      const margin = ((product.salePrice - product.costPrice) / product.salePrice) * 100;
      if (margin < 20) {
        recommendations.push(
          `💰 Margen bajo (${margin.toFixed(1)}%). Considerar ajustar precio de venta.`
        );
      }
    }

    return recommendations;
  }
}
```

### 3.4 Controller (reports.controller.ts)

```typescript
@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  // ============================================
  // ENDPOINTS PRODUCTOS MÁS VENDIDOS
  // ============================================

  @Get('top-products')
  getTopProducts(@Query() filters: TopProductsFiltersDto) {
    return this.reportsService.getTopProducts(filters);
  }

  @Get('trending-products')
  getTrendingProducts(@Query('limit') limit?: number) {
    return this.reportsService.getTrendingProducts(limit);
  }

  @Get('declining-products')
  getDecliningProducts(@Query('limit') limit?: number) {
    return this.reportsService.getDecliningProducts(limit);
  }

  @Get('products-without-sales')
  getProductsWithoutSales(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    return this.reportsService.getProductsWithoutSales(
      new Date(startDate),
      new Date(endDate)
    );
  }

  @Get('product-analysis/:productId')
  getProductAnalysis(
    @Param('productId') productId: string,
    @Query('months') months?: number
  ) {
    return this.reportsService.getProductSalesAnalysis(productId, months);
  }
}
```

---

## 4. Frontend (React)

### 4.1 API Client

```typescript
// src/features/reports/api/top-products.api.ts
import axios from '@/lib/axios';

export interface TopProductsFilters {
  period?: string;
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  orderBy?: 'quantity' | 'revenue' | 'margin' | 'growth';
  limit?: number;
  includeComparison?: boolean;
}

export const topProductsApi = {
  getTopProducts: (filters?: TopProductsFilters) =>
    axios.get('/reports/top-products', { params: filters }).then(res => res.data),

  getTrending: (limit?: number) =>
    axios.get('/reports/trending-products', { params: { limit } }).then(res => res.data),

  getDeclining: (limit?: number) =>
    axios.get('/reports/declining-products', { params: { limit } }).then(res => res.data),

  getWithoutSales: (startDate: string, endDate: string) =>
    axios.get('/reports/products-without-sales', {
      params: { startDate, endDate }
    }).then(res => res.data),

  getProductAnalysis: (productId: string, months?: number) =>
    axios.get(`/reports/product-analysis/${productId}`, {
      params: { months }
    }).then(res => res.data),
};
```

### 4.2 Hooks

```typescript
// src/features/reports/hooks/useTopProducts.ts
import { useQuery } from '@tanstack/react-query';
import { topProductsApi, TopProductsFilters } from '../api/top-products.api';

export function useTopProducts(filters?: TopProductsFilters) {
  return useQuery({
    queryKey: ['top-products', filters],
    queryFn: () => topProductsApi.getTopProducts(filters),
  });
}

export function useTrendingProducts(limit?: number) {
  return useQuery({
    queryKey: ['trending-products', limit],
    queryFn: () => topProductsApi.getTrending(limit),
  });
}

export function useDecliningProducts(limit?: number) {
  return useQuery({
    queryKey: ['declining-products', limit],
    queryFn: () => topProductsApi.getDeclining(limit),
  });
}

export function useProductsWithoutSales(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['products-without-sales', startDate, endDate],
    queryFn: () => topProductsApi.getWithoutSales(startDate, endDate),
    enabled: !!startDate && !!endDate,
  });
}

export function useProductAnalysis(productId: string, months?: number) {
  return useQuery({
    queryKey: ['product-analysis', productId, months],
    queryFn: () => topProductsApi.getProductAnalysis(productId, months),
    enabled: !!productId,
  });
}
```

### 4.3 Página Principal: TopProductsPage.tsx

```tsx
import { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Award,
  Package,
  BarChart3,
  Download,
  Filter,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useTopProducts, useTrendingProducts, useDecliningProducts } from '../hooks/useTopProducts';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const PERIOD_OPTIONS = [
  { value: 'today', label: 'Hoy' },
  { value: 'last_7_days', label: 'Últimos 7 días' },
  { value: 'last_30_days', label: 'Últimos 30 días' },
  { value: 'this_month', label: 'Este mes' },
  { value: 'last_month', label: 'Mes anterior' },
  { value: 'this_year', label: 'Este año' },
];

const ORDER_OPTIONS = [
  { value: 'quantity', label: 'Por cantidad vendida' },
  { value: 'revenue', label: 'Por ingresos' },
  { value: 'margin', label: 'Por margen de ganancia' },
];

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export function TopProductsPage() {
  const [period, setPeriod] = useState('this_month');
  const [orderBy, setOrderBy] = useState('quantity');
  const [limit, setLimit] = useState(10);

  const { data: topProducts, isLoading } = useTopProducts({
    period,
    orderBy,
    limit,
    includeComparison: true,
  });

  const { data: trending } = useTrendingProducts(5);
  const { data: declining } = useDecliningProducts(5);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Cargando...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Award className="h-8 w-8 text-yellow-500" />
            Productos Más Vendidos
          </h1>
          <p className="text-muted-foreground">
            {topProducts?.period.label} • Análisis de rendimiento de productos
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportToExcel(topProducts)}>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <Filter className="h-4 w-4 text-muted-foreground" />

            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                {PERIOD_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={orderBy} onValueChange={setOrderBy}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                {ORDER_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={limit.toString()} onValueChange={(v) => setLimit(Number(v))}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Mostrar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">Top 5</SelectItem>
                <SelectItem value="10">Top 10</SelectItem>
                <SelectItem value="20">Top 20</SelectItem>
                <SelectItem value="50">Top 50</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Resumen KPIs */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Productos Vendidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {topProducts?.summary.totalProducts}
            </div>
            <p className="text-xs text-muted-foreground">productos distintos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unidades Vendidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {topProducts?.summary.totalQuantitySold.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ingresos Totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(topProducts?.summary.totalRevenue || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Margen Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(topProducts?.summary.totalMargin || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Margen Promedio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPercentage(topProducts?.summary.averageMarginPercentage || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs con diferentes vistas */}
      <Tabs defaultValue="ranking" className="space-y-4">
        <TabsList>
          <TabsTrigger value="ranking">
            <BarChart3 className="mr-2 h-4 w-4" />
            Ranking
          </TabsTrigger>
          <TabsTrigger value="chart">
            Gráfico
          </TabsTrigger>
          <TabsTrigger value="trending">
            <TrendingUp className="mr-2 h-4 w-4" />
            En Crecimiento
          </TabsTrigger>
          <TabsTrigger value="declining">
            <TrendingDown className="mr-2 h-4 w-4" />
            En Declive
          </TabsTrigger>
        </TabsList>

        {/* Tab: Ranking */}
        <TabsContent value="ranking">
          <Card>
            <CardContent className="pt-6">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 w-12">#</th>
                    <th className="pb-3">Producto</th>
                    <th className="pb-3 text-right">Cantidad</th>
                    <th className="pb-3 text-right">Ingresos</th>
                    <th className="pb-3 text-right">Margen</th>
                    <th className="pb-3 text-right">% Ventas</th>
                    <th className="pb-3 text-right">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts?.topProducts.map((item, index) => (
                    <tr key={item.product.id} className="border-b hover:bg-muted/50">
                      <td className="py-3">
                        <div className={`
                          w-8 h-8 rounded-full flex items-center justify-center font-bold
                          ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                            index === 1 ? 'bg-gray-100 text-gray-700' :
                            index === 2 ? 'bg-orange-100 text-orange-700' :
                            'bg-muted text-muted-foreground'}
                        `}>
                          {index + 1}
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="font-medium">{item.product.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.product.category} • {item.product.code}
                        </div>
                      </td>
                      <td className="py-3 text-right font-medium">
                        {item.stats.quantitySold.toLocaleString()}
                      </td>
                      <td className="py-3 text-right font-medium text-green-600">
                        {formatCurrency(item.stats.revenue)}
                      </td>
                      <td className="py-3 text-right">
                        <div className="font-medium">
                          {formatCurrency(item.stats.grossMargin)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatPercentage(item.stats.grossMarginPercentage)}
                        </div>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary"
                              style={{ width: `${item.stats.percentageOfTotalSales}%` }}
                            />
                          </div>
                          <span className="text-sm">
                            {formatPercentage(item.stats.percentageOfTotalSales)}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 text-right">
                        <Badge
                          variant={item.inventory?.needsReorder ? 'destructive' : 'outline'}
                        >
                          {item.inventory?.currentStock} uds
                        </Badge>
                        {item.inventory?.daysOfStock < 30 && (
                          <div className="text-xs text-orange-500 mt-1">
                            ~{item.inventory.daysOfStock} días
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Gráfico */}
        <TabsContent value="chart">
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Por Cantidad Vendida</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={topProducts?.topProducts.slice(0, 10)}
                    layout="vertical"
                    margin={{ left: 120 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis
                      type="category"
                      dataKey="product.name"
                      tick={{ fontSize: 12 }}
                      width={110}
                    />
                    <Tooltip
                      formatter={(value: number) => [value.toLocaleString(), 'Cantidad']}
                    />
                    <Bar dataKey="stats.quantitySold" fill="#10b981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribución de Ingresos</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={topProducts?.topProducts.slice(0, 8)}
                      dataKey="stats.revenue"
                      nameKey="product.name"
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      label={({ name, percent }) =>
                        `${name.substring(0, 15)}... (${(percent * 100).toFixed(0)}%)`
                      }
                      labelLine={false}
                    >
                      {topProducts?.topProducts.slice(0, 8).map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: En Crecimiento */}
        <TabsContent value="trending">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Productos en Crecimiento
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Comparando este mes vs mes anterior
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trending?.map((item, index) => (
                  <div
                    key={item.product.id}
                    className="flex items-center gap-4 p-4 rounded-lg border"
                  >
                    <div className="text-2xl font-bold text-muted-foreground">
                      #{index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{item.product.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.stats.quantitySold} vendidos ({item.trend?.previousQuantity} anterior)
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-green-100 text-green-700 text-lg px-3 py-1">
                        <TrendingUp className="mr-1 h-4 w-4" />
                        +{formatPercentage(item.trend?.quantityGrowth || 0)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: En Declive */}
        <TabsContent value="declining">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-500" />
                Productos en Declive
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Productos que requieren atención
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {declining?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>No hay productos en declive significativo</p>
                  </div>
                ) : (
                  declining?.map((item, index) => (
                    <div
                      key={item.product.id}
                      className="flex items-center gap-4 p-4 rounded-lg border border-red-100 bg-red-50/50"
                    >
                      <div className="text-2xl font-bold text-muted-foreground">
                        #{index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{item.product.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.stats.quantitySold} vendidos ({item.trend?.previousQuantity} anterior)
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="destructive" className="text-lg px-3 py-1">
                          <TrendingDown className="mr-1 h-4 w-4" />
                          {formatPercentage(item.trend?.quantityGrowth || 0)}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

---

## 5. Widget para Dashboard

Para mostrar un resumen en el dashboard principal:

```tsx
// src/features/dashboard/components/TopProductsWidget.tsx
import { Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTopProducts } from '@/features/reports/hooks/useTopProducts';
import { formatCurrency } from '@/lib/utils';

export function TopProductsWidget() {
  const { data } = useTopProducts({ period: 'this_month', limit: 5 });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Award className="h-5 w-5 text-yellow-500" />
          Top 5 Productos del Mes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data?.topProducts.map((item, index) => (
            <div key={item.product.id} className="flex items-center gap-3">
              <div className={`
                w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold
                ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                  index === 1 ? 'bg-gray-100 text-gray-600' :
                  index === 2 ? 'bg-orange-100 text-orange-700' :
                  'bg-muted text-muted-foreground'}
              `}>
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{item.product.name}</p>
                <p className="text-xs text-muted-foreground">
                  {item.stats.quantitySold} vendidos
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-green-600">
                  {formatCurrency(item.stats.revenue)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## 6. Exportación de Datos

### 6.1 Exportar a Excel

```typescript
import * as XLSX from 'xlsx';

export function exportTopProductsToExcel(data: TopProductsResponse) {
  const wb = XLSX.utils.book_new();

  // Hoja 1: Ranking
  const rankingData = data.topProducts.map((item, index) => ({
    'Posición': index + 1,
    'Código': item.product.code,
    'Producto': item.product.name,
    'Categoría': item.product.category,
    'Cantidad Vendida': item.stats.quantitySold,
    'Ingresos': item.stats.revenue,
    'Costo': item.stats.costOfGoodsSold,
    'Margen $': item.stats.grossMargin,
    'Margen %': `${item.stats.grossMarginPercentage.toFixed(1)}%`,
    '% del Total': `${item.stats.percentageOfTotalSales.toFixed(1)}%`,
    'Stock Actual': item.inventory?.currentStock || 0,
    'Días de Stock': item.inventory?.daysOfStock || 'N/A',
  }));

  const ws1 = XLSX.utils.json_to_sheet(rankingData);
  XLSX.utils.book_append_sheet(wb, ws1, 'Ranking');

  // Hoja 2: Resumen
  const summaryData = [
    ['REPORTE DE PRODUCTOS MÁS VENDIDOS'],
    ['Período', data.period.label],
    [''],
    ['RESUMEN'],
    ['Productos vendidos', data.summary.totalProducts],
    ['Unidades totales', data.summary.totalQuantitySold],
    ['Ingresos totales', data.summary.totalRevenue],
    ['Margen total', data.summary.totalMargin],
    ['Margen promedio', `${data.summary.averageMarginPercentage.toFixed(1)}%`],
  ];

  const ws2 = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, ws2, 'Resumen');

  // Descargar
  const fileName = `productos-mas-vendidos-${data.period.label.replace(/\s/g, '-')}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
```

---

## 7. Consideraciones Técnicas

### 7.1 Performance
- Usar índices en columnas de fecha (`saleDate`) y estado (`status`)
- Considerar vistas materializadas para rankings de largo plazo
- Cachear resultados de períodos cerrados (meses anteriores)

### 7.2 Precisión de Datos
- Usar `DECIMAL(12,2)` para montos financieros
- Excluir ventas canceladas del ranking
- Considerar devoluciones en el cálculo

### 7.3 Zona Horaria
- Almacenar fechas en UTC
- Convertir a zona horaria local para visualización
- Respetar inicio/fin de día según zona del negocio

---

## 8. Próximos Pasos

1. ✅ Diseño de endpoints y DTOs
2. ⏳ Implementar service con queries optimizadas
3. ⏳ Crear página de ranking con filtros
4. ⏳ Agregar gráficos de visualización
5. ⏳ Widget para dashboard
6. ⏳ Exportación Excel/PDF
7. ⏳ Análisis individual por producto
8. ⏳ Alertas de productos en declive
9. ⏳ Integración con recomendaciones de compra

---

**Módulo de Productos Más Vendidos - Planificado** 📊

