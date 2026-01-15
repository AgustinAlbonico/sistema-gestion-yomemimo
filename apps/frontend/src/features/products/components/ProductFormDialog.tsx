import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { ProductForm } from './ProductForm';
import { ProductFormValues } from '../schemas/product.schema';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '../api/products.api';
import { toast } from 'sonner';
import { CreateProductDTO, Product } from '../types';

interface ProductFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onProductCreated: (product: Product) => void;
}

export function ProductFormDialog({
    open,
    onOpenChange,
    onProductCreated,
}: ProductFormDialogProps) {
    const queryClient = useQueryClient();

    const createProductMutation = useMutation({
        mutationFn: productsApi.create,
        onSuccess: (newProduct) => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success('Producto creado exitosamente');
            onProductCreated(newProduct);
            onOpenChange(false);
        },
        onError: (error: any) => {
            console.error(error);
            toast.error(error.response?.data?.message || 'Error al crear producto');
        },
    });

    const handleSubmit = (data: ProductFormValues) => {
        // Adaptar ProductFormValues a CreateProductDTO
        // ProductFormValues puede tener nulos, CreateProductDTO es más estricto
        const payload: CreateProductDTO = {
            ...data,
            description: data.description || undefined,
            brandName: data.brandName || undefined,
            categoryId: data.categoryId || undefined,
            customProfitMargin: data.customProfitMargin || undefined,
        };
        createProductMutation.mutate(payload);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Nuevo Producto</DialogTitle>
                    <DialogDescription>
                        Agregá un producto al catálogo. Se agregará automáticamente a la venta.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-2">
                    <ProductForm
                        onSubmit={handleSubmit}
                        isLoading={createProductMutation.isPending}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
