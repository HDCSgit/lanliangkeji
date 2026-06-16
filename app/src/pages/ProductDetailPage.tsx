import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ChevronLeft, Minus, Plus, ShoppingCart, CheckCircle,
  Star, Truck, Shield, Package, Beaker, ChevronLeft as ChevronL, ChevronRight as ChevronR
} from 'lucide-react';
import { DataStore } from '@/data/store';
import { CartStore } from '@/data/ecommerceStore';
import { UserStore } from '@/data/userStore';
import type { Product, ProductSpec } from '@/types';
import ProductImage from '@/components/ProductImage';

/** 详情页 URL:不强制要求登录 token 也能浏览 */
const ProductDetailPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [product, setProduct] = useState<Product | null>(null);
  const [specs, setSpecs] = useState<ProductSpec[]>([]);
  const [selectedSpec, setSelectedSpec] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);

  // 封面图轮播:当前索引
  const [coverIndex, setCoverIndex] = useState(0);
  // 详情图懒加载:已"解锁"显示的图片 URL 集合
  const [revealedDetailImages, setRevealedDetailImages] = useState<Set<string>>(new Set());

  // 未登录时引导到登录页
  const requireLogin = (action: 'addToCart' | 'buyNow'): boolean => {
    if (UserStore.isLoggedIn()) return true;
    toast.warning('请先登录', {
      description: action === 'buyNow' ? '登录后即可下单购买' : '登录后即可加入购物车',
      duration: 2500,
    });
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
      // 用公开接口直接拉(允许未登录),失败再走 getProducts 兜底
      let found: Product | null = null;
      try {
        const products = await DataStore.getProducts();
        found = products.find((p) => p.id === productId) || null;
      } catch (e) {
        console.error('Failed to load product:', e);
      }
      if (!found) {
        toast.error('产品不存在或已下架');
        navigate('/products');
        return;
      }
      setProduct(found);
      const productSpecs = found.specs || [];
      setSpecs(productSpecs);
      if (productSpecs.length > 0) {
        setSelectedSpec(productSpecs[0].id);
      }
    };
    loadProduct();
  }, [productId, navigate]);

  const coverImages = (product?.coverImages?.length ? product.coverImages : (product?.image ? [product.image] : []));
  const detailImages = product?.detailImages || [];
  const shouldCarousel = !!product?.enableCarousel && coverImages.length >= 2;

  // 封面图轮播定时器
  useEffect(() => {
    if (!shouldCarousel) return;
    const timer = setInterval(() => {
      setCoverIndex((idx) => (idx + 1) % coverImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [shouldCarousel, coverImages.length]);

  // 详情图懒加载:IntersectionObserver,进入视口 200px 时解锁
  useEffect(() => {
    if (detailImages.length === 0) return;
    // 用 setTimeout 让 IntersectionObserver 在 DOM 渲染后绑定
    const observers: IntersectionObserver[] = [];
    let cancelled = false;

    const bindObservers = () => {
      if (cancelled) return;
      // 先把"已经渲染出的图"立即解锁(用户快速滚动到时,避免空白)
      const visibleEls = document.querySelectorAll<HTMLElement>('[data-detail-img-anchor]');
      visibleEls.forEach((el) => {
        const url = el.dataset.detailImgUrl;
        if (url) {
          setRevealedDetailImages((prev) => {
            if (prev.has(url)) return prev;
            const next = new Set(prev);
            next.add(url);
            return next;
          });
        }
      });

      visibleEls.forEach((el) => {
        const url = el.dataset.detailImgUrl;
        if (!url) return;
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                setRevealedDetailImages((prev) => {
                  if (prev.has(url)) return prev;
                  const next = new Set(prev);
                  next.add(url);
                  return next;
                });
                observer.disconnect();
              }
            });
          },
          { rootMargin: '300px', threshold: 0.01 },
        );
        observer.observe(el);
        observers.push(observer);
      });
    };

    // 下一帧绑定,确保 DOM 已渲染
    const raf = requestAnimationFrame(bindObservers);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      observers.forEach((o) => o.disconnect());
    };
  }, [detailImages.length, product?.id]);

  const currentSpec = specs.find((s) => s.id === selectedSpec);
  const subtotal = currentSpec ? currentSpec.price * quantity : 0;

  const handleAddToCart = async () => {
    if (!product || !currentSpec) return;
    if (!requireLogin('addToCart')) return;

    try {
      await CartStore.add({
        productId: product.id,
        productName: product.name,
        productImage: coverImages[0] || product.image,
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
        productImage: coverImages[0] || product.image,
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

  const nextCover = useCallback(() => {
    setCoverIndex((idx) => (idx + 1) % coverImages.length);
  }, [coverImages.length]);
  const prevCover = useCallback(() => {
    setCoverIndex((idx) => (idx - 1 + coverImages.length) % coverImages.length);
  }, [coverImages.length]);

  if (!product) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-ocean-blue border-t-transparent animate-spin" />
          <p className="text-gray-500">正在加载产品...</p>
        </div>
      </div>
    );
  }

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
          {/* Product Image - 封面图轮播或单图 */}
          <div>
            <div className="bg-white rounded-2xl shadow-card overflow-hidden relative">
              {/* 封面图区(支持轮播) */}
              <div className="relative aspect-square">
                {coverImages.length === 0 ? (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <Package className="w-20 h-20" />
                  </div>
                ) : (
                  <>
                    {/* 用绝对定位叠放所有图,通过 coverIndex 显示 */}
                    {coverImages.map((url, idx) => (
                      <div
                        key={url + idx}
                        className={`absolute inset-0 transition-opacity duration-700 ${
                          idx === coverIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                        }`}
                      >
                        <ProductImage
                          src={url}
                          alt={`${product.name} - 图 ${idx + 1}`}
                          aspectRatio="1/1"
                          className="w-full h-full"
                          priority={idx === 0}
                          sizeHint="medium"
                        />
                      </div>
                    ))}

                    {/* 左右切换按钮 - 只有轮播模式才显示 */}
                    {shouldCarousel && coverImages.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={prevCover}
                          className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-all hover:scale-110"
                          aria-label="上一张"
                        >
                          <ChevronL className="w-5 h-5 text-ocean-deep" />
                        </button>
                        <button
                          type="button"
                          onClick={nextCover}
                          className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-all hover:scale-110"
                          aria-label="下一张"
                        >
                          <ChevronR className="w-5 h-5 text-ocean-deep" />
                        </button>
                      </>
                    )}

                    {/* 指示器圆点 */}
                    {shouldCarousel && coverImages.length > 1 && (
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
                        {coverImages.map((_, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setCoverIndex(idx)}
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                              idx === coverIndex
                                ? 'w-6 bg-ocean-blue'
                                : 'w-1.5 bg-white/60 hover:bg-white'
                            }`}
                            aria-label={`第 ${idx + 1} 张`}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* 缩略图条(轮播时显示) */}
              {shouldCarousel && coverImages.length > 1 && (
                <div className="px-3 py-3 flex gap-2 overflow-x-auto border-t">
                  {coverImages.map((url, idx) => (
                    <button
                      key={url + idx}
                      type="button"
                      onClick={() => setCoverIndex(idx)}
                      className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                        idx === coverIndex
                          ? 'border-ocean-blue scale-105'
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={url}
                        alt={`缩略图 ${idx + 1}`}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
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

            {/* Product Specs Table */}
            {product.specs && product.specs.length > 0 && (
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
            )}
          </div>
        </div>

        {/* 详情图区 - 详情页下拉时懒加载 */}
        {detailImages.length > 0 && (
          <section className="mt-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
              <h3 className="text-xl font-bold text-ocean-deep">产品详情</h3>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
            </div>
            <div className="space-y-3 max-w-3xl mx-auto">
              {detailImages.map((url, idx) => {
                const revealed = revealedDetailImages.has(url);
                return (
                  <div
                    key={url + idx}
                    data-detail-img-anchor
                    data-detail-img-url={url}
                    className="rounded-xl overflow-hidden bg-gray-100"
                  >
                    {revealed ? (
                      <ProductImage
                        src={url}
                        alt={`详情图 ${idx + 1}`}
                        className="w-full"
                        imgClassName="w-full h-auto"
                        aspectRatio="16/10"
                        lazy
                        sizeHint="large"
                      />
                    ) : (
                      <div
                        className="w-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-400"
                        style={{ aspectRatio: '16/10' }}
                      >
                        <span className="text-sm">详情图 {idx + 1} - 滚动到此加载</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 产品特点 chips */}
        {product.features && product.features.length > 0 && (
          <section className="mt-10 max-w-3xl mx-auto">
            <div className="flex flex-wrap gap-2 justify-center">
              {product.features.map((f, i) => (
                <span
                  key={i}
                  className="px-4 py-2 bg-green-50 text-green-700 text-sm rounded-full border border-green-100"
                >
                  ✓ {f}
                </span>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ProductDetailPage;
