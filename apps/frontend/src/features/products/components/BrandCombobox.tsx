import * as React from "react";
import { Check, ChevronsUpDown, Plus, Pencil, Trash2, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { brandsApi } from "../api/products.api";
import { Brand } from "../types";
import { toast } from "sonner";

interface BrandComboboxProps {
    value?: string | null;
    onChange: (value: string | null) => void;
    placeholder?: string;
}

export function BrandCombobox({ value, onChange, placeholder = "Seleccionar marca..." }: BrandComboboxProps) {
    const queryClient = useQueryClient();
    const [open, setOpen] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState("");
    const [debouncedSearch, setDebouncedSearch] = React.useState("");

    // Estado para edición
    const [editingBrand, setEditingBrand] = React.useState<Brand | null>(null);
    const [editName, setEditName] = React.useState("");

    // Estado para confirmación de borrado
    const [brandToDelete, setBrandToDelete] = React.useState<Brand | null>(null);

    React.useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const { data: brands = [], isLoading, refetch } = useQuery({
        queryKey: ['brands', 'search', debouncedSearch],
        queryFn: () => brandsApi.search(debouncedSearch),
        enabled: open,
        staleTime: 0, // Siempre refetch
    });

    // Refetch cuando se abre el dropdown
    React.useEffect(() => {
        if (open) {
            refetch();
        }
    }, [open, refetch]);

    // Mutation para actualizar marca
    const updateMutation = useMutation({
        mutationFn: ({ id, name }: { id: string; name: string }) => brandsApi.update(id, name),
        onSuccess: (updatedBrand) => {
            queryClient.invalidateQueries({ queryKey: ['brands'] });
            toast.success(`Marca actualizada a "${updatedBrand.name}"`);
            // Si la marca editada era la seleccionada, actualizar el valor
            if (editingBrand && value === editingBrand.name) {
                onChange(updatedBrand.name);
            }
            setEditingBrand(null);
        },
        onError: (error: Error) => {
            toast.error(error.message || "Error al actualizar la marca");
        },
    });

    // Mutation para borrar marca
    const deleteMutation = useMutation({
        mutationFn: (id: string) => brandsApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['brands'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success("Marca eliminada");
            // Si la marca borrada era la seleccionada, limpiar
            if (brandToDelete && value === brandToDelete.name) {
                onChange(null);
            }
            setBrandToDelete(null);
        },
        onError: (error: Error) => {
            toast.error(error.message || "Error al eliminar la marca");
            setBrandToDelete(null);
        },
    });

    const handleSelect = (brandName: string) => {
        onChange(brandName || null);
        setOpen(false);
    };

    const handleStartEdit = (e: React.MouseEvent, brand: Brand) => {
        e.stopPropagation();
        setEditingBrand(brand);
        setEditName(brand.name);
    };

    const handleSaveEdit = () => {
        if (editingBrand && editName.trim()) {
            updateMutation.mutate({ id: editingBrand.id, name: editName.trim() });
        }
    };

    const handleCancelEdit = () => {
        setEditingBrand(null);
        setEditName("");
    };

    // Estado para conteo de productos afectados
    const [productCount, setProductCount] = React.useState<number>(0);
    const [loadingCount, setLoadingCount] = React.useState(false);

    const handleDeleteClick = async (e: React.MouseEvent, brand: Brand) => {
        e.stopPropagation();
        setLoadingCount(true);
        try {
            const { count } = await brandsApi.getProductCount(brand.id);
            setProductCount(count);
        } catch {
            setProductCount(0);
        }
        setLoadingCount(false);
        setBrandToDelete(brand);
    };

    const handleConfirmDelete = () => {
        if (brandToDelete) {
            deleteMutation.mutate(brandToDelete.id);
        }
    };

    return (
        <>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between"
                    >
                        {value ? value : placeholder}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[350px] p-0" align="start">
                    <Command shouldFilter={false}>
                        <CommandInput
                            placeholder="Buscar marca..."
                            value={searchTerm}
                            onValueChange={setSearchTerm}
                        />
                        <CommandList>
                            {isLoading && <CommandItem disabled>Cargando...</CommandItem>}

                            {!isLoading && brands.length === 0 && searchTerm.trim().length > 0 && (
                                <CommandGroup>
                                    <CommandItem
                                        onSelect={() => handleSelect(searchTerm)}
                                        className="cursor-pointer text-blue-500"
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Crear "{searchTerm}"
                                    </CommandItem>
                                </CommandGroup>
                            )}

                            <CommandGroup heading="Marcas">
                                {brands.map((brand) => (
                                    <CommandItem
                                        key={brand.id}
                                        value={brand.name}
                                        onSelect={() => {
                                            if (!editingBrand) {
                                                handleSelect(brand.name);
                                            }
                                        }}
                                        className="flex items-center justify-between group"
                                    >
                                        {editingBrand?.id === brand.id ? (
                                            // Modo edición inline
                                            <div className="flex items-center gap-2 w-full" onClick={e => e.stopPropagation()}>
                                                <Input
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    className="h-7 text-sm"
                                                    autoFocus
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleSaveEdit();
                                                        if (e.key === 'Escape') handleCancelEdit();
                                                    }}
                                                />
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-7 w-7"
                                                    onClick={handleSaveEdit}
                                                    disabled={updateMutation.isPending}
                                                >
                                                    {updateMutation.isPending ? (
                                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                    ) : (
                                                        <Check className="h-3.5 w-3.5 text-green-500" />
                                                    )}
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-7 w-7"
                                                    onClick={handleCancelEdit}
                                                >
                                                    <X className="h-3.5 w-3.5 text-red-500" />
                                                </Button>
                                            </div>
                                        ) : (
                                            // Modo normal
                                            <>
                                                <div className="flex items-center">
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            value === brand.name ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    {brand.name}
                                                </div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-6 w-6"
                                                        onClick={(e) => handleStartEdit(e, brand)}
                                                    >
                                                        <Pencil className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-6 w-6"
                                                        onClick={(e) => handleDeleteClick(e, brand)}
                                                    >
                                                        <Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-500" />
                                                    </Button>
                                                </div>
                                            </>
                                        )}
                                    </CommandItem>
                                ))}
                            </CommandGroup>

                            {/* Opción para crear si hay resultados pero ninguno coincide */}
                            {!isLoading && brands.length > 0 && searchTerm.trim().length > 0 &&
                                !brands.some(b => b.name.toLowerCase() === searchTerm.toLowerCase()) && (
                                    <CommandGroup heading="Nueva marca">
                                        <CommandItem
                                            onSelect={() => handleSelect(searchTerm)}
                                            className="cursor-pointer text-blue-500"
                                        >
                                            <Plus className="mr-2 h-4 w-4" />
                                            Crear "{searchTerm}"
                                        </CommandItem>
                                    </CommandGroup>
                                )}

                            {/* Opción para quitar marca */}
                            {value && (
                                <CommandGroup>
                                    <CommandItem
                                        onSelect={() => handleSelect("")}
                                        className="cursor-pointer text-red-500"
                                    >
                                        <X className="mr-2 h-4 w-4" />
                                        Quitar marca
                                    </CommandItem>
                                </CommandGroup>
                            )}
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            {/* Diálogo de confirmación para borrar */}
            <AlertDialog open={!!brandToDelete && !loadingCount} onOpenChange={(open) => !open && setBrandToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar marca?</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-2">
                                <p>¿Estás seguro de que querés eliminar la marca "{brandToDelete?.name}"?</p>
                                {productCount > 0 ? (
                                    <p className="text-amber-600 font-medium">
                                        ⚠️ {productCount} producto{productCount > 1 ? 's' : ''} se quedará{productCount > 1 ? 'n' : ''} sin marca.
                                    </p>
                                ) : (
                                    <p className="text-muted-foreground">
                                        Esta marca no tiene productos asociados.
                                    </p>
                                )}
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            className="bg-red-500 hover:bg-red-600"
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Eliminando...
                                </>
                            ) : (
                                "Eliminar"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
