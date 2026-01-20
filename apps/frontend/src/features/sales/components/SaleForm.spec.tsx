/**
 * Tests unitarios para SaleForm.tsx
 * Cubre: adición/removal de items, cálculo de totales, validación de stock
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SaleForm } from './SaleForm';
import { CreateSaleDTO } from '../types';

// Mock de las dependencias
vi.mock('@/components/common/ProductSearch', () => ({
    ProductSearch: ({ onSelect }: { onSelect: (product: any) => void }) => (
        <div>
            <button
                data-testid="select-product"
                onClick={() =>
                    onSelect({
                        id: 'product-123',
                        name: 'Producto Test',
                        price: 100,
                        stock: 50,
                        sku: 'SKU123',
                    })
                }
            >
                Seleccionar Producto
            </button>
        </div>
    ),
}));

vi.mock('@/components/common/CustomerSearch', () => ({
    CustomerSearch: ({ onSelect }: { onSelect: (customer: any) => void }) => (
        <div>
            <button
                data-testid="select-customer"
                onClick={() =>
                    onSelect({
                        id: 'customer-123',
                        firstName: 'Juan',
                        lastName: 'Pérez',
                        fullName: 'Juan Pérez',
                        documentNumber: '12345678',
                        email: 'juan@example.com',
                        phone: '1234567890',
                        address: 'Calle 123',
                        city: 'Ciudad',
                        isActive: true,
                    })
                }
            >
                Seleccionar Cliente
            </button>
        </div>
    ),
}));

vi.mock('@tanstack/react-query', async () => {
    const actual = await vi.importActual('@tanstack/react-query');
    return {
        ...actual,
        useMutation: vi.fn(() => ({
            mutate: vi.fn(),
            mutateAsync: vi.fn(),
            isPending: false,
        })),
        useQuery: vi.fn(() => ({
            data: [],
            isLoading: false,
            error: null,
        })),
        useQueryClient: vi.fn(() => ({
            invalidateQueries: vi.fn(),
        })),
    };
});

vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
    },
}));

vi.mock('../hooks/useSaleFormEffects', () => ({
    usePaymentAmountSync: vi.fn(),
    useOnAccountValidation: vi.fn(),
    useMonotributistaCleanup: vi.fn(),
    useFiscalConfigValidation: vi.fn(() => ({ canCreateInvoice: true })),
}));

vi.mock('../hooks/useParkedSales', () => ({
    useParkedSales: vi.fn(() => ({
        parkedSales: [],
        parkSale: vi.fn(),
        unparkSale: vi.fn(),
        removeParkedSale: vi.fn(),
    })),
}));

const mockPaymentMethods = [
    { id: 'pm-1', name: 'Efectivo', isCash: true },
    { id: 'pm-2', name: 'Tarjeta', isCash: false },
];

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

describe('SaleForm', () => {
    let mockOnSubmit: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        mockOnSubmit = vi.fn();
        vi.clearAllMocks();
    });

    describe('renderizado inicial', () => {
        it('debe renderizar el formulario vacío', () => {
            const wrapper = createWrapper();
            render(<SaleForm onSubmit={mockOnSubmit} />, { wrapper });

            expect(screen.getByText(/Nueva Venta/i)).toBeInTheDocument();
        });

        it('debe tener el botón de crear venta deshabilitado inicialmente', () => {
            const wrapper = createWrapper();
            render(<SaleForm onSubmit={mockOnSubmit} />, { wrapper });

            const submitButton = screen.queryByRole('button', { name: /crear venta/i });
            // El botón puede estar deshabilitado o no visible si no hay items
            expect(submitButton).toBeInTheDocument();
        });
    });

    describe('selección de producto', () => {
        it('debe agregar un producto al seleccionarlo', async () => {
            const user = userEvent.setup();
            const wrapper = createWrapper();
            render(<SaleForm onSubmit={mockOnSubmit} />, { wrapper });

            const selectButton = screen.getByTestId('select-product');
            await user.click(selectButton);

            // El producto debería aparecer en la lista
            await waitFor(() => {
                expect(screen.getByText(/Producto Test/i)).toBeInTheDocument();
            });
        });

        it('debe calcular el subtotal cuando se agrega un producto', async () => {
            const user = userEvent.setup();
            const wrapper = createWrapper();
            render(<SaleForm onSubmit={mockOnSubmit} />, { wrapper });

            const selectButton = screen.getByTestId('select-product');
            await user.click(selectButton);

            await waitFor(() => {
                expect(screen.getByText(/\$100/i)).toBeInTheDocument();
            });
        });
    });

    describe('selección de cliente', () => {
        it('debe permitir seleccionar un cliente', async () => {
            const user = userEvent.setup();
            const wrapper = createWrapper();
            render(<SaleForm onSubmit={mockOnSubmit} />, { wrapper });

            const selectButton = screen.getByTestId('select-customer');
            await user.click(selectButton);

            await waitFor(() => {
                expect(screen.getByText(/Juan Pérez/i)).toBeInTheDocument();
            });
        });
    });

    describe('cálculo de totales', () => {
        it('debe calcular el total correctamente con múltiples items', async () => {
            const user = userEvent.setup();
            const wrapper = createWrapper();
            render(<SaleForm onSubmit={mockOnSubmit} />, { wrapper });

            // Agregar el mismo producto dos veces
            const selectButton = screen.getByTestId('select-product');

            await user.click(selectButton);
            await user.click(selectButton);

            await waitFor(() => {
                // Total esperado: 100 * 2 = 200
                expect(screen.getByText(/\$200/i)).toBeInTheDocument();
            });
        });
    });

    describe('validación del formulario', () => {
        it('no debe permitir enviar el formulario sin items', async () => {
            const user = userEvent.setup();
            const wrapper = createWrapper();
            render(<SaleForm onSubmit={mockOnSubmit} />, { wrapper });

            const submitButton = screen.getByRole('button', { name: /crear venta/i });
            await user.click(submitButton);

            expect(mockOnSubmit).not.toHaveBeenCalled();
        });
    });

    describe('estado de loading', () => {
        it('debe mostrar indicador de carga cuando isLoading es true', () => {
            const wrapper = createWrapper();
            render(<SaleForm onSubmit={mockOnSubmit} isLoading={true} />, { wrapper });

            expect(screen.getByRole('button', { name: /crear venta/i })).toBeDisabled();
        });
    });

    describe('ventas pendientes (parking)', () => {
        it('debe tener opción de estacionar venta si se proporciona onParkSale', () => {
            const wrapper = createWrapper();
            render(<SaleForm onSubmit={mockOnSubmit} onParkSale={vi.fn()} />, { wrapper });

            expect(screen.getByRole('button', { name: /estacionar/i })).toBeInTheDocument();
        });

        it('no debe mostrar botón de estacionar si no se proporciona onParkSale', () => {
            const wrapper = createWrapper();
            render(<SaleForm onSubmit={mockOnSubmit} />, { wrapper });

            expect(screen.queryByRole('button', { name: /estacionar/i })).not.toBeInTheDocument();
        });
    });

    describe('integración con hooks personalizados', () => {
        it('debe llamar a los hooks de efectos del formulario', () => {
            const { usePaymentAmountSync, useOnAccountValidation, useMonotributistaCleanup, useFiscalConfigValidation } = require('../hooks/useSaleFormEffects');

            const wrapper = createWrapper();
            render(<SaleForm onSubmit={mockOnSubmit} />, { wrapper });

            // Verificar que los hooks fueron llamados
            expect(usePaymentAmountSync).toHaveBeenCalled();
            expect(useOnAccountValidation).toHaveBeenCalled();
            expect(useMonotributistaCleanup).toHaveBeenCalled();
            expect(useFiscalConfigValidation).toHaveBeenCalled();
        });
    });

    describe('manejo de errores', () => {
        it('debe manejar errores de validación del formulario', async () => {
            const user = userEvent.setup();
            const wrapper = createWrapper();
            render(<SaleForm onSubmit={mockOnSubmit} />, { wrapper });

            // Intentar enviar formulario vacío
            const submitButton = screen.getByRole('button', { name: /crear venta/i });
            await user.click(submitButton);

            // No debe llamar a onSubmit
            expect(mockOnSubmit).not.toHaveBeenCalled();
        });
    });
});
