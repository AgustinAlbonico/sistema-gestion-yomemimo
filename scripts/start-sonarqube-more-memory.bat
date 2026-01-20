@echo off
echo 🚀 Starting Local SonarQube with Increased Memory...

REM Check if SonarQube directory exists
if not exist "C:\Herramientas\sonarqube-25.12.0.117093\bin\windows-x86-64\StartSonar.bat" (
    echo ❌ SonarQube not found at: C:\Herramientas\sonarqube-25.12.0.117093
    echo Please check the installation path.
    pause
    exit /b 1
)

REM Create enhanced configuration with more memory
echo Creating enhanced configuration...
(
echo sonar.web.javaOpts=-Xmx2g -Xms512m -XX:+UseG1GC
echo sonar.search.javaOpts=-Xmx2g -Xms512m -XX:+UseG1GC
) > "C:\Herramientas\sonarqube-25.12.0.117093\conf\wrapper.conf.tmp"

echo 🐳 Starting SonarQube with enhanced memory settings...
start "" "C:\Herramientas\sonarqube-25.12.0.117093\bin\windows-x86-64\StartSonar.bat"

echo ⏳ Waiting for SonarQube to be ready...
timeout /t 60 /nobreak >nul

REM Check if SonarQube is running
curl -f http://localhost:9000/api/system/health >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ SonarQube is running!
    echo 🌐 Access at: http://localhost:9000
    echo 🔑 Default credentials: admin/admin
    echo.
    echo To stop SonarQube: Close the command window or use stop-local-sonarqube.bat
) else (
    echo ❌ SonarQube failed to start. Please check the logs.
    echo You can try starting it manually:
    echo   cd "C:\Herramientas\sonarqube-25.12.0.117093\bin\windows-x86-64"
    echo   StartSonar.bat
    pause
)