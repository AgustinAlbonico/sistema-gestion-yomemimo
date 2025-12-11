/**
 * Utilidades SOAP para WSFE (Web Service de Facturación Electrónica)
 * Funciones para crear requests y parsear responses de AFIP WSFE
 */
import { parseStringPromise } from 'xml2js';

/**
 * Crea request SOAP para FECompUltimoAutorizado
 * Obtiene el último número de comprobante autorizado
 */
export function createFECompUltimoAutorizadoRequest(
    token: string,
    sign: string,
    cuit: string,
    pointOfSale: number,
    invoiceType: number
): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ar="http://ar.gov.afip.dif.FEV1/">
   <soapenv:Header/>
   <soapenv:Body>
      <ar:FECompUltimoAutorizado>
         <ar:Auth>
            <ar:Token>${token}</ar:Token>
            <ar:Sign>${sign}</ar:Sign>
            <ar:Cuit>${cuit}</ar:Cuit>
         </ar:Auth>
         <ar:PtoVta>${pointOfSale}</ar:PtoVta>
         <ar:CbteTipo>${invoiceType}</ar:CbteTipo>
      </ar:FECompUltimoAutorizado>
   </soapenv:Body>
</soapenv:Envelope>`;
}

/**
 * Parsea respuesta de FECompUltimoAutorizado
 */
export async function parseFECompUltimoResponse(xml: string): Promise<number> {
    try {
        const result = await parseStringPromise(xml, { explicitArray: false });
        const body = result['soap:Envelope']['soap:Body'];
        const response = body.FECompUltimoAutorizadoResponse?.FECompUltimoAutorizadoResult;

        if (!response) {
            throw new Error('Respuesta WSFE inválida: no se encontró FECompUltimoAutorizadoResult');
        }

        // Si hay error
        if (response.Errors) {
            const error = Array.isArray(response.Errors.Err)
                ? response.Errors.Err[0]
                : response.Errors.Err;
            throw new Error(`Error WSFE: ${error.Msg || 'Error desconocido'}`);
        }

        return parseInt(response.CbteNro || '0', 10);
    } catch (error) {
        throw new Error(`Error al parsear respuesta WSFE: ${(error as Error).message}`);
    }
}

/**
 * Interface para item de IVA
 */
export interface WSFEIvaItem {
    Id: number;      // 3=0%, 4=10.5%, 5=21%, 6=27%
    BaseImp: number;
    Importe: number;
}

/**
 * Interface para request de autorización
 */
export interface WSFEAuthRequest {
    invoiceType: number;
    pointOfSale: number;
    concept: number;
    docType: number;
    docNumber: string;
    receiverIvaCondition: number; // Condición de IVA del receptor (no se usa en el XML, solo para referencia)
    invoiceNumber: number;
    invoiceDate: string;  // YYYYMMDD
    totalAmount: number;
    netAmount: number;
    exemptAmount: number;
    ivaAmount: number;
    ivaItems: WSFEIvaItem[];
}

/**
 * Crea request SOAP para FECAESolicitar
 * Solicita CAE para un comprobante
 */
export function createFECAESolicitarRequest(
    token: string,
    sign: string,
    cuit: string,
    request: WSFEAuthRequest
): string {
    // Limpiar número de documento: solo dígitos (sin guiones ni espacios)
    const cleanDocNumber = request.docNumber.replace(/[^0-9]/g, '');

    console.log('Creating FECAESolicitar request with:', {
        token: token.substring(0, 50) + '...',
        sign: sign.substring(0, 50) + '...',
        cuit,
        request,
        cleanDocNumber
    });

    // Construir items de IVA
    const ivaItemsXml = request.ivaItems.map(item => `
               <ar:AlicIva>
                  <ar:Id>${item.Id}</ar:Id>
                  <ar:BaseImp>${item.BaseImp.toFixed(2)}</ar:BaseImp>
                  <ar:Importe>${item.Importe.toFixed(2)}</ar:Importe>
               </ar:AlicIva>`).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ar="http://ar.gov.afip.dif.FEV1/">
   <soapenv:Header/>
   <soapenv:Body>
      <ar:FECAESolicitar>
         <ar:Auth>
            <ar:Token>${token}</ar:Token>
            <ar:Sign>${sign}</ar:Sign>
            <ar:Cuit>${cuit}</ar:Cuit>
         </ar:Auth>
         <ar:FeCAEReq>
            <ar:FeCabReq>
               <ar:CantReg>1</ar:CantReg>
               <ar:PtoVta>${request.pointOfSale}</ar:PtoVta>
               <ar:CbteTipo>${request.invoiceType}</ar:CbteTipo>
            </ar:FeCabReq>
            <ar:FeDetReq>
               <ar:FECAEDetRequest>
                  <ar:Concepto>${request.concept}</ar:Concepto>
                  <ar:DocTipo>${request.docType}</ar:DocTipo>
                  <ar:DocNro>${cleanDocNumber}</ar:DocNro>
                  <ar:CbteDesde>${request.invoiceNumber}</ar:CbteDesde>
                  <ar:CbteHasta>${request.invoiceNumber}</ar:CbteHasta>
                  <ar:CbteFch>${request.invoiceDate}</ar:CbteFch>
                  <ar:ImpTotal>${request.totalAmount.toFixed(2)}</ar:ImpTotal>
                  <ar:ImpTotConc>0.00</ar:ImpTotConc>
                  <ar:ImpNeto>${request.netAmount.toFixed(2)}</ar:ImpNeto>
                  <ar:ImpOpEx>${request.exemptAmount.toFixed(2)}</ar:ImpOpEx>
                  <ar:ImpTrib>0.00</ar:ImpTrib>
                  <ar:ImpIVA>${request.ivaAmount.toFixed(2)}</ar:ImpIVA>
                  <ar:MonId>PES</ar:MonId>
                  <ar:MonCotiz>1</ar:MonCotiz>
                  <ar:CondicionIVAReceptorId>${request.receiverIvaCondition}</ar:CondicionIVAReceptorId>${ivaItemsXml ? `
                  <ar:Iva>${ivaItemsXml}
                  </ar:Iva>` : ''}
               </ar:FECAEDetRequest>
            </ar:FeDetReq>
         </ar:FeCAEReq>
      </ar:FECAESolicitar>
   </soapenv:Body>
</soapenv:Envelope>`;
}

