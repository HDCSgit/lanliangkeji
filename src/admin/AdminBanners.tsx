import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, ArrowUp, ArrowDown } from 'lucide-react';
import { DataStore } from '@/data/store';
import type { Banner } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const AdminBanners: React.FC = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [formData, setFormData] = useState<Partial<Banner>>({
    title: '',
    subtitle: '',
    description: '',
    image: '',
    buttonText: '了解更多',
    link: '',
    isActive: true,
  });

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = () => {
    const loaded = DataStore.getBanners().sort((a, b) => a.order - b.order);
    setBanners(loaded);
  };

  const handleSave = () => {
    if (editingBanner) {
      // Update existing
      const updated = banners.map((b) =>
        b.id === editingBanner.id ? { ...b, ...formData } as Banner : b
      );
      DataStore.setBanners(updated);
    } else {
      // Create new
      const { id: _, ...formDataWithoutId } = formData as Banner;
      const newBanner: Banner = {
        id: Date.now().toString(),
        ...formDataWithoutId,
        order: banners.length + 1,
      };
      DataStore.setBanners([...banners, newBanner]);
    }
    loadBanners();
    setIsDialogOpen(false);
    setEditingBanner(null);
    setFormData({
      title: '',
      subtitle: '',
      description: '',
      image: '',
      buttonText: '了解更多',
      link: '',
      isActive: true,
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这个轮播图吗？')) {
      const updated = banners.filter((b) => b.id !== id);
      DataStore.setBanners(updated);
      loadBanners();
    }
  };

  const handleToggleActive = (id: string) => {
    const updated = banners.map((b) =>
      b.id === id ? { ...b, isActive: !b.isActive } : b
    );
    DataStore.setBanners(updated);
    loadBanners();
  };

  const handleMove = (id: string, direction: 'up' | 'down') => {
    const index = banners.findIndex((b) => b.id === id);
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === banners.length - 1)
    ) {
      return;
    }

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...banners];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    
    // Update order
    updated.forEach((b, i) => {
      b.order = i + 1;
    });
    
    DataStore.setBanners(updated);
    loadBanners();
  };

  const openEditDialog = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({ ...banner });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingBanner(null);
    setFormData({
      title: '',
      subtitle: '',
      description: '',
      image: '',
      buttonText: '了解更多',
      link: '',
      isActive: true,
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ocean-deep">轮播图管理</h1>
          <p className="text-gray-500">管理首页轮播图内容</p>
        </div>
        <Button
          onClick={openCreateDialog}
          className="bg-ocean-blue hover:bg-ocean-deep"
        >
          <Plus className="w-4 h-4 mr-2" />
          添加轮播图
        </Button>
      </div>

      {/* Banners List */}
      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">排序</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">图片</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">标题</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">状态</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {banners.map((banner, index) => (
                <tr key={banner.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleMove(banner.id, 'up')}
                        disabled={index === 0}
                        className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleMove(banner.id, 'down')}
                        disabled={index === banners.length - 1}
                        className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <img
                      src={banner.image}
                      alt={banner.title}
                      className="w-20 h-12 object-cover rounded-lg"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-ocean-deep">{banner.title}</p>
                      <p className="text-sm text-gray-500">{banner.subtitle}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleActive(banner.id)}
                      className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                        banner.isActive
                          ? 'bg-green-100 text-green-600'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {banner.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      {banner.isActive ? '显示' : '隐藏'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditDialog(banner)}
                        className="p-2 hover:bg-ocean-blue/10 text-ocean-blue rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(banner.id)}
                        className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {banners.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            暂无轮播图，点击上方按钮添加
          </div>
        )}
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingBanner ? '编辑轮播图' : '添加轮播图'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">标题</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none"
                placeholder="输入轮播图标题"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">副标题</label>
              <input
                type="text"
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none"
                placeholder="输入副标题"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none resize-none"
                placeholder="输入描述文字"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">图片URL</label>
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">按钮文字</label>
                <input
                  type="text"
                  value={formData.buttonText}
                  onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none"
                  placeholder="了解更多"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">链接</label>
                <input
                  type="text"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none"
                  placeholder="/about"
                />
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
              {editingBanner ? '保存' : '创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBanners;
