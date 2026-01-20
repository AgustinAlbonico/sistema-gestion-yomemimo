@echo off
echo 🛑 Stopping Local SonarQube...

REM Find and kill SonarQube processes
taskkill /F /FI "WINDOWTITLE eq *SonarQube*" /T >nul 2>&1
taskkill /F /FI "IMAGENAME eq java.exe" /FI "WINDOWTITLE eq *sonar*" /T >nul 2>&1

echo ✅ SonarQube stopped!