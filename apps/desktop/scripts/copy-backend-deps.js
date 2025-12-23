/**
 * Script para copiar TODAS las dependencias de Express y PG con sus subdependencias.
 * Esto es necesario porque tienen muchas dependencias transitivas.
 */

const fs = require('fs');
const path = require('path');

const ROOT_NODE_MODULES = path.resolve(__dirname, '../../../node_modules');

/**
 * Copia un directorio recursivamente
 */
function copyDirSync(src, dest) {
  if (!fs.existsSync(src)) {
    console.warn(`  ⚠ No existe: ${src}`);
    return false;
  }

  fs.mkdirSync(dest, { recursive: true });

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }

  return true;
}

/**
 * Lee las dependencias de un package.json recursivamente
 */
function getAllDependencies(packageName, visited = new Set()) {
  if (visited.has(packageName)) {
    return visited;
  }

  visited.add(packageName);

  const packageJsonPath = path.join(ROOT_NODE_MODULES, packageName, 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    return visited;
  }

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const deps = packageJson.dependencies || {};

    for (const dep of Object.keys(deps)) {
      getAllDependencies(dep, visited);
    }
  } catch (error) {
    console.warn(`  ⚠ Error leyendo ${packageName}: ${error.message}`);
  }

  return visited;
}

/**
 * Crea la estructura extraResources para electron-builder
 */
function generateElectronBuilderConfig() {
  console.log('\n📝 Generando lista de dependencias para electron-builder.yml...\n');

  const allDeps = new Set();
  
  // Obtener todas las dependencias de express y pg
  getAllDependencies('express', allDeps);
  getAllDependencies('pg', allDeps);

  const sortedDeps = Array.from(allDeps).sort();

  console.log(`Total de dependencias encontradas: ${sortedDeps.length}\n`);
  
  // Generar la sección extraResources
  const config = sortedDeps.map(dep => 
    `  - from: ../../node_modules/${dep}\n    to: backend/node_modules/${dep}`
  ).join('\n');

  const configPath = path.join(__dirname, '../backend-deps.txt');
  fs.writeFileSync(configPath, config, 'utf-8');
  
  console.log(`✅ Configuración guardada en: ${configPath}\n`);
  console.log('Copia este contenido en electron-builder.yml bajo la sección extraResources\n');
  
  return sortedDeps;
}

function main() {
  console.log('📦 Analizando dependencias de Express y PostgreSQL...\n');

  // Generar la lista completa
  const allDeps = generateElectronBuilderConfig();

  console.log('Dependencias encontradas:');
  allDeps.forEach(dep => console.log(`  - ${dep}`));
}

main();

