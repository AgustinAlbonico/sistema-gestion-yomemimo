/**
 * Página de Clientes - Gestión completa de clientes
 */
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Tags } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

import { CustomerList } from '@/features/customers/components/CustomerList';
import { CustomerForm } from '@/features/customers/components/CustomerForm';
import { CustomerStats } from '@/features/customers/components/CustomerStats';
import { customersApi, customerCategoriesApi } from '@/features/customers/api/customers.api';
import { Customer, CreateCustomerDTO } from '@/features/customers/types';
import { CustomerFormValues } from '@/features/customers/schemas/customer.schema';
import { DEFAULT_IVA_CONDITION } from '@/types/iva-condition';

export default function CustomersPage() {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const queryClient = useQueryClient();

    // Query para estadísticas
    const { data: stats } = useQuery({
        queryKey: ['customers-stats'],
        queryFn: () => customersApi.getStats(),
    });

    // Query para categorías
    const { data: categories } = useQuery({
        queryKey: ['customer-categories'],
        queryFn: () => customerCategoriesApi.getAll(),
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: customersApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            queryClient.invalidateQueries({ queryKey: ['customers-stats'] });
            toast.success('Cliente creado');
            setIsCreateOpen(false);
        },
        onError: (error: Error & { response?: { data?: { message?: string } } }) => {
            toast.error(error.response?.data?.message || 'Error al crear cliente');
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: CreateCustomerDTO }) =>
            customersApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            queryClient.invalidateQueries({ queryKey: ['customers-stats'] });
            toast.success('Cliente actualizado');
            setEditingCustomer(null);
        },
        onError: (error: Error & { response?: { data?: { message?: string } } }) => {
            toast.error(error.response?.data?.message || 'Error al actualizar cliente');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: customersApi.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            queryClient.invalidateQueries({ queryKey: ['customers-stats'] });
            toast.success('Cliente desactivado');
        },
        onError: () => {
            toast.error('Error al desactivar cliente');
        },
    });

    const createCategoryMutation = useMutation({
        mutationFn: customerCategoriesApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customer-categories'] });
            toast.success('Categoría creada');
            setNewCategoryName('');
        },
        onError: (error: Error & { response?: { data?: { message?: string } } }) => {
            toast.error(error.response?.data?.message || 'Error al crear categoría');
        },
    });

    const deleteCategoryMutation = useMutation({
        mutationFn: customerCategoriesApi.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customer-categories'] });
            toast.success('Categoría eliminada');
        },
        onError: (error: Error & { response?: { data?: { message?: string } } }) => {
            toast.error(error.response?.data?.message || 'Error al eliminar categoría');
        },
    });

    const handleCreate = (data: CustomerFormValues) => {
        createMutation.mutate(data as unknown as CreateCustomerDTO);
    };

    const handleUpdate = (data: CustomerFormValues) => {
        if (editingCustomer) {
            updateMutation.mutate({ id: editingCustomer.id, data: data as unknown as CreateCustomerDTO });
        }
    };

    const handleDelete = (id: string) => {
        if (confirm('¿Desactivar este cliente?')) {
            deleteMutation.mutate(id);
        }
    };

    const handleCreateCategory = () => {
        if (!newCategoryName.trim()) {
            toast.error('Ingresá un nombre para la categoría');
            return;
        }
        createCategoryMutation.mutate({ name: newCategoryName.trim() });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Clientes</h1>
                    <p className="text-muted-foreground">
                        Gestión de clientes y categorías
                    </p>
                </div>
                <div className="flex gap-2">
                    {/* Botón Categorías */}
                    <Dialog open={isCategoryOpen} onOpenChange={setIsCategoryOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <Tags className="mr-2 h-4 w-4" />
                                Categorías
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[400px]">
                            <DialogHeader>
                                <DialogTitle>Categorías de Clientes</DialogTitle>
                                <DialogDescription>
                                    Clasificá tus clientes por tipo
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                {/* Lista de categorías existentes */}
                                <div className="space-y-2">
                                    <Label>Categorías actuales</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {categories && categories.length > 0 ? (
                                            categories.map((cat) => (
                                                <Badge
                                                    key={cat.id}
                                                    variant="secondary"
                                                    className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                                                    style={{
                                                        borderColor: cat.color || undefined,
                                                        backgroundColor: cat.color
                                                            ? `${cat.color}20`
                                                            : undefined,
                                                    }}
                                                    onClick={() => {
                                                        if (confirm(`¿Eliminar "${cat.name}"?`)) {
                                                            deleteCategoryMutation.mutate(cat.id);
                                                        }
                                                    }}
                                                    title="Click para eliminar"
                                                >
                                                    {cat.name} ×
                                                </Badge>
                                            ))
                                        ) : (
                                            <p className="text-sm text-muted-foreground">
                                                No hay categorías creadas
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Crear nueva categoría */}
                                <div className="space-y-2">
                                    <Label htmlFor="categoryName">Nueva categoría</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="categoryName"
                                            placeholder="Ej: VIP, Mayorista..."
                                            value={newCategoryName}
                                            onChange={(e) => setNewCategoryName(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleCreateCategory();
                                            }}
                                        />
                                        <Button
                                            onClick={handleCreateCategory}
                                            disabled={createCategoryMutation.isPending}
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>

                    {/* Botón Nuevo Cliente */}
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Nuevo Cliente
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Nuevo Cliente</DialogTitle>
                                <DialogDescription>
                                    Ingresá los datos del cliente
                                </DialogDescription>
                            </DialogHeader>
                            <CustomerForm
                                onSubmit={handleCreate}
                                isLoading={createMutation.isPending}
                            />
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Estadísticas */}
            {stats && <CustomerStats stats={stats} />}

            {/* Lista de clientes */}
            <div className="bg-card rounded-lg border shadow-sm p-6">
                <CustomerList
                    onEdit={setEditingCustomer}
                    onDelete={handleDelete}
                />
            </div>

            {/* Modal de edición */}
            <Dialog
                open={!!editingCustomer}
                onOpenChange={(open) => !open && setEditingCustomer(null)}
            >
                <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Editar Cliente</DialogTitle>
                        <DialogDescription>
                            Modificá los datos del cliente
                        </DialogDescription>
                    </DialogHeader>
                    {editingCustomer && (
                        <CustomerForm
                            initialData={{
                                firstName: editingCustomer.firstName,
                                lastName: editingCustomer.lastName,
                                documentType: editingCustomer.documentType || undefined,
                                ivaCondition: editingCustomer.ivaCondition || DEFAULT_IVA_CONDITION,
                                documentNumber: editingCustomer.documentNumber || '',
                                email: editingCustomer.email || '',
                                phone: editingCustomer.phone || '',
                                mobile: editingCustomer.mobile || '',
                                address: editingCustomer.address || '',
                                city: editingCustomer.city || '',
                                state: editingCustomer.state || '',
                                postalCode: editingCustomer.postalCode || '',
                                categoryId: editingCustomer.categoryId || '',
                                notes: editingCustomer.notes || '',
                                isActive: editingCustomer.isActive,
                            }}
                            onSubmit={handleUpdate}
                            isLoading={updateMutation.isPending}
                            isEditing
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

