import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DataStore } from '@/data/store';

gsap.registerPlugin(ScrollTrigger);

const PartnersSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const partners = DataStore.getPartners().filter((p) => p.isActive).sort((a, b) => a.order - b.order);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    // Title animation
    gsap.fromTo(
      '.partners-title',
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.partners-title',
          start: 'top 85%',
          once: true,
        },
      }
    );

    // Grid lines animation
    gsap.fromTo(
      '.partner-item',
      { opacity: 0, scale: 0.8 },
      {
        opacity: 1,
        scale: 1,
        duration: 0.5,
        stagger: {
          each: 0.05,
          from: 'random',
        },
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '.partners-grid',
          start: 'top 80%',
          once: true,
        },
      }
    );
  }, []);

  return (
    <section
      ref={sectionRef}
      id="partners"
      className="relative py-24 lg:py-32 overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-white to-ocean-foam" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="partners-title inline-block px-4 py-2 rounded-full bg-ocean-blue/10 text-ocean-blue text-sm font-medium mb-4">
            合作伙伴
          </span>
          <h2 className="partners-title text-3xl sm:text-4xl lg:text-5xl font-bold text-ocean-deep mb-4">
            携手共创未来
          </h2>
          <p className="partners-title text-gray-600 max-w-2xl mx-auto">
            与国内外知名科研机构和企业建立战略合作关系，共同推动海洋生物科技发展
          </p>
        </div>

        {/* Partners Grid */}
        <div className="partners-grid relative">
          {/* Grid Lines */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Vertical lines */}
            {[1, 2, 3].map((i) => (
              <div
                key={`v-${i}`}
                className="absolute top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-ocean-blue/20 to-transparent"
                style={{ left: `${i * 25}%` }}
              />
            ))}
            {/* Horizontal lines */}
            {[1].map((i) => (
              <div
                key={`h-${i}`}
                className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-ocean-blue/20 to-transparent"
                style={{ top: `${i * 50}%` }}
              />
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-0">
            {partners.map((partner) => (
              <div
                key={partner.id}
                className="partner-item group relative p-8 flex items-center justify-center aspect-[3/2] hover:bg-white/50 transition-colors"
              >
                <div className="relative w-full h-full flex items-center justify-center">
                  <img
                    src={partner.logo}
                    alt={partner.name}
                    className="max-w-full max-h-full object-contain grayscale group-hover:grayscale-0 opacity-60 group-hover:opacity-100 transition-all duration-500"
                  />
                </div>

                {/* Hover Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-4 py-2 bg-ocean-deep text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                  {partner.name}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-ocean-deep" />
                </div>

                {/* Corner Hover Effect */}
                <div className="absolute inset-0 border-2 border-ocean-blue/0 group-hover:border-ocean-blue/20 transition-colors pointer-events-none" />
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Text */}
        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm">
            期待与更多优秀企业建立合作关系，共同开拓海洋生物科技市场
          </p>
        </div>
      </div>
    </section>
  );
};

export default PartnersSection;
