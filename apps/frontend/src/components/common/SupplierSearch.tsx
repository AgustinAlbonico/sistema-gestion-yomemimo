import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, X, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { suppliersApi } from '@/features/suppliers/api/suppliers.api';
import { Supplier } from '@/features/suppliers/types';

interface SupplierSearchProps {
    value?: string; // ID del proveedor seleccionado
    onSelect: (supplierId: string, supplier: Supplier) => void;
    onClear?: () => void;
    placeholder?: string;
    showClearButton?: boolean;
    limit?: number;
    className?: string;
    disabled?: boolean;
    allowCreate?: boolean; // Permite crear proveedores
    onCreateClick?: () => void;
}

export function SupplierSearch({
    value,
    onSelect,
    onClear,
    placeholder = 'Buscar proveedor...',
    showClearButton = true,
    limit = 15,
    className = '',
    disabled = false,
    allowCreate = false,
    onCreateClick,
}: SupplierSearchProps) {
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const { data: suppliersData, isLoading } = useQuery({
        queryKey: ['suppliers', { search: searchTerm, limit }],
        queryFn: () => suppliersApi.getAll({ search: searchTerm, limit }),
        enabled: open,
    });

    const { data: selectedSupplierData } = useQuery({
        queryKey: ['suppliers', value],
        queryFn: () => (value ? suppliersApi.getOne(value) : null),
        enabled: !!value && open === false,
    });

    const selectedSupplierName = selectedSupplierData?.name || null;

    const handleSelect = (supplier: Supplier) => {
        onSelect(supplier.id, supplier);
        setOpen(false);
        setSearchTerm('');
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onClear) onClear();
        setSearchTerm('');
    };

    const results = suppliersData?.data || [];

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    className={`w-full justify-between font-normal ${className}`}
                    disabled={disabled}
                >
                    <span className="truncate">{selectedSupplierName ?? placeholder}</span>
                    {value && showClearButton && onClear ? (
                        <X
                            className="ml-2 h-4 w-4 shrink-0 opacity-50 hover:opacity-100"
                            onClick={handleClear}
                        />
                    ) : (
                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start" onWheel={(e) => e.stopPropagation()}>
                <Command shouldFilter={false} className="overflow-hidden">
                    <CommandInput placeholder={placeholder} value={searchTerm} onValueChange={setSearchTerm} />
                    <div className="max-h-[300px] overflow-y-auto overflow-x-hidden">
                        <CommandList>
                            {isLoading ? (
                                <div className="p-4 text-center text-sm text-muted-foreground">Buscando...</div>
                            ) : results.length === 0 ? (
                                <div className="p-4">
                                    {allowCreate && onCreateClick ? (
                                        <div className="text-center">
                                            <p className="text-sm text-muted-foreground mb-3">
                                                {searchTerm ? `No se encontró "${searchTerm}"` : 'Escribí para buscar...'}
                                            </p>
                                            <Button
                                                type="button"
                                                variant="default"
                                                size="sm"
                                                onClick={() => {
                                                    onCreateClick();
                                                    setOpen(false);
                                                }}
                                            >
                                                <UserPlus className="h-4 w-4 mr-2" />
                                                Crear proveedor nuevo
                                            </Button>
                                        </div>
                                    ) : (
                                        <CommandEmpty>{searchTerm ? `No se encontró "${searchTerm}"` : 'Escribí para buscar...'}</CommandEmpty>
                                    )}
                                </div>
                            ) : (
                                <>
                                    {allowCreate && onCreateClick && (
                                        <div className="border-b p-2">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="w-full justify-start text-primary font-medium"
                                                onClick={() => {
                                                    onCreateClick();
                                                    setOpen(false);
                                                }}
                                            >
                                                <UserPlus className="h-4 w-4 mr-2" />
                                                Crear proveedor nuevo
                                            </Button>
                                        </div>
                                    )}
                                    <CommandGroup>
                                        {results.map((s: Supplier) => (
                                            <CommandItem key={s.id} value={s.id} onSelect={() => handleSelect(s)}>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{s.name}</span>
                                                    <div className="text-xs text-muted-foreground mt-0.5">
                                                        {s.tradeName && <span>{s.tradeName} • </span>}
                                                        {s.documentNumber && <span>{s.documentNumber}</span>}
                                                    </div>
                                                </div>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </>
                            )}
                        </CommandList>
                    </div>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
