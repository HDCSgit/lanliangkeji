import { apiGet, apiPut, apiPost } from '@/api/client';

export interface StorageConfig {
  id: string;
  provider: 'local' | 'qiniu';
  qiniu_access_key?: string;
  qiniu_secret_key?: string;
  qiniu_bucket?: string;
  qiniu_domain?: string;
  qiniu_region?: string;
  local_base_url?: string;
  // 快递配置
  express_provider?: 'sf_express' | 'kuaidi100' | 'kdniao' | 'mock';
  sf_partner_id?: string;
  sf_checkword?: string;
  sf_env?: 'sandbox' | 'production';
  kuaidi100_key?: string;
  kdniao_id?: string;
  kdniao_key?: string;
  updated_at?: string;
}

export interface ExpressConfig {
  provider: string;
  sf: {
    partner_id: string;
    checkword: string;
    env: string;
  };
  kuaidi100: {
    key: string;
  };
  kdniao: {
    id: string;
    key: string;
  };
}

export const storageApi = {
  getConfig: () => apiGet<StorageConfig>('/admin/storage/'),
  updateConfig: (data: Partial<StorageConfig>) => apiPut<StorageConfig>('/admin/storage/', data),
  testQiniu: () => apiPost<{ buckets: string[] }>('/admin/storage/test-qiniu', {}),
  // 快递配置
  getExpressConfig: () => apiGet<ExpressConfig>('/admin/storage/express-config'),
  testSFExpress: () => apiPost<any>('/admin/storage/test-sf', {}),
};
