import { useState, useEffect, useCallback } from 'react';
import { CreateSaleFormValues } from '../schemas/sale.schema';

import { Customer } from '@/features/customers/types';

export interface ParkedSale {
    id: string;
    date: string; // ISO string
    customerName?: string;
    customer?: Customer | null;
    total: number;
    itemCount: number;
    data: CreateSaleFormValues;
}

const STORAGE_KEY = 'nexopos_parked_sales';

// Helpers para leer/escribir en localStorage
const loadParkedSalesFromStorage = (): ParkedSale[] => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.error('Error parsing parked sales', e);
            return [];
        }
    }
    return [];
};

const saveParkedSalesToStorage = (sales: ParkedSale[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sales));
    // Disparar evento storage para sincronizar entre componentes
    window.dispatchEvent(new Event('storage'));
};

export function useParkedSales() {
    const [parkedSales, setParkedSales] = useState<ParkedSale[]>(() => loadParkedSalesFromStorage());

    // Escuchar cambios en localStorage (desde cualquier componente)
    useEffect(() => {
        const handleStorageChange = () => {
            setParkedSales(loadParkedSalesFromStorage());
        };

        // Usar el evento 'storage' estándar del navegador
        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    const parkSale = useCallback((formData: CreateSaleFormValues, total: number, customer: Customer | null) => {
        const newSale: ParkedSale = {
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            customerName: formData.customerName || 'Cliente Ocasional',
            customer,
            total,
            itemCount: formData.items.length,
            data: formData,
        };

        const currentSales = loadParkedSalesFromStorage();
        const updatedSales = [newSale, ...currentSales];
        saveParkedSalesToStorage(updatedSales);
        setParkedSales(updatedSales);
        return newSale;
    }, []);

    const retrieveSale = useCallback((id: string) => {
        const currentSales = loadParkedSalesFromStorage();
        const sale = currentSales.find(s => s.id === id);
        if (sale) {
            const updatedSales = currentSales.filter(s => s.id !== id);
            saveParkedSalesToStorage(updatedSales);
            setParkedSales(updatedSales);
        }
        return sale;
    }, []);

    const removeSale = useCallback((id: string) => {
        const currentSales = loadParkedSalesFromStorage();
        const updatedSales = currentSales.filter(s => s.id !== id);
        saveParkedSalesToStorage(updatedSales);
        setParkedSales(updatedSales);
    }, []);

    const clearAll = useCallback(() => {
        saveParkedSalesToStorage([]);
        setParkedSales([]);
    }, []);

    return {
        parkedSales,
        parkSale,
        retrieveSale,
        removeSale,
        clearAll
    };
}
