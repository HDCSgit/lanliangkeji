import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package, Truck, CheckCircle, Clock, XCircle,
  CreditCard, RotateCcw, ChevronRight, FileText,
  AlertCircle, Image
} from 'lucide-react';
import { OrderStore } from '@/data/ecommerceStore';
import { VoucherStore } from '@/data/paymentGateway';
import { UserStore } from '@/data/userStore';
import type { Order, OrderStatus } from '@/types/ecommerce';

const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  const [voucherStatuses, setVoucherStatuses] = useState<Record<string, 'pending' | 'approved' | 'rejected' | null>>({});

  useEffect(() => {
    if (!UserStore.isLoggedIn()) {
      navigate('/login', { state: { from: '/orders' } });
      return;
    }
    loadOrders();
  }, [navigate]);

  const loadOrders = async () => {
    const allOrders = await OrderStore.get();
    setOrders(allOrders);

    // 加载对公转账凭证状态
    const statuses: Record<string, 'pending' | 'approved' | 'rejected' | null> = {};
    await Promise.all(
      allOrders.map(async (order) => {
        if (order.paymentMethod === 'bank_transfer') {
          const voucher = await VoucherStore.getByOrderId(order.id);
          if (voucher) {
            statuses[order.id] = voucher.status;
          }
        }
      })
    );
    setVoucherStatuses(statuses);
  };

  const filteredOrders = filter === 'all'
    ? orders
    : orders.filter((o) => o.status === filter);

  const statusConfig: Record<OrderStatus, { label: string; icon: any; color: string; bgColor: string }> = {
    pending_payment: { label: '待付款', icon: Clock, color: 'text-orange-600', bgColor: 'bg-orange-50' },
    paid: { label: '已付款', icon: CreditCard, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    processing: { label: '处理中', icon: Package, color: 'text-purple-600', bgColor: 'bg-purple-50' },
    shipped: { label: '已发货', icon: Truck, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
    in_transit: { label: '运输中', icon: Truck, color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
    delivered: { label: '已送达', icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-50' },
    completed: { label: '已完成', icon: CheckCircle, color: 'text-green-700', bgColor: 'bg-green-50' },
    cancelled: { label: '已取消', icon: XCircle, color: 'text-gray-600', bgColor: 'bg-gray-50' },
    refunded: { label: '已退款', icon: RotateCcw, color: 'text-red-600', bgColor: 'bg-red-50' },
  };

  // 获取对公转账订单的额外状态标签
  const getVoucherLabel = (order: Order) => {
    if (order.paymentMethod !== 'bank_transfer') return null;
    const vStatus = voucherStatuses[order.id];
    if (order.status === 'processing' && vStatus === 'pending') {
      return { label: '等待审核', color: 'text-orange-600', bgColor: 'bg-orange-100' };
    }
    if (order.status === 'paid' || vStatus === 'approved') {
      return { label: '审核通过', color: 'text-green-600', bgColor: 'bg-green-100' };
    }
    if (vStatus === 'rejected') {
      return { label: '审核不通过', color: 'text-red-600', bgColor: 'bg-red-100' };
    }
    return null;
  };

  const statusFilters: { value: OrderStatus | 'all'; label: string }[] = [
    { value: 'all', label: '全部' },
    { value: 'pending_payment', label: '待付款' },
    { value: 'processing', label: '处理中' },
    { value: 'paid', label: '待发货' },
    { value: 'shipped', label: '已发货' },
    { value: 'completed', label: '已完成' },
    { value: 'cancelled', label: '已取消' },
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen pt-20 bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-ocean-deep mb-6">我的订单</h1>

        {/* Status Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {statusFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                filter === f.value
                  ? 'bg-ocean-blue text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const config = statusConfig[order.status];
            const StatusIcon = config.icon;
            const voucherLabel = getVoucherLabel(order);
            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl shadow-card overflow-hidden"
              >
                {/* Order Header */}
                <div className="px-6 py-4 border-b bg-gray-50 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-4 text-sm flex-wrap">
                    <span className="text-gray-500">{formatDate(order.createdAt)}</span>
                    <span className="text-gray-400">|</span>
                    <span className="text-gray-600">订单号：{order.orderNo}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-1 ${config.color}`}>
                      <StatusIcon className="w-4 h-4" />
                      <span className="font-medium">{config.label}</span>
                    </div>
                    {voucherLabel && (
                      <span className={`px-2 py-0.5 rounded-full text-xs ${voucherLabel.bgColor} ${voucherLabel.color}`}>
                        {voucherLabel.label}
                      </span>
                    )}
                  </div>
                </div>

                {/* Order Items */}
                <div className="px-6 py-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex gap-4 py-3">
                      <img
                        src={item.productImage}
                        alt={item.productName}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium text-ocean-deep">{item.productName}</h3>
                        <p className="text-sm text-gray-500">
                          规格：{item.specName} ({item.unit}) x{item.quantity}
                        </p>
                        <p className="text-ocean-blue font-bold mt-1">
                          ¥{item.subtotal.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Payment Info */}
                {order.paymentMethod === 'bank_transfer' && (
                  <div className="px-6 py-3 bg-orange-50 border-t border-orange-100">
                    <div className="flex items-center gap-2 text-sm text-orange-700">
                      <FileText className="w-4 h-4" />
                      <span>支付方式：对公转账</span>
                      {voucherStatuses[order.id] === 'pending' && (
                        <span className="flex items-center gap-1 text-orange-600">
                          <Clock className="w-3 h-3" />
                          等待审核员审核
                        </span>
                      )}
                      {voucherStatuses[order.id] === 'rejected' && (
                        <span className="flex items-center gap-1 text-red-600">
                          <AlertCircle className="w-3 h-3" />
                          凭证未通过审核，可重新提交
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Order Footer */}
                <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between flex-wrap gap-4">
                  <span className="text-sm text-gray-500">
                    共{order.items.reduce((sum, i) => sum + i.quantity, 0)}件商品
                  </span>
                  <div className="flex items-center gap-4 flex-wrap">
                    <span className="text-gray-600">
                      实付：<span className="text-xl font-bold text-ocean-blue">¥{order.finalAmount.toFixed(2)}</span>
                    </span>
                    <div className="flex gap-2">
                      {order.status === 'pending_payment' && order.paymentMethod !== 'bank_transfer' && (
                        <button
                          onClick={() => navigate(`/payment/${order.id}`)}
                          className="px-4 py-2 bg-ocean-blue text-white rounded-lg text-sm hover:bg-ocean-deep transition-colors"
                        >
                          去支付
                        </button>
                      )}
                      {order.status === 'pending_payment' && order.paymentMethod === 'bank_transfer' && !voucherStatuses[order.id] && (
                        <button
                          onClick={() => navigate(`/payment/${order.id}`)}
                          className="px-4 py-2 bg-ocean-blue text-white rounded-lg text-sm hover:bg-ocean-deep transition-colors"
                        >
                          去支付
                        </button>
                      )}
                      {order.paymentMethod === 'bank_transfer' && voucherStatuses[order.id] === 'rejected' && (
                        <button
                          onClick={() => navigate(`/payment/${order.id}`)}
                          className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600 transition-colors flex items-center gap-1"
                        >
                          <Image className="w-4 h-4" />
                          重新上传凭证
                        </button>
                      )}
                      {order.paymentMethod === 'bank_transfer' && voucherStatuses[order.id] === 'pending' && (
                        <button
                          onClick={() => navigate(`/payment/${order.id}`)}
                          className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600 transition-colors flex items-center gap-1"
                        >
                          <FileText className="w-4 h-4" />
                          查看交易凭证
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/order/${order.id}`)}
                        className="flex items-center gap-1 text-ocean-blue text-sm hover:underline"
                      >
                        查看详情
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-16">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">暂无{filter !== 'all' ? statusConfig[filter as OrderStatus]?.label : ''}订单</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
