/**
 * Tests unitarios para DashboardPage
 * Cubre: fetching de datos, cálculo de KPIs, manejo de loading states
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardPage } from './DashboardPage';

// Mock de react-router-dom
vi.mock('react-router-dom', () => ({
    useNavigate: vi.fn(() => vi.fn()),
    Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
        <a href={to}>{children}</a>
    ),
}));

// Mock de las APIs
vi.mock('@/features/sales/api', () => ({
    salesApi: {
        getStats: vi.fn(() => Promise.resolve({
            totalSales: 100000,
            totalAmount: 1500000,
            todaySales: 50,
            todayAmount: 750000,
        })),
    },
}));

vi.mock('@/features/products/api', () => ({
    productsApi: {
        getStats: vi.fn(() => Promise.resolve({
            totalProducts: 500,
            lowStockProducts: 15,
            totalStock: 10000,
        })),
    },
}));

vi.mock('@/modules/cash-register/api', () => ({
    cashRegisterApi: {
        getOpenRegister: vi.fn(() => Promise.resolve({
            id: 'cash-123',
            openingDate: new Date(),
            initialAmount: 50000,
            currentAmount: 125000,
        })),
    },
}));

// Wrapper con QueryClient
function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });

    return function Wrapper({ children }: { children: React.ReactNode }) {
        return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    };
}

describe('DashboardPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('renderizado inicial', () => {
        it('debe mostrar indicador de carga mientras carga los datos', () => {
            const wrapper = createWrapper();
            render(<DashboardPage />, { wrapper });

            expect(screen.getByText(/cargando/i)).toBeInTheDocument();
        });

        it('debe renderizar el título del dashboard', async () => {
            const wrapper = createWrapper();
            render(<DashboardPage />, { wrapper });

            await waitFor(() => {
                expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
            });
        });
    });

    describe('métricas de ventas', () => {
        it('debe mostrar las métricas de ventas cuando cargan', async () => {
            const wrapper = createWrapper();
            render(<DashboardPage />, { wrapper });

            await waitFor(() => {
                expect(screen.getByText(/ventas/i)).toBeInTheDocument();
            });
        });

        it('debe mostrar el monto total de ventas formateado', async () => {
            const wrapper = createWrapper();
            render(<DashboardPage />, { wrapper });

            await waitFor(() => {
                expect(screen.getByText(/1\.500\.000/i)).toBeInTheDocument();
            });
        });
    });

    describe('métricas de productos', () => {
        it('debe mostrar alerta de stock bajo cuando hay productos con poco stock', async () => {
            const wrapper = createWrapper();
            render(<DashboardPage />, { wrapper });

            await waitFor(() => {
                expect(screen.getByText(/stock bajo/i)).toBeInTheDocument();
            });
        });

        it('debe mostrar el total de productos', async () => {
            const wrapper = createWrapper();
            render(<DashboardPage />, { wrapper });

            await waitFor(() => {
                expect(screen.getByText(/500/i)).toBeInTheDocument();
            });
        });
    });

    describe('estado de caja', () => {
        it('debe mostrar el monto actual de la caja abierta', async () => {
            const wrapper = createWrapper();
            render(<DashboardPage />, { wrapper });

            await waitFor(() => {
                expect(screen.getByText(/125\.000/i)).toBeInTheDocument();
            });
        });

        it('debe mostrar alerta si no hay caja abierta', async () => {
            const { cashRegisterApi } = require('@/modules/cash-register/api');
            cashRegisterApi.getOpenRegister.mockResolvedValueOnce(null);

            const wrapper = createWrapper();
            render(<DashboardPage />, { wrapper });

            await waitFor(() => {
                expect(screen.getByText(/caja cerrada/i)).toBeInTheDocument();
            });
        });
    });

    describe('manejo de errores', () => {
        it('debe mostrar mensaje de error si falla la carga de datos', async () => {
            const { salesApi } = require('@/features/sales/api');
            salesApi.getStats.mockRejectedValueOnce(new Error('Error al cargar'));

            const wrapper = createWrapper();
            render(<DashboardPage />, { wrapper });

            await waitFor(() => {
                expect(screen.getByText(/error/i)).toBeInTheDocument();
            });
        });
    });

    describe('actualización de datos', () => {
        it('debe tener botón para refrescar los datos', async () => {
            const wrapper = createWrapper();
            render(<DashboardPage />, { wrapper });

            await waitFor(() => {
                const refreshButton = screen.queryByRole('button', { name: /refrescar/i });
                expect(refreshButton).toBeInTheDocument();
            });
        });
    });
});
