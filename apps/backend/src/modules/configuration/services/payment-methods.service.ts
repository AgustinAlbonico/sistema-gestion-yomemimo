import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentMethod } from '../entities/payment-method.entity';

@Injectable()
export class PaymentMethodsService implements OnModuleInit {
    constructor(
        @InjectRepository(PaymentMethod)
        private repo: Repository<PaymentMethod>,
    ) { }

    async onModuleInit() {
        await this.seed();
        await this.deactivateWalletMethod();
    }

    async findAll() {
        return this.repo.find({
            where: { isActive: true },
            order: { name: 'ASC' },
        });
    }

    async deactivateWalletMethod() {
        // Desactivar el método 'wallet' antiguo para evitar duplicados con 'qr'
        const walletMethod = await this.repo.findOne({ where: { code: 'wallet' } });
        if (walletMethod && walletMethod.isActive) {
            walletMethod.isActive = false;
            await this.repo.save(walletMethod);
            console.log('Método de pago "wallet" desactivado (reemplazado por "qr")');
        }
    }

    async seed() {
        const methods = [
            { name: 'Efectivo', code: 'cash' },
            { name: 'Tarjeta de Débito', code: 'debit_card' },
            { name: 'Tarjeta de Crédito', code: 'credit_card' },
            { name: 'Transferencia', code: 'transfer' },
            { name: 'QR / Billetera Virtual', code: 'qr' },
            { name: 'Cheque', code: 'check' },
            { name: 'Otro', code: 'other' },
        ];

        let createdCount = 0;
        for (const method of methods) {
            const exists = await this.repo.findOne({ where: { code: method.code }, withDeleted: true });
            if (!exists) {
                await this.repo.save(this.repo.create(method));
                createdCount++;
            } else if (exists.deletedAt) {
                // Si estaba eliminado, lo restauramos
                await this.repo.restore(exists.id);
                // Aseguramos que esté activo
                if (!exists.isActive) {
                    exists.isActive = true;
                    await this.repo.save(exists);
                }
                createdCount++;
            } else {
                // Si existe, aseguramos que tenga el nombre correcto (especialmente para QR)
                if (exists.name !== method.name) {
                    exists.name = method.name;
                    await this.repo.save(exists);
                }
            }
        }
        return { created: createdCount };
    }
}
