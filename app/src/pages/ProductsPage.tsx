import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Search, Grid3X3, List, Eye, ChevronRight, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DataStore } from '@/data/store';
import type { Product } from '@/types';
import ProductImage from '@/components/ProductImage';

gsap.registerPlugin(ScrollTrigger);

/** 取产品主图:coverImages[0] 优先,兜底 image(兼容老数据) */
const getMainImage = (p: Product) => p.coverImages?.[0] || p.image || '';

const ProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const pageRef = useRef<HTMLDivElement>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    const loadProducts = async () => {
      const loaded = await DataStore.getProducts();
      const sorted = loaded
        .filter((p) => p.isActive)
        .sort((a, b) => a.order - b.order);
      setProducts(sorted);
      setFilteredProducts(sorted);
    };
    loadProducts();
  }, []);

  useEffect(() => {
    let filtered = products;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  }, [selectedCategory, searchQuery, products]);

  useEffect(() => {
    const page = pageRef.current;
    if (!page) return;

    gsap.fromTo(
      '.page-header',
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.page-header',
          start: 'top 85%',
          once: true,
        },
      }
    );

    gsap.fromTo(
      '.product-item',
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.05,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.products-container',
          start: 'top 80%',
          once: true,
        },
      }
    );

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, [filteredProducts]);

  const categories = ['all', ...Array.from(new Set(products.map((p) => p.category)))];

  const categoryLabels: Record<string, string> = {
    all: '全部产品',
    '海洋生物制品': '海洋生物制品',
    '水产深加工': '水产深加工',
    '健康食材': '健康食材',
    '原料供应': '原料供应',
  };

  return (
    <div ref={pageRef} className="min-h-screen pt-20">
      {/* Page Header */}
      <section className="relative py-20 lg:py-32 bg-ocean-deep overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
              backgroundSize: '40px 40px',
            }}
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="page-header inline-block px-4 py-2 rounded-full bg-white/10 text-ocean-cyan text-sm font-medium mb-4 border border-white/20">
            产品中心
          </span>
          <h1 className="page-header text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            优质海洋产品
          </h1>
          <p className="page-header text-white/70 text-lg max-w-2xl mx-auto">
            采用先进工艺，从深海中提取纯净活性成分，为您提供高品质的海洋产品
          </p>
        </div>
      </section>

      {/* Products Content */}
      <section className="py-12 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Filters */}
          <div className="page-header flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-10">
            {/* Category Tabs */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedCategory === category
                      ? 'bg-ocean-blue text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {categoryLabels[category] || category}
                </button>
              ))}
            </div>

            {/* Search and View Mode */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索产品..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 rounded-full border border-gray-200 focus:border-ocean-blue focus:outline-none w-64"
                />
              </div>
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid' ? 'bg-white shadow-sm text-ocean-blue' : 'text-gray-500'
                  }`}
                >
                  <Grid3X3 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list' ? 'bg-white shadow-sm text-ocean-blue' : 'text-gray-500'
                  }`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Products Grid/List */}
          <div
            className={`products-container ${
              viewMode === 'grid'
                ? 'grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                : 'space-y-4'
            }`}
          >
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                role="link"
                tabIndex={0}
                onClick={() => navigate(`/product/${product.id}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(`/product/${product.id}`);
                  }
                }}
                aria-label={`查看 ${product.name} 详情`}
                className={`product-item group bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 cursor-pointer ${
                  viewMode === 'grid' ? 'hover:-translate-y-2' : 'flex'
                }`}
              >
                {/* Image - 只显示首张封面图(避免服务器压力 + 多图轮播只在详情页做) */}
                <div
                  className={`relative overflow-hidden bg-gray-100 ${
                    viewMode === 'grid' ? 'h-52' : 'w-48 h-40 flex-shrink-0'
                  }`}
                >
                  <ProductImage
                    src={getMainImage(product)}
                    alt={product.name}
                    className="w-full h-full"
                    imgClassName="group-hover:scale-110 transition-transform duration-500"
                    sizeHint="thumb"
                  />
                  {/* 渐变遮罩 - pointer-events-none,不挡 click */}
                  <div className="absolute inset-0 bg-gradient-to-t from-ocean-deep/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  {/* 
                    浮层"查看详情" 提示:
                    - 移动端:无 hover,默认显(避免用户没线索)
                    - 桌面端:hover 才显
                    - pointer-events-none:只是视觉提示,不拦截 click,
                      click 事件会冒泡到外层 .product-item 触发 navigate
                  */}
                  <div
                    aria-hidden="true"
                    className={`absolute inset-0 flex items-center justify-center bg-ocean-deep/30 sm:bg-ocean-deep/50 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity pointer-events-none ${
                      viewMode === 'list' ? 'hidden' : ''
                    }`}
                  >
                    <span className="flex items-center gap-2 px-4 py-2 bg-white text-ocean-deep rounded-full text-sm font-medium shadow-lg">
                      <Eye className="w-4 h-4" />
                      查看详情
                    </span>
                  </div>
                  <div className="absolute top-3 left-3 pointer-events-none">
                    <span className="px-2 py-1 bg-white/90 backdrop-blur-sm text-ocean-blue text-xs font-medium rounded-full">
                      {product.category}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1">
                  <h3 className="text-lg font-bold text-ocean-deep mb-2 group-hover:text-ocean-blue transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                    {product.description}
                  </p>

                  {/* Specs */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {product.specs.slice(0, viewMode === 'grid' ? 2 : 4).map((spec, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-ocean-foam text-ocean-deep text-xs rounded-lg"
                      >
                        {spec.name}: ¥{spec.price}/{spec.unit}
                      </span>
                    ))}
                  </div>

                  {/* Features */}
                  {viewMode === 'list' && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {product.features.map((feature, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-green-50 text-green-600 text-xs rounded-lg"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* 视觉提示"了解详情" - 纯 span,不再有独立 onClick(都走外层卡片 click) */}
                  <span className="inline-flex items-center gap-1 text-ocean-blue text-sm font-medium group/link">
                    了解详情
                    <ChevronRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredProducts.length === 0 && (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-full bg-ocean-foam flex items-center justify-center mx-auto mb-4">
                {products.length === 0 ? (
                  <Package className="w-10 h-10 text-ocean-blue" />
                ) : (
                  <Search className="w-10 h-10 text-gray-400" />
                )}
              </div>
              {products.length === 0 ? (
                <>
                  <h3 className="text-xl font-bold text-ocean-deep mb-2">产品中心正在筹备中</h3>
                  <p className="text-gray-600 mb-4">管理员正在准备上架新产品,敬请期待</p>
                  <p className="text-xs text-gray-400">如需查看历史产品,请联系客服</p>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-bold text-ocean-deep mb-2">未找到相关产品</h3>
                  <p className="text-gray-600">请尝试其他搜索条件</p>
                </>
              )}
            </div>
          )}
        </div>
      </section>

    </div>
  );
};

export default ProductsPage;
