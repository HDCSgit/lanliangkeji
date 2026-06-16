import React, { useState, useEffect, useRef } from 'react';
import {
  Plus, Edit2, Trash2, Eye, EyeOff, Search,
  ImageIcon, X, Package, Upload, GripVertical, ChevronUp, ChevronDown
} from 'lucide-react';
import { DataStore } from '@/data/store';
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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);

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
  });

  // 规格
  const [specs, setSpecs] = useState<ProductSpec[]>([]);

  // 产品特点
  const [features, setFeatures] = useState<string[]>([]);
  const [featureInput, setFeatureInput] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    const q = searchQuery.toLowerCase();
    setFilteredProducts(
      q
        ? products.filter(
            (p) =>
              p.name.toLowerCase().includes(q) ||
              p.category.toLowerCase().includes(q),
          )
        : products,
    );
  }, [searchQuery, products]);

  const loadProducts = async () => {
    const loaded = (await DataStore.getProducts()).sort((a, b) => a.order - b.order);
    setProducts(loaded);
    setFilteredProducts(loaded);
  };

  const resetForm = () => {
    setEditingProduct(null);
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
  };

  const openEditDialog = (product: Product) => {
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
    });
    setSpecs(product.specs || []);
    setFeatures(product.features || []);
    setFeatureInput('');
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
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
  const removeCover = (index: number) => {
    setFormData((prev) => {
      const arr = [...(prev.coverImages || [])];
      arr.splice(index, 1);
      // 删除后,如果 ≤1 张,强制不轮播
      const enableCarousel = (prev.enableCarousel ?? false) && arr.length >= 2;
      return { ...prev, coverImages: arr, enableCarousel };
    });
  };

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
  const removeDetail = (index: number) => {
    setFormData((prev) => {
      const arr = [...(prev.detailImages || [])];
      arr.splice(index, 1);
      return { ...prev, detailImages: arr };
    });
  };

  // ---- 图片上传 ----
  const handleCoverUpload = async (file: File) => {
    if (!editingProduct) {
      alert('请先保存产品基本信息,创建产品后再上传封面图');
      return;
    }
    try {
      const position = (formData.coverImages?.length ?? 0);
      const r = await DataStore.uploadProductImage(editingProduct.id, file, 'cover', position);
      // 同步本地 form 状态
      setFormData((prev) => ({
        ...prev,
        coverImages: r.coverImages,
        image: r.coverImages[0] || prev.image,
        enableCarousel: (prev.enableCarousel ?? false) && r.coverImages.length >= 2 ? prev.enableCarousel : (r.coverImages.length >= 2 ? prev.enableCarousel : false),
      }));
      await loadProducts();
    } catch (e: any) {
      alert('封面图上传失败: ' + (e?.message || e));
    }
  };

  const handleDetailUpload = async (file: File) => {
    if (!editingProduct) {
      alert('请先保存产品基本信息,创建产品后再上传详情图');
      return;
    }
    try {
      const r = await DataStore.uploadProductImage(editingProduct.id, file, 'detail');
      setFormData((prev) => ({
        ...prev,
        detailImages: r.detailImages,
      }));
      await loadProducts();
    } catch (e: any) {
      alert('详情图上传失败: ' + (e?.message || e));
    }
  };

  const handleRemoveCoverServer = async (url: string) => {
    if (!editingProduct) {
      // 本地态(还没保存),直接本地删
      const idx = (formData.coverImages || []).indexOf(url);
      if (idx >= 0) removeCover(idx);
      return;
    }
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
    if (!editingProduct) {
      const idx = (formData.detailImages || []).indexOf(url);
      if (idx >= 0) removeDetail(idx);
      return;
    }
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
    if (!formData.name?.trim()) {
      alert('请输入产品名称');
      return;
    }
    if ((formData.coverImages?.length ?? 0) === 0) {
      alert('请至少上传 1 张封面图');
      return;
    }
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
      const payload = {
        ...formData,
        image: formData.coverImages?.[0] ?? formData.image ?? '',
        specs,
        features,
      };
      if (editingProduct) {
        const updated = products.map((p) =>
          p.id === editingProduct.id ? { ...p, ...payload, id: editingProduct.id } as Product : p,
        );
        await DataStore.setProducts(updated);
      } else {
        const newProduct: Product = {
          id: `p-${Date.now()}`,
          name: formData.name!,
          category: formData.category || CATEGORIES[0],
          description: formData.description || '',
          image: formData.coverImages?.[0] ?? '',
          coverImages: formData.coverImages || [],
          detailImages: formData.detailImages || [],
          enableCarousel: !!(formData.enableCarousel && (formData.coverImages?.length ?? 0) >= 2),
          specs,
          features,
          isActive: formData.isActive ?? true,
          order: products.length + 1,
          createdAt: new Date().toISOString().split('T')[0],
        } as Product;
        await DataStore.setProducts([...products, newProduct]);
      }
      await loadProducts();
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
    const updated = products.filter((p) => p.id !== id);
    try {
      await DataStore.setProducts(updated);
      await loadProducts();
    } catch (e: any) {
      alert('删除失败: ' + (e?.message || e));
    }
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
          暂无产品,点击右上角"添加产品"开始
        </div>
      )}

      {/* Edit/Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? '编辑产品' : '添加产品'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 mt-4">
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
              canUpload={!!editingProduct}
              onUpload={handleCoverUpload}
              onRemove={handleRemoveCoverServer}
              onMoveUp={(idx) => moveCover(idx, -1)}
              onMoveDown={(idx) => moveCover(idx, 1)}
            />

            {/* ===== 区块 3: 详情图管理 (0-N 张) ===== */}
            <DetailImagesSection
              detailImages={formData.detailImages || []}
              canUpload={!!editingProduct}
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
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">规格名称 *</th>
                        <th className="px-3 py-2 text-left font-medium">单位</th>
                        <th className="px-3 py-2 text-left font-medium">单价 (¥) *</th>
                        <th className="px-3 py-2 text-left font-medium">库存 *</th>
                        <th className="px-3 py-2 text-left font-medium">起订量</th>
                        <th className="px-3 py-2 text-center font-medium w-16">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {specs.map((spec, index) => (
                        <tr key={spec.id || index} className="hover:bg-gray-50">
                          <td className="px-3 py-1.5">
                            <input
                              type="text"
                              value={spec.name ?? ''}
                              onChange={(e) => updateSpec(index, { name: e.target.value } as any)}
                              placeholder="例如:500g装"
                              className="w-full px-2 py-1 border border-gray-200 rounded focus:border-ocean-blue focus:outline-none"
                            />
                          </td>
                          <td className="px-3 py-1.5">
                            <input
                              type="text"
                              value={spec.unit ?? ''}
                              onChange={(e) => updateSpec(index, { unit: e.target.value } as any)}
                              placeholder="件/盒/kg"
                              className="w-20 px-2 py-1 border border-gray-200 rounded focus:border-ocean-blue focus:outline-none"
                            />
                          </td>
                          <td className="px-3 py-1.5">
                            <input
                              type="text"
                              inputMode="decimal"
                              value={spec.price === null || spec.price === undefined ? '' : String(spec.price)}
                              onChange={(e) => {
                                const v = e.target.value;
                                if (v === '' || /^\d*\.?\d*$/.test(v)) {
                                  updateSpec(index, { price: v === '' ? null : (parseFloat(v) as any) } as any);
                                }
                              }}
                              placeholder="0.00"
                              className="w-24 px-2 py-1 border border-gray-200 rounded focus:border-ocean-blue focus:outline-none"
                            />
                          </td>
                          <td className="px-3 py-1.5">
                            <input
                              type="text"
                              inputMode="numeric"
                              value={spec.stock === null || spec.stock === undefined ? '' : String(spec.stock)}
                              onChange={(e) => {
                                const v = e.target.value;
                                if (v === '' || /^\d*$/.test(v)) {
                                  updateSpec(index, { stock: v === '' ? null : (parseInt(v, 10) as any) } as any);
                                }
                              }}
                              placeholder="0"
                              className="w-20 px-2 py-1 border border-gray-200 rounded focus:border-ocean-blue focus:outline-none"
                            />
                          </td>
                          <td className="px-3 py-1.5">
                            <input
                              type="text"
                              inputMode="numeric"
                              value={spec.minOrder === null || spec.minOrder === undefined ? '' : String(spec.minOrder)}
                              onChange={(e) => {
                                const v = e.target.value;
                                if (v === '' || /^\d*$/.test(v)) {
                                  updateSpec(index, { minOrder: v === '' ? null : (parseInt(v, 10) as any) } as any);
                                }
                              }}
                              placeholder="1"
                              className="w-16 px-2 py-1 border border-gray-200 rounded focus:border-ocean-blue focus:outline-none"
                            />
                          </td>
                          <td className="px-3 py-1.5 text-center">
                            <button
                              type="button"
                              onClick={() => removeSpec(index)}
                              className="text-gray-400 hover:text-red-500"
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

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={saving}>
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
}

/**
 * 封面图管理(1-5 张)
 * - 第一张作为产品主图(列表/卡片显示)
 * - 上传/拖拽排序/删除
 * - 第一张不可上移,最后一张不可下移
 */
const CoverImagesSection: React.FC<CoverImagesSectionProps> = ({
  coverImages, canUpload, onUpload, onRemove, onMoveUp, onMoveDown,
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

      {coverImages.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center bg-gray-50">
          <ImageIcon className="w-10 h-10 mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-gray-500 mb-2">
            至少上传 1 张封面图(建议 800×800 以上)
          </p>
          {!canUpload && (
            <p className="text-xs text-gray-400">
              请先创建并保存产品基本信息,再回来上传封面图
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
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
}

/**
 * 详情图管理(0-N 张,任意数量)
 * - 详情页下拉懒加载展示
 */
const DetailImagesSection: React.FC<DetailImagesSectionProps> = ({
  detailImages, canUpload, onUpload, onRemove, onMoveUp, onMoveDown,
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

      {detailImages.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center bg-gray-50">
          <ImageIcon className="w-10 h-10 mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-gray-500 mb-2">
            暂无详情图(可选,详情页下拉时会按需加载展示)
          </p>
          {!canUpload && (
            <p className="text-xs text-gray-400">
              请先创建并保存产品基本信息,再回来上传详情图
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
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
