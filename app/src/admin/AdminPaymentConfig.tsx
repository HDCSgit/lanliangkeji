import React, { useState, useEffect } from 'react';
import {
  Smartphone, CreditCard, Building2,
  Save, AlertCircle, CheckCircle, Globe
} from 'lucide-react';
import { PaymentGateway } from '@/data/paymentGateway';
import { UserStore } from '@/data/userStore';
import type { PaymentGatewayConfig } from '@/types/payment';

const AdminPaymentConfig: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'wechat' | 'alipay' | 'bank'>('bank');
  const [config, setConfig] = useState<PaymentGatewayConfig>(PaymentGateway.getConfig());
  const [saveMessage, setSaveMessage] = useState('');
  const canEdit = UserStore.canAudit();

  useEffect(() => {
    setConfig(PaymentGateway.getConfig());
  }, []);

  const handleSave = () => {
    PaymentGateway.saveConfig(config);
    setSaveMessage('保存成功');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const updateWechat = (field: string, value: string | boolean) => {
    setConfig((prev) => ({
      ...prev,
      wechatPay: { ...prev.wechatPay, [field]: value },
    }));
  };

  const updateAlipay = (field: string, value: string | boolean) => {
    setConfig((prev) => ({
      ...prev,
      alipay: { ...prev.alipay, [field]: value },
    }));
  };

  const updateBank = (field: string, value: string | boolean) => {
    setConfig((prev) => ({
      ...prev,
      bankTransfer: { ...prev.bankTransfer, [field]: value },
    }));
  };

  const tabs = [
    { id: 'wechat' as const, name: '微信支付', icon: Smartphone },
    { id: 'alipay' as const, name: '支付宝', icon: CreditCard },
    { id: 'bank' as const, name: '对公转账', icon: Building2 },
  ];

  if (!canEdit) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-ocean-deep mb-2">无权访问</h2>
        <p className="text-gray-500">您没有权限配置支付信息</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-ocean-deep">支付配置</h1>
        <p className="text-gray-500">配置支付方式和收款账户信息</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-ocean-blue shadow-sm'
                  : 'text-gray-500 hover:text-ocean-deep'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.name}
            </button>
          );
        })}
      </div>

      {/* WeChat Pay */}
      {activeTab === 'wechat' && (
        <div className="bg-white rounded-2xl shadow-card p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-ocean-deep">微信支付</h2>
                <p className="text-sm text-gray-500">配置微信支付商户信息</p>
              </div>
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={config.wechatPay.enabled}
                onChange={(e) => updateWechat('enabled', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-ocean-blue focus:ring-ocean-blue"
              />
              <span className="text-sm">启用</span>
            </label>
          </div>

          {config.wechatPay.enabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">商户号 (mch_id)</label>
                <input
                  type="text"
                  value={config.wechatPay.mchId}
                  onChange={(e) => updateWechat('mchId', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none"
                  placeholder="请输入商户号"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">应用ID (appid)</label>
                <input
                  type="text"
                  value={config.wechatPay.appId}
                  onChange={(e) => updateWechat('appId', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none"
                  placeholder="请输入应用ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API密钥</label>
                <input
                  type="password"
                  value={config.wechatPay.apiKey}
                  onChange={(e) => updateWechat('apiKey', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none"
                  placeholder="请输入API密钥"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">回调地址 (notify_url)</label>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-gray-400 shrink-0" />
                  <input
                    type="text"
                    value={config.wechatPay.notifyUrl}
                    onChange={(e) => updateWechat('notifyUrl', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none"
                    placeholder="https://your-domain.com/api/pay/callback/wechat"
                  />
                </div>
              </div>
            </div>
          )}

          {!config.wechatPay.enabled && (
            <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-xl">
              <Smartphone className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p>微信支付已禁用</p>
              <p className="text-sm text-gray-400">开启后用户可使用微信支付</p>
            </div>
          )}
        </div>
      )}

      {/* Alipay */}
      {activeTab === 'alipay' && (
        <div className="bg-white rounded-2xl shadow-card p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-ocean-deep">支付宝</h2>
                <p className="text-sm text-gray-500">配置支付宝商户信息</p>
              </div>
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={config.alipay.enabled}
                onChange={(e) => updateAlipay('enabled', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-ocean-blue focus:ring-ocean-blue"
              />
              <span className="text-sm">启用</span>
            </label>
          </div>

          {config.alipay.enabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">应用ID (app_id)</label>
                <input
                  type="text"
                  value={config.alipay.appId}
                  onChange={(e) => updateAlipay('appId', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none"
                  placeholder="请输入应用ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">回调地址 (notify_url)</label>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-gray-400 shrink-0" />
                  <input
                    type="text"
                    value={config.alipay.notifyUrl}
                    onChange={(e) => updateAlipay('notifyUrl', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none"
                    placeholder="https://your-domain.com/api/pay/callback/alipay"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">应用私钥</label>
                <textarea
                  value={config.alipay.privateKey}
                  onChange={(e) => updateAlipay('privateKey', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none resize-none font-mono text-sm"
                  placeholder="请输入应用私钥"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">支付宝公钥</label>
                <textarea
                  value={config.alipay.publicKey}
                  onChange={(e) => updateAlipay('publicKey', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none resize-none font-mono text-sm"
                  placeholder="请输入支付宝公钥"
                />
              </div>
            </div>
          )}

          {!config.alipay.enabled && (
            <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-xl">
              <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p>支付宝已禁用</p>
              <p className="text-sm text-gray-400">开启后用户可使用支付宝支付</p>
            </div>
          )}
        </div>
      )}

      {/* Bank Transfer */}
      {activeTab === 'bank' && (
        <div className="bg-white rounded-2xl shadow-card p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-ocean-deep">对公转账</h2>
                <p className="text-sm text-gray-500">配置收款银行账户信息</p>
              </div>
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={config.bankTransfer.enabled}
                onChange={(e) => updateBank('enabled', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-ocean-blue focus:ring-ocean-blue"
              />
              <span className="text-sm">启用</span>
            </label>
          </div>

          {config.bankTransfer.enabled && (
            <>
              <div className="p-4 bg-orange-50 rounded-xl">
                <div className="flex items-center gap-2 text-orange-700 mb-3">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">收款账户信息</span>
                </div>
                <p className="text-sm text-orange-600">
                  用户在支付页面将看到以下收款账户信息，完成转账后需上传凭证截图等待审核。
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">开户名</label>
                  <input
                    type="text"
                    value={config.bankTransfer.accountName}
                    onChange={(e) => updateBank('accountName', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none"
                    placeholder="请输入开户名"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">开户行</label>
                  <input
                    type="text"
                    value={config.bankTransfer.bankName}
                    onChange={(e) => updateBank('bankName', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none"
                    placeholder="请输入开户行"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">银行账号</label>
                  <input
                    type="text"
                    value={config.bankTransfer.accountNumber}
                    onChange={(e) => updateBank('accountNumber', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none font-mono"
                    placeholder="请输入银行账号"
                  />
                </div>
              </div>
            </>
          )}

          {!config.bankTransfer.enabled && (
            <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-xl">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p>对公转账已禁用</p>
              <p className="text-sm text-gray-400">开启后用户可使用对公转账支付</p>
            </div>
          )}
        </div>
      )}

      {/* Save Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-3 bg-ocean-blue text-white rounded-xl hover:bg-ocean-deep transition-colors font-medium"
        >
          <Save className="w-5 h-5" />
          保存配置
        </button>
        {saveMessage && (
          <span className="flex items-center gap-1 text-green-600 text-sm">
            <CheckCircle className="w-4 h-4" />
            {saveMessage}
          </span>
        )}
      </div>
    </div>
  );
};

export default AdminPaymentConfig;
