/**
 * Script para corregir el usuario admin
 */
import * as bcrypt from 'bcryptjs';
import { DataSource } from 'typeorm';

async function fixAdmin() {
    console.log('🔧 Corrigiendo usuario admin...');

    const dataSource = new DataSource({
        type: 'postgres',
        host: 'localhost',
        port: 5432,
        username: 'postgres',
        password: 'Admin123',
        database: 'sistema_gestion',
        synchronize: false,
        logging: false,
    });

    try {
        await dataSource.initialize();
        console.log('✅ Conexión establecida');

        // Generar nuevo hash
        const newHash = await bcrypt.hash('Admin123', 10);
        console.log('📌 Nuevo hash generado');

        // Actualizar contraseña
        await dataSource.query(
            `UPDATE users SET password_hash = $1 WHERE username = $2`,
            [newHash, 'admin']
        );
        console.log('✅ Contraseña del admin actualizada a "Admin123"');

        await dataSource.destroy();
        console.log('🔌 Listo! Ahora podés iniciar sesión con admin / Admin123');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

fixAdmin();
