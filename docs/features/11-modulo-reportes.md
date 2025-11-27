# Módulo: Reportes

## 1. Descripción y Objetivo

### 1.1 Descripción
El módulo de Reportes proporciona análisis financieros y operativos del negocio, generando reportes de ventas, compras, gastos, inventario y rentabilidad. Permite tomar decisiones basadas en datos con visualizaciones claras y exportación de información.

### 1.2 Objetivo
- Generar reportes financieros por período
- Calcular resultado neto (ganancias/pérdidas)
- Analizar productos más vendidos
- Evaluar desempeño de ventas
- Controlar gastos operativos
- Análisis de inventario y rotación
- Exportar reportes a Excel/PDF

### 1.3 Funcionalidades Principales
- Reporte de ventas por período
- Reporte de compras y costos
- Reporte de gastos operativos
- Cálculo de resultado neto
- Top productos más vendidos
- Análisis de clientes frecuentes
- Reportes de inventario
- Análisis de cuentas corrientes
- Exportación a Excel/PDF

---

## 2. Tipos de Reportes

### 2.1 Reporte Financiero General

**Contenido**:
- Ingresos por ventas
- Costos de mercadería vendida
- Margen bruto
- Gastos operativos
- Resultado neto
- Análisis por período

### 2.2 Reporte de Ventas

**Contenido**:
- Total de ventas por período
- Cantidad de transacciones
- Ticket promedio
- Ventas por método de pago
- Ventas por vendedor
- Comparativa con períodos anteriores

### 2.3 Reporte de Productos

**Contenido**:
- Top 10 productos más vendidos
- Productos con baja rotación
- Margen de ganancia por producto
- Stock valorizado
- Productos en alerta de stock

### 2.4 Reporte de Clientes

**Contenido**:
- Top clientes por volumen de compra
- Clientes nuevos vs recurrentes
- Análisis de cuentas corrientes
- Deudores principales

### 2.5 Reporte de Gastos

**Contenido**:
- Gastos totales por período
- Gastos por categoría
- Comparativa mensual
- Gastos recurrentes

---

## 3. Backend (NestJS)

### 3.1 Service (reports.service.ts)

