import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { User } from '../modules/auth/entities/user.entity';
import { RefreshToken } from '../modules/auth/entities/refresh-token.entity';
import * as path from 'path';

// Cargar variables de entorno desde la raíz del monorepo
config({ path: path.resolve(__dirname, '../../../../.env') });

const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    username: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'sistema_gestion',
    entities: [User, RefreshToken],
    synchronize: true,
    dropSchema: true, // Forzar sincronización para actualizar esquema
});

async function seed() {
    try {
        console.log('Connecting to database...');
        await dataSource.initialize();
        console.log('Database connected successfully.');

        const userRepository = dataSource.getRepository(User);
        const username = 'admin';
        const email = 'admin@admin.com';

        // Verificar si ya existe
        const existingUser = await userRepository.findOneBy({ username });

        if (existingUser) {
            console.log(`⚠️  El usuario ${username} ya existe.`);
        } else {
            // Crear nuevo usuario
            const newUser = userRepository.create({
                username,
                email,
                passwordHash: 'Admin123', // Contraseña por defecto
                firstName: 'Admin',
                lastName: 'Sistema',
                isActive: true,
            });

            await userRepository.save(newUser);
            console.log(`✅ Usuario creado exitosamente:`);
            console.log(`   Username: ${username}`);
            console.log(`   Password: Admin123`);
        }

    } catch (error) {
        console.error('❌ Error seeding database:', error);
    } finally {
        await dataSource.destroy();
        console.log('Database connection closed.');
    }
}

seed();
