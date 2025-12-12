/**
 * Selector de período para reportes
 */
import { useState } from 'react';
import { CalendarIcon, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { ReportPeriod } from '../types';
import { periodLabels } from '../hooks/useReports';

interface PeriodSelectorProps {
    readonly period: ReportPeriod;
    readonly startDate?: string;
    readonly endDate?: string;
    readonly onChange: (period: ReportPeriod, startDate?: string, endDate?: string) => void;
}

const periodOptions = [
    { value: ReportPeriod.TODAY, label: periodLabels[ReportPeriod.TODAY] },
    { value: ReportPeriod.YESTERDAY, label: periodLabels[ReportPeriod.YESTERDAY] },
    { value: ReportPeriod.THIS_WEEK, label: periodLabels[ReportPeriod.THIS_WEEK] },
    { value: ReportPeriod.LAST_WEEK, label: periodLabels[ReportPeriod.LAST_WEEK] },
    { value: ReportPeriod.THIS_MONTH, label: periodLabels[ReportPeriod.THIS_MONTH] },
    { value: ReportPeriod.LAST_MONTH, label: periodLabels[ReportPeriod.LAST_MONTH] },
    { value: ReportPeriod.THIS_QUARTER, label: periodLabels[ReportPeriod.THIS_QUARTER] },
    { value: ReportPeriod.LAST_QUARTER, label: periodLabels[ReportPeriod.LAST_QUARTER] },
    { value: ReportPeriod.THIS_YEAR, label: periodLabels[ReportPeriod.THIS_YEAR] },
    { value: ReportPeriod.LAST_YEAR, label: periodLabels[ReportPeriod.LAST_YEAR] },
    { value: ReportPeriod.CUSTOM, label: periodLabels[ReportPeriod.CUSTOM] },
];

export function PeriodSelector({ period, startDate, endDate, onChange }: PeriodSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [customStart, setCustomStart] = useState(startDate || '');
    const [customEnd, setCustomEnd] = useState(endDate || '');

    const handlePeriodSelect = (selectedPeriod: ReportPeriod) => {
        if (selectedPeriod === ReportPeriod.CUSTOM) {
            // Solo cambiar a custom, no cerrar el popover
            onChange(ReportPeriod.CUSTOM, customStart, customEnd);
        } else {
            onChange(selectedPeriod);
            setIsOpen(false);
        }
    };

    const handleCustomApply = () => {
        if (customStart && customEnd) {
            onChange(ReportPeriod.CUSTOM, customStart, customEnd);
            setIsOpen(false);
        }
    };

    const getDisplayLabel = () => {
        if (period === ReportPeriod.CUSTOM && startDate && endDate) {
            return `${startDate} - ${endDate}`;
        }
        return periodLabels[period];
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" className="min-w-[200px] justify-between">
                    <span className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4" />
                        {getDisplayLabel()}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="grid grid-cols-2 gap-1 p-2 border-b">
                    {periodOptions.slice(0, -1).map((option) => (
                        <Button
                            key={option.value}
                            variant={period === option.value ? 'default' : 'ghost'}
                            size="sm"
                            className="justify-start"
                            onClick={() => handlePeriodSelect(option.value)}
                        >
                            {option.label}
                        </Button>
                    ))}
                </div>
                <div className="p-3 space-y-3">
                    <div className="text-sm font-medium">Período personalizado</div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label className="text-xs">Desde</Label>
                            <Input
                                type="date"
                                value={customStart}
                                onChange={(e) => setCustomStart(e.target.value)}
                                className="h-8"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Hasta</Label>
                            <Input
                                type="date"
                                value={customEnd}
                                onChange={(e) => setCustomEnd(e.target.value)}
                                className="h-8"
                            />
                        </div>
                    </div>
                    <Button
                        size="sm"
                        className="w-full"
                        onClick={handleCustomApply}
                        disabled={!customStart || !customEnd}
                    >
                        Aplicar
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
