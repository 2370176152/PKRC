@echo off
set PORT=8000

echo Finding process listening on port %PORT%...
for /f "tokens=2 delims=: " %%i in ('netstat -ano ^| findstr ":%PORT%"') do (
    set PID=%%i
    goto killProcess
)

:killProcess
if not "%PID%" == "" (
    echo Killing process with PID %PID%...
    taskkill /F /PID %PID%
    if %ERRORLEVEL% == 0 (
        echo Process with PID %PID% killed.
    ) else (
        echo Failed to kill process with PID %PID%.
    )
) else (
    echo No process found for port %PORT%.
)

pause