import { apiGet, apiPost, apiPut, apiDelete } from '@/api/client';
import type { ShippingAddress } from '@/types/ecommerce';

export const usersApi = {
  getMe: () => apiGet('/users/me'),
  updateMe: (data: any) => apiPut('/users/me', data),
  getAddresses: () => apiGet<ShippingAddress[]>('/users/addresses'),
  getDefaultAddress: () => apiGet<ShippingAddress>('/users/addresses/default'),
  addAddress: (data: any) => apiPost('/users/addresses', data),
  updateAddress: (id: string, data: any) => apiPut(`/users/addresses/${id}`, data),
  deleteAddress: (id: string) => apiDelete(`/users/addresses/${id}`),
};
