/**
 * Script para debuggear el usuario admin y verificar su estado
 */
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'node:path';
import * as bcrypt from 'bcryptjs';
import { User } from '../modules/auth/entities/user.entity';
import { RefreshToken } from '../modules/auth/entities/refresh-token.entity';

// Cargar variables de entorno desde la raíz del monorepo
config({ path: path.resolve(__dirname, '../../../../.env') });

const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: Number.parseInt(process.env.DATABASE_PORT || '5432'),
    username: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'sistema_gestion',
    entities: [User, RefreshToken],
    synchronize: false,
});

async function debugAdmin() {
    try {
        console.log('🔍 Debuggeando usuario admin...');
        console.log('Connecting to database...');
        await dataSource.initialize();
        console.log('✅ Database connected successfully.\n');

        const userRepository = dataSource.getRepository(User);
        const username = 'admin';

        // Buscar usuario con passwordHash incluido
        const user = await userRepository
            .createQueryBuilder('user')
            .addSelect('user.passwordHash')
            .where('user.username = :username', { username })
            .getOne();

        if (!user) {
            console.error('❌ El usuario admin NO existe en la base de datos.');
            console.log('\n💡 Ejecuta: npm run seed');
            return;
        }

        console.log('✅ Usuario encontrado:');
        console.log(`   ID: ${user.id}`);
        console.log(`   Username: ${user.username}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Nombre: ${user.firstName} ${user.lastName}`);
        console.log(`   Activo: ${user.isActive}`);
        console.log(`   PasswordHash: ${user.passwordHash ? user.passwordHash.substring(0, 20) + '...' : 'NULL'}`);
        console.log(`   Hash empieza con $2b$: ${user.passwordHash?.startsWith('$2b$') || false}`);
        console.log(`   Hash empieza con $2a$: ${user.passwordHash?.startsWith('$2a$') || false}`);

        // Probar validación de contraseña
        console.log('\n🔐 Probando validación de contraseña...');
        const testPassword = 'Admin123';
        
        if (!user.passwordHash) {
            console.error('❌ El usuario no tiene passwordHash!');
            return;
        }

        const isValid = await bcrypt.compare(testPassword, user.passwordHash);
        console.log(`   Contraseña a probar: "${testPassword}"`);
        console.log(`   Resultado de bcrypt.compare: ${isValid ? '✅ VÁLIDA' : '❌ INVÁLIDA'}`);

        if (!isValid) {
            console.log('\n⚠️  La contraseña no coincide. Generando nuevo hash...');
            const newHash = await bcrypt.hash(testPassword, 10);
            console.log(`   Nuevo hash: ${newHash.substring(0, 30)}...`);
            
            // Actualizar contraseña
            await userRepository
                .createQueryBuilder()
                .update(User)
                .set({ 
                    passwordHash: newHash,
                    isActive: true 
                })
                .where('id = :id', { id: user.id })
                .execute();

            // Verificar nuevamente
            const updatedUser = await userRepository
                .createQueryBuilder('user')
                .addSelect('user.passwordHash')
                .where('user.id = :id', { id: user.id })
                .getOne();

            if (updatedUser) {
                const isValidAfter = await bcrypt.compare(testPassword, updatedUser.passwordHash);
                console.log(`   Verificación después de actualizar: ${isValidAfter ? '✅ VÁLIDA' : '❌ INVÁLIDA'}`);
                
                if (isValidAfter) {
                    console.log('\n✅ Contraseña actualizada correctamente!');
                    console.log('   Ahora puedes iniciar sesión con:');
                    console.log(`   Username: ${username}`);
                    console.log(`   Password: ${testPassword}`);
                }
            }
        } else {
            console.log('\n✅ La contraseña es válida. El problema puede estar en otro lado.');
            console.log('   Verifica:');
            console.log('   - Que el usuario esté activo (isActive: true)');
            console.log('   - Que el username sea exactamente "admin" (sin espacios)');
            console.log('   - Que la contraseña sea exactamente "Admin123" (mayúscula A, minúsculas, número)');
        }

    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    } finally {
        if (dataSource.isInitialized) {
            await dataSource.destroy();
            console.log('\nDatabase connection closed.');
        }
    }
}

debugAdmin();

