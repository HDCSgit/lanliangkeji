import React, { useState, useEffect } from 'react';
import { Save, TestTube, Cloud, HardDrive, AlertCircle, CheckCircle, XCircle, Eye, EyeOff, Truck, Package, Shield, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiGet, apiPut, apiPost } from '@/api/client';

// 前端本地校验：与后端 SFExpressH5Service.is_sf_tracking_number 规则保持一致
// （SF 开头 + 至少 12 位字母数字）
const SFExpressH5Service = {
  isValidTrackingNumber(tn: string): boolean {
    return /^SF[A-Z0-9]{12,}$/i.test((tn || '').trim());
  },
};

interface StorageConfig {
  id: string;
  provider: 'local' | 'qiniu';
  qiniu_access_key?: string;
  qiniu_secret_key?: string;
  qiniu_bucket?: string;
  qiniu_domain?: string;
  qiniu_region?: string;
  local_base_url?: string;
  // 快递配置
  express_provider: 'sf_express' | 'sf_express_h5' | 'kuaidi100' | 'kdniao' | 'mock';
  sf_partner_id?: string;
  sf_checkword?: string;
  sf_env?: 'sandbox' | 'production';
  kuaidi100_key?: string;
  kdniao_id?: string;
  kdniao_key?: string;
  updated_at?: string;
}

