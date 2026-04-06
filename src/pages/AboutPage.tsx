import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Target, Eye, Heart, Award, Calendar } from 'lucide-react';
import { DataStore } from '@/data/store';

gsap.registerPlugin(ScrollTrigger);

const cultureIcons: Record<string, React.ElementType> = {
  Target,
  Eye,
  Heart,
};

const AboutPage: React.FC = () => {
  const pageRef = useRef<HTMLDivElement>(null);
  const companyInfo = DataStore.getCompanyInfo();

  useEffect(() => {
    const page = pageRef.current;
    if (!page) return;

    // Page title animation
    gsap.fromTo(
      '.page-title',
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.page-title',
          start: 'top 85%',
          once: true,
        },
      }
    );

    // Content sections animation
    gsap.fromTo(
      '.about-section',
      { opacity: 0, y: 50 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.2,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.about-section',
          start: 'top 80%',
          once: true,
        },
      }
    );

    // Timeline animation
    gsap.fromTo(
      '.timeline-item',
      { opacity: 0, x: -30 },
      {
        opacity: 1,
        x: 0,
        duration: 0.6,
        stagger: 0.15,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.timeline',
          start: 'top 80%',
          once: true,
        },
      }
    );

    // Honors animation
    gsap.fromTo(
      '.honor-card',
      { opacity: 0, scale: 0.9 },
      {
        opacity: 1,
        scale: 1,
        duration: 0.5,
        stagger: 0.1,
        ease: 'back.out(1.7)',
        scrollTrigger: {
          trigger: '.honors-grid',
          start: 'top 80%',
          once: true,
        },
      }
    );

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
    <div ref={pageRef} className="min-h-screen pt-20">
      {/* Page Header */}
      <section className="relative py-20 lg:py-32 bg-ocean-deep overflow-hidden">
        {/* Background Pattern */}
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
          <span className="page-title inline-block px-4 py-2 rounded-full bg-white/10 text-ocean-cyan text-sm font-medium mb-4 border border-white/20">
            关于我们
          </span>
          <h1 className="page-title text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            探索海洋的无限可能
          </h1>
          <p className="page-title text-white/70 text-lg max-w-2xl mx-auto">
            十年专注海洋生物科技，致力于为客户提供安全、健康、优质的海洋产品
          </p>
        </div>
      </section>

      {/* Company Introduction */}
      <section id="company" className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="about-section grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-ocean-deep mb-6">
                公司简介
              </h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  {companyInfo.description}
                </p>
                <p>
                  公司拥有一支高素质的研发团队，其中包括多名博士、硕士，在海洋生物科技领域具有深厚的技术积累。我们建有现代化的研发中心，配备先进的研发设备和检测仪器，为产品创新提供强有力的技术支撑。
                </p>
                <p>
                  我们始终坚持"质量第一、客户至上"的经营理念，从原料采购到成品出厂，每一个环节都严格把控，确保产品质量稳定可靠。公司产品远销海内外，深受客户好评。
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?w=800&q=80"
                  alt="公司环境"
                  className="w-full h-[400px] lg:h-[500px] object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-ocean-blue text-white rounded-2xl p-6">
                <div className="text-4xl font-bold mb-1">2014</div>
                <div className="text-sm text-white/80">成立年份</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Corporate Culture */}
      <section id="culture" className="py-20 lg:py-32 bg-ocean-foam">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="about-section text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-ocean-deep mb-4">
              企业文化
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              我们的使命、愿景和价值观指引着每一位蓝粮人不断前行
            </p>
          </div>

          <div className="about-section grid md:grid-cols-3 gap-8">
            {companyInfo.culture.map((item) => {
              const IconComponent = cultureIcons[item.icon] || Target;
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-8 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-2"
                >
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-ocean-blue to-ocean-cyan flex items-center justify-center mb-6">
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-ocean-deep mb-4">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Development History */}
      <section id="history" className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="about-section text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-ocean-deep mb-4">
              发展历程
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              十年砥砺前行，见证蓝粮海洋的成长与蜕变
            </p>
          </div>

          <div className="timeline relative">
            {/* Timeline Line */}
            <div className="absolute left-4 lg:left-1/2 top-0 bottom-0 w-px bg-ocean-blue/20 lg:-translate-x-1/2" />

            <div className="space-y-12">
              {companyInfo.history.map((item, index) => (
                <div
                  key={index}
                  className={`timeline-item relative flex items-start gap-8 ${
                    index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'
                  }`}
                >
                  {/* Timeline Dot */}
                  <div className="absolute left-4 lg:left-1/2 w-4 h-4 rounded-full bg-ocean-blue border-4 border-white shadow-lg lg:-translate-x-1/2 z-10" />

                  {/* Content */}
                  <div className="ml-12 lg:ml-0 lg:w-1/2 lg:px-12">
                    <div className="bg-white rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-shadow">
                      <div className="flex items-center gap-3 mb-3">
                        <Calendar className="w-5 h-5 text-ocean-blue" />
                        <span className="text-2xl font-bold text-ocean-blue">{item.year}</span>
                      </div>
                      <h3 className="text-lg font-bold text-ocean-deep mb-2">{item.title}</h3>
                      <p className="text-gray-600 text-sm">{item.description}</p>
                    </div>
                  </div>

                  {/* Empty space for alternating layout */}
                  <div className="hidden lg:block lg:w-1/2" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Honors */}
      <section id="honors" className="py-20 lg:py-32 bg-ocean-foam">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="about-section text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-ocean-deep mb-4">
              资质荣誉
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              荣誉见证实力，品质铸就品牌
            </p>
          </div>

          <div className="honors-grid grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {companyInfo.honors.map((honor) => (
              <div
                key={honor.id}
                className="honor-card bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-2 group"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={honor.image}
                    alt={honor.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ocean-deep/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <Award className="w-6 h-6 text-ocean-cyan mb-2" />
                    <p className="text-white text-sm">{honor.issuer}</p>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-ocean-deep mb-1">{honor.title}</h3>
                  <p className="text-gray-500 text-sm">{honor.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
