import React, { useState, useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import {
  Plus, Edit2, Trash2, Search,
  ImageIcon, X, Package, Upload, ChevronUp, ChevronDown
} from 'lucide-react';
import { DataStore } from '@/data/store';
import userStore from '@/data/userStore';
import type { Product, ProductSpec } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import ProductImage from '@/components/ProductImage';

const CATEGORIES = ['海洋生物制品', '水产深加工', '健康食材', '原料供应'];
const MAX_COVER_IMAGES = 5;

const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  // 上下架筛选:'all' | 'active' | 'inactive'(默认全部)
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  // 当前对话框里的是不是"新建草稿"(用于取消时删除)
  const [isDraft, setIsDraft] = useState(false);
  const [saving, setSaving] = useState(false);
  // 上传进度(记录上传中 / 上传失败的图片)
  // key: 'cover' | 'detail', value: { loadingCount, errors: [{index, message}] }
  const [uploadStatus, setUploadStatus] = useState<{
    cover: { loading: boolean; error: string | null };
    detail: { loading: boolean; error: string | null };
  }>({
    cover: { loading: false, error: null },
    detail: { loading: false, error: null },
  });

  // 基础字段
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    category: CATEGORIES[0],
    description: '',
    image: '',
    isActive: true,
    coverImages: [],
    detailImages: [],
    enableCarousel: false,
    // 运费规则(默认包邮)
    shippingEnabled: false,
    shippingInitialFee: 0,
    shippingPerUnitCount: 1,
    shippingPerUnitFee: 0,
  });

  // 规格
  const [specs, setSpecs] = useState<ProductSpec[]>([]);

  // 产品特点
  const [features, setFeatures] = useState<string[]>([]);
  const [featureInput, setFeatureInput] = useState('');

  // (现在不再需要本地暂存图片:点"添加产品"立即创建草稿,所有上传都用真实 id)

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    const q = searchQuery.toLowerCase();
    let arr = products;
    // 上下架筛选
    if (statusFilter === 'active') arr = arr.filter((p) => p.isActive);
    else if (statusFilter === 'inactive') arr = arr.filter((p) => !p.isActive);
    // 搜索
    if (q) {
      arr = arr.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q),
      );
    }
    setFilteredProducts(arr);
  }, [searchQuery, products, statusFilter]);

  const loadProducts = async () => {
    const loaded = (await DataStore.getProducts()).sort((a, b) => a.order - b.order);
    setProducts(loaded);
    setFilteredProducts(loaded);
  };

  const resetForm = () => {
    setEditingProduct(null);
    setIsDraft(false);
    setFormData({
      name: '',
      category: CATEGORIES[0],
      description: '',
      image: '',
      isActive: true,
      coverImages: [],
      detailImages: [],
      enableCarousel: false,
    });
    setSpecs([]);
    setFeatures([]);
    setFeatureInput('');
    setUploadStatus({
      cover: { loading: false, error: null },
      detail: { loading: false, error: null },
    });
  };

  const openEditDialog = (product: Product) => {
    setIsDraft(false);
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      description: product.description,
      image: product.image,
      isActive: product.isActive,
      coverImages: product.coverImages || (product.image ? [product.image] : []),
      detailImages: product.detailImages || [],
      enableCarousel: !!product.enableCarousel,
      shippingEnabled: !!product.shippingEnabled,
      shippingInitialFee: product.shippingInitialFee ?? 0,
      shippingPerUnitCount: product.shippingPerUnitCount ?? 1,
      shippingPerUnitFee: product.shippingPerUnitFee ?? 0,
    });
    setSpecs(product.specs || []);
    setFeatures(product.features || []);
    setFeatureInput('');
    setIsDialogOpen(true);
  };

  const openCreateDialog = async () => {
    // 立即在服务端创建一个"草稿"产品(只有 name,其它都空)
    // 后续所有图片上传 / 规格保存都走真实 id,避免前端暂存逻辑
    // 用户取消时如果草稿没实质内容,就 DELETE 掉
    try {
      const draft = await DataStore.createProduct({
        name: '未命名产品',
        category: CATEGORIES[0],
        description: '',
        image: '',
        cover_images: [],
        detail_images: [],
        enable_carousel: false,
        features: [],
        is_active: false,  // 草稿默认不上架
        order: 0,
        // 运费规则(默认包邮)
        shipping_enabled: false,
        shipping_initial_fee: 0,
        shipping_per_unit_count: 1,
        shipping_per_unit_fee: 0,
        specs: [],
      } as any);
      // 拿到的 draft 就是新建草稿,当作 editingProduct
      setEditingProduct(draft as Product);
      setFormData({
        name: '未命名产品',
        category: CATEGORIES[0],
        description: '',
        image: '',
        isActive: false,
        coverImages: [],
        detailImages: [],
        enableCarousel: false,
        shippingEnabled: false,
        shippingInitialFee: 0,
        shippingPerUnitCount: 1,
        shippingPerUnitFee: 0,
      });
      setSpecs([]);
      setFeatures([]);
      setFeatureInput('');
      setIsDraft(true);
      setIsDialogOpen(true);
    } catch (e: any) {
      alert('创建产品失败: ' + (e?.message || e));
    }
  };

  // ---- 规格编辑 ----
  const updateSpec = (index: number, patch: Partial<ProductSpec>) => {
    setSpecs((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };
  const addSpec = () => {
    setSpecs((prev) => [
      ...prev,
      {
        id: `spec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: '',
        unit: '件',
        price: null as any,
        stock: null as any,
        minOrder: 1,
        isActive: true,
      } as ProductSpec,
    ]);
  };
  const removeSpec = (index: number) => {
    setSpecs((prev) => prev.filter((_, i) => i !== index));
  };

  // ---- 特点编辑 ----
  const addFeature = () => {
    const v = featureInput.trim();
    if (!v) return;
    if (features.includes(v)) {
      setFeatureInput('');
      return;
    }
    setFeatures((prev) => [...prev, v]);
    setFeatureInput('');
  };
  const removeFeature = (index: number) => {
    setFeatures((prev) => prev.filter((_, i) => i !== index));
  };

  // ---- 封面图操作 ----
  const moveCover = (index: number, direction: -1 | 1) => {
    setFormData((prev) => {
      const arr = [...(prev.coverImages || [])];
      const target = index + direction;
      if (target < 0 || target >= arr.length) return prev;
      [arr[index], arr[target]] = [arr[target], arr[index]];
      return { ...prev, coverImages: arr };
    });
  };
  // removeCover/removeDetail 由 handleRemoveCoverServer/handleRemoveDetailServer 替代(走 API)

  // ---- 详情图操作 ----
  const moveDetail = (index: number, direction: -1 | 1) => {
    setFormData((prev) => {
      const arr = [...(prev.detailImages || [])];
      const target = index + direction;
      if (target < 0 || target >= arr.length) return prev;
      [arr[index], arr[target]] = [arr[target], arr[index]];
      return { ...prev, detailImages: arr };
    });
  };
  // removeDetail 由 handleRemoveDetailServer 替代(走 API)

  // ---- 图片上传 ----
  // 永远走 editingProduct.id(openCreateDialog 已经创建了草稿,所以一定有 id)
  const handleCoverUpload = async (file: File) => {
    if (!editingProduct) return;
    setUploadStatus((s) => ({ ...s, cover: { loading: true, error: null } }));
    try {
      const position = (formData.coverImages?.length ?? 0);
      const r = await DataStore.uploadProductImage(editingProduct.id, file, 'cover', position);
      setFormData((prev) => ({
        ...prev,
        coverImages: r.coverImages,
        image: r.coverImages[0] || prev.image,
        enableCarousel: (prev.enableCarousel ?? false) && r.coverImages.length >= 2 ? prev.enableCarousel : (r.coverImages.length >= 2 ? prev.enableCarousel : false),
      }));
      setUploadStatus((s) => ({ ...s, cover: { loading: false, error: null } }));
      await loadProducts();
    } catch (e: any) {
      const status = e?.response?.status ?? e?.status;
      let msg: string;
      if (status === 401 || status === 403) {
        msg = '无上传权限(需要系统管理员)';
      } else {
        msg = e?.message || '上传失败';
      }
      setUploadStatus((s) => ({ ...s, cover: { loading: false, error: msg } }));
      // 5 秒后自动清除错误提示
      setTimeout(() => {
        setUploadStatus((s) => (s.cover.error === msg ? { ...s, cover: { ...s.cover, error: null } } : s));
      }, 5000);
    }
  };

  const handleDetailUpload = async (file: File) => {
    if (!editingProduct) return;
    setUploadStatus((s) => ({ ...s, detail: { loading: true, error: null } }));
    try {
      const r = await DataStore.uploadProductImage(editingProduct.id, file, 'detail');
      setFormData((prev) => ({ ...prev, detailImages: r.detailImages }));
      setUploadStatus((s) => ({ ...s, detail: { loading: false, error: null } }));
      await loadProducts();
    } catch (e: any) {
      const status = e?.response?.status ?? e?.status;
      let msg: string;
      if (status === 401 || status === 403) {
        msg = '无上传权限(需要系统管理员)';
      } else {
        msg = e?.message || '上传失败';
      }
      setUploadStatus((s) => ({ ...s, detail: { loading: false, error: msg } }));
      setTimeout(() => {
        setUploadStatus((s) => (s.detail.error === msg ? { ...s, detail: { ...s.detail, error: null } } : s));
      }, 5000);
    }
  };

  const handleRemoveCoverServer = async (url: string) => {
    if (!editingProduct) return;
    if (!confirm('确定要删除这张封面图吗?')) return;
    try {
      const r = await DataStore.removeProductImage(editingProduct.id, url, 'cover');
      setFormData((prev) => ({ ...prev, coverImages: r.coverImages, image: r.coverImages[0] || '', enableCarousel: (prev.enableCarousel ?? false) && r.coverImages.length >= 2 }));
      await loadProducts();
    } catch (e: any) {
      alert('删除失败: ' + (e?.message || e));
    }
  };

  const handleRemoveDetailServer = async (url: string) => {
    if (!editingProduct) return;
    if (!confirm('确定要删除这张详情图吗?')) return;
    try {
      const r = await DataStore.removeProductImage(editingProduct.id, url, 'detail');
      setFormData((prev) => ({ ...prev, detailImages: r.detailImages }));
      await loadProducts();
    } catch (e: any) {
      alert('删除失败: ' + (e?.message || e));
    }
  };

  // ---- 轮播切换 ----
  const handleToggleCarousel = async (next: boolean) => {
    // 本地态先反馈
    setFormData((prev) => ({ ...prev, enableCarousel: next && (prev.coverImages?.length ?? 0) >= 2 }));
    if (!editingProduct) return;
    try {
      const r = await DataStore.toggleProductCarousel(editingProduct.id, next);
      setFormData((prev) => ({ ...prev, enableCarousel: r.enableCarousel }));
      await loadProducts();
    } catch (e: any) {
      alert('切换轮播失败: ' + (e?.message || e));
    }
  };

  // ---- 上架切换 ----
  const handleToggleActive = async (id: string, next: boolean) => {
    const updated = products.map((p) => (p.id === id ? { ...p, isActive: next } : p));
    try {
      await DataStore.setProducts(updated);
      await loadProducts();
    } catch (e: any) {
      alert('切换上架失败: ' + (e?.message || e));
    }
  };

  // ---- 保存 ----
  const handleSave = async () => {
    // 关键:单价格式 input 是 uncontrolled + onBlur 写回 state,
    // 用户在 input 里改了值但没失焦就点保存时,onBlur 还没触发,
    // 必须在保存前主动 blur + flushSync,让 React 把最新值同步到 formData/specs
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    flushSync(() => {});

    // 权限校验:产品创建/更新需要 sysadmin
    if (!userStore.isSysAdmin()) {
      alert('保存失败:当前账号没有创建/编辑产品的权限(需要系统管理员)。请用 admin 账号登录后再试。');
      return;
    }
    if (!formData.name?.trim()) {
      alert('请输入产品名称');
      return;
    }
    // 允许先保存再上传图(避免"必须先有图才能创建,但创建对话框里上传按钮又被禁用"的死锁)
    if (specs.length === 0) {
      alert('请至少添加一个产品规格');
      return;
    }
    // 校验规格
    for (let i = 0; i < specs.length; i++) {
      const s = specs[i];
      if (!s.name?.trim()) {
        alert(`第 ${i + 1} 行规格: 名称不能为空`);
        return;
      }
      if (s.price === undefined || s.price < 0) {
        alert(`第 ${i + 1} 行规格: 单价必须 ≥ 0`);
        return;
      }
      if (s.stock === undefined || s.stock < 0) {
        alert(`第 ${i + 1} 行规格: 库存必须 ≥ 0`);
        return;
      }
    }

    setSaving(true);
    try {
      // 草稿已经有真实 id(editingProduct 一定有值)
      // 1) PUT 更新草稿/产品的全部信息
      // 2) 如果是草稿且规格/封面齐全,转为正式产品(isActive = 用户选择)
      const coverUrls: string[] = (formData.coverImages || []).filter((u) => !u.startsWith('data:'));
      const detailUrls: string[] = (formData.detailImages || []).filter((u) => !u.startsWith('data:'));
      const payload = {
        name: formData.name!,
        category: formData.category || CATEGORIES[0],
        description: formData.description || '',
        image: coverUrls[0] ?? formData.image ?? '',
        cover_images: coverUrls,
        detail_images: detailUrls,
        enable_carousel: !!(formData.enableCarousel && coverUrls.length >= 2),
        features,
        is_active: formData.isActive ?? true,
        order: formData.order ?? products.length + 1,
        // 运费规则
        shipping_enabled: !!formData.shippingEnabled,
        shipping_initial_fee: formData.shippingInitialFee ?? 0,
        shipping_per_unit_count: formData.shippingPerUnitCount ?? 1,
        shipping_per_unit_fee: formData.shippingPerUnitFee ?? 0,
        specs: specs.map((s) => ({
          name: s.name ?? '',
          unit: s.unit || '件',
          price: s.price ?? 0,
          stock: s.stock ?? 0,
          min_order: s.minOrder ?? 1,
          is_active: s.isActive !== false,
        })),
      };
      await DataStore.updateProduct(editingProduct!.id, payload as any);
      await loadProducts();
      setIsDraft(false);  // 草稿状态结束
      setIsDialogOpen(false);
      resetForm();
    } catch (err: any) {
      alert('保存失败: ' + (err?.message || err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个产品吗?删除后无法恢复')) return;
    try {
      await DataStore.deleteProduct(id);
      await loadProducts();
    } catch (e: any) {
      const status = e?.response?.status ?? e?.status;
      if (status === 401 || status === 403) {
        alert('删除失败:当前账号没有删除产品的权限(需要系统管理员)。');
      } else {
        alert('删除失败: ' + (e?.message || e));
      }
    }
  };

  // 弹窗关闭的统一处理:草稿 → 删除草稿;已存在产品 → 不动
  const handleDialogClose = async () => {
    if (isDraft && editingProduct) {
      // 静默删除草稿(用户取消,不打扰)
      try {
        await DataStore.deleteProduct(editingProduct.id);
      } catch {
        // 草稿删除失败不阻塞 UI
      }
      setIsDraft(false);
    }
    setIsDialogOpen(false);
    resetForm();
  };

  // 价格汇总
  const priceRange = (product: Product) => {
    if (!product.specs?.length) return '-';
    const prices = product.specs.map((s) => s.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min === max ? `¥${min}` : `¥${min} ~ ¥${max}`;
  };
  const totalStock = (product: Product) =>
    product.specs?.reduce((sum, s) => sum + (s.stock || 0), 0) ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ocean-deep">产品管理</h1>
          <p className="text-gray-500">管理产品信息、封面图、详情图、规格、库存</p>
        </div>
        <div className="flex items-center gap-3">
          {/* 上下架筛选 */}
          <div className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5">
            {([
              { key: 'all', label: '全部' },
              { key: 'active', label: '已上架' },
              { key: 'inactive', label: '已下架' },
            ] as const).map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setStatusFilter(opt.key)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  statusFilter === opt.key
                    ? 'bg-ocean-blue text-white shadow-sm'
                    : 'text-gray-600 hover:text-ocean-deep'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索产品名 / 分类..."
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none w-64"
            />
          </div>
          <Button onClick={openCreateDialog} className="bg-ocean-blue hover:bg-ocean-deep">
            <Plus className="w-4 h-4 mr-2" />
            添加产品
          </Button>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
          <div key={product.id} className="bg-white rounded-2xl shadow-card overflow-hidden group">
            <div className="relative h-40">
              <ProductImage
                src={product.coverImages?.[0] || product.image}
                alt={product.name}
                className="w-full h-full"
                imgClassName="group-hover:scale-110 transition-transform duration-500"
                aspectRatio="4/3"
                sizeHint="thumb"
              />
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-xs text-ocean-blue bg-ocean-blue/10 px-2 py-1 rounded-full shrink-0">
                  {product.category}
                </span>
                {/* 列表卡片上的上架 toggle - 好看动画 */}
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-medium ${product.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                    {product.isActive ? '已上架' : '已下架'}
                  </span>
                  <Switch
                    checked={product.isActive}
                    onCheckedChange={(next) => handleToggleActive(product.id, next)}
                    className="data-[state=checked]:bg-green-500 scale-90 transition-all duration-300"
                  />
                </div>
              </div>
              <h3 className="font-bold text-ocean-deep mb-1 line-clamp-1">{product.name}</h3>
              <p className="text-sm text-gray-500 line-clamp-2 mb-2 h-10">{product.description}</p>
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                <span>封面图 {(product.coverImages?.length ?? 0)}/{MAX_COVER_IMAGES}</span>
                <span>·</span>
                <span>详情图 {product.detailImages?.length ?? 0}</span>
                <span>·</span>
                <span>轮播 {product.enableCarousel && (product.coverImages?.length ?? 0) >= 2 ? '开' : '关'}</span>
              </div>
              <div className="text-sm flex items-center justify-between text-gray-700 border-t pt-2">
                <span>价格: <span className="font-medium text-ocean-blue">{priceRange(product)}</span></span>
                <span>库存: <span className="font-medium">{totalStock(product)}</span></span>
              </div>
              <div className="flex items-center justify-end gap-2 mt-3">
                <button
                  onClick={() => openEditDialog(product)}
                  className="p-2 hover:bg-ocean-blue/10 text-ocean-blue rounded-lg transition-colors"
                  title="编辑"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(product.id)}
                  className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors"
                  title="删除"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12 text-gray-500 bg-white rounded-2xl">
          {products.length === 0
            ? '暂无产品,点击右上角"添加产品"开始'
            : statusFilter === 'active'
              ? '当前没有"已上架"产品,切换到"全部"看看？'
              : statusFilter === 'inactive'
                ? '当前没有"已下架"产品,切换到"全部"看看？'
                : '没有匹配搜索条件的产品'}
        </div>
      )}

      {/* Edit/Create Dialog */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={(next) => {
          if (!next) handleDialogClose();
          else setIsDialogOpen(true);
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] p-0 gap-0 flex flex-col">
          <DialogHeader className="px-6 pt-5 pb-3 border-b shrink-0">
            <DialogTitle>
              {editingProduct ? '编辑产品' : '添加产品'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 px-6 py-4 overflow-y-auto flex-1">
            {/* ===== 区块 1: 基本信息 ===== */}
            <section>
              <h3 className="text-sm font-bold text-ocean-deep mb-3 flex items-center gap-2">
                <Package className="w-4 h-4" /> 基本信息
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    产品名称 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none"
                    placeholder="例如:深海鲍鱼礼盒"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">产品分类</label>
                  <select
                    value={formData.category || CATEGORIES[0]}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">产品描述</label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none resize-none"
                    placeholder="详细描述产品特点、规格、用途..."
                  />
                </div>
              </div>
            </section>

            {/* ===== 区块 2: 封面图管理 (1-5 张) ===== */}
            <CoverImagesSection
              coverImages={formData.coverImages || []}
              canUpload={true}
              isCreating={!editingProduct}
              isUploading={uploadStatus.cover.loading}
              uploadError={uploadStatus.cover.error}
              onUpload={handleCoverUpload}
              onRemove={handleRemoveCoverServer}
              onMoveUp={(idx) => moveCover(idx, -1)}
              onMoveDown={(idx) => moveCover(idx, 1)}
            />

            {/* ===== 区块 3: 详情图管理 (0-N 张) ===== */}
            <DetailImagesSection
              detailImages={formData.detailImages || []}
              canUpload={true}
              isCreating={!editingProduct}
              isUploading={uploadStatus.detail.loading}
              uploadError={uploadStatus.detail.error}
              onUpload={handleDetailUpload}
              onRemove={handleRemoveDetailServer}
              onMoveUp={(idx) => moveDetail(idx, -1)}
              onMoveDown={(idx) => moveDetail(idx, 1)}
            />

            {/* ===== 区块 4: 规格库存 ===== */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-ocean-deep flex items-center gap-2">
                  <Package className="w-4 h-4" /> 规格 / 单价 / 库存
                  <span className="text-xs text-gray-400 font-normal">({specs.length} 种)</span>
                </h3>
                <Button type="button" onClick={addSpec} size="sm" variant="outline">
                  <Plus className="w-3 h-3 mr-1" /> 添加规格
                </Button>
              </div>

              {specs.length === 0 ? (
                <div className="text-center py-6 text-gray-400 bg-gray-50 rounded-lg text-sm">
                  暂无规格,点击右上角"添加规格"开始
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm table-fixed">
                    <colgroup>
                      {/* 显式列宽,避免"规格名称"被挤到竖排 */}
                      <col className="w-[34%]" />
                      <col className="w-[12%]" />
                      <col className="w-[18%]" />
                      <col className="w-[14%]" />
                      <col className="w-[14%]" />
                      <col className="w-[8%]" />
                    </colgroup>
                    <thead className="bg-gray-50 text-gray-600">
                      <tr>
                        <th className="px-2 py-2 text-left font-medium">规格名称 *</th>
                        <th className="px-2 py-2 text-left font-medium">单位</th>
                        <th className="px-2 py-2 text-left font-medium">单价 (¥) *</th>
                        <th className="px-2 py-2 text-left font-medium">库存 *</th>
                        <th className="px-2 py-2 text-left font-medium">起订量</th>
                        <th className="px-1 py-2 text-center font-medium">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {specs.map((spec, index) => (
                        <tr key={spec.id || index} className="hover:bg-gray-50">
                          <td className="px-2 py-1.5">
                            <input
                              type="text"
                              value={spec.name ?? ''}
                              onChange={(e) => updateSpec(index, { name: e.target.value } as any)}
                              placeholder="例如:500g装"
                              className="w-full min-w-0 px-2 py-1 text-sm border border-gray-200 rounded focus:border-ocean-blue focus:outline-none"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <input
                              type="text"
                              value={spec.unit ?? ''}
                              onChange={(e) => updateSpec(index, { unit: e.target.value } as any)}
                              placeholder="件"
                              className="w-full min-w-0 px-2 py-1 text-sm border border-gray-200 rounded focus:border-ocean-blue focus:outline-none"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            {/* 改用 uncontrolled + onBlur:受控 + number state 会让 "5." 这种中间态
                                在 React 重 render 时被 String(5) 强制覆盖,小数点消失 */}
                            <input
                              key={`price-${spec.id || index}`}
                              type="text"
                              inputMode="decimal"
                              defaultValue={spec.price === null || spec.price === undefined ? '' : String(spec.price)}
                              onBlur={(e) => {
                                const raw = e.target.value.trim();
                                const cleaned = raw.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1');
                                if (cleaned === '' || /^\d*\.?\d*$/.test(cleaned)) {
                                  const num = cleaned === '' ? null : parseFloat(cleaned);
                                  updateSpec(index, { price: num as any } as any);
                                }
                              }}
                              placeholder="0.00"
                              className="w-full min-w-0 px-2 py-1 text-sm border border-gray-200 rounded focus:border-ocean-blue focus:outline-none"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <input
                              key={`stock-${spec.id || index}`}
                              type="text"
                              inputMode="numeric"
                              defaultValue={spec.stock === null || spec.stock === undefined ? '' : String(spec.stock)}
                              onBlur={(e) => {
                                const raw = e.target.value.trim();
                                const cleaned = raw.replace(/\D/g, '');
                                const num = cleaned === '' ? null : parseInt(cleaned, 10);
                                updateSpec(index, { stock: num as any } as any);
                              }}
                              placeholder="0"
                              className="w-full min-w-0 px-2 py-1 text-sm border border-gray-200 rounded focus:border-ocean-blue focus:outline-none"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <input
                              key={`minOrder-${spec.id || index}`}
                              type="text"
                              inputMode="numeric"
                              defaultValue={spec.minOrder === null || spec.minOrder === undefined ? '' : String(spec.minOrder)}
                              onBlur={(e) => {
                                const raw = e.target.value.trim();
                                const cleaned = raw.replace(/\D/g, '');
                                const num = cleaned === '' ? null : parseInt(cleaned, 10);
                                updateSpec(index, { minOrder: num as any } as any);
                              }}
                              placeholder="1"
                              className="w-full min-w-0 px-2 py-1 text-sm border border-gray-200 rounded focus:border-ocean-blue focus:outline-none"
                            />
                          </td>
                          <td className="px-1 py-1.5 text-center">
                            <button
                              type="button"
                              onClick={() => removeSpec(index)}
                              className="text-gray-400 hover:text-red-500 inline-flex items-center justify-center w-7 h-7"
                              title="删除"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* ===== 区块 5: 产品特点 ===== */}
            <section>
              <h3 className="text-sm font-bold text-ocean-deep mb-3">产品特点</h3>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addFeature();
                    }
                  }}
                  placeholder="输入特点后回车,如:深海养殖"
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none text-sm"
                />
                <Button type="button" onClick={addFeature} variant="outline" size="sm">
                  添加
                </Button>
              </div>
              {features.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {features.map((f, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                    >
                      {f}
                      <button
                        type="button"
                        onClick={() => removeFeature(i)}
                        className="hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </section>

            {/* ===== 区块 5.5: 运费规则 ===== */}
            <section className="space-y-3">
              <div className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-800">收取运费</p>
                  <p className="text-xs text-gray-500">
                    {formData.shippingEnabled
                      ? '已开启 — 用户下单时会按规则加运费'
                      : '未开启 — 该商品包邮'}
                  </p>
                </div>
                <ToggleRow
                  checked={!!formData.shippingEnabled}
                  onChange={(v) => setFormData({ ...formData, shippingEnabled: v })}
                  onLabel="已开启"
                  offLabel="包邮"
                />
              </div>

              {formData.shippingEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 px-4 py-3 bg-orange-50 rounded-lg">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      初始运费 (¥)
                    </label>
                    <input
                      key={`shipping-initial-fee-${formData.shippingInitialFee ?? ''}`}
                      type="text"
                      inputMode="decimal"
                      defaultValue={formData.shippingInitialFee === undefined || formData.shippingInitialFee === null ? '' : String(formData.shippingInitialFee)}
                      onBlur={(e) => {
                        const raw = e.target.value.trim();
                        const cleaned = raw.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1');
                        const num = cleaned === '' ? 0 : parseFloat(cleaned);
                        if (!isNaN(num)) setFormData({ ...formData, shippingInitialFee: num });
                      }}
                      placeholder="0"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:border-ocean-blue focus:outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">第一件收的运费</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      每多少件加一次 (件)
                    </label>
                    <input
                      key={`shipping-per-unit-count-${formData.shippingPerUnitCount ?? ''}`}
                      type="text"
                      inputMode="numeric"
                      defaultValue={formData.shippingPerUnitCount === undefined || formData.shippingPerUnitCount === null ? '' : String(formData.shippingPerUnitCount)}
                      onBlur={(e) => {
                        const raw = e.target.value.trim();
                        const cleaned = raw.replace(/\D/g, '');
                        const num = cleaned === '' ? 1 : parseInt(cleaned, 10);
                        if (!isNaN(num) && num >= 1) setFormData({ ...formData, shippingPerUnitCount: num });
                      }}
                      placeholder="1"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:border-ocean-blue focus:outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">如每 5 件加一次</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      每单位加多少运费 (¥)
                    </label>
                    <input
                      key={`shipping-per-unit-fee-${formData.shippingPerUnitFee ?? ''}`}
                      type="text"
                      inputMode="decimal"
                      defaultValue={formData.shippingPerUnitFee === undefined || formData.shippingPerUnitFee === null ? '' : String(formData.shippingPerUnitFee)}
                      onBlur={(e) => {
                        const raw = e.target.value.trim();
                        const cleaned = raw.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1');
                        const num = cleaned === '' ? 0 : parseFloat(cleaned);
                        if (!isNaN(num)) setFormData({ ...formData, shippingPerUnitFee: num });
                      }}
                      placeholder="0"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:border-ocean-blue focus:outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">如每多 5 件加 ¥10</p>
                  </div>
                  <div className="md:col-span-3 text-xs text-orange-700 bg-white px-3 py-2 rounded">
                    <strong>示例：</strong>买 1 件运费 = {formData.shippingInitialFee ?? 0} 元；
                    买 6 件 = {formData.shippingInitialFee ?? 0} + ceil((6-1)/{formData.shippingPerUnitCount ?? 1}) × {formData.shippingPerUnitFee ?? 0} 元
                  </div>
                </div>
              )}
            </section>

            {/* ===== 区块 6: 显示设置 (上架/轮播 toggle) ===== */}
            <section className="space-y-3">
              {/* 上架 toggle */}
              <div className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-800">上架显示</p>
                  <p className="text-xs text-gray-500">关闭后产品不会在前台展示</p>
                </div>
                <ToggleRow
                  checked={!!formData.isActive}
                  onChange={(v) => setFormData({ ...formData, isActive: v })}
                  onLabel="已上架"
                  offLabel="已下架"
                />
              </div>

              {/* 轮播 toggle */}
              <div className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-800">封面图轮播</p>
                  <p className="text-xs text-gray-500">
                    {(formData.coverImages?.length ?? 0) >= 2
                      ? '详情页顶部会自动切换多张封面图'
                      : '需要至少 2 张封面图才能启用轮播'}
                  </p>
                </div>
                <ToggleRow
                  checked={!!formData.enableCarousel && (formData.coverImages?.length ?? 0) >= 2}
                  onChange={handleToggleCarousel}
                  disabled={(formData.coverImages?.length ?? 0) < 2}
                  onLabel="已开启"
                  offLabel="已关闭"
                />
              </div>
            </section>
          </div>

          <DialogFooter className="px-6 py-3 border-t shrink-0 bg-gray-50">
            <Button variant="outline" onClick={handleDialogClose} disabled={saving}>
              取消
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-ocean-blue hover:bg-ocean-deep"
            >
              {saving ? '保存中…' : editingProduct ? '保存修改' : '创建产品'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ==================== 复用子组件 ====================

interface ToggleRowProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  onLabel?: string;
  offLabel?: string;
  disabled?: boolean;
}

/**
 * 好看动画的 toggle 开关:
 * - 蓝色 → 灰色 时滑块有 200ms 平滑过渡
 * - 轨道颜色变化 300ms
 * - 状态文字 200ms 渐变
 */
const ToggleRow: React.FC<ToggleRowProps> = ({ checked, onChange, onLabel = '开', offLabel = '关', disabled }) => {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`text-xs font-medium transition-all duration-200 ${
          disabled
            ? 'text-gray-300'
            : checked
              ? 'text-ocean-blue'
              : 'text-gray-400'
        }`}
      >
        {checked ? onLabel : offLabel}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`
          relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full
          border-2 border-transparent transition-colors duration-300 ease-in-out
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-blue focus-visible:ring-offset-2
          disabled:cursor-not-allowed disabled:opacity-50
          ${checked ? 'bg-ocean-blue shadow-[0_0_12px_rgba(22,93,255,0.4)]' : 'bg-gray-300'}
        `}
      >
        <span
          className={`
            pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0
            transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
            ${checked ? 'translate-x-5' : 'translate-x-0'}
          `}
        />
      </button>
    </div>
  );
};

interface CoverImagesSectionProps {
  coverImages: string[];
  canUpload: boolean;
  onUpload: (file: File) => void;
  onRemove: (url: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  isCreating: boolean;
  isUploading?: boolean;
  uploadError?: string | null;
}

/**
 * 封面图管理(1-5 张)
 * - 第一张作为产品主图(列表/卡片显示)
 * - 上传/拖拽排序/删除
 * - 第一张不可上移,最后一张不可下移
 */
const CoverImagesSection: React.FC<CoverImagesSectionProps> = ({
  coverImages, canUpload, onUpload, onRemove, onMoveUp, onMoveDown, isCreating,
  isUploading, uploadError,
}) => {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('图片大小不能超过 10MB');
      return;
    }
    onUpload(file);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-ocean-deep flex items-center gap-2">
          <ImageIcon className="w-4 h-4" /> 封面图
          <span className="text-xs text-gray-400 font-normal">
            ({coverImages.length}/{MAX_COVER_IMAGES} 张,首张为主图)
          </span>
        </h3>
        {canUpload && coverImages.length < MAX_COVER_IMAGES && (
          <>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="w-3 h-3 mr-1" /> 上传封面图
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFile}
              className="hidden"
            />
          </>
        )}
      </div>

      {/* 错误提示(行业做法:错误显示在上传区附近,不弹 alert 打断用户) */}
      {uploadError && (
        <div className="mb-2 px-3 py-2 rounded-md bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2">
          <X className="w-4 h-4 shrink-0" />
          <span>上传失败:{uploadError}</span>
        </div>
      )}

      {coverImages.length === 0 ? (
        <button
          type="button"
          disabled={!canUpload || isUploading}
          onClick={() => canUpload && fileRef.current?.click()}
          className={`w-full border-2 border-dashed rounded-lg p-6 text-center bg-gray-50 transition-colors ${
            canUpload
              ? 'border-gray-300 hover:border-ocean-blue hover:bg-ocean-blue/5 cursor-pointer'
              : 'border-gray-200 cursor-not-allowed opacity-70'
          }`}
        >
          <Upload className="w-10 h-10 mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-gray-700 mb-1 font-medium">点击上传封面图</p>
          <p className="text-xs text-gray-400">
            支持 JPG/PNG/WebP,建议 800×800 以上,最多 5 张
            {isCreating && ' (新建模式,图片会即时上传到后端)'}
          </p>
        </button>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {/* 上传中的占位(行业做法:上传时立即占位,避免用户重复点) */}
          {isUploading && (
            <div className="relative aspect-square rounded-lg border-2 border-ocean-blue/30 bg-ocean-blue/5 flex flex-col items-center justify-center text-ocean-blue">
              {/* 旋转 spinner */}
              <div className="w-8 h-8 border-2 border-ocean-blue/30 border-t-ocean-blue rounded-full animate-spin mb-2" />
              <span className="text-xs">上传中…</span>
            </div>
          )}
          {coverImages.map((url, idx) => (
            <div
              key={url}
              className="relative group rounded-lg overflow-hidden border-2 border-transparent hover:border-ocean-blue transition-colors aspect-square bg-gray-100"
            >
              <ProductImage
                src={url}
                alt={`封面图 ${idx + 1}`}
                aspectRatio="1/1"
                className="w-full h-full"
                priority
              />
              {/* 主图标签 */}
              {idx === 0 && (
                <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-ocean-blue text-white text-[10px] rounded">
                  主图
                </span>
              )}
              {/* 操作按钮 */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                {idx > 0 && (
                  <button
                    type="button"
                    onClick={() => onMoveUp(idx)}
                    className="p-1.5 bg-white rounded-full text-gray-700 hover:bg-ocean-blue hover:text-white"
                    title="上移"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                )}
                {idx < coverImages.length - 1 && (
                  <button
                    type="button"
                    onClick={() => onMoveDown(idx)}
                    className="p-1.5 bg-white rounded-full text-gray-700 hover:bg-ocean-blue hover:text-white"
                    title="下移"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onRemove(url)}
                  className="p-1.5 bg-white rounded-full text-red-500 hover:bg-red-500 hover:text-white"
                  title="删除"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
          {/* 占位:还能上传几张 */}
          {canUpload && coverImages.length < MAX_COVER_IMAGES && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="aspect-square rounded-lg border-2 border-dashed border-gray-200 hover:border-ocean-blue hover:bg-ocean-blue/5 transition-colors flex flex-col items-center justify-center text-gray-400 hover:text-ocean-blue"
            >
              <Plus className="w-6 h-6 mb-1" />
              <span className="text-xs">添加封面</span>
            </button>
          )}
        </div>
      )}
    </section>
  );
};

interface DetailImagesSectionProps {
  detailImages: string[];
  canUpload: boolean;
  onUpload: (file: File) => void;
  onRemove: (url: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  isCreating: boolean;
  isUploading?: boolean;
  uploadError?: string | null;
}

/**
 * 详情图管理(0-N 张,任意数量)
 * - 详情页下拉懒加载展示
 */
const DetailImagesSection: React.FC<DetailImagesSectionProps> = ({
  detailImages, canUpload, onUpload, onRemove, onMoveUp, onMoveDown, isCreating,
  isUploading, uploadError,
}) => {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('图片大小不能超过 10MB');
      return;
    }
    onUpload(file);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-ocean-deep flex items-center gap-2">
          <ImageIcon className="w-4 h-4" /> 详情图
          <span className="text-xs text-gray-400 font-normal">
            ({detailImages.length} 张,详情页下拉时懒加载展示)
          </span>
        </h3>
        {canUpload && (
          <>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="w-3 h-3 mr-1" /> 上传详情图
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFile}
              className="hidden"
            />
          </>
        )}
      </div>

      {/* 错误提示 */}
      {uploadError && (
        <div className="mb-2 px-3 py-2 rounded-md bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2">
          <X className="w-4 h-4 shrink-0" />
          <span>上传失败:{uploadError}</span>
        </div>
      )}

      {detailImages.length === 0 ? (
        <button
          type="button"
          disabled={!canUpload || isUploading}
          onClick={() => canUpload && fileRef.current?.click()}
          className={`w-full border-2 border-dashed rounded-lg p-6 text-center bg-gray-50 transition-colors ${
            canUpload
              ? 'border-gray-300 hover:border-ocean-blue hover:bg-ocean-blue/5 cursor-pointer'
              : 'border-gray-200 cursor-not-allowed opacity-70'
          }`}
        >
          <Upload className="w-10 h-10 mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-gray-700 mb-1 font-medium">点击上传详情图</p>
          <p className="text-xs text-gray-400">
            可上传 0~N 张,详情页下拉时会按需懒加载展示
            {isCreating && ' (新建模式,图片会即时上传到后端)'}
          </p>
        </button>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {isUploading && (
            <div className="relative aspect-square rounded-lg border-2 border-ocean-blue/30 bg-ocean-blue/5 flex flex-col items-center justify-center text-ocean-blue">
              <div className="w-8 h-8 border-2 border-ocean-blue/30 border-t-ocean-blue rounded-full animate-spin mb-2" />
              <span className="text-xs">上传中…</span>
            </div>
          )}
          {detailImages.map((url, idx) => (
            <div
              key={url}
              className="relative group rounded-lg overflow-hidden border-2 border-transparent hover:border-ocean-blue transition-colors aspect-square bg-gray-100"
            >
              <ProductImage
                src={url}
                alt={`详情图 ${idx + 1}`}
                aspectRatio="1/1"
                className="w-full h-full"
              />
              <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/60 text-white text-[10px] rounded">
                {idx + 1}
              </div>
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                {idx > 0 && (
                  <button
                    type="button"
                    onClick={() => onMoveUp(idx)}
                    className="p-1.5 bg-white rounded-full text-gray-700 hover:bg-ocean-blue hover:text-white"
                    title="上移"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                )}
                {idx < detailImages.length - 1 && (
                  <button
                    type="button"
                    onClick={() => onMoveDown(idx)}
                    className="p-1.5 bg-white rounded-full text-gray-700 hover:bg-ocean-blue hover:text-white"
                    title="下移"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onRemove(url)}
                  className="p-1.5 bg-white rounded-full text-red-500 hover:bg-red-500 hover:text-white"
                  title="删除"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="aspect-square rounded-lg border-2 border-dashed border-gray-200 hover:border-ocean-blue hover:bg-ocean-blue/5 transition-colors flex flex-col items-center justify-center text-gray-400 hover:text-ocean-blue"
          >
            <Plus className="w-6 h-6 mb-1" />
            <span className="text-xs">添加详情</span>
          </button>
        </div>
      )}
    </section>
  );
};

export default AdminProducts;
