# 图片资源目录

所有静态图片资源统一存放于此，按功能分类管理。

## 目录结构

```
public/
├── images/
│   ├── banners/        # 首页轮播图
│   ├── products/       # 产品图片
│   ├── news/           # 新闻配图
│   ├── partners/       # 合作伙伴Logo
│   ├── services/       # 服务介绍图
│   ├── team/           # 团队照片
│   ├── honors/         # 资质荣誉
│   ├── rd/             # 研发技术
│   ├── equipment/      # 研发设备
│   ├── about/          # 关于我们页面
│   └── contact/        # 联系我们页面
└── uploads/            # 用户上传文件（凭证等）
```

## 使用方式

在代码中引用时，使用根路径：

```tsx
<img src="/images/products/product-1.jpg" />
```

Vite 会自动将 `public/` 目录下的文件映射到站点根路径。

## 资源备份

部署前务必将 `public/images/` 和 `public/uploads/` 备份。
建议定期同步到对象存储（如阿里云OSS、腾讯云COS）作为二次备份。

## 新增资源

1. 将图片放入对应分类目录
2. 使用有意义的文件名（小写，用连字符分隔）
3. 更新代码中的引用路径
