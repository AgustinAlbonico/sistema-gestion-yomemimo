import { useEffect, useState } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { authService } from '../services/auth.service';
import { useAuthStore } from '../stores/auth.store';
import { Sidebar } from './Sidebar';

export function DashboardLayout() {
    const navigate = useNavigate();
    const { user, setUser, logout } = useAuthStore();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    // Obtener perfil del usuario al montar el componente
    const { data: profile } = useQuery({
        queryKey: ['profile'],
        queryFn: authService.getProfile,
        retry: false,
    });

    useEffect(() => {
        if (profile) {
            setUser(profile);
        }
    }, [profile, setUser]);

    const handleLogout = async () => {
        try {
            await authService.logout();
            logout();
            toast.success('Sesión cerrada correctamente');
            navigate('/login', { replace: true });
        } catch (error) {
            // Incluso si falla en el servidor, cerramos sesión localmente
            logout();
            navigate('/login', { replace: true });
        }
    };

    const toggleSidebar = () => {
        setSidebarCollapsed(!sidebarCollapsed);
    };

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            {/* Sidebar */}
            <Sidebar
                user={user}
                onLogout={handleLogout}
                collapsed={sidebarCollapsed}
                onToggle={toggleSidebar}
            />

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <main className="flex-1 overflow-y-auto p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
