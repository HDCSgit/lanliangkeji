@echo off
chcp 65001 >nul
setlocal EnableExtensions

:: ============================================================
:: 蓝粮海洋 - 一键启停前后端开发服务
:: ============================================================
::
:: 用法:
::   start-services.bat             (默认) 启动
::   start-services.bat start       启动
::   start-services.bat stop        停止
::   start-services.bat restart     重启
::   start-services.bat status      查看状态
::
:: 特性:
::   - 自动检测端口占用,占用就问你要不要杀
::   - 单实例锁 (lock 文件 + PID)
::   - 启动后窗口标题 "Backend - FastAPI" / "Frontend - Vite",
::     关闭对应窗口就停止服务
::   - Stop / Restart 不依赖窗口是否还开着,
::     直接按端口或 lock 文件杀
:: ============================================================

set "ROOT=%~dp0"
set "BACKEND=%ROOT%server"
set "FRONTEND=%ROOT%app"
set "BACKEND_PORT=8000"
set "FRONTEND_PORT=5173"
set "LOCK_BE=%TEMP%\lanliang_backend.lock"
set "LOCK_FE=%TEMP%\lanliang_frontend.lock"
set "LOG_BE=%ROOT%server_8000.log"
set "LOG_FE=%ROOT%vite_5173.log"
set "CMD=%~1"

if "%CMD%"=="" set "CMD=start"

:: ========== 工具函数 ==========

:: 检测端口 LISTEN
:check_port
netstat -ano | findstr ":%~1 " | findstr "LISTENING" >nul 2>&1
exit /b %ERRORLEVEL%

:: 杀占用端口的进程(强杀,无需确认)
:kill_port
for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":%~1 " ^| findstr "LISTENING"') do (
    echo   结束端口 %~1 的进程 PID=%%P ...
    taskkill /F /PID %%P >nul 2>&1
)
exit /b 0

:: 检查 lock 文件指向的进程是否还活着,1=活着 0=死了/不存在
:lock_alive
if not exist "%~1" exit /b 0
set "ALIVE=0"
for /f "usebackq tokens=*" %%P in ("%~1") do (
    tasklist /FI "PID eq %%P" 2>nul | findstr "%%P" >nul 2>&1
    if not errorlevel 1 set "ALIVE=1"
)
if "%ALIVE%"=="0" del /f /q "%~1" >nul 2>&1
exit /b %ALIVE%

:: 等待端口 LISTEN,超时返回失败(用于 start 后自检)
:wait_port
set /a WP_T=%~2
:wp_loop
if %WP_T% LEQ 0 exit /b 1
call :check_port %~1
if not errorlevel 1 exit /b 0
set /a WP_T=%WP_T%-1
ping -n 2 127.0.0.1 >nul 2>&1
goto :wp_loop

:: ============================================================
:: 公共动作:清理指定服务 (kill port + kill lock pid)
:: ============================================================
:stop_one
echo.
echo [STOP] %~1 (port %~2)
call :check_port %~2
if not errorlevel 1 call :kill_port %~2
call :lock_alive "%~3"
if "%ALIVE%"=="1" (
    echo   结束 lock 进程 PID=%%P
    taskkill /F /PID %%P >nul 2>&1
    del /f /q "%~3" >nul 2>&1
)
exit /b 0

:status_one
echo.
echo [STATUS] %~1 (port %~2)
call :check_port %~2
if errorlevel 1 (
    echo   端口 %~2: 未监听
) else (
    for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":%~2 " ^| findstr "LISTENING"') do (
        echo   端口 %~2: 监听中 (PID=%%P)
    )
)
call :lock_alive "%~3"
if "%ALIVE%"=="1" (
    for /f "usebackq tokens=*" %%P in ("%~3") do echo   Lock 文件: %%P
) else (
    echo   Lock 文件: 无
)
exit /b 0

:: ============================================================
:: 命令分派
:: ============================================================

if /i "%CMD%"=="status" goto :do_status
if /i "%CMD%"=="stop"   goto :do_stop
if /i "%CMD%"=="restart" goto :do_restart
goto :do_start

:: ---------- status ----------
:do_status
echo ===========================================
echo   蓝粮海洋 - 服务状态
echo ===========================================
call :status_one "后端 (FastAPI)" %BACKEND_PORT% "%LOCK_BE%"
call :status_one "前端 (Vite)"    %FRONTEND_PORT% "%LOCK_FE%"
echo.
echo 日志:
echo   后端: %LOG_BE%
echo   前端: %LOG_FE%
echo ===========================================
endlocal
goto :eof

