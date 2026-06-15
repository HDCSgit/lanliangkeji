import React, { useState, useEffect } from 'react';
import {
  Search, Truck, Eye,
  XCircle, RefreshCw, CheckCircle2, AlertCircle, CreditCard
} from 'lucide-react';
import { OrderStore, LogisticsStore } from '@/data/ecommerceStore';
import { orderApi } from '@/api/services/ecommerce';
import type { Order, OrderStatus, LogisticsInfo, PaymentFlow } from '@/types/ecommerce';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  // 日期范围(开始/结束),留空表示不限
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isLogisticsOpen, setIsLogisticsOpen] = useState(false);
  const [logisticsForm, setLogisticsForm] = useState({
    trackingNumber: '',
    carrier: '',
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  // 物流详情状态
  const [logisticsDetail, setLogisticsDetail] = useState<LogisticsInfo | null>(null);
  const [logisticsLoading, setLogisticsLoading] = useState(false);
  const [paymentFlows, setPaymentFlows] = useState<PaymentFlow[]>([]);
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    let filtered = orders;
    if (statusFilter !== 'all') {
      filtered = filtered.filter((o) => o.status === statusFilter);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.orderNo.toLowerCase().includes(q) ||
          (o.shippingAddress?.name || '').toLowerCase().includes(q) ||
          (o.shippingAddress?.phone || '').includes(searchQuery)
      );
    }
    // 日期范围筛选
    if (dateFrom) {
      const fromTs = new Date(dateFrom).getTime();
      filtered = filtered.filter((o) => new Date(o.createdAt).getTime() >= fromTs);
    }
    if (dateTo) {
      // 包含 dateTo 当天:把到 23:59:59
      const toTs = new Date(dateTo).getTime() + 24 * 60 * 60 * 1000 - 1;
      filtered = filtered.filter((o) => new Date(o.createdAt).getTime() <= toTs);
    }
    setFilteredOrders(filtered);
  }, [searchQuery, statusFilter, orders, dateFrom, dateTo]);

  const loadOrders = async () => {
    const loaded = (await OrderStore.get()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    setOrders(loaded);
    setFilteredOrders(loaded);
  };

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await OrderStore.updateStatus(orderId, status);
      await loadOrders();
      // 同步刷新当前打开的详情
      if (isDetailOpen && selectedOrder?.id === orderId) {
        const updated = orders.find((o) => o.id === orderId);
        if (updated) setSelectedOrder(updated);
      }
      setMessage({ type: 'success', text: `订单状态已更新为: ${statusConfig[status]?.label || status}` });
    } catch (e: any) {
      setMessage({ type: 'error', text: e?.message || '状态更新失败' });
    }
  };

  // 后管取消订单(带二次确认)
  const cancelOrder = async (order: Order) => {
    if (order.status === 'cancelled') return;
    const ok = window.confirm(
      `确认要取消订单 ${order.orderNo} 吗?\n\n` +
      `• 取消后状态变为"已取消"\n` +
      `• 客户和审核员看到的订单状态会同步更新\n` +
      `• 已发货/已签收订单请先与客户沟通`
    );
    if (!ok) return;
    await updateStatus(order.id, 'cancelled');
  };

  const handleAddLogistics = async () => {
    if (!selectedOrder) {
      setMessage({ type: 'error', text: '请先选择订单' });
      return;
    }
    if (!logisticsForm.trackingNumber.trim() || !logisticsForm.carrier) {
      setMessage({ type: 'error', text: '请填写物流公司和运单号' });
      return;
    }
    try {
      await OrderStore.updateStatus(
        selectedOrder.id,
        'shipped',
        logisticsForm.trackingNumber.trim(),
        logisticsForm.carrier,
      );
      await loadOrders();
      setIsLogisticsOpen(false);
      setLogisticsForm({ trackingNumber: '', carrier: '' });
      // 顶部持续提示 + 自动消失 toast(显眼)
      setMessage({ type: 'success', text: `已发货: 订单 ${selectedOrder.orderNo} - ${logisticsForm.carrier} ${logisticsForm.trackingNumber.trim()}` });
      setToast({ type: 'success', text: '发货成功！可点击订单查看物流动态' });
      setTimeout(() => setToast(null), 4000);
      // 如果详情在开,刷新物流
      if (isDetailOpen) {
        void loadLogisticsDetail(selectedOrder.id);
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.message || '发货失败，请稍后重试' });
      setToast({ type: 'error', text: error?.message || '发货失败' });
      setTimeout(() => setToast(null), 4000);
    }
  };

  const openOrderDetail = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
    // 打开时主动拉一次物流 + 支付流水
    void loadLogisticsDetail(order.id);
    void loadPaymentFlows(order.id);
  };

  const loadLogisticsDetail = async (orderId: string) => {
    setLogisticsLoading(true);
    setLogisticsDetail(null);
    try {
      const data = await LogisticsStore.getByOrderId(orderId);
      setLogisticsDetail(data);
    } catch (err) {
      // 拉失败也无所谓,UI 显示空态
      setLogisticsDetail(null);
    } finally {
      setLogisticsLoading(false);
    }
  };

  const refreshLogistics = async () => {
    if (!selectedOrder) return;
    await loadLogisticsDetail(selectedOrder.id);
  };

  const loadPaymentFlows = async (orderId: string) => {
    setPaymentLoading(true);
    setPaymentFlows([]);
    try {
      const data = await orderApi.listPayments(orderId);
      setPaymentFlows(Array.isArray(data) ? data : []);
    } catch (err) {
      setPaymentFlows([]);
    } finally {
      setPaymentLoading(false);
    }
  };

  const openLogisticsDialog = (order: Order) => {
    setSelectedOrder(order);
    setIsLogisticsOpen(true);
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

  const statusFilters: { value: OrderStatus | 'all'; label: string }[] = [
    { value: 'all', label: '全部' },
    { value: 'pending_payment', label: '待付款' },
    { value: 'paid', label: '已付款' },
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
    <div className="space-y-6">
      {/* Message */}
      {message && (
        <div
          className={`rounded-xl px-4 py-3 text-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
          onClick={() => setMessage(null)}
          role="alert"
        >
          {message.text}
        </div>
      )}

      {/* Toast - 4 秒后自动消失,更醒目 */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-2 rounded-xl px-5 py-3 shadow-2xl text-sm font-medium ${
            toast.type === 'success'
              ? 'bg-green-500 text-white'
              : 'bg-red-500 text-white'
          }`}
          role="alert"
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          {toast.text}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ocean-deep">订单管理</h1>
          <p className="text-gray-500">管理用户订单和物流</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索订单号/收件人/手机..."
            className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none w-64"
          />
        </div>
      </div>

      {/* 日期范围筛选 */}
      <div className="flex flex-wrap items-end gap-3 bg-white rounded-xl shadow-card p-3">
        <div className="flex flex-col">
          <label className="text-xs text-gray-500 mb-1">开始日期</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none text-sm"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-gray-500 mb-1">结束日期</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none text-sm"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => { setDateFrom(''); setDateTo(''); }}
          disabled={!dateFrom && !dateTo}
        >
          清除日期
        </Button>
        <div className="text-xs text-gray-400 ml-auto">
          {filteredOrders.length} / {orders.length} 条
        </div>
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-2">
        {statusFilters.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              statusFilter === f.value
                ? 'bg-ocean-blue text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">订单号</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">商品</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">收货人</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">金额</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">状态</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredOrders.map((order) => {
                const config = statusConfig[order.status];
                return (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-ocean-deep text-sm">{order.orderNo}</p>
                      <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {order.items.slice(0, 2).map((item) => (
                          <img
                            key={item.id}
                            src={item.productImage}
                            alt={item.productName}
                            className="w-10 h-10 object-cover rounded"
                          />
                        ))}
                        {order.items.length > 2 && (
                          <span className="text-xs text-gray-500">+{order.items.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {order.shippingAddress?.name || '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-ocean-blue">
                      ¥{order.finalAmount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${config.bgColor} ${config.color}`}>
                        {config.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openOrderDetail(order)}
                          className="p-1.5 hover:bg-ocean-blue/10 text-ocean-blue rounded"
                          title="查看详情"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {(order.status === 'paid' || order.status === 'processing') && (
                          <button
                            onClick={() => openLogisticsDialog(order)}
                            className="p-1.5 hover:bg-indigo-50 text-indigo-600 rounded"
                            title="发货"
                          >
                            <Truck className="w-4 h-4" />
                          </button>
                        )}
                        {order.status === 'pending_payment' && (
                          <button
                            onClick={() => cancelOrder(order)}
                            className="p-1.5 hover:bg-red-50 text-red-500 rounded"
                            title="取消订单"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                        {/* 其他可取消的状态(后管兜底):已付款未发货 / 处理中 */}
                        {(order.status === 'paid' || order.status === 'processing') && (
                          <button
                            onClick={() => cancelOrder(order)}
                            className="p-1.5 hover:bg-red-50 text-red-500 rounded"
                            title="取消订单"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredOrders.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            暂无订单
          </div>
        )}
      </div>

      {/* Order Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>订单详情</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">订单号：</span>
                  <span className="font-medium">{selectedOrder.orderNo}</span>
                </div>
                <div>
                  <span className="text-gray-500">下单时间：</span>
                  <span>{formatDate(selectedOrder.createdAt)}</span>
                </div>
              </div>

              {/* Items */}
              <div>
                <h4 className="font-medium mb-2">商品明细</h4>
                <div className="space-y-2">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                      <img src={item.productImage} alt={item.productName} className="w-12 h-12 object-cover rounded" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.productName}</p>
                        <p className="text-xs text-gray-500">{item.specName} x{item.quantity}</p>
                      </div>
                      <span className="font-medium text-ocean-blue">¥{item.subtotal.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Address */}
              <div>
                <h4 className="font-medium mb-2">收货地址</h4>
                <p className="text-sm text-gray-600">
                  {selectedOrder.shippingAddress?.name} {selectedOrder.shippingAddress?.phone}
                </p>
                <p className="text-sm text-gray-600">
                  {selectedOrder.shippingAddress?.province} {selectedOrder.shippingAddress?.city} {selectedOrder.shippingAddress?.district} {selectedOrder.shippingAddress?.detail}
                </p>
              </div>

              {/* 交易凭证 */}
              {selectedOrder.vouchers && selectedOrder.vouchers.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    交易凭证
                    <span className="text-xs text-gray-400">（{selectedOrder.vouchers.length} 张）</span>
                  </h4>
                  <div className="space-y-3">
                    {selectedOrder.vouchers.map((v) => {
                      const statusInfo: Record<string, { label: string; color: string; bg: string }> = {
                        pending: { label: '待审核', color: 'text-orange-700', bg: 'bg-orange-50' },
                        approved: { label: '已通过', color: 'text-green-700', bg: 'bg-green-50' },
                        rejected: { label: '已拒绝', color: 'text-red-700', bg: 'bg-red-50' },
                      };
                      const s = statusInfo[v.status] || statusInfo.pending;
                      const imgSrc = v.voucherImage?.startsWith('http')
                        ? v.voucherImage
                        : (v.voucherImage?.startsWith('/') ? v.voucherImage : `/uploads/${v.voucherImage}`);
                      return (
                        <div key={v.id} className="border rounded-lg overflow-hidden">
                          <div className={`px-3 py-2 ${s.bg} text-sm flex flex-wrap gap-x-4 gap-y-1`}>
                            <span>
                              <span className="text-gray-500">上传人：</span>
                              <span className="font-medium">{v.userName} {v.userPhone}</span>
                            </span>
                            <span>
                              <span className="text-gray-500">金额：</span>
                              <span className="font-medium">¥{v.amount.toFixed(2)}</span>
                            </span>
                            <span className={`font-medium ${s.color}`}>● {s.label}</span>
                            <span>
                              <span className="text-gray-500">提交时间：</span>
                              {v.submitTime ? new Date(v.submitTime).toLocaleString() : '-'}
                            </span>
                            {v.auditTime && (
                              <span>
                                <span className="text-gray-500">审核时间：</span>
                                {new Date(v.auditTime).toLocaleString()}
                                {v.auditorName && <span> by {v.auditorName}</span>}
                              </span>
                            )}
                          </div>
                          {v.rejectReason && (
                            <div className="px-3 py-2 text-sm text-red-600 bg-red-50">
                              拒绝原因：{v.rejectReason}
                            </div>
                          )}
                          {v.voucherImage ? (
                            <a href={imgSrc} target="_blank" rel="noreferrer">
                              <img
                                src={imgSrc}
                                alt="凭证截图"
                                className="w-full max-h-96 object-contain bg-gray-50"
                              />
                            </a>
                          ) : (
                            <div className="px-3 py-4 text-sm text-gray-400 text-center">暂无凭证图片</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 无凭证提示(对公转账订单但还没上传) */}
              {selectedOrder.paymentMethod === 'bank_transfer' &&
                (!selectedOrder.vouchers || selectedOrder.vouchers.length === 0) && (
                  <div>
                    <h4 className="font-medium mb-2">交易凭证</h4>
                    <div className="text-sm text-gray-400 py-4 text-center bg-gray-50 rounded-lg">
                      客户尚未上传转账凭证
                    </div>
                  </div>
                )}

              {/* 物流动态 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <Truck className="w-4 h-4 text-ocean-blue" />
                    物流动态
                  </h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refreshLogistics}
                    disabled={logisticsLoading}
                    className="flex items-center gap-1 text-xs"
                  >
                    <RefreshCw className={`w-3 h-3 ${logisticsLoading ? 'animate-spin' : ''}`} />
                    {logisticsLoading ? '查询中…' : '刷新'}
                  </Button>
                </div>

                {logisticsLoading && !logisticsDetail && (
                  <div className="text-sm text-gray-500 py-4 text-center">正在加载物流信息…</div>
                )}

                {!logisticsLoading && !logisticsDetail && (
                  <div className="text-sm text-gray-400 py-4 text-center bg-gray-50 rounded-lg">
                    {selectedOrder.status === 'shipped' || selectedOrder.status === 'delivered'
                      ? '暂无物流详情，点击刷新重试'
                      : '订单尚未发货'}
                  </div>
                )}

                {logisticsDetail && (
                  <div className="border rounded-lg overflow-hidden">
                    {/* 物流基础信息 */}
                    <div className="bg-ocean-blue/5 px-4 py-3 text-sm flex flex-wrap gap-x-6 gap-y-1">
                      <span>
                        <span className="text-gray-500">物流公司：</span>
                        <span className="font-medium">{logisticsDetail.carrier}</span>
                      </span>
                      <span>
                        <span className="text-gray-500">运单号：</span>
                        <span className="font-mono">{logisticsDetail.trackingNumber}</span>
                      </span>
                      {logisticsDetail.express?.status && (
                        <span>
                          <span className="text-gray-500">实时状态：</span>
                          <span className="font-medium text-ocean-blue">
                            {logisticsDetail.express.status}
                          </span>
                        </span>
                      )}
                    </div>

                    {/* 实时来源标识 */}
                    {logisticsDetail.express?.source && (
                      <div className="px-4 py-1 text-xs text-gray-400 bg-gray-50 border-b">
                        数据来源：{logisticsDetail.express.source}
                        {logisticsDetail.express.source === 'sf_express_mock' ||
                        logisticsDetail.express.is_mock
                          ? '（模拟数据）'
                          : ''}
                      </div>
                    )}

                    {/* 轨迹时间线 */}
                    {logisticsDetail.express?.traces && logisticsDetail.express.traces.length > 0 ? (
                      <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
                        {logisticsDetail.express.traces.map((t: any, idx: number) => (
                          <div key={idx} className="flex gap-3 text-sm">
                            <div className="flex flex-col items-center">
                              <div
                                className={`w-2 h-2 rounded-full mt-1.5 ${
                                  idx === 0 ? 'bg-ocean-blue' : 'bg-gray-300'
                                }`}
                              />
                              {idx < (logisticsDetail.express?.traces?.length ?? 0) - 1 && (
                                <div className="w-px flex-1 bg-gray-200 mt-1" />
                              )}
                            </div>
                            <div className="flex-1 pb-2">
                              <p className={idx === 0 ? 'font-medium text-ocean-deep' : 'text-gray-600'}>
                                {t.description}
                              </p>
                              {(t.time || t.location) && (
                                <p className="text-xs text-gray-400 mt-0.5">
                                  {[t.time, t.location].filter(Boolean).join(' · ')}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="px-4 py-3 text-sm text-gray-500">
                        暂未获取到轨迹,请稍后刷新。
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 支付信息 / 流水 */}
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-ocean-blue" />
                  支付信息
                </h4>

                {/* 支付方式摘要(基于订单本身) */}
                <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm mb-3 grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-gray-500">支付方式：</span>
                    <span className="font-medium">
                      {selectedOrder.paymentMethod === 'wechat' ? '微信支付'
                        : selectedOrder.paymentMethod === 'alipay' ? '支付宝支付'
                        : selectedOrder.paymentMethod === 'bank_transfer' ? '对公转账'
                        : '未选择 / 未支付'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">支付时间：</span>
                    <span>{selectedOrder.paymentTime ? new Date(selectedOrder.paymentTime).toLocaleString() : '未支付'}</span>
                  </div>
                </div>

                {/* 流水列表 */}
                {paymentLoading && paymentFlows.length === 0 ? (
                  <div className="text-sm text-gray-500 py-3 text-center">正在加载支付流水…</div>
                ) : paymentFlows.length === 0 ? (
                  <div className="text-sm text-gray-400 py-3 text-center bg-gray-50 rounded-lg">
                    暂无支付流水
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden divide-y">
                    {paymentFlows.map((p) => {
                      const methodLabel = p.method === 'wechat' ? '微信支付'
                        : p.method === 'alipay' ? '支付宝支付'
                        : p.method === 'bank_transfer' ? '对公转账'
                        : p.method;
                      const statusInfo: Record<string, { label: string; color: string }> = {
                        pending: { label: '待支付', color: 'text-orange-700' },
                        paid: { label: '已支付', color: 'text-green-700' },
                        failed: { label: '支付失败', color: 'text-red-700' },
                        refunded: { label: '已退款', color: 'text-gray-600' },
                        expired: { label: '已过期', color: 'text-gray-500' },
                      };
                      const s = statusInfo[p.status] ?? { label: p.status, color: 'text-gray-600' };
                      return (
                        <div key={p.id} className="px-4 py-3 text-sm">
                          <div className="flex flex-wrap gap-x-6 gap-y-1 mb-1">
                            <span>
                              <span className="text-gray-500">支付方式：</span>
                              <span className="font-medium">{methodLabel}</span>
                            </span>
                            <span>
                              <span className="text-gray-500">金额：</span>
                              <span className="font-medium">¥{p.amount.toFixed(2)}</span>
                            </span>
                            <span className={`font-medium ${s.color}`}>● {s.label}</span>
                          </div>
                          <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-500">
                            <span>
                              <span className="text-gray-400">支付流水号：</span>
                              <span className="font-mono text-gray-700">{p.paymentNo}</span>
                            </span>
                            <span>
                              <span className="text-gray-400">创建：</span>
                              {p.createdAt ? new Date(p.createdAt).toLocaleString() : '-'}
                            </span>
                            {p.paidAt && (
                              <span>
                                <span className="text-gray-400">支付成功：</span>
                                {new Date(p.paidAt).toLocaleString()}
                              </span>
                            )}
                            {p.expiredAt && (
                              <span>
                                <span className="text-gray-400">过期：</span>
                                {new Date(p.expiredAt).toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Amount */}
              <div className="border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span>商品金额：</span>
                  <span>¥{selectedOrder.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>运费：</span>
                  <span>{selectedOrder.shippingFee === 0 ? '免运费' : `¥${selectedOrder.shippingFee.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between font-bold text-lg mt-2">
                  <span>实付金额：</span>
                  <span className="text-ocean-blue">¥{selectedOrder.finalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* 详情底部操作栏 */}
          {selectedOrder && (
            <div className="mt-6 pt-4 border-t flex justify-end gap-2">
              {selectedOrder.status !== 'cancelled' && (
                <Button
                  variant="outline"
                  onClick={() => cancelOrder(selectedOrder)}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  取消订单
                </Button>
              )}
              <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
                关闭
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Logistics Dialog */}
      <Dialog open={isLogisticsOpen} onOpenChange={setIsLogisticsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>填写物流信息</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">物流公司</label>
              <select
                value={logisticsForm.carrier}
                onChange={(e) => setLogisticsForm({ ...logisticsForm, carrier: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none"
              >
                <option value="">请选择</option>
                <option value="顺丰速运">顺丰速运</option>
                <option value="中通快递">中通快递</option>
                <option value="圆通速递">圆通速递</option>
                <option value="韵达快递">韵达快递</option>
                <option value="申通快递">申通快递</option>
                <option value="德邦物流">德邦物流</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">运单号</label>
              <input
                type="text"
                value={logisticsForm.trackingNumber}
                onChange={(e) => setLogisticsForm({ ...logisticsForm, trackingNumber: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none"
                placeholder="请输入物流单号"
              />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setIsLogisticsOpen(false)}>
              取消
            </Button>
            <Button onClick={handleAddLogistics} className="bg-ocean-blue hover:bg-ocean-deep">
              确认发货
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrders;
