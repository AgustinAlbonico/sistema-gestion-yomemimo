/**
 * Condiciones frente al IVA estandarizadas
 * Sincronizadas con el backend
 */

export enum IvaCondition {
    CONSUMIDOR_FINAL = 'CONSUMIDOR_FINAL',
    RESPONSABLE_MONOTRIBUTO = 'RESPONSABLE_MONOTRIBUTO',
    RESPONSABLE_INSCRIPTO = 'RESPONSABLE_INSCRIPTO',
    EXENTO = 'EXENTO',
}

/**
 * Labels para mostrar en la UI
 */
export const IvaConditionLabels: Record<IvaCondition, string> = {
    [IvaCondition.CONSUMIDOR_FINAL]: 'Consumidor Final',
    [IvaCondition.RESPONSABLE_MONOTRIBUTO]: 'Responsable Monotributo',
    [IvaCondition.RESPONSABLE_INSCRIPTO]: 'Responsable Inscripto',
    [IvaCondition.EXENTO]: 'Exento',
};

/**
 * Opciones para select/dropdown
 */
export const IvaConditionOptions = Object.entries(IvaConditionLabels).map(
    ([value, label]) => ({
        value,
        label,
    })
);

/**
 * Valor por defecto
 */
export const DEFAULT_IVA_CONDITION = IvaCondition.CONSUMIDOR_FINAL;
