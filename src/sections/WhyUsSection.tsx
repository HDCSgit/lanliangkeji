import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Check, Settings, Shield, Users, Headphones } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const features = [
  {
    icon: Settings,
    title: '先进的生产设备',
    description: '引进国际先进的生产设备，实现自动化、智能化生产，确保产品质量稳定。',
  },
  {
    icon: Shield,
    title: '完善的质量管理体系',
    description: '通过ISO22000认证，从原料到成品全程质量管控，确保产品安全。',
  },
  {
    icon: Users,
    title: '专业的研发团队',
    description: '拥有多名博士、硕士组成的专业研发团队，持续创新，引领行业发展。',
  },
  {
    icon: Headphones,
    title: '优质的售后服务',
    description: '提供全方位的技术支持和售后服务，让客户无后顾之忧。',
  },
];

const WhyUsSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    // Image reveal animation
    gsap.fromTo(
      '.whyus-image',
      { opacity: 0, scale: 1.2 },
      {
        opacity: 1,
        scale: 1,
        duration: 1.2,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '.whyus-image',
          start: 'top 80%',
          once: true,
        },
      }
    );

    // Title animation
    gsap.fromTo(
      '.whyus-title',
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.whyus-title',
          start: 'top 85%',
          once: true,
        },
      }
    );

    // Feature items animation
    gsap.fromTo(
      '.feature-item',
      { opacity: 0, x: 50 },
      {
        opacity: 1,
        x: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.features-list',
          start: 'top 80%',
          once: true,
        },
      }
    );
  }, []);

  return (
    <section
      ref={sectionRef}
      id="whyus"
      className="relative py-24 lg:py-32 overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-ocean-deep">
        <div className="absolute inset-0 bg-gradient-to-br from-ocean-deep via-ocean-blue/20 to-ocean-deep" />
      </div>

      {/* Particle Effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/5 animate-float"
            style={{
              width: `${Math.random() * 8 + 2}px`,
              height: `${Math.random() * 8 + 2}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${Math.random() * 3 + 4}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left - Image */}
          <div className="whyus-image relative order-2 lg:order-1">
            <div className="relative rounded-3xl overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1581093450021-4a7360e9a6b5?w=800&q=80"
                alt="实验室"
                className="w-full h-[400px] lg:h-[600px] object-cover"
              />
              {/* Glass Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-ocean-deep/60 via-transparent to-ocean-deep/30" />
            </div>

            {/* Floating Stats Card */}
            <div className="absolute -bottom-6 -right-6 lg:right-6 bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-1">99%</div>
                  <div className="text-xs text-white/70">产品合格率</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-1">24h</div>
                  <div className="text-xs text-white/70">快速响应</div>
                </div>
              </div>
            </div>

            {/* Decorative */}
            <div className="absolute -top-4 -left-4 w-24 h-24 border-2 border-ocean-cyan/30 rounded-2xl" />
          </div>

          {/* Right - Content */}
          <div className="order-1 lg:order-2">
            <span className="whyus-title inline-block px-4 py-2 rounded-full bg-white/10 text-ocean-cyan text-sm font-medium mb-4 border border-white/20">
              为什么选择我们
            </span>
            <h2 className="whyus-title text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
              十年专注
              <br />
              <span className="text-ocean-cyan">品质保证</span>
            </h2>
            <p className="whyus-title text-white/70 text-lg mb-10 leading-relaxed">
              我们始终坚持"质量第一、客户至上"的经营理念，以专业的技术、优质的产品、完善的服务，赢得客户的信赖与支持。
            </p>

            {/* Features List */}
            <div className="features-list space-y-4">
              {features.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <div
                    key={index}
                    className="feature-item group flex items-start gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-ocean-cyan/30 transition-all duration-300"
                  >
                    <div className="w-12 h-12 rounded-xl bg-ocean-cyan/20 flex items-center justify-center flex-shrink-0 group-hover:bg-ocean-cyan/30 transition-colors">
                      <IconComponent className="w-6 h-6 text-ocean-cyan" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-1 group-hover:text-ocean-cyan transition-colors">
                        {feature.title}
                      </h4>
                      <p className="text-white/60 text-sm leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                    <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                      <Check className="w-5 h-5 text-ocean-cyan" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyUsSection;
