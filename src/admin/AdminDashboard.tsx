import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Image,
  Package,
  Newspaper,
  Users,
  Eye,
  Calendar,
  ArrowRight,
} from 'lucide-react';
import { DataStore } from '@/data/store';
import type { Product, News } from '@/types';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    banners: 0,
    products: 0,
    news: 0,
    partners: 0,
  });
  const [recentNews, setRecentNews] = useState<News[]>([]);
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);

  useEffect(() => {
    // Load stats
    setStats({
      banners: DataStore.getBanners().filter((b) => b.isActive).length,
      products: DataStore.getProducts().filter((p) => p.isActive).length,
      news: DataStore.getNews().filter((n) => n.isActive).length,
      partners: DataStore.getPartners().filter((p) => p.isActive).length,
    });

    // Load recent news
    const news = DataStore.getNews()
      .filter((n) => n.isActive)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
    setRecentNews(news);

    // Load popular products
    const products = DataStore.getProducts()
      .filter((p) => p.isActive)
      .slice(0, 4);
    setPopularProducts(products);
  }, []);

  const statCards = [
    { name: '轮播图', value: stats.banners, icon: Image, path: '/admin/banners', color: 'bg-blue-500' },
    { name: '产品', value: stats.products, icon: Package, path: '/admin/products', color: 'bg-green-500' },
    { name: '新闻', value: stats.news, icon: Newspaper, path: '/admin/news', color: 'bg-purple-500' },
    { name: '合作伙伴', value: stats.partners, icon: Users, path: '/admin/partners', color: 'bg-orange-500' },
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-ocean-deep">仪表盘</h1>
        <p className="text-gray-500">欢迎回来，查看网站最新数据</p>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const IconComponent = stat.icon;
          return (
            <Link
              key={stat.name}
              to={stat.path}
              className="bg-white rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-500 text-sm mb-1">{stat.name}</p>
                  <p className="text-3xl font-bold text-ocean-deep">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl ${stat.color} bg-opacity-10 flex items-center justify-center`}>
                  <IconComponent className={`w-6 h-6 ${stat.color.replace('bg-', 'text-')}`} />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1 text-sm text-ocean-blue group-hover:gap-2 transition-all">
                管理{stat.name}
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Content Grid */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent News */}
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-ocean-deep">最新新闻</h2>
              <p className="text-gray-500 text-sm">最近发布的新闻动态</p>
            </div>
            <Link
              to="/admin/news"
              className="text-ocean-blue text-sm hover:underline"
            >
              查看全部
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recentNews.map((item) => (
              <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-4">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-ocean-deep truncate">{item.title}</h3>
                    <p className="text-gray-500 text-sm line-clamp-1">{item.summary}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(item.createdAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {item.views}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {recentNews.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                暂无新闻
              </div>
            )}
          </div>
        </div>

        {/* Popular Products */}
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-ocean-deep">产品展示</h2>
              <p className="text-gray-500 text-sm">热门产品推荐</p>
            </div>
            <Link
              to="/admin/products"
              className="text-ocean-blue text-sm hover:underline"
            >
              查看全部
            </Link>
          </div>
          <div className="p-6 grid grid-cols-2 gap-4">
            {popularProducts.map((product) => (
              <div
                key={product.id}
                className="group relative rounded-xl overflow-hidden"
              >
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-32 object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ocean-deep/80 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-white font-medium text-sm truncate">{product.name}</p>
                  <p className="text-white/70 text-xs">{product.category}</p>
                </div>
              </div>
            ))}
            {popularProducts.length === 0 && (
              <div className="col-span-2 p-8 text-center text-gray-500">
                暂无产品
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-ocean-blue to-ocean-cyan rounded-2xl p-8 text-white">
        <h2 className="text-xl font-bold mb-4">快速操作</h2>
        <div className="flex flex-wrap gap-4">
          <Link
            to="/admin/banners"
            className="px-6 py-3 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-colors"
          >
            管理轮播图
          </Link>
          <Link
            to="/admin/products/new"
            className="px-6 py-3 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-colors"
          >
            添加产品
          </Link>
          <Link
            to="/admin/news/new"
            className="px-6 py-3 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-colors"
          >
            发布新闻
          </Link>
          <Link
            to="/admin/settings"
            className="px-6 py-3 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-colors"
          >
            网站设置
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
