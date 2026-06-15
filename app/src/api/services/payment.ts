import { apiGet, apiPost } from '@/api/client';
import type { PaymentMethod } from '@/types/ecommerce';
import type { PaymentOrder, BankTransferVoucher, ReceivableAccount } from '@/types/payment';

export const paymentApi = {
  createPayment: (data: { order_id: string; method: PaymentMethod }) =>
    apiPost<{ payment: PaymentOrder; receivableAccount?: any; message?: string; alipay?: any }>('/payments/create', data),
  getStatus: (paymentNo: string) => apiGet<PaymentOrder>(`/payments/${paymentNo}/status`),
  callback: (data: any) => apiPost('/payments/callback', data),
  getMethods: () => apiGet<{ method: string; name: string; enabled: boolean }[]>('/payments/methods'),
  getReceivableAccount: () => apiGet<ReceivableAccount>('/payments/receivable-account'),
  alipayQuery: (outTradeNo: string) => apiPost<{ paid: boolean; trade_status?: string; trade_no?: string }>('/payments/alipay/query', { out_trade_no: outTradeNo }),
};

export const voucherApi = {
  submit: (data: FormData) => apiPost<BankTransferVoucher>('/vouchers/', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getVouchers: () => apiGet<BankTransferVoucher[]>('/vouchers/'),
  getVoucher: (id: string) => apiGet<BankTransferVoucher>(`/vouchers/${id}`),
  audit: (id: string, data: any) => apiPost(`/vouchers/${id}/audit`, data),
};
