# Módulo: Ventas

## 1. Descripción y Objetivo

### 1.1 Descripción
El módulo de Ventas es el núcleo del sistema comercial. Permite registrar ventas de productos con múltiples formas de pago (efectivo, tarjeta, transferencia), gestionar ventas en cuenta corriente, aplicar descuentos, y controlar el stock automáticamente. Incluye un punto de venta (POS) optimizado para operaciones rápidas.

**Facturación Fiscal**: El módulo soporta tanto ventas fiscales (con factura electrónica AFIP) como ventas no fiscales (recibos internos). La configuración fiscal se realiza desde el módulo de configuración del sistema.

### 1.2 Objetivo
- Registrar ventas de manera rápida y eficiente
- Soportar múltiples formas de pago (efectivo, tarjeta, mixto)
- Actualizar inventario automáticamente
- Gestionar ventas en cuenta corriente
- Soportar ventas con cuotas (tarjeta)
- **Generar facturas electrónicas con AFIP (Factura C para Monotributistas, A/B para Responsables Inscriptos)**
- **Generar recibos internos para ventas no fiscales**
- Facilitar reportes de ventas
- **Preparar datos para el módulo de Caja (control de ingresos/egresos)**

### 1.3 Funcionalidades Principales
- Punto de venta (POS) con búsqueda rápida de productos
- Registro de ventas con múltiples items
- Múltiples formas de pago en una sola venta
- Descuentos por item o total
- Ventas en cuenta corriente
- Ventas con cuotas
- Actualización automática de inventario
- **Ventas fiscales con factura electrónica AFIP**
- **Ventas no fiscales con recibo interno**
- **Generación de PDF (Factura C / Recibo)**
- **Código QR en facturas según especificaciones AFIP**
- Historial completo de ventas
- Estadísticas y reportes

---

## 2. Configuración Fiscal (Módulo de Configuración)

### 2.1 Datos del Emisor (Negocio)

La configuración fiscal se almacena en el módulo de configuración existente. Se requieren los siguientes campos:

```typescript
// Configuración fiscal en el módulo de configuración
interface FiscalConfiguration {
  // === DATOS DEL EMISOR ===
  businessName: string;           // Razón social
  cuit: string;                   // CUIT del emisor (11 dígitos)
  grossIncome: string;            // Número de Ingresos Brutos
  activityStartDate: Date;        // Fecha de inicio de actividades
  businessAddress: string;        // Domicilio comercial
  
  // Condición frente al IVA
  ivaCondition: IvaCondition;     // Configurable desde el sistema
  
  // Punto de venta AFIP
  pointOfSale: number;            // Número de punto de venta (1-5 dígitos)
  
  // === CONFIGURACIÓN DE ENTORNO AFIP ===
  afipEnvironment: AfipEnvironment;  // Entorno activo (homologación o producción)
  
  // Certificados por entorno (cifrados en DB)
  afipCertificates: AfipCertificates;
}

enum IvaCondition {
  RESPONSABLE_INSCRIPTO = 'responsable_inscripto',
  MONOTRIBUTO = 'monotributo',
  EXENTO = 'exento',
  NO_RESPONSABLE = 'no_responsable'
}

enum AfipEnvironment {
  HOMOLOGACION = 'homologacion',  // Testing
  PRODUCCION = 'produccion'       // Producción real
}
```

### 2.2 Configuración de Certificados AFIP

Los certificados de AFIP se pueden configurar **por entorno** (homologación y producción), permitiendo tener ambos configurados y cambiar entre ellos fácilmente.

#### Almacenamiento de Certificados

**Opción recomendada**: Guardar en base de datos con cifrado AES-256.

```typescript
interface AfipCertificates {
  // Certificados de HOMOLOGACIÓN (testing)
  homologacion: AfipCertificateSet | null;
  
  // Certificados de PRODUCCIÓN
  produccion: AfipCertificateSet | null;
}

interface AfipCertificateSet {
  // Certificado público (.crt) - cifrado AES-256
  certificate: string;          // Contenido del .crt cifrado en Base64
  
  // Clave privada (.key) - cifrado AES-256
  privateKey: string;           // Contenido del .key cifrado en Base64
  
  // Metadatos
  uploadedAt: Date;             // Fecha de carga
  expiresAt: Date | null;       // Fecha de expiración del certificado
  fingerprint: string;          // Hash SHA-256 para identificar el certificado
}
```

#### Seguridad de Certificados

```typescript
// La clave de cifrado NUNCA se guarda en la DB
// Se obtiene de variable de entorno
const ENCRYPTION_KEY = process.env.AFIP_ENCRYPTION_KEY; // 32 bytes para AES-256

// Servicio de cifrado
@Injectable()
export class CertificateEncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor(private configService: ConfigService) {
    const keyBase64 = this.configService.get<string>('AFIP_ENCRYPTION_KEY');
    if (!keyBase64) {
      throw new Error('AFIP_ENCRYPTION_KEY no configurada');
    }
    this.key = Buffer.from(keyBase64, 'base64');
  }

  /**
   * Cifra el contenido del certificado antes de guardarlo en DB
   */
  encrypt(plainText: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    
    let encrypted = cipher.update(plainText, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    const authTag = cipher.getAuthTag();
    
    // Formato: iv:authTag:encryptedData (todo en Base64)
    return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
  }

  /**
   * Descifra el contenido del certificado para usarlo
   */
  decrypt(encryptedData: string): string {
    const [ivBase64, authTagBase64, encrypted] = encryptedData.split(':');
    
    const iv = Buffer.from(ivBase64, 'base64');
    const authTag = Buffer.from(authTagBase64, 'base64');
    
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
```

### 2.3 Entidad de Configuración AFIP

```typescript
@Entity('afip_configuration')
export class AfipConfiguration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // === DATOS DEL EMISOR ===
  @Column({ type: 'varchar', length: 200 })
  businessName: string;

  @Column({ type: 'varchar', length: 11 })
  cuit: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  grossIncome: string;

  @Column({ type: 'date', nullable: true })
  activityStartDate: Date;

  @Column({ type: 'varchar', length: 300 })
  businessAddress: string;

  @Column({ type: 'enum', enum: IvaCondition })
  ivaCondition: IvaCondition;

  @Column({ type: 'int' })
  pointOfSale: number;

  // === ENTORNO ACTIVO ===
  @Column({ type: 'enum', enum: AfipEnvironment, default: AfipEnvironment.HOMOLOGACION })
  activeEnvironment: AfipEnvironment;

  // === CERTIFICADOS HOMOLOGACIÓN ===
  @Column({ type: 'text', nullable: true })
  homoCertificate: string;  // Cifrado AES-256

  @Column({ type: 'text', nullable: true })
  homoPrivateKey: string;   // Cifrado AES-256

  @Column({ type: 'timestamp', nullable: true })
  homoCertUploadedAt: Date;

  @Column({ type: 'date', nullable: true })
  homoCertExpiresAt: Date;

  @Column({ type: 'varchar', length: 64, nullable: true })
  homoCertFingerprint: string;

  // === CERTIFICADOS PRODUCCIÓN ===
  @Column({ type: 'text', nullable: true })
  prodCertificate: string;  // Cifrado AES-256

  @Column({ type: 'text', nullable: true })
  prodPrivateKey: string;   // Cifrado AES-256

  @Column({ type: 'timestamp', nullable: true })
  prodCertUploadedAt: Date;

  @Column({ type: 'date', nullable: true })
  prodCertExpiresAt: Date;

  @Column({ type: 'varchar', length: 64, nullable: true })
  prodCertFingerprint: string;

  // === ESTADO DE CONEXIÓN ===
  @Column({ type: 'timestamp', nullable: true })
  lastConnectionTest: Date;

  @Column({ type: 'boolean', default: false })
  lastConnectionSuccess: boolean;

  @Column({ type: 'text', nullable: true })
  lastConnectionError: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### 2.4 UI de Configuración AFIP (Frontend)

```tsx
// Componente de configuración AFIP
export function AfipConfigurationForm() {
  const [environment, setEnvironment] = useState<'homologacion' | 'produccion'>('homologacion');
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración AFIP</CardTitle>
        <CardDescription>
          Configure los datos fiscales y certificados para facturación electrónica
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Datos del Emisor */}
        <section className="space-y-4">
          <h3 className="text-lg font-semibold">Datos del Emisor</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <FormField name="businessName" label="Razón Social" required />
            <FormField name="cuit" label="CUIT" placeholder="20-12345678-9" required />
            <FormField name="grossIncome" label="Ingresos Brutos" />
            <FormField name="activityStartDate" label="Inicio de Actividades" type="date" />
            <FormField name="businessAddress" label="Domicilio Comercial" className="col-span-2" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField name="ivaCondition" label="Condición frente al IVA" required>
              <Select>
                <SelectItem value="monotributo">Monotributo</SelectItem>
                <SelectItem value="responsable_inscripto">Responsable Inscripto</SelectItem>
                <SelectItem value="exento">IVA Exento</SelectItem>
              </Select>
            </FormField>
            
            <FormField name="pointOfSale" label="Punto de Venta" type="number" required />
          </div>
        </section>

        <Separator />

        {/* Configuración de Entorno */}
        <section className="space-y-4">
          <h3 className="text-lg font-semibold">Entorno AFIP</h3>
          
          <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
            <Label>Entorno Activo:</Label>
            <RadioGroup value={environment} onValueChange={setEnvironment}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="homologacion" id="homo" />
                <Label htmlFor="homo" className="flex items-center gap-2">
                  <TestTube className="h-4 w-4 text-yellow-500" />
                  Homologación (Testing)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="produccion" id="prod" />
                <Label htmlFor="prod" className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-green-500" />
                  Producción
                </Label>
              </div>
            </RadioGroup>
          </div>

          {environment === 'produccion' && (
            <Alert variant="warning">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Atención:</strong> En producción las facturas son reales y 
                tienen validez fiscal. Asegúrese de que los datos sean correctos.
              </AlertDescription>
            </Alert>
          )}
        </section>

        <Separator />

        {/* Certificados por Entorno */}
        <section className="space-y-4">
          <h3 className="text-lg font-semibold">Certificados</h3>
          
          <Tabs defaultValue="homologacion">
            <TabsList>
              <TabsTrigger value="homologacion" className="flex items-center gap-2">
                <TestTube className="h-4 w-4" />
                Homologación
              </TabsTrigger>
              <TabsTrigger value="produccion" className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Producción
              </TabsTrigger>
            </TabsList>

            <TabsContent value="homologacion">
              <CertificateUploader 
                environment="homologacion"
                certificate={config.homoCertificate}
                onUpload={handleCertificateUpload}
              />
            </TabsContent>

            <TabsContent value="produccion">
              <CertificateUploader 
                environment="produccion"
                certificate={config.prodCertificate}
                onUpload={handleCertificateUpload}
              />
            </TabsContent>
          </Tabs>
        </section>

        <Separator />

        {/* Test de Conexión */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Test de Conexión</h3>
            <Button variant="outline" onClick={testConnection}>
              <Wifi className="mr-2 h-4 w-4" />
              Probar Conexión
            </Button>
          </div>
          
          {connectionStatus && (
            <Alert variant={connectionStatus.success ? 'success' : 'destructive'}>
              {connectionStatus.success ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Conexión exitosa con AFIP ({environment}).
                    Último test: {formatDate(connectionStatus.lastTest)}
                  </AlertDescription>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    Error de conexión: {connectionStatus.error}
                  </AlertDescription>
                </>
              )}
            </Alert>
          )}
        </section>
      </CardContent>
    </Card>
  );
}

