import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Package, Truck, CheckCircle, MapPin,
  CreditCard, ChevronLeft, Copy, Phone,
  FileText, Clock, Building2, XCircle
} from 'lucide-react';
import { OrderStore, LogisticsStore } from '@/data/ecommerceStore';
import { VoucherStore, PaymentGateway } from '@/data/paymentGateway';
import type { Order, OrderStatus, LogisticsInfo } from '@/types/ecommerce';
import type { BankTransferVoucher, ReceivableAccount } from '@/types/payment';

const OrderDetailPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [logistics, setLogistics] = useState<(LogisticsInfo & { express?: any }) | null>(null);
  const [voucher, setVoucher] = useState<BankTransferVoucher | null>(null);
  const [receivableAccount, setReceivableAccount] = useState<ReceivableAccount | null>(null);

  useEffect(() => {
    if (!orderId) {
      navigate('/orders');
      return;
    }
    loadData();
  }, [orderId, navigate]);

  const loadData = async () => {
    const found = await OrderStore.getById(orderId!);
    if (!found) {
      navigate('/orders');
      return;
    }
    setOrder(found);

    // 加载物流信息
    const log = await LogisticsStore.getByOrderId(orderId!);
    setLogistics(log || null);

    // 凭证直接从 order.vouchers 取(后端 get_order 已 selectinload)
    if (found.paymentMethod === 'bank_transfer' && found.vouchers && found.vouchers.length > 0) {
      // 取最新的一条(后端已按 submit_time desc)
      setVoucher(found.vouchers[0] as any);
    } else if (found.paymentMethod === 'bank_transfer') {
      // 兜底:VoucherStore 仍可工作
      try {
        const v = await VoucherStore.getByOrderId(orderId!);
        setVoucher(v || null);
      } catch {
        setVoucher(null);
      }
    }

    // 加载收款账户
    const account = await PaymentGateway.getReceivableAccount();
    setReceivableAccount(account);
  };

  const statusConfig: Record<OrderStatus, { label: string; color: string; bgColor: string }> = {
    pending_payment: { label: '待付款', color: 'text-orange-600', bgColor: 'bg-orange-50' },
    paid: { label: '已付款', color: 'text-blue-600', bgColor: 'bg-blue-50' },
    processing: { label: '处理中', color: 'text-purple-600', bgColor: 'bg-purple-50' },
    shipped: { label: '已发货', color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
    in_transit: { label: '运输中', color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
    delivered: { label: '已送达', color: 'text-green-600', bgColor: 'bg-green-50' },
    completed: { label: '已完成', color: 'text-green-700', bgColor: 'bg-green-50' },
    cancelled: { label: '已取消', color: 'text-gray-600', bgColor: 'bg-gray-50' },
    refunded: { label: '已退款', color: 'text-red-600', bgColor: 'bg-red-50' },
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const copyOrderNo = () => {
    if (order?.orderNo) {
      navigator.clipboard.writeText(order.orderNo);
      alert('订单号已复制');
    }
  };

  // 获取对公转账的显示状态
  const getBankTransferStatus = () => {
    if (!order || order.paymentMethod !== 'bank_transfer') return null;

    if (voucher) {
      if (voucher.status === 'pending') {
        return {
          label: '凭证审核中',
          description: '您已提交转账凭证，等待审核员审核',
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          icon: Clock,
        };
      }
      if (voucher.status === 'approved') {
        return {
          label: '审核通过',
          description: '转账凭证审核通过，等待发货',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          icon: CheckCircle,
        };
      }
      if (voucher.status === 'rejected') {
        return {
          label: '审核不通过',
          description: voucher.rejectReason ? `原因：${voucher.rejectReason}` : '凭证信息有误，请重新提交',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          icon: XCircle,
        };
      }
    }

    return {
      label: '待上传凭证',
      description: '请完成对公转账后上传凭证截图',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      icon: FileText,
    };
  };

  if (!order) return null;

  const config = statusConfig[order.status];
  const bankTransferStatus = getBankTransferStatus();

  return (
    <div className="min-h-screen pt-20 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/orders')}
          className="flex items-center gap-1 text-gray-600 hover:text-ocean-blue mb-6"
        >
          <ChevronLeft className="w-5 h-5" />
          返回订单列表
        </button>

        {/* Status Banner */}
        <div className={`${config.bgColor} rounded-2xl p-6 mb-6`}>
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className={`w-8 h-8 ${config.color}`} />
            <span className={`text-2xl font-bold ${config.color}`}>{config.label}</span>
          </div>
          <p className="text-gray-600">
            {order.status === 'pending_payment' && '请在72小时内完成支付并上传凭证，超时订单将自动取消'}
            {order.status === 'paid' && '订单已付款，商家正在准备发货'}
            {order.status === 'processing' && '订单处理中'}
            {order.status === 'shipped' && '商品已发出，请注意查收'}
            {order.status === 'completed' && '订单已完成，感谢您的购买'}
            {order.status === 'cancelled' && '订单已取消'}
          </p>
        </div>

        {/* Order Info */}
        <div className="bg-white rounded-2xl shadow-card p-6 mb-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
            <div>
              <p className="text-sm text-gray-500">订单编号</p>
              <div className="flex items-center gap-2">
                <span className="font-bold text-ocean-deep">{order.orderNo}</span>
                <button onClick={copyOrderNo} className="text-ocean-blue hover:text-ocean-deep">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">下单时间</p>
              <span className="text-ocean-deep">{formatDate(order.createdAt)}</span>
            </div>
          </div>

          {order.paymentMethod && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CreditCard className="w-4 h-4" />
              支付方式：{order.paymentMethod === 'wechat' ? '微信支付' : order.paymentMethod === 'alipay' ? '支付宝' : '对公转账'}
              {order.paymentTime && ` · ${formatDate(order.paymentTime)}`}
            </div>
          )}
        </div>

        {/* 对公转账凭证状态 */}
        {order.paymentMethod === 'bank_transfer' && bankTransferStatus && (
          <div className={`${bankTransferStatus.bgColor} rounded-2xl p-6 mb-6`}>
            <div className="flex items-center gap-3 mb-3">
              <bankTransferStatus.icon className={`w-6 h-6 ${bankTransferStatus.color}`} />
              <span className={`text-lg font-bold ${bankTransferStatus.color}`}>
                {bankTransferStatus.label}
              </span>
            </div>
            <p className="text-gray-600 text-sm mb-4">{bankTransferStatus.description}</p>

            {voucher && (
              <div className="space-y-2">
                <p className="text-sm text-gray-500">已提交的凭证：</p>
                <img
                  src={voucher.voucherImage}
                  alt="转账凭证"
                  className="w-full max-w-xs h-32 object-contain bg-white rounded-lg border"
                />
                {voucher.auditorName && (
                  <p className="text-xs text-gray-500 mt-2">
                    审核人：{voucher.auditorName}
                    {voucher.auditTime && ` · ${formatDate(voucher.auditTime)}`}
                  </p>
                )}
              </div>
            )}

            {/* 操作按钮 */}
            <div className="mt-4 flex gap-3">
              {(order.status === 'pending_payment' || (voucher?.status === 'rejected')) && (
                <button
                  onClick={() => navigate(`/payment/${order.id}`)}
                  className="px-4 py-2 bg-ocean-blue text-white rounded-lg text-sm hover:bg-ocean-deep transition-colors"
                >
                  {voucher?.status === 'rejected' ? '重新上传凭证' : '上传转账凭证'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* 对公转账收款信息 */}
        {order.paymentMethod === 'bank_transfer' && order.status === 'pending_payment' && receivableAccount && (
          <div className="bg-orange-50 rounded-2xl p-6 mb-6">
            <h3 className="font-bold text-ocean-deep mb-3 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-orange-500" />
              收款方账户信息
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">收款方</span>
                <span className="font-medium">{receivableAccount.accountName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">开户行</span>
                <span className="font-medium">{receivableAccount.bankName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">账号</span>
                <span className="font-medium">{receivableAccount.accountNumber}</span>
              </div>
              <div className="border-t border-orange-200 pt-2 mt-2">
                <p className="text-xs text-orange-600">
                  转账时请备注：{order.orderNo}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Logistics */}
        {logistics && (
          <div className="bg-white rounded-2xl shadow-card p-6 mb-6">
            <h2 className="text-lg font-bold text-ocean-deep mb-4 flex items-center gap-2">
              <Truck className="w-5 h-5 text-ocean-blue" />
              物流信息
            </h2>
            <div className="flex items-center gap-4 mb-4 p-4 bg-ocean-blue/5 rounded-xl">
              <div>
                <p className="text-sm text-gray-500">物流公司</p>
                <p className="font-medium text-ocean-deep">{logistics.carrier}</p>
              </div>
              <div className="w-px h-10 bg-gray-200" />
              <div>
                <p className="text-sm text-gray-500">运单号</p>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-ocean-deep">{logistics.trackingNumber}</p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(logistics.trackingNumber);
                      alert('运单号已复制');
                    }}
                    className="text-ocean-blue text-sm"
                  >
                    复制
                  </button>
                </div>
              </div>
            </div>

            {/* 实时物流轨迹 */}
            {logistics.express?.success && logistics.express.traces && (
              <div className="mb-4 p-4 bg-green-50 rounded-xl">
                <h3 className="text-sm font-medium text-green-700 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  实时物流动态
                  {logistics.express.is_mock && (
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                      模拟数据
                    </span>
                  )}
                  {logistics.express.source === 'sf_express' && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                      顺丰官方
                    </span>
                  )}
                  {logistics.express.source === 'kuaidi100' && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                      快递100
                    </span>
                  )}
                </h3>

                {/* 快递员信息（如果有） */}
                {logistics.express.courier && (
                  <div className="mb-3 p-3 bg-white rounded-lg border border-green-100">
                    <div className="flex items-center gap-2 text-sm">
                      <Truck className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-gray-700">快递员：</span>
                      <span className="text-ocean-deep">{logistics.express.courier.name}</span>
                      {logistics.express.courier.phone && (
                        <a
                          href={`tel:${logistics.express.courier.phone}`}
                          className="flex items-center gap-1 text-ocean-blue hover:text-ocean-deep ml-2"
                        >
                          <Phone className="w-3 h-3" />
                          {logistics.express.courier.phone}
                        </a>
                      )}
                    </div>
                  </div>
                )}

                <div className="relative pl-6">
                  <div className="absolute left-2 top-0 bottom-0 w-px bg-green-200" />
                  {logistics.express.traces.map((trace: any, index: number) => (
                    <div key={index} className="relative pb-4 last:pb-0">
                      <div className={`absolute left-0 w-3 h-3 rounded-full border-2 ${
                        index === 0 ? 'bg-green-500 border-green-500' : 'bg-white border-green-300'
                      }`} />
                      <div className="ml-4">
                        <p className={`text-sm ${index === 0 ? 'text-green-700 font-medium' : 'text-gray-600'}`}>
                          {trace.description}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {trace.time}
                          {trace.location && ` · ${trace.location}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="relative pl-6">
              <div className="absolute left-2 top-0 bottom-0 w-px bg-gray-200" />
              {logistics.updates.map((update, index) => (
                <div key={update.id} className="relative pb-6 last:pb-0">
                  <div className={`absolute left-0 w-4 h-4 rounded-full border-2 ${
                    index === 0 ? 'bg-ocean-blue border-ocean-blue' : 'bg-white border-gray-300'
                  }`} />
                  <div className="ml-4">
                    <p className={`font-medium ${index === 0 ? 'text-ocean-blue' : 'text-gray-600'}`}>
                      {update.status}
                    </p>
                    <p className="text-sm text-gray-500">{update.description}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {update.time ? formatDate(update.time) : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Shipping Address */}
        <div className="bg-white rounded-2xl shadow-card p-6 mb-6">
          <h2 className="text-lg font-bold text-ocean-deep mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-ocean-blue" />
            收货信息
          </h2>
          {order.shippingAddress && (
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-ocean-blue/10 flex items-center justify-center">
                <Phone className="w-5 h-5 text-ocean-blue" />
              </div>
              <div>
                <p className="font-medium text-ocean-deep">
                  {order.shippingAddress.name} {order.shippingAddress.phone}
                </p>
                <p className="text-gray-600 text-sm mt-1">
                  {order.shippingAddress.province} {order.shippingAddress.city}{' '}
                  {order.shippingAddress.district} {order.shippingAddress.detail}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Items */}
        <div className="bg-white rounded-2xl shadow-card p-6 mb-6">
          <h2 className="text-lg font-bold text-ocean-deep mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-ocean-blue" />
            商品明细
          </h2>
          <div className="space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex gap-4 py-4 border-b last:border-0">
                <img
                  src={item.productImage}
                  alt={item.productName}
                  className="w-24 h-24 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h3 className="font-medium text-ocean-deep">{item.productName}</h3>
                  <p className="text-sm text-gray-500">
                    规格：{item.specName} ({item.unit})
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-gray-500">x{item.quantity}</span>
                    <span className="text-ocean-blue font-bold">¥{item.subtotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Price Summary */}
        <div className="bg-white rounded-2xl shadow-card p-6">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>商品金额</span>
              <span>¥{order.totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>运费</span>
              <span>{order.shippingFee === 0 ? '免运费' : `¥${order.shippingFee.toFixed(2)}`}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-red-500">
                <span>优惠</span>
                <span>-¥{order.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between">
                <span className="font-bold text-ocean-deep">实付金额</span>
                <span className="text-2xl font-bold text-ocean-blue">¥{order.finalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