:: ---------- stop ----------
:do_stop
echo ===========================================
echo   蓝粮海洋 - 停止服务
echo ===========================================
call :stop_one "后端" %BACKEND_PORT% "%LOCK_BE%"
call :stop_one "前端" %FRONTEND_PORT% "%LOCK_FE%"
echo.
echo [DONE] 已停止
echo ===========================================
endlocal
goto :eof

:: ---------- restart ----------
:do_restart
echo ===========================================
echo   蓝粮海洋 - 重启服务
echo ===========================================
call :do_stop
timeout /t 2 /nobreak >nul
call :do_start
endlocal
goto :eof

:: ---------- start ----------
:do_start
echo ===========================================
echo   蓝粮海洋 - 启动开发服务
echo ===========================================

:: 检查依赖
if not exist "%BACKEND%\venv\Scripts\python.exe" (
    echo [ERROR] 后端 venv 缺失: %BACKEND%\venv\Scripts\python.exe
    echo   请先: cd server ^&^& python -m venv venv ^&^& .\venv\Scripts\pip install -r requirements.txt
    endlocal & exit /b 1
)
if not exist "%FRONTEND%\node_modules" (
    echo [ERROR] 前端 node_modules 缺失
    echo   请先: cd app ^&^& npm install
    endlocal & exit /b 1
)

:: 检查端口
set "SKIP_BE=0"
set "SKIP_FE=0"

call :check_port %BACKEND_PORT%
if not errorlevel 1 (
    echo.
    echo [WARN] 端口 %BACKEND_PORT% 已被占用
    set /p KILL_BE="   结束占用进程并继续? (Y/N, 默认 N): "
    if /i "!KILL_BE!"=="Y" (
        call :kill_port %BACKEND_PORT%
        timeout /t 1 /nobreak >nul
    ) else (
        set "SKIP_BE=1"
    )
)

call :check_port %FRONTEND_PORT%
if not errorlevel 1 (
    echo.
    echo [WARN] 端口 %FRONTEND_PORT% 已被占用
    set /p KILL_FE="   结束占用进程并继续? (Y/N, 默认 N): "
    if /i "!KILL_FE!"=="Y" (
        call :kill_port %FRONTEND_PORT%
        timeout /t 1 /nobreak >nul
    ) else (
        set "SKIP_FE=1"
    )
)

:: 清理死掉的 lock
call :lock_alive "%LOCK_BE%"
call :lock_alive "%LOCK_FE%"

echo.
echo 启动服务...
echo   后端: http://localhost:%BACKEND_PORT%
echo   前端: http://localhost:%FRONTEND_PORT%
echo.

:: 启动后端
if "%SKIP_BE%"=="0" (
    if exist "%LOG_BE%" del /f /q "%LOG_BE%" >nul 2>&1
    start "Backend - FastAPI" powershell -NoExit -Command ^
        "$env:PYTHONIOENCODING='utf-8'; " ^
        "cd '%BACKEND%'; " ^
        "$pid ^| Out-File -FilePath '%LOCK_BE%' -Encoding ascii; " ^
        ".\venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port %BACKEND_PORT% --reload 2^>^&1 ^| Tee-Object -FilePath '%LOG_BE%'"
    echo [OK] 后端已启动 (窗口: "Backend - FastAPI")
) else (
    echo [SKIP] 后端未启动
)

:: 启动前端
if "%SKIP_FE%"=="0" (
    if exist "%LOG_FE%" del /f /q "%LOG_FE%" >nul 2>&1
    start "Frontend - Vite" powershell -NoExit -Command ^
        "cd '%FRONTEND%'; " ^
        "$pid ^| Out-File -FilePath '%LOCK_FE%' -Encoding ascii; " ^
        "npm run dev 2^>^&1 ^| Tee-Object -FilePath '%LOG_FE%'"
    echo [OK] 前端已启动 (窗口: "Frontend - Vite")
) else (
    echo [SKIP] 前端未启动
)

echo.
echo 自检 (最多 10 秒)...
call :wait_port %BACKEND_PORT% 5
if not errorlevel 1 (echo   [OK] 端口 %BACKEND_PORT% 已就绪) else (echo   [WARN] 端口 %BACKEND_PORT% 仍未就绪,查看日志: %LOG_BE%)
call :wait_port %FRONTEND_PORT% 5
if not errorlevel 1 (echo   [OK] 端口 %FRONTEND_PORT% 已就绪) else (echo   [WARN] 端口 %FRONTEND_PORT% 仍未就绪,查看日志: %LOG_FE%)

echo.
echo 提示:
echo   - 关闭 PowerShell 窗口可停止对应服务
echo   - 命令行: start-services.bat {start^|stop^|restart^|status}
echo   - 日志位置: %LOG_BE%  /  %LOG_FE%
echo ===========================================
endlocal
