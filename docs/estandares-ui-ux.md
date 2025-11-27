# Estándares de UI/UX - Guía de Estilos y Componentes

> Documento que define los estándares visuales, patrones de componentes, sistema de diseño y mejores prácticas para mantener consistencia en toda la aplicación.

---

## 1. Sistema de Diseño Base

### 1.1 Paleta de Colores

#### Colores Principales (Semantic Colors)
```typescript
// tailwind.config.js - Variables CSS en globals.css
const colors = {
  // Sistema de colores base (HSL)
  background: 'hsl(0 0% 100%)',           // Fondo principal
  foreground: 'hsl(222.2 84% 4.9%)',     // Texto principal
  
  // Colores de marca
  primary: {
    DEFAULT: 'hsl(221.2 83.2% 53.3%)',   // Azul principal
    foreground: 'hsl(210 40% 98%)',      // Texto sobre primary
  },
  
  secondary: {
    DEFAULT: 'hsl(210 40% 96.1%)',       // Gris claro
    foreground: 'hsl(222.2 47.4% 11.2%)', // Texto sobre secondary
  },
  
  // Estados semánticos
  destructive: {
    DEFAULT: 'hsl(0 84.2% 60.2%)',       // Rojo para acciones destructivas
    foreground: 'hsl(210 40% 98%)',
  },
  
  success: {
    DEFAULT: 'hsl(142 76% 36%)',         // Verde para éxito
    foreground: 'hsl(0 0% 100%)',
  },
  
  warning: {
    DEFAULT: 'hsl(38 92% 50%)',          // Amarillo/Naranja para advertencias
    foreground: 'hsl(0 0% 100%)',
  },
  
  info: {
    DEFAULT: 'hsl(199 89% 48%)',         // Azul claro para información
    foreground: 'hsl(0 0% 100%)',
  },
  
  // Elementos de UI
  muted: {
    DEFAULT: 'hsl(210 40% 96.1%)',       // Fondos sutiles
    foreground: 'hsl(215.4 16.3% 46.9%)', // Texto secundario
  },
  
  accent: {
    DEFAULT: 'hsl(210 40% 96.1%)',       // Acentos y hover states
    foreground: 'hsl(222.2 47.4% 11.2%)',
  },
  
  border: 'hsl(214.3 31.8% 91.4%)',      // Bordes
  input: 'hsl(214.3 31.8% 91.4%)',       // Bordes de inputs
  ring: 'hsl(221.2 83.2% 53.3%)',        // Focus ring
  
  // Sistema de tarjetas
  card: {
    DEFAULT: 'hsl(0 0% 100%)',
    foreground: 'hsl(222.2 84% 4.9%)',
  },
  
  popover: {
    DEFAULT: 'hsl(0 0% 100%)',
    foreground: 'hsl(222.2 84% 4.9%)',
  },
};
```

#### Modo Oscuro
```css
/* globals.css */
.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --primary: 217.2 91.2% 59.8%;
  --primary-foreground: 222.2 47.4% 11.2%;
  --secondary: 217.2 32.6% 17.5%;
  --secondary-foreground: 210 40% 98%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 210 40% 98%;
  --success: 142 76% 36%;
  --success-foreground: 0 0% 100%;
  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20.2% 65.1%;
  --accent: 217.2 32.6% 17.5%;
  --accent-foreground: 210 40% 98%;
  --border: 217.2 32.6% 17.5%;
  --input: 217.2 32.6% 17.5%;
  --ring: 224.3 76.3% 48%;
  --card: 222.2 84% 4.9%;
  --card-foreground: 210 40% 98%;
}
```

### 1.2 Tipografía

#### Escala de Fuentes
```typescript
// tailwind.config.js
const fontSize = {
  xs: ['0.75rem', { lineHeight: '1rem' }],      // 12px
  sm: ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
  base: ['1rem', { lineHeight: '1.5rem' }],     // 16px
  lg: ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
  xl: ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
  '2xl': ['1.5rem', { lineHeight: '2rem' }],    // 24px
  '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
  '4xl': ['2.25rem', { lineHeight: '2.5rem' }], // 36px
  '5xl': ['3rem', { lineHeight: '1' }],         // 48px
};

const fontFamily = {
  sans: ['Inter', 'system-ui', 'sans-serif'],
  mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
};

const fontWeight = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};
```

