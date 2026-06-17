// 产品规格
export interface ProductSpec {
  id: string;
  name: string;
  unit: string; // kg, g, lb, etc.
  price: number; // 单价（元）
  stock: number; // 库存
  minOrder: number; // 最小订购量
  isActive: boolean;
}

// 购物车项
export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  specId: string;
  specName: string;
  unit: string;
  price: number; // 单价
  quantity: number; // 数量
  subtotal: number; // 小计
  addedAt: string;
  // 商品的运费规则(后管配置,前端 CheckoutPage 用它实时算运费预览)
  shippingEnabled: boolean;
  shippingInitialFee: number;
  shippingPerUnitCount: number;
  shippingPerUnitFee: number;
}

// 收货地址
export interface ShippingAddress {
  id: string;
  name: string; // 收件人姓名
  phone: string; // 手机号
  province: string;
  city: string;
  district: string;
  detail: string; // 详细地址
  isDefault: boolean;
  createdAt: string;
}

// 订单项
export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  specId: string;
  specName: string;
  unit: string;
  price: number;
  quantity: number;
  subtotal: number;
}

// 订单状态
export type OrderStatus =
  | 'pending_payment' // 待付款
  | 'paid' // 已付款
  | 'processing' // 处理中
  | 'shipped' // 已发货
  | 'in_transit' // 运输中
  | 'delivered' // 已送达
  | 'completed' // 已完成
  | 'cancelled' // 已取消
  | 'refunded'; // 已退款

// 支付方式
export type PaymentMethod = 'wechat' | 'alipay' | 'bank_transfer';

// 物流信息
export interface LogisticsInfo {
  id: string;
  orderId: string;
  trackingNumber: string; // 物流单号
  carrier: string; // 物流公司
  status: string;
  updates: LogisticsUpdate[];
  createdAt: string;
  updatedAt: string;
  // 后端动态注入的实时查询结果(来自快递公司接口)
  express?: {
    success?: boolean;
    status?: string;
    source?: string;
    is_mock?: boolean;
    traces?: Array<{
      time?: string;
      description?: string;
      location?: string;
    }>;
    message?: string;
  };
}

// 交易凭证(对公转账时用户上传的转账截图)
export interface Voucher {
  id: string;
  orderId: string;
  userId: string;
  userName: string;
  userPhone: string;
  amount: number;
  // 后端 alias="image" -> 前端用 voucherImage 接收
  voucherImage: string;
  status: 'pending' | 'approved' | 'rejected';
  submitTime: string;
  auditTime?: string;
  auditorId?: string;
  auditorName?: string;
  rejectReason?: string;
}

// 支付流水(扫码支付/对公转账都会产生一条 PaymentOrder)
export interface PaymentFlow {
  id: string;
  paymentNo: string; // 支付流水号
  method: 'wechat' | 'alipay' | 'bank_transfer';
  amount: number;
  status: 'pending' | 'paid' | 'failed' | 'refunded' | 'expired' | string;
  qrCodeUrl?: string;
  statusUrl?: string;
  paidAt?: string;
  expiredAt?: string;
  createdAt?: string;
}

export interface LogisticsUpdate {
  id: string;
  time: string;
  status: string;
  description: string;
  location: string;
}

// 订单
export interface Order {
  id: string;
  orderNo: string; // 订单编号
  items: OrderItem[];
  totalAmount: number; // 商品总金额
  shippingFee: number; // 运费
  discount: number; // 优惠金额
  finalAmount: number; // 应付金额
  status: OrderStatus;
  paymentMethod?: PaymentMethod;
  paymentTime?: string;
  shippingAddress: ShippingAddress;
  logistics?: LogisticsInfo;
  vouchers?: Voucher[]; // 交易凭证(对公转账时上传)
  payments?: PaymentFlow[]; // 支付流水(扫码/对公转账)
  remark?: string; // 订单备注
  createdAt: string;
  updatedAt: string;
}

// 用户账单
export interface UserBill {
  id: string;
  orderId: string;
  orderNo: string;
  type: 'expense' | 'refund'; // 支出/退款
  amount: number;
  paymentMethod: PaymentMethod;
  description: string;
  status: 'success' | 'pending' | 'failed';
  createdAt: string;
}

// 收款账户
export interface ReceivableAccount {
  accountName: string;     // 开户名
  bankName: string;        // 开户行
  accountNumber: string;   // 账号
  updatedAt?: string;
  updatedBy?: string;
}

// 用户信息
export interface User {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  addresses: ShippingAddress[];
  orders: Order[];
  bills: UserBill[];
  createdAt: string;
}

// 支付结果
export interface PaymentResult {
  success: boolean;
  orderId: string;
  paymentUrl?: string; // 支付链接（扫码支付用）
  qrCode?: string; // 支付二维码
  message: string;
}

// 后台物流管理
export interface LogisticsManagement {
  orderId: string;
  trackingNumber: string;
  carrier: string;
  updates: {
    time: string;
    description: string;
    location: string;
  }[];
}

// 产品扩展（带规格）
export interface ProductWithSpecs {
  id: string;
  name: string;
  category: string;
  description: string;
  image: string;
  specs: ProductSpec[];
  features: string[];
  isActive: boolean;
  order: number;
  // 运费规则(后管商品编辑配置)
  shippingEnabled: boolean;
  shippingInitialFee: number;
  shippingPerUnitCount: number;
  shippingPerUnitFee: number;
}
