import axios, { AxiosError, type AxiosRequestConfig, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';

// API base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Helpers: snake_case <-> camelCase key transformation
function toCamelCase(str: string): string {
  return str.replace(/_([a-z0-9])/g, (_, letter) => letter.toUpperCase());
}

function toSnakeCase(str: string): string {
  return str.replace(/[A-Z0-9]+/g, (match) => `_${match.toLowerCase()}`).replace(/^_/, '');
}

function transformKeys(obj: any, converter: (key: string) => string): any {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return obj;
  if (obj instanceof FormData) return obj;
  if (obj instanceof File || obj instanceof Blob) return obj;
  if (Array.isArray(obj)) return obj.map((item) => transformKeys(item, converter));

  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    result[converter(key)] = transformKeys(value, converter);
  }
  return result;
}

// Request interceptor: add access token + camelCase -> snake_case body
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('lanliang_access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (
      config.data &&
      typeof config.data === 'object' &&
      !(config.data instanceof FormData) &&
      !(config.data instanceof File) &&
      !(config.data instanceof Blob)
    ) {
      config.data = transformKeys(config.data, toSnakeCase);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle token refresh + snake_case -> camelCase body
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeTokenRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

function onTokenRefreshed(newToken: string) {
  refreshSubscribers.forEach((callback) => callback(newToken));
  refreshSubscribers = [];
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('lanliang_refresh_token');
  if (!refreshToken) return null;

  try {
    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
      refresh_token: refreshToken,
    });
    const accessToken = response.data.data.access_token ?? response.data.data.accessToken;
    if (!accessToken) {
      throw new Error('刷新令牌响应异常');
    }
    localStorage.setItem('lanliang_access_token', accessToken);
    return accessToken;
  } catch (error) {
    localStorage.removeItem('lanliang_access_token');
    localStorage.removeItem('lanliang_refresh_token');
    localStorage.removeItem('lanliang_current_user');
    window.location.href = '/login';
    return null;
  }
}

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
      response.data = transformKeys(response.data, toCamelCase);
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;

    // 401 且不是 /auth/login 本身:尝试 refresh token
    const isAuthEndpoint = typeof originalRequest?.url === 'string' && originalRequest.url.includes('/auth/');
    if (status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            resolve(apiClient(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const newToken = await refreshAccessToken();
      isRefreshing = false;

      if (newToken) {
        onTokenRefreshed(newToken);
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        return apiClient(originalRequest);
      }
    }

    return Promise.reject(error);
  }
);

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * 从 AxiosError 中提取后端的真实错误消息。
 * 兼容:
 *   - ApiResponse 格式: { success, data, error, message }
 *   - FastAPI HTTPException: { detail: "..." } 或 { detail: [{msg, loc, ...}, ...] }
 *   - Pydantic 校验错误: { detail: [{msg, loc, type}, ...] }
 */
export function extractErrorMessage(err: any, fallback = '请求失败'): string {
  if (!err) return fallback;
  if (err.response?.data) {
    const data = err.response.data;
    if (data?.error) return String(data.error);
    if (data?.message) return String(data.message);
    if (typeof data?.detail === 'string') return data.detail;
    if (Array.isArray(data?.detail)) {
      // Pydantic 校验错误数组 / FastAPI detail 数组
      return data.detail
        .map((d: any) => {
          if (typeof d === 'string') return d;
          if (d?.msg) {
            const loc = Array.isArray(d.loc) ? d.loc.filter((x: any) => x !== 'body').join('.') : '';
            return loc ? `${loc}: ${d.msg}` : d.msg;
          }
          return '';
        })
        .filter(Boolean)
        .join('; ') || fallback;
    }
  }
  if (err.message) return String(err.message);
  return fallback;
}

export async function apiGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  try {
    const response = await apiClient.get<ApiResponse<T>>(url, config);
    if (!response.data.success) {
      throw new Error(response.data.error || response.data.message || '请求失败');
    }
    return response.data.data as T;
  } catch (e: any) {
    throw new Error(extractErrorMessage(e));
  }
}

export async function apiPost<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
  try {
    const response = await apiClient.post<ApiResponse<T>>(url, data, config);
    if (!response.data.success) {
      throw new Error(response.data.error || response.data.message || '请求失败');
    }
    return response.data.data as T;
  } catch (e: any) {
    throw new Error(extractErrorMessage(e));
  }
}

export async function apiPut<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
  try {
    const response = await apiClient.put<ApiResponse<T>>(url, data, config);
    if (!response.data.success) {
      throw new Error(response.data.error || response.data.message || '请求失败');
    }
    return response.data.data as T;
  } catch (e: any) {
    throw new Error(extractErrorMessage(e));
  }
}

export async function apiDelete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  try {
    const response = await apiClient.delete<ApiResponse<T>>(url, config);
    if (!response.data.success) {
      throw new Error(response.data.error || response.data.message || '请求失败');
    }
    return response.data.data as T;
  } catch (e: any) {
    throw new Error(extractErrorMessage(e));
  }
}

export function setAuthTokens(accessToken: string, refreshToken: string) {
  if (!accessToken || !refreshToken) {
    console.warn('拒绝保存无效 token');
    return;
  }
  localStorage.setItem('lanliang_access_token', accessToken);
  localStorage.setItem('lanliang_refresh_token', refreshToken);
}

export function clearAuthTokens() {
  localStorage.removeItem('lanliang_access_token');
  localStorage.removeItem('lanliang_refresh_token');
  localStorage.removeItem('lanliang_current_user');
}