#### Jerarquía de Texto
```typescript
// Componentes de texto estándar
export const Typography = {
  h1: 'scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl',
  h2: 'scroll-m-20 text-3xl font-semibold tracking-tight',
  h3: 'scroll-m-20 text-2xl font-semibold tracking-tight',
  h4: 'scroll-m-20 text-xl font-semibold tracking-tight',
  p: 'leading-7 [&:not(:first-child)]:mt-6',
  lead: 'text-xl text-muted-foreground',
  large: 'text-lg font-semibold',
  small: 'text-sm font-medium leading-none',
  muted: 'text-sm text-muted-foreground',
  code: 'relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold',
};
```

### 1.3 Espaciado y Layout

#### Sistema de Espaciado (múltiplos de 4px)
```typescript
const spacing = {
  0: '0px',
  1: '0.25rem',  // 4px
  2: '0.5rem',   // 8px
  3: '0.75rem',  // 12px
  4: '1rem',     // 16px
  5: '1.25rem',  // 20px
  6: '1.5rem',   // 24px
  8: '2rem',     // 32px
  10: '2.5rem',  // 40px
  12: '3rem',    // 48px
  16: '4rem',    // 64px
  20: '5rem',    // 80px
  24: '6rem',    // 96px
};
```

#### Contenedores
```typescript
// Anchos máximos estándar
const maxWidth = {
  sm: '640px',   // Formularios pequeños
  md: '768px',   // Formularios medianos
  lg: '1024px',  // Tablas y listas
  xl: '1280px',  // Dashboard principal
  '2xl': '1536px', // Pantallas grandes
  full: '100%',
};
```

### 1.4 Sombras y Elevación

```typescript
// tailwind.config.js
const boxShadow = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
};
```

### 1.5 Border Radius

```typescript
const borderRadius = {
  none: '0',
  sm: '0.125rem',   // 2px
  DEFAULT: '0.25rem', // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  full: '9999px',
};
```

---

## 2. Componentes Base (Shadcn)

### 2.1 Botones

#### Variantes y Estados
```typescript
// components/ui/button.tsx - Variantes de Shadcn
const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        success: 'bg-success text-success-foreground hover:bg-success/90',
        warning: 'bg-warning text-warning-foreground hover:bg-warning/90',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);
```

#### Ejemplos de Uso
```tsx
// Botón primario
<Button>Guardar</Button>

// Botón destructivo
<Button variant="destructive">Eliminar</Button>

// Botón outline
<Button variant="outline">Cancelar</Button>

// Botón con icono
<Button size="icon">
  <Plus className="h-4 w-4" />
</Button>

// Botón con loading
<Button disabled={isLoading}>
  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  Guardar
</Button>
```

### 2.2 Inputs y Formularios

#### Input Base
```tsx
// Uso estándar con FormField de Shadcn
<FormField
  control={form.control}
  name="fieldName"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Label</FormLabel>
      <FormControl>
        <Input placeholder="Placeholder" {...field} />
      </FormControl>
      <FormDescription>
        Descripción opcional del campo
      </FormDescription>
      <FormMessage />
    </FormItem>
  )}
/>
```

#### Select
```tsx
<FormField
  control={form.control}
  name="category"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Categoría</FormLabel>
      <Select onValueChange={field.onChange} defaultValue={field.value}>
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder="Seleccione una categoría" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          <SelectItem value="option1">Opción 1</SelectItem>
          <SelectItem value="option2">Opción 2</SelectItem>
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  )}
/>
```

#### Textarea
```tsx
<FormField
  control={form.control}
  name="description"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Descripción</FormLabel>
      <FormControl>
        <Textarea 
          placeholder="Ingrese una descripción"
          className="resize-none"
          {...field}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

#### Checkbox y Switch
```tsx
// Checkbox
<FormField
  control={form.control}
  name="isActive"
  render={({ field }) => (
    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
      <FormControl>
        <Checkbox
          checked={field.value}
          onCheckedChange={field.onChange}
        />
      </FormControl>
      <div className="space-y-1 leading-none">
        <FormLabel>Activo</FormLabel>
        <FormDescription>
          Marcar si el elemento está activo
        </FormDescription>
      </div>
    </FormItem>
  )}
/>

