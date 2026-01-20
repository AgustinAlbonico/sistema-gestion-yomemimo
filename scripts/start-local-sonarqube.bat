@echo off
echo 🚀 Starting Local SonarQube Instance...

REM Check if SonarQube is already running
tasklist | findstr /i "sonarqube" >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ SonarQube is already running!
    echo 🌐 Access at: http://localhost:9000
    echo 🔑 Default credentials: admin/admin
    pause
    exit /b 0
)

REM Check if SonarQube directory exists
if not exist "C:\Herramientas\sonarqube-25.12.0.117093\bin\windows-x86-64\StartSonar.bat" (
    echo ❌ SonarQube not found at: C:\Herramientas\sonarqube-25.12.0.117093
    echo Please check the installation path.
    pause
    exit /b 1
)

echo 🐳 Starting SonarQube...
start "" "C:\Herramientas\sonarqube-25.12.0.117093\bin\windows-x86-64\StartSonar.bat"

echo ⏳ Waiting for SonarQube to be ready...
timeout /t 30 /nobreak >nul

REM Check if SonarQube is running
curl -f http://localhost:9000/api/system/health >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ SonarQube is running!
    echo 🌐 Access at: http://localhost:9000
    echo 🔑 Default credentials: admin/admin
    echo.
    echo To stop SonarQube: Close the command window or press Ctrl+C
) else (
    echo ❌ SonarQube failed to start. Please check the logs.
    echo You can start it manually by running:
    echo   "C:\Herramientas\sonarqube-25.12.0.117093\bin\windows-x86-64\StartSonar.bat"
    pause
)