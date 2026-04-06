import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, Search } from 'lucide-react';
import { DataStore } from '@/data/store';
import type { Product } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    category: '海洋生物制品',
    description: '',
    image: '',
    specs: [],
    features: [],
    isActive: true,
  });
  const [specInput, setSpecInput] = useState({ name: '', value: '' });
  const [featureInput, setFeatureInput] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    let filtered = products;
    if (searchQuery) {
      filtered = products.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredProducts(filtered);
  }, [searchQuery, products]);

  const loadProducts = () => {
    const loaded = DataStore.getProducts().sort((a, b) => a.order - b.order);
    setProducts(loaded);
    setFilteredProducts(loaded);
  };

  const handleSave = () => {
    if (editingProduct) {
      const updated = products.map((p) =>
        p.id === editingProduct.id ? { ...p, ...formData } as Product : p
      );
      DataStore.setProducts(updated);
    } else {
      const { id: _, ...formDataWithoutId } = formData as Product;
      const newProduct: Product = {
        id: Date.now().toString(),
        ...formDataWithoutId,
        order: products.length + 1,
        createdAt: new Date().toISOString().split('T')[0],
      };
      DataStore.setProducts([...products, newProduct]);
    }
    loadProducts();
    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这个产品吗？')) {
      const updated = products.filter((p) => p.id !== id);
      DataStore.setProducts(updated);
      loadProducts();
    }
  };

  const handleToggleActive = (id: string) => {
    const updated = products.map((p) =>
      p.id === id ? { ...p, isActive: !p.isActive } : p
    );
    DataStore.setProducts(updated);
    loadProducts();
  };

  const addSpec = () => {
    if (specInput.name && specInput.value) {
      setFormData({
        ...formData,
        specs: [...(formData.specs || []), { ...specInput }],
      });
      setSpecInput({ name: '', value: '' });
    }
  };

  const removeSpec = (index: number) => {
    setFormData({
      ...formData,
      specs: formData.specs?.filter((_, i) => i !== index),
    });
  };

  const addFeature = () => {
    if (featureInput) {
      setFormData({
        ...formData,
        features: [...(formData.features || []), featureInput],
      });
      setFeatureInput('');
    }
  };

  const removeFeature = (index: number) => {
    setFormData({
      ...formData,
      features: formData.features?.filter((_, i) => i !== index),
    });
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      category: '海洋生物制品',
      description: '',
      image: '',
      specs: [],
      features: [],
      isActive: true,
    });
    setSpecInput({ name: '', value: '' });
    setFeatureInput('');
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setFormData({ ...product });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const categories = ['海洋生物制品', '水产深加工', '健康食材', '原料供应'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ocean-deep">产品管理</h1>
          <p className="text-gray-500">管理产品信息和展示</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索产品..."
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none"
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
            <div className="relative h-40 overflow-hidden">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute top-2 right-2 flex gap-1">
                <button
                  onClick={() => handleToggleActive(product.id)}
                  className={`p-2 rounded-lg ${
                    product.isActive ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
                  }`}
                >
                  {product.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="p-4">
              <span className="text-xs text-ocean-blue bg-ocean-blue/10 px-2 py-1 rounded-full">
                {product.category}
              </span>
              <h3 className="font-bold text-ocean-deep mt-2 mb-1">{product.name}</h3>
              <p className="text-sm text-gray-500 line-clamp-2">{product.description}</p>
              <div className="flex items-center justify-end gap-2 mt-4">
                <button
                  onClick={() => openEditDialog(product)}
                  className="p-2 hover:bg-ocean-blue/10 text-ocean-blue rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(product.id)}
                  className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          暂无产品，点击上方按钮添加
        </div>
      )}

      {/* Edit/Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? '编辑产品' : '添加产品'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">产品名称</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none"
                placeholder="输入产品名称"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">产品分类</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">产品描述</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none resize-none"
                placeholder="输入产品描述"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">产品图片</label>
              <input
                type="text"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none"
                placeholder="输入图片URL"
              />
              {formData.image && (
                <img
                  src={formData.image}
                  alt="Preview"
                  className="mt-2 w-full h-32 object-cover rounded-lg"
                />
              )}
            </div>

            {/* Specs */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">产品规格</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={specInput.name}
                  onChange={(e) => setSpecInput({ ...specInput, name: e.target.value })}
                  placeholder="规格名称"
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none"
                />
                <input
                  type="text"
                  value={specInput.value}
                  onChange={(e) => setSpecInput({ ...specInput, value: e.target.value })}
                  placeholder="规格值"
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none"
                />
                <Button type="button" onClick={addSpec} variant="outline">
                  添加
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.specs?.map((spec, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-ocean-blue/10 text-ocean-blue rounded-full text-sm"
                  >
                    {spec.name}: {spec.value}
                    <button onClick={() => removeSpec(index)} className="hover:text-red-500">
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Features */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">产品特点</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  placeholder="输入特点"
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none"
                />
                <Button type="button" onClick={addFeature} variant="outline">
                  添加
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.features?.map((feature, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm"
                  >
                    {feature}
                    <button onClick={() => removeFeature(index)} className="hover:text-red-500">
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-ocean-blue rounded focus:ring-ocean-blue"
              />
              <label htmlFor="isActive" className="text-sm text-gray-700">
                立即显示
              </label>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave} className="bg-ocean-blue hover:bg-ocean-deep">
              {editingProduct ? '保存' : '创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProducts;
