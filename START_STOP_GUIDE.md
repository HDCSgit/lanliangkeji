# 蓝粮海洋 - 启停服务速查

## 一键命令(双击或终端)

| 操作 | 命令 |
|------|------|
| **启动** | `start-services.bat` (双击) 或 `.\start-services.ps1` |
| **停止** | `start-services.bat stop` 或 `.\start-services.ps1 stop` |
| **重启** | `start-services.bat restart` 或 `.\start-services.ps1 restart` |
| **查状态** | `start-services.bat status` 或 `.\start-services.ps1 status` |

启动后会出现两个 PowerShell 窗口(标题分别是 `Backend - FastAPI` 和 `Frontend - Vite`),**直接关掉对应窗口 = 停止该服务**。

## 端口
- 后端: `http://localhost:8000`
- 前端: `http://localhost:5173`
- 后端 API 文档: `http://localhost:8000/docs`

## 日志位置
- 后端: `D:\openclaw\lanliang\server_8000.log`
- 前端: `D:\openclaw\lanliang\vite_5173.log`
- 锁文件(单实例): `%TEMP%\lanliang_backend.lock` / `lanliang_frontend.lock`

## 手动操作(应急)

### 看哪些进程在占端口
```powershell
Get-NetTCPConnection -LocalPort 8000,5173 -State Listen | Format-Table
```

### 按端口杀进程
```powershell
# 杀后端
Get-NetTCPConnection -LocalPort 8000 -State Listen | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }

# 杀前端
Get-NetTCPConnection -LocalPort 5173 -State Listen | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

### 按窗口标题杀
```powershell
# 关掉标题为 "Backend - FastAPI" 的所有 PowerShell 窗口
Get-Process powershell | Where-Object { $_.MainWindowTitle -eq "Backend - FastAPI" } | Stop-Process -Force
```

### 直接杀 uvicorn / node 进程
```powershell
# 看进程
Get-Process python, node | Format-Table Id, ProcessName, StartTime

# 按 PID 杀
Stop-Process -Id <PID> -Force
```

## 端口冲突怎么办
启动器会自动检测。如果还冲突:

1. 看谁占了: `netstat -ano | findstr ":8000"`
2. 看进程: `tasklist /FI "PID eq <PID>"`
3. 确认能杀: `Stop-Process -Id <PID> -Force`
4. 重新启动: `start-services.bat`

## 数据库修改
启动器首次运行会**自动**给 `storage_configs` 表补缺失列(在 `server/app/db/migrations.py`)。
如有 alembic 迁移需求,后续单独配置。
