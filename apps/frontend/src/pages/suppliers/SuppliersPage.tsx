/**
 * Página de Proveedores - Gestión completa de proveedores
 */
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

import { SupplierList } from '@/features/suppliers/components/SupplierList';
import { SupplierForm } from '@/features/suppliers/components/SupplierForm';
import { SupplierStats } from '@/features/suppliers/components/SupplierStats';
import { suppliersApi } from '@/features/suppliers/api/suppliers.api';
import { Supplier } from '@/features/suppliers/types';
import { SupplierFormValues } from '@/features/suppliers/schemas/supplier.schema';

export default function SuppliersPage() {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const queryClient = useQueryClient();

    // Query para estadísticas
    const { data: stats } = useQuery({
        queryKey: ['suppliers-stats'],
        queryFn: () => suppliersApi.getStats(),
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: suppliersApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
            queryClient.invalidateQueries({ queryKey: ['suppliers-stats'] });
            toast.success('Proveedor creado');
            setIsCreateOpen(false);
        },
        onError: (error: Error & { response?: { data?: { message?: string } } }) => {
            toast.error(error.response?.data?.message || 'Error al crear proveedor');
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: SupplierFormValues }) =>
            suppliersApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
            queryClient.invalidateQueries({ queryKey: ['suppliers-stats'] });
            toast.success('Proveedor actualizado');
            setEditingSupplier(null);
        },
        onError: (error: Error & { response?: { data?: { message?: string } } }) => {
            toast.error(error.response?.data?.message || 'Error al actualizar proveedor');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: suppliersApi.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
            queryClient.invalidateQueries({ queryKey: ['suppliers-stats'] });
            toast.success('Proveedor desactivado');
        },
        onError: () => {
            toast.error('Error al desactivar proveedor');
        },
    });

    // Handlers
    const handleCreate = (data: SupplierFormValues) => {
        createMutation.mutate(data);
    };

    const handleUpdate = (data: SupplierFormValues) => {
        if (!editingSupplier) return;
        updateMutation.mutate({ id: editingSupplier.id, data });
    };

    const handleDelete = (id: string) => {
        if (confirm('¿Estás seguro de desactivar este proveedor?')) {
            deleteMutation.mutate(id);
        }
    };

    const handleEdit = (supplier: Supplier) => {
        setEditingSupplier(supplier);
    };

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Proveedores</h1>
                    <p className="text-muted-foreground">
                        Gestiona los proveedores de tu negocio
                    </p>
                </div>

                {/* Botón crear proveedor */}
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Nuevo Proveedor
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Nuevo Proveedor</DialogTitle>
                            <DialogDescription>
                                Ingresa los datos del nuevo proveedor
                            </DialogDescription>
                        </DialogHeader>
                        <SupplierForm
                            onSubmit={handleCreate}
                            isLoading={createMutation.isPending}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            {/* Estadísticas */}
            {stats && <SupplierStats stats={stats} />}

            {/* Lista de proveedores */}
            <div className="bg-card rounded-lg border shadow-sm p-6">
                <SupplierList onEdit={handleEdit} onDelete={handleDelete} />
            </div>

            {/* Modal de edición */}
            <Dialog
                open={!!editingSupplier}
                onOpenChange={(open) => !open && setEditingSupplier(null)}
            >
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Editar Proveedor</DialogTitle>
                        <DialogDescription>
                            Modifica los datos del proveedor
                        </DialogDescription>
                    </DialogHeader>
                    {editingSupplier && (
                        <SupplierForm
                            initialData={{
                                name: editingSupplier.name,
                                tradeName: editingSupplier.tradeName || '',
                                documentType: editingSupplier.documentType || null,
                                documentNumber: editingSupplier.documentNumber || '',
                                ivaCondition: editingSupplier.ivaCondition || null,
                                email: editingSupplier.email || '',
                                phone: editingSupplier.phone || '',
                                mobile: editingSupplier.mobile || '',
                                address: editingSupplier.address || '',
                                city: editingSupplier.city || '',
                                state: editingSupplier.state || '',
                                postalCode: editingSupplier.postalCode || '',
                                website: editingSupplier.website || '',
                                contactName: editingSupplier.contactName || '',
                                bankAccount: editingSupplier.bankAccount || '',
                                notes: editingSupplier.notes || '',
                                isActive: editingSupplier.isActive,
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
