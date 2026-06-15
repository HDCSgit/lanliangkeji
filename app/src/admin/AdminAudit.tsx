import React, { useState, useEffect } from 'react';
import {
  CheckCircle, XCircle, Eye, Truck, Search,
  Clock, FileText, Image, AlertCircle,
  User, Phone
} from 'lucide-react';
import { OrderStore } from '@/data/ecommerceStore';
import { VoucherStore, PaymentGateway } from '@/data/paymentGateway';
import { UserStore } from '@/data/userStore';
import type { Order } from '@/types/ecommerce';
import type { BankTransferVoucher, ReceivableAccount } from '@/types/payment';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const AdminAudit: React.FC = () => {
  const [vouchers, setVouchers] = useState<BankTransferVoucher[]>([]);
  const [filteredVouchers, setFilteredVouchers] = useState<BankTransferVoucher[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedVoucher, setSelectedVoucher] = useState<BankTransferVoucher | null>(null);
  const [isImageOpen, setIsImageOpen] = useState(false);
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [isLogisticsOpen, setIsLogisticsOpen] = useState(false);
  const [isOrderDetailOpen, setIsOrderDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [auditAction, setAuditAction] = useState<'approved' | 'rejected'>('approved');
  const [rejectReason, setRejectReason] = useState('');
  const [logisticsForm, setLogisticsForm] = useState({ trackingNumber: '', carrier: '' });
  const [receivableAccount, setReceivableAccount] = useState<ReceivableAccount>({
    accountName: '',
    bankName: '',
    accountNumber: '',
  });

  // 检查权限
  const currentUser = UserStore.getCurrentUser();
  const canAudit = UserStore.canAudit();

  useEffect(() => {
    if (!canAudit) return;
    loadVouchers();
    PaymentGateway.getReceivableAccount().then(setReceivableAccount);
  }, [canAudit]);

  useEffect(() => {
    let filtered = vouchers;
    if (statusFilter !== 'all') {
      filtered = filtered.filter((v) => v.status === statusFilter);
    }
    if (searchQuery) {
      filtered = filtered.filter(
        (v) =>
          v.orderNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
          v.userName.includes(searchQuery) ||
          v.userPhone.includes(searchQuery)
      );
    }
    setFilteredVouchers(filtered);
  }, [searchQuery, statusFilter, vouchers]);

  const loadVouchers = async () => {
    const all = (await VoucherStore.getAll()).sort(
      (a, b) => new Date(b.submitTime).getTime() - new Date(a.submitTime).getTime()
    );
    setVouchers(all);
    setFilteredVouchers(all);
  };

  // 审核凭证
  const handleAudit = async () => {
    if (!selectedVoucher || !currentUser) return;

    await VoucherStore.audit(
      selectedVoucher.id,
      auditAction,
      auditAction === 'rejected' ? rejectReason : undefined
    );

    await loadVouchers();
    setIsAuditOpen(false);
    setRejectReason('');
    setAuditAction('approved');
  };

  // 发货（添加物流信息）
  const handleShip = async () => {
    if (!selectedOrder || !logisticsForm.trackingNumber || !logisticsForm.carrier) return;

    await OrderStore.updateStatus(selectedOrder.id, 'shipped', logisticsForm.trackingNumber, logisticsForm.carrier);
    await loadVouchers();
    setIsLogisticsOpen(false);
    setLogisticsForm({ trackingNumber: '', carrier: '' });
  };

  const openImagePreview = (voucher: BankTransferVoucher) => {
    setSelectedVoucher(voucher);
    setIsImageOpen(true);
  };

  const openAuditDialog = (voucher: BankTransferVoucher, action: 'approved' | 'rejected') => {
    setSelectedVoucher(voucher);
    setAuditAction(action);
    setRejectReason('');
    setIsAuditOpen(true);
  };

  const openLogisticsDialog = async (voucher: BankTransferVoucher) => {
    const order = await OrderStore.getById(voucher.orderId);
    if (order) {
      setSelectedOrder(order);
      setIsLogisticsOpen(true);
    }
  };

  const openOrderDetail = async (voucher: BankTransferVoucher) => {
    const order = await OrderStore.getById(voucher.orderId);
    if (order) {
      setSelectedOrder(order);
      setIsOrderDetailOpen(true);
    }
  };

  // 计算剩余时间
  const getRemainingTime = (voucher: BankTransferVoucher) => {
    const remaining = Math.max(0, new Date(voucher.expiryTime).getTime() - Date.now());
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}小时${minutes}分钟`;
  };

  const statusConfig = {
    pending: { label: '待审核', color: 'text-orange-600', bgColor: 'bg-orange-50' },
    approved: { label: '已通过', color: 'text-green-600', bgColor: 'bg-green-50' },
    rejected: { label: '不通过', color: 'text-red-600', bgColor: 'bg-red-50' },
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

  if (!canAudit) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-ocean-deep mb-2">无权访问</h2>
        <p className="text-gray-500">您没有审核权限，请联系系统管理者</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ocean-deep">对公转账审核</h1>
          <p className="text-gray-500">审核用户提交的转账凭证</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索订单号、用户名..."
            className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none"
          />
        </div>
      </div>

      {/* 收款账户信息 */}
      <div className="bg-orange-50 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-orange-500" />
          <h2 className="font-bold text-orange-700">当前收款账户</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-500">收款方：</span>
            <span className="font-medium text-ocean-deep">{receivableAccount.accountName}</span>
          </div>
          <div>
            <span className="text-gray-500">开户行：</span>
            <span className="font-medium text-ocean-deep">{receivableAccount.bankName}</span>
          </div>
          <div>
            <span className="text-gray-500">账号：</span>
            <span className="font-medium text-ocean-deep">{receivableAccount.accountNumber}</span>
          </div>
        </div>
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-2">
        {[
          { value: 'all', label: '全部' },
          { value: 'pending', label: '待审核' },
          { value: 'approved', label: '已通过' },
          { value: 'rejected', label: '不通过' },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value as any)}
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

      {/* Vouchers Table */}
      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">订单信息</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">用户信息</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">金额</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">凭证</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">状态</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">剩余时间</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredVouchers.map((voucher) => {
                const config = statusConfig[voucher.status as keyof typeof statusConfig];
                return (
                  <tr key={voucher.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-ocean-deep text-sm">{voucher.orderNo}</p>
                      <p className="text-xs text-gray-400">{formatDate(voucher.submitTime)}</p>
                      <button
                        onClick={() => openOrderDetail(voucher)}
                        className="text-xs text-ocean-blue hover:underline mt-1"
                      >
                        查看商品明细
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3 text-gray-400" />
                        <span>{voucher.userName}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Phone className="w-3 h-3" />
                        <span>{voucher.userPhone}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-ocean-blue">
                      ¥{voucher.amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openImagePreview(voucher)}
                        className="flex items-center gap-1 text-ocean-blue hover:underline text-sm"
                      >
                        <Image className="w-4 h-4" />
                        查看凭证
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${config.bgColor} ${config.color}`}>
                        {config.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {voucher.status === 'pending' && (
                        <div className="flex items-center gap-1 text-orange-600">
                          <Clock className="w-3 h-3" />
                          <span>{getRemainingTime(voucher)}</span>
                        </div>
                      )}
                      {voucher.status === 'approved' && (
                        <span className="text-green-600 text-xs">
                          {voucher.auditorName && `审核人：${voucher.auditorName}`}
                        </span>
                      )}
                      {voucher.status === 'rejected' && (
                        <div className="text-red-500 text-xs max-w-[120px] truncate" title={voucher.rejectReason}>
                          {voucher.rejectReason || '未通过'}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openImagePreview(voucher)}
                          className="p-1.5 hover:bg-ocean-blue/10 text-ocean-blue rounded"
                          title="查看凭证大图"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {voucher.status === 'pending' && (
                          <>
                            <button
                              onClick={() => openAuditDialog(voucher, 'approved')}
                              className="p-1.5 hover:bg-green-50 text-green-600 rounded"
                              title="通过"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openAuditDialog(voucher, 'rejected')}
                              className="p-1.5 hover:bg-red-50 text-red-500 rounded"
                              title="不通过"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {voucher.status === 'approved' && (
                          <button
                            onClick={() => openLogisticsDialog(voucher)}
                            className="p-1.5 hover:bg-indigo-50 text-indigo-600 rounded"
                            title="发货"
                          >
                            <Truck className="w-4 h-4" />
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
        {filteredVouchers.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            暂无转账凭证
          </div>
        )}
      </div>

      {/* Image Preview Dialog */}
      <Dialog open={isImageOpen} onOpenChange={setIsImageOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>转账凭证</DialogTitle>
          </DialogHeader>
          {selectedVoucher && (
            <div className="space-y-4 mt-4">
              <div className="text-sm space-y-1 text-gray-600">
                <p>订单号：{selectedVoucher.orderNo}</p>
                <p>用户：{selectedVoucher.userName}（{selectedVoucher.userPhone}）</p>
                <p>金额：¥{selectedVoucher.amount.toFixed(2)}</p>
                <p>提交时间：{formatDate(selectedVoucher.submitTime)}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <img
                  src={selectedVoucher.voucherImage || (selectedVoucher as any).image}
                  alt="转账凭证"
                  className="w-full max-h-[60vh] object-contain rounded-lg"
                />
              </div>
              {selectedVoucher.status === 'pending' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setIsImageOpen(false);
                      openAuditDialog(selectedVoucher, 'approved');
                    }}
                    className="flex-1 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors font-medium"
                  >
                    审核通过
                  </button>
                  <button
                    onClick={() => {
                      setIsImageOpen(false);
                      openAuditDialog(selectedVoucher, 'rejected');
                    }}
                    className="flex-1 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-medium"
                  >
                    审核不通过
                  </button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Audit Dialog */}
      <Dialog open={isAuditOpen} onOpenChange={setIsAuditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {auditAction === 'approved' ? '确认审核通过' : '确认审核不通过'}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {auditAction === 'approved' ? (
              <div className="p-4 bg-green-50 rounded-xl">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">确认通过该转账凭证？</span>
                </div>
                <p className="text-sm text-green-600 mt-2">
                  审核通过后，订单将变为「已付款」状态，可进行发货操作。
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-red-50 rounded-xl">
                  <div className="flex items-center gap-2 text-red-700">
                    <XCircle className="w-5 h-5" />
                    <span className="font-medium">确认不通过该凭证？</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    不通过原因（选填）
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none resize-none"
                    rows={3}
                    placeholder="请输入不通过原因，例如：凭证模糊、金额不符..."
                  />
                </div>
                <p className="text-xs text-orange-600">
                  提示：审核不通过后，用户可重新提交凭证，72小时时限将重新计算。
                </p>
              </div>
            )}
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setIsAuditOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleAudit}
              className={auditAction === 'approved' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}
            >
              确认
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order Detail Dialog */}
      <Dialog open={isOrderDetailOpen} onOpenChange={setIsOrderDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>订单商品明细</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4 mt-4">
              <div className="text-sm text-gray-600">
                <p>订单号：{selectedOrder.orderNo}</p>
              </div>
              <div className="space-y-3">
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm text-ocean-deep">{item.productName}</p>
                      <p className="text-xs text-gray-500">{item.specName} x{item.quantity}</p>
                    </div>
                    <span className="font-medium text-ocean-blue">¥{item.subtotal.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between font-bold text-lg">
                  <span>总金额</span>
                  <span className="text-ocean-blue">¥{selectedOrder.finalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Logistics Dialog */}
      <Dialog open={isLogisticsOpen} onOpenChange={setIsLogisticsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>填写快递信息</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {selectedOrder && (
              <div className="p-3 bg-gray-50 rounded-lg text-sm">
                <p>订单号：{selectedOrder.orderNo}</p>
                <p>收货人：{selectedOrder.shippingAddress?.name} {selectedOrder.shippingAddress?.phone}</p>
              </div>
            )}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">快递单号</label>
              <input
                type="text"
                value={logisticsForm.trackingNumber}
                onChange={(e) => setLogisticsForm({ ...logisticsForm, trackingNumber: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none"
                placeholder="请输入快递单号"
              />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setIsLogisticsOpen(false)}>
              取消
            </Button>
            <Button onClick={handleShip} className="bg-ocean-blue hover:bg-ocean-deep">
              确认发货
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAudit;