// Componente para subir certificados
function CertificateUploader({ environment, certificate, onUpload }) {
  const [files, setFiles] = useState({ cert: null, key: null });

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <div className="grid grid-cols-2 gap-4">
        {/* Certificado .crt */}
        <div className="space-y-2">
          <Label>Certificado (.crt)</Label>
          <div className="flex items-center gap-2">
            <Input 
              type="file" 
              accept=".crt,.pem"
              onChange={(e) => setFiles({ ...files, cert: e.target.files[0] })}
            />
          </div>
          {certificate?.certificate && (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-green-500" />
              Cargado: {formatDate(certificate.uploadedAt)}
              {certificate.expiresAt && (
                <span className="text-xs">
                  (Expira: {formatDate(certificate.expiresAt)})
                </span>
              )}
            </div>
          )}
        </div>

        {/* Clave privada .key */}
        <div className="space-y-2">
          <Label>Clave Privada (.key)</Label>
          <div className="flex items-center gap-2">
            <Input 
              type="file" 
              accept=".key,.pem"
              onChange={(e) => setFiles({ ...files, key: e.target.files[0] })}
            />
          </div>
          {certificate?.privateKey && (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-green-500" />
              Cargada
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button 
          onClick={() => onUpload(environment, files)}
          disabled={!files.cert || !files.key}
        >
          <Upload className="mr-2 h-4 w-4" />
          Subir Certificados ({environment})
        </Button>
      </div>

      <Alert>
        <ShieldAlert className="h-4 w-4" />
        <AlertDescription>
          Los certificados se almacenan cifrados en la base de datos. 
          La clave de cifrado se gestiona de forma segura en el servidor.
        </AlertDescription>
      </Alert>
    </div>
  );
}
```

### 2.5 Endpoints de Configuración AFIP

```typescript
@Controller('configuration/afip')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AfipConfigurationController {
  constructor(private afipConfigService: AfipConfigurationService) {}

  /**
   * Obtiene la configuración actual (sin certificados descifrados)
   */
  @Get()
  getConfiguration() {
    return this.afipConfigService.getConfiguration();
  }

  /**
   * Actualiza datos del emisor
   */
  @Patch('emitter')
  updateEmitter(@Body() dto: UpdateEmitterDto) {
    return this.afipConfigService.updateEmitter(dto);
  }

  /**
   * Cambia el entorno activo
   */
  @Patch('environment')
  setActiveEnvironment(@Body() dto: SetEnvironmentDto) {
    return this.afipConfigService.setActiveEnvironment(dto.environment);
  }

  /**
   * Sube certificados para un entorno
   */
  @Post('certificates/:environment')
  @UseInterceptors(FilesInterceptor('files', 2))
  uploadCertificates(
    @Param('environment') environment: 'homologacion' | 'produccion',
    @UploadedFiles() files: Express.Multer.File[]
  ) {
    return this.afipConfigService.uploadCertificates(environment, files);
  }

  /**
   * Elimina certificados de un entorno
   */
  @Delete('certificates/:environment')
  deleteCertificates(@Param('environment') environment: 'homologacion' | 'produccion') {
    return this.afipConfigService.deleteCertificates(environment);
  }

  /**
   * Prueba la conexión con AFIP
   */
  @Post('test-connection')
  testConnection() {
    return this.afipConfigService.testConnection();
  }

  /**
   * Obtiene info del certificado (sin la clave)
   */
  @Get('certificates/:environment/info')
  getCertificateInfo(@Param('environment') environment: 'homologacion' | 'produccion') {
    return this.afipConfigService.getCertificateInfo(environment);
  }
}
```

### 2.6 Variables de Entorno Requeridas

```bash
# .env.example

# === AFIP - Clave de cifrado para certificados ===
# Generar con: openssl rand -base64 32
AFIP_ENCRYPTION_KEY=your_32_byte_base64_key_here

# === Alternativa: Rutas a certificados (para usuarios avanzados) ===
# Si se definen estas variables, tienen prioridad sobre los certificados en DB
# Útil para Docker/Kubernetes donde se montan como secrets
#
# AFIP_CERT_PATH_HOMO=/path/to/homologacion.crt
# AFIP_KEY_PATH_HOMO=/path/to/homologacion.key
# AFIP_CERT_PATH_PROD=/path/to/produccion.crt
# AFIP_KEY_PATH_PROD=/path/to/produccion.key
```

### 2.7 Tipos de Comprobante según Condición IVA

| Condición Emisor | Condición Receptor | Tipo Comprobante | Código AFIP |
|------------------|-------------------|------------------|-------------|
| Monotributo | Cualquiera | Factura C | 11 |
| Resp. Inscripto | Resp. Inscripto | Factura A | 1 |
| Resp. Inscripto | Consumidor Final | Factura B | 6 |
| Resp. Inscripto | Monotributo | Factura B | 6 |
| Resp. Inscripto | Exento | Factura B | 6 |

### 2.8 Condiciones del Receptor (Cliente)

```typescript
enum CustomerIvaCondition {
  CONSUMIDOR_FINAL = 'consumidor_final',           // Código 5
  RESPONSABLE_INSCRIPTO = 'responsable_inscripto', // Código 1
  MONOTRIBUTO = 'monotributo',                     // Código 6
  EXENTO = 'exento',                               // Código 4
  NO_CATEGORIZADO = 'no_categorizado'              // Código 99
}
```

### 2.9 Tipos de Documento del Receptor

```typescript
enum DocumentType {
  DNI = 96,
  CUIT = 80,
  CUIL = 86,
  CDI = 87,
  LE = 89,
  LC = 90,
  CI_EXTRANJERA = 91,
  PASAPORTE = 94,
  SIN_IDENTIFICAR = 99  // Para consumidor final sin identificar
}
```

---

## 3. Modelo de Datos

### 3.1 Entidades

#### **Sale (Venta)**
```typescript
enum SaleStatus {
  COMPLETED = 'completed',     // Venta completada y pagada
  PENDING = 'pending',         // Venta pendiente de pago (cuenta corriente)
  CANCELLED = 'cancelled',     // Venta cancelada
  PARTIAL = 'partial'          // Venta parcialmente pagada
}

@Entity('sales')
export class Sale {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  saleNumber: string; // Ej: "VENTA-2024-00001" (número interno)

  @ManyToOne(() => Customer, { nullable: true })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer; // Opcional: cliente registrado

  @Column({ type: 'varchar', length: 200, nullable: true })
  customerName: string; // Nombre rápido si no hay cliente registrado

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  saleDate: Date;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  subtotal: number; // Suma de todos los items sin descuento

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  discount: number; // Descuento total aplicado

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  tax: number; // IVA u otros impuestos (solo para Resp. Inscripto)

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  total: number; // subtotal - discount + tax

  @Column({ type: 'enum', enum: SaleStatus, default: SaleStatus.COMPLETED })
  status: SaleStatus;

  @Column({ type: 'boolean', default: false })
  isOnAccount: boolean; // Si es venta en cuenta corriente

  @Column({ type: 'text', nullable: true })
  notes: string; // Observaciones

  @Column({ type: 'boolean', default: false })
  inventoryUpdated: boolean; // Flag para saber si ya se actualizó el stock

  // === CAMPOS FISCALES ===
  @Column({ type: 'boolean', default: false })
  isFiscal: boolean; // Si es venta fiscal (con factura AFIP)

  @OneToOne(() => Invoice, invoice => invoice.sale, { nullable: true })
  invoice: Invoice; // Factura asociada (si es fiscal)

  // Relaciones
  @OneToMany(() => SaleItem, item => item.sale, { cascade: true })
  items: SaleItem[];

  @OneToMany(() => SalePayment, payment => payment.sale, { cascade: true })
  payments: SalePayment[];

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  // Métodos virtuales
  @AfterLoad()
  calculateTotals() {
    if (this.items && this.items.length > 0) {
      this.subtotal = this.items.reduce((sum, item) => 
        sum + item.subtotal, 0
      );
      this.total = this.subtotal - this.discount + this.tax;
    }
  }
}
```

#### **Invoice (Factura Fiscal)**
```typescript
enum InvoiceType {
  FACTURA_A = 1,
  FACTURA_B = 6,
  FACTURA_C = 11
}

enum InvoiceStatus {
  PENDING = 'pending',           // Pendiente de autorización AFIP
  AUTHORIZED = 'authorized',     // Autorizada con CAE
  REJECTED = 'rejected',         // Rechazada por AFIP
  ERROR = 'error'                // Error de comunicación
}

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Sale)
  @JoinColumn({ name: 'sale_id' })
  sale: Sale;

  // Datos del comprobante
  @Column({ type: 'int' })
  invoiceType: InvoiceType; // Tipo de comprobante (1, 6, 11, etc.)

  @Column({ type: 'int' })
  pointOfSale: number; // Punto de venta (ej: 1)

  @Column({ type: 'bigint', nullable: true })
  invoiceNumber: number; // Número de comprobante asignado por AFIP

  @Column({ type: 'timestamp' })
  issueDate: Date; // Fecha de emisión

  // Datos del emisor (snapshot al momento de emisión)
  @Column({ type: 'varchar', length: 11 })
  emitterCuit: string;

  @Column({ type: 'varchar', length: 200 })
  emitterBusinessName: string;

  @Column({ type: 'varchar', length: 300 })
  emitterAddress: string;

  @Column({ type: 'varchar', length: 50 })
  emitterIvaCondition: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  emitterGrossIncome: string;

  @Column({ type: 'date', nullable: true })
  emitterActivityStartDate: Date;

  // Datos del receptor
  @Column({ type: 'int' })
  receiverDocumentType: number; // Tipo doc (80=CUIT, 96=DNI, 99=Sin identificar)

  @Column({ type: 'varchar', length: 20, nullable: true })
  receiverDocumentNumber: string; // Número de documento

  @Column({ type: 'varchar', length: 200, nullable: true })
  receiverName: string; // Nombre/Razón social

  @Column({ type: 'varchar', length: 300, nullable: true })
  receiverAddress: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  receiverIvaCondition: string;

  // Importes
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  discount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  otherTaxes: number; // Otros tributos

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  total: number;

  // IVA (solo para Resp. Inscripto con Factura A/B)
  // Para Monotributo (Factura C) estos campos son 0
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  netAmount: number; // Importe neto gravado

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  iva21: number; // IVA 21%

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  iva105: number; // IVA 10.5%

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  iva27: number; // IVA 27%

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  netAmountExempt: number; // Importe neto no gravado

  // Condición de venta
  @Column({ type: 'varchar', length: 100 })
  saleCondition: string; // "Contado", "Cuenta Corriente", etc.

  // Autorización AFIP
  @Column({ type: 'enum', enum: InvoiceStatus, default: InvoiceStatus.PENDING })
  status: InvoiceStatus;

  @Column({ type: 'varchar', length: 14, nullable: true })
  cae: string; // Código de Autorización Electrónico (14 dígitos)

  @Column({ type: 'date', nullable: true })
  caeExpirationDate: Date; // Fecha de vencimiento del CAE

  // QR Data (JSON codificado en Base64 para el QR)
  @Column({ type: 'text', nullable: true })
  qrData: string;

  // Respuesta AFIP (para debug/auditoría)
  @Column({ type: 'text', nullable: true })
  afipResponse: string; // JSON con respuesta completa de AFIP

  @Column({ type: 'text', nullable: true })
  afipErrorMessage: string; // Mensaje de error si fue rechazada

  // PDF generado
  @Column({ type: 'varchar', length: 500, nullable: true })
  pdfPath: string; // Ruta al PDF generado

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

