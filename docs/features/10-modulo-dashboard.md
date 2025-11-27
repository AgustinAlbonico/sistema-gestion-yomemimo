# Módulo: Dashboard

## 1. Descripción y Objetivo

### 1.1 Descripción
El módulo de Dashboard proporciona una vista general del estado del negocio en tiempo real, mostrando los KPIs (Key Performance Indicators) más importantes, alertas, y gráficos de tendencias. Es la página principal del sistema y la primera que ve el usuario al iniciar sesión.

### 1.2 Objetivo
- Mostrar estado general del negocio de un vistazo
- KPIs principales en tiempo real
- Alertas importantes (stock bajo, deudas vencidas)
- Gráficos de tendencias
- Acceso rápido a acciones frecuentes
- Resumen de operaciones del día

### 1.3 Funcionalidades Principales
- Métricas clave del día/mes
- Ventas de hoy
- Estado de caja
- Alertas de stock
- Deudores principales
- Gráfico de ventas (últimos 7/30 días)
- Productos más vendidos
- Accesos rápidos

---

## 2. Estructura del Dashboard

### 2.1 Secciones Principales

#### **A. KPIs Principales (Cards superiores)**
- Ventas del día
- Ventas del mes
- Resultado neto del mes
- Clientes deudores
- Stock en alerta

#### **B. Estado Operativo**
- Estado de caja (abierta/cerrada)
- Último cierre de caja
- Efectivo en caja

#### **C. Alertas y Notificaciones**
- Productos con stock bajo
- Cuentas vencidas
- Gastos pendientes de pago

#### **D. Gráficos y Tendencias**
- Ventas últimos 7 días
- Ventas últimos 30 días
- Comparativa mes actual vs anterior

#### **E. Rankings**
- Top 5 productos más vendidos del mes
- Top 5 clientes del mes

#### **F. Acciones Rápidas**
- Nueva venta
- Registrar gasto
- Registrar compra
- Ver caja

---

## 3. Backend (NestJS)

### 3.1 Service (dashboard.service.ts)

```typescript
@Injectable()
export class DashboardService {
  constructor(
    private salesService: SalesService,
    private inventoryService: InventoryService,
    private accountsService: CustomerAccountsService,
    private cashService: CashRegisterService,
    private expensesService: ExpensesService,
  ) {}

  async getDashboardData() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Mes actual
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Obtener datos en paralelo
    const [
      todaySales,
      monthSales,
      last7DaysSales,
      last30DaysSales,
      inventoryStats,
      accountsStats,
      openCashRegister,
      expensesStats,
    ] = await Promise.all([
      this.salesService.getStats(today, tomorrow),
      this.salesService.getStats(monthStart, monthEnd),
      this.getLast7DaysSales(),
      this.getLast30DaysSales(),
      this.inventoryService.getInventoryStats(),
      this.accountsService.getStats(),
      this.cashService.getOpenRegister(),
      this.expensesService.getStats(monthStart, monthEnd),
    ]);

    // Calcular resultado neto del mes (simple)
    const monthRevenue = monthSales.totalRevenue;
    const monthExpenses = expensesStats.totalAmount;
    const monthNetProfit = monthRevenue - monthExpenses;

    // Estado de caja
    const cashStatus = openCashRegister ? {
      isOpen: true,
      balance: openCashRegister.initialAmount + 
               openCashRegister.totalIncome - 
               openCashRegister.totalExpense,
      openedBy: openCashRegister.openedBy.name,
      openedAt: openCashRegister.openedAt,
    } : {
      isOpen: false,
      balance: 0,
    };

    return {
      kpis: {
        today: {
          sales: todaySales.totalRevenue,
          salesCount: todaySales.totalSales,
          averageTicket: todaySales.averageTicket,
        },
        month: {
          sales: monthSales.totalRevenue,
          salesCount: monthSales.totalSales,
          netProfit: monthNetProfit,
        },
        inventory: {
          totalProducts: inventoryStats.totalProducts,
          productsLowStock: inventoryStats.productsLowStock,
          productsOutOfStock: inventoryStats.productsOutOfStock,
          totalValue: inventoryStats.totalStockValue,
        },
        accounts: {
          totalDebtors: accountsStats.totalDebtors,
          totalDebt: accountsStats.totalDebt,
          overdueAccounts: accountsStats.overdueAccounts,
        }
      },
      cash: cashStatus,
      alerts: {
        lowStock: inventoryStats.lowStockProducts || [],
        overdueAccounts: accountsStats.overdueAccounts > 0,
        cashClosed: !openCashRegister,
      },
      charts: {
        last7Days: last7DaysSales,
        last30Days: last30DaysSales,
      },
      rankings: {
        topProducts: monthSales.topProducts?.slice(0, 5) || [],
      }
    };
  }

  // Ventas últimos 7 días
  private async getLast7DaysSales() {
    const data = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const stats = await this.salesService.getStats(date, nextDay);

      data.push({
        date: date.toISOString().split('T')[0],
        sales: stats.totalRevenue,
        count: stats.totalSales,
      });
    }

    return data;
  }

  // Ventas últimos 30 días
  private async getLast30DaysSales() {
    const data = [];
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const stats = await this.salesService.getStats(date, nextDay);

      data.push({
        date: date.toISOString().split('T')[0],
        sales: stats.totalRevenue,
        count: stats.totalSales,
      });
    }

    return data;
  }

  // Widget de actividad reciente
  async getRecentActivity() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const recentSales = await this.salesService.findAll({
      startDate: today,
      status: SaleStatus.COMPLETED,
    } as any);

    return {
      recentSales: recentSales.slice(0, 5).map(sale => ({
        id: sale.id,
        number: sale.saleNumber,
        amount: sale.total,
        customer: sale.customerName || sale.customer?.firstName,
        time: sale.createdAt,
      }))
    };
  }
}
```

