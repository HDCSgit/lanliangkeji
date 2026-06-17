# ============================================================
# 蓝粮海洋 - 版本管理健康检查
# ============================================================
# 用法: powershell -NoProfile -ExecutionPolicy Bypass -File scripts\check-version.ps1
# 检查 git 状态、推送状态、前后端版本号、/version 端点
# 退出 0 = OK, 1 = 有问题
# ============================================================

$ErrorActionPreference = 'Stop'

$root = git rev-parse --show-toplevel
Set-Location $root

$ok = $true
$divider = '----------------------------------------'

# 帮助函数:输出
function Write-Section($n, $title) {
    Write-Host ''
    Write-Host ('[{0}] {1}' -f $n, $title) -ForegroundColor Cyan
}
function Write-OK($msg) { Write-Host ('  OK ' + $msg) -ForegroundColor Green }
function Write-Warn($msg) { Write-Host ('  WARN ' + $msg) -ForegroundColor Yellow; $script:ok = $false }
function Write-Err($msg) { Write-Host ('  ERROR ' + $msg) -ForegroundColor Red; $script:ok = $false }
function Write-Info($msg) { Write-Host ('  ' + $msg) }

Write-Host ''
Write-Host $divider
Write-Host (' 蓝粮海洋 - 版本管理健康检查') -ForegroundColor Cyan
Write-Host $divider

# 1. git 状态
Write-Section 1 'git 状态'
$status = git status --short
if ($status) {
    Write-Warn '有未提交改动:'
    $status | ForEach-Object { Write-Host ('      ' + $_) }
} else {
    Write-OK 'clean'
}

# 2. 未推送
Write-Section 2 '本地 vs origin/main'
git fetch origin 2>&1 | Out-Null
$unpushed = git log --oneline origin/main..HEAD 2>$null
if ($unpushed) {
    Write-Warn '有未推送 commit:'
    $unpushed | ForEach-Object { Write-Host ('      ' + $_) }
} else {
    Write-OK '本地 = origin/main'
}

# 3. 前端版本
Write-Section 3 '前端版本 (app/package.json)'
$pkgPath = 'app/package.json'
$feVersion = $null
if (Test-Path $pkgPath) {
    $pkg = Get-Content $pkgPath -Raw -Encoding UTF8 | ConvertFrom-Json
    $feVersion = $pkg.version
    Write-Info ('{0}: {1}' -f $pkgPath, $feVersion)
} else {
    Write-Err ('{0} 不存在' -f $pkgPath)
}

# 4. 后端版本
Write-Section 4 '后端版本 (server/app/core/config.py)'
$cfgPath = 'server/app/core/config.py'
$beVersion = $null
if (Test-Path $cfgPath) {
    $cfgContent = Get-Content $cfgPath -Encoding UTF8 -Raw
    $verLine = ''
    foreach ($line in ($cfgContent -split "`n")) {
        if ($line -match 'APP_VERSION') {
            $verLine = $line.Trim()
            break
        }
    }
    if ($verLine -ne '') {
        $afterEq = ($verLine -split '=', 2)[1].Trim()
        $beVersion = $afterEq.Trim('"').Trim("'")
        Write-Info ('{0}: {1}' -f $cfgPath, $beVersion)
    } else {
        Write-Err '找不到 APP_VERSION 常量'
    }
} else {
    Write-Err ('{0} 不存在' -f $cfgPath)
}

# 5. 前后端版本一致性
Write-Section 5 '前后端版本一致性'
if ($feVersion -and $beVersion) {
    if ($feVersion -eq $beVersion) {
        Write-OK ('一致: {0}' -f $feVersion)
    } else {
        Write-Warn ('不一致: 前端={0} 后端={1}' -f $feVersion, $beVersion)
    }
}

# 6. 后端 /version 端点
Write-Section 6 '后端 /version 端点'
try {
    $versionUrl = 'http://localhost:8000/version'
    $r = Invoke-WebRequest -Uri $versionUrl -UseBasicParsing -TimeoutSec 5
    $v = ($r.Content | ConvertFrom-Json).version
    Write-Info ('返回: {0}' -f $v)
    if ($beVersion -and $v -ne $beVersion) {
        Write-Warn ('/version={0},代码版本={1} (后端需要重启)' -f $v, $beVersion)
    }
} catch {
    Write-Warn '/version 不可访问 (后端可能没起)'
}

Write-Host ''
Write-Host $divider
if ($ok) {
    Write-Host (' 全部 OK') -ForegroundColor Green
} else {
    Write-Host (' 有问题,见上') -ForegroundColor Yellow
}
Write-Host $divider
Write-Host ''

if (-not $ok) {
    exit 1
}
