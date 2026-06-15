import { apiGet, apiPut } from '@/api/client';

export const siteApi = {
  getConfig: () => apiGet('/site/config'),
  getBanners: () => apiGet('/site/banners'),
  getNews: () => apiGet('/site/news'),
  getNewsDetail: (id: string) => apiGet(`/site/news/${id}`),
  getPartners: () => apiGet('/site/partners'),
  getNav: () => apiGet('/site/nav'),
  getPage: (slug: string) => apiGet(`/site/pages/${slug}`),
  getCompany: () => apiGet('/site/company'),
  getRD: () => apiGet('/site/rd'),
  getServices: () => apiGet('/site/services'),
  getStats: () => apiGet('/site/stats'),
  updateConfig: (data: any) => apiPut('/admin/site/config', data),
};
