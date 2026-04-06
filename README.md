# 福州蓝粮海洋生物科技有限公司官网

<p align="center">
  <img src="https://img.shields.io/badge/React-19.2.0-61DAFB?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.9.3-3178C6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-7.2.4-646CFF?logo=vite" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind%20CSS-3.4.19-06B6D4?logo=tailwindcss" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/shadcn%2Fui-latest-000000?logo=shadcnui" alt="shadcn/ui" />
</p>

<p align="center">
  <b>专注于海洋生物科技研发、水产深加工与健康食材供应的企业官网</b>
</p>

---

## 🌊 项目简介

这是一个现代化的海洋生物科技企业官网项目，采用 React + TypeScript + Vite + Tailwind CSS 技术栈构建。网站包含完整的企业展示功能和后台管理系统，支持内容管理、产品展示、新闻发布等核心功能。

### 演示信息

- **前台地址**: `http://localhost:5173/`
- **后台地址**: `http://localhost:5173/admin/login`
- **默认账号**: `admin` / `admin123`

---

## ✨ 网站特性

### 🎨 设计特色

- **海洋主题设计**: 以深蓝色为主色调，体现海洋科技感
- **流畅动画**: 基于 GSAP 的高性能滚动动画和页面过渡效果
- **响应式布局**: 完美适配桌面端、平板和移动设备
- **现代化 UI**: 使用 shadcn/ui 组件库，界面美观统一
- **平滑滚动**: 集成 Lenis 实现流畅的滚动体验
- **手机端智能导航**: 滚动时公司名称自动隐藏/显示，优化视觉体验

#### 📱 手机端导航特效

手机端导航栏实现了智能滚动交互效果：

| 滚动方向 | 效果 |
|---------|------|
| **向上滚动（下滑页面）** | 公司名称淡出并向左滑出隐藏 |
| **向下滚动（上滑页面）** | 公司名称淡入并从左侧滑入显示 |

**实现原理：**
- 监听页面滚动方向和距离
- 使用 CSS `transform` 和 `opacity` 实现平滑过渡
- 过渡时长 500ms，提供流畅的视觉体验
- 桌面端不受影响，始终显示完整导航

**设计目的：**
- 向下滚动阅读内容时，减少导航栏视觉干扰
- 向上滚动返回顶部时，快速识别当前位置
- 保持 Logo 始终可见，确保品牌识别度

### ⚡ 性能优化

- **Vite 构建**: 极速的开发体验和优化的生产构建
- **代码分割**: 路由级别的懒加载
- **图片优化**: 支持 WebP 格式和懒加载
- **动画性能**: GPU 加速的 CSS 动画

---

## 🚀 功能模块

### 前台功能

| 模块 | 描述 | 特性 |
|------|------|------|
| **首页** | 企业门户首页 | Hero轮播、关于简介、服务展示、产品精选、研发实力、合作伙伴、新闻动态、联系方式 |
| **关于我们** | 企业介绍 | 公司简介、企业文化、发展历程、资质荣誉、核心团队 |
| **产品中心** | 产品展示 | 产品分类、详情展示、规格参数、产品特性 |
| **研发实力** | R&D展示 | 核心技术、研发设备、专利成果、合作伙伴 |
| **新闻资讯** | 新闻动态 | 公司新闻、行业资讯、分页浏览 |
| **联系我们** | 联系信息 | 联系方式、地图位置、在线留言 |

### 后台管理功能

| 模块 | 功能描述 |
|------|----------|
| **仪表盘** | 数据统计概览、快捷入口 |
| **Banner管理** | 轮播图增删改查、排序、启用/禁用 |
| **产品管理** | 产品信息维护、分类管理、规格参数配置 |
| **新闻管理** | 新闻发布、编辑、分类管理 |
| **合作伙伴** | 合作伙伴信息管理 |
| **系统设置** | 网站配置、SEO设置、联系方式 |

### 🖥️ 后台管理系统详解

后台管理系统提供了完整的内容管理功能，无需后端服务器，数据存储在浏览器 LocalStorage 中。

#### 🔐 进入后台

1. 访问后台登录页面：`http://localhost:5173/admin/login`
2. 使用默认账号登录：
   - 用户名：`admin`
   - 密码：`admin123`

#### 📊 功能模块说明

**仪表盘**
- 网站数据概览统计
- 快捷操作入口
- 最近动态提醒

**轮播图管理**
- 添加/编辑/删除首页 Banner
- 设置标题、副标题、描述、按钮文字
- 调整轮播顺序和显示状态

**产品管理**
- 维护产品信息（名称、分类、描述、图片）
- 配置产品规格参数
- 设置产品特性标签
- 启用/禁用产品展示

**新闻管理**
- 发布公司新闻和动态
- 支持富文本编辑
- 分类管理（公司新闻、行业资讯等）
- 浏览量统计

