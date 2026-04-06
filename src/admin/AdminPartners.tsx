import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, Search, ExternalLink } from 'lucide-react';
import { DataStore } from '@/data/store';
import type { Partner } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const AdminPartners: React.FC = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [filteredPartners, setFilteredPartners] = useState<Partner[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [formData, setFormData] = useState<Partial<Partner>>({
    name: '',
    logo: '',
    website: '',
    description: '',
    isActive: true,
  });

  useEffect(() => {
    loadPartners();
  }, []);

  useEffect(() => {
    let filtered = partners;
    if (searchQuery) {
      filtered = partners.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredPartners(filtered);
  }, [searchQuery, partners]);

  const loadPartners = () => {
    const loaded = DataStore.getPartners().sort((a, b) => a.order - b.order);
    setPartners(loaded);
    setFilteredPartners(loaded);
  };

  const handleSave = () => {
    if (editingPartner) {
      const updated = partners.map((p) =>
        p.id === editingPartner.id ? { ...p, ...formData } as Partner : p
      );
      DataStore.setPartners(updated);
    } else {
      const { id: _, ...formDataWithoutId } = formData as Partner;
      const newPartner: Partner = {
        id: Date.now().toString(),
        ...formDataWithoutId,
        order: partners.length + 1,
      };
      DataStore.setPartners([...partners, newPartner]);
    }
    loadPartners();
    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这个合作伙伴吗？')) {
      const updated = partners.filter((p) => p.id !== id);
      DataStore.setPartners(updated);
      loadPartners();
    }
  };

  const handleToggleActive = (id: string) => {
    const updated = partners.map((p) =>
      p.id === id ? { ...p, isActive: !p.isActive } : p
    );
    DataStore.setPartners(updated);
    loadPartners();
  };

  const resetForm = () => {
    setEditingPartner(null);
    setFormData({
      name: '',
      logo: '',
      website: '',
      description: '',
      isActive: true,
    });
  };

  const openEditDialog = (partner: Partner) => {
    setEditingPartner(partner);
    setFormData({ ...partner });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ocean-deep">合作伙伴管理</h1>
          <p className="text-gray-500">管理合作伙伴信息</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索合作伙伴..."
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none"
            />
          </div>
          <Button onClick={openCreateDialog} className="bg-ocean-blue hover:bg-ocean-deep">
            <Plus className="w-4 h-4 mr-2" />
            添加合作伙伴
          </Button>
        </div>
      </div>

      {/* Partners Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredPartners.map((partner) => (
          <div key={partner.id} className="bg-white rounded-2xl shadow-card overflow-hidden group">
            <div className="relative h-32 bg-gray-50 flex items-center justify-center p-4">
              <img
                src={partner.logo}
                alt={partner.name}
                className="max-w-full max-h-full object-contain"
              />
              <div className="absolute top-2 right-2 flex gap-1">
                <button
                  onClick={() => handleToggleActive(partner.id)}
                  className={`p-2 rounded-lg ${
                    partner.isActive ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
                  }`}
                >
                  {partner.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-ocean-deep mb-1">{partner.name}</h3>
              {partner.description && (
                <p className="text-sm text-gray-500 line-clamp-2 mb-3">{partner.description}</p>
              )}
              <div className="flex items-center justify-between">
                {partner.website ? (
                  <a
                    href={partner.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-ocean-blue text-sm flex items-center gap-1 hover:underline"
                  >
                    访问网站
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span />
                )}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditDialog(partner)}
                    className="p-2 hover:bg-ocean-blue/10 text-ocean-blue rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(partner.id)}
                    className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredPartners.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          暂无合作伙伴，点击上方按钮添加
        </div>
      )}

      {/* Edit/Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPartner ? '编辑合作伙伴' : '添加合作伙伴'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">名称</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none"
                placeholder="输入合作伙伴名称"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Logo</label>
              <input
                type="text"
                value={formData.logo}
                onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none"
                placeholder="输入Logo URL"
              />
              {formData.logo && (
                <div className="mt-2 h-24 bg-gray-50 rounded-lg flex items-center justify-center p-4">
                  <img
                    src={formData.logo}
                    alt="Preview"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">网站</label>
              <input
                type="text"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none"
                placeholder="https://example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none resize-none"
                placeholder="输入合作伙伴描述"
              />
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
              {editingPartner ? '保存' : '创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPartners;
