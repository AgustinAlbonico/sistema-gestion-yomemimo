import { useAuthStore } from '../stores/auth.store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

export function DashboardPage() {
    const user = useAuthStore((state) => state.user);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Homepage</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Bienvenido al sistema de gestión
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle>Perfil de Usuario</CardTitle>
                        <CardDescription>Información de tu cuenta</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Nombre completo</p>
                            <p className="text-base font-semibold">
                                {user?.firstName} {user?.lastName}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Email</p>
                            <p className="text-base font-semibold">{user?.email}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Estado</p>
                            <p className="text-base font-semibold">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Activo
                                </span>
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Estadísticas</CardTitle>
                        <CardDescription>Resumen de actividad</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Último acceso</span>
                                <span className="text-sm font-medium">
                                    {user?.lastLogin
                                        ? new Date(user.lastLogin).toLocaleDateString('es-AR')
                                        : 'Primer acceso'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Cuenta creada</span>
                                <span className="text-sm font-medium">
                                    {user?.createdAt
                                        ? new Date(user.createdAt).toLocaleDateString('es-AR')
                                        : '-'}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Próximamente</CardTitle>
                        <CardDescription>Funcionalidades en desarrollo</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-600">
                            Este dashboard se expandirá con más funcionalidades según los módulos que se vayan agregando al sistema.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
