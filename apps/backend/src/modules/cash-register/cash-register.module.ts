import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CashRegisterService } from './cash-register.service';
import { CashRegisterController } from './cash-register.controller';
import { CashRegister } from './entities/cash-register.entity';
import { CashMovement } from './entities/cash-movement.entity';
import { CashRegisterTotals } from './entities/cash-register-totals.entity';

import { PaymentMethod } from '../configuration/entities/payment-method.entity';

@Module({
    imports: [TypeOrmModule.forFeature([CashRegister, CashMovement, CashRegisterTotals, PaymentMethod])],
    controllers: [CashRegisterController],
    providers: [CashRegisterService],
    exports: [CashRegisterService],
})
export class CashRegisterModule { }