// Switch
<FormField
  control={form.control}
  name="notifications"
  render={({ field }) => (
    <FormItem className="flex flex-row items-center justify-between">
      <div className="space-y-0.5">
        <FormLabel>Notificaciones</FormLabel>
        <FormDescription>
          Recibir notificaciones por email
        </FormDescription>
      </div>
      <FormControl>
        <Switch
          checked={field.value}
          onCheckedChange={field.onChange}
        />
      </FormControl>
    </FormItem>
  )}
/>
```

### 2.3 Tarjetas (Cards)

#### Card Estándar
```tsx
<Card>
  <CardHeader>
    <CardTitle>Título de la Tarjeta</CardTitle>
    <CardDescription>Descripción o subtítulo</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Contenido principal */}
  </CardContent>
  <CardFooter className="flex justify-between">
    <Button variant="outline">Cancelar</Button>
    <Button>Confirmar</Button>
  </CardFooter>
</Card>
```

#### Card de Estadística
```tsx
<Card>
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
    <CardTitle className="text-sm font-medium">
      Total
    </CardTitle>
    <DollarSign className="h-4 w-4 text-muted-foreground" />
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold">$45,231.89</div>
    <p className="text-xs text-muted-foreground">
      +20.1% desde el mes pasado
    </p>
  </CardContent>
</Card>
```

### 2.4 Tablas

#### Tabla Estándar con TanStack Table
```tsx
// Definición de columnas
const columns: ColumnDef<Entity>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Nombre
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }) => {
      const status = row.getValue('status');
      return (
        <Badge variant={status === 'active' ? 'success' : 'secondary'}>
          {status === 'active' ? 'Activo' : 'Inactivo'}
        </Badge>
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <TableActions row={row} />,
  },
];

// Componente de tabla
<div className="rounded-md border">
  <Table>
    <TableHeader>
      {table.getHeaderGroups().map((headerGroup) => (
        <TableRow key={headerGroup.id}>
          {headerGroup.headers.map((header) => (
            <TableHead key={header.id}>
              {flexRender(header.column.columnDef.header, header.getContext())}
            </TableHead>
          ))}
        </TableRow>
      ))}
    </TableHeader>
    <TableBody>
      {table.getRowModel().rows?.length ? (
        table.getRowModel().rows.map((row) => (
          <TableRow key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))
      ) : (
        <TableRow>
          <TableCell colSpan={columns.length} className="h-24 text-center">
            No hay resultados
          </TableCell>
        </TableRow>
      )}
    </TableBody>
  </Table>
</div>
```

### 2.5 Diálogos y Modales

#### Dialog Estándar
```tsx
<Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger asChild>
    <Button>Abrir Dialog</Button>
  </DialogTrigger>
  <DialogContent className="sm:max-w-[425px]">
    <DialogHeader>
      <DialogTitle>Título del Dialog</DialogTitle>
      <DialogDescription>
        Descripción o mensaje explicativo
      </DialogDescription>
    </DialogHeader>
    <div className="grid gap-4 py-4">
      {/* Contenido del dialog */}
    </div>
    <DialogFooter>
      <Button variant="outline" onClick={() => setOpen(false)}>
        Cancelar
      </Button>
      <Button onClick={handleSubmit}>Confirmar</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

#### Alert Dialog (Confirmación)
```tsx
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Eliminar</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
      <AlertDialogDescription>
        Esta acción no se puede deshacer. Esto eliminará permanentemente el registro.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancelar</AlertDialogCancel>
      <AlertDialogAction onClick={handleDelete}>
        Continuar
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### 2.6 Navegación

#### Tabs
```tsx
<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Pestaña 1</TabsTrigger>
    <TabsTrigger value="tab2">Pestaña 2</TabsTrigger>
    <TabsTrigger value="tab3">Pestaña 3</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">
    {/* Contenido de pestaña 1 */}
  </TabsContent>
  <TabsContent value="tab2">
    {/* Contenido de pestaña 2 */}
  </TabsContent>
  <TabsContent value="tab3">
    {/* Contenido de pestaña 3 */}
  </TabsContent>
