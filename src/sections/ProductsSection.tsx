import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, Eye } from 'lucide-react';
import { DataStore } from '@/data/store';
import type { Product } from '@/types';

gsap.registerPlugin(ScrollTrigger);

const ProductsSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);

  useEffect(() => {
    const loadedProducts = DataStore.getProducts()
      .filter((p) => p.isActive)
      .sort((a, b) => a.order - b.order)
      .slice(0, 4);
    setProducts(loadedProducts);
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || products.length === 0) return;

    // Title animation
    gsap.fromTo(
      '.products-title',
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.products-title',
          start: 'top 85%',
          once: true,
        },
      }
    );

    // Product cards animation with isometric to flat effect
    gsap.fromTo(
      '.product-card',
      { opacity: 0, rotateX: 60, rotateZ: -10, y: 80 },
      {
        opacity: 1,
        rotateX: 0,
        rotateZ: 0,
        y: 0,
        duration: 1,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.products-grid',
          start: 'top 80%',
          once: true,
        },
      }
    );
  }, [products]);

  return (
    <section
      ref={sectionRef}
      id="products"
      className="relative py-24 lg:py-32 overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-ocean-foam to-white" />

      {/* Decorative Elements */}
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-ocean-blue/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-0 w-72 h-72 bg-ocean-cyan/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between mb-16">
          <div>
            <span className="products-title inline-block px-4 py-2 rounded-full bg-ocean-blue/10 text-ocean-blue text-sm font-medium mb-4">
              产品中心
            </span>
            <h2 className="products-title text-3xl sm:text-4xl lg:text-5xl font-bold text-ocean-deep mb-4">
              优质海洋产品
            </h2>
            <p className="products-title text-gray-600 max-w-xl">
              采用先进工艺，从深海中提取纯净活性成分，为您提供高品质的海洋产品
            </p>
          </div>
          <Link
            to="/products"
            className="products-title mt-6 lg:mt-0 inline-flex items-center gap-2 text-ocean-blue font-medium hover:gap-3 transition-all"
          >
            查看全部产品
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        {/* Products Grid */}
        <div
          className="products-grid grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
          style={{ perspective: '1000px' }}
        >
          {products.map((product) => (
            <div
              key={product.id}
              className="product-card group relative bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-500"
              style={{ transformStyle: 'preserve-3d' }}
              onMouseEnter={() => setHoveredProduct(product.id)}
              onMouseLeave={() => setHoveredProduct(null)}
            >
              {/* Image */}
              <div className="relative h-56 overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-ocean-deep/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Quick View Button */}
                <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
                  hoveredProduct === product.id ? 'opacity-100' : 'opacity-0'
                }`}>
                  <Link
                    to={`/products`}
                    className="flex items-center gap-2 px-6 py-3 bg-white text-ocean-deep rounded-full font-medium hover:bg-ocean-cyan hover:text-white transition-colors transform translate-y-4 group-hover:translate-y-0"
                  >
                    <Eye className="w-4 h-4" />
                    快速查看
                  </Link>
                </div>

                {/* Category Badge */}
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-ocean-blue text-xs font-medium rounded-full">
                    {product.category}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-lg font-bold text-ocean-deep mb-2 group-hover:text-ocean-blue transition-colors">
                  {product.name}
                </h3>
                <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                  {product.description}
                </p>

                {/* Specs Preview */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {product.specs.slice(0, 2).map((spec, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-ocean-foam text-ocean-deep text-xs rounded-lg"
                    >
                      {spec.name}: {spec.value}
                    </span>
                  ))}
                </div>

                {/* Link */}
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 text-ocean-blue text-sm font-medium group/link"
                >
                  了解详情
                  <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                </Link>
              </div>

              {/* Hover Border Effect */}
              <div className="absolute inset-0 rounded-2xl border-2 border-ocean-blue/0 group-hover:border-ocean-blue/30 transition-colors pointer-events-none" />
            </div>
          ))}
        </div>

        {/* Bottom Stats */}
        <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { value: '50+', label: '产品种类' },
            { value: '100%', label: '品质保证' },
            { value: '30+', label: '出口国家' },
            { value: '1000+', label: '合作客户' },
          ].map((stat, index) => (
            <div
              key={index}
              className="text-center p-6 bg-white rounded-2xl shadow-card"
            >
              <div className="text-3xl lg:text-4xl font-bold text-ocean-blue mb-2">
                {stat.value}
              </div>
              <div className="text-gray-600 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductsSection;
