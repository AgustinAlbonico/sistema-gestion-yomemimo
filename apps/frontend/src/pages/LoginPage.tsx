import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore } from '../stores/auth.store';
import { authService } from '../services/auth.service';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
} from '../components/ui/card';
import { Loader2, Eye, EyeOff, User, Lock } from 'lucide-react';
// Importar imagen correctamente para Vite
import logoNexopos from '../assets/logo-nexopos.png';

const loginSchema = z.object({
    username: z.string().min(1, 'El nombre de usuario es requerido'),
    password: z.string().min(1, 'La contraseña es requerida'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginPage() {
    const navigate = useNavigate();
    const setAuth = useAuthStore((state) => state.setAuth);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormData) => {
        setIsLoading(true);
        try {
            const response = await authService.login(data);
            setAuth(response);
            toast.success(`Bienvenido, ${response.user.firstName}`);
            navigate('/dashboard');
        } catch (error: any) {
            console.error(error);
            const message =
                error.response?.data?.message || 'Error al iniciar sesión';
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
            {/* Fondo con patrón sutil */}
            <div className="fixed inset-0 -z-10 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20" />

            {/* Círculos decorativos sutiles */}
            <div className="fixed inset-0 -z-10 overflow-hidden">
                <div className="absolute -top-32 -right-32 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl" />
            </div>

            <div className="w-full max-w-md">
                <Card className="shadow-2xl border-border/50 backdrop-blur-sm">
                    <CardHeader className="space-y-6 pb-2 pt-8">
                        {/* Logo */}
                        <div className="flex justify-center">
                            <img
                                src={logoNexopos}
                                alt="NexoPOS"
                                className="h-24 w-auto"
                            />
                        </div>

                        {/* Texto de bienvenida */}
                        <div className="text-center space-y-1">
                            <h1 className="text-2xl font-bold text-foreground">
                                Bienvenido
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Ingresa tus credenciales para acceder
                            </p>
                        </div>
                    </CardHeader>

                    <form onSubmit={handleSubmit(onSubmit)}>
                        <CardContent className="space-y-5 pt-4">
                            {/* Campo Usuario */}
                            <div className="space-y-2">
                                <label
                                    htmlFor="username"
                                    className="text-sm font-medium text-foreground flex items-center gap-2"
                                >
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    Usuario
                                </label>
                                <Input
                                    id="username"
                                    placeholder="nombre.usuario"
                                    {...register('username')}
                                    disabled={isLoading}
                                    className="h-11"
                                />
                                {errors.username && (
                                    <p className="text-sm text-destructive">
                                        {errors.username.message}
                                    </p>
                                )}
                            </div>

                            {/* Campo Contraseña */}
                            <div className="space-y-2">
                                <label
                                    htmlFor="password"
                                    className="text-sm font-medium text-foreground flex items-center gap-2"
                                >
                                    <Lock className="h-4 w-4 text-muted-foreground" />
                                    Contraseña
                                </label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        {...register('password')}
                                        disabled={isLoading}
                                        className="h-11 pr-11"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-5 w-5" />
                                        ) : (
                                            <Eye className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="text-sm text-destructive">
                                        {errors.password.message}
                                    </p>
                                )}
                            </div>
                        </CardContent>

                        <CardFooter className="flex-col gap-4 pt-2 pb-8">
                            <Button
                                className="w-full h-11 text-base font-medium shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200"
                                type="submit"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Ingresando...
                                    </>
                                ) : (
                                    'Ingresar'
                                )}
                            </Button>

                            <p className="text-xs text-muted-foreground text-center">
                                © {new Date().getFullYear()} NexoPOS
                            </p>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
}