</Tabs>
```

#### Dropdown Menu
```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon">
      <MoreVertical className="h-4 w-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem onClick={handleView}>
      <Eye className="mr-2 h-4 w-4" />
      Ver
    </DropdownMenuItem>
    <DropdownMenuItem onClick={handleEdit}>
      <Edit className="mr-2 h-4 w-4" />
      Editar
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem 
      onClick={handleDelete}
      className="text-destructive"
    >
      <Trash className="mr-2 h-4 w-4" />
      Eliminar
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### 2.7 Feedback y Estados

#### Toast (Notificaciones)
```tsx
import { toast } from 'sonner';

// Success
toast.success('Operación exitosa', {
  description: 'Los cambios se guardaron correctamente',
});

// Error
toast.error('Error al guardar', {
  description: 'No se pudieron guardar los cambios',
});

// Info
toast.info('Información', {
  description: 'Recuerde completar todos los campos',
});

// Warning
toast.warning('Advertencia', {
  description: 'Esta acción requiere confirmación',
});

// Loading
const toastId = toast.loading('Guardando...');
// Luego actualizar:
toast.success('Guardado exitoso', { id: toastId });
```

#### Alert
```tsx
<Alert>
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Atención</AlertTitle>
  <AlertDescription>
    Este es un mensaje de alerta importante.
  </AlertDescription>
</Alert>

<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>
    Ocurrió un error al procesar la solicitud.
  </AlertDescription>
</Alert>
```

#### Badge
```tsx
<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Destructive</Badge>
<Badge variant="outline">Outline</Badge>

{/* Custom variants */}
<Badge className="bg-success text-success-foreground">Success</Badge>
<Badge className="bg-warning text-warning-foreground">Warning</Badge>
```

#### Skeleton (Loading States)
```tsx
<Card>
  <CardHeader>
    <Skeleton className="h-4 w-[250px]" />
    <Skeleton className="h-4 w-[200px]" />
  </CardHeader>
  <CardContent>
    <div className="space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  </CardContent>
</Card>
```

---

## 3. Componentes Compuestos Personalizados

### 3.1 DataTable (Tabla con Filtros y Paginación)

```tsx
// components/common/DataTable.tsx
interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  onRowClick?: (row: TData) => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = 'Buscar...',
  onRowClick,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    state: { sorting, columnFilters, pagination },
  });

  return (
    <div className="space-y-4">
      {/* Search */}
      {searchKey && (
        <div className="flex items-center justify-between">
          <Input
            placeholder={searchPlaceholder}
            value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ''}
            onChange={(e) =>
              table.getColumn(searchKey)?.setFilterValue(e.target.value)
            }
            className="max-w-sm"
          />
          <div className="text-sm text-muted-foreground">
            {table.getFilteredRowModel().rows.length} registro(s)
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className={onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No hay resultados
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Página {table.getState().pagination.pageIndex + 1} de{' '}
          {table.getPageCount()}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  );
}
```

### 3.2 SearchInput (Input con Búsqueda)

```tsx
// components/common/SearchInput.tsx
interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Buscar...',
  debounceMs = 300,
}: SearchInputProps) {
  const [localValue, setLocalValue] = useState(value);
  const debouncedValue = useDebounce(localValue, debounceMs);

  useEffect(() => {
    onChange(debouncedValue);
  }, [debouncedValue, onChange]);

  return (
    <div className="relative">
      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        className="pl-8"
      />
      {localValue && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-0 top-0 h-full"
          onClick={() => {
            setLocalValue('');
            onChange('');
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
```

### 3.3 DateRangePicker (Selector de Rango de Fechas)

```tsx
// components/common/DateRangePicker.tsx
interface DateRangePickerProps {
  from?: Date;
  to?: Date;
  onSelect: (range: { from?: Date; to?: Date }) => void;
}

export function DateRangePicker({ from, to, onSelect }: DateRangePickerProps) {
  const [date, setDate] = useState<DateRange | undefined>({
    from,
    to,
  });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'justify-start text-left font-normal',
            !date && 'text-muted-foreground'
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date?.from ? (
            date.to ? (
              <>
                {format(date.from, 'dd/MM/yyyy')} -{' '}
                {format(date.to, 'dd/MM/yyyy')}
              </>
            ) : (
              format(date.from, 'dd/MM/yyyy')
            )
          ) : (
            <span>Seleccionar fechas</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          initialFocus
          mode="range"
          defaultMonth={date?.from}
          selected={date}
          onSelect={(range) => {
            setDate(range);
            onSelect(range || {});
          }}
          numberOfMonths={2}
        />
      </PopoverContent>
    </Popover>
  );
}
```

