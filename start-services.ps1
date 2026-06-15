# ============================================================
# 蓝粮海洋 - 一键启停前后端开发服务 (PowerShell 版)
# ============================================================
#
# 用法:
#   .\start-services.ps1             (默认) 启动
#   .\start-services.ps1 start       启动
#   .\start-services.ps1 stop        停止
#   .\start-services.ps1 restart     重启
#   .\start-services.ps1 status      查看状态
# ============================================================

param(
    [ValidateSet('start', 'stop', 'restart', 'status', '')]
    [string]$Cmd = 'start'
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Definition
$backend = Join-Path $root "server"
$frontend = Join-Path $root "app"

$backendPort = 8000
$frontendPort = 5173
$lockBackend = Join-Path $env:TEMP "lanliang_backend.lock"
$lockFrontend = Join-Path $env:TEMP "lanliang_frontend.lock"
$logBackend = Join-Path $root "server_8000.log"
$logFrontend = Join-Path $root "vite_5173.log"

function Write-Banner([string]$title) {
    Write-Host "===========================================" -ForegroundColor Cyan
    Write-Host "  $title" -ForegroundColor Cyan
    Write-Host "===========================================" -ForegroundColor Cyan
}

function Test-PortInUse {
    param([int]$Port)
    $conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    return $null -ne $conn
}

function Stop-Port {
    param([int]$Port)
    $conns = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    foreach ($c in $conns) {
        $p = Get-Process -Id $c.OwningProcess -ErrorAction SilentlyContinue
        if ($p) {
            Write-Host "   结束端口 $Port 的进程: PID=$($p.Id) Name=$($p.ProcessName)" -ForegroundColor Yellow
            Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
        }
    }
    Start-Sleep -Seconds 1
}

function Test-LockAlive {
    param([string]$LockFile)
    if (-not (Test-Path $LockFile)) { return $null }
    $pidStr = Get-Content $LockFile -ErrorAction SilentlyContinue
    if (-not $pidStr) {
        Remove-Item $LockFile -Force -ErrorAction SilentlyContinue
        return $null
    }
    $p = Get-Process -Id $pidStr -ErrorAction SilentlyContinue
    if (-not $p) {
        Remove-Item $LockFile -Force -ErrorAction SilentlyContinue
        return $null
    }
    return [int]$pidStr
}

function Wait-Port {
    param([int]$Port, [int]$TimeoutSec = 5)
    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    while ((Get-Date) -lt $deadline) {
        if (Test-PortInUse -Port $Port) { return $true }
        Start-Sleep -Seconds 1
    }
    return $false
}

function Show-Status {
    Write-Banner "服务状态"
    $conns = Get-NetTCPConnection -LocalPort $backendPort -State Listen -ErrorAction SilentlyContinue
    if ($conns) {
        foreach ($c in $conns) {
            $p = Get-Process -Id $c.OwningProcess -ErrorAction SilentlyContinue
            Write-Host "  后端 (FastAPI) 端口 $backendPort: 监听中 (PID=$($p.Id))" -ForegroundColor Green
        }
    } else { Write-Host "  后端 (FastAPI) 端口 $backendPort: 未监听" -ForegroundColor Gray }

    $conns = Get-NetTCPConnection -LocalPort $frontendPort -State Listen -ErrorAction SilentlyContinue
    if ($conns) {
        foreach ($c in $conns) {
            $p = Get-Process -Id $c.OwningProcess -ErrorAction SilentlyContinue
            Write-Host "  前端 (Vite)    端口 $frontendPort: 监听中 (PID=$($p.Id))" -ForegroundColor Green
        }
    } else { Write-Host "  前端 (Vite)    端口 $frontendPort: 未监听" -ForegroundColor Gray }

    $lb = Test-LockAlive -LockFile $lockBackend
    Write-Host ($(if ($lb) { "  后端 lock: $lb" } else { "  后端 lock: 无" }))
    $lf = Test-LockAlive -LockFile $lockFrontend
    Write-Host ($(if ($lf) { "  前端 lock: $lf" } else { "  前端 lock: 无" }))
    Write-Host ""
    Write-Host "  日志:" -ForegroundColor Gray
    Write-Host "    后端: $logBackend"
    Write-Host "    前端: $logFrontend"
}

function Stop-One {
    param([string]$Name, [int]$Port, [string]$LockFile)
    Write-Host ""
    Write-Host "[STOP] $Name (port $Port)" -ForegroundColor Yellow
    if (Test-PortInUse -Port $Port) { Stop-Port -Port $Port }
    $pidAlive = Test-LockAlive -LockFile $LockFile
    if ($pidAlive) {
        Write-Host "   结束 lock 进程 PID=$pidAlive" -ForegroundColor Yellow
        Stop-Process -Id $pidAlive -Force -ErrorAction SilentlyContinue
        Remove-Item $LockFile -Force -ErrorAction SilentlyContinue
    }
}

function Start-One {
    param(
        [string]$Name,
        [string]$Dir,
        [int]$Port,
        [string]$LockFile,
        [string]$LogFile,
        [string]$Command
    )
    if (Test-Path $LogFile) { Remove-Item $LogFile -Force -ErrorAction SilentlyContinue }
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $Command -WindowStyle Normal -RedirectStandardOutput $LogFile -RedirectStandardError $LogFile
    Write-Host "[OK] $Name 已启动 (port $Port, 窗口标题: $Name)" -ForegroundColor Green
}

function Start-All {
    Write-Banner "启动开发服务"

    # 依赖检查
    $venv = Join-Path $backend "venv\Scripts\python.exe"
    if (-not (Test-Path $venv)) {
        Write-Host "[ERROR] 后端 venv 缺失: $venv" -ForegroundColor Red
        Write-Host "  请先: cd server; python -m venv venv; .\venv\Scripts\pip install -r requirements.txt" -ForegroundColor Yellow
        return
    }
    if (-not (Test-Path (Join-Path $frontend "node_modules"))) {
        Write-Host "[ERROR] 前端 node_modules 缺失" -ForegroundColor Red
        Write-Host "  请先: cd app; npm install" -ForegroundColor Yellow
        return
    }

    $skipBE = $false
    $skipFE = $false

    # 端口检测
    if (Test-PortInUse -Port $backendPort) {
        Write-Host ""
        Write-Host "[WARN] 端口 $backendPort 已被占用" -ForegroundColor Yellow
        $ans = Read-Host "   结束占用进程并继续? [Y/N] (默认 N)"
        if ($ans -eq 'Y' -or $ans -eq 'y') { Stop-Port -Port $backendPort } else { $skipBE = $true }
    }
    if (Test-PortInUse -Port $frontendPort) {
        Write-Host ""
        Write-Host "[WARN] 端口 $frontendPort 已被占用" -ForegroundColor Yellow
        $ans = Read-Host "   结束占用进程并继续? [Y/N] (默认 N)"
        if ($ans -eq 'Y' -or $ans -eq 'y') { Stop-Port -Port $frontendPort } else { $skipFE = $true }
    }

    # 清理死锁
    $null = Test-LockAlive -LockFile $lockBackend
    $null = Test-LockAlive -LockFile $lockFrontend

    Write-Host ""
    Write-Host "  后端: http://localhost:$backendPort" -ForegroundColor Gray
    Write-Host "  前端: http://localhost:$frontendPort" -ForegroundColor Gray
    Write-Host ""

    # 启动后端
    if (-not $skipBE) {
        $beCmd = "`$env:PYTHONIOENCODING='utf-8'; cd '$backend'; `$pid | Out-File -FilePath '$lockBackend' -Encoding ascii; .\venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port $backendPort --reload *>&1 | Tee-Object -FilePath '$logBackend'"
        Start-One -Name "Backend - FastAPI" -Dir $backend -Port $backendPort -LockFile $lockBackend -LogFile $logBackend -Command $beCmd
    } else {
        Write-Host "[SKIP] 后端未启动" -ForegroundColor DarkYellow
    }

    # 启动前端
    if (-not $skipFE) {
        $feCmd = "cd '$frontend'; `$pid | Out-File -FilePath '$lockFrontend' -Encoding ascii; npm run dev *>&1 | Tee-Object -FilePath '$logFrontend'"
        Start-One -Name "Frontend - Vite" -Dir $frontend -Port $frontendPort -LockFile $lockFrontend -LogFile $logFrontend -Command $feCmd
    } else {
        Write-Host "[SKIP] 前端未启动" -ForegroundColor DarkYellow
    }

    # 自检
    Write-Host ""
    Write-Host "自检 (最多 10 秒)..." -ForegroundColor Gray
    if (Wait-Port -Port $backendPort -TimeoutSec 5) {
        Write-Host "  [OK] 端口 $backendPort 已就绪" -ForegroundColor Green
    } else {
        Write-Host "  [WARN] 端口 $backendPort 仍未就绪,日志: $logBackend" -ForegroundColor Yellow
    }
    if (Wait-Port -Port $frontendPort -TimeoutSec 5) {
        Write-Host "  [OK] 端口 $frontendPort 已就绪" -ForegroundColor Green
    } else {
        Write-Host "  [WARN] 端口 $frontendPort 仍未就绪,日志: $logFrontend" -ForegroundColor Yellow
    }
    Write-Host ""
    Write-Host "提示: 关闭对应 PowerShell 窗口即可停止服务" -ForegroundColor Gray
    Write-Host "      命令行: .\start-services.ps1 {start|stop|restart|status}" -ForegroundColor Gray
}

# ============================================================
# 主调度
# ============================================================
switch ($Cmd.ToLower()) {
    'status'  { Show-Status }
    'stop'    {
        Write-Banner "停止服务"
        Stop-One -Name "后端" -Port $backendPort -LockFile $lockBackend
        Stop-One -Name "前端" -Port $frontendPort -LockFile $lockFrontend
        Write-Host ""
        Write-Host "[DONE] 已停止" -ForegroundColor Green
    }
    'restart' {
        Write-Banner "重启服务"
        Stop-One -Name "后端" -Port $backendPort -LockFile $lockBackend
        Stop-One -Name "前端" -Port $frontendPort -LockFile $lockFrontend
        Start-Sleep -Seconds 2
        Start-All
    }
    default { Start-All }
}
