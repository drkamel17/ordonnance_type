@echo off
set PORT=8000

:CHECKPORT
netstat -ano | find ":%PORT%" >nul
if %errorlevel%==0 (
    set /a PORT=%PORT%+1
    goto CHECKPORT
)

echo ================================
echo Python Server Running
echo http://localhost:%PORT%
echo ================================
start http://localhost:%PORT%

python server.py

pause
