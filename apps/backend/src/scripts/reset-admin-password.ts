/**
 * Script para resetear la contraseña del usuario admin
 * Útil cuando el usuario admin existe pero la contraseña no funciona
 */
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'node:path';
import * as bcrypt from 'bcryptjs';
import { User } from '../modules/auth/entities/user.entity';

// Cargar variables de entorno desde la raíz del monorepo
config({ path: path.resolve(__dirname, '../../../../.env') });

const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: Number.parseInt(process.env.DATABASE_PORT || '5432'),
    username: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'sistema_gestion',
    entities: [User],
    synchronize: false,
});

async function resetAdminPassword() {
    try {
        console.log('🔐 Reseteando contraseña del usuario admin...');
        console.log('Connecting to database...');
        await dataSource.initialize();
        console.log('✅ Database connected successfully.');

        const userRepository = dataSource.getRepository(User);
        const username = 'admin';

        const user = await userRepository.findOneBy({ username });

        if (!user) {
            console.error('❌ El usuario admin no existe. Ejecuta el seed primero.');
            return;
        }

        // Generar nuevo hash de contraseña
        const passwordHash = await bcrypt.hash('Admin123', 10);
        
        // Actualizar directamente usando query builder para evitar hooks
        await userRepository
            .createQueryBuilder()
            .update(User)
            .set({ passwordHash, isActive: true })
            .where('id = :id', { id: user.id })
            .execute();

        console.log('✅ Contraseña del usuario admin actualizada exitosamente:');
        console.log(`   Username: ${username}`);
        console.log(`   Password: Admin123`);
        console.log('\n💡 Ahora puedes iniciar sesión con estas credenciales.');

    } catch (error) {
        console.error('❌ Error reseteando contraseña:', error);
        throw error;
    } finally {
        await dataSource.destroy();
        console.log('\nDatabase connection closed.');
    }
}

resetAdminPassword();

