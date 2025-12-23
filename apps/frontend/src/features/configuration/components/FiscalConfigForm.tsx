/**
 * Formulario de configuración fiscal AFIP
 * Permite configurar datos del emisor, certificados y entorno
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
    Building2,
    FileKey,
    Upload,
    Trash2,
    CheckCircle2,
    AlertCircle,
    Loader2,
    TestTube,
    Shield,
    FileDown,
    Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NumericInput } from '@/components/ui/numeric-input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { fiscalApi } from '../api/fiscal.api';
import {
    IvaCondition,
    IvaConditionLabels,
    AfipEnvironment,
    AfipEnvironmentLabels,
    UpdateEmitterDataDTO,
} from '../types/fiscal';

export function FiscalConfigForm() {
    const queryClient = useQueryClient();
    const [isTestingConnection, setIsTestingConnection] = useState(false);
    const [generatedCertData, setGeneratedCertData] = useState<{
        environment: AfipEnvironment;
        csr: string;
        privateKey: string;
        instructions: string;
    } | null>(null);

    // Query de configuración
    const { data: config, isLoading } = useQuery({
        queryKey: ['fiscal-config'],
        queryFn: fiscalApi.getConfiguration,
    });

    // Form de datos del emisor
    const form = useForm<UpdateEmitterDataDTO>({
        defaultValues: {
            businessName: '',
            cuit: '',
            grossIncome: '',
            activityStartDate: '',
            businessAddress: '',
            ivaCondition: IvaCondition.RESPONSABLE_MONOTRIBUTO,
            pointOfSale: 1,
        },
        values: config ? {
            businessName: config.businessName || '',
            cuit: config.cuit || '',
            grossIncome: config.grossIncome || '',
            activityStartDate: config.activityStartDate?.split('T')[0] || '',
            businessAddress: config.businessAddress || '',
            ivaCondition: config.ivaCondition,
            pointOfSale: config.pointOfSale,
        } : undefined,
    });

    // Mutación para actualizar datos del emisor
    const updateMutation = useMutation({
        mutationFn: fiscalApi.updateEmitterData,
        onSuccess: () => {
            toast.success('Configuración guardada');
            queryClient.invalidateQueries({ queryKey: ['fiscal-config'] });
        },
        onError: (error: Error) => {
            toast.error('Error al guardar', { description: error.message });
        },
    });

    // Mutación para cambiar entorno
    const environmentMutation = useMutation({
        mutationFn: fiscalApi.setEnvironment,
        onSuccess: (data) => {
            toast.success(`Entorno cambiado a ${AfipEnvironmentLabels[data.afipEnvironment]}`);
            queryClient.invalidateQueries({ queryKey: ['fiscal-config'] });
        },
        onError: (error: Error) => {
            toast.error('Error al cambiar entorno', { description: error.message });
        },
    });

    // Mutación para eliminar certificados
    const deleteCertsMutation = useMutation({
        mutationFn: fiscalApi.deleteCertificates,
        onSuccess: () => {
            toast.success('Certificados eliminados');
            queryClient.invalidateQueries({ queryKey: ['fiscal-config'] });
        },
        onError: (error: Error) => {
            toast.error('Error al eliminar', { description: error.message });
        },
    });

    // Mutación para generar certificados
    const generateCertMutation = useMutation({
        mutationFn: fiscalApi.generateCertificate,
        onSuccess: (data) => {
            setGeneratedCertData({
                environment: data.environment,
                csr: data.csr,
                privateKey: data.privateKey,
                instructions: data.instructions,
            });
            toast.success('Certificados generados exitosamente');
        },
        onError: (error: Error) => {
            toast.error('Error al generar certificados', { description: error.message });
        },
    });

    // Test de conexión
    const handleTestConnection = async () => {
        setIsTestingConnection(true);
        try {
            const result = await fiscalApi.testConnection();
            if (result.success) {
                toast.success('Conexión exitosa', { description: result.message });
            } else {
                toast.error('Conexión fallida', { description: result.message });
            }
        } catch {
            toast.error('Error al probar conexión');
        } finally {
            setIsTestingConnection(false);
        }
    };

    // Generar certificados
    const handleGenerateCertificate = (environment: AfipEnvironment) => {
        generateCertMutation.mutate(environment);
    };

    // Descargar archivo
    const downloadFile = (content: string, filename: string) => {
        const blob = new Blob([atob(content)], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };

    // Subir certificados
    const handleUploadCertificates = async (environment: AfipEnvironment, certFile: File, keyFile: File) => {
        try {
            // Leer archivos como Base64
            const certBase64 = await fileToBase64(certFile);
            const keyBase64 = await fileToBase64(keyFile);

            await fiscalApi.uploadCertificates({
                environment,
                certificate: certBase64,
                privateKey: keyBase64,
            });

            toast.success('Certificados subidos correctamente');
            queryClient.invalidateQueries({ queryKey: ['fiscal-config'] });
        } catch (error) {
            toast.error('Error al subir certificados', {
                description: (error as Error).message,
            });
        }
    };

    const handleSubmit = (data: UpdateEmitterDataDTO) => {
        updateMutation.mutate(data);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Estado general */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                Estado de Facturación
                            </CardTitle>
                            <CardDescription>
                                Estado actual de la configuración AFIP
                            </CardDescription>
                        </div>
                        <Badge
                            variant={config?.isConfigured ? 'default' : 'secondary'}
                            className={config?.isConfigured ? 'bg-green-500' : ''}
                        >
                            {config?.isConfigured ? 'Configurado' : 'Pendiente'}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-muted rounded-lg">
                            <p className="text-2xl font-bold">
                                {config?.afipEnvironment === AfipEnvironment.PRODUCCION ? '🟢' : '🟡'}
                            </p>
                            <p className="text-sm text-muted-foreground">Entorno</p>
                            <p className="font-medium">
                                {config?.afipEnvironment === AfipEnvironment.PRODUCCION
                                    ? 'Producción'
                                    : 'Homologación'}
                            </p>
                        </div>
                        <div className="text-center p-4 bg-muted rounded-lg">
                            <p className="text-2xl font-bold">
                                {config?.homologacionReady ? '✅' : '❌'}
                            </p>
                            <p className="text-sm text-muted-foreground">Cert. Homologación</p>
                            <p className="font-medium">
                                {config?.homologacionReady ? 'Listo' : 'No configurado'}
                            </p>
                        </div>
                        <div className="text-center p-4 bg-muted rounded-lg">
                            <p className="text-2xl font-bold">
                                {config?.produccionReady ? '✅' : '❌'}
                            </p>
                            <p className="text-sm text-muted-foreground">Cert. Producción</p>
                            <p className="font-medium">
                                {config?.produccionReady ? 'Listo' : 'No configurado'}
                            </p>
                        </div>
                        <div className="text-center p-4 bg-muted rounded-lg">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleTestConnection}
                                disabled={isTestingConnection}
                            >
                                {isTestingConnection ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    <TestTube className="h-4 w-4 mr-2" />
                                )}
                                Probar Conexión
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Datos del emisor */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Datos del Emisor
                    </CardTitle>
                    <CardDescription>
                        Información del negocio para las facturas
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="businessName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Razón Social <span className="text-red-500">*</span></FormLabel>
                                            <FormControl>
                                                <Input placeholder="Mi Negocio S.A." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="cuit"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>CUIT <span className="text-red-500">*</span></FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="20123456789"
                                                    maxLength={11}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormDescription>11 dígitos sin guiones</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="businessAddress"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Domicilio Comercial <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <Input placeholder="Av. Corrientes 1234, CABA" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormField
                                    control={form.control}
                                    name="ivaCondition"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Condición IVA</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                value={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {Object.values(IvaCondition)
                                                        .filter(v => v !== IvaCondition.CONSUMIDOR_FINAL)
                                                        .map((condition) => (
                                                            <SelectItem key={condition} value={condition}>
                                                                {IvaConditionLabels[condition]}
                                                            </SelectItem>
                                                        ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="grossIncome"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Ingresos Brutos</FormLabel>
                                            <FormControl>
                                                <Input placeholder="12345678" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="pointOfSale"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Punto de Venta</FormLabel>
                                            <FormControl>
                                                <NumericInput
                                                    allowDecimals={false}
                                                    value={field.value}
                                                    onChange={(e) => field.onChange(Number.parseInt(e.target.value) || 1)}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="activityStartDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Fecha Inicio Actividades</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex justify-end">
                                <Button type="submit" disabled={updateMutation.isPending}>
                                    {updateMutation.isPending && (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    )}
                                    Guardar Datos
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            {/* Entorno y Certificados */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileKey className="h-5 w-5" />
                        Entorno y Certificados AFIP
                    </CardTitle>
                    <CardDescription>
                        Configuración de certificados para homologación y producción
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Selector de entorno */}
                    <div>
                        <Label>Entorno Activo</Label>
                        <Select
                            value={config?.afipEnvironment}
                            onValueChange={(value) => environmentMutation.mutate(value as AfipEnvironment)}
                        >
                            <SelectTrigger className="w-[300px] mt-2">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.values(AfipEnvironment).map((env) => (
                                    <SelectItem key={env} value={env}>
                                        {AfipEnvironmentLabels[env]}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-sm text-muted-foreground mt-1">
                            El entorno activo determina qué certificados se usan para facturar
                        </p>
                    </div>

                    <Separator />

                    {/* Certificados por entorno */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Homologación */}
                        <CertificateCard
                            title="Homologación (Testing)"
                            environment={AfipEnvironment.HOMOLOGACION}
                            isReady={config?.homologacionReady || false}
                            uploadedAt={config?.homologacionUploadedAt}
                            expiresAt={config?.homologacionExpiresAt}
                            fingerprint={config?.homologacionFingerprint}
                            isActive={config?.afipEnvironment === AfipEnvironment.HOMOLOGACION}
                            onUpload={(cert, key) => handleUploadCertificates(AfipEnvironment.HOMOLOGACION, cert, key)}
                            onGenerate={() => handleGenerateCertificate(AfipEnvironment.HOMOLOGACION)}
                            onDelete={() => deleteCertsMutation.mutate(AfipEnvironment.HOMOLOGACION)}
                            isDeleting={deleteCertsMutation.isPending}
                            isGenerating={generateCertMutation.isPending}
                            disabled={!config?.businessName || !config?.cuit}
                            disabledReason="Complete Razón Social y CUIT para generar"
                        />

                        {/* Producción */}
                        <CertificateCard
                            title="Producción"
                            environment={AfipEnvironment.PRODUCCION}
                            isReady={config?.produccionReady || false}
                            uploadedAt={config?.produccionUploadedAt}
                            expiresAt={config?.produccionExpiresAt}
                            fingerprint={config?.produccionFingerprint}
                            isActive={config?.afipEnvironment === AfipEnvironment.PRODUCCION}
                            onUpload={(cert, key) => handleUploadCertificates(AfipEnvironment.PRODUCCION, cert, key)}
                            onGenerate={() => handleGenerateCertificate(AfipEnvironment.PRODUCCION)}
                            onDelete={() => deleteCertsMutation.mutate(AfipEnvironment.PRODUCCION)}
                            isDeleting={deleteCertsMutation.isPending}
                            isGenerating={generateCertMutation.isPending}
                            disabled={!config?.businessName || !config?.cuit}
                            disabledReason="Complete Razón Social y CUIT para generar"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Diálogo de instrucciones */}
            <Dialog open={!!generatedCertData} onOpenChange={() => setGeneratedCertData(null)}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            Certificados Generados Exitosamente
                        </DialogTitle>
                        <DialogDescription>
                            Los certificados han sido generados. Descargue los archivos y siga las instrucciones a continuación.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                        {/* Botones de descarga */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Button
                                onClick={() => {
                                    if (generatedCertData) {
                                        downloadFile(generatedCertData.csr, `afip_${generatedCertData.environment}.csr`);
                                    }
                                }}
                                className="w-full"
                            >
                                <FileDown className="h-4 w-4 mr-2" />
                                Descargar CSR (.csr)
                            </Button>
                            <Button
                                onClick={() => {
                                    if (generatedCertData) {
                                        downloadFile(generatedCertData.privateKey, `afip_${generatedCertData.environment}.key`);
                                    }
                                }}
                                variant="outline"
                                className="w-full"
                            >
                                <FileDown className="h-4 w-4 mr-2" />
                                Descargar Clave Privada (.key)
                            </Button>
                        </div>

                        <Separator />

                        {/* Instrucciones */}
                        <div className="bg-muted p-4 rounded-lg">
                            <h4 className="font-semibold mb-2">Instrucciones</h4>
                            <pre className="text-sm whitespace-pre-wrap font-mono text-muted-foreground">
                                {generatedCertData?.instructions}
                            </pre>
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setGeneratedCertData(null)}>
                                Cerrar
                            </Button>
                            <Button onClick={() => {
                                setGeneratedCertData(null);
                                queryClient.invalidateQueries({ queryKey: ['fiscal-config'] });
                            }}>
                                Entendido
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

/**
 * Card de certificados por entorno
 */
interface CertificateCardProps {
    readonly title: string;
    readonly environment: AfipEnvironment;
    readonly isReady: boolean;
    readonly uploadedAt?: string | null;
    readonly expiresAt?: string | null;
    readonly fingerprint?: string | null;
    readonly isActive: boolean;
    readonly onUpload: (cert: File, key: File) => void;
    readonly onGenerate: () => void;
    readonly onDelete: () => void;
    readonly isDeleting: boolean;
    readonly isGenerating: boolean;
    readonly disabled?: boolean;
    readonly disabledReason?: string;
}

function CertificateCard({
    title,
    environment,
    isReady,
    uploadedAt,
    expiresAt,
    fingerprint,
    isActive,
    onUpload,
    onGenerate,
    onDelete,
    isDeleting,
    isGenerating,
    disabled,
    disabledReason,
}: CertificateCardProps) {
    const [certText, setCertText] = useState<string>('');
    const [keyText, setKeyText] = useState<string>('');
    const [isUploading, setIsUploading] = useState(false);

    const handleUpload = async () => {
        if (!certText.trim() || !keyText.trim()) return;
        setIsUploading(true);
        try {
            // Convertir el texto a File objects simulados para mantener compatibilidad
            const certBlob = new Blob([certText], { type: 'text/plain' });
            const keyBlob = new Blob([keyText], { type: 'text/plain' });
            const certFile = new File([certBlob], 'certificate.crt');
            const keyFile = new File([keyBlob], 'private.key');

            await onUpload(certFile, keyFile);
            // Limpiar campos después de subir
            setCertText('');
            setKeyText('');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className={`p-4 border rounded-lg ${isActive ? 'border-primary bg-primary/5' : ''}`}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <h4 className="font-medium">{title}</h4>
                    {isActive && (
                        <Badge variant="outline" className="text-xs">
                            Activo
                        </Badge>
                    )}
                </div>
                {isReady ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                    <AlertCircle className="h-5 w-5 text-muted-foreground" />
                )}
            </div>

            {isReady ? (
                <div className="space-y-2 text-sm">
                    {uploadedAt && (
                        <p className="text-muted-foreground">
                            Subido: {new Date(uploadedAt).toLocaleDateString('es-AR')}
                        </p>
                    )}
                    {expiresAt && (
                        <p className="text-muted-foreground">
                            Vence: {new Date(expiresAt).toLocaleDateString('es-AR')}
                        </p>
                    )}
                    {fingerprint && (
                        <p className="text-muted-foreground font-mono text-xs truncate">
                            {fingerprint.slice(0, 16)}...
                        </p>
                    )}
                    <div className="flex gap-2 mt-4">
                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={onDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Trash2 className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                </div>
            ) : (
                <div>
                    <p className="text-sm text-muted-foreground mb-4">
                        No hay certificados configurados
                    </p>
                    <div className="flex flex-col gap-4">
                        <div title={disabledReason}>
                            <Button
                                size="sm"
                                onClick={onGenerate}
                                disabled={isGenerating || disabled}
                                className="w-full"
                            >
                                {isGenerating ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                ) : (
                                    <Sparkles className="h-4 w-4 mr-1" />
                                )}
                                Generar Certificados
                            </Button>
                        </div>
                        {disabled && (
                            <p className="text-xs text-destructive mt-1">
                                {disabledReason}
                            </p>
                        )}

                        <Separator className="my-2" />

                        <div className="space-y-3">
                            <p className="text-sm font-medium">O pegar certificados existentes:</p>

                            <div className="space-y-1">
                                <Label htmlFor={`cert-${environment}`} className="text-xs">
                                    Certificado (.crt)
                                </Label>
                                <textarea
                                    id={`cert-${environment}`}
                                    value={certText}
                                    onChange={(e) => setCertText(e.target.value)}
                                    placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                                    className="w-full min-h-[120px] p-2 text-xs font-mono border rounded-md resize-y"
                                />
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor={`key-${environment}`} className="text-xs">
                                    Clave Privada (.key)
                                </Label>
                                <textarea
                                    id={`key-${environment}`}
                                    value={keyText}
                                    onChange={(e) => setKeyText(e.target.value)}
                                    placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
                                    className="w-full min-h-[120px] p-2 text-xs font-mono border rounded-md resize-y"
                                />
                            </div>

                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleUpload}
                                className="w-full"
                                disabled={!certText.trim() || !keyText.trim() || isUploading}
                            >
                                {isUploading ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                ) : (
                                    <Upload className="h-4 w-4 mr-1" />
                                )}
                                Subir Certificados
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/**
 * Convierte un archivo a Base64
 */
function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            // Remover el prefijo "data:...;base64,"
            const base64 = result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = (error) => reject(error);
    });
}
