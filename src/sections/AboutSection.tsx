import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, Target, Eye, Heart } from 'lucide-react';
import { DataStore } from '@/data/store';

gsap.registerPlugin(ScrollTrigger);

const AboutSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const companyInfo = DataStore.getCompanyInfo();

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const triggers: ScrollTrigger[] = [];

    // Title animation
    gsap.fromTo(
      '.about-title',
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.about-title',
          start: 'top 85%',
          once: true,
        },
      }
    );

    // Content animation
    gsap.fromTo(
      '.about-content',
      { opacity: 0, x: -50 },
      {
        opacity: 1,
        x: 0,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.about-content',
          start: 'top 80%',
          once: true,
        },
      }
    );

    // Image animation
    gsap.fromTo(
      '.about-image',
      { opacity: 0, x: 50, scale: 1.1 },
      {
        opacity: 1,
        x: 0,
        scale: 1,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.about-image',
          start: 'top 80%',
          once: true,
        },
      }
    );

    // Culture cards animation
    gsap.fromTo(
      '.culture-card',
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.15,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.culture-cards',
          start: 'top 85%',
          once: true,
        },
      }
    );

    return () => {
      triggers.forEach((trigger) => trigger.kill());
    };
  }, []);

  const cultureIcons = {
    Target,
    Eye,
    Heart,
  };

  return (
    <section
      ref={sectionRef}
      id="about"
      className="relative py-24 lg:py-32 overflow-hidden"
    >
      {/* Background Decoration */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-ocean-blue/5 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-ocean-cyan/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="about-title inline-block px-4 py-2 rounded-full bg-ocean-blue/10 text-ocean-blue text-sm font-medium mb-4">
            关于我们
          </span>
          <h2 className="about-title text-3xl sm:text-4xl lg:text-5xl font-bold text-ocean-deep mb-4">
            专注于海洋生物科技研发
          </h2>
          <p className="about-title text-gray-600 max-w-2xl mx-auto">
            十年深耕，致力于探索海洋的无限可能
          </p>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center mb-20">
          {/* Left - Text Content */}
          <div className="about-content space-y-6">
            <h3 className="text-2xl lg:text-3xl font-bold text-ocean-deep">
              {companyInfo.slogan}
            </h3>
            <p className="text-gray-600 leading-relaxed text-lg">
              {companyInfo.description}
            </p>
            <p className="text-gray-600 leading-relaxed">
              我们拥有先进的生产设备和完善的质量管理体系，从原料采购到成品出厂，
              每一个环节都严格把控，确保产品质量稳定可靠。公司产品远销海内外，
              深受客户好评。
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <Link
                to="/about"
                className="group inline-flex items-center gap-2 px-6 py-3 bg-ocean-blue text-white rounded-full font-medium hover:bg-ocean-deep transition-colors"
              >
                了解更多
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 border-2 border-ocean-blue text-ocean-blue rounded-full font-medium hover:bg-ocean-blue hover:text-white transition-colors"
              >
                联系我们
              </Link>
            </div>
          </div>

          {/* Right - Image */}
          <div className="about-image relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?w=800&q=80"
                alt="实验室"
                className="w-full h-[400px] lg:h-[500px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ocean-deep/40 to-transparent" />
            </div>

            {/* Floating Card */}
            <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-6 max-w-xs">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-ocean-blue/10 flex items-center justify-center">
                  <Target className="w-6 h-6 text-ocean-blue" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-ocean-deep">10+</div>
                  <div className="text-sm text-gray-500">年行业经验</div>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                深耕海洋生物科技领域，积累了丰富的行业经验
              </p>
            </div>

            {/* Decorative Elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-ocean-cyan/20 rounded-full blur-2xl" />
            <div className="absolute top-1/2 -right-8 w-16 h-16 bg-ocean-blue/20 rounded-full blur-xl" />
          </div>
        </div>

        {/* Culture Cards */}
        <div className="culture-cards grid md:grid-cols-3 gap-6">
          {companyInfo.culture.map((item) => {
            const IconComponent = cultureIcons[item.icon as keyof typeof cultureIcons] || Target;
            return (
              <div
                key={item.id}
                className="culture-card group bg-white rounded-2xl p-8 shadow-card hover:shadow-card-hover transition-all duration-500 hover:-translate-y-2"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-ocean-blue to-ocean-cyan flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <IconComponent className="w-7 h-7 text-white" />
                </div>
                <h4 className="text-xl font-bold text-ocean-deep mb-3">{item.title}</h4>
                <p className="text-gray-600 leading-relaxed">{item.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
