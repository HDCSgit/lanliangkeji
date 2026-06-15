import React, { useState, useEffect } from 'react';
import { CreditCard, ArrowDownLeft, ArrowUpRight, CheckCircle, XCircle, Clock } from 'lucide-react';
import { BillStore } from '@/data/ecommerceStore';
import type { UserBill } from '@/types/ecommerce';

const BillsPage: React.FC = () => {
  const [bills, setBills] = useState<UserBill[]>([]);
  const [filter, setFilter] = useState<'all' | 'expense' | 'refund'>('all');

  useEffect(() => {
    const load = async () => {
      setBills(await BillStore.get());
    };
    load();
  }, []);

  const filteredBills = filter === 'all'
    ? bills
    : bills.filter((b) => b.type === filter);

  const totalExpense = bills
    .filter((b) => b.type === 'expense' && b.status === 'success')
    .reduce((sum, b) => sum + b.amount, 0);

  const totalRefund = bills
    .filter((b) => b.type === 'refund' && b.status === 'success')
    .reduce((sum, b) => sum + b.amount, 0);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const statusIcons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    pending: <Clock className="w-5 h-5 text-orange-500" />,
    failed: <XCircle className="w-5 h-5 text-red-500" />,
  };

  const paymentMethodLabels = {
    wechat: '微信支付',
    alipay: '支付宝',
    bank_transfer: '银行转账',
  };

  return (
    <div className="min-h-screen pt-20 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-ocean-deep mb-6">我的账单</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl shadow-card p-6 text-center">
            <p className="text-sm text-gray-500 mb-1">总支出</p>
            <p className="text-2xl font-bold text-red-500">¥{totalExpense.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-card p-6 text-center">
            <p className="text-sm text-gray-500 mb-1">总退款</p>
            <p className="text-2xl font-bold text-green-500">¥{totalRefund.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-card p-6 text-center">
            <p className="text-sm text-gray-500 mb-1">交易笔数</p>
            <p className="text-2xl font-bold text-ocean-deep">{bills.length}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {[
            { value: 'all' as const, label: '全部' },
            { value: 'expense' as const, label: '支出' },
            { value: 'refund' as const, label: '退款' },
          ].map((f) => (
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

        {/* Bills List */}
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">类型</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">说明</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">支付方式</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">金额</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">状态</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredBills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className={`flex items-center gap-2 ${
                        bill.type === 'expense' ? 'text-red-500' : 'text-green-500'
                      }`}>
                        {bill.type === 'expense' ? (
                          <ArrowUpRight className="w-5 h-5" />
                        ) : (
                          <ArrowDownLeft className="w-5 h-5" />
                        )}
                        <span>{bill.type === 'expense' ? '支出' : '退款'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-ocean-deep">{bill.description}</p>
                      <p className="text-xs text-gray-400">{formatDate(bill.createdAt)}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {paymentMethodLabels[bill.paymentMethod]}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-bold ${
                        bill.type === 'expense' ? 'text-red-500' : 'text-green-500'
                      }`}>
                        {bill.type === 'expense' ? '-' : '+'}¥{bill.amount.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {statusIcons[bill.status]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredBills.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <CreditCard className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>暂无账单记录</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BillsPage;