**合作伙伴**
- 添加合作机构信息
- 上传 Logo 图片
- 设置官网链接

**网站设置**
- 基础信息：网站标题、Logo、描述
- SEO 配置：关键词、描述、OG 图片
- 联系信息：地址、电话、邮箱、工作时间
- ICP 备案号设置

#### ⚠️ 数据说明

- 所有数据存储在浏览器 LocalStorage 中
- 清除浏览器缓存会丢失所有修改的数据
- 不同浏览器/设备间数据不互通
- 建议定期备份重要数据

---

## 🛠️ 技术栈

### 核心技术

- **React 19** - 最新的 React 版本，支持并发特性
- **TypeScript** - 类型安全的 JavaScript 超集
- **Vite 7** - 下一代前端构建工具
- **React Router 7** - 声明式路由管理

### UI/样式

- **Tailwind CSS 3.4** - 实用优先的 CSS 框架
- **shadcn/ui** - 高质量的 React 组件库（40+ 组件）
- **Radix UI** - 无头 UI 组件底层
- **Lucide React** - 精美的图标库

### 动画与交互

- **GSAP** - 专业级动画库
- **@gsap/react** - GSAP 的 React 集成
- **Lenis** - 平滑滚动库
- **Framer Motion** - React 动画库（通过 shadcn/ui 引入）

### 表单与数据

- **React Hook Form** - 高性能表单管理
- **Zod** - 类型安全的表单验证
- **localStorage** - 本地数据持久化

### 图表与可视化

- **Recharts** - React 图表库

---

## 📁 项目结构

```
my-app/
├── public/                 # 静态资源
├── src/
│   ├── admin/             # 后台管理页面
│   │   ├── AdminLogin.tsx
│   │   ├── AdminLayout.tsx
│   │   ├── AdminDashboard.tsx
│   │   ├── AdminBanners.tsx
│   │   ├── AdminProducts.tsx
│   │   ├── AdminNews.tsx
│   │   ├── AdminPartners.tsx
│   │   └── AdminSettings.tsx
│   ├── components/        # 公共组件
│   │   ├── ui/           # shadcn/ui 组件（40+）
│   │   ├── effects/      # 动画效果组件
│   │   ├── Navigation.tsx
│   │   └── Footer.tsx
│   ├── data/             # 数据管理
│   │   └── store.ts      # LocalStorage 数据存储
│   ├── hooks/            # 自定义 Hooks
│   ├── lib/              # 工具函数
│   ├── pages/            # 前台页面
│   │   ├── HomePage.tsx
│   │   ├── AboutPage.tsx
│   │   ├── ProductsPage.tsx
│   │   ├── RDPage.tsx
│   │   ├── NewsPage.tsx
│   │   └── ContactPage.tsx
│   ├── sections/         # 页面区块组件
│   │   ├── HeroSection.tsx
│   │   ├── AboutSection.tsx
│   │   ├── ServicesSection.tsx
│   │   ├── ProductsSection.tsx
│   │   ├── RDSection.tsx
│   │   ├── PartnersSection.tsx
│   │   ├── NewsSection.tsx
│   │   ├── ContactSection.tsx
│   │   └── WhyUsSection.tsx
│   ├── types/            # TypeScript 类型定义
│   ├── App.tsx           # 应用入口
│   ├── main.tsx          # 渲染入口
│   └── index.css         # 全局样式
├── components.json       # shadcn/ui 配置
├── tailwind.config.js    # Tailwind 配置
├── vite.config.ts        # Vite 配置
└── package.json
```

---

## 🚀 快速开始

### 环境要求

- Node.js 20+
- npm 10+ 或 pnpm/yarn

### 安装步骤

1. **克隆项目**

```bash
git clone <repository-url>
cd my-app
```

2. **安装依赖**

```bash
npm install
```

3. **启动开发服务器**

```bash
npm run dev
```

访问 `http://localhost:5173/` 查看网站。

4. **构建生产版本**

```bash
npm run build
```

构建后的文件位于 `dist/` 目录。

### 可用脚本

