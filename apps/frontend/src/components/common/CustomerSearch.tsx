/**
 * Componente reutilizable para buscar y seleccionar clientes
 * Usa búsqueda en tiempo real con autocompletado
 */
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
import { customersApi } from '@/features/customers/api';
import { Customer } from '@/features/customers/types';

interface CustomerSearchProps {
    value?: string; // ID del cliente seleccionado
    onSelect: (customerId: string, customer: Customer) => void;
    onClear?: () => void;
    placeholder?: string;
    showClearButton?: boolean;
    limit?: number;
    className?: string;
    disabled?: boolean;
    allowCreate?: boolean;
    onCreateClick?: () => void;
}

/**
 * Componente de búsqueda de clientes con autocompletado
 */
export function CustomerSearch({
    value,
    onSelect,
    onClear,
    placeholder = 'Buscar cliente...',
    showClearButton = true,
    limit = 15,
    className = '',
    disabled = false,
    allowCreate = false,
    onCreateClick,
}: CustomerSearchProps) {
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Query para buscar clientes
    const { data: customersData, isLoading } = useQuery({
        queryKey: ['customers', { search: searchTerm, limit }],
        queryFn: () => customersApi.getAll({ search: searchTerm, limit, isActive: true }),
        enabled: open,
    });

    // Obtener el cliente seleccionado para mostrar su nombre
    const { data: selectedCustomerData } = useQuery({
        queryKey: ['customers', value],
        queryFn: () => (value ? customersApi.getOne(value) : null),
        enabled: !!value && open === false,
    });

    const selectedCustomerName = selectedCustomerData
        ? `${selectedCustomerData.firstName} ${selectedCustomerData.lastName}`
        : null;

    const handleSelect = (customer: Customer) => {
        onSelect(customer.id, customer);
        setOpen(false);
        setSearchTerm('');
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onClear) {
            onClear();
        }
        setSearchTerm('');
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    className={`w-full justify-between font-normal ${className}`}
                    disabled={disabled}
                >
                    <span className="truncate">
                        {selectedCustomerName ?? placeholder}
                    </span>
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
                    <CommandInput
                        placeholder="Buscar cliente por nombre, documento o email..."
                        value={searchTerm}
                        onValueChange={setSearchTerm}
                    />
                    <div className="max-h-[300px] overflow-y-auto overflow-x-hidden">
                        <CommandList>
                        {isLoading ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                                Buscando...
                            </div>
                        ) : customersData?.data && customersData.data.length === 0 ? (
                            <div className="p-4">
                                {allowCreate && onCreateClick ? (
                                    <div className="text-center">
                                        <p className="text-sm text-muted-foreground mb-3">
                                            {searchTerm
                                                ? `No se encontró "${searchTerm}"`
                                                : 'Escribí para buscar...'}
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
                                            Crear cliente nuevo
                                        </Button>
                                    </div>
                                ) : (
                                    <CommandEmpty>
                                        {searchTerm
                                            ? `No se encontró "${searchTerm}"`
                                            : 'Escribí para buscar...'}
                                    </CommandEmpty>
                                )}
                            </div>
                        ) : (
                            <>
                                {/* Botón de crear arriba de la lista */}
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
                                            Crear cliente nuevo
                                        </Button>
                                    </div>
                                )}
                                <CommandGroup>
                                    {customersData?.data.map((customer) => (
                                        <CommandItem
                                            key={customer.id}
                                            value={customer.id}
                                            onSelect={() => handleSelect(customer)}
                                        >
                                            <div className="flex flex-col flex-1">
                                                <span className="font-medium">
                                                    {customer.firstName} {customer.lastName}
                                                </span>
                                                <div className="flex gap-2 text-xs text-muted-foreground mt-0.5">
                                                    {customer.documentNumber && (
                                                        <span>
                                                            {customer.documentType}: {customer.documentNumber}
                                                        </span>
                                                    )}
                                                    {customer.email && (
                                                        <span>{customer.email}</span>
                                                    )}
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
