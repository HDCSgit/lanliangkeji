import React, { useState, useEffect, useRef } from 'react';
import {
  Plus, Edit2, Trash2, Eye, EyeOff, Search,
  ImageIcon, X, Package
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

const CATEGORIES = ['海洋生物制品', '水产深加工', '健康食材', '原料供应'];

const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // 基础字段
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    category: CATEGORIES[0],
    description: '',
    image: '',
    isActive: true,
  });

  // 规格(表格化)
  const [specs, setSpecs] = useState<ProductSpec[]>([]);

  // 产品特点
  const [features, setFeatures] = useState<string[]>([]);
  const [featureInput, setFeatureInput] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

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
    });
    setSpecs([]);
    setFeatures([]);
    setFeatureInput('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      description: product.description,
      image: product.image,
      isActive: product.isActive,
    });
    setSpecs(product.specs || []);
    setFeatures(product.features || []);
    setFeatureInput('');
    if (fileInputRef.current) fileInputRef.current.value = '';
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
        price: 0,
        stock: 0,
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

  // ---- 图片上传 ----
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
    if (!editingProduct) {
      // 新建模式:先转 base64 显示,等创建后真正保存图片(创建后拿到 productId 再上传)
      const reader = new FileReader();
      reader.onload = (ev) => {
        setFormData((prev) => ({ ...prev, image: ev.target?.result as string }));
      };
      reader.readAsDataURL(file);
      return;
    }
    // 编辑模式:直接上传
    await uploadImageNow(file, editingProduct.id);
  };

  const uploadImageNow = async (file: File, productId: string) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const resp = await fetch(`/api/v1/products/${productId}/image`, {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('lanliang_access_token') || ''}`,
        },
      });
      const json = await resp.json();
      if (!json.success) {
        alert('图片上传失败: ' + (json.error || json.detail || json.message || '未知错误'));
        return;
      }
      const newPath = json.data?.image || json.data?.product?.image;
      if (newPath) {
        setFormData((prev) => ({ ...prev, image: newPath }));
      }
      await loadProducts();
    } catch (err: any) {
      alert('图片上传失败: ' + (err?.message || err));
    } finally {
      setUploading(false);
    }
  };

  // ---- 保存 ----
  const handleSave = async () => {
    if (!formData.name?.trim()) {
      alert('请输入产品名称');
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
        specs,
        features,
      };
      if (editingProduct) {
        const updated = products.map((p) =>
          p.id === editingProduct.id ? { ...p, ...payload, id: editingProduct.id } as Product : p,
        );
        await DataStore.setProducts(updated);
      } else {
        // 新建:ID 由后端生成,但当前是 localStorage 模式
        const newProduct: Product = {
          id: `p-${Date.now()}`,
          name: formData.name!,
          category: formData.category || CATEGORIES[0],
          description: formData.description || '',
          image: formData.image || '',
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
    await DataStore.setProducts(updated);
    await loadProducts();
  };

  const handleToggleActive = async (id: string) => {
    const updated = products.map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p));
    await DataStore.setProducts(updated);
    await loadProducts();
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
          <p className="text-gray-500">管理产品信息、规格、图片、库存</p>
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
            <div className="relative h-40 overflow-hidden bg-gray-100">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <ImageIcon className="w-12 h-12" />
                </div>
              )}
              <div className="absolute top-2 right-2 flex gap-1">
                <button
                  onClick={() => handleToggleActive(product.id)}
                  className={`p-2 rounded-lg ${
                    product.isActive ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
                  }`}
                  title={product.isActive ? '已上架' : '已下架'}
                >
                  {product.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="p-4">
              <span className="text-xs text-ocean-blue bg-ocean-blue/10 px-2 py-1 rounded-full">
                {product.category}
              </span>
              <h3 className="font-bold text-ocean-deep mt-2 mb-1 line-clamp-1">{product.name}</h3>
              <p className="text-sm text-gray-500 line-clamp-2 mb-2 h-10">{product.description}</p>
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

            {/* ===== 区块 2: 产品图片 ===== */}
            <section>
              <h3 className="text-sm font-bold text-ocean-deep mb-3 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" /> 产品图片
              </h3>
              <div className="flex gap-4 items-start">
                <div className="w-40 h-40 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center overflow-hidden bg-gray-50 shrink-0">
                  {formData.image ? (
                    <img
                      src={formData.image}
                      alt="预览"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="text-center text-gray-400 text-sm">
                      <ImageIcon className="w-8 h-8 mx-auto mb-1" />
                      暂无图片
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={uploading}
                    className="block w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-ocean-blue file:text-white hover:file:bg-ocean-deep cursor-pointer"
                  />
                  <p className="text-xs text-gray-400">
                    支持 JPG / PNG / WebP,最大 10MB。
                    {editingProduct
                      ? '新图片会立即上传并替换现有图片。'
                      : '新建产品时,图片先预览,创建产品后会自动同步保存。'}
                  </p>
                  {uploading && (
                    <p className="text-xs text-ocean-blue">上传中…</p>
                  )}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">或直接填写图片URL</label>
                    <input
                      type="text"
                      value={formData.image?.startsWith('data:') ? '' : formData.image || ''}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none"
                      placeholder="/uploads/products/xxx.png 或 https://..."
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* ===== 区块 3: 规格库存 ===== */}
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
                              value={spec.name}
                              onChange={(e) => updateSpec(index, { name: e.target.value })}
                              placeholder="例如:500g装"
                              className="w-full px-2 py-1 border border-gray-200 rounded focus:border-ocean-blue focus:outline-none"
                            />
                          </td>
                          <td className="px-3 py-1.5">
                            <input
                              type="text"
                              value={spec.unit}
                              onChange={(e) => updateSpec(index, { unit: e.target.value })}
                              placeholder="件/盒/kg"
                              className="w-20 px-2 py-1 border border-gray-200 rounded focus:border-ocean-blue focus:outline-none"
                            />
                          </td>
                          <td className="px-3 py-1.5">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={spec.price}
                              onChange={(e) => updateSpec(index, { price: Number(e.target.value) || 0 })}
                              placeholder="0.00"
                              className="w-24 px-2 py-1 border border-gray-200 rounded focus:border-ocean-blue focus:outline-none"
                            />
                          </td>
                          <td className="px-3 py-1.5">
                            <input
                              type="number"
                              min="0"
                              value={spec.stock}
                              onChange={(e) => updateSpec(index, { stock: Number(e.target.value) || 0 })}
                              placeholder="0"
                              className="w-20 px-2 py-1 border border-gray-200 rounded focus:border-ocean-blue focus:outline-none"
                            />
                          </td>
                          <td className="px-3 py-1.5">
                            <input
                              type="number"
                              min="1"
                              value={spec.minOrder}
                              onChange={(e) => updateSpec(index, { minOrder: Number(e.target.value) || 1 })}
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

            {/* ===== 区块 4: 产品特点 ===== */}
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

            {/* ===== 区块 5: 显示设置 ===== */}
            <section className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-800">上架显示</p>
                <p className="text-xs text-gray-500">关闭后产品不会在前台展示</p>
              </div>
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive ?? true}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="relative w-11 h-6 bg-gray-200 peer-checked:bg-ocean-blue rounded-full transition-colors">
                  <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
                </div>
              </label>
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

export default AdminProducts;