#### **SaleItem (Item de Venta)**
```typescript
@Entity('sale_items')
export class SaleItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Sale, sale => sale.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sale_id' })
  sale: Sale;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'varchar', length: 50, nullable: true })
  productCode: string; // Código del producto (snapshot)

  @Column({ type: 'varchar', length: 200 })
  productDescription: string; // Descripción del producto (snapshot)

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'varchar', length: 20, default: 'unidades' })
  unitOfMeasure: string; // Unidad de medida

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number; // Precio de venta unitario

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discount: number; // Descuento por item

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  discountPercent: number; // Porcentaje de bonificación

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  subtotal: number; // (quantity * unitPrice) - discount

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Calcular subtotal antes de insertar/actualizar
  @BeforeInsert()
  @BeforeUpdate()
  calculateSubtotal() {
    this.subtotal = (this.quantity * this.unitPrice) - this.discount;
  }
}
```

#### **SalePayment (Pago de Venta)**
```typescript
enum PaymentMethod {
  CASH = 'cash',
  DEBIT_CARD = 'debit_card',
  CREDIT_CARD = 'credit_card',
  TRANSFER = 'transfer',
  QR = 'qr',
  CHECK = 'check',
  OTHER = 'other'
}

@Entity('sale_payments')
export class SalePayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Sale, sale => sale.payments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sale_id' })
  sale: Sale;

  @Column({ type: 'enum', enum: PaymentMethod })
  paymentMethod: PaymentMethod;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number; // Monto de este pago

  @Column({ type: 'int', nullable: true })
  installments: number; // Cantidad de cuotas (si es tarjeta crédito)

  @Column({ type: 'varchar', length: 100, nullable: true })
  cardLastFourDigits: string; // Últimos 4 dígitos de tarjeta

  @Column({ type: 'varchar', length: 100, nullable: true })
  authorizationCode: string; // Código de autorización

  @Column({ type: 'varchar', length: 100, nullable: true })
  referenceNumber: string; // Número de referencia/transacción

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### 3.2 Relaciones
- **Sale** 1:N **SaleItem** (una venta tiene muchos items)
- **Sale** 1:N **SalePayment** (una venta puede tener múltiples pagos)
- **Sale** 1:1 **Invoice** (una venta fiscal tiene una factura)
- **Sale** N:1 **Customer** (opcional - para cuenta corriente)
- **SaleItem** N:1 **Product** (cada item pertenece a un producto)
- **Sale** N:1 **User** (vendedor que registró la venta)

---

## 4. Integración con AFIP

### 4.1 Webservices de AFIP

Se utilizará el webservice **WSFE (Factura Electrónica)** para solicitar la autorización de comprobantes.

#### Ambientes
- **Homologación (Testing)**: `https://wswhomo.afip.gov.ar/`
- **Producción**: `https://servicios1.afip.gov.ar/`

#### Servicios Requeridos
1. **WSAA (Autenticación)**: Para obtener el token y sign
2. **WSFE (Factura Electrónica)**: Para autorizar comprobantes

### 4.2 Estructura de Carpetas Backend (Ampliada)

```
src/
├── modules/
│   └── sales/
│       ├── entities/
│       │   ├── sale.entity.ts
│       │   ├── sale-item.entity.ts
│       │   ├── sale-payment.entity.ts
│       │   └── invoice.entity.ts          # Nueva entidad
│       ├── dto/
│       │   ├── create-sale.dto.ts
│       │   ├── create-sale-item.dto.ts
│       │   ├── create-sale-payment.dto.ts
│       │   ├── sale-filters.dto.ts
│       │   └── sale-stats.dto.ts
│       ├── services/
│       │   ├── sales.service.ts
│       │   ├── invoice.service.ts         # Servicio de facturas
│       │   ├── afip.service.ts            # Integración AFIP
│       │   ├── pdf-generator.service.ts   # Generación de PDFs
│       │   └── qr-generator.service.ts    # Generación de QR
│       ├── sales.controller.ts
│       ├── invoice.controller.ts          # Controller de facturas
│       └── sales.module.ts
├── templates/
│   ├── factura-c.html                     # Template Factura C
│   ├── factura-a.html                     # Template Factura A
│   ├── factura-b.html                     # Template Factura B
│   └── recibo.html                        # Template Recibo (no fiscal)
└── certificates/                          # Certificados AFIP (NO commitear)
    ├── .gitkeep
    └── README.md
```

### 4.3 Servicio AFIP (afip.service.ts)

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as soap from 'soap';
import * as fs from 'fs';
import * as crypto from 'crypto';

interface AfipAuthToken {
  token: string;
  sign: string;
  expirationTime: Date;
}

interface InvoiceRequest {
  invoiceType: number;
  pointOfSale: number;
  concept: number;             // 1=Productos, 2=Servicios, 3=Productos y Servicios
  docType: number;             // Tipo documento receptor
  docNumber: string;           // Número documento receptor
  issueDate: string;           // Fecha emisión (YYYYMMDD)
  total: number;
  netAmount: number;           // Importe neto gravado
  netAmountExempt: number;     // Importe exento
  iva: IvaItem[];              // Array de IVA (solo RI)
  otherTaxes: number;          // Otros tributos
}

interface IvaItem {
  id: number;        // 5=21%, 4=10.5%, 6=27%
  baseAmount: number;
  amount: number;
}

