import { apiGet, apiPost, apiPut, apiDelete } from '@/api/client';
import type { CartItem, Order, UserBill, LogisticsInfo, PaymentFlow } from '@/types/ecommerce';

export const cartApi = {
  getCart: () => apiGet<CartItem[]>('/cart/'),
  addToCart: (data: any) => apiPost('/cart/', data),
  updateCartItem: (id: string, data: any) => apiPut(`/cart/${id}`, data),
  removeCartItem: (id: string) => apiDelete(`/cart/${id}`),
  clearCart: () => apiDelete('/cart/'),
};

export const orderApi = {
  getOrders: () => apiGet<Order[]>('/orders/'),
  getOrder: (id: string) => apiGet<Order>(`/orders/${id}`),
  createOrder: (data: any) => {
    const payload = data.shippingAddress?.id
      ? { shipping_address_id: data.shippingAddress.id, remark: data.remark }
      : data;
    return apiPost<Order>('/orders/', payload);
  },
  updateOrderStatus: (id: string, data: any) => apiPut(`/orders/${id}/status`, data),
  listPayments: (id: string) => apiGet<PaymentFlow[]>(`/orders/${id}/payments`),
};

export const billApi = {
  getBills: () => apiGet<UserBill[]>('/bills/'),
};

export const logisticsApi = {
  getLogistics: (orderId: string) => apiGet<LogisticsInfo>(`/logistics/orders/${orderId}`),
  addUpdate: (orderId: string, data: any) => apiPost(`/logistics/orders/${orderId}/updates`, data),
};
