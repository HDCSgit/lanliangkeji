import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, Search, Upload, Loader2 } from 'lucide-react';
import { DataStore } from '@/data/store';
import type { News } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const AdminNews: React.FC = () => {
  const [news, setNews] = useState<News[]>([]);
  const [filteredNews, setFilteredNews] = useState<News[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<News | null>(null);
  const [formData, setFormData] = useState<Partial<News>>({
    title: '',
    summary: '',
    content: '',
    image: '',
    category: '公司新闻',
    author: 'admin',
    isActive: true,
  });

  useEffect(() => {
    loadNews();
  }, []);

  useEffect(() => {
    let filtered = news;
    if (searchQuery) {
      filtered = news.filter(
        (n) =>
          n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          n.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredNews(filtered);
  }, [searchQuery, news]);

  const loadNews = async () => {
    const loaded = (await DataStore.getNews()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    setNews(loaded);
    setFilteredNews(loaded);
  };

  // 上传封面图(暂存)
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverFileRef = useRef<HTMLInputElement>(null);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const url = await DataStore.uploadFile(file, 'news');
      setFormData((prev) => ({ ...prev, image: url }));
    } catch (err: any) {
      alert('封面上传失败: ' + (err?.message || err));
    } finally {
      setUploadingCover(false);
      if (coverFileRef.current) coverFileRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!formData.title?.trim()) {
      alert('请输入新闻标题');
      return;
    }
    if (!formData.content?.trim()) {
      alert('请输入正文内容');
      return;
    }
    try {
      if (editingNews) {
        // 更新现有
        await DataStore.updateNews(editingNews.id, formData);
      } else {
        // 新建(id/views/createdAt 由后端生成)
        await DataStore.createNews({
          ...formData,
          views: formData.views ?? 0,
        } as Partial<News>);
      }
      await loadNews();
      setIsDialogOpen(false);
      resetForm();
    } catch (err: any) {
      alert('保存失败: ' + (err?.message || err));
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这条新闻吗？')) {
      try {
        await DataStore.deleteNews(id);
        await loadNews();
      } catch (err: any) {
        alert('删除失败: ' + (err?.message || err));
      }
    }
  };

  const handleToggleActive = async (id: string) => {
    const item = news.find((n) => n.id === id);
    if (!item) return;
    try {
      await DataStore.updateNews(id, { isActive: !item.isActive });
      await loadNews();
    } catch (err: any) {
      alert('操作失败: ' + (err?.message || err));
    }
  };

  const resetForm = () => {
    setEditingNews(null);
    setFormData({
      title: '',
      summary: '',
      content: '',
      image: '',
      category: '公司新闻',
      author: 'admin',
      isActive: true,
    });
  };

  const openEditDialog = (item: News) => {
    setEditingNews(item);
    setFormData({ ...item });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const categories = ['公司新闻', '公司动态', '合作新闻', '行业展会', '资质认证', '产品发布'];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ocean-deep">新闻管理</h1>
          <p className="text-gray-500">管理新闻资讯内容</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索新闻..."
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none"
            />
          </div>
          <Button onClick={openCreateDialog} className="bg-ocean-blue hover:bg-ocean-deep">
            <Plus className="w-4 h-4 mr-2" />
            发布新闻
          </Button>
        </div>
      </div>

      {/* News List */}
      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">图片</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">标题</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">分类</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">日期</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">浏览</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">状态</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredNews.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-16 h-12 object-cover rounded-lg"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-ocean-deep max-w-xs truncate">{item.title}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-ocean-blue/10 text-ocean-blue text-xs rounded-full">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDate(item.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{item.views}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleActive(item.id)}
                      className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                        item.isActive
                          ? 'bg-green-100 text-green-600'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {item.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      {item.isActive ? '显示' : '隐藏'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditDialog(item)}
                        className="p-2 hover:bg-ocean-blue/10 text-ocean-blue rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
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
        {filteredNews.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            暂无新闻，点击上方按钮添加
          </div>
        )}
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingNews ? '编辑新闻' : '发布新闻'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">新闻标题</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none"
                placeholder="输入新闻标题"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">作者</label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none"
                  placeholder="作者名称"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">摘要</label>
              <textarea
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                rows={2}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none resize-none"
                placeholder="输入新闻摘要"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">正文内容</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={8}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none resize-none"
                placeholder="输入新闻正文内容"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">封面图片</label>
              <div className="flex items-center gap-2">
                <input
                  ref={coverFileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  disabled={uploadingCover}
                  className="hidden"
                  id="news-cover-input"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploadingCover}
                  onClick={() => coverFileRef.current?.click()}
                >
                  {uploadingCover ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  {uploadingCover ? '上传中…' : '选择图片'}
                </Button>
                <span className="text-xs text-gray-500">
                  支持 jpg/png/webp,自动压缩
                </span>
              </div>
              {formData.image && (
                <div className="mt-2 relative">
                  <img
                    src={formData.image}
                    alt="Preview"
                    className="w-full h-40 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, image: '' })}
                    className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded"
                  >
                    移除
                  </button>
                </div>
              )}
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
                立即发布
              </label>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave} className="bg-ocean-blue hover:bg-ocean-deep">
              {editingNews ? '保存' : '发布'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminNews;
