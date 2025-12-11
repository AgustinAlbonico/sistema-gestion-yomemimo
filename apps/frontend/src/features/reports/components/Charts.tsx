/**
 * Componentes de gráficos para reportes
 */
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    LineChart,
    Line,
    AreaChart,
    Area,
    ComposedChart,
} from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// Paleta de colores para gráficos
const COLORS = [
    '#3b82f6', // blue-500
    '#10b981', // emerald-500
    '#f59e0b', // amber-500
    '#ef4444', // red-500
    '#8b5cf6', // violet-500
    '#ec4899', // pink-500
    '#06b6d4', // cyan-500
    '#84cc16', // lime-500
    '#f97316', // orange-500
    '#6366f1', // indigo-500
];

// Tooltip personalizado
const CustomTooltip = ({ active, payload, label, formatter }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-popover border rounded-lg shadow-lg p-3 text-sm">
                {label && <p className="font-medium mb-1">{label}</p>}
                {payload.map((entry: any, index: number) => (
                    <p key={index} style={{ color: entry.color }} className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                        {entry.name}: {formatter ? formatter(entry.value) : entry.value}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

// ============================================
// GRÁFICO DE TORTA
// ============================================

interface PieChartData {
    name: string;
    value: number;
    [key: string]: string | number;
}

interface PieChartCardProps {
    title: string;
    data: PieChartData[];
    isLoading?: boolean;
    valueFormatter?: (value: number) => string;
}

export function PieChartCard({ title, data, isLoading, valueFormatter = formatCurrency }: PieChartCardProps) {
    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">{title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-[250px] w-full" />
                </CardContent>
            </Card>
        );
    }

    const total = data.reduce((sum, item) => sum + item.value, 0);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                {data.length === 0 || total === 0 ? (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                        Sin datos para mostrar
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={2}
                                dataKey="value"
                                label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                                labelLine={false}
                            >
                                {data.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip formatter={valueFormatter} />} />
                        </PieChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    );
}

// ============================================
// GRÁFICO DE BARRAS
// ============================================

interface BarChartData {
    name: string;
    value: number;
    [key: string]: string | number;
}

interface BarChartCardProps {
    title: string;
    data: BarChartData[];
    dataKey?: string;
    isLoading?: boolean;
    valueFormatter?: (value: number) => string;
    color?: string;
    layout?: 'horizontal' | 'vertical';
}

export function BarChartCard({
    title,
    data,
    dataKey = 'value',
    isLoading,
    valueFormatter = formatCurrency,
    color = '#3b82f6',
    layout = 'horizontal',
}: BarChartCardProps) {
    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">{title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-[250px] w-full" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                {data.length === 0 ? (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                        Sin datos para mostrar
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart
                            data={data}
                            layout={layout === 'vertical' ? 'vertical' : 'horizontal'}
                            margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            {layout === 'vertical' ? (
                                <>
                                    <XAxis type="number" tickFormatter={(v) => valueFormatter(v)} />
                                    <YAxis type="category" dataKey="name" width={100} />
                                </>
                            ) : (
                                <>
                                    <XAxis dataKey="name" />
                                    <YAxis tickFormatter={(v) => valueFormatter(v)} />
                                </>
                            )}
                            <Tooltip content={<CustomTooltip formatter={valueFormatter} />} />
                            <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    );
}

// ============================================
// GRÁFICO DE LÍNEAS
// ============================================

interface LineChartData {
    name: string;
    [key: string]: string | number;
}

interface LineChartCardProps {
    title: string;
    data: LineChartData[];
    lines: { dataKey: string; color: string; name: string }[];
    isLoading?: boolean;
    valueFormatter?: (value: number) => string;
}

export function LineChartCard({
    title,
    data,
    lines,
    isLoading,
    valueFormatter = formatCurrency,
}: LineChartCardProps) {
    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">{title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-[250px] w-full" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                {data.length === 0 ? (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                        Sin datos para mostrar
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={data} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="name" />
                            <YAxis tickFormatter={(v) => valueFormatter(v)} />
                            <Tooltip content={<CustomTooltip formatter={valueFormatter} />} />
                            <Legend />
                            {lines.map((line) => (
                                <Line
                                    key={line.dataKey}
                                    type="monotone"
                                    dataKey={line.dataKey}
                                    name={line.name}
                                    stroke={line.color}
                                    strokeWidth={2}
                                    dot={{ fill: line.color, strokeWidth: 2 }}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    );
}

// ============================================
// GRÁFICO DE ÁREA
// ============================================

interface AreaChartCardProps {
    title: string;
    data: LineChartData[];
    areas: { dataKey: string; color: string; name: string }[];
    isLoading?: boolean;
    valueFormatter?: (value: number) => string;
}

export function AreaChartCard({
    title,
    data,
    areas,
    isLoading,
    valueFormatter = formatCurrency,
}: AreaChartCardProps) {
    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">{title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-[250px] w-full" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                {data.length === 0 ? (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                        Sin datos para mostrar
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={data} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="name" />
                            <YAxis tickFormatter={(v) => valueFormatter(v)} />
                            <Tooltip content={<CustomTooltip formatter={valueFormatter} />} />
                            <Legend />
                            {areas.map((area) => (
                                <Area
                                    key={area.dataKey}
                                    type="monotone"
                                    dataKey={area.dataKey}
                                    name={area.name}
                                    stroke={area.color}
                                    fill={area.color}
                                    fillOpacity={0.3}
                                />
                            ))}
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    );
}

// ============================================
// GRÁFICO COMBINADO (BARRAS + LÍNEA)
// ============================================

interface ComposedChartCardProps {
    title: string;
    data: LineChartData[];
    bars: { dataKey: string; color: string; name: string }[];
    lines: { dataKey: string; color: string; name: string }[];
    isLoading?: boolean;
    valueFormatter?: (value: number) => string;
}

export function ComposedChartCard({
    title,
    data,
    bars,
    lines,
    isLoading,
    valueFormatter = formatCurrency,
}: ComposedChartCardProps) {
    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">{title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-[300px] w-full" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                {data.length === 0 ? (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        Sin datos para mostrar
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={300}>
                        <ComposedChart data={data} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="name" />
                            <YAxis tickFormatter={(v) => valueFormatter(v)} />
                            <Tooltip content={<CustomTooltip formatter={valueFormatter} />} />
                            <Legend />
                            {bars.map((bar) => (
                                <Bar
                                    key={bar.dataKey}
                                    dataKey={bar.dataKey}
                                    name={bar.name}
                                    fill={bar.color}
                                    radius={[4, 4, 0, 0]}
                                />
                            ))}
                            {lines.map((line) => (
                                <Line
                                    key={line.dataKey}
                                    type="monotone"
                                    dataKey={line.dataKey}
                                    name={line.name}
                                    stroke={line.color}
                                    strokeWidth={2}
                                />
                            ))}
                        </ComposedChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    );
}
