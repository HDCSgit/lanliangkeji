import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Plus, Minus, ShoppingCart, Trash2, ArrowRight } from 'lucide-react';
import { CartStore } from '@/data/ecommerceStore';
import type { CartItem } from '@/types/ecommerce';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const navigate = useNavigate();

  const refreshItems = async () => {
    const loaded = await CartStore.get();
    setItems(loaded);
  };

  useEffect(() => {
    if (isOpen) {
      refreshItems();
    }
  }, [isOpen]);

  const updateQuantity = async (itemId: string, delta: number) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;
    const newQuantity = Math.max(1, item.quantity + delta);
    await CartStore.updateQuantity(itemId, newQuantity);
    await refreshItems();
  };

  const removeItem = async (itemId: string) => {
    await CartStore.remove(itemId);
    await refreshItems();
  };

  const total = items.reduce((sum, item) => sum + item.subtotal, 0);
  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = () => {
    if (items.length === 0) return;
    onClose();
    navigate('/checkout');
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[480px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-6 h-6 text-ocean-blue" />
            <h2 className="text-xl font-bold text-ocean-deep">购物车</h2>
            <span className="px-2 py-1 bg-ocean-blue/10 text-ocean-blue text-sm rounded-full">
              {count} 件商品
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-6" style={{ height: 'calc(100vh - 200px)' }}>
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <ShoppingCart className="w-16 h-16 mb-4 text-gray-300" />
              <p className="text-lg mb-2">购物车是空的</p>
              <p className="text-sm">快去选购心仪的商品吧</p>
              <button
                onClick={() => {
                  onClose();
                  navigate('/products');
                }}
                className="mt-4 px-6 py-2 bg-ocean-blue text-white rounded-lg hover:bg-ocean-deep transition-colors"
              >
                去购物
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-4 bg-gray-50 rounded-xl"
                >
                  <img
                    src={item.productImage}
                    alt={item.productName}
                    className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-ocean-deep truncate">
                      {item.productName}
                    </h3>
                    <p className="text-sm text-gray-500">
                      规格：{item.specName} ({item.unit})
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-ocean-blue font-bold">
                        ¥{item.price.toFixed(2)}/{item.unit}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-10 text-center font-medium">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-gray-500">
                        小计：¥{item.subtotal.toFixed(2)}
                      </span>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-600">合计</span>
              <span className="text-2xl font-bold text-ocean-blue">
                ¥{total.toFixed(2)}
              </span>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-ocean-blue to-ocean-cyan text-white rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              去结算
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default CartDrawer;