const AdminStorage: React.FC = () => {
  const [config, setConfig] = useState<StorageConfig>({
    id: '',
    provider: 'local',
    qiniu_access_key: '',
    qiniu_secret_key: '',
    qiniu_bucket: '',
    qiniu_domain: '',
    qiniu_region: 'z0',
    local_base_url: '',
    express_provider: 'sf_express',
    sf_partner_id: '',
    sf_checkword: '',
    sf_env: 'production',
    kuaidi100_key: '',
    kdniao_id: '',
    kdniao_key: '',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  // testing / handleTestQiniu 暂未用(七牛测试逻辑走 handleTestStorage)
  const [testingSF, setTestingSF] = useState(false);
  const [testingSFH5, setTestingSFH5] = useState(false);
  const [sfH5TestTrackingNumber, setSfH5TestTrackingNumber] = useState('');
  const [sfH5TestPhone, setSfH5TestPhone] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  const [showSFCheckword, setShowSFCheckword] = useState(false);
  const [activeTab, setActiveTab] = useState<'storage' | 'express'>('storage');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const data = await apiGet<StorageConfig>('/admin/storage/');
      setConfig(data);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || '加载配置失败' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await apiPut('/admin/storage/', config);
      setMessage({ type: 'success', text: '配置已保存' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || '保存失败' });
    } finally {
      setSaving(false);
    }
  };

  // handleTestQiniu 暂未用(逻辑走 handleTestStorage)
  // const handleTestQiniu = async () => {
  //   if (config.provider !== 'qiniu') {
  //     setMessage({ type: 'error', text: '请先切换到七牛云模式' });
  //     return;
  //   }
  //   setTesting(true);
  //   setMessage(null);
  //   try {
  //     const result = await apiPost<{ buckets: string[] }>('/admin/storage/test-qiniu', {});
  //     setMessage({
  //       type: 'success',
  //       text: `七牛云连接成功！可用 Bucket: ${result.buckets?.join(', ') || '无'}`,
  //     });
  //   } catch (error: any) {
  //     setMessage({ type: 'error', text: error.message || '连接测试失败' });
  //   } finally {
  //     setTesting(false);
  //   }
  // };

  const handleTestSF = async () => {
    setTestingSF(true);
    setMessage(null);
    try {
      const result = await apiPost<any>('/admin/storage/test-sf', {});
      if (result.success) {
        setMessage({
          type: 'success',
          text: result.message || '顺丰 API 测试成功',
        });
      } else {
        setMessage({ type: 'error', text: result.message || '顺丰 API 测试失败' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || '顺丰测试失败' });
    } finally {
      setTestingSF(false);
    }
  };

  const handleTestSFH5 = async () => {
    const tn = sfH5TestTrackingNumber.trim();
    if (!tn) {
      setMessage({ type: 'error', text: '请输入顺丰运单号' });
      return;
    }
    if (!SFExpressH5Service.isValidTrackingNumber(tn)) {
      setMessage({ type: 'error', text: '运单号格式不合法（需以 SF 开头，SF 后至少 12 位字母数字）' });
      return;
    }
    setTestingSFH5(true);
    setMessage(null);
    try {
      const result = await apiPost<any>('/admin/storage/test-sf-h5', {
        tracking_number: tn,
        phone: sfH5TestPhone.trim() || undefined,
      });
      if (result.success) {
        setMessage({
          type: 'success',
          text: result.message || '顺丰 H5 接口测试成功',
        });
      } else {
        setMessage({ type: 'error', text: result.message || '顺丰 H5 接口测试失败' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || '顺丰 H5 测试失败' });
    } finally {
      setTestingSFH5(false);
    }
  };

  const updateField = (field: keyof StorageConfig, value: string) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const expressProviders = [
    {
      key: 'sf_express' as const,
      label: '顺丰开放平台',
      description: '顺丰官方 API，轨迹精准，推荐优先使用',
      icon: Truck,
      color: 'text-ocean-blue',
      bgColor: 'bg-ocean-blue/10',
      borderColor: 'border-ocean-blue',
    },
    {
      key: 'sf_express_h5' as const,
      label: '顺丰公开接口(免密钥)',
      description: '无需注册,适合小规模查询(< 500单/天),拿到密钥后可切回开放平台',
      icon: Globe,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-100',
      borderColor: 'border-cyan-500',
    },
    {
      key: 'kuaidi100' as const,
      label: '快递100',
      description: '免费查询接口，支持多快递公司',
      icon: Package,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      borderColor: 'border-green-500',
    },
    {
      key: 'kdniao' as const,
      label: '快递鸟',
      description: '专业物流接口，需注册账号',
      icon: Shield,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      borderColor: 'border-purple-500',
    },
    {
      key: 'mock' as const,
      label: '模拟数据',
      description: '本地模拟轨迹，用于测试环境',
      icon: AlertCircle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      borderColor: 'border-orange-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-ocean-deep">系统配置</h1>
        <p className="text-gray-500">管理文件存储方式与物流查询配置</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('storage')}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === 'storage'
              ? 'text-ocean-blue border-b-2 border-ocean-blue'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          存储配置
        </button>
        <button
          onClick={() => setActiveTab('express')}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === 'express'
              ? 'text-ocean-blue border-b-2 border-ocean-blue'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          物流查询配置
        </button>
      </div>

      {/* ==================== Storage Tab ==================== */}
      {activeTab === 'storage' && (
        <div className="space-y-6">
          {/* Provider Selection */}
          <div className="bg-white rounded-2xl shadow-card p-6">
            <h2 className="text-lg font-bold text-ocean-deep mb-4">存储方式</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => updateField('provider', 'local')}
                className={`flex items-center gap-4 p-4 border-2 rounded-xl transition-all ${
                  config.provider === 'local'
                    ? 'border-ocean-blue bg-ocean-blue/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-ocean-blue/10 flex items-center justify-center">
                  <HardDrive className="w-6 h-6 text-ocean-blue" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-ocean-deep">本地存储</div>
                  <div className="text-xs text-gray-500">文件保存在服务器本地磁盘</div>
                </div>
                {config.provider === 'local' && (
                  <CheckCircle className="w-5 h-5 text-ocean-blue ml-auto" />
                )}
              </button>

              <button
                onClick={() => updateField('provider', 'qiniu')}
                className={`flex items-center gap-4 p-4 border-2 rounded-xl transition-all ${
                  config.provider === 'qiniu'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <Cloud className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-ocean-deep">七牛云存储</div>
                  <div className="text-xs text-gray-500">文件上传到七牛云对象存储</div>
                </div>
                {config.provider === 'qiniu' && (
                  <CheckCircle className="w-5 h-5 text-green-500 ml-auto" />
                )}
              </button>
            </div>
          </div>

          {/* Local Config */}
          {config.provider === 'local' && (
            <div className="bg-white rounded-2xl shadow-card p-6">
              <h2 className="text-lg font-bold text-ocean-deep mb-4">本地存储配置</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    外网访问基础 URL（可选）
                  </label>
                  <input
                    type="text"
                    value={config.local_base_url || ''}
                    onChange={(e) => updateField('local_base_url', e.target.value)}
                    placeholder="如: https://cdn.example.com 或留空"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    如果配置了 CDN 或独立域名，填写完整 URL；留空则使用相对路径
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Qiniu Config */}
          {config.provider === 'qiniu' && (
            <div className="bg-white rounded-2xl shadow-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-ocean-deep">七牛云配置</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestSFH5}
                  disabled={testingSFH5}
                  className="flex items-center gap-2"
                >
                  <TestTube className="w-4 h-4" />
                  {testingSFH5 ? '测试中...' : '连接测试'}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Access Key <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={config.qiniu_access_key || ''}
                    onChange={(e) => updateField('qiniu_access_key', e.target.value)}
                    placeholder="七牛云 Access Key"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Secret Key <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showSecret ? 'text' : 'password'}
                      value={config.qiniu_secret_key || ''}
                      onChange={(e) => updateField('qiniu_secret_key', e.target.value)}
                      placeholder="七牛云 Secret Key"
                      className="w-full px-4 py-2 pr-10 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecret(!showSecret)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bucket 名称 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={config.qiniu_bucket || ''}
                    onChange={(e) => updateField('qiniu_bucket', e.target.value)}
                    placeholder="如: lanliang-images"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    加速域名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={config.qiniu_domain || ''}
                    onChange={(e) => updateField('qiniu_domain', e.target.value)}
                    placeholder="如: https://cdn.example.com"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    存储区域
                  </label>
                  <select
                    value={config.qiniu_region || 'z0'}
                    onChange={(e) => updateField('qiniu_region', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none"
                  >
                    <option value="z0">华东 (z0)</option>
                    <option value="z1">华北 (z1)</option>
                    <option value="z2">华南 (z2)</option>
                    <option value="na0">北美 (na0)</option>
                    <option value="as0">东南亚 (as0)</option>
                    <option value="cn-east-2">华东-浙江2 (cn-east-2)</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== Express Tab ==================== */}
      {activeTab === 'express' && (
        <div className="space-y-6">
          {/* Provider Selection */}
          <div className="bg-white rounded-2xl shadow-card p-6">
            <h2 className="text-lg font-bold text-ocean-deep mb-4">物流查询提供商</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {expressProviders.map((p) => {
                const Icon = p.icon;
                const isActive = config.express_provider === p.key;
                return (
                  <button
                    key={p.key}
                    onClick={() => updateField('express_provider', p.key)}
                    className={`flex items-center gap-4 p-4 border-2 rounded-xl transition-all ${
                      isActive
                        ? `${p.borderColor} ${p.bgColor}`
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl ${p.bgColor} flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${p.color}`} />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-ocean-deep">{p.label}</div>
                      <div className="text-xs text-gray-500">{p.description}</div>
                    </div>
                    {isActive && (
                      <CheckCircle className={`w-5 h-5 ${p.color} ml-auto`} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* SF Express Config */}
          {config.express_provider === 'sf_express' && (
            <div className="bg-white rounded-2xl shadow-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-ocean-deep">顺丰开放平台配置</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestSF}
                  disabled={testingSF}
                  className="flex items-center gap-2"
                >
                  <TestTube className="w-4 h-4" />
                  {testingSF ? '测试中...' : '连接测试'}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Partner ID（合作商ID）
                  </label>
                  <input
                    type="text"
                    value={config.sf_partner_id || ''}
                    onChange={(e) => updateField('sf_partner_id', e.target.value)}
                    placeholder="顺丰开放平台分配的合作商ID"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Checkword（密钥）
                  </label>
                  <div className="relative">
                    <input
                      type={showSFCheckword ? 'text' : 'password'}
                      value={config.sf_checkword || ''}
                      onChange={(e) => updateField('sf_checkword', e.target.value)}
                      placeholder="顺丰开放平台分配的密钥"
                      className="w-full px-4 py-2 pr-10 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSFCheckword(!showSFCheckword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showSFCheckword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    运行环境
                  </label>
                  <select
                    value={config.sf_env || 'production'}
                    onChange={(e) => updateField('sf_env', e.target.value as 'sandbox' | 'production')}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none"
                  >
                    <option value="production">生产环境</option>
                    <option value="sandbox">沙箱/测试环境</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 bg-green-50 rounded-xl p-4 text-sm text-green-800">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-medium">顺丰开放平台 — 免费 + 个人可认证(推荐)</p>
                    <p>• <strong>顺丰服务 API 目前全部免费</strong>(顺丰官方承诺,接口文档中会标注收费项)</p>
                    <p>• <strong>支持个人认证</strong>: 仅需身份证 + 你的月结账号,不需要企业资质,不需要走客户经理</p>
                    <p>• 申请地址:<a className="underline" href="https://open.sf-express.com/" target="_blank" rel="noreferrer">https://open.sf-express.com/</a> (LaaS 开放平台)</p>
                    <p>• 流程: 注册账号 → 个人认证 → 创建应用 → 关联"路由查询" API → 拿到 partnerID + checkword</p>
                    <p>• 拿到后填到上方,点"连接测试" 验证</p>
                    <p>• 适用环境: 测试环境用 sandbox 沙箱运单号,生产用真实单号</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SF Express H5 Config (免密钥) */}
          {config.express_provider === 'sf_express_h5' && (
            <div className="bg-white rounded-2xl shadow-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-ocean-deep">顺丰公开接口(免密钥)</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    测试用顺丰运单号
                  </label>
                  <input
                    type="text"
                    value={sfH5TestTrackingNumber}
                    onChange={(e) => setSfH5TestTrackingNumber(e.target.value)}
                    placeholder="例如 SF0213083544995"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    收件人/寄件人手机后四位
                    <span className="text-xs text-gray-400 ml-1">（强烈建议填，顺丰 H5 业务必填）</span>
                  </label>
                  <input
                    type="text"
                    value={sfH5TestPhone}
                    onChange={(e) => setSfH5TestPhone(e.target.value.replace(/\D/g, '').slice(-4))}
                    placeholder="例如 3922"
                    maxLength={4}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none"
                  />
                </div>
              </div>
              <div className="mb-4">
                <Button
                  variant="outline"
                  onClick={handleTestSFH5}
                  disabled={testingSFH5}
                  className="flex items-center gap-2"
                >
                  <TestTube className="w-4 h-4" />
                  {testingSFH5 ? '测试中...' : '连接测试'}
                </Button>
              </div>

              <div className="bg-cyan-50 rounded-xl p-4 text-sm text-cyan-800">
                <div className="flex items-start gap-2">
                  <Globe className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-medium">配置说明</p>
                    <p>• <strong>临时方案</strong>: 免密钥,直调顺丰移动端 H5 接口</p>
                    <p>• <strong>可能不稳</strong>: 顺丰限速/反爬,本机网络下大概率连不上 (仅供参考)</p>
                    <p>• <strong>建议改成"顺丰开放平台"</strong>: 顺丰官方免费,个人身份证即可注册,稳定可靠</p>
                    <p>• 服务器需能访问 m.sf-express.com(点击"连接测试"验证)</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Kuaidi100 Config */}
          {config.express_provider === 'kuaidi100' && (
            <div className="bg-white rounded-2xl shadow-card p-6">
              <h2 className="text-lg font-bold text-ocean-deep mb-4">快递100 配置</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    API Key（可选）
                  </label>
                  <input
                    type="text"
                    value={config.kuaidi100_key || ''}
                    onChange={(e) => updateField('kuaidi100_key', e.target.value)}
                    placeholder="快递100 API Key（免费版可不填）"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none"
                  />
                </div>
              </div>
              <div className="mt-4 bg-blue-50 rounded-xl p-4 text-sm text-blue-700">
                <p>当前使用快递100免费查询接口，无需配置 Key 即可查询。如需更高频次，可前往 https://www.kuaidi100.com/openapi/ 申请。</p>
              </div>
            </div>
          )}

          {/* Kdniao Config */}
          {config.express_provider === 'kdniao' && (
            <div className="bg-white rounded-2xl shadow-card p-6">
              <h2 className="text-lg font-bold text-ocean-deep mb-4">快递鸟 配置</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    商户ID
                  </label>
                  <input
                    type="text"
                    value={config.kdniao_id || ''}
                    onChange={(e) => updateField('kdniao_id', e.target.value)}
                    placeholder="快递鸟商户ID"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    API Key
                  </label>
                  <input
                    type="text"
                    value={config.kdniao_key || ''}
                    onChange={(e) => updateField('kdniao_key', e.target.value)}
                    placeholder="快递鸟 API Key"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none"
                  />
                </div>
              </div>
              <div className="mt-4 bg-blue-50 rounded-xl p-4 text-sm text-blue-700">
                <p>请前往 https://www.kdniao.com/ 注册并获取商户ID和API Key。</p>
              </div>
            </div>
          )}

          {/* Mock Config */}
          {config.express_provider === 'mock' && (
            <div className="bg-white rounded-2xl shadow-card p-6">
              <h2 className="text-lg font-bold text-ocean-deep mb-4">模拟数据配置</h2>
              <div className="bg-yellow-50 rounded-xl p-4 text-sm text-yellow-700">
                <p>当前使用本地模拟数据，无需配置任何密钥。适用于开发和测试环境。</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Message */}
      {message && (
        <div
          className={`flex items-center gap-2 p-4 rounded-xl ${
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span>{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            className="ml-auto text-gray-400 hover:text-gray-600"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4">
        <Button
          onClick={handleSave}
          disabled={saving || loading}
          className="flex items-center gap-2 bg-ocean-blue hover:bg-ocean-deep"
        >
          <Save className="w-4 h-4" />
          {saving ? '保存中...' : '保存配置'}
        </Button>
        <Button variant="outline" onClick={loadConfig} disabled={loading}>
          刷新
        </Button>
      </div>

      {/* Info */}
      {activeTab === 'storage' && (
        <div className="bg-orange-50 rounded-xl p-4 text-sm text-orange-700">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium">切换说明</p>
              <p>• 切换存储方式后，新上传的文件会使用新配置，已有文件不受影响</p>
              <p>• 建议先在测试环境验证七牛云配置，再切换到生产环境</p>
              <p>• Secret Key 仅在保存时传输，不会在前端显示完整内容</p>
              <p>• 本地存储文件位于服务器 uploads/ 目录，请定期备份</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStorage;