### 3.4 CurrencyInput (Input de Moneda)

```tsx
// components/common/CurrencyInput.tsx
interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  currency?: string;
  placeholder?: string;
}

export function CurrencyInput({
  value,
  onChange,
  currency = 'ARS',
  placeholder = '0.00',
}: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState(
    value ? value.toFixed(2) : ''
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Permitir solo números y punto decimal
    const regex = /^\d*\.?\d{0,2}$/;
    if (regex.test(inputValue) || inputValue === '') {
      setDisplayValue(inputValue);
      onChange(inputValue ? parseFloat(inputValue) : 0);
    }
  };

  const handleBlur = () => {
    if (displayValue) {
      const formatted = parseFloat(displayValue).toFixed(2);
      setDisplayValue(formatted);
    }
  };

  return (
    <div className="relative">
      <span className="absolute left-3 top-2.5 text-muted-foreground">
        $
      </span>
      <Input
        type="text"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        className="pl-7"
      />
    </div>
  );
}
```

### 3.5 EmptyState (Estado Vacío)

```tsx
// components/common/EmptyState.tsx
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      {icon && (
        <div className="mb-4 text-muted-foreground">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
          {description}
        </p>
      )}
      {action && (
        <Button onClick={action.onClick} className="mt-4">
          {action.label}
        </Button>
      )}
    </div>
  );
}

// Uso
<EmptyState
  icon={<Inbox className="h-12 w-12" />}
  title="No hay elementos"
  description="Aún no se han creado elementos. Comience creando uno nuevo."
  action={{
    label: 'Crear nuevo',
    onClick: () => setDialogOpen(true),
  }}
/>
```

### 3.6 LoadingState (Estado de Carga)

```tsx
// components/common/LoadingState.tsx
interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'Cargando...' }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <p className="mt-4 text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
```

### 3.7 ConfirmDialog (Diálogo de Confirmación Reutilizable)

```tsx
// components/common/ConfirmDialog.tsx
interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  variant?: 'default' | 'destructive';
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  variant = 'default',
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={variant === 'destructive' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Uso
const [confirmOpen, setConfirmOpen] = useState(false);

<ConfirmDialog
  open={confirmOpen}
  onOpenChange={setConfirmOpen}
  title="¿Eliminar elemento?"
  description="Esta acción no se puede deshacer. El elemento será eliminado permanentemente."
  confirmText="Eliminar"
  variant="destructive"
  onConfirm={handleDelete}
/>
```

---

## 4. Layouts y Estructura

### 4.1 Layout Principal

```tsx
// components/layout/Layout.tsx
export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-muted/10">
          <div className="container mx-auto px-4 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
```

### 4.2 Header

```tsx
// components/layout/Header.tsx
export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <a href="/" className="mr-6 flex items-center space-x-2">
            <Logo className="h-6 w-6" />
            <span className="font-bold">App Name</span>
          </a>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <SearchInput />
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
```

### 4.3 Sidebar

```tsx
// components/layout/Sidebar.tsx
export function Sidebar() {
  return (
    <aside className="hidden w-64 border-r bg-background md:block">
      <div className="flex h-full flex-col gap-2 py-4">
        <nav className="flex-1 space-y-1 px-2">
          <SidebarLink href="/dashboard" icon={<LayoutDashboard />}>
            Dashboard
          </SidebarLink>
          <SidebarLink href="/entities" icon={<Package />}>
            Entidades
          </SidebarLink>
          <SidebarLink href="/reports" icon={<BarChart />}>
            Reportes
          </SidebarLink>
          <SidebarLink href="/settings" icon={<Settings />}>
            Configuración
          </SidebarLink>
        </nav>
      </div>
    </aside>
  );
}

// components/layout/SidebarLink.tsx
interface SidebarLinkProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function SidebarLink({ href, icon, children }: SidebarLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
    >
      {icon}
      {children}
    </Link>
  );
}
```

### 4.4 Page Header

```tsx
// components/layout/PageHeader.tsx
interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between pb-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// Uso
<PageHeader
  title="Entidades"
  description="Gestione todas sus entidades desde aquí"
  action={
    <Button onClick={() => setDialogOpen(true)}>
      <Plus className="mr-2 h-4 w-4" />
      Nueva Entidad
    </Button>
  }
/>
```

