# Instructivo de Instalación y Configuración - NexoPOS

Este documento detalla los pasos para instalar el sistema NexoPOS en un entorno de producción (PCS de clientes), cubriendo desde la instalación del motor de base de datos hasta la configuración de terminales cliente.

## 1. Requisitos Previos (PC SERVIDOR)

El "Servidor" es la PC donde se almacenarán los datos. Debe estar encendida para que las demás (Clientes) puedan usar el sistema.

### Instalación de PostgreSQL
El sistema utiliza PostgreSQL como base de datos.

1.  **Descargar**: Ir a [Descargar PostgreSQL para Windows](https://www.enterprisedb.com/downloads/postgres-postgresql-downloads).
2.  **Instalar**: Ejecutar el instalador.
    *   Puede desmarcar "pgAdmin 4" y "Stack Builder" si desea una instalación más ligera (solo necesita "PostgreSQL Server" y "Command Line Tools").
    *   **Importante**: Recordar la contraseña que asigne al superusuario `postgres`. (Recomendada para facilitar soporte: `postgres` o `admin`).
    *   Puerto por defecto: `5432` (dejar tal cual).

### Crear Base de Datos
Es necesario crear la base de datos vacía antes de instalar el sistema. Se puede hacer vía línea de comandos (CMD o PowerShell).

1.  Abrir CMD o PowerShell.
2.  Ir a la carpeta `bin` de Postgres (generalmente `C:\Program Files\PostgreSQL\16\bin` o la versión que haya instalado).
3.  Ejecutar el siguiente comando (pedirá la contraseña que configuró en la instalación):

```powershell
./createdb -U postgres nexopos
```

*Si el comando falla porque no encuentra `createdb`, asegúrese de estar en la carpeta `bin` correcta.*

---

## 2. Instalación del Sistema (PC SERVIDOR)

Una vez instalada la base de datos, procedemos a instalar la aplicación.

1.  **Ejecutar Instalador**: Correr `NexoPOS Setup.exe` en la PC Servidor.
2.  **Abrir Aplicación**: Al finalizar, abrir "NexoPOS".
3.  **Asistente de Configuración**:
    *   La primera vez, el sistema detectará que no está configurado y abrirá una ventana de "Configuración Inicial".
    *   Seleccionar **Modo Servidor**.
4.  **Datos de Conexión**:
    *   **Host**: `localhost` (o `127.0.0.1`)
    *   **Puerto**: `5432`
    *   **Base de Datos**: `nexopos`
    *   **Usuario**: `postgres` (o el que haya definido)
    *   **Contraseña**: La que definió al instalar Postgres.
5.  **Finalizar**:
    *   Dar clic en "Guardar y Conectar".
    *   Si los datos son correctos, el sistema guardará el archivo `.env`, creará las tablas automáticamente y reiniciará la aplicación.

### Firewall (Importante para Clientes)
Para que otras PCs puedan conectarse a este servidor:
1.  Abrir "Firewall de Windows con seguridad avanzada".
2.  Crear una **Regla de Entrada**:
    *   Tipo: **Puerto**.
    *   Protocolo: **TCP**.
    *   Puertos específicos: `3000`.
    *   Acción: **Permitir la conexión**.
    *   Nombre: `NexoPOS Backend`.

---

## 3. Instalación de Terminales (PC CLIENTE)

Para las computadoras adicionales que se conectarán al servidor.

1.  **Ejecutar Instalador**: Correr `NexoPOS Setup.exe` en la PC Cliente.
2.  **Abrir Aplicación**: Abrir "NexoPOS".
3.  **Asistente de Configuración**:
    *   El sistema pedirá configuración.
    *   Seleccionar **Modo Cliente**.
4.  **Conexión al Servidor**:
    *   **IP del Servidor**: Ingresar la dirección IP V4 de la PC Servidor (Ej: `192.168.1.45`).
        *   *Para saber la IP del servidor: En la PC Servidor, abrir CMD y escribir `ipconfig`.*
    *   **Puerto**: `3000` (por defecto).
5.  **Finalizar**:
    *   Clic en "Conectar".
    *   El sistema verificará que puede ver al servidor. Si es exitoso, reiniciará y cargará la interfaz.

---

## Resumen Técnico del Proceso

1.  **Postgres**: Motor de BD. Se instala solo en SERVIDOR.
2.  **BD Vacía**: Se crea `nexopos`.
3.  **App Server**: Se conecta a la BD local. Al iniciar, **NexoPOS crea el esquema de tablas automáticamente**.
4.  **Red**: Se abre puerto 3000 en firewall del Servidor.
5.  **App Cliente**: Se conecta por HTTP (`http://IP_SERVIDOR:3000`) al backend del servidor.

## Solución de Problemas Comunes

*   **Error "Connection Refused" en Cliente**:
    *   Verificar que la app NexoPOS esté abierta en el Servidor (debe estar corriendo para servir a los clientes).
    *   Verificar Firewall de Windows en el Servidor (Puerto 3000 debe estar abierto).
    *   Verificar que la IP sea correcta y ambas PCs estén en la misma red.

*   **Error "Identificación fallida" en Setup Servidor**:
    *   La contraseña de PostgreSQL es incorrecta.

*   **Error "La base de datos no existe"**:
    *   Olvidó ejecutar el comando `createdb`.

---

## Gestión Remota y Baja del Servicio

Si es necesario dar de baja el acceso al sistema remotamente (ej. falta de pago), se puede hacer modificando directamente la base de datos.
Esta acción bloqueará el acceso a todos los usuarios inmediatamente, mostrando una pantalla de bloqueo.

1.  **Acceso Remoto**: Conectarse por VPN o Escritorio Remoto a la PC Servidor.
2.  **Abrir Consola SQL**: Usar CMD/PowerShell en la carpeta `bin` de Postgres:
    ```powershell
    ./psql -U postgres -d nexopos
    ```
3.  **Ejecutar Query de Bloqueo**:
    ```sql
    UPDATE "system_configuration" 
    SET "sistemaHabilitado" = false, 
        "mensajeDeshabilitado" = 'SERVICIO SUSPENDIDO - CONTACTE A SOPORTE TÉCNICO';
    ```
    *(Para reactivar, cambiar `false` por `true`)*.