interface AfipResponse {
  success: boolean;
  cae?: string;
  caeExpirationDate?: string;
  invoiceNumber?: number;
  errors?: string[];
  observations?: string[];
}

@Injectable()
export class AfipService {
  private readonly logger = new Logger(AfipService.name);
  private authToken: AfipAuthToken | null = null;

  constructor(private configService: ConfigService) {}

  /**
   * Obtiene el token de autenticación de AFIP (WSAA)
   * El token tiene una duración de 12 horas
   */
  async getAuthToken(): Promise<AfipAuthToken> {
    // Si el token existe y no expiró, reutilizarlo
    if (this.authToken && this.authToken.expirationTime > new Date()) {
      return this.authToken;
    }

    const environment = this.configService.get('AFIP_ENVIRONMENT');
    const wsaaUrl = environment === 'produccion'
      ? 'https://wsaa.afip.gov.ar/ws/services/LoginCms'
      : 'https://wsaahomo.afip.gov.ar/ws/services/LoginCms';

    // Leer certificado y clave privada
    const certificate = fs.readFileSync(
      this.configService.get('AFIP_CERTIFICATE_PATH')
    );
    const privateKey = fs.readFileSync(
      this.configService.get('AFIP_PRIVATE_KEY_PATH')
    );

    // Crear TRA (Ticket de Requerimiento de Acceso)
    const tra = this.createTRA('wsfe');

    // Firmar TRA con CMS
    const signedTRA = this.signTRA(tra, certificate, privateKey);

    // Llamar al WSAA
    const client = await soap.createClientAsync(wsaaUrl);
    const result = await client.loginCmsAsync({ in0: signedTRA });

    // Parsear respuesta
    const loginResponse = this.parseLoginResponse(result);
    
    this.authToken = {
      token: loginResponse.token,
      sign: loginResponse.sign,
      expirationTime: new Date(loginResponse.expirationTime)
    };

    return this.authToken;
  }

  /**
   * Autoriza un comprobante en AFIP (WSFE)
   */
  async authorizeInvoice(request: InvoiceRequest): Promise<AfipResponse> {
    const auth = await this.getAuthToken();
    const cuit = this.configService.get('AFIP_CUIT');
    
    const environment = this.configService.get('AFIP_ENVIRONMENT');
    const wsfeUrl = environment === 'produccion'
      ? 'https://servicios1.afip.gov.ar/wsfev1/service.asmx?WSDL'
      : 'https://wswhomo.afip.gov.ar/wsfev1/service.asmx?WSDL';

    const client = await soap.createClientAsync(wsfeUrl);

    // Obtener último número de comprobante
    const lastInvoice = await this.getLastInvoiceNumber(
      client, auth, cuit, request.pointOfSale, request.invoiceType
    );
    const nextInvoiceNumber = lastInvoice + 1;

    // Preparar request AFIP
    const afipRequest = {
      Auth: {
        Token: auth.token,
        Sign: auth.sign,
        Cuit: cuit
      },
      FeCAEReq: {
        FeCabReq: {
          CantReg: 1,
          PtoVta: request.pointOfSale,
          CbteTipo: request.invoiceType
        },
        FeDetReq: {
          FECAEDetRequest: {
            Concepto: request.concept,
            DocTipo: request.docType,
            DocNro: request.docNumber,
            CbteDesde: nextInvoiceNumber,
            CbteHasta: nextInvoiceNumber,
            CbteFch: request.issueDate,
            ImpTotal: request.total,
            ImpTotConc: request.netAmountExempt,
            ImpNeto: request.netAmount,
            ImpOpEx: 0, // Importe operaciones exentas
            ImpIVA: request.iva.reduce((sum, i) => sum + i.amount, 0),
            ImpTrib: request.otherTaxes,
            MonId: 'PES', // Moneda: Pesos argentinos
            MonCotiz: 1,
            // IVA (solo para RI)
            Iva: request.iva.length > 0 ? {
              AlicIva: request.iva.map(i => ({
                Id: i.id,
                BaseImp: i.baseAmount,
                Importe: i.amount
              }))
            } : undefined
          }
        }
      }
    };

    try {
      const result = await client.FECAESolicitarAsync(afipRequest);
      const response = result[0].FECAESolicitarResult;

      if (response.FeCabResp.Resultado === 'A') {
        // Aprobado
        const detalle = response.FeDetResp.FECAEDetResponse[0];
        return {
          success: true,
          cae: detalle.CAE,
          caeExpirationDate: detalle.CAEFchVto,
          invoiceNumber: nextInvoiceNumber,
          observations: detalle.Observaciones?.Obs?.map(o => o.Msg) || []
        };
      } else {
        // Rechazado
        const detalle = response.FeDetResp.FECAEDetResponse[0];
        return {
          success: false,
          errors: detalle.Observaciones?.Obs?.map(o => o.Msg) || ['Error desconocido'],
          invoiceNumber: nextInvoiceNumber
        };
      }
    } catch (error) {
      this.logger.error('Error al comunicarse con AFIP:', error);
      return {
        success: false,
        errors: [`Error de comunicación con AFIP: ${error.message}`]
      };
    }
  }

  /**
   * Obtiene el último número de comprobante autorizado
   */
  private async getLastInvoiceNumber(
    client: any,
    auth: AfipAuthToken,
    cuit: string,
    pointOfSale: number,
    invoiceType: number
  ): Promise<number> {
    const result = await client.FECompUltimoAutorizadoAsync({
      Auth: { Token: auth.token, Sign: auth.sign, Cuit: cuit },
      PtoVta: pointOfSale,
      CbteTipo: invoiceType
    });
    return result[0].FECompUltimoAutorizadoResult.CbteNro;
  }

  /**
   * Crea el TRA (Ticket de Requerimiento de Acceso)
   */
  private createTRA(service: string): string {
    const now = new Date();
    const expiration = new Date(now.getTime() + 600000); // 10 minutos

    return `<?xml version="1.0" encoding="UTF-8"?>
    <loginTicketRequest version="1.0">
      <header>
        <uniqueId>${Math.floor(Date.now() / 1000)}</uniqueId>
        <generationTime>${now.toISOString()}</generationTime>
        <expirationTime>${expiration.toISOString()}</expirationTime>
      </header>
      <service>${service}</service>
    </loginTicketRequest>`;
  }

  /**
   * Firma el TRA con CMS (PKCS#7)
   */
  private signTRA(tra: string, certificate: Buffer, privateKey: Buffer): string {
    // Implementación de firma CMS/PKCS#7
    // Se recomienda usar la librería 'node-forge' o similar
    // ...
    return 'BASE64_SIGNED_TRA';
  }

  /**
   * Parsea la respuesta del login de WSAA
   */
  private parseLoginResponse(result: any): { token: string; sign: string; expirationTime: string } {
    // Parsear XML de respuesta
    // ...
    return { token: '', sign: '', expirationTime: '' };
  }
}
```

### 4.4 Servicio de Facturas (invoice.service.ts)

```typescript
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice, InvoiceStatus, InvoiceType } from './entities/invoice.entity';
import { Sale } from './entities/sale.entity';
import { AfipService } from './afip.service';
import { PdfGeneratorService } from './pdf-generator.service';
import { QrGeneratorService } from './qr-generator.service';
import { ConfigurationService } from '../configuration/configuration.service';

@Injectable()
export class InvoiceService {
  constructor(
    @InjectRepository(Invoice)
    private invoiceRepo: Repository<Invoice>,
    @InjectRepository(Sale)
    private saleRepo: Repository<Sale>,
    private afipService: AfipService,
    private pdfService: PdfGeneratorService,
    private qrService: QrGeneratorService,
    private configService: ConfigurationService
  ) {}

