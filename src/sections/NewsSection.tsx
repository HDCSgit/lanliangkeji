import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, Calendar, Eye } from 'lucide-react';
import { DataStore } from '@/data/store';
import type { News } from '@/types';

gsap.registerPlugin(ScrollTrigger);

const NewsSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [news, setNews] = useState<News[]>([]);

  useEffect(() => {
    const loadedNews = DataStore.getNews()
      .filter((n) => n.isActive)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);
    setNews(loadedNews);
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || news.length === 0) return;

    // Title animation
    gsap.fromTo(
      '.news-title',
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.news-title',
          start: 'top 85%',
          once: true,
        },
      }
    );

    // News cards animation - stacked card effect
    gsap.fromTo(
      '.news-card',
      { opacity: 0, y: 60 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.news-grid',
          start: 'top 80%',
          once: true,
        },
      }
    );
  }, [news]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <section
      ref={sectionRef}
      id="news"
      className="relative py-24 lg:py-32 overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-ocean-foam to-white" />

      {/* Decorative Elements */}
      <div className="absolute top-1/4 left-0 w-72 h-72 bg-ocean-blue/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-ocean-cyan/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between mb-16">
          <div>
            <span className="news-title inline-block px-4 py-2 rounded-full bg-ocean-blue/10 text-ocean-blue text-sm font-medium mb-4">
              新闻资讯
            </span>
            <h2 className="news-title text-3xl sm:text-4xl lg:text-5xl font-bold text-ocean-deep mb-4">
              最新动态
            </h2>
            <p className="news-title text-gray-600 max-w-xl">
              了解蓝粮海洋的最新动态、行业资讯和公司公告
            </p>
          </div>
          <Link
            to="/news"
            className="news-title mt-6 lg:mt-0 inline-flex items-center gap-2 text-ocean-blue font-medium hover:gap-3 transition-all"
          >
            查看全部新闻
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        {/* News Grid */}
        <div className="news-grid grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {news.map((item) => (
            <article
              key={item.id}
              className="news-card group bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-500 hover:-translate-y-2"
            >
              {/* Image */}
              <div className="relative h-52 overflow-hidden">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                {/* Category Badge */}
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-ocean-blue text-white text-xs font-medium rounded-full">
                    {item.category}
                  </span>
                </div>
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-ocean-deep/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Meta */}
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatDate(item.createdAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {item.views}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-ocean-deep mb-3 line-clamp-2 group-hover:text-ocean-blue transition-colors">
                  {item.title}
                </h3>

                {/* Summary */}
                <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                  {item.summary}
                </p>

                {/* Link */}
                <Link
                  to={`/news`}
                  className="inline-flex items-center gap-2 text-ocean-blue text-sm font-medium group/link"
                >
                  阅读更多
                  <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                </Link>
              </div>
            </article>
          ))}
        </div>

        {/* Newsletter CTA */}
        <div className="mt-16 relative rounded-3xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-ocean-blue to-ocean-cyan" />
          <div className="absolute inset-0 opacity-20">
            <div
              className="w-full h-full"
              style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                backgroundSize: '32px 32px',
              }}
            />
          </div>

          <div className="relative z-10 px-8 py-12 lg:px-16 lg:py-16">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl lg:text-3xl font-bold text-white mb-4">
                  订阅我们的新闻通讯
                </h3>
                <p className="text-white/80">
                  获取最新的行业资讯、产品更新和公司动态
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="email"
                  placeholder="输入您的邮箱地址"
                  className="flex-1 px-6 py-4 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:border-white/40"
                />
                <button className="px-8 py-4 bg-white text-ocean-blue rounded-full font-semibold hover:bg-ocean-foam transition-colors">
                  立即订阅
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewsSection;
