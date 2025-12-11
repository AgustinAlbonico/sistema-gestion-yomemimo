import { Controller, Get, Post } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PaymentMethodsService } from '../services/payment-methods.service';

@ApiTags('Configuration')
@Controller('configuration/payment-methods')
export class PaymentMethodsController {
    constructor(private readonly service: PaymentMethodsService) { }

    @Get()
    @ApiOperation({ summary: 'Listar métodos de pago activos' })
    findAll() {
        return this.service.findAll();
    }

    @Post('seed')
    @ApiOperation({ summary: 'Inicializar métodos de pago por defecto' })
    seed() {
        return this.service.seed();
    }
}
