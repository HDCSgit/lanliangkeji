import React, { useState, useEffect } from 'react';
import {
  Smartphone, CreditCard, Building2,
  Save, AlertCircle, CheckCircle, Globe, Loader2, Lock
} from 'lucide-react';
import { apiGet, apiPut } from '@/api/client';
import { UserStore } from '@/data/userStore';

interface BankTransferInfo {
  enabled: boolean;
  account_name: string;
  bank_name: string;
  account_number: string;
}

interface AlipayInfo {
  enabled: boolean;
  app_id: string;
  private_key: string;  // '已配置' / '未配置' (不返回真值)
  public_key: string;
  notify_url: string;
}

interface WechatInfo {
  enabled: boolean;
  mch_id: string;
  app_id: string;
  api_key: string;  // '已配置' / '未配置'
  notify_url: string;
}

interface PaymentConfig {
  wechat_pay: WechatInfo;
  alipay: AlipayInfo;
  bank_transfer: BankTransferInfo;
}

const AdminPaymentConfig: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'wechat' | 'alipay' | 'bank'>('bank');
  const [config, setConfig] = useState<PaymentConfig | null>(null);
  const [bankForm, setBankForm] = useState<BankTransferInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [error, setError] = useState('');
  const canEdit = UserStore.canAudit();

  // 加载支付配置(从后端 DB 读 .env 不可改,但能看状态)
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    setError('');
    try {
      const resp: any = await apiGet('/admin/payment-gateway');
      const data = resp?.data || resp;  // 兼容 ApiResponse 包装
      setConfig(data);
      setBankForm(data.bank_transfer);
    } catch (e: any) {
      setError(e?.message || '加载支付配置失败');
    } finally {
      setLoading(false);
    }
  };

  // 保存对公转账账户(只有这个允许写)
  const handleSaveBank = async () => {
    if (!bankForm) return;
    setSaving(true);
    setError('');
    try {
      await apiPut('/admin/payment-gateway/bank-transfer', {
        enabled: bankForm.enabled,
        account_name: bankForm.account_name,
        bank_name: bankForm.bank_name,
        account_number: bankForm.account_number,
      });
      setSaveMessage('对公转账账户已保存');
      await loadConfig();  // 重新拉数据
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (e: any) {
      setError(e?.message || '保存失败');
    } finally {
      setSaving(false);
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-500">
        <Loader2 className="w-6 h-6 mr-2 animate-spin" /> 加载支付配置中...
      </div>
    );
  }

  if (error && !config) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-ocean-deep mb-2">加载失败</h2>
        <p className="text-gray-500 mb-4">{error}</p>
        <button onClick={loadConfig} className="px-4 py-2 bg-ocean-blue text-white rounded-lg">
          重试
        </button>
      </div>
    );
  }

  if (!config) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ocean-deep">支付配置</h1>
        <p className="text-gray-500">配置支付方式和收款账户信息(密钥仅在 .env 配置,不在此处展示)</p>
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

      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* WeChat Pay - 只读,显示 .env 配置状态 */}
      {activeTab === 'wechat' && (
        <div className="bg-white rounded-2xl shadow-card p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-ocean-deep">微信支付</h2>
                <p className="text-sm text-gray-500">
                  <Lock className="inline w-3 h-3 mr-1" />
                  密钥和启用开关由 .env 控制,部署时修改 server/.env + 重启生效
                </p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              config.wechat_pay.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
            }`}>
              {config.wechat_pay.enabled ? '✓ 已启用' : '✗ 未启用'}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <Field label="商户号 (mch_id)" value={config.wechat_pay.mch_id || '未配置'} />
            <Field label="应用ID (app_id)" value={config.wechat_pay.app_id || '未配置'} />
            <Field label="API 密钥" value={config.wechat_pay.api_key || '未配置'} />
            <Field label="回调地址 (notify_url)" value={config.wechat_pay.notify_url || '未配置'} />
          </div>
        </div>
      )}

      {/* Alipay - 只读,显示 .env 配置状态 */}
      {activeTab === 'alipay' && (
        <div className="bg-white rounded-2xl shadow-card p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-ocean-deep">支付宝</h2>
                <p className="text-sm text-gray-500">
                  <Lock className="inline w-3 h-3 mr-1" />
                  密钥和启用开关由 .env 控制,部署时修改 server/.env + 重启生效
                </p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              config.alipay.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
            }`}>
              {config.alipay.enabled ? '✓ 已启用' : '✗ 未启用'}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <Field label="应用ID (app_id)" value={config.alipay.app_id || '未配置'} />
            <Field label="应用私钥" value={config.alipay.private_key || '未配置'} mono />
            <Field label="支付宝公钥" value={config.alipay.public_key || '未配置'} mono />
            <Field label="回调地址 (notify_url)" value={config.alipay.notify_url || '未配置'} />
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
            💡 修改密钥请编辑 <code className="bg-white px-1 rounded">server/.env</code>:
            <br />
            <code className="bg-white px-1 rounded">ALIPAY_ENABLED=true</code> · <code className="bg-white px-1 rounded">ALIPAY_APP_ID</code> · <code className="bg-white px-1 rounded">ALIPAY_APP_PRIVATE_KEY</code> · <code className="bg-white px-1 rounded">ALIPAY_ALIPAY_PUBLIC_KEY</code>
          </div>
        </div>
      )}

      {/* Bank Transfer - 可编辑(非敏感,允许后台配置) */}
      {activeTab === 'bank' && bankForm && (
        <div className="bg-white rounded-2xl shadow-card p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-ocean-deep">对公转账</h2>
                <p className="text-sm text-gray-500">配置收款银行账户信息(可在后台编辑,实时生效)</p>
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={bankForm.enabled}
                onChange={(e) => setBankForm({ ...bankForm, enabled: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-ocean-blue focus:ring-ocean-blue"
              />
              <span className="text-sm">启用</span>
            </label>
          </div>

          {bankForm.enabled && (
            <>
              <div className="p-4 bg-orange-50 rounded-xl">
                <div className="flex items-center gap-2 text-orange-700 mb-2">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">收款账户信息</span>
                </div>
                <p className="text-sm text-orange-600">
                  用户在支付页面将看到以下收款账户信息,完成转账后需上传凭证截图等待审核。
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">开户名</label>
                  <input
                    type="text"
                    value={bankForm.account_name}
                    onChange={(e) => setBankForm({ ...bankForm, account_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none"
                    placeholder="请输入开户名"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">开户行</label>
                  <input
                    type="text"
                    value={bankForm.bank_name}
                    onChange={(e) => setBankForm({ ...bankForm, bank_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none"
                    placeholder="请输入开户行"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">银行账号</label>
                  <input
                    type="text"
                    value={bankForm.account_number}
                    onChange={(e) => setBankForm({ ...bankForm, account_number: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none font-mono"
                    placeholder="请输入银行账号"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={handleSaveBank}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 bg-ocean-blue text-white rounded-xl hover:bg-ocean-deep transition-colors font-medium disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  {saving ? '保存中...' : '保存配置'}
                </button>
                {saveMessage && (
                  <span className="flex items-center gap-1 text-green-600 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    {saveMessage}
                  </span>
                )}
              </div>
            </>
          )}

          {!bankForm.enabled && (
            <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-xl">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p>对公转账已禁用</p>
              <p className="text-sm text-gray-400">启用后可配置收款账户信息</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const Field: React.FC<{ label: string; value: string; mono?: boolean }> = ({ label, value, mono }) => (
  <div>
    <label className="block text-xs text-gray-500 mb-1">{label}</label>
    <div className={`px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 ${mono ? 'font-mono text-xs break-all' : ''}`}>
      {value}
    </div>
  </div>
);

export default AdminPaymentConfig;
