import React, { useState } from 'react';
import { Save, RotateCcw } from 'lucide-react';
import { DataStore } from '@/data/store';
import type { SiteConfig } from '@/types';
import { Button } from '@/components/ui/button';

const AdminSettings: React.FC = () => {
  const [config, setConfig] = useState<SiteConfig>(DataStore.getSiteConfig());
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    DataStore.setSiteConfig(config);
    setSaveMessage('设置已保存');
    setIsSaving(false);

    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleReset = () => {
    if (confirm('确定要重置所有设置吗？这将恢复默认配置。')) {
      DataStore.reset();
      setConfig(DataStore.getSiteConfig());
      setSaveMessage('设置已重置');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  const updateContact = (field: string, value: string) => {
    setConfig({
      ...config,
      contact: {
        ...config.contact,
        [field]: value,
      },
    });
  };

  const updateSEO = (field: string, value: string) => {
    setConfig({
      ...config,
      seo: {
        ...config.seo,
        [field]: value,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ocean-deep">网站设置</h1>
          <p className="text-gray-500">管理网站基本信息和配置</p>
        </div>
        <div className="flex items-center gap-4">
          {saveMessage && (
            <span className="text-green-600 text-sm">{saveMessage}</span>
          )}
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-2" />
            重置
          </Button>
          <Button onClick={handleSave} className="bg-ocean-blue hover:bg-ocean-deep" disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? '保存中...' : '保存设置'}
          </Button>
        </div>
      </div>

      {/* Settings Form */}
      <div className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-2xl shadow-card p-6">
          <h2 className="text-lg font-bold text-ocean-deep mb-4">基本信息</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">网站标题</label>
              <input
                type="text"
                value={config.title}
                onChange={(e) => setConfig({ ...config, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">网站描述</label>
              <input
                type="text"
                value={config.description}
                onChange={(e) => setConfig({ ...config, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">关键词</label>
              <input
                type="text"
                value={config.keywords}
                onChange={(e) => setConfig({ ...config, keywords: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none"
                placeholder="用逗号分隔"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">备案号</label>
              <input
                type="text"
                value={config.icp}
                onChange={(e) => setConfig({ ...config, icp: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-white rounded-2xl shadow-card p-6">
          <h2 className="text-lg font-bold text-ocean-deep mb-4">联系信息</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">公司地址</label>
              <input
                type="text"
                value={config.contact.address}
                onChange={(e) => updateContact('address', e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">联系电话</label>
              <input
                type="text"
                value={config.contact.phone}
                onChange={(e) => updateContact('phone', e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">电子邮箱</label>
              <input
                type="email"
                value={config.contact.email}
                onChange={(e) => updateContact('email', e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">传真</label>
              <input
                type="text"
                value={config.contact.fax || ''}
                onChange={(e) => updateContact('fax', e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">工作时间</label>
              <input
                type="text"
                value={config.contact.workHours}
                onChange={(e) => updateContact('workHours', e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* SEO Settings */}
        <div className="bg-white rounded-2xl shadow-card p-6">
          <h2 className="text-lg font-bold text-ocean-deep mb-4">SEO设置</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SEO标题</label>
              <input
                type="text"
                value={config.seo.title}
                onChange={(e) => updateSEO('title', e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SEO关键词</label>
              <input
                type="text"
                value={config.seo.keywords}
                onChange={(e) => updateSEO('keywords', e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">SEO描述</label>
              <textarea
                value={config.seo.description}
                onChange={(e) => updateSEO('description', e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">OG图片</label>
              <input
                type="text"
                value={config.seo.ogImage}
                onChange={(e) => updateSEO('ogImage', e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none"
                placeholder="图片URL"
              />
            </div>
          </div>
        </div>

        {/* Analytics */}
        <div className="bg-white rounded-2xl shadow-card p-6">
          <h2 className="text-lg font-bold text-ocean-deep mb-4">统计代码</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">第三方统计代码</label>
            <textarea
              value={config.analytics}
              onChange={(e) => setConfig({ ...config, analytics: e.target.value })}
              rows={5}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none resize-none font-mono text-sm"
              placeholder="<!-- 在此处粘贴统计代码 -->"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