  /**
   * Genera una factura fiscal para una venta
   */
  async generateInvoice(saleId: string): Promise<Invoice> {
    const sale = await this.saleRepo.findOne({
      where: { id: saleId },
      relations: ['items', 'items.product', 'customer', 'payments']
    });

    if (!sale) {
      throw new NotFoundException('Venta no encontrada');
    }

    if (sale.invoice) {
      throw new BadRequestException('La venta ya tiene una factura asociada');
    }

    // Obtener configuración fiscal
    const fiscalConfig = await this.configService.getFiscalConfiguration();

    // Determinar tipo de comprobante
    const invoiceType = this.determineInvoiceType(
      fiscalConfig.ivaCondition,
      sale.customer?.ivaCondition || 'consumidor_final'
    );

    // Crear factura en estado PENDING
    const invoice = this.invoiceRepo.create({
      sale,
      invoiceType,
      pointOfSale: fiscalConfig.pointOfSale,
      issueDate: new Date(),
      
      // Datos del emisor
      emitterCuit: fiscalConfig.cuit,
      emitterBusinessName: fiscalConfig.businessName,
      emitterAddress: fiscalConfig.businessAddress,
      emitterIvaCondition: this.getIvaConditionLabel(fiscalConfig.ivaCondition),
      emitterGrossIncome: fiscalConfig.grossIncome,
      emitterActivityStartDate: fiscalConfig.activityStartDate,

      // Datos del receptor
      receiverDocumentType: this.getDocumentTypeCode(sale.customer),
      receiverDocumentNumber: sale.customer?.documentNumber || null,
      receiverName: sale.customer?.fullName || sale.customerName || 'Consumidor Final',
      receiverAddress: sale.customer?.address || null,
      receiverIvaCondition: this.getIvaConditionLabel(
        sale.customer?.ivaCondition || 'consumidor_final'
      ),

      // Importes
      subtotal: sale.subtotal,
      discount: sale.discount,
      total: sale.total,
      
      // Para Monotributo (Factura C): IVA no discriminado
      // Para Resp. Inscripto: calcular IVA
      netAmount: fiscalConfig.ivaCondition === 'monotributo' ? 0 : sale.subtotal - sale.discount,
      iva21: 0,
      iva105: 0,
      iva27: 0,
      netAmountExempt: fiscalConfig.ivaCondition === 'monotributo' ? sale.total : 0,

      // Condición de venta
      saleCondition: this.getSaleConditionLabel(sale),

      status: InvoiceStatus.PENDING
    });

    const savedInvoice = await this.invoiceRepo.save(invoice);

    // Solicitar autorización a AFIP
    try {
      const afipResponse = await this.afipService.authorizeInvoice({
        invoiceType: invoice.invoiceType,
        pointOfSale: invoice.pointOfSale,
        concept: 1, // Productos
        docType: invoice.receiverDocumentType,
        docNumber: invoice.receiverDocumentNumber || '0',
        issueDate: this.formatDateForAfip(invoice.issueDate),
        total: Number(invoice.total),
        netAmount: Number(invoice.netAmount),
        netAmountExempt: Number(invoice.netAmountExempt),
        iva: [], // Vacío para Monotributo
        otherTaxes: Number(invoice.otherTaxes)
      });

      if (afipResponse.success) {
        // Actualizar factura con CAE
        savedInvoice.status = InvoiceStatus.AUTHORIZED;
        savedInvoice.cae = afipResponse.cae!;
        savedInvoice.caeExpirationDate = this.parseAfipDate(afipResponse.caeExpirationDate!);
        savedInvoice.invoiceNumber = afipResponse.invoiceNumber!;
        savedInvoice.afipResponse = JSON.stringify(afipResponse);

        // Generar QR
        savedInvoice.qrData = this.qrService.generateQrData(savedInvoice);

        // Generar PDF
        savedInvoice.pdfPath = await this.pdfService.generateInvoicePdf(savedInvoice);

        // Actualizar la venta
        sale.isFiscal = true;
        await this.saleRepo.save(sale);
      } else {
        savedInvoice.status = InvoiceStatus.REJECTED;
        savedInvoice.afipErrorMessage = afipResponse.errors?.join(', ') || 'Error desconocido';
        savedInvoice.afipResponse = JSON.stringify(afipResponse);
      }

      return this.invoiceRepo.save(savedInvoice);
    } catch (error) {
      savedInvoice.status = InvoiceStatus.ERROR;
      savedInvoice.afipErrorMessage = `Error de comunicación: ${error.message}`;
      return this.invoiceRepo.save(savedInvoice);
    }
  }

  /**
   * Reintenta la autorización de una factura rechazada o con error
   */
  async retryInvoice(invoiceId: string): Promise<Invoice> {
    const invoice = await this.invoiceRepo.findOne({
      where: { id: invoiceId },
      relations: ['sale', 'sale.items', 'sale.customer']
    });

    if (!invoice) {
      throw new NotFoundException('Factura no encontrada');
    }

    if (invoice.status === InvoiceStatus.AUTHORIZED) {
      throw new BadRequestException('La factura ya está autorizada');
    }

    // Reintentar autorización
    invoice.status = InvoiceStatus.PENDING;
    await this.invoiceRepo.save(invoice);

    // ... lógica similar a generateInvoice
    return invoice;
  }

  /**
   * Obtiene el PDF de una factura
   */
  async getInvoicePdf(invoiceId: string): Promise<Buffer> {
    const invoice = await this.invoiceRepo.findOne({
      where: { id: invoiceId },
      relations: ['sale', 'sale.items']
    });

    if (!invoice) {
      throw new NotFoundException('Factura no encontrada');
    }

    if (invoice.status !== InvoiceStatus.AUTHORIZED) {
      throw new BadRequestException('La factura no está autorizada');
    }

    return this.pdfService.getInvoicePdf(invoice);
  }

  /**
   * Determina el tipo de comprobante según condiciones IVA
   */
  private determineInvoiceType(
    emitterCondition: string,
    receiverCondition: string
  ): InvoiceType {
    if (emitterCondition === 'monotributo') {
      return InvoiceType.FACTURA_C; // 11
    }

    if (emitterCondition === 'responsable_inscripto') {
      if (receiverCondition === 'responsable_inscripto') {
        return InvoiceType.FACTURA_A; // 1
      }
      return InvoiceType.FACTURA_B; // 6
    }

    // Default: Factura C
    return InvoiceType.FACTURA_C;
  }

  private formatDateForAfip(date: Date): string {
    return date.toISOString().slice(0, 10).replace(/-/g, '');
  }

  private parseAfipDate(dateStr: string): Date {
    // YYYYMMDD -> Date
    const year = parseInt(dateStr.slice(0, 4));
    const month = parseInt(dateStr.slice(4, 6)) - 1;
    const day = parseInt(dateStr.slice(6, 8));
    return new Date(year, month, day);
  }

  private getDocumentTypeCode(customer: any): number {
    if (!customer) return 99; // Sin identificar
    
    const docTypeMap = {
      'dni': 96,
      'cuit': 80,
      'cuil': 86,
      'cdi': 87
    };

    return docTypeMap[customer.documentType?.toLowerCase()] || 99;
  }

  private getIvaConditionLabel(condition: string): string {
    const labels = {
      'consumidor_final': 'Consumidor Final',
      'responsable_inscripto': 'Responsable Inscripto',
      'monotributo': 'Responsable Monotributo',
      'exento': 'IVA Exento'
    };
    return labels[condition] || 'Consumidor Final';
  }

  private getSaleConditionLabel(sale: Sale): string {
    if (sale.isOnAccount) return 'Cuenta Corriente';
    
    const methods = sale.payments?.map(p => {
      const labels = {
        'cash': 'Efectivo',
        'debit_card': 'Tarjeta de Débito',
        'credit_card': 'Tarjeta de Crédito',
        'transfer': 'Transferencia',
        'qr': 'QR'
      };
      return labels[p.paymentMethod] || p.paymentMethod;
    }) || ['Contado'];

    return methods.join(' / ');
  }
}
```

---

## 5. Generación de QR para Facturas

### 5.1 Especificaciones del QR (Según AFIP)

El código QR debe codificar una URL con los datos del comprobante en formato JSON codificado en Base64.

**Formato**: `https://www.afip.gob.ar/fe/qr/?p={DATOS_BASE64}`

Referencia: [Especificaciones QR AFIP](https://www.afip.gob.ar/fe/qr/documentos/QRespecificaciones.pdf)

### 5.2 Servicio de Generación de QR (qr-generator.service.ts)

```typescript
import { Injectable } from '@nestjs/common';
import * as QRCode from 'qrcode';
import { Invoice } from './entities/invoice.entity';

interface QrDataAfip {
  ver: number;           // Versión (siempre 1)
  fecha: string;         // Fecha emisión (YYYY-MM-DD)
  cuit: number;          // CUIT emisor (11 dígitos)
  ptoVta: number;        // Punto de venta
  tipoCmp: number;       // Tipo de comprobante
  nroCmp: number;        // Número de comprobante
  importe: number;       // Importe total
  moneda: string;        // Moneda (PES, DOL, etc.)
  ctz: number;           // Cotización
  tipoDocRec?: number;   // Tipo documento receptor
  nroDocRec?: number;    // Número documento receptor
  tipoCodAut: string;    // "E" para CAE
  codAut: number;        // Código de autorización (CAE)
}

@Injectable()
export class QrGeneratorService {
  
  /**
   * Genera los datos del QR en formato JSON Base64 según especificación AFIP
   */
  generateQrData(invoice: Invoice): string {
    const qrData: QrDataAfip = {
      ver: 1,
      fecha: this.formatDate(invoice.issueDate),
      cuit: parseInt(invoice.emitterCuit),
      ptoVta: invoice.pointOfSale,
      tipoCmp: invoice.invoiceType,
      nroCmp: invoice.invoiceNumber,
      importe: Number(invoice.total),
      moneda: 'PES',
      ctz: 1,
      tipoCodAut: 'E', // CAE
      codAut: parseInt(invoice.cae)
    };

    // Agregar datos del receptor si tiene documento
    if (invoice.receiverDocumentNumber && invoice.receiverDocumentType !== 99) {
      qrData.tipoDocRec = invoice.receiverDocumentType;
      qrData.nroDocRec = parseInt(invoice.receiverDocumentNumber);
    }

    // Convertir a JSON y luego a Base64
    const jsonString = JSON.stringify(qrData);
    const base64Data = Buffer.from(jsonString).toString('base64');

    return `https://www.afip.gob.ar/fe/qr/?p=${base64Data}`;
  }

  /**
   * Genera la imagen QR en Base64 para incrustar en el PDF
   */
  async generateQrImage(invoice: Invoice): Promise<string> {
    const qrUrl = this.generateQrData(invoice);
    
    // Generar imagen QR en formato Data URL
    const qrImageDataUrl = await QRCode.toDataURL(qrUrl, {
      width: 150,
      margin: 1,
      errorCorrectionLevel: 'M'
    });

    return qrImageDataUrl;
  }

  private formatDate(date: Date): string {
    return date.toISOString().slice(0, 10); // YYYY-MM-DD
  }
}
```

---

## 6. Generación de PDFs

### 6.1 Servicio de Generación de PDFs (pdf-generator.service.ts)

```typescript
import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';
import * as puppeteer from 'puppeteer';
import { Invoice } from './entities/invoice.entity';
import { Sale } from './entities/sale.entity';
import { QrGeneratorService } from './qr-generator.service';

