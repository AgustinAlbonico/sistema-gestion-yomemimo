# Guía de Actualizaciones y Versionado - NexoPOS

## 1. Estrategia de Versionado (SemVer)
Utilizamos Versionado Semántico (`Major.Minor.Patch`) ej: `1.0.0`.

*   **Major (1.x.x)**: Cambios drásticos o incompatibles con versiones anteriores.
*   **Minor (x.1.x)**: Nuevas funcionalidades compatibles con la versión actual (ej: nuevo reporte).
*   **Patch (x.x.1)**: Corrección de errores o ajustes pequeños (ej: arreglar un botón).

## 2. Pasos para Crear una Actualización

### Paso 1: Actualizar Versiones
Modifica la versión en los siguientes archivos:
1.  **Principal**: `apps/desktop/package.json` (Este es el MÁS importante para el instalador).
2.  (Opcional) Raíz: `package.json`.

### Paso 2: Generar el Instalador
Ejecuta el script de construcción desde la terminal en la carpeta raíz:

```powershell
npm run desktop:build
```

Esto generará los archivos de instalación en:
`apps/desktop/release/`

### Paso 3: Publicar (GitHub Releases)
El sistema de auto-actualización verifica GitHub Releases.

1.  Sube tus cambios a GitHub:
    ```bash
    git add .
    git commit -m "chore: release vX.Y.Z"
    git push
    ```
2.  Crea un **Tag** yúbelo (Recomendado):
    ```bash
    git tag vX.Y.Z
    git push origin vX.Y.Z
    ```
3.  Ve a tu repositorio en GitHub > **Releases** > **Draft a new release**.
4.  Selecciona el tag reciente.
5.  **IMPORTANTE**: Sube los siguientes archivos generados en el paso 2:
    *   `NexoPOS Setup X.Y.Z.exe`
    *   `latest.yml` (Fundamental para que el auto-updater detecte la versión).
6.  Haz clic en **Publish release**.

## 3. ¿Cómo funciona la auto-actualización?
1.  Cuando el cliente abre NexoPOS, el sistema consulta silenciosamente GitHub.
2.  Si la versión en `latest.yml` es mayor a la instalada, descarga el `.exe` en segundo plano.
3.  Al terminar, notifica al usuario para reiniciar y aplicar la actualización.
