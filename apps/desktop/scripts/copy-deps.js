/**
 * Script para copiar las dependencias de Electron al directorio del desktop.
 * Esto es necesario porque npm workspaces hoistea todo al root del monorepo.
 */

const fs = require('fs');
const path = require('path');

const ROOT_NODE_MODULES = path.resolve(__dirname, '../../../node_modules');
const DEST_NODE_MODULES = path.resolve(__dirname, '../node_modules');

// Dependencias necesarias para el main process de Electron
const ELECTRON_DEPS = [
  // electron-updater y sus dependencias directas
  'electron-updater',
  'electron-log',
  'builder-util-runtime',
  'fs-extra',
  'graceful-fs',
  'universalify',
  'jsonfile',
  'lazy-val',
  'lodash.isequal',
  'lodash.escaperegexp', // Nueva dependencia de electron-updater 6.x
  'semver',
  'sax',
  'tiny-typed-emitter',
  // js-yaml y su dependencia (requerido por electron-updater 6.x)
  'js-yaml',
  'argparse',
  // debug y su dependencia (requerido por builder-util-runtime)
  'debug',
  'ms',
];

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

function main() {
  console.log('📦 Copiando dependencias de Electron...\n');

  // Crear directorio destino
  fs.mkdirSync(DEST_NODE_MODULES, { recursive: true });

  let copied = 0;

  for (const dep of ELECTRON_DEPS) {
    const src = path.join(ROOT_NODE_MODULES, dep);
    const dest = path.join(DEST_NODE_MODULES, dep);

    // Eliminar si ya existe
    if (fs.existsSync(dest)) {
      fs.rmSync(dest, { recursive: true, force: true });
    }

    console.log(`  📦 ${dep}`);
    if (copyDirSync(src, dest)) {
      copied++;
    }
  }

  console.log(`\n✅ ${copied} dependencias copiadas a apps/desktop/node_modules`);
}

main();

