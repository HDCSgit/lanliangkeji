# 版本管理规范

## 版本号格式

`YYYY.M.D` (例: `2026.6.17`)

- 跟日期挂钩,一眼能看出发布日期
- 每次发布 bump 一次,不允许同一天多次
- 前后端版本号必须**完全一致**

## 版本号同步点

3 个地方要保持一致,改一处必须改另外两处:

| 文件 | 字段 | 作用 |
|------|------|------|
| `app/package.json` | `"version"` | 前端 build / package metadata |
| `server/app/core/config.py` | `APP_VERSION` | 后端 OpenAPI + /version 端点 |
| Git tag | `vYYYY.M.D` | 发布历史标记 |

## 日常流程

### 改完代码后,准备发布

```powershell
# 一键发布:bump version + commit + push + tag + 验证
.\scripts\release.ps1
# 或指定版本号
.\scripts\release.ps1 -Version 2026.6.18
# 或带自定义 message
.\scripts\release.ps1 -Message "fix: 修复运费计算边界 case"
```

脚本会:

1. 校验版本号格式
2. 检查 git 状态,有未提交改动会**问一次**确认
3. Bump `app/package.json` + `server/app/core/config.py`
4. Stage 所有改动,commit, push `origin main`
5. 打 git tag `vYYYY.M.D`,push tag
6. 验证本地 == origin/main
7. 验证后端 `/version` 端点返回新版本

### 发布前/后健康检查

```powershell
.\scripts\check-version.ps1
```

检查项:
- git 是否 clean
- 是否有未推送 commit
- 前后端版本号是否一致
- 后端 `/version` 端点返回

## 线上部署步骤

```bash
# 1. 拉最新代码
cd /path/to/project
git pull origin main

# 2. 重启后端 (Windows)
taskkill /F /IM python.exe
.\server\venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000

# 3. 重启前端 (dev)
cd app
npm run dev

# 或前端 build (生产)
npm run build
# 用 nginx / serve 部署 dist 目录

# 4. 验证
curl http://your-domain/version
# 期望返回: {"version":"2026.6.17"}
```

## 核心原则

1. **本地 = origin = 线上** (任何时候三处必须一致)
2. **改一处不传 = bug** (改完代码不 commit + push 跟没改一样)
3. **每次 commit 前** 跑一次 `check-version.ps1`
4. **每次发布** 跑一次 `release.ps1`
5. **不允许** 把 dev DB (`lanliang_dev.db`) 传上去(本地开发库会污染所有协作者)

## 常见问题

### Q: 我改了代码但忘记 push,怎么知道?
A: 跑 `.\scripts\check-version.ps1`,会列出未推送 commit。

### Q: 线上还是老版本,为什么?
A: 99% 是没 `git pull`,或 pull 了没重启服务。pull 完跑 `check-version.ps1` 看 `/version` 端点。

### Q: release.ps1 报"找不到 APP_VERSION"怎么办?
A: 看 `server/app/core/config.py` 顶部,确认 `APP_VERSION = "..."` 这一行存在(必须是字符串字面量,不能是变量拼接)。

### Q: 我有未提交改动,能直接 release 吗?
A: 可以,脚本会提示你确认。但建议先单独 commit 那些改动(用 `git add -A && git commit -m "WIP"`),再 release,这样 release commit 是干净的版本号 bump。

## 不要做的事

- **不要** 手动改版本号然后 commit,统一用 `release.ps1`
- **不要** 在 `lanliang_dev.db` 改动后 commit(它是 .gitignore 应该忽略的,确认一下)
- **不要** 在本地 commit 但忘记 push,跑 `check-version.ps1` 检查
- **不要** 改完代码直接去线上,要先发布到 origin,线上 pull 才会有
