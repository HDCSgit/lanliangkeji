# ============================================================
# 蓝粮海洋 - 一键发布脚本
# ============================================================
#
# 作用: bump version -> commit -> push -> 打 tag -> 验证
#
# 用法:
#   .\scripts\release.ps1                          # 用今天日期作为版本号
#   .\scripts\release.ps1 -Version 2026.6.18       # 指定版本号
#   .\scripts\release.ps1 -Message "fix: xxx"      # 指定 commit message
#   .\scripts\release.ps1 -SkipVerify              # 跳过 /version 端点验证
#   .\scripts\release.ps1 -SkipTag                 # 跳过打 git tag
#
# 流程:
#   1. 校验版本号格式 (YYYY.M.D)
#   2. 检查 git 状态,有未提交改动提示确认
#   3. Bump app/package.json + server/app/core/config.py
#   4. Stage 所有改动 + commit + push origin main
#   5. 打 git tag vYYYY.M.D
#   6. 验证本地 == origin/main
#   7. 验证后端 /version 端点返回新版本
# ============================================================

[CmdletBinding()]
param(
    [string]$Version,
    [string]$Message,
    [switch]$SkipVerify,
    [switch]$SkipTag
)

$ErrorActionPreference = "Stop"

# 切到仓库根
$root = git rev-parse --show-toplevel
Set-Location $root

# 1. 生成版本号(默认今天)
if (-not $Version) {
    $Version = Get-Date -Format "yyyy.M.d"
}

# 2. 校验格式 YYYY.M.D
if ($Version -notmatch '^\d{4}\.\d{1,2}\.\d{1,2}$') {
    Write-Host "[ERROR] 版本号格式应为 YYYY.M.D (例如 2026.6.17),实际: $Version" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Release $Version" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 3. 检查 git 状态
$status = git status --short
$unpushed = git log --oneline origin/main..HEAD 2>$null
if ($unpushed) {
    Write-Host "[WARN] 有未推送的 commit:" -ForegroundColor Yellow
    $unpushed | ForEach-Object { Write-Host "    $_" }
    Write-Host ""
}
if ($status) {
    Write-Host "[WARN] 有未提交的改动:" -ForegroundColor Yellow
    git status --short | ForEach-Object { Write-Host "    $_" }
    Write-Host ""
    $answer = Read-Host "  仍然继续? [y/N]"
    if ($answer -ne 'y' -and $answer -ne 'Y') {
        Write-Host "已取消" -ForegroundColor Yellow
        exit 0
    }
}

# 4. Bump version
Write-Host "[1/6] Bump version -> $Version" -ForegroundColor Green

$pkgPath = "app\package.json"
$pkg = Get-Content $pkgPath -Raw -Encoding UTF8
$newPkg = $pkg -replace '"version":\s*"[^"]+"', "`"version`": `"$Version`""
[System.IO.File]::WriteAllText((Resolve-Path $pkgPath), $newPkg, [System.Text.UTF8Encoding]::new($false))
Write-Host "  + $pkgPath"

$cfgPath = "server\app\core\config.py"
$cfg = Get-Content $cfgPath -Raw -Encoding UTF8
$newCfg = $cfg -replace 'APP_VERSION\s*=\s*"[^"]+"', "APP_VERSION = `"$Version`""
[System.IO.File]::WriteAllText((Resolve-Path $cfgPath), $newCfg, [System.Text.UTF8Encoding]::new($false))
Write-Host "  + $cfgPath"

# 5. Stage + commit + push
Write-Host ""
Write-Host "[2/6] Stage & commit" -ForegroundColor Green

git add $pkgPath $cfgPath

# 把其他未提交改动也一起带上
$remaining = git status --short
if ($remaining) {
    Write-Host "  + 其他改动一并 stage:"
    $remaining | ForEach-Object { Write-Host "    $_" }
    git add -A
}

if (-not $Message) {
    $Message = "release: $Version"
}

git commit -m $Message
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] commit 失败" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[3/6] Push origin main" -ForegroundColor Green
git push origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] push 失败" -ForegroundColor Red
    exit 1
}

# 6. 打 tag
if (-not $SkipTag) {
    Write-Host ""
    Write-Host "[4/6] Tag release" -ForegroundColor Green
    $tag = "v$Version"
    git tag -a $tag -m "Release $Version" 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        git push origin $tag 2>&1 | Out-Null
        Write-Host "  + tag: $tag"
    } else {
        Write-Host "  [WARN] tag 已存在,跳过" -ForegroundColor Yellow
    }
}

# 7. 验证本地 = origin
Write-Host ""
Write-Host "[5/6] 验证本地 = origin/main" -ForegroundColor Green
Start-Sleep -Seconds 1
git fetch origin 2>&1 | Out-Null
$localHead = git rev-parse HEAD
$originHead = git rev-parse origin/main
if ($localHead -eq $originHead) {
    Write-Host "  OK $localHead" -ForegroundColor Green
} else {
    Write-Host "  [ERROR] 不一致! local=$localHead origin=$originHead" -ForegroundColor Red
    exit 1
}

# 8. 验证后端 /version
if (-not $SkipVerify) {
    Write-Host ""
    Write-Host "[6/6] 验证后端 /version" -ForegroundColor Green
    try {
        $r = Invoke-WebRequest -Uri 'http://localhost:8000/version' -UseBasicParsing -TimeoutSec 5
        $v = ($r.Content | ConvertFrom-Json).version
        if ($v -eq $Version) {
            Write-Host "  OK /version = $v" -ForegroundColor Green
        } else {
            Write-Host "  [WARN] /version=$v,期望 $Version (需要重启后端)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "  [WARN] /version 端点不可访问 (后端可能没起,或不是本地)" -ForegroundColor Yellow
    }
} else {
    Write-Host ""
    Write-Host "[6/6] 跳过 /version 验证" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Release $Version 完成" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "线上部署: git pull origin main && 重启服务" -ForegroundColor Gray
Write-Host ""
