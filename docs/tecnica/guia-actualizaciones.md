# Guía de Actualizaciones de NexoPOS

Este documento explica cómo funciona el sistema de actualizaciones automáticas y los pasos necesarios para publicar una nueva versión para los clientes.

## 🔄 ¿Cómo funciona?

La aplicación utiliza `electron-updater` vinculado al repositorio de GitHub. El flujo es el siguiente:

1.  **Detección:** Cuando el cliente abre NexoPOS, el sistema consulta automáticamente en GitHub si existe una "Release" con un número de versión superior al instalado.
2.  **Notificación y Descarga:**
    *   Si hay una nueva versión, el sistema muestra un mensaje: *"Actualización disponible"*.
    *   Comienza la descarga en segundo plano, permitiendo al usuario seguir trabajando.
3.  **Instalación:** Una vez descargada, aparece el mensaje: *"Actualización lista"*, preguntando si se desea reiniciar la aplicación para aplicar los cambios.

---

## 🚀 Pasos para publicar una nueva actualización

Para liberar una nueva versión a los clientes, sigue estos **3 pasos exactos**:

### Paso 1: Subir la versión
Edita el archivo `apps/desktop/package.json` e incrementa el número de versión.
*   Ejemplo: Cambiar `"version": "1.0.0"` por `"version": "1.0.1"`.

### Paso 2: Generar el instalador
Abre la terminal en la carpeta del proyecto y ejecuta:

```powershell
npm run desktop:build
```

Esto generará los archivos necesarios en la carpeta `apps/desktop/release`. Los archivos críticos son:
1.  `NexoPOS Setup X.X.X.exe` (El instalador)
2.  `latest.yml` (Archivo de metadatos indispensable para el actualizador)

### Paso 3: Publicar en GitHub
1.  Ve a tu repositorio en GitHub y navega a **"Releases"** > **"Draft a new release"**.
2.  **Choose a tag:** Escribe la nueva versión, por ejemplo: `v1.0.1` (es importante anteponer la "v").
3.  **Release title:** Puedes usar el mismo nombre (`v1.0.1`) o algo descriptivo como "Actualización Enero".
4.  **Attach binaries:** Arrastra y suelta los archivos generados en el Paso 2:
    *   `NexoPOS Setup...exe`
    *   `latest.yml`
5.  Haz clic en **"Publish release"**.

### ✅ Resultado
Una vez publicada la release, la próxima vez que los clientes abran NexoPOS, el sistema detectará la nueva versión `1.0.1`, les notificará y comenzará la actualización automáticamente.