@Injectable()
export class PdfGeneratorService {
  private templatesPath: string;

  constructor(private qrService: QrGeneratorService) {
    this.templatesPath = path.join(__dirname, '../../templates');
    this.registerHandlebarsHelpers();
  }

  /**
   * Genera el PDF de una factura fiscal
   */
  async generateInvoicePdf(invoice: Invoice): Promise<string> {
    // Determinar template según tipo de factura
    const templateName = this.getTemplateName(invoice.invoiceType);
    const templatePath = path.join(this.templatesPath, templateName);
    const templateHtml = fs.readFileSync(templatePath, 'utf-8');

    // Compilar template
    const template = Handlebars.compile(templateHtml);

    // Generar QR
    const qrImage = await this.qrService.generateQrImage(invoice);

    // Preparar datos para el template
    const data = {
      // Tipo de comprobante
      invoiceTypeLetter: this.getInvoiceTypeLetter(invoice.invoiceType),
      invoiceTypeName: this.getInvoiceTypeName(invoice.invoiceType),

      // Emisor
      emitter: {
        businessName: invoice.emitterBusinessName,
        address: invoice.emitterAddress,
        ivaCondition: invoice.emitterIvaCondition,
        cuit: this.formatCuit(invoice.emitterCuit),
        grossIncome: invoice.emitterGrossIncome,
        activityStartDate: this.formatDate(invoice.emitterActivityStartDate)
      },

      // Comprobante
      pointOfSale: this.padNumber(invoice.pointOfSale, 4),
      invoiceNumber: this.padNumber(invoice.invoiceNumber, 8),
      issueDate: this.formatDate(invoice.issueDate),

      // Receptor
      receiver: {
        documentType: this.getDocumentTypeName(invoice.receiverDocumentType),
        documentNumber: invoice.receiverDocumentNumber || '-',
        name: invoice.receiverName || 'Consumidor Final',
        address: invoice.receiverAddress || '-',
        ivaCondition: invoice.receiverIvaCondition
      },

      // Fechas (para servicios)
      periodFrom: this.formatDate(invoice.issueDate),
      periodTo: this.formatDate(invoice.issueDate),
      paymentDueDate: this.formatDate(invoice.caeExpirationDate),

      // Condición de venta
      saleCondition: invoice.saleCondition,

      // Items
      items: invoice.sale.items.map(item => ({
        code: item.productCode || '-',
        description: item.productDescription,
        quantity: this.formatNumber(item.quantity, 2),
        unitOfMeasure: item.unitOfMeasure,
        unitPrice: this.formatCurrency(item.unitPrice),
        discountPercent: this.formatNumber(item.discountPercent || 0, 2),
        discountAmount: this.formatCurrency(item.discount),
        subtotal: this.formatCurrency(item.subtotal)
      })),

      // Totales
      subtotal: this.formatCurrency(invoice.subtotal),
      otherTaxes: this.formatCurrency(invoice.otherTaxes),
      total: this.formatCurrency(invoice.total),

      // CAE
      cae: invoice.cae,
      caeExpirationDate: this.formatDate(invoice.caeExpirationDate),

      // QR
      qrImage
    };

    // Renderizar HTML
    const html = template(data);

    // Generar PDF con Puppeteer
    const pdfPath = await this.htmlToPdf(html, invoice.id);

    return pdfPath;
  }

  /**
   * Genera el PDF de un recibo (venta no fiscal)
   */
  async generateReceiptPdf(sale: Sale): Promise<string> {
    const templatePath = path.join(this.templatesPath, 'recibo.html');
    const templateHtml = fs.readFileSync(templatePath, 'utf-8');

    const template = Handlebars.compile(templateHtml);

    const data = {
      receiptNumber: sale.saleNumber,
      issueDate: this.formatDate(sale.saleDate),
      
      customer: {
        name: sale.customer?.fullName || sale.customerName || 'Consumidor Final'
      },

      items: sale.items.map(item => ({
        code: item.productCode || '-',
        description: item.productDescription,
        quantity: this.formatNumber(item.quantity, 2),
        unitPrice: this.formatCurrency(item.unitPrice),
        subtotal: this.formatCurrency(item.subtotal)
      })),

      subtotal: this.formatCurrency(sale.subtotal),
      discount: this.formatCurrency(sale.discount),
      total: this.formatCurrency(sale.total),

      // Métodos de pago
      payments: sale.payments?.map(p => ({
        method: this.getPaymentMethodName(p.paymentMethod),
        amount: this.formatCurrency(p.amount)
      })) || [],

      // Nota: documento sin validez fiscal
      disclaimer: 'DOCUMENTO NO VÁLIDO COMO FACTURA'
    };

    const html = template(data);
    const pdfPath = await this.htmlToPdf(html, `recibo-${sale.id}`);

    return pdfPath;
  }

  /**
   * Obtiene el PDF almacenado de una factura
   */
  async getInvoicePdf(invoice: Invoice): Promise<Buffer> {
    if (!invoice.pdfPath || !fs.existsSync(invoice.pdfPath)) {
      // Regenerar PDF si no existe
      await this.generateInvoicePdf(invoice);
    }

    return fs.readFileSync(invoice.pdfPath);
  }

  /**
   * Convierte HTML a PDF usando Puppeteer
   */
  private async htmlToPdf(html: string, filename: string): Promise<string> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const outputDir = path.join(__dirname, '../../storage/invoices');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const pdfPath = path.join(outputDir, `${filename}.pdf`);
    
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' }
    });

    await browser.close();

    return pdfPath;
  }

  private registerHandlebarsHelpers() {
    Handlebars.registerHelper('formatCurrency', (value) => this.formatCurrency(value));
    Handlebars.registerHelper('formatDate', (value) => this.formatDate(value));
  }

  private getTemplateName(invoiceType: number): string {
    const templates = {
      1: 'factura-a.html',
      6: 'factura-b.html',
      11: 'factura-c.html'
    };
    return templates[invoiceType] || 'factura-c.html';
  }

  private getInvoiceTypeLetter(invoiceType: number): string {
    const letters = { 1: 'A', 6: 'B', 11: 'C' };
    return letters[invoiceType] || 'C';
  }

  private getInvoiceTypeName(invoiceType: number): string {
    return 'Factura';
  }

  private getDocumentTypeName(docType: number): string {
    const names = {
      80: 'CUIT',
      86: 'CUIL',
      96: 'DNI',
      99: 'Sin identificar'
    };
    return names[docType] || 'Otro';
  }

  private getPaymentMethodName(method: string): string {
    const names = {
      'cash': 'Efectivo',
      'debit_card': 'Tarjeta de Débito',
      'credit_card': 'Tarjeta de Crédito',
      'transfer': 'Transferencia',
      'qr': 'QR'
    };
    return names[method] || method;
  }

  private formatCuit(cuit: string): string {
    return `${cuit.slice(0, 2)}-${cuit.slice(2, 10)}-${cuit.slice(10)}`;
  }

  private formatDate(date: Date): string {
    if (!date) return '-';
    return date.toLocaleDateString('es-AR');
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value || 0);
  }

  private formatNumber(value: number, decimals: number): string {
    return new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value || 0);
  }

  private padNumber(num: number, length: number): string {
    return num.toString().padStart(length, '0');
  }
}
```

### 6.2 Template HTML Factura C (factura-c.html)

El template existente en `apps/backend/src/assets/factura-c.html` será modificado para usar variables Handlebars:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Factura {{invoiceTypeLetter}}</title>
  <style type="text/css">
    /* ... estilos existentes ... */
  </style>
</head>
<body>
  <table class="bill-container">
    <tr class="bill-emitter-row">
      <td>
        <div class="bill-type">
          {{invoiceTypeLetter}}
        </div>
        <div class="text-lg text-center">
          {{emitter.businessName}}
        </div>
        <p><strong>Razón social:</strong> {{emitter.businessName}}</p>
        <p><strong>Domicilio Comercial:</strong> {{emitter.address}}</p>
        <p><strong>Condición Frente al IVA:</strong> {{emitter.ivaCondition}}</p>
      </td>
      <td>
        <div>
          <div class="text-lg">
            {{invoiceTypeName}}
          </div>
          <div class="row">
            <p class="col-6 margin-b-0">
              <strong>Punto de Venta: {{pointOfSale}}</strong>
            </p>
            <p class="col-6 margin-b-0">
              <strong>Comp. Nro: {{invoiceNumber}}</strong>
            </p>
          </div>
          <p><strong>Fecha de Emisión:</strong> {{issueDate}}</p>
          <p><strong>CUIT:</strong> {{emitter.cuit}}</p>
          <p><strong>Ingresos Brutos:</strong> {{emitter.grossIncome}}</p>
          <p><strong>Fecha de Inicio de Actividades:</strong> {{emitter.activityStartDate}}</p>
        </div>
      </td>
    </tr>
    
    <!-- ... resto del template con variables Handlebars ... -->
    
    <tr class="bill-row row-details">
      <td>
        <div>
          <div class="row">
            <img id="qrcode" src="{{qrImage}}">
          </div>
        </div>
      </td>
      <td>
        <div>
          <div class="row text-right margin-b-10">
            <strong>CAE Nº:&nbsp;</strong> {{cae}}
          </div>
          <div class="row text-right">
            <strong>Fecha de Vto. de CAE:&nbsp;</strong> {{caeExpirationDate}}
          </div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 7. Backend (NestJS)

### 7.1 DTOs Actualizados

#### **create-sale.dto.ts**
```typescript
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, IsArray, ValidateNested, Min, IsBoolean, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSaleItemDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  discount?: number; // Descuento por item
}

