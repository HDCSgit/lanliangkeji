import type { PaymentGatewayConfig, PaymentOrder, BankTransferVoucher, ReceivableAccount } from '@/types/payment';
import { paymentApi, voucherApi } from '@/api/services/payment';

const STORAGE_KEY = 'lanliang_payment_gateway';

// 默认配置 - 所有支付方式默认启用，方便用户使用
export const defaultGatewayConfig: PaymentGatewayConfig = {
  wechatPay: {
    enabled: true,
    mchId: '',
    appId: '',
    apiKey: '',
    notifyUrl: '',
  },
  alipay: {
    enabled: true,
    appId: '',
    privateKey: '',
    publicKey: '',
    notifyUrl: '',
  },
  bankTransfer: {
    enabled: true,
    accountName: '福州蓝粮海洋生物科技有限公司',
    bankName: '中国工商银行福州马尾支行',
    accountNumber: '1402 0234 0900 1234 567',
  },
};

// 收款账户内存缓存（站点级配置,极不常变）
// 首次异步预加载,后续 getReceivableAccount 同步返回缓存,保证支付页秒开
let _receivableAccountCache: ReceivableAccount | null = null;
let _receivableAccountPromise: Promise<ReceivableAccount> | null = null;

export const PaymentGateway = {
  // 获取配置（仅本地前端配置，后端真实密钥不返回）
  getConfig(): PaymentGatewayConfig {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : { ...defaultGatewayConfig };
  },

  // 保存配置
  saveConfig(config: PaymentGatewayConfig): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  },

  // 获取可用支付方式
  async getAvailableMethods(): Promise<{ id: string; name: string; enabled: boolean }[]> {
    try {
      const methods = await paymentApi.getMethods();
      return methods.map((m: any) => ({
        id: m.method,
        name: m.name,
        enabled: m.enabled,
      }));
    } catch {
      const config = this.getConfig();
      return [
        { id: 'wechat', name: '微信支付', enabled: config.wechatPay.enabled },
        { id: 'alipay', name: '支付宝', enabled: config.alipay.enabled },
        { id: 'bank_transfer', name: '对公转账', enabled: config.bankTransfer.enabled },
      ];
    }
  },

  // --- 收款账户管理（审核员可配置） ---

  // 获取收款账户（带内存缓存,秒级返回）
  async getReceivableAccount(): Promise<ReceivableAccount> {
    // 命中缓存:直接同步返回
    if (_receivableAccountCache) {
      return _receivableAccountCache;
    }
    // 正在预加载:共享同一个 Promise,避免并发重复请求
    if (_receivableAccountPromise) {
      return _receivableAccountPromise;
    }
    // 首次加载
    _receivableAccountPromise = (async () => {
      try {
        const account: any = await paymentApi.getReceivableAccount();
        const normalized: ReceivableAccount = {
          accountName: account.accountName ?? account.account_name ?? '',
          bankName: account.bankName ?? account.bank_name ?? '',
          accountNumber: account.accountNumber ?? account.account_number ?? '',
          updatedAt: account.updatedAt ?? account.updated_at,
          updatedBy: account.updatedBy ?? account.updated_by,
        };
        _receivableAccountCache = normalized;
        return normalized;
      } catch (e) {
        console.warn('PaymentGateway.getReceivableAccount fallback to local config:', e);
        const config = this.getConfig();
        const fallback: ReceivableAccount = {
          accountName: config.bankTransfer.accountName,
          bankName: config.bankTransfer.bankName,
          accountNumber: config.bankTransfer.accountNumber,
        };
        _receivableAccountCache = fallback;
        return fallback;
      } finally {
        // 释放并发控制句柄(下次刷新时重建)
        // 留一段时间让并发的 caller 都能拿到同一个 Promise
        setTimeout(() => {
          _receivableAccountPromise = null;
        }, 1000);
      }
    })();
    return _receivableAccountPromise;
  },

  // 主动预加载(应用启动后立即调用一次,后续调用都命中缓存)
  async prefetchReceivableAccount(): Promise<void> {
    try {
      await this.getReceivableAccount();
    } catch {
      // 静默失败,后续仍会重试
    }
  },

  // 强制刷新缓存(审核员修改账户后调用)
  invalidateReceivableAccountCache(): void {
    _receivableAccountCache = null;
    _receivableAccountPromise = null;
  },

  // 保存收款账户（审核员权限）- 后端暂无单独 update，暂存在本地
  saveReceivableAccount(account: ReceivableAccount): void {
    const config = this.getConfig();
    config.bankTransfer.accountName = account.accountName;
    config.bankTransfer.bankName = account.bankName;
    config.bankTransfer.accountNumber = account.accountNumber;
    this.saveConfig(config);
  },
};

// 支付订单管理（向后端查询）
export const PaymentOrderStore = {
  async getByPaymentNo(paymentNo: string): Promise<PaymentOrder | null> {
    try {
      return await paymentApi.getStatus(paymentNo);
    } catch {
      return null;
    }
  },

  async getByOrderId(_orderId: string): Promise<PaymentOrder | null> {
    return null;
  },

  // ⚠️ 安全修复:移除 PaymentOrderStore.updateStatus
  // 原实现调 paymentApi.callback() 把订单 mark as paid,这就是"模拟支付"后门
  // 支付状态必须由支付宝/微信异步通知接口更新,前端不能主动 mark as paid

  generatePaymentNo(): string {
    return '';
  },
};

