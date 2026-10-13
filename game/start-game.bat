@echo off
setlocal
rem ============================================================
rem  PKRC 启动脚本（整理版）
rem  - 修复原版缺陷：缺少 cd 锚定导致从其他目录启动即失败；
rem    "&" 被 cmd 当作命令分隔符导致 Node 前台阻塞；
rem    %ERRORLEVEL% 不是 Node PID 导致 taskkill 失效；
rem    Electron 先于 Node 就绪导致白屏。
rem  - 路径已适配新目录结构：
rem      ..\shared\runtime\node.exe   便携 Node 运行时
rem      server\server.cjs            Express 静态服务器（端口 8000）
rem      pokerogue-win32-x64\         Electron 桌面外壳
rem ============================================================

cd /d %~dp0

set NODE_PATH=..\shared\runtime\node.exe
set NODE_SERVER=server\server.cjs
set POKEROGLE_EXE=pokerogue-win32-x64\pokerogue.exe
set PORT=8000

rem ---- 1. 启动 Node 服务器并等待端口就绪 ----
echo Starting Node.js server...
start "PKRC-Node" /b /min powershell -NoProfile -Command "$p = Start-Process -FilePath '%NODE_PATH%' -ArgumentList '%NODE_SERVER%' -RedirectStandardOutput 'node_output.txt' -RedirectStandardError 'node_error.txt' -PassThru; $p.Id | Out-File -Encoding ascii '.node_pid'"

rem 等待 8000 端口就绪（最多 30 秒）
set /a _tries=0
:WAIT_PORT
set /a _tries+=1
powershell -NoProfile -Command "$c=New-Object Net.Sockets.TcpClient; try { $c.Connect('localhost', %PORT%); exit 0 } catch { exit 1 } finally { $c.Close() }" >nul 2>&1
if not errorlevel 1 goto SERVER_READY
if %_tries% geq 30 (
    echo [ERROR] Node server did not start within 30s. Check node_error.txt.
    goto CLEANUP
)
timeout /t 1 /nobreak > nul
goto WAIT_PORT

:SERVER_READY
echo Node.js server is ready on port %PORT%.

rem ---- 2. 启动 Electron 游戏 ----
echo Starting Pokerogue application...
start "" "%POKEROGLE_EXE%"

rem ---- 3. 监控游戏进程，退出后清理 Node ----
:MONITOR_PROCESS
timeout /t 1 /nobreak > NUL
tasklist /FI "IMAGENAME eq pokerogue.exe" | find /I /N "pokerogue.exe" >NUL
if "%ERRORLEVEL%"=="0" goto MONITOR_PROCESS

:CLEANUP
echo Pokerogue has closed, stopping Node.js server...
if exist ".node_pid" (
    for /f "usebackq delims=" %%p in (".node_pid") do taskkill /F /PID %%p >nul 2>&1
    del ".node_pid"
) else (
    rem 兜底：按映像名结束本项目的 Node 进程
    taskkill /F /IM node.exe >nul 2>&1
)
echo Cleanup completed.
endlocal
