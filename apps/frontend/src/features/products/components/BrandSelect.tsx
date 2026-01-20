/**
 * Selector de marcas con búsqueda y scroll
 * Ideal para listas largas de marcas
 */
import { useState } from 'react';
import { Check, X, Boxes } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Brand } from '../types';

interface BrandSelectProps {
    readonly selectedId?: string;
    readonly onSelect: (brandId: string | null) => void;
    readonly brands: Brand[];
    readonly placeholder?: string;
    readonly className?: string;
}

export function BrandSelect({
    selectedId,
    onSelect,
    brands,
    placeholder = 'Todas las marcas',
    className = '',
}: BrandSelectProps) {
    const [open, setOpen] = useState(false);

    const selectedBrand = brands.find(b => b.id === selectedId);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={`w-[200px] justify-between ${className}`}
                >
                    <span className="flex items-center gap-2 truncate">
                        {selectedBrand ? (
                            <>
                                <Boxes className="h-4 w-4 text-muted-foreground" />
                                {selectedBrand.name}
                            </>
                        ) : (
                            placeholder
                        )}
                    </span>
                    {selectedId && (
                        <X
                            className="h-4 w-4 opacity-50 hover:opacity-100"
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelect(null);
                            }}
                        />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="start">
                <Command>
                    <CommandInput placeholder="Buscar marca..." />
                    <CommandList>
                        <CommandEmpty>
                            <span className="text-muted-foreground text-sm">
                                No se encontraron marcas
                            </span>
                        </CommandEmpty>
                        <ScrollArea className="h-[300px]">
                            <CommandGroup>
                                <CommandItem
                                    key="all"
                                    onSelect={() => {
                                        onSelect(null);
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={`mr-2 h-4 w-4 ${!selectedId ? 'opacity-100' : 'opacity-0'}`}
                                    />
                                    Todas las marcas
                                </CommandItem>
                                {brands.map((brand) => (
                                    <CommandItem
                                        key={brand.id}
                                        onSelect={() => {
                                            onSelect(brand.id);
                                            setOpen(false);
                                        }}
                                    >
                                        <Check
                                            className={`mr-2 h-4 w-4 ${selectedId === brand.id ? 'opacity-100' : 'opacity-0'}`}
                                        />
                                        <div className="flex items-center gap-2 truncate">
                                            <Boxes className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                            <span className="truncate">{brand.name}</span>
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </ScrollArea>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