### 3.2 Controller (dashboard.controller.ts)

```typescript
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  getDashboardData() {
    return this.dashboardService.getDashboardData();
  }

  @Get('activity')
  getRecentActivity() {
    return this.dashboardService.getRecentActivity();
  }
}
```

---

## 4. Frontend (React)

### 4.1 Página Principal: DashboardPage.tsx

```tsx
import React from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useDashboard } from '../hooks/useDashboard';
import { formatCurrency } from '@/lib/utils';
import { 
  LineChart, 
  Line, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

export function DashboardPage() {
  const { data: dashboard, isLoading } = useDashboard();

  if (isLoading) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            {new Date().toLocaleDateString('es-AR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        <div className="flex gap-2">
          <Button onClick={() => navigate('/pos')}>Nueva Venta</Button>
          <Button variant="outline" onClick={() => navigate('/expenses/new')}>
            Registrar Gasto
          </Button>
        </div>
      </div>

      {/* Alertas */}
      {(dashboard.alerts.lowStock.length > 0 || 
        dashboard.alerts.overdueAccounts || 
        dashboard.alerts.cashClosed) && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              Alertas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {dashboard.alerts.cashClosed && (
              <div className="flex items-center justify-between">
                <span>⚠️ No hay caja abierta</span>
                <Button size="sm" onClick={() => navigate('/cash-register')}>
                  Abrir Caja
                </Button>
              </div>
            )}
            {dashboard.alerts.lowStock.length > 0 && (
              <div className="flex items-center justify-between">
                <span>📦 {dashboard.alerts.lowStock.length} productos con stock bajo</span>
                <Button size="sm" variant="ghost" onClick={() => navigate('/inventory')}>
                  Ver
                </Button>
              </div>
            )}
            {dashboard.alerts.overdueAccounts && (
              <div className="flex items-center justify-between">
                <span>💳 Hay clientes con cuentas vencidas</span>
                <Button size="sm" variant="ghost" onClick={() => navigate('/accounts')}>
                  Ver
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* KPIs del Día */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ventas Hoy</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(dashboard.kpis.today.sales)}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboard.kpis.today.salesCount} ventas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ventas Mes</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(dashboard.kpis.month.sales)}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboard.kpis.month.salesCount} ventas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Resultado Mes</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              dashboard.kpis.month.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatCurrency(dashboard.kpis.month.netProfit)}
            </div>
            <p className="text-xs text-muted-foreground">
              Ganancia neta
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Deudores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboard.kpis.accounts.totalDebtors}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(dashboard.kpis.accounts.totalDebt)} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Inventario</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(dashboard.kpis.inventory.totalValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboard.kpis.inventory.productsLowStock} en alerta
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Estado de Caja */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {dashboard.cash.isOpen ? (
              <>
                <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse" />
                Caja Abierta
              </>
            ) : (
              <>
                <Clock className="h-5 w-5 text-gray-400" />
                Caja Cerrada
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dashboard.cash.isOpen ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold">
                  {formatCurrency(dashboard.cash.balance)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Abierta por {dashboard.cash.openedBy} a las{' '}
                  {new Date(dashboard.cash.openedAt).toLocaleTimeString('es-AR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <Button onClick={() => navigate('/cash-register')}>
                Ver Caja
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground">
                Debe abrir caja para comenzar a operar
              </p>
              <Button onClick={() => navigate('/cash-register')}>
                Abrir Caja
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gráficos */}
      <div className="grid grid-cols-2 gap-6">
        {/* Ventas Últimos 7 Días */}
        <Card>
          <CardHeader>
            <CardTitle>Ventas Últimos 7 Días</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={dashboard.charts.last7Days}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString('es-AR', { 
                    day: '2-digit', 
                    month: '2-digit' 
                  })}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value) => formatCurrency(value)}
                  labelFormatter={(date) => new Date(date).toLocaleDateString('es-AR')}
                />
                <Line 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Ventas Últimos 30 Días */}
        <Card>
          <CardHeader>
            <CardTitle>Ventas Últimos 30 Días</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dashboard.charts.last30Days}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).getDate()}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value) => formatCurrency(value)}
                  labelFormatter={(date) => new Date(date).toLocaleDateString('es-AR')}
                />
                <Bar dataKey="sales" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Productos */}
      <Card>
        <CardHeader>
          <CardTitle>Top 5 Productos del Mes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dashboard.rankings.topProducts.map((item, index) => (
              <div key={item.product.id} className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{item.product.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.quantitySold} unidades vendidas
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatCurrency(item.revenue)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 4.2 Hook: useDashboard.ts

```typescript
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboard.api';

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardApi.getData(),
    refetchInterval: 30000, // Refrescar cada 30 segundos
  });
}

