/**
 * Página principal del Dashboard
 * Muestra información del usuario y resumen de actividad
 */
import { useAuthStore } from '../stores/auth.store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { UserCircle, Activity, AlertTriangle, Package } from 'lucide-react';
import { useLowStockProducts } from '@/features/products/hooks/useLowStock';
import { Link } from 'react-router-dom';
import { formatCurrency } from '@/lib/utils';

export function DashboardPage() {
    const user = useAuthStore((state) => state.user);
    const { data: lowStockProducts, isLoading: loadingLowStock } = useLowStockProducts();

    // Separar productos sin stock de los que tienen stock bajo
    const outOfStock = lowStockProducts?.filter(p => p.stock === 0) ?? [];
    const lowStock = lowStockProducts?.filter(p => p.stock > 0) ?? [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-foreground">
                    ¡Hola, {user?.firstName}!
                </h1>
                <p className="text-muted-foreground mt-1">
                    Bienvenido al sistema de gestión
                </p>
            </div>

            {/* Cards Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Perfil */}
                <Card>
                    <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-4">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <UserCircle className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-base">Perfil de Usuario</CardTitle>
                            <CardDescription>Tu información de cuenta</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-border last:border-0">
                            <span className="text-sm text-muted-foreground">Nombre</span>
                            <span className="text-sm font-medium text-foreground">
                                {user?.firstName} {user?.lastName}
                            </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-border last:border-0">
                            <span className="text-sm text-muted-foreground">Email</span>
                            <span className="text-sm font-medium text-foreground">{user?.email}</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                            <span className="text-sm text-muted-foreground">Estado</span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                Activo
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {/* Estadísticas */}
                <Card>
                    <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-4">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Activity className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-base">Actividad</CardTitle>
                            <CardDescription>Resumen de tu cuenta</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-border">
                            <span className="text-sm text-muted-foreground">Último acceso</span>
                            <span className="text-sm font-medium text-foreground">
                                {user?.lastLogin
                                    ? new Date(user.lastLogin).toLocaleDateString('es-AR')
                                    : 'Primer acceso'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                            <span className="text-sm text-muted-foreground">Cuenta creada</span>
                            <span className="text-sm font-medium text-foreground">
                                {user?.createdAt
                                    ? new Date(user.createdAt).toLocaleDateString('es-AR')
                                    : '-'}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {/* Alertas de Stock */}
                <Card className={lowStockProducts && lowStockProducts.length > 0 ? 'border-yellow-500/50' : ''}>
                    <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-4">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                            outOfStock.length > 0 
                                ? 'bg-destructive/10' 
                                : lowStock.length > 0 
                                    ? 'bg-yellow-500/10' 
                                    : 'bg-emerald-500/10'
                        }`}>
                            {lowStockProducts && lowStockProducts.length > 0 ? (
                                <AlertTriangle className={`h-5 w-5 ${
                                    outOfStock.length > 0 ? 'text-destructive' : 'text-yellow-600'
                                }`} />
                            ) : (
                                <Package className="h-5 w-5 text-emerald-600" />
                            )}
                        </div>
                        <div>
                            <CardTitle className="text-base">Stock de Productos</CardTitle>
                            <CardDescription>
                                {loadingLowStock 
                                    ? 'Cargando...' 
                                    : lowStockProducts && lowStockProducts.length > 0
                                        ? `${lowStockProducts.length} producto(s) requieren atención`
                                        : 'Todo en orden'
                                }
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {loadingLowStock ? (
                            <p className="text-sm text-muted-foreground">Verificando inventario...</p>
                        ) : lowStockProducts && lowStockProducts.length > 0 ? (
                            <>
                                {/* Productos sin stock (crítico) */}
                                {outOfStock.length > 0 && (
                                    <div className="rounded-lg bg-destructive/10 p-3 border border-destructive/20">
                                        <p className="text-sm font-medium text-destructive mb-2">
                                            Sin Stock ({outOfStock.length})
                                        </p>
                                        <ul className="space-y-1">
                                            {outOfStock.slice(0, 3).map(product => (
                                                <li key={product.id} className="text-sm text-destructive/80 flex justify-between">
                                                    <span className="truncate">{product.name}</span>
                                                    <span className="font-medium ml-2">0 uds</span>
                                                </li>
                                            ))}
                                            {outOfStock.length > 3 && (
                                                <li className="text-xs text-destructive/60">
                                                    y {outOfStock.length - 3} más...
                                                </li>
                                            )}
                                        </ul>
                                    </div>
                                )}
                                
                                {/* Productos con stock bajo */}
                                {lowStock.length > 0 && (
                                    <div className="rounded-lg bg-yellow-500/10 p-3 border border-yellow-500/20">
                                        <p className="text-sm font-medium text-yellow-700 dark:text-yellow-500 mb-2">
                                            Stock Bajo ({lowStock.length})
                                        </p>
                                        <ul className="space-y-1">
                                            {lowStock.slice(0, 3).map(product => (
                                                <li key={product.id} className="text-sm text-yellow-700/80 dark:text-yellow-500/80 flex justify-between">
                                                    <span className="truncate">{product.name}</span>
                                                    <span className="font-medium ml-2">{product.stock}/{product.minStock} uds</span>
                                                </li>
                                            ))}
                                            {lowStock.length > 3 && (
                                                <li className="text-xs text-yellow-600/60 dark:text-yellow-500/60">
                                                    y {lowStock.length - 3} más...
                                                </li>
                                            )}
                                        </ul>
                                    </div>
                                )}

                                <Link 
                                    to="/products" 
                                    className="block text-sm text-primary hover:underline text-center pt-2"
                                >
                                    Ver todos los productos →
                                </Link>
                            </>
                        ) : (
                            <div className="text-center py-2">
                                <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                                    ✓ Todos los productos tienen stock suficiente
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
