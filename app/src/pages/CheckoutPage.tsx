import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, ArrowRight, Package, Truck, AlertCircle, Minus, Plus, X } from 'lucide-react';
import { CartStore, OrderStore } from '@/data/ecommerceStore';
import { UserStore } from '@/data/userStore';
import { toast } from 'sonner';
import type { ShippingAddress, CartItem } from '@/types/ecommerce';

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<CartItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set()); // 勾选状态
  const [selectedAddress, setSelectedAddress] = useState<ShippingAddress | null>(null);
  const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
  const [remark, setRemark] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [error, setError] = useState('');

  // Address form
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    province: '',
    city: '',
    district: '',
    detail: '',
    isDefault: true,
  });

  useEffect(() => {
    // Check login
    if (!UserStore.isLoggedIn()) {
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }

    loadCart();
    loadAddresses();
  }, [navigate]);

  const loadCart = async () => {
    const cartItems = await CartStore.get();
    if (cartItems.length === 0) {
      navigate('/products');
      return;
    }
    setItems(cartItems);
    // 默认全选
    setSelectedIds(new Set(cartItems.map((i) => i.id)));
  };

  // 勾选/取消
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((i) => i.id)));
    }
  };

  // 改数量
  const handleUpdateQuantity = async (item: CartItem, newQty: number) => {
    if (newQty < 1) return;
    if (newQty > 999) return;
    try {
      await CartStore.updateQuantity(item.id, newQty);
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, quantity: newQty, subtotal: newQty * i.price } : i
        )
      );
    } catch (e: any) {
      toast.error('修改数量失败', { description: e?.message });
    }
  };

  // 删除一项 (等同于取消勾选 + 移除购物车)
  const handleRemove = async (item: CartItem) => {
    try {
      await CartStore.remove(item.id);
      const newItems = items.filter((i) => i.id !== item.id);
      setItems(newItems);
      const newSelected = new Set(selectedIds);
      newSelected.delete(item.id);
      setSelectedIds(newSelected);
      toast.success('已从购物车移除');
      if (newItems.length === 0) {
        // 全部移除,跳回产品列表
        navigate('/products');
      }
    } catch (e: any) {
      toast.error('移除失败', { description: e?.message });
    }
  };

  const loadAddresses = async () => {
    const userAddresses = await UserStore.getAddresses();
    setAddresses(userAddresses);

    // Auto select default or first address
    if (userAddresses.length > 0) {
      const defaultAddr = userAddresses.find((a) => a.isDefault) || userAddresses[0];
      setSelectedAddress(defaultAddr);
    } else {
      setSelectedAddress(null);
      setShowAddressForm(true); // Show form if no addresses
    }
  };

  const handleAddAddress = async () => {
    if (!formData.name || !formData.phone || !formData.detail) {
      setError('请填写完整地址信息');
      return;
    }

    const newAddress: ShippingAddress = {
      id: Date.now().toString(),
      ...formData,
      createdAt: new Date().toISOString(),
    };

    const saved = await UserStore.addAddress(newAddress);
    await loadAddresses();
    setShowAddressForm(false);
    // 使用后端返回的真实地址（含数据库 ID），确保后续创建订单可用
    setSelectedAddress(saved || newAddress);
    setError('');

    // Reset form
    setFormData({
      name: '',
      phone: '',
      province: '',
      city: '',
      district: '',
      detail: '',
      isDefault: true,
    });
  };

  // 只统计被勾选的 items
  const selectedItems = items.filter((i) => selectedIds.has(i.id));
  const subtotal = selectedItems.reduce((sum, item) => sum + item.subtotal, 0);
  const shippingFee = subtotal > 500 ? 0 : 20;
  const total = subtotal + shippingFee;

  const handleCreateOrder = async () => {
    if (!selectedAddress) {
      setError('请选择收货地址');
      setShowAddressForm(true);
      return;
    }
    if (selectedItems.length === 0) {
      setError('请至少选择一个商品');
      return;
    }

    setIsSubmitting(true);

    try {
      // 取消勾选的 items 从购物车删除 (后端 createOrder 会全量拿购物车 items)
      const unselectedIds = items
        .filter((i) => !selectedIds.has(i.id))
        .map((i) => i.id);
      for (const id of unselectedIds) {
        try {
          await CartStore.remove(id);
        } catch {
          // 单个删除失败不影响主流程
        }
      }

      const created = await OrderStore.create({
        shippingAddress: selectedAddress,
        remark,
      });
      // 清空购物车 (只删 selected,前面已删 unselected)
      await CartStore.clear();
      navigate(`/payment/${created.id}`);
    } catch (err: any) {
      setError(err.message || '下单失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-ocean-deep mb-6">确认订单</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left - Order Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Address */}
            <div className="bg-white rounded-2xl shadow-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-ocean-blue" />
                <h2 className="text-lg font-bold text-ocean-deep">收货地址</h2>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-500 rounded-lg text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              {/* Address List */}
              {addresses.length > 0 && (
                <div className="space-y-3 mb-4">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      onClick={() => {
                        setSelectedAddress(addr);
                        setError('');
                      }}
                      className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        selectedAddress?.id === addr.id
                          ? 'border-ocean-blue bg-ocean-blue/5'
                          : 'border-gray-200 hover:border-ocean-blue/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-ocean-deep">{addr.name}</span>
                        <span className="text-gray-500">{addr.phone}</span>
                        {addr.isDefault && (
                          <span className="px-2 py-0.5 bg-ocean-blue/10 text-ocean-blue text-xs rounded-full">
                            默认
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm mt-1">
                        {addr.province} {addr.city} {addr.district} {addr.detail}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Toggle Add Address Form */}
              {!showAddressForm && (
                <button
                  onClick={() => {
                    setShowAddressForm(true);
                    setError('');
                  }}
                  className="text-ocean-blue text-sm hover:underline"
                >
                  + 添加新地址
                </button>
              )}

              {/* Add Address Form */}
              {showAddressForm && (
                <div className="p-4 bg-gray-50 rounded-xl space-y-3">
                  <h3 className="font-medium text-ocean-deep">
                    {addresses.length === 0 ? '请添加收货地址' : '添加新地址'}
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="收件人姓名 *"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="px-4 py-3 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none"
                    />
                    <input
                      type="tel"
                      placeholder="手机号 *"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="px-4 py-3 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="省"
                      value={formData.province}
                      onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                      className="px-4 py-3 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="市"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="px-4 py-3 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="区/县"
                      value={formData.district}
                      onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                      className="px-4 py-3 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="详细地址 *"
                    value={formData.detail}
                    onChange={(e) => setFormData({ ...formData, detail: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none"
                  />
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isDefault}
                      onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                      className="w-4 h-4 text-ocean-blue rounded"
                    />
                    <span className="text-sm text-gray-600">设为默认地址</span>
                  </label>
                  <div className="flex gap-3">
                    <button
                      onClick={handleAddAddress}
                      className="px-6 py-2 bg-ocean-blue text-white rounded-lg hover:bg-ocean-deep transition-colors"
                    >
                      保存地址
                    </button>
                    {addresses.length > 0 && (
                      <button
                        onClick={() => setShowAddressForm(false)}
                        className="px-6 py-2 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        取消
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-2xl shadow-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-ocean-blue" />
                  <h2 className="text-lg font-bold text-ocean-deep">商品清单</h2>
                  <span className="text-sm text-gray-500">({items.length} 件)</span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === items.length && items.length > 0}
                    onChange={selectAll}
                    className="w-4 h-4 accent-ocean-blue"
                  />
                  <span className="text-sm text-gray-600">全选</span>
                </label>
              </div>
              <div className="space-y-4">
                {items.map((item) => {
                  const checked = selectedIds.has(item.id);
                  return (
                    <div
                      key={item.id}
                      className={`flex gap-3 p-4 rounded-xl border-2 transition-all ${
                        checked ? 'bg-ocean-blue/5 border-ocean-blue/30' : 'bg-gray-50 border-transparent opacity-60'
                      }`}
                    >
                      {/* 勾选 */}
                      <div className="flex items-center pt-1">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSelect(item.id)}
                          className="w-5 h-5 accent-ocean-blue cursor-pointer"
                          aria-label={`选择 ${item.productName}`}
                        />
                      </div>
                      <img
                        src={item.productImage}
                        alt={item.productName}
                        className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-medium text-ocean-deep truncate">{item.productName}</h3>
                            <p className="text-sm text-gray-500 mt-0.5">
                              规格：{item.specName} ({item.unit})
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemove(item)}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                            aria-label="移除"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="mt-2 text-ocean-blue font-bold text-sm">
                          ¥{item.price.toFixed(2)}/{item.unit}
                        </div>
                        {/* 数量控件 + 小计:上下两行,精致紧凑 */}
                        <div className="mt-2 flex items-center justify-between">
                          <div className="inline-flex items-center bg-gray-100 rounded-full overflow-hidden">
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(item, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-200 active:bg-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              aria-label="减少"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="min-w-[1.75rem] text-center text-sm font-medium text-ocean-deep tabular-nums">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(item, item.quantity + 1)}
                              disabled={item.quantity >= 999}
                              className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-200 active:bg-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              aria-label="增加"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <span className="text-sm text-gray-500">
                            小计：<span className="font-semibold text-ocean-deep">¥{item.subtotal.toFixed(2)}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {selectedIds.size === 0 && items.length > 0 && (
                <p className="text-center text-sm text-gray-500 mt-4">已取消全部商品,请至少选择一件</p>
              )}
            </div>

            {/* Remark */}
            <div className="bg-white rounded-2xl shadow-card p-6">
              <h2 className="text-lg font-bold text-ocean-deep mb-4">订单备注</h2>
              <textarea
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="如有特殊要求请在此备注..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* Right - Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-card p-6 sticky top-24">
              <h2 className="text-lg font-bold text-ocean-deep mb-4">订单汇总</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>商品小计</span>
                  <span>¥{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span className="flex items-center gap-1">
                    <Truck className="w-4 h-4" />
                    运费
                  </span>
                  <span>{shippingFee === 0 ? '免运费' : `¥${shippingFee.toFixed(2)}`}</span>
                </div>
                {shippingFee > 0 && (
                  <p className="text-xs text-gray-400">
                    满 ¥500 免运费，还差 ¥{(500 - subtotal).toFixed(2)}
                  </p>
                )}
                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="font-bold text-ocean-deep">应付金额</span>
                    <span className="text-2xl font-bold text-ocean-blue">
                      ¥{total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCreateOrder}
                disabled={isSubmitting || !selectedAddress}
                className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-ocean-blue to-ocean-cyan text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    提交订单
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              {!selectedAddress && (
                <p className="text-red-500 text-sm text-center mt-3">
                  请先添加收货地址
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
