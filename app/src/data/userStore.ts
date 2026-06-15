import type { User, ShippingAddress } from '@/types/ecommerce';
import { apiPost, apiGet, apiPut, apiDelete, setAuthTokens, clearAuthTokens } from '@/api/client';

const STORAGE_KEYS = {
  CURRENT_USER: 'lanliang_current_user',
  ACCESS_TOKEN: 'lanliang_access_token',
};

export interface Auditor {
  userId: string;
  userName: string;
  userPhone: string;
  assignedBy: string;
  assignedByName: string;
  assignedAt: string;
}

export interface AuthResult {
  success: boolean;
  message: string;
  user?: any;
}

function saveUser(user: any) {
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
}

export const UserStore = {
  async register(name: string, phone: string, password: string): Promise<AuthResult> {
    try {
      const data = await apiPost<{ accessToken: string; refreshToken: string; user: any }>('/auth/register', {
        name,
        phone,
        password,
      });
      setAuthTokens(data.accessToken, data.refreshToken);
      saveUser(data.user);
      return { success: true, message: '注册成功', user: data.user };
    } catch (error: any) {
      return { success: false, message: error.message || '注册失败' };
    }
  },

  async login(phone: string, password: string): Promise<AuthResult> {
    try {
      const data = await apiPost<{ accessToken: string; refreshToken: string; user: any }>('/auth/login', {
        phone,
        password,
      });
      setAuthTokens(data.accessToken, data.refreshToken);
      saveUser(data.user);
      return { success: true, message: '登录成功', user: data.user };
    } catch (error: any) {
      return { success: false, message: error.message || '登录失败' };
    }
  },

  async logout(): Promise<void> {
    try {
      await apiPost('/auth/logout', {});
    } catch (e) {
      // ignore
    }
    clearAuthTokens();
  },

  isLoggedIn(): boolean {
    return !!localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  },

  getCurrentUser(): (User & { role?: string }) | null {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (data) {
      try {
        return JSON.parse(data);
      } catch {
        return null;
      }
    }
    return null;
  },

  isSysAdmin(): boolean {
    return this.getCurrentUser()?.role === 'sysadmin';
  },

  isAuditor(): boolean {
    return this.getCurrentUser()?.role === 'auditor';
  },

  canAudit(): boolean {
    return this.isSysAdmin() || this.isAuditor();
  },

  canAccessAdmin(): boolean {
    if (!this.isLoggedIn()) return false;
    return this.isSysAdmin() || this.isAuditor();
  },

  async getUsers(): Promise<(User & { role?: string })[]> {
    try {
      return await apiGet('/admin/users');
    } catch (error: any) {
      console.error('获取用户列表失败:', error);
      return [];
    }
  },

  async updateUser(user: User & { role?: string }): Promise<void> {
    try {
      const updated = await apiPut<User & { role?: string }>('/users/me', user);
      const current = this.getCurrentUser();
      if (current && current.id === user.id) {
        saveUser({ ...current, ...updated });
      }
    } catch (error: any) {
      console.error('更新用户信息失败:', error);
      throw error;
    }
  },

  async getAuditors(): Promise<Auditor[]> {
    try {
      return await apiGet('/admin/auditors');
    } catch (error: any) {
      console.error('获取审核员列表失败:', error);
      return [];
    }
  },

  async assignAuditor(userId: string): Promise<AuthResult> {
    try {
      const result = await apiPost<{ message?: string }>('/admin/auditors', { user_id: userId });
      return { success: true, message: result.message || '设置审核员成功' };
    } catch (error: any) {
      return { success: false, message: error.message || '设置审核员失败' };
    }
  },

  async removeAuditor(userId: string): Promise<AuthResult> {
    try {
      const result = await apiDelete<{ message?: string }>(`/admin/auditors/${userId}`);
      return { success: true, message: result.message || '移除审核员成功' };
    } catch (error: any) {
      return { success: false, message: error.message || '移除审核员失败' };
    }
  },

  async addAddress(address: ShippingAddress): Promise<ShippingAddress> {
    try {
      return await apiPost<ShippingAddress>('/users/addresses', address);
    } catch (error: any) {
      console.error('添加地址失败:', error);
      throw error;
    }
  },

  async getAddresses(): Promise<ShippingAddress[]> {
    try {
      return await apiGet('/users/addresses');
    } catch (error: any) {
      console.error('获取地址失败:', error);
      return [];
    }
  },

  async updateAddress(address: ShippingAddress): Promise<void> {
    try {
      await apiPut(`/users/addresses/${address.id}`, address);
    } catch (error: any) {
      console.error('更新地址失败:', error);
      throw error;
    }
  },

  async deleteAddress(addressId: string): Promise<void> {
    try {
      await apiDelete(`/users/addresses/${addressId}`);
    } catch (error: any) {
      console.error('删除地址失败:', error);
      throw error;
    }
  },

  async getDefaultAddress(): Promise<ShippingAddress | null> {
    try {
      return await apiGet('/users/addresses/default');
    } catch {
      const addresses = await this.getAddresses();
      return addresses.find((a) => a.isDefault) || addresses[0] || null;
    }
  },
};

export default UserStore;
