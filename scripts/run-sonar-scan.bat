@echo off
echo 🔄 Ejecutando escaneo de SonarQube...

REM Verificar si SONAR_TOKEN está configurado
if "%SONAR_TOKEN%"=="" (
    echo ❌ Error: SONAR_TOKEN no está configurado
    echo.
    echo Para configurarlo:
    echo 1. Genera un token en SonarQube: http://localhost:9000/api/user/security/tokens
    echo 2. Establece la variable: set SONAR_TOKEN=tu_token_aqui
    echo O agrega al archivo .env: SONAR_TOKEN=tu_token_aqui
    pause
    exit /b 1
)

cd "C:\Users\agust\Desktop\Proyectos\sistema-gestion\apps\backend"

echo 📁 Directorio: %CD%
echo 🔑 Token: %SONAR_TOKEN:~0,4%****

REM Ejecutar escaneo
sonar-scanner -Dsonar.login=%SONAR_TOKEN%

echo.
echo ✅ Escaneo completado
echo 🌐 Resultados disponibles en: http://localhost:9000/dashboard?id=sistema-gestion-backend
pause