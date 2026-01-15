
import { ApiProperty } from '@nestjs/swagger';

export class CategoryDeletionPreviewDTO {
    @ApiProperty({ description: 'Cantidad total de productos en la categoría' })
    productCount!: number;

    @ApiProperty({ description: 'Cantidad de productos que usarán el margen global (sin margen personalizado)' })
    affectedProductsCount!: number;

    @ApiProperty({ description: 'Margen de ganancia global del sistema' })
    globalMargin!: number;
}