```typescript
@Injectable()
export class ReportsService {
  constructor(
    private salesService: SalesService,
    private purchasesService: PurchasesService,
    private expensesService: ExpensesService,
    private inventoryService: InventoryService,
    private accountsService: CustomerAccountsService,
  ) {}

  // ============================================
  // REPORTE FINANCIERO GENERAL
  // ============================================

  async getFinancialReport(startDate: Date, endDate: Date) {
    // 1. INGRESOS (Ventas)
    const salesStats = await this.salesService.getStats(startDate, endDate);
    const totalRevenue = salesStats.totalRevenue;

    // 2. COSTOS (Compras de mercadería)
    const purchasesStats = await this.purchasesService.getStats(startDate, endDate);
    const costOfGoodsSold = purchasesStats.totalPaid;

    // 3. GASTOS OPERATIVOS
    const expensesStats = await this.expensesService.getStats(startDate, endDate);
    const operatingExpenses = expensesStats.totalAmount;

    // 4. CÁLCULOS
    const grossProfit = totalRevenue - costOfGoodsSold;
    const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const netProfit = grossProfit - operatingExpenses;
    const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return {
      period: { startDate, endDate },
      revenue: {
        totalRevenue,
        totalSales: salesStats.totalSales,
        averageTicket: salesStats.averageTicket,
      },
      costs: {
        costOfGoodsSold,
        totalPurchases: purchasesStats.totalPurchases,
      },
      expenses: {
        operatingExpenses,
        totalExpenses: expensesStats.totalExpenses,
        byCategory: expensesStats.byCategory,
      },
      profitability: {
        grossProfit,
        grossMargin,
        netProfit,
        netMargin,
      },
      summary: {
        totalRevenue,
        totalCosts: costOfGoodsSold + operatingExpenses,
        netProfit,
      }
    };
  }

  // ============================================
  // REPORTE DE VENTAS DETALLADO
  // ============================================

  async getSalesReport(startDate: Date, endDate: Date) {
    const stats = await this.salesService.getStats(startDate, endDate);

    // Comparar con período anterior
    const periodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const previousStart = new Date(startDate);
    previousStart.setDate(previousStart.getDate() - periodDays);
    const previousEnd = new Date(startDate);
    previousEnd.setDate(previousEnd.getDate() - 1);

    const previousStats = await this.salesService.getStats(previousStart, previousEnd);

    const revenueGrowth = previousStats.totalRevenue > 0
      ? ((stats.totalRevenue - previousStats.totalRevenue) / previousStats.totalRevenue) * 100
      : 0;

    return {
      period: { startDate, endDate },
      current: stats,
      previous: {
        period: { startDate: previousStart, endDate: previousEnd },
        stats: previousStats,
      },
      growth: {
        revenueGrowth,
        salesGrowth: previousStats.totalSales > 0
          ? ((stats.totalSales - previousStats.totalSales) / previousStats.totalSales) * 100
          : 0,
      }
    };
  }

  // ============================================
  // REPORTE DE PRODUCTOS
  // ============================================

  async getProductsReport(startDate: Date, endDate: Date) {
    const salesStats = await this.salesService.getStats(startDate, endDate);
    const inventoryStats = await this.inventoryService.getInventoryStats();

    return {
      period: { startDate, endDate },
      topProducts: salesStats.topProducts,
      inventory: {
        totalProducts: inventoryStats.totalProducts,
        productsWithStock: inventoryStats.productsWithStock,
        productsOutOfStock: inventoryStats.productsOutOfStock,
        productsLowStock: inventoryStats.productsLowStock,
        totalStockValue: inventoryStats.totalStockValue,
        lowStockProducts: inventoryStats.lowStockProducts,
      }
    };
  }

  // ============================================
  // REPORTE DE CLIENTES
  // ============================================

  async getCustomersReport(startDate: Date, endDate: Date) {
    // Top clientes por volumen de compra
    const sales = await this.salesService.findAll({
      startDate,
      endDate,
      status: SaleStatus.COMPLETED
    } as any);

    const customerPurchases = {};
    sales.forEach(sale => {
      if (sale.customer) {
        const customerId = sale.customer.id;
        if (!customerPurchases[customerId]) {
          customerPurchases[customerId] = {
            customer: sale.customer,
            totalPurchases: 0,
            totalAmount: 0,
            salesCount: 0,
          };
        }
        customerPurchases[customerId].totalAmount += Number(sale.total);
        customerPurchases[customerId].salesCount++;
      }
    });

    const topCustomers = Object.values(customerPurchases)
      .sort((a: any, b: any) => b.totalAmount - a.totalAmount)
      .slice(0, 10);

    // Cuentas corrientes
    const accountsStats = await this.accountsService.getStats();

    return {
      period: { startDate, endDate },
      topCustomers,
      accounts: accountsStats,
    };
  }

  // ============================================
  // REPORTE DE GASTOS
  // ============================================

  async getExpensesReport(startDate: Date, endDate: Date) {
    const stats = await this.expensesService.getStats(startDate, endDate);

    // Comparar con mes anterior
    const previousStart = new Date(startDate);
    previousStart.setMonth(previousStart.getMonth() - 1);
    const previousEnd = new Date(endDate);
    previousEnd.setMonth(previousEnd.getMonth() - 1);

    const previousStats = await this.expensesService.getStats(previousStart, previousEnd);

    const expensesGrowth = previousStats.totalAmount > 0
      ? ((stats.totalAmount - previousStats.totalAmount) / previousStats.totalAmount) * 100
      : 0;

    return {
      period: { startDate, endDate },
      current: stats,
      previous: {
        period: { startDate: previousStart, endDate: previousEnd },
        stats: previousStats,
      },
      growth: {
        expensesGrowth,
      }
    };
  }

  // ============================================
  // REPORTE DE CAJA
  // ============================================

  async getCashReport(startDate: Date, endDate: Date) {
    // Este método se implementa cuando tengamos el módulo de caja
    // Por ahora retornamos estructura básica
    return {
      period: { startDate, endDate },
      cashFlow: {
        totalIncome: 0,
        totalExpense: 0,
        netCashFlow: 0,
      }
    };
  }

  // ============================================
  // DASHBOARD RESUMIDO
  // ============================================

  async getDashboardSummary() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Ventas de hoy
    const todaySales = await this.salesService.getStats(today, tomorrow);

    // Ventas del mes
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const monthSales = await this.salesService.getStats(monthStart, monthEnd);

    // Inventario
    const inventoryStats = await this.inventoryService.getInventoryStats();

    // Cuentas corrientes
    const accountsStats = await this.accountsService.getStats();

    return {
      today: {
        sales: todaySales,
        date: today,
      },
      month: {
        sales: monthSales,
        period: { start: monthStart, end: monthEnd },
      },
      inventory: inventoryStats,
      accounts: accountsStats,
    };
  }
}
```