---

## 5. Patrones de Composición

### 5.1 Patrón de Página Lista

```tsx
// pages/EntitiesPage.tsx
export function EntitiesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data, isLoading } = useEntities({ search: searchTerm });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Entidades"
        description="Lista completa de entidades"
        action={<Button>Nueva Entidad</Button>}
      />

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Buscar entidades..."
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <LoadingState />
          ) : data?.length === 0 ? (
            <EmptyState
              icon={<Inbox className="h-12 w-12" />}
              title="No hay entidades"
              description="Cree su primera entidad"
            />
          ) : (
            <DataTable columns={columns} data={data || []} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

### 5.2 Patrón de Página Formulario

```tsx
// pages/EntityFormPage.tsx
export function EntityFormPage() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  
  const { data: entity } = useEntity(id);
  const createMutation = useCreateEntity();
  const updateMutation = useUpdateEntity();

  const form = useForm<EntityDTO>({
    resolver: zodResolver(EntitySchema),
    defaultValues: entity || {},
  });

  const onSubmit = (data: EntityDTO) => {
    if (isEditing) {
      updateMutation.mutate({ id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEditing ? 'Editar Entidad' : 'Nueva Entidad'}
        description={isEditing ? 'Modifique los datos' : 'Complete el formulario'}
      />

      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Campos del formulario */}
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" type="button">
                  Cancelar
                </Button>
                <Button type="submit">
                  {isEditing ? 'Actualizar' : 'Crear'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 5.3 Patrón de Página Dashboard

```tsx
// pages/DashboardPage.tsx
export function DashboardPage() {
  const { data: stats } = useStats();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Resumen general"
      />

      {/* Tarjetas de estadísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total}</div>
            <p className="text-xs text-muted-foreground">
              +20% desde el mes pasado
            </p>
          </CardContent>
        </Card>
        {/* Más tarjetas... */}
      </div>

      {/* Gráficos */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Evolución</CardTitle>
          </CardHeader>
          <CardContent>
            <LineChartComponent data={stats?.chartData || []} />
          </CardContent>
        </Card>
        {/* Más gráficos... */}
      </div>
    </div>
  );
}
```

---

## 6. Estados de UI

### 6.1 Estados de Carga

```tsx
// Skeleton para tarjetas
<Card>
  <CardHeader>
    <Skeleton className="h-4 w-[250px]" />
    <Skeleton className="h-4 w-[200px]" />
  </CardHeader>
  <CardContent>
    <Skeleton className="h-[200px] w-full" />
  </CardContent>
</Card>

// Skeleton para tabla
<div className="space-y-2">
  {[...Array(5)].map((_, i) => (
    <Skeleton key={i} className="h-12 w-full" />
  ))}
</div>

// Skeleton para formulario
<div className="space-y-4">
  <Skeleton className="h-10 w-full" />
  <Skeleton className="h-10 w-full" />
  <Skeleton className="h-20 w-full" />
</div>
```

### 6.2 Estados de Error

```tsx
// components/common/ErrorState.tsx
export function ErrorState({ 
  title = 'Error',
  message,
  retry 
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <AlertCircle className="h-12 w-12 text-destructive" />
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
        {message}
      </p>
      {retry && (
        <Button onClick={retry} className="mt-4" variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Reintentar
        </Button>
      )}
    </div>
  );
}
```

---

## 7. Iconografía

### 7.1 Librería: Lucide React

```bash
npm install lucide-react
```

### 7.2 Iconos Estándar

```typescript
// Iconos comunes por contexto
import {
  // Navegación
  Home, Menu, ChevronLeft, ChevronRight, ChevronDown,
  
  // Acciones
  Plus, Edit, Trash, Save, X, Check, Search,
  
  // Estados
  AlertCircle, CheckCircle, Info, AlertTriangle,
  
  // UI
  Settings, User, LogOut, Bell, Mail,
  
  // Datos
  BarChart, TrendingUp, DollarSign, Calendar,
  
  // Archivos
  FileText, Download, Upload, File,
} from 'lucide-react';
```

### 7.3 Tamaños Estándar

```tsx
// Tamaño por defecto (16px)
<Settings className="h-4 w-4" />

// Tamaño mediano (20px)
<Settings className="h-5 w-5" />

// Tamaño grande (24px)
<Settings className="h-6 w-6" />

// Con color
<Settings className="h-4 w-4 text-muted-foreground" />
<Settings className="h-4 w-4 text-primary" />
<Settings className="h-4 w-4 text-destructive" />
```

---

## 8. Responsive Design

### 8.1 Breakpoints

```typescript
// tailwind.config.js
const screens = {
  sm: '640px',   // Mobile landscape
  md: '768px',   // Tablet
  lg: '1024px',  // Desktop
  xl: '1280px',  // Large desktop
  '2xl': '1536px', // Extra large
};
```

### 8.2 Patrones Responsive

```tsx
// Grid responsivo
<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
  {/* Elementos */}
</div>

// Flex responsivo
<div className="flex flex-col gap-4 md:flex-row">
  {/* Elementos */}
</div>

// Visibilidad condicional
<div className="hidden md:block">
  {/* Visible solo en desktop */}
</div>

<div className="block md:hidden">
  {/* Visible solo en mobile */}
</div>

// Tamaños responsivos
<Card className="w-full md:w-1/2 lg:w-1/3">
  {/* Ancho responsivo */}
</Card>

// Padding/Margin responsivo
<div className="p-4 md:p-6 lg:p-8">
  {/* Padding aumenta con el tamaño */}
</div>
```

---

## 9. Animaciones

### 9.1 Transiciones Estándar

```tsx
// Hover suave
className="transition-colors hover:bg-accent"

// Transición completa
className="transition-all duration-200 ease-in-out"

// Fade in/out
className="animate-in fade-in duration-200"
className="animate-out fade-out duration-200"

// Slide
className="animate-in slide-in-from-top duration-300"
className="animate-in slide-in-from-bottom duration-300"
```

### 9.2 Animaciones de Shadcn

```tsx
// Accordion
<Accordion type="single" collapsible className="w-full">
  <AccordionItem value="item-1">
    <AccordionTrigger>Pregunta 1</AccordionTrigger>
    <AccordionContent>
      Respuesta 1
    </AccordionContent>
  </AccordionItem>
</Accordion>

// Collapsible
<Collapsible>
  <CollapsibleTrigger>Expandir</CollapsibleTrigger>
  <CollapsibleContent>
    Contenido colapsable
  </CollapsibleContent>
</Collapsible>
```

---

## 10. Accesibilidad

### 10.1 Principios

- Todos los elementos interactivos deben ser accesibles por teclado
- Usar aria-labels cuando sea necesario
- Mantener contraste mínimo WCAG AA (4.5:1)
- Proporcionar feedback visual y de screen reader

### 10.2 Implementación

```tsx
// Botón con aria-label
<Button aria-label="Eliminar elemento">
  <Trash className="h-4 w-4" />
</Button>

// Input con label asociado
<div>
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" />
</div>

// Dialog con descripción
<Dialog>
  <DialogContent aria-describedby="dialog-description">
    <DialogHeader>
      <DialogTitle>Título</DialogTitle>
      <DialogDescription id="dialog-description">
        Descripción accesible
      </DialogDescription>
    </DialogHeader>
  </DialogContent>
</Dialog>
```

---

## 11. Mejores Prácticas

### 11.1 Código

- Usar Shadcn components como base, extender cuando sea necesario
- Mantener componentes pequeños y enfocados (< 200 líneas)
- Extraer lógica compleja a custom hooks
- Usar TypeScript para type safety
- Documentar componentes complejos

### 11.2 Estilos

- Usar clases de Tailwind directamente
- Evitar estilos inline excepto para valores dinámicos
- Usar `cn()` helper para combinar clases condicionales
- Mantener consistencia con el sistema de diseño
- Preferir utility classes sobre CSS custom

### 11.3 Rendimiento

- Lazy load componentes pesados
- Virtualizar listas largas
- Optimizar imágenes
- Usar React.memo para componentes que renderizan frecuentemente
- Implementar debounce en búsquedas

### 11.4 Mantenibilidad

- Seguir estructura de carpetas consistente
- Usar nombres descriptivos
- Mantener archivos de componentes organizados
- Reutilizar componentes base
- Documentar props complejas

---

**Documento de estándares UI/UX para desarrollo consistente con Shadcn/ui**
