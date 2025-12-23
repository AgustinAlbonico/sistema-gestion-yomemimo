/**
 * Componente Skeleton de Shadcn
 * Placeholder animado para estados de carga
 */
import { cn } from "@/lib/utils";

function Skeleton({
    className,
    ...props
}: Readonly<React.HTMLAttributes<HTMLDivElement>>) {
    return (
        <div
            className={cn("animate-pulse rounded-md bg-muted", className)}
            {...props}
        />
    );
}

export { Skeleton };