// 对公转账凭证管理
export const VoucherStore = {
  // 获取所有凭证（管理员/审核员返回待审核，普通用户返回自己的）
  async getAll(): Promise<BankTransferVoucher[]> {
    try {
      return await voucherApi.getVouchers();
    } catch (error) {
      console.error('获取凭证失败:', error);
      return [];
    }
  },

  // 提交凭证
  async submit(voucher: {
    orderId: string;
    amount: number;
    voucherImage: string;
  }): Promise<BankTransferVoucher> {
    const formData = new FormData();
    formData.append('order_id', voucher.orderId);
    formData.append('amount', String(voucher.amount));

    let file: File;
    if (voucher.voucherImage.startsWith('data:')) {
      const res = await fetch(voucher.voucherImage);
      const blob = await res.blob();
      file = new File([blob], 'voucher.png', { type: blob.type || 'image/png' });
    } else {
      file = new File([], 'voucher.png', { type: 'image/png' });
    }
    formData.append('image', file);

    const result = await voucherApi.submit(formData);
    // 后端返回字段名为 image，但前端类型使用 voucherImage
    return {
      ...result,
      voucherImage: (result as any).image || result.voucherImage || '',
    };
  },

  // 获取订单的凭证
  async getByOrderId(orderId: string): Promise<BankTransferVoucher | null> {
    try {
      const vouchers = await this.getAll();
      const raw = vouchers.find((v) => v.orderId === orderId);
      if (!raw) return null;
      return this.normalizeVoucher(raw);
    } catch {
      return null;
    }
  },

  // 规范化 voucher(后端字段名兼容:image / voucher_image)
  normalizeVoucher(v: any): BankTransferVoucher {
    if (!v) return v;
    return {
      ...v,
      voucherImage: v.voucherImage ?? v.voucher_image ?? v.image ?? '',
      orderNo: v.orderNo ?? v.order_no ?? '',
    };
  },

  // 审核凭证
  async audit(
    voucherId: string,
    action: 'approved' | 'rejected',
    rejectReason?: string
  ): Promise<void> {
    await voucherApi.audit(voucherId, {
      action,
      rejectReason: action === 'rejected' ? rejectReason : undefined,
    });
  },

  // 检查凭证是否过期
  isExpired(voucher: BankTransferVoucher): boolean {
    return new Date() > new Date(voucher.expiryTime);
  },

  // 获取剩余时间（毫秒）
  getRemainingTime(voucher: BankTransferVoucher): number {
    return Math.max(0, new Date(voucher.expiryTime).getTime() - Date.now());
  },

  // 获取所有待审核的凭证（审核员用）
  async getPending(): Promise<BankTransferVoucher[]> {
    const vouchers = await this.getAll();
    return vouchers.filter((v) => v.status === 'pending');
  },
};

// 支付API
export const PaymentAPI = {
  // 创建支付订单
  async createPayment(
    orderId: string,
    _orderNo: string,
    _amount: number,
    method: 'wechat' | 'alipay' | 'bank_transfer',
    _description: string
  ): Promise<{
    success: boolean;
    qrCode?: string;
    payUrl?: string;
    paymentNo: string;
    message: string;
    receivableAccount?: any;
    alipay?: { mode: 'real' | 'mock'; configured: boolean; trade_url?: string; tradeUrl?: string; form_html?: string; formHtml?: string };
  }> {
    try {
      const result = await paymentApi.createPayment({ order_id: orderId, method });
      const payment: PaymentOrder = result.payment;
      return {
        success: true,
        qrCode: payment.qrCode || undefined,
        payUrl: payment.payUrl || undefined,
        paymentNo: payment.paymentNo,
        message: result.message || '支付订单创建成功',
        receivableAccount: result.receivableAccount,
        alipay: (result as any).alipay,  // 后端只对 alipay 填充
      };
    } catch (error: any) {
      return {
        success: false,
        paymentNo: '',
        message: error.message || '支付订单创建失败',
      };
    }
  },

  // 主动查询支付宝订单(用于轮询 / 跳转后确认)
  async alipayQuery(outTradeNo: string): Promise<{ paid: boolean; tradeStatus?: string; tradeNo?: string; message?: string }> {
    try {
      const r: any = await paymentApi.alipayQuery(outTradeNo);
      return {
        paid: !!r.paid,
        tradeStatus: r.trade_status || r.tradeStatus,
        tradeNo: r.trade_no || r.tradeNo,
        message: r.message,
      };
    } catch (e: any) {
      return { paid: false, message: e?.message || '查询失败' };
    }
  },

  // 查询支付状态（依赖后端判断是否过期，避免本地时区解析差异）
  // 关键：本地 PENDING 时，主动向支付宝发起一次 query（即使用户已支付、notify 未及时到达）
  async queryPaymentStatus(paymentNo: string): Promise<'pending' | 'paid' | 'failed' | 'expired'> {
    try {
      const payment = await PaymentOrderStore.getByPaymentNo(paymentNo);
      if (!payment) return 'failed';
      if (payment.status === 'paid') return 'paid';
      if (payment.status === 'failed') return 'failed';
      if (payment.status === 'expired') return 'expired';

      // 本地仍 PENDING：可能是支付宝 notify 延迟或漏发，主动 query 一次
      if (payment.status === 'pending') {
        const q = await this.alipayQuery(paymentNo);
        if (q.paid) return 'paid';
        // 兜底：query 接口本身成功，但表示未支付，可能是 expired
        if (q.tradeStatus === 'TRADE_CLOSED' || q.tradeStatus === 'TRADE_FINISHED') {
          return q.tradeStatus === 'TRADE_FINISHED' ? 'paid' : 'expired';
        }
      }
      return 'pending';
    } catch {
      return 'failed';
    }
  },

  // ⚠️ 安全修复:移除前端 handleCallback 调用入口
  // 支付宝/微信的支付结果必须由支付平台异步回调后端,前端不能直接 mark as paid
  // 否则任何拿到 paymentNo 的人都能伪造支付成功
};
