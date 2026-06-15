import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ChevronLeft, Minus, Plus, ShoppingCart, CheckCircle,
  Star, Truck, Shield, Package, Beaker
} from 'lucide-react';
import { DataStore, defaultProducts } from '@/data/store';
import { CartStore } from '@/data/ecommerceStore';
import { UserStore } from '@/data/userStore';
import type { Product, ProductSpec } from '@/types';

const ProductDetailPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [product, setProduct] = useState<Product | null>(null);
  const [specs, setSpecs] = useState<ProductSpec[]>([]);
  const [selectedSpec, setSelectedSpec] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);

  // 未登录时引导到登录页,登录成功后回到当前产品详情
  const requireLogin = (action: 'addToCart' | 'buyNow'): boolean => {
    if (UserStore.isLoggedIn()) return true;
    toast.warning('请先登录', {
      description: action === 'buyNow' ? '登录后即可下单购买' : '登录后即可加入购物车',
      duration: 2500,
    });
    // 把当前 URL 作为 redirect 参数,登录成功后跳回
    const redirect = encodeURIComponent(location.pathname + location.search + location.hash);
    setTimeout(() => {
      navigate(`/login?redirect=${redirect}`, { replace: false });
    }, 800);
    return false;
  };

  useEffect(() => {
    const loadProduct = async () => {
      if (!productId) {
        navigate('/products');
        return;
      }
      const products = await DataStore.getProducts();
      const found = products.find((p) => p.id === productId) || defaultProducts.find((p) => p.id === productId);
      if (found) {
        setProduct(found);
        const productSpecs = found.specs || [];
        setSpecs(productSpecs);
        if (productSpecs.length > 0) {
          setSelectedSpec(productSpecs[0].id);
        }
      } else {
        navigate('/products');
      }
    };
    loadProduct();
  }, [productId, navigate]);

  const currentSpec = specs.find((s) => s.id === selectedSpec);
  const subtotal = currentSpec ? currentSpec.price * quantity : 0;

  const handleAddToCart = async () => {
    if (!product || !currentSpec) return;
    if (!requireLogin('addToCart')) return;

    try {
      await CartStore.add({
        productId: product.id,
        productName: product.name,
        productImage: product.image,
        specId: currentSpec.id,
        specName: currentSpec.name,
        unit: currentSpec.unit,
        price: currentSpec.price,
        quantity,
      });
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
      toast.success('已加入购物车');
    } catch (e: any) {
      toast.error('加入购物车失败', { description: e?.message });
    }
  };

  const handleBuyNow = async () => {
    if (!product || !currentSpec) return;
    if (!requireLogin('buyNow')) return;

    try {
      await CartStore.add({
        productId: product.id,
        productName: product.name,
        productImage: product.image,
        specId: currentSpec.id,
        specName: currentSpec.name,
        unit: currentSpec.unit,
        price: currentSpec.price,
        quantity,
      });
      navigate('/checkout');
    } catch (e: any) {
      toast.error('下单失败', { description: e?.message });
    }
  };

  if (!product) return null;

  return (
    <div className="min-h-screen pt-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/products')}
          className="flex items-center gap-1 text-gray-600 hover:text-ocean-blue mb-6"
        >
          <ChevronLeft className="w-5 h-5" />
          返回产品列表
        </button>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Product Image */}
          <div>
            <div className="bg-white rounded-2xl shadow-card overflow-hidden">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-[400px] lg:h-[500px] object-cover"
              />
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              <span className="px-3 py-1 bg-ocean-blue/10 text-ocean-blue text-sm rounded-full">
                {product.category}
              </span>
              <h1 className="text-3xl font-bold text-ocean-deep mt-3 mb-2">
                {product.name}
              </h1>
              <p className="text-gray-600 leading-relaxed">{product.description}</p>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <span className="text-gray-500 text-sm">(128条评价)</span>
            </div>

            {/* Specs Selection */}
            {specs.length > 0 && (
              <div>
                <h3 className="font-bold text-ocean-deep mb-3">选择规格</h3>
                <div className="flex flex-wrap gap-3">
                  {specs.map((spec) => (
                    <button
                      key={spec.id}
                      onClick={() => setSelectedSpec(spec.id)}
                      className={`px-4 py-3 border-2 rounded-xl transition-all ${
                        selectedSpec === spec.id
                          ? 'border-ocean-blue bg-ocean-blue/5 text-ocean-blue'
                          : 'border-gray-200 hover:border-ocean-blue/50'
                      }`}
                    >
                      <div className="font-medium">{spec.name}</div>
                      <div className="text-sm">¥{spec.price}/{spec.unit}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <h3 className="font-bold text-ocean-deep mb-3">购买数量</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center border-2 border-gray-200 rounded-xl">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-3 hover:bg-gray-100 rounded-l-xl transition-colors"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <span className="w-16 text-center font-bold text-lg">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-3 hover:bg-gray-100 rounded-r-xl transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <span className="text-gray-500">
                  {currentSpec?.unit || '件'}
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="p-4 bg-ocean-blue/5 rounded-xl">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-ocean-blue">
                  ¥{subtotal.toFixed(2)}
                </span>
                {quantity > 1 && (
                  <span className="text-gray-500">
                    (¥{currentSpec?.price.toFixed(2)} × {quantity})
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={handleAddToCart}
                className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-semibold transition-all ${
                  addedToCart
                    ? 'bg-green-500 text-white'
                    : 'border-2 border-ocean-blue text-ocean-blue hover:bg-ocean-blue hover:text-white'
                }`}
              >
                {addedToCart ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    已加入购物车
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5" />
                    加入购物车
                  </>
                )}
              </button>
              <button
                onClick={handleBuyNow}
                className="flex-1 py-4 bg-gradient-to-r from-ocean-blue to-ocean-cyan text-white rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                立即购买
              </button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              {[
                { icon: Truck, label: '快速发货', desc: '48小时内发货' },
                { icon: Shield, label: '品质保证', desc: 'ISO22000认证' },
                { icon: Package, label: '专业包装', desc: '防潮防损' },
                { icon: Beaker, label: '检测报告', desc: '随货附带' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <item.icon className="w-5 h-5 text-ocean-blue" />
                  <div>
                    <p className="font-medium text-sm text-ocean-deep">{item.label}</p>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Product Specs */}
            <div className="pt-4 border-t">
              <h3 className="font-bold text-ocean-deep mb-3">产品规格</h3>
              <div className="grid grid-cols-1 gap-2">
                {product.specs.map((spec, i) => (
                  <div key={i} className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500 text-sm">{spec.name}</span>
                    <span className="text-ocean-deep text-sm">
                      ¥{spec.price}/{spec.unit} · 库存{spec.stock}{spec.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
