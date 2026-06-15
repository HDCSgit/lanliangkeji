import React, { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import HeroSection from '@/sections/HeroSection';
import AboutSection from '@/sections/AboutSection';
import ServicesSection from '@/sections/ServicesSection';
import WhyUsSection from '@/sections/WhyUsSection';
import ProductsSection from '@/sections/ProductsSection';
import RDSection from '@/sections/RDSection';
import PartnersSection from '@/sections/PartnersSection';
import NewsSection from '@/sections/NewsSection';
import ContactSection from '@/sections/ContactSection';

gsap.registerPlugin(ScrollTrigger);

const HomePage: React.FC = () => {
  useEffect(() => {
    // Refresh ScrollTrigger on page load
    ScrollTrigger.refresh();

    return () => {
      // Only kill triggers specific to this page
      // 注意: trigger.vars.trigger 可能是 string/Window/Element, 仅当是 Element 且带 closest 时调用
      ScrollTrigger.getAll().forEach((trigger) => {
        try {
          const t = trigger.vars.trigger as any;
          if (t && typeof t === 'object' && typeof t.closest === 'function' && t.closest('main')) {
            trigger.kill();
          }
        } catch {
          // 忽略清理错误,避免 unmount 阶段 throw 触发 ErrorBoundary 重新渲染整页
        }
      });
    };
  }, []);

  return (
    <main className="relative scroll-smooth">
      <HeroSection />
      <AboutSection />
      <ServicesSection />
      <WhyUsSection />
      <ProductsSection />
      <RDSection />
      <PartnersSection />
      <NewsSection />
      <ContactSection />
    </main>
  );
};

export default HomePage;
