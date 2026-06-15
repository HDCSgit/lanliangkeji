import type {
  CartItem,
  ShippingAddress,
  Order,
  OrderStatus,
  UserBill,
  PaymentMethod,
  LogisticsInfo,
} from '@/types/ecommerce';
import { cartApi, orderApi, billApi, logisticsApi } from '@/api/services/ecommerce';

// ==================== 购物车 ====================
export const CartStore = {
  async get(): Promise<CartItem[]> {
    try {
      return await cartApi.getCart();
    } catch (error) {
      console.error('获取购物车失败:', error);
      return [];
    }
  },

  async add(item: Omit<CartItem, 'id' | 'addedAt' | 'subtotal'> & { quantity: number }): Promise<void> {
    await cartApi.addToCart({
      product_id: item.productId,
      spec_id: item.specId,
      quantity: item.quantity,
    });
  },

  async updateQuantity(itemId: string, quantity: number): Promise<void> {
    await cartApi.updateCartItem(itemId, { quantity });
  },

  async remove(itemId: string): Promise<void> {
    await cartApi.removeCartItem(itemId);
  },

  async clear(): Promise<void> {
    await cartApi.clearCart();
  },

  async getCount(): Promise<number> {
    const items = await this.get();
    return items.reduce((sum, item) => sum + item.quantity, 0);
  },

  async getTotal(): Promise<number> {
    const items = await this.get();
    return items.reduce((sum, item) => sum + item.subtotal, 0);
  },
};

// ==================== 收货地址 ====================
export const AddressStore = {
  async get(): Promise<ShippingAddress[]> {
    try {
      const { usersApi } = await import('@/api/services/users');
      return await usersApi.getAddresses();
    } catch {
      return [];
    }
  },

  async add(address: ShippingAddress): Promise<void> {
    const { usersApi } = await import('@/api/services/users');
    await usersApi.addAddress(address);
  },

  async update(address: ShippingAddress): Promise<void> {
    const { usersApi } = await import('@/api/services/users');
    await usersApi.updateAddress(address.id, address);
  },

  async remove(id: string): Promise<void> {
    const { usersApi } = await import('@/api/services/users');
    await usersApi.deleteAddress(id);
  },

  async getDefault(): Promise<ShippingAddress | null> {
    try {
      const { usersApi } = await import('@/api/services/users');
      return await usersApi.getDefaultAddress();
    } catch {
      const addresses = await this.get();
      return addresses.find((a) => a.isDefault) || addresses[0] || null;
    }
  },
};

// ==================== 订单 ====================
export const OrderStore = {
  async get(): Promise<Order[]> {
    try {
      return await orderApi.getOrders();
    } catch (error) {
      console.error('获取订单失败:', error);
      return [];
    }
  },

  async create(order: Partial<Order>): Promise<Order> {
    return await orderApi.createOrder(order);
  },

  async update(_order: Order): Promise<void> {
    console.warn('OrderStore.update not implemented in API mode');
  },

  async updateStatus(orderId: string, status: OrderStatus, trackingNumber?: string, carrier?: string): Promise<void> {
    const payload: any = { status };
    if (trackingNumber) payload.tracking_number = trackingNumber;
    if (carrier) payload.carrier = carrier;
    await orderApi.updateOrderStatus(orderId, payload);
  },

  async getById(orderId: string): Promise<Order | null> {
    try {
      return await orderApi.getOrder(orderId);
    } catch (error) {
      console.error('获取订单详情失败:', error);
      return null;
    }
  },

  async getByNo(orderNo: string): Promise<Order | null> {
    const orders = await this.get();
    return orders.find((o) => o.orderNo === orderNo) || null;
  },

  generateOrderNo(): string {
    return '';
  },
};

// ==================== 账单 ====================
export const BillStore = {
  async get(): Promise<UserBill[]> {
    try {
      return await billApi.getBills();
    } catch (error) {
      console.error('获取账单失败:', error);
      return [];
    }
  },

  async add(_bill: UserBill): Promise<void> {
    console.warn('BillStore.add not implemented in API mode');
  },

  async getByOrderId(orderId: string): Promise<UserBill | null> {
    const bills = await this.get();
    return bills.find((b) => b.orderId === orderId) || null;
  },
};

// ==================== 物流 ====================
export const LogisticsStore = {
  async get(): Promise<LogisticsInfo[]> {
    return [];
  },

  async add(_info: LogisticsInfo): Promise<void> {
    console.warn('LogisticsStore.add not implemented in API mode');
  },

  async update(_info: LogisticsInfo): Promise<void> {
    console.warn('LogisticsStore.update not implemented in API mode');
  },

  async getByOrderId(orderId: string): Promise<(LogisticsInfo & { express?: any }) | null> {
    try {
      return await logisticsApi.getLogistics(orderId);
    } catch (error) {
      console.error('获取物流失败:', error);
      return null;
    }
  },
};

// ==================== 支付模拟 ====================
export const PaymentService = {
  async processPayment(
    orderId: string,
    _amount: number,
    method: PaymentMethod
  ): Promise<{ success: boolean; message: string; paymentTime: string }> {
    try {
      const { paymentApi } = await import('@/api/services/payment');
      const result = await paymentApi.createPayment({ order_id: orderId, method });
      return {
        success: true,
        message: result.message || '支付订单创建成功',
        paymentTime: '',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || '支付失败',
        paymentTime: '',
      };
    }
  },

  generatePaymentUrl(_orderNo: string, _amount: number, _method: PaymentMethod): string {
    return '';
  },
};

// ==================== 物流模拟数据 ====================
export const LogisticsService = {
  generateMockUpdates(
    _trackingNumber: string,
    _carrier: string,
    orderTime: string
  ) {
    return [
      { time: orderTime, description: '订单已创建，等待商家发货', location: '福州市' },
      { time: new Date(Date.now() - 3600000 * 2).toISOString(), description: '商家已揽收，准备发货', location: '福州市马尾区' },
      { time: new Date(Date.now() - 3600000).toISOString(), description: '快件已到达福州转运中心', location: '福州市转运中心' },
      { time: new Date().toISOString(), description: '快件已从福州转运中心发出，准备发往下一站', location: '福州市转运中心' },
    ];
  },
};

// ==================== 导出所有 ====================
export const EcommerceStore = {
  cart: CartStore,
  address: AddressStore,
  order: OrderStore,
  bill: BillStore,
  logistics: LogisticsStore,
  payment: PaymentService,
  logisticsService: LogisticsService,

  init(): void {},
  clearAll(): void {},
};

export default EcommerceStore;
