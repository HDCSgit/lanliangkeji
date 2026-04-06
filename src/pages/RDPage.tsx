import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FlaskConical, Microscope, FileText, Thermometer, Droplets, Filter, CircleDot } from 'lucide-react';
import { DataStore } from '@/data/store';

gsap.registerPlugin(ScrollTrigger);

const techIcons: Record<string, React.ElementType> = {
  Thermometer,
  Droplets,
  Filter,
  CircleDot,
  FlaskConical,
  Microscope,
};

const RDPage: React.FC = () => {
  const pageRef = useRef<HTMLDivElement>(null);
  const rdInfo = DataStore.getRDInfo();
  const stats = DataStore.getStats();

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
      '.rd-section',
      { opacity: 0, y: 50 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.2,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.rd-section',
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
            研发实力
          </span>
          <h1 className="page-header text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            科技创新 引领未来
          </h1>
          <p className="page-header text-white/70 text-lg max-w-2xl mx-auto">
            拥有强大的研发实力，建有现代化的研发中心，配备先进的研发设备和检测仪器
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 lg:py-24 bg-ocean-foam">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rd-section grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div
                key={stat.id}
                className="bg-white rounded-2xl p-6 text-center shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1"
              >
                <div className="text-4xl lg:text-5xl font-bold text-ocean-blue mb-2">
                  {stat.value}{stat.suffix}
                </div>
                <div className="text-ocean-deep font-medium mb-1">{stat.name}</div>
                <div className="text-gray-500 text-sm">{stat.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Introduction */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rd-section grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-ocean-deep mb-6">
                研发中心简介
              </h2>
              <p className="text-gray-600 leading-relaxed mb-6">
                {rdInfo.description}
              </p>
              <p className="text-gray-600 leading-relaxed">
                我们每年投入大量资金用于新产品研发和技术升级，与国内外知名科研机构建立紧密合作关系，
                不断推动海洋生物科技的创新发展。目前，公司已获得20多项国家专利，多项技术达到国际先进水平。
              </p>
            </div>
            <div className="relative">
              <div className="rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?w=800&q=80"
                  alt="研发中心"
                  className="w-full h-[400px] object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 bg-ocean-blue text-white rounded-2xl p-6">
                <div className="text-4xl font-bold mb-1">5000㎡</div>
                <div className="text-sm text-white/80">研发中心面积</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technologies */}
      <section className="py-16 lg:py-24 bg-ocean-foam">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rd-section text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-ocean-deep mb-4">
              核心技术
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              掌握多项核心提取技术，确保产品的高纯度和高活性
            </p>
          </div>

          <div className="rd-section grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {rdInfo.technologies.map((tech) => {
              const IconComponent = techIcons[tech.icon] || FlaskConical;
              return (
                <div
                  key={tech.id}
                  className="bg-white rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-2 group"
                >
                  <div className="w-14 h-14 rounded-xl bg-ocean-blue/10 flex items-center justify-center mb-4 group-hover:bg-ocean-blue group-hover:scale-110 transition-all duration-300">
                    <IconComponent className="w-7 h-7 text-ocean-blue group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-lg font-bold text-ocean-deep mb-2">{tech.name}</h3>
                  <p className="text-gray-600 text-sm">{tech.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Equipment */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rd-section text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-ocean-deep mb-4">
              先进设备
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              配备国际先进的研发设备和检测仪器，为产品质量提供有力保障
            </p>
          </div>

          <div className="rd-section grid md:grid-cols-3 gap-8">
            {rdInfo.equipment.map((eq) => (
              <div
                key={eq.id}
                className="bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300"
              >
                <div className="h-48 overflow-hidden">
                  <img
                    src={eq.image}
                    alt={eq.name}
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-ocean-deep mb-2">{eq.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{eq.description}</p>
                  <div className="space-y-1">
                    {Object.entries(eq.specs).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-gray-500">{key}:</span>
                        <span className="text-ocean-deep font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Patents */}
      <section className="py-16 lg:py-24 bg-ocean-deep">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rd-section text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              专利技术
            </h2>
            <p className="text-white/70 max-w-2xl mx-auto">
              拥有多项国家发明专利，技术创新能力获得国家级认可
            </p>
          </div>

          <div className="rd-section grid md:grid-cols-2 gap-6">
            {rdInfo.patents.map((patent) => (
              <div
                key={patent.id}
                className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-ocean-cyan/30 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-ocean-cyan/20 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6 text-ocean-cyan" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-ocean-cyan/20 text-ocean-cyan text-xs rounded-full">
                        {patent.type}
                      </span>
                      <span className="text-white/50 text-sm">{patent.date}</span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">{patent.name}</h3>
                    <p className="text-ocean-cyan text-sm mb-2">{patent.number}</p>
                    <p className="text-white/60 text-sm">{patent.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partners */}
      <section className="py-16 lg:py-24 bg-ocean-foam">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rd-section text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-ocean-deep mb-4">
              合作机构
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              与国内外知名科研机构建立紧密合作关系
            </p>
          </div>

          <div className="rd-section grid sm:grid-cols-3 gap-6">
            {rdInfo.partners.map((partner) => (
              <div
                key={partner.id}
                className="bg-white rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 text-center"
              >
                <img
                  src={partner.logo}
                  alt={partner.name}
                  className="w-20 h-20 object-contain mx-auto mb-4 grayscale hover:grayscale-0 transition-all"
                />
                <span className="inline-block px-3 py-1 bg-ocean-blue/10 text-ocean-blue text-xs rounded-full mb-2">
                  {partner.type}
                </span>
                <h3 className="font-bold text-ocean-deep mb-2">{partner.name}</h3>
                <p className="text-gray-600 text-sm">{partner.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default RDPage;