### 3.2 Controller (reports.controller.ts)

```typescript
@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('financial')
  getFinancialReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    return this.reportsService.getFinancialReport(
      new Date(startDate),
      new Date(endDate)
    );
  }

  @Get('sales')
  getSalesReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    return this.reportsService.getSalesReport(
      new Date(startDate),
      new Date(endDate)
    );
  }

  @Get('products')
  getProductsReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    return this.reportsService.getProductsReport(
      new Date(startDate),
      new Date(endDate)
    );
  }

  @Get('customers')
  getCustomersReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    return this.reportsService.getCustomersReport(
      new Date(startDate),
      new Date(endDate)
    );
  }

  @Get('expenses')
  getExpensesReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    return this.reportsService.getExpensesReport(
      new Date(startDate),
      new Date(endDate)
    );
  }

  @Get('dashboard')
  getDashboardSummary() {
    return this.reportsService.getDashboardSummary();
  }
}
```

---

## 4. Frontend (React)

### 4.1 Página de Reportes: ReportsPage.tsx

```tsx
export function ReportsPage() {
  const [period, setPeriod] = useState({
    startDate: startOfMonth(new Date()),
    endDate: endOfMonth(new Date())
  });

  const { data: financialReport } = useFinancialReport(
    period.startDate,
    period.endDate
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Reportes</h1>
        
        <DateRangePicker
          value={period}
          onChange={setPeriod}
        />
      </div>

      {/* Resumen Financiero */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(financialReport?.revenue.totalRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {financialReport?.revenue.totalSales || 0} ventas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Costos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(financialReport?.costs.costOfGoodsSold || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {financialReport?.costs.totalPurchases || 0} compras
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Gastos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(financialReport?.expenses.operatingExpenses || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {financialReport?.expenses.totalExpenses || 0} gastos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Resultado Neto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              (financialReport?.profitability.netProfit || 0) >= 0
                ? 'text-green-600'
                : 'text-red-600'
            }`}>
              {formatCurrency(financialReport?.profitability.netProfit || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Margen: {financialReport?.profitability.netMargin.toFixed(1) || 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-2 gap-6">
        {/* Gráfico de Ventas por Método de Pago */}
        <Card>
          <CardHeader>
            <CardTitle>Ventas por Método de Pago</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paymentMethodData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Gastos por Categoría */}
        <Card>
          <CardHeader>
            <CardTitle>Gastos por Categoría</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={expensesByCategory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="amount" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Productos */}
      <Card>
        <CardHeader>
          <CardTitle>Top 10 Productos Más Vendidos</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Producto</th>
                <th className="text-right py-2">Cantidad Vendida</th>
                <th className="text-right py-2">Ingresos</th>
              </tr>
            </thead>
            <tbody>
              {financialReport?.topProducts?.map((item) => (
                <tr key={item.product.id} className="border-b">
                  <td className="py-2">{item.product.name}</td>
                  <td className="text-right">{item.quantitySold}</td>
                  <td className="text-right">{formatCurrency(item.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Botones de Exportación */}
      <div className="flex gap-2">
        <Button onClick={exportToExcel}>
          <Download className="mr-2 h-4 w-4" />
          Exportar a Excel
        </Button>
        <Button variant="outline" onClick={exportToPDF}>
          <FileText className="mr-2 h-4 w-4" />
          Exportar a PDF
        </Button>
      </div>
    </div>
  );
}
```

---

## 5. Exportación de Reportes

### 5.1 Exportar a Excel

```typescript
import * as XLSX from 'xlsx';

export const exportFinancialReportToExcel = (report: any) => {
  // Crear workbook
  const wb = XLSX.utils.book_new();

  // Hoja 1: Resumen Financiero
  const summaryData = [
    ['REPORTE FINANCIERO'],
    ['Período', `${formatDate(report.period.startDate)} - ${formatDate(report.period.endDate)}`],
    [],
    ['INGRESOS'],
    ['Total Ventas', report.revenue.totalRevenue],
    ['Cantidad de Ventas', report.revenue.totalSales],
    ['Ticket Promedio', report.revenue.averageTicket],
    [],
    ['COSTOS'],
    ['Costo de Mercadería Vendida', report.costs.costOfGoodsSold],
    ['Total Compras', report.costs.totalPurchases],
    [],
    ['GASTOS OPERATIVOS'],
    ['Total Gastos', report.expenses.operatingExpenses],
    [],
    ['RENTABILIDAD'],
    ['Ganancia Bruta', report.profitability.grossProfit],
    ['Margen Bruto %', report.profitability.grossMargin],
    ['Ganancia Neta', report.profitability.netProfit],
    ['Margen Neto %', report.profitability.netMargin],
  ];

  const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, ws1, 'Resumen');

  // Hoja 2: Gastos por Categoría
  const expensesData = [
    ['Categoría', 'Cantidad', 'Total'],
    ...report.expenses.byCategory.map(cat => [
      cat.categoryName,
      cat.count,
      cat.total
    ])
  ];

  const ws2 = XLSX.utils.aoa_to_sheet(expensesData);
  XLSX.utils.book_append_sheet(wb, ws2, 'Gastos');

  // Descargar archivo
  XLSX.writeFile(wb, `reporte-financiero-${Date.now()}.xlsx`);
};
```

### 5.2 Exportar a PDF

```typescript
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const exportFinancialReportToPDF = (report: any) => {
  const doc = new jsPDF();

  // Título
  doc.setFontSize(18);
  doc.text('REPORTE FINANCIERO', 14, 20);

  // Período
  doc.setFontSize(12);
  doc.text(
    `Período: ${formatDate(report.period.startDate)} - ${formatDate(report.period.endDate)}`,
    14,
    30
  );

  // Resumen
  doc.autoTable({
    startY: 40,
    head: [['Concepto', 'Valor']],
    body: [
      ['Ingresos', formatCurrency(report.revenue.totalRevenue)],
      ['Costos', formatCurrency(report.costs.costOfGoodsSold)],
      ['Gastos', formatCurrency(report.expenses.operatingExpenses)],
      ['Resultado Neto', formatCurrency(report.profitability.netProfit)],
    ],
  });

  // Descargar
  doc.save(`reporte-financiero-${Date.now()}.pdf`);
};
```

---

## 6. Análisis Clave

### 6.1 Métricas de Rentabilidad

```typescript
// Margen Bruto
grossMargin = (totalRevenue - costOfGoodsSold) / totalRevenue * 100

// Margen Neto
netMargin = (totalRevenue - costOfGoodsSold - operatingExpenses) / totalRevenue * 100

// ROI (Return on Investment)
roi = (netProfit / totalCosts) * 100
```

### 6.2 Análisis de Tendencias

- Comparar mes actual vs mes anterior
- Identificar productos con crecimiento/caída
- Detectar estacionalidad en ventas
- Analizar eficiencia de gastos

---

## 7. Próximos Pasos

1. ✅ Reportes financieros básicos
2. ✅ Exportación a Excel
3. ⏳ Exportación a PDF avanzada
4. ⏳ Gráficos interactivos
5. ⏳ Reportes programados (envío automático)
6. ⏳ Análisis predictivo
7. ⏳ Comparativas multi-período
8. ⏳ Reportes personalizados

---

**Módulo de Reportes completo** ✅
