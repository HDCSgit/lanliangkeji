// 支付网关配置
export interface PaymentGatewayConfig {
  // 微信支付
  wechatPay: {
    enabled: boolean;
    mchId: string;      // 商户号
    appId: string;      // 应用ID
    apiKey: string;     // API密钥
    notifyUrl: string;  // 回调地址
  };
  // 支付宝
  alipay: {
    enabled: boolean;
    appId: string;      // 应用ID
    privateKey: string; // 应用私钥
    publicKey: string;  // 支付宝公钥
    notifyUrl: string;  // 回调地址
  };
  // 银行转账
  bankTransfer: {
    enabled: boolean;
    accountName: string;    // 开户名
    bankName: string;       // 开户行
    accountNumber: string;  // 账号
  };
}

// 支付订单
export interface PaymentOrder {
  id: string;
  orderId: string;
  orderNo: string;
  paymentNo: string;      // 支付流水号
  paymentMethod: 'wechat' | 'alipay' | 'bank_transfer';
  amount: number;
  status: 'pending' | 'paid' | 'failed' | 'expired' | 'refunded';
  qrCode?: string;        // 支付二维码URL
  payUrl?: string;        // 支付跳转URL
  paidAt?: string;
  expiredAt: string;
  createdAt: string;
}

// 对公转账凭证
export interface BankTransferVoucher {
  id: string;
  orderId: string;
  orderNo: string;
  userId: string;
  userName: string;
  userPhone: string;
  amount: number;
  voucherImage: string;      // 凭证截图（base64或URL）
  status: 'pending' | 'approved' | 'rejected';  // 审核状态
  submitTime: string;        // 提交时间
  auditTime?: string;        // 审核时间
  auditorId?: string;        // 审核员ID
  auditorName?: string;      // 审核员姓名
  rejectReason?: string;     // 拒绝原因
  expiryTime: string;        // 凭证上传截止时间（72小时）
}

// 审核记录
export interface AuditRecord {
  id: string;
  voucherId: string;
  orderId: string;
  auditorId: string;
  auditorName: string;
  action: 'approved' | 'rejected';
  reason?: string;
  createdAt: string;
}

// 收款账户（由审核员配置）
export interface ReceivableAccount {
  accountName: string;     // 开户名
  bankName: string;        // 开户行
  accountNumber: string;   // 账号
  updatedAt?: string;
  updatedBy?: string;
}

// 支付回调通知
export interface PaymentCallback {
  paymentNo: string;
  orderNo: string;
  transactionId: string;  // 第三方支付流水号
  amount: number;
  status: 'success' | 'failed';
  paidAt: string;
  sign: string;           // 签名
}