export class CreateSalePaymentDto {
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  installments?: number; // Para tarjeta de crédito

  @IsString()
  @IsOptional()
  @MaxLength(100)
  cardLastFourDigits?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  authorizationCode?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  referenceNumber?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;
}

export class CreateSaleDto {
  @IsString()
  @IsOptional()
  customerId?: string; // Cliente registrado (opcional)

  @IsString()
  @IsOptional()
  @MaxLength(200)
  customerName?: string; // Nombre rápido si no hay cliente

  @IsNumber()
  @Min(0)
  @IsOptional()
  discount?: number; // Descuento total de la venta

  @IsNumber()
  @Min(0)
  @IsOptional()
  tax?: number;

  @IsBoolean()
  @IsOptional()
  isOnAccount?: boolean; // Si es venta en cuenta corriente

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  notes?: string;

  // === NUEVO: Generar factura fiscal ===
  @IsBoolean()
  @IsOptional()
  generateInvoice?: boolean; // Si se debe generar factura AFIP

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSaleItemDto)
  items: CreateSaleItemDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSalePaymentDto)
  @IsOptional()
  payments?: CreateSalePaymentDto[]; // Opcional si es venta en cuenta
}
```

### 7.2 Controller de Facturas (invoice.controller.ts)

```typescript
import { Controller, Get, Post, Param, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { InvoiceService } from './invoice.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('invoices')
@UseGuards(JwtAuthGuard)
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  /**
   * Genera factura fiscal para una venta
   */
  @Post('generate/:saleId')
  generateInvoice(@Param('saleId') saleId: string) {
    return this.invoiceService.generateInvoice(saleId);
  }

  /**
   * Reintenta la autorización de una factura con error
   */
  @Post(':id/retry')
  retryInvoice(@Param('id') id: string) {
    return this.invoiceService.retryInvoice(id);
  }

  /**
   * Obtiene una factura por ID
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.invoiceService.findOne(id);
  }

  /**
   * Descarga el PDF de una factura
   */
  @Get(':id/pdf')
  async downloadPdf(@Param('id') id: string, @Res() res: Response) {
    const pdfBuffer = await this.invoiceService.getInvoicePdf(id);
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="factura-${id}.pdf"`,
      'Content-Length': pdfBuffer.length
    });

    res.send(pdfBuffer);
  }
}
```

### 7.3 Controller de Ventas Actualizado (sales.controller.ts)

```typescript
import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Res, UseGuards, Request } from '@nestjs/common';
import { Response } from 'express';
import { SalesService } from './sales.service';
import { CreateSaleDto, SaleFiltersDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PdfGeneratorService } from './pdf-generator.service';

@Controller('sales')
@UseGuards(JwtAuthGuard)
export class SalesController {
  constructor(
    private readonly salesService: SalesService,
    private readonly pdfService: PdfGeneratorService
  ) {}

  @Post()
  create(@Body() dto: CreateSaleDto, @Request() req) {
    return this.salesService.create(dto, req.user.id);
  }

  @Get()
  findAll(@Query() filters: SaleFiltersDto) {
    return this.salesService.findAll(filters);
  }

  @Get('stats')
  getStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.salesService.getStats(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
  }

  @Get('today')
  getTodaySales() {
    return this.salesService.getTodaySales();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.salesService.findOne(id);
  }

  /**
   * Descarga el recibo (PDF) de una venta no fiscal
   */
  @Get(':id/receipt')
  async downloadReceipt(@Param('id') id: string, @Res() res: Response) {
    const sale = await this.salesService.findOne(id);
    const pdfBuffer = await this.pdfService.generateReceiptPdf(sale);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="recibo-${sale.saleNumber}.pdf"`,
      'Content-Length': pdfBuffer.length
    });

    res.send(pdfBuffer);
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.salesService.cancel(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.salesService.remove(id);
  }
}
```

### 7.4 Service de Ventas Actualizado (sales.service.ts)

```typescript
// ... imports existentes ...
import { InvoiceService } from './invoice.service';

@Injectable()
export class SalesService {
  constructor(
    // ... repos existentes ...
    private invoiceService: InvoiceService
  ) {}

  async create(dto: CreateSaleDto, userId: string): Promise<Sale> {
    // ... validaciones existentes ...

    // Usar transacción para garantizar consistencia
    return this.dataSource.transaction(async manager => {
      // ... crear venta (código existente) ...

      const savedSale = await manager.save(sale);

      // ... actualizar inventario (código existente) ...

      // === NUEVO: Generar factura si se solicitó ===
      if (dto.generateInvoice) {
        try {
          const invoice = await this.invoiceService.generateInvoice(savedSale.id);
          
          if (invoice.status === 'authorized') {
            savedSale.isFiscal = true;
          } else {
            // Factura no autorizada - avisar al frontend
            // La venta se guarda pero sin factura fiscal
          }
        } catch (error) {
          // Error al generar factura - la venta sigue válida
          // Se puede reintentar después
          console.error('Error al generar factura:', error);
        }
      }

      await manager.save(savedSale);
      return this.findOne(savedSale.id);
    });
  }

  // ... resto de métodos existentes ...
}
```

---

## 8. Frontend (React)

### 8.1 Hooks Actualizados

#### **useSales.ts**
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salesApi } from '../api/sales.api';
import { toast } from 'sonner';

// ... hooks existentes ...

export function useGenerateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (saleId: string) => salesApi.generateInvoice(saleId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      if (data.status === 'authorized') {
        toast.success('Factura generada exitosamente');
      } else {
        toast.warning('La factura no pudo ser autorizada. Puede reintentar más tarde.');
      }
    },
    onError: () => {
      toast.error('Error al generar la factura');
    }
  });
}

export function useDownloadInvoicePdf() {
  return useMutation({
    mutationFn: async (invoiceId: string) => {
      const blob = await salesApi.downloadInvoicePdf(invoiceId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `factura-${invoiceId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  });
}