export function useRecentActivity() {
  return useQuery({
    queryKey: ['dashboard-activity'],
    queryFn: () => dashboardApi.getActivity(),
    refetchInterval: 15000, // Refrescar cada 15 segundos
  });
}
```

---

## 5. Características Destacadas

### 5.1 Auto-refresh

El dashboard se actualiza automáticamente cada 30 segundos para mostrar datos en tiempo real sin necesidad de recargar la página.

### 5.2 Alertas Inteligentes

- Stock bajo: Alerta cuando productos llegan al mínimo
- Caja cerrada: Recordatorio para abrir caja
- Deudas vencidas: Notificación de cuentas en mora

### 5.3 Accesos Rápidos

Botones de acceso directo a las acciones más frecuentes:
- Nueva venta
- Registrar gasto
- Registrar compra
- Abrir/Ver caja

### 5.4 Responsive

El dashboard es completamente responsive y se adapta a tablets y dispositivos móviles.

---

## 6. Próximos Pasos

1. ✅ KPIs principales
2. ✅ Gráficos de tendencias
3. ✅ Alertas y notificaciones
4. ⏳ Widgets personalizables
5. ⏳ Notificaciones push
6. ⏳ Comparativas con objetivos
7. ⏳ Dashboard por rol (administrador vs vendedor)
8. ⏳ Exportar dashboard a PDF

---

**Módulo de Dashboard completo - Vista principal del sistema** ✅
