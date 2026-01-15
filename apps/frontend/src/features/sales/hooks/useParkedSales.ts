import { useState, useEffect } from 'react';
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

export function useParkedSales() {
    const [parkedSales, setParkedSales] = useState<ParkedSale[]>([]);

    // Cargar al inicio
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                setParkedSales(JSON.parse(stored));
            } catch (e) {
                console.error('Error parsing parked sales', e);
            }
        }
    }, []);

    // Guardar cambios en localStorage
    const saveToStorage = (sales: ParkedSale[]) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sales));
        setParkedSales(sales);
    };

    const parkSale = (formData: CreateSaleFormValues, total: number, customer: Customer | null) => {
        const newSale: ParkedSale = {
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            customerName: formData.customerName || 'Cliente Ocasional',
            customer,
            total,
            itemCount: formData.items.length,
            data: formData,
        };

        const updatedSales = [newSale, ...parkedSales];
        saveToStorage(updatedSales);
        return newSale;
    };

    const retrieveSale = (id: string) => {
        const sale = parkedSales.find(s => s.id === id);
        if (sale) {
            // Opcional: eliminar al recuperar, o dejar que el usuario la borre explícitamente.
            // Por ahora, la eliminamos de pendientes para evitar duplicados si la confirma.
            removeSale(id);
        }
        return sale;
    };

    const removeSale = (id: string) => {
        const updatedSales = parkedSales.filter(s => s.id !== id);
        saveToStorage(updatedSales);
    };

    const clearAll = () => {
        saveToStorage([]);
    };

    return {
        parkedSales,
        parkSale,
        retrieveSale,
        removeSale,
        clearAll
    };
}