export function useDownloadReceiptPdf() {
  return useMutation({
    mutationFn: async (saleId: string) => {
      const blob = await salesApi.downloadReceiptPdf(saleId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recibo-${saleId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  });
}
```

### 8.2 Componente de Diálogo de Pago Actualizado

```tsx
// PaymentDialog.tsx - Fragmento con opción de factura

export function PaymentDialog({ open, onOpenChange, total, onConfirm }) {
  const [generateInvoice, setGenerateInvoice] = useState(true); // Default: generar factura
  
  // ...

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {/* ... campos de pago existentes ... */}

        {/* Opción de factura fiscal */}
        <div className="flex items-center space-x-2 mt-4 p-3 bg-muted rounded-lg">
          <Checkbox
            id="generateInvoice"
            checked={generateInvoice}
            onCheckedChange={setGenerateInvoice}
          />
          <Label htmlFor="generateInvoice" className="flex-1">
            Generar factura fiscal (AFIP)
          </Label>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </div>

        {!generateInvoice && (
          <Alert variant="warning" className="mt-2">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Se generará un recibo interno sin validez fiscal.
            </AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button onClick={() => onConfirm({ ...paymentData, generateInvoice })}>
            Confirmar Venta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### 8.3 Componente de Detalle de Venta con Acciones

```tsx
// SaleDetail.tsx - Acciones de factura/recibo

export function SaleDetail({ sale }) {
  const generateInvoice = useGenerateInvoice();
  const downloadInvoice = useDownloadInvoicePdf();
  const downloadReceipt = useDownloadReceiptPdf();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Venta {sale.saleNumber}</span>
          <Badge variant={sale.isFiscal ? 'success' : 'secondary'}>
            {sale.isFiscal ? 'Facturada' : 'Sin factura'}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {/* ... detalles de la venta ... */}
      </CardContent>

      <CardFooter className="flex gap-2">
        {sale.isFiscal && sale.invoice ? (
          <>
            {sale.invoice.status === 'authorized' ? (
              <Button
                variant="outline"
                onClick={() => downloadInvoice.mutate(sale.invoice.id)}
                disabled={downloadInvoice.isPending}
              >
                <Download className="mr-2 h-4 w-4" />
                Descargar Factura
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => generateInvoice.mutate(sale.id)}
                disabled={generateInvoice.isPending}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reintentar Factura
              </Button>
            )}
          </>
        ) : (
          <>
            <Button
              variant="outline"
              onClick={() => generateInvoice.mutate(sale.id)}
              disabled={generateInvoice.isPending}
            >
              <FileText className="mr-2 h-4 w-4" />
              Generar Factura
            </Button>
            <Button
              variant="ghost"
              onClick={() => downloadReceipt.mutate(sale.id)}
              disabled={downloadReceipt.isPending}
            >
              <Receipt className="mr-2 h-4 w-4" />
              Descargar Recibo
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
```

---

## 9. Flujos de Trabajo

### 9.1 Venta Fiscal (con Factura AFIP)

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUJO VENTA FISCAL                           │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────┐
│ Agregar items   │
│ al carrito      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Procesar Pago   │
│ [✓] Generar     │
│     factura     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Crear Venta     │
│ en BD           │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Actualizar      │
│ Inventario      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│ Solicitar CAE   │────▶│ AFIP OK?        │
│ a AFIP          │     └────────┬────────┘
└─────────────────┘              │
                        ┌────────┴────────┐
                        │                 │
                   ┌────▼────┐       ┌────▼────┐
                   │   SI    │       │   NO    │
                   └────┬────┘       └────┬────┘
                        │                 │
                        ▼                 ▼
               ┌─────────────────┐ ┌─────────────────┐
               │ Guardar CAE     │ │ Guardar error   │
               │ Generar QR      │ │ Avisar usuario  │
               │ Generar PDF     │ │ (reintentar)    │
               └────────┬────────┘ └────────┬────────┘
                        │                   │
                        ▼                   ▼
               ┌─────────────────────────────────────┐
               │ Venta registrada exitosamente       │
               │ [Descargar Factura] o [Reintentar]  │
               └─────────────────────────────────────┘
```

### 9.2 Venta No Fiscal (Recibo Interno)

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUJO VENTA NO FISCAL                        │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────┐
│ Agregar items   │
│ al carrito      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Procesar Pago   │
│ [ ] Generar     │  ◀── Sin tildar
│     factura     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ ⚠️ Aviso:        │
│ "Se generará    │
│ recibo sin      │
│ validez fiscal" │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Crear Venta     │
│ en BD           │
│ (isFiscal=false)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Actualizar      │
│ Inventario      │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ Venta registrada exitosamente       │
│ [Descargar Recibo]                  │
│ [Generar Factura] ◀── disponible    │
│                       después       │
└─────────────────────────────────────┘
```

### 9.3 Contingencia (AFIP no disponible)

Si AFIP no está disponible al momento de la venta:

1. La venta se registra normalmente
2. Se muestra aviso: "No se pudo generar la factura fiscal. AFIP no disponible."
3. La venta queda marcada con `isFiscal = false`
4. El usuario puede:
   - Descargar un recibo interno
   - Reintentar la generación de factura más tarde con el botón "Generar Factura"

---

## 10. Casos de Uso Actualizados

### 10.1 Venta Contado con Factura C (Monotributista)

**Flujo**:
1. Vendedor busca y agrega productos al carrito
2. Ajusta cantidades si es necesario
3. Click en "Procesar Pago"
4. Selecciona método de pago (efectivo/tarjeta)
5. **Deja marcado "Generar factura fiscal"**
6. Sistema valida stock
7. Sistema reduce stock automáticamente
8. **Sistema solicita CAE a AFIP**
9. **Sistema genera Factura C con QR**
10. **Usuario puede descargar PDF de la factura**

### 10.2 Venta Contado sin Factura (Recibo Interno)

**Flujo**:
1. Vendedor busca y agrega productos al carrito
2. Click en "Procesar Pago"
3. Selecciona método de pago
4. **Desmarca "Generar factura fiscal"**
5. **Sistema muestra aviso: "Se generará recibo sin validez fiscal"**
6. Sistema valida stock
7. Sistema reduce stock
8. **Usuario puede descargar recibo en PDF**
9. **Posteriormente puede generar factura si lo necesita**

### 10.3 Venta con Error de AFIP

**Flujo**:
1. Vendedor registra venta con factura
2. Sistema intenta comunicarse con AFIP
3. **AFIP rechaza o no responde**
4. **Sistema muestra: "No se pudo generar la factura. Puede reintentar."**
5. Venta queda guardada sin factura
6. **Botón "Reintentar Factura" disponible**
7. Usuario puede reintentar cuando AFIP esté disponible

### 10.4 Venta en Cuenta Corriente con Factura

**Flujo**:
1. Seleccionar cliente registrado (con CUIT/DNI)
2. Agregar productos
3. Marcar "Venta en Cuenta Corriente"
4. **Marcar "Generar factura fiscal"**
5. Sistema genera factura a nombre del cliente
6. Venta queda en estado PENDING
7. Se genera deuda en cuenta corriente
8. Factura disponible para descargar

---

## 11. Consideraciones de Seguridad

### 11.1 Certificados AFIP

- Los certificados `.crt` y `.key` **NUNCA** deben commitearse al repositorio
- Almacenar en variables de entorno o sistema de secrets
- Usar `.gitignore` para la carpeta de certificados
- Rotar certificados según política de AFIP

### 11.2 Variables de Entorno

```bash
# .env.example
AFIP_ENVIRONMENT=homologacion   # o 'produccion'
AFIP_CUIT=20123456789
AFIP_CERTIFICATE_PATH=/path/to/certificate.crt
AFIP_PRIVATE_KEY_PATH=/path/to/privatekey.key
AFIP_POINT_OF_SALE=1
```

### 11.3 Auditoría

- Guardar respuestas completas de AFIP en `afipResponse`
- Registrar intentos fallidos con mensaje de error
- Mantener historial de CAEs emitidos

---

## 12. Integraciones

### 12.1 Con Inventario (Existente)

```typescript
// Antes de crear venta: validar stock
await inventoryService.checkMultipleProductsStock(items);

// Después de crear venta: reducir stock
await inventoryService.reduceStockFromSale({
  productId, quantity, saleId
});
```

### 12.2 Con Cuentas Corrientes (Existente)

```typescript
// Si isOnAccount = true
await accountsService.createDebt({
  customerId,
  amount: sale.total,
  saleId: sale.id
});
```

### 12.3 Con Módulo de Caja (Futuro)

Las ventas (fiscales y no fiscales) alimentarán el módulo de caja para control de ingresos:

```typescript
// Registrar ingresos por cada pago
for (const payment of sale.payments) {
  await cashService.registerIncome({
    amount: payment.amount,
    method: payment.paymentMethod,
    saleId: sale.id,
    invoiceId: sale.invoice?.id,
    description: sale.isFiscal 
      ? `Factura ${sale.invoice.invoiceNumber}` 
      : `Recibo ${sale.saleNumber}`
  });
}
```

---

## 13. Dependencias Requeridas

### 13.1 Backend (package.json)

```json
{
  "dependencies": {
    "soap": "^1.0.0",           // Cliente SOAP para AFIP
    "qrcode": "^1.5.3",         // Generación de QR
    "puppeteer": "^21.0.0",     // Generación de PDF
    "handlebars": "^4.7.8",     // Templates HTML
    "node-forge": "^1.3.1"      // Firma CMS/PKCS#7
  }
}
```

### 13.2 Frontend (package.json)

```json
{
  "dependencies": {
    // Existentes ya incluyen lo necesario
    "@tanstack/react-query": "...",
    "sonner": "..."
  }
}
```

---

## 14. Testing

### 14.1 Tests de Integración AFIP (Homologación)

```typescript
describe('AfipService', () => {
  it('debe obtener token de autenticación', async () => {
    const token = await afipService.getAuthToken();
    expect(token.token).toBeDefined();
    expect(token.sign).toBeDefined();
  });

  it('debe autorizar Factura C en homologación', async () => {
    const response = await afipService.authorizeInvoice({
      invoiceType: 11,
      pointOfSale: 1,
      concept: 1,
      docType: 99,
      docNumber: '0',
      issueDate: '20241129',
      total: 1000,
      netAmount: 0,
      netAmountExempt: 1000,
      iva: [],
      otherTaxes: 0
    });

    expect(response.success).toBe(true);
    expect(response.cae).toHaveLength(14);
  });
});
```

### 14.2 Tests de Generación de PDF

```typescript
describe('PdfGeneratorService', () => {
  it('debe generar PDF de Factura C', async () => {
    const pdfPath = await pdfService.generateInvoicePdf(mockInvoice);
    expect(fs.existsSync(pdfPath)).toBe(true);
  });

  it('debe generar PDF de Recibo', async () => {
    const pdfPath = await pdfService.generateReceiptPdf(mockSale);
    expect(fs.existsSync(pdfPath)).toBe(true);
  });
});
```

---

## 15. Próximos Pasos de Implementación

### Fase 1: Configuración Base
1. [ ] Agregar campos fiscales al módulo de configuración
2. [ ] Crear entidad `Invoice`
3. [ ] Migración de base de datos

### Fase 2: Integración AFIP
4. [ ] Implementar `AfipService` (autenticación WSAA)
5. [ ] Implementar autorización de comprobantes (WSFE)
6. [ ] Configurar ambiente de homologación
7. [ ] Tests de integración con AFIP

### Fase 3: Generación de Documentos
8. [ ] Implementar `QrGeneratorService`
9. [ ] Implementar `PdfGeneratorService`
10. [ ] Adaptar templates HTML (Factura C, Recibo)

### Fase 4: Backend
11. [ ] Crear `InvoiceService`
12. [ ] Actualizar `SalesService`
13. [ ] Crear endpoints de facturas
14. [ ] Actualizar endpoints de ventas

### Fase 5: Frontend
15. [ ] Actualizar diálogo de pago con opción de factura
16. [ ] Componente de detalle de venta con acciones
17. [ ] Botones de descarga (Factura/Recibo)
18. [ ] Manejo de errores y reintentos

### Fase 6: Testing y Deploy
19. [ ] Tests completos en homologación
20. [ ] Solicitar paso a producción AFIP
21. [ ] Configurar certificados de producción
22. [ ] Deploy a producción

---

## 16. Limitaciones del Alcance Actual

Por simplicidad, **NO se incluyen** en esta versión:

- ❌ **Notas de Crédito / Débito**: Se hacen manualmente en AFIP
- ❌ **CAEA (Código de Autorización Electrónico Anticipado)**: Solo se usa CAE
- ❌ **Facturación de Exportación (WSFEX)**: Solo mercado interno
- ❌ **Múltiples puntos de venta**: Solo un punto de venta configurable
- ❌ **Impresión directa**: Solo descarga de PDF

---

**Módulo de Ventas con Facturación Fiscal - ready para desarrollo** 🚀