/**
 * Interface para respuesta de autorización
 */
export interface WSFEAuthResponse {
    success: boolean;
    cae?: string;
    caeExpirationDate?: string;
    invoiceNumber?: number;
    errors?: string[];
    observations?: string[];
}

/**
 * Parsea respuesta de FECAESolicitar
 */
export async function parseFECAEResponse(xml: string): Promise<WSFEAuthResponse> {
    try {
        const result = await parseStringPromise(xml, { explicitArray: false });
        const body = result['soap:Envelope']['soap:Body'];
        const response = body.FECAESolicitarResponse?.FECAESolicitarResult;

        if (!response) {
            throw new Error('Respuesta WSFE inválida: no se encontró FECAESolicitarResult');
        }

        const errors: string[] = [];
        const observations: string[] = [];

        // Errores generales
        if (response.Errors) {
            const errorList = Array.isArray(response.Errors.Err)
                ? response.Errors.Err
                : [response.Errors.Err];
            errorList.forEach((err: { Msg?: string }) => {
                if (err && err.Msg) errors.push(err.Msg);
            });
        }

        // Detalle del comprobante
        const detResponse = response.FeDetResp?.FECAEDetResponse;

        if (!detResponse) {
            return {
                success: false,
                errors: errors.length > 0 ? errors : ['No se recibió detalle de respuesta'],
            };
        }

        // Resultado: A=Aprobado, R=Rechazado, P=Parcial
        const resultado = detResponse.Resultado;

        // Observaciones
        if (detResponse.Observaciones) {
            const obsList = Array.isArray(detResponse.Observaciones.Obs)
                ? detResponse.Observaciones.Obs
                : [detResponse.Observaciones.Obs];
            obsList.forEach((obs: { Code?: string; Msg?: string }) => {
                if (obs && obs.Msg) {
                    const code = obs.Code ? `[${obs.Code}] ` : '';
                    observations.push(`${code}${obs.Msg}`);
                }
            });
        }

        // Errores del detalle del comprobante
        if (detResponse.Errores) {
            const detErrorList = Array.isArray(detResponse.Errores.Err)
                ? detResponse.Errores.Err
                : [detResponse.Errores.Err];
            detErrorList.forEach((err: { Code?: string; Msg?: string }) => {
                if (err && err.Msg) {
                    const code = err.Code ? `[${err.Code}] ` : '';
                    errors.push(`${code}${err.Msg}`);
                }
            });
        }

        if (resultado === 'A') {
            return {
                success: true,
                cae: detResponse.CAE,
                caeExpirationDate: detResponse.CAEFchVto,
                invoiceNumber: parseInt(detResponse.CbteDesde, 10),
                observations: observations.length > 0 ? observations : undefined,
            };
        } else {
            // Si no hay errores específicos, usar observaciones o dar contexto
            const finalErrors = errors.length > 0
                ? errors
                : observations.length > 0
                    ? [`Rechazado (${resultado}): ${observations.join('; ')}`]
                    : [`Comprobante rechazado por AFIP (Resultado: ${resultado})`];

            return {
                success: false,
                errors: finalErrors,
                observations: observations.length > 0 ? observations : undefined,
            };
        }

    } catch (error) {
        throw new Error(`Error al parsear respuesta WSFE: ${(error as Error).message}`);
    }
}