| 脚本 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm run preview` | 预览生产构建 |
| `npm run lint` | 运行 ESLint 检查 |

---

## 📝 使用指南

### 后台管理

1. 访问 `/admin/login` 进入登录页面
2. 使用默认账号 `admin` / `admin123` 登录
3. 登录后可管理网站各项内容

### 内容管理

所有内容数据存储在浏览器的 LocalStorage 中，包括：

- 网站配置
- Banner 轮播图
- 产品信息
- 新闻资讯
- 合作伙伴
- 页面内容
- 导航菜单

---

## 🖥️ 生产部署

### 方式一：宝塔面板部署（推荐）

#### 1. 准备工作

- 已安装宝塔面板的服务器（Linux 推荐 CentOS 7+/Ubuntu 20+）
- 已安装 Nginx 和 Node.js 版本管理器
- 域名已解析到服务器

#### 2. 本地构建

```bash
# 在项目根目录执行
npm install
npm run build
```

构建完成后，会生成 `dist/` 目录。

#### 3. 宝塔面板配置

**步骤 1：上传文件**
1. 登录宝塔面板
2. 进入「文件」→ 选择网站目录（如 `/www/wwwroot/lanliang-marine.com`）
3. 删除原有文件，上传本地 `dist/` 目录内的所有文件

**步骤 2：创建站点**
1. 进入「网站」→「添加站点」
2. 填写域名（如 `www.lanliang-marine.com`）
3. 根目录选择刚才上传文件的目录
4. PHP 版本选择「纯静态」
5. 点击「提交」

**步骤 3：配置伪静态**
由于使用的是 React Router（History 模式），需要配置 URL 重写：

1. 点击站点「设置」→「伪静态」
2. 选择模板为「纯静态」或手动填写：

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

**步骤 4：SSL 证书（可选但推荐）**
1. 点击站点「设置」→「SSL」
2. 选择「Let's Encrypt」或上传自有证书
3. 开启「强制 HTTPS」

---

### 方式二：Nginx 手动部署

#### 1. 上传构建文件

将 `dist/` 目录上传到服务器，例如：

```bash
# 使用 scp 上传
scp -r dist/* root@your-server-ip:/var/www/lanliang-marine.com/
```

#### 2. Nginx 配置文件

创建 Nginx 配置文件 `/etc/nginx/conf.d/lanliang-marine.conf`：

```nginx
server {
    listen 80;
    server_name www.lanliang-marine.com lanliang-marine.com;
    
    # 重定向到 HTTPS（如已配置 SSL）
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name www.lanliang-marine.com lanliang-marine.com;
    
    # SSL 证书配置（请替换为实际路径）
    ssl_certificate /path/to/your/ssl.crt;
    ssl_certificate_key /path/to/your/ssl.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers on;
    
    # 网站根目录
    root /var/www/lanliang-marine.com;
    index index.html;
    
    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;
    
    # 缓存静态资源
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
    
    # 主入口
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache";
    }
    
    # 安全响应头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
```

#### 3. 测试并重载 Nginx

```bash
# 检查配置语法
nginx -t

# 重载配置
nginx -s reload
```

---

### 方式三：Docker 部署

#### Dockerfile

```dockerfile
# 构建阶段
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 运行阶段
FROM nginx:alpine

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制自定义 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### docker-compose.yml

```yaml
version: '3.8'

services:
  web:
    build: .
    container_name: lanliang-marine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./ssl:/etc/nginx/ssl:ro
    restart: unless-stopped
```

#### 构建并运行

```bash
# 构建镜像
docker-compose build

# 运行容器
docker-compose up -d

# 查看日志
docker-compose logs -f
```

---

### 🔄 自动化部署（可选）

#### 使用 GitHub Actions

创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to Server

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build
      run: npm run build
    
    - name: Deploy to Server
      uses: appleboy/scp-action@master
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        password: ${{ secrets.PASSWORD }}
        source: "dist/*"
        target: "/var/www/lanliang-marine.com/"
        strip_components: 1
```

在 GitHub 仓库的 Settings → Secrets 中添加：
- `HOST`: 服务器 IP
- `USERNAME`: SSH 用户名
- `PASSWORD`: SSH 密码

---

## 🎨 自定义主题

### 修改颜色主题

编辑 `tailwind.config.js` 中的 `theme.extend.colors`：

```javascript
colors: {
  ocean: {
    deep: "#0A2342",    // 深海蓝
    blue: "#165DFF",    // 海洋蓝
    light: "#4A9EFF",   // 浅海蓝
    cyan: "#00D4FF",    // 青色
    foam: "#E8F4F8",    // 浪花白
  },
  coral: {
    DEFAULT: "#FF8C42", // 珊瑚橙
    light: "#FFB347",
  },
}
```

### 修改字体

编辑 `tailwind.config.js` 中的 `theme.extend.fontFamily`：

```javascript
fontFamily: {
  sans: ['Poppins', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Microsoft YaHei', 'sans-serif'],
  display: ['Poppins', 'sans-serif'],
}
```

---

## 🌐 浏览器兼容性

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

## 📄 许可证

[MIT](LICENSE)

---

## 🤝 联系方式

如有问题或建议，欢迎联系我们：

- **公司**: 福州蓝粮海洋生物科技有限公司
- **地址**: 福建省福州市马尾区 Seafood Industrial Park 88号
- **电话**: 0591-88888888
- **邮箱**: contact@lanliang-marine.com

---

<p align="center">
  Made with ❤️ by 福州蓝粮海洋生物科技有限公司
</p>
