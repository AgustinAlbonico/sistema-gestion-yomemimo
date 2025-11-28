import { useState } from 'react';
import { ProductList } from '@/features/products/components/ProductList';
import { ProductForm } from '@/features/products/components/ProductForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Tags } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { productsApi, categoriesApi } from '@/features/products/api/products.api';
import { toast } from 'sonner';
import { Product } from '@/features/products/types';
import { ProductFormValues } from '@/features/products/schemas/product.schema';
import { Badge } from '@/components/ui/badge';

/**
 * Página de Productos - Gestión completa de productos y stock
 */
export default function ProductsPage() {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const queryClient = useQueryClient();

    // Query para categorías
    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: () => categoriesApi.getAll(),
    });

    const createMutation = useMutation({
        mutationFn: productsApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success('Producto creado');
            setIsCreateOpen(false);
        },
        onError: () => {
            toast.error('Error al crear producto');
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: ProductFormValues }) =>
            productsApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success('Producto actualizado');
            setEditingProduct(null);
        },
        onError: () => {
            toast.error('Error al actualizar producto');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: productsApi.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success('Producto eliminado');
        },
        onError: () => {
            toast.error('Error al eliminar producto');
        },
    });

    const createCategoryMutation = useMutation({
        mutationFn: categoriesApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            toast.success('Categoría creada');
            setNewCategoryName('');
            setIsCategoryOpen(false);
        },
        onError: () => {
            toast.error('Error al crear categoría');
        },
    });

    const deleteCategoryMutation = useMutation({
        mutationFn: categoriesApi.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            toast.success('Categoría eliminada');
        },
        onError: () => {
            toast.error('Error al eliminar categoría');
        },
    });

    const handleCreate = (data: ProductFormValues) => {
        createMutation.mutate(data);
    };

    const handleUpdate = (data: ProductFormValues) => {
        if (editingProduct) {
            updateMutation.mutate({ id: editingProduct.id, data });
        }
    };

    const handleDelete = (id: string) => {
        if (confirm('¿Eliminar este producto?')) {
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
        <div className="container mx-auto py-10 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Productos</h2>
                    <p className="text-muted-foreground">
                        Cargá productos con nombre, costo y stock
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
                                <DialogTitle>Categorías</DialogTitle>
                                <DialogDescription>
                                    Organizá tus productos por categorías
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
                                            placeholder="Ej: Bebidas"
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

                    {/* Botón Nuevo Producto */}
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Nuevo Producto
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[450px]">
                            <DialogHeader>
                                <DialogTitle>Nuevo Producto</DialogTitle>
                                <DialogDescription>
                                    El precio se calcula automático según la configuración
                                </DialogDescription>
                            </DialogHeader>
                            <ProductForm
                                onSubmit={handleCreate}
                                isLoading={createMutation.isPending}
                            />
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="bg-card rounded-lg border shadow-sm p-6">
                <ProductList
                    onEdit={setEditingProduct}
                    onDelete={handleDelete}
                />
            </div>

            <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
                <DialogContent className="sm:max-w-[450px]">
                    <DialogHeader>
                        <DialogTitle>Editar Producto</DialogTitle>
                        <DialogDescription>
                            Modificá el costo o stock del producto
                        </DialogDescription>
                    </DialogHeader>
                    {editingProduct && (
                        <ProductForm
                            initialData={{
                                name: editingProduct.name,
                                cost: editingProduct.cost,
                                stock: editingProduct.stock,
                                categoryId: editingProduct.categoryId || undefined,
                                isActive: editingProduct.isActive,
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
