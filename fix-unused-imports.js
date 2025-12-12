/**
 * Script para eliminar imports no utilizados automáticamente
 * Usa expresiones regulares para detectar y remover imports comunes no utilizados
 */
const fs = require('node:fs');
const path = require('node:path');

// Imports comunes que suelen estar sin usar en DTOs
const commonUnusedImports = [
    'IsEnum',
    'Min',
    'Max',
    'MaxLength',
    'MinLength',
    'IsInt',
    'IsPositive',
    'IsNegative',
    'ArrayMinSize',
    'ArrayMaxSize',
    'AlertCircle',
    'FormMessage',
];

/**
 * Procesa un archivo para remover imports no utilizados
 */
function processFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;
        const originalContent = content;

        // Para cada import no utilizado común
        for (const importName of commonUnusedImports) {
            // Verificar si el import está declarado
            const importRegex = new RegExp(`\\b${importName}\\b`, 'g');
            const matches = content.match(importRegex);

            if (!matches || matches.length === 0) continue;

            // Contar cuántas veces aparece (1 = solo en el import, no se usa)
            if (matches.length === 1) {
                // Remover de la lista de imports
                // Patrón 1: , ImportName,
                content = content.replace(new RegExp(`,\\s*${importName}\\s*,`, 'g'), ',');
                // Patrón 2: , ImportName}
                content = content.replace(new RegExp(`,\\s*${importName}\\s*}`, 'g'), '}');
                // Patrón 3: { ImportName,
                content = content.replace(new RegExp(`{\\s*${importName}\\s*,`, 'g'), '{');
                // Patrón 4: { ImportName }
                content = content.replace(new RegExp(`{\\s*${importName}\\s*}`, 'g'), '{}');

                modified = true;
            }
        }

        // Limpiar imports vacíos
        content = content.replace(/import\s*{\s*}\s*from\s*['"][^'"]+['"];?\s*\n/g, '');

        // Limpiar múltiples líneas vacías
        content = content.replace(/(\r?\n){3,}/g, '\r\n\r\n');

        // Limpiar comas duplicadas en imports
        content = content.replace(/,\s*,/g, ',');

        // Limpiar espacios antes de }
        content = content.replace(/,\s*}/g, '\n}');

        if (modified && content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ Procesado: ${path.relative(process.cwd(), filePath)}`);
            return true;
        }

        return false;
    } catch (error) {
        console.error(`❌ Error procesando ${filePath}:`, error.message);
        return false;
    }
}

/**
 * Busca archivos recursivamente
 */
function findFiles(dir, pattern, results = []) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            // Ignorar node_modules y dist
            if (!file.includes('node_modules') && !file.includes('dist') && !file.includes('.git')) {
                findFiles(filePath, pattern, results);
            }
        } else if (pattern.test(file)) {
            results.push(filePath);
        }
    }

    return results;
}

// Ejecutar
console.log('🔍 Buscando archivos TypeScript...\n');

const backendFiles = findFiles(
    path.join(__dirname, 'apps', 'backend', 'src'),
    /\.(ts|tsx)$/
);

const frontendFiles = findFiles(
    path.join(__dirname, 'apps', 'frontend', 'src'),
    /\.(ts|tsx)$/
);

const allFiles = [...backendFiles, ...frontendFiles];

console.log(`📁 Encontrados ${allFiles.length} archivos\n`);
console.log('🧹 Limpiando imports no utilizados...\n');

let processedCount = 0;
for (const file of allFiles) {
    if (processFile(file)) {
        processedCount++;
    }
}

console.log(`\n✨ Completado: ${processedCount} archivos modificados de ${allFiles.length} totales`);
